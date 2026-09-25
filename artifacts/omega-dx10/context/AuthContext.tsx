import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const AUTH_TOKEN_KEY = 'omega_dx10_auth_token';

export interface AuthUser {
  id: number;
  username: string;
  email?: string | null;
  isAdmin: boolean;
  role: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthLoaded: boolean;
  serverOffline: boolean;
  retryAuth: () => void;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  getApiUrl: () => string;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthLoaded: false,
  serverOffline: false,
  retryAuth: () => {},
  login: async () => {},
  register: async () => {},
  changePassword: async () => {},
  logout: async () => {},
  getApiUrl: () => '/api',
});


export function useAuth() {
  return useContext(AuthContext);
}

function buildApiUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (env) return env;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  if (__DEV__) {
    const hostUri = (Constants.expoConfig?.hostUri ?? '') as string;
    const host = hostUri.split(':')[0] ?? '';
    if (host) return `https://${host}/api`;
  }
  return '/api';
}

type ApiResponse = {
  error?: string;
  [key: string]: unknown;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body.trim()) return {} as T;

  try {
    return JSON.parse(body) as T;
  } catch {
    const contentType = response.headers.get('content-type') ?? '';
    const isHtml = /html/i.test(contentType) || /^\s*</.test(body);

    if (isHtml) {
      throw new Error(
        `O servidor da API retornou uma página HTML em vez de JSON (HTTP ${response.status}). ` +
          'Verifique se EXPO_PUBLIC_API_URL aponta para o backend do OMEGA DX10.',
      );
    }

    throw new Error(`O servidor da API retornou uma resposta inválida (HTTP ${response.status}).`);
  }
}

