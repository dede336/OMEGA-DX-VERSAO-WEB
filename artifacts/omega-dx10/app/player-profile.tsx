import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import HomeScreen, { PublicHomeProfile } from './(tabs)/index';

export default function PlayerProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { getApiUrl } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicHomeProfile | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setProfile(null); setError('');
    fetch(`${getApiUrl()}/players/${encodeURIComponent(username ?? '')}`, { signal: abort.signal })
      .then(async (res) => { if (!res.ok) throw new Error('Não foi possível carregar o jogador.'); return res.json(); })
      .then((data) => { if (!data.home) throw new Error('Atualize o servidor para carregar os perfis.'); setProfile({ ...data.home, playerName: data.home.playerName || data.tamerName || data.username, username: data.username }); })
      .catch((e) => { if (!abort.signal.aborted) setError(e.message ?? 'Erro de conexão.'); });
    return () => abort.abort();
  }, [username, getApiUrl, retry]);
  return <ImageBackground source={require('../assets/images/tela de fundo celular.gif')} resizeMode="cover" style={{ flex: 1, backgroundColor: '#07182c' }}>
    <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12 }}>
      <TouchableOpacity accessibilityLabel="Voltar" onPress={() => router.back()}><Text style={{ color: '#fff', fontSize: 16 }}>‹ Voltar · @{username}</Text></TouchableOpacity>
    </View>
    {profile ? <HomeScreen publicProfile={profile} /> : error ? <View style={{ padding: 24, gap: 16 }}><Text style={{ color: '#fff' }}>{error}</Text><TouchableOpacity onPress={() => setRetry((v) => v + 1)}><Text style={{ color: '#60a5fa' }}>Tentar novamente</Text></TouchableOpacity></View> : <ActivityIndicator color="#fff" />}
  </ImageBackground>;
}