const AUTH_TIMEOUT_MS = 15000;
const AUTO_RETRY_INTERVAL_MS = 8000;

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const apiUrl = useRef(buildApiUrl());
  const autoRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const tokenRef = useRef<string | null>(null);
  const IDLE_TIMEOUT_MS = 20 * 60 * 1000;

  useEffect(() => { tokenRef.current = token; }, [token]);

  const expireIdleSession = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    try {
      await fetchWithTimeout(
        `${apiUrl.current}/auth/logout`,
        { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` } },
        5000,
      );
    } catch {}
  }, []);

  useEffect(() => {
    if (!token) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const armIdleTimer = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => { void expireIdleSession(); }, IDLE_TIMEOUT_MS);
    };

    armIdleTimer();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;
      events.forEach((event) => window.addEventListener(event, armIdleTimer, { passive: true }));
      const onVisibility = () => {
        if (document.visibilityState === 'visible') {
          if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) void expireIdleSession();
          else armIdleTimer();
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        events.forEach((event) => window.removeEventListener(event, armIdleTimer));
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) void expireIdleSession();
        else armIdleTimer();
      }
    });
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      subscription.remove();
    };
  }, [token, expireIdleSession]);

  // A conta só pode permanecer aberta em uma tela/dispositivo.
  // O backend já invalida a sessão anterior ao criar um novo sessionId; este
  // verificador fecha rapidamente a tela antiga sem esperar outra ação do jogador.
  useEffect(() => {
    if (!token) return;
    let stopped = false;
    const verifySession = async () => {
      const currentToken = tokenRef.current;
      if (!currentToken || stopped) return;
      try {
        const response = await fetchWithTimeout(
          `${apiUrl.current}/auth/me`,
          { method: 'GET', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` } },
          8000,
        );
        if ((response.status === 401 || response.status === 403) && !stopped) {
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          tokenRef.current = null;
          setToken(null);
          setUser(null);
        }
      } catch {
        // Falha de rede não encerra a conta: só uma rejeição real do servidor.
      }
    };
    void verifySession();
    const interval = setInterval(() => { void verifySession(); }, 5000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (autoRetryRef.current) clearTimeout(autoRetryRef.current);

    const scheduleRetry = () => {
      setServerOffline(true);
      setIsAuthLoaded(true);
      autoRetryRef.current = setTimeout(() => {
        setRetryCount((c) => c + 1);
      }, AUTO_RETRY_INTERVAL_MS);
    };

    (async () => {
      setIsAuthLoaded(false);
      setServerOffline(false);
      try {
        const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (stored) {
          const me = await fetchWithTimeout(
            `${apiUrl.current}/auth/me`,
            { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored}` } },
            AUTH_TIMEOUT_MS,
          );
          if (me.ok) {
            const data = await readApiResponse<AuthUser>(me);
            setToken(stored);
            setUser({
              id: data.id,
              username: data.username,
              email: data.email ?? null,
              isAdmin: data.isAdmin ?? false,
              role: data.role ?? 'user',
              createdAt: data.createdAt,
            });
          } else if (me.status === 401 || me.status === 403) {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            setToken(null);
            setUser(null);
          } else {
            // A temporary 5xx/proxy response must not be treated as a bad
            // session. Keeping the token allows the account to recover after
            // a hard refresh when the API becomes available again.
            scheduleRetry();
            return;
          }
        }
      } catch (err: any) {
        scheduleRetry();
        return;
      }
      setIsAuthLoaded(true);
    })();

    return () => {
      if (autoRetryRef.current) clearTimeout(autoRetryRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  function retryAuth() {
    if (autoRetryRef.current) clearTimeout(autoRetryRef.current);
    setRetryCount((c) => c + 1);
  }

  function apiFetch(path: string, tok?: string, body?: object) {
    return fetch(`${apiUrl.current}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function login(usernameOrEmail: string, password: string) {
    const res = await apiFetch('/auth/login', undefined, { username: usernameOrEmail, password });
    const data = await readApiResponse<{ error?: string; token: string; user: AuthUser }>(res);
    if (!res.ok) throw new Error(data.error ?? 'Erro ao entrar');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email ?? null,
      isAdmin: data.user.isAdmin ?? false,
      role: data.user.role ?? 'user',
      createdAt: data.user.createdAt,
    });
  }

  async function register(username: string, password: string, email?: string) {
    const res = await apiFetch('/auth/register', undefined, { username, password, email: email || undefined });
    const data = await readApiResponse<{ error?: string; token: string; user: AuthUser }>(res);
    if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conta');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email ?? null,
      isAdmin: data.user.isAdmin ?? false,
      role: data.user.role ?? 'user',
      createdAt: data.user.createdAt,
    });
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para alterar a senha.');
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${apiUrl.current}/auth/change-password`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        AUTH_TIMEOUT_MS,
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('O servidor demorou para responder. Tente novamente.');
      throw new Error('Não foi possível conectar ao servidor para alterar a senha.');
    }
    const data = await readApiResponse<{ error?: string; token?: string; user?: AuthUser }>(res);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(data.error ?? 'Sessão inválida. Entre novamente e tente alterar a senha.');
      }
      throw new Error(data.error ?? 'Erro ao alterar a senha');
    }
    if (!data.token || !data.user) throw new Error('Senha alterada, mas o servidor não renovou a sessão.');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email ?? null,
      isAdmin: data.user.isAdmin ?? false,
      role: data.user.role ?? 'user',
      createdAt: data.user.createdAt,
    });
  }

  async function logout() {
    const currentToken = token;
    // Clear the browser/app session first so logout succeeds even if the API is offline.
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    if (currentToken) {
      try {
        await fetchWithTimeout(
          `${apiUrl.current}/auth/logout`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentToken}`,
            },
          },
          5000,
        );
      } catch {
        // Local logout is already complete.
      }
    }
  }

  const getApiUrl = useCallback(() => apiUrl.current, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthLoaded, serverOffline, retryAuth, login, register, changePassword, logout, getApiUrl }}>
      {children}
    </AuthContext.Provider>
  );
}
