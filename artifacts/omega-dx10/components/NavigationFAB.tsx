import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Image, Pressable, Platform, FlatList, Alert, TextInput,
  ActivityIndicator, KeyboardAvoidingView,
  Animated, PanResponder, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { pixelStyle } from '@/constants/pixelStyle';
import { useLanguage } from '@/context/LanguageContext';

const FAB_IMG = require('../assets/images/menu-fab.webp');
const ICON_HOME = require('../assets/images/home-icon.webp');
const ICON_BANCO = require('../assets/images/banco-icon.webp');
const ICON_DIGIBANK = require('../assets/images/digibank-icon.webp');
const ICON_MOCHILA = require('../assets/images/mochila-icon.webp');
const ICON_CRAFT = require('../assets/images/craft-icon.webp');
const ICON_MUNDO = require('../assets/images/map-icon.webp');
const ICON_MAIL = require('../assets/images/mailbox-icon.webp');
const ICON_RANKING = require('../assets/images/trophy-icon.webp');
const ICON_DIGIFARM = require('../assets/images/digifarm-icon.webp');
const ICON_AMIGOS = require('../assets/images/amigos-icon.webp');
const ICON_ADMIN = require('../assets/images/admin_icon.webp');
const ICON_CHAT = require('../assets/images/chat-icon.webp');
const ICON_LOGOUT = require('../assets/images/logout-icon.webp');

const FAB_SIZE = 47;
const IMG_SIZE = 38;
const EDGE_GAP = 14;
const TAP_SLOP = 6;

function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [visible]);

  async function submit() {
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmation) {
      setError('Preencha a senha atual e os dois campos da nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('A confirmação da nova senha não confere.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.passwordOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.passwordBackdrop} onPress={onClose} />
        <View
          style={[
            styles.passwordSheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 20,
            },
            pixelStyle,
          ]}
        >
          <View style={styles.passwordHeader}>
            <View style={styles.passwordIcon}>
              <Feather name="key" size={22} color="#60a5fa" />
            </View>
            <View style={styles.passwordHeaderCopy}>
              <Text style={[styles.passwordTitle, { color: colors.foreground }]}>Alterar senha</Text>
              <Text style={[styles.passwordSubtitle, { color: colors.mutedForeground }]}>
                Confirme a senha atual para criar uma nova.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.passwordClose} activeOpacity={0.7}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.passwordInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Senha atual"
            placeholderTextColor={colors.mutedForeground}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.passwordInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Nova senha"
            placeholderTextColor={colors.mutedForeground}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.passwordInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Confirmar nova senha"
            placeholderTextColor={colors.mutedForeground}
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!!error && (
            <View style={styles.passwordMessageError}>
              <Feather name="alert-circle" size={14} color="#f87171" />
              <Text style={styles.passwordMessageErrorText}>{error}</Text>
            </View>
          )}
          {!!success && (
            <View style={styles.passwordMessageSuccess}>
              <Feather name="check-circle" size={14} color="#4ade80" />
              <Text style={styles.passwordMessageSuccessText}>{success}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.passwordSubmit, loading && { opacity: 0.65 }]}
            onPress={submit}
            disabled={loading || !!success}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.passwordSubmitText}>Salvar nova senha</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.passwordCancel} activeOpacity={0.7}>
            <Text style={[styles.passwordCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface NavItem {
  labelKey: string;
  route: string;
  image: any;
  color: string;
  adminOnly?: boolean;
  minLevel?: number;
  isChat?: boolean;
  isMail?: boolean;
  bigIcon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', route: '/(tabs)/', image: ICON_HOME, color: '#3b82f6' },
  { labelKey: 'nav.banco', route: '/(tabs)/banco', image: ICON_BANCO, color: '#8b5cf6' },
  { labelKey: 'nav.digibank', route: '/(tabs)/collection', image: ICON_DIGIBANK, color: '#06b6d4' },
  { labelKey: 'nav.mochila', route: '/(tabs)/mochila', image: ICON_MOCHILA, color: '#f59e0b' },
  { labelKey: 'nav.craft', route: '/(tabs)/craft', image: ICON_CRAFT, color: '#ef4444' },
  { labelKey: 'nav.world', route: '/(tabs)/map', image: ICON_MUNDO, color: '#22c55e' },
  { labelKey: 'nav.mail', route: '/(tabs)/correios', image: ICON_MAIL, color: '#ec4899', isMail: true },
  { labelKey: 'nav.ranking', route: '/(tabs)/ranking', image: ICON_RANKING, color: '#f97316' },
  { labelKey: 'nav.digifarm', route: '/(tabs)/digifarm', image: ICON_DIGIFARM, color: '#84cc16' },
  { labelKey: 'nav.friends', route: '/(tabs)/amigos', image: ICON_AMIGOS, color: '#14b8a6', bigIcon: true },
  { labelKey: 'nav.chat', route: '/(tabs)/chat', image: ICON_CHAT, color: '#3b82f6', isChat: true },
  { labelKey: 'nav.admin', route: '/(tabs)/admin', image: ICON_ADMIN, color: '#6b7280', adminOnly: true },
];

export default function NavigationFAB() {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [fabImageFailed, setFabImageFailed] = useState(false);

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const stageWidth = Platform.OS === 'web' ? Math.min(W, 430) : W;

  const {
    unreadMailCount,
    isAdmin,
    tamerLevel,
    resetGame,
  } = useGame();

  const { logout, user } = useAuth();
  const { totalUnread: unreadChat } = useSocket();
  const { t } = useLanguage();

  const canShowAdmin =
    (user?.isAdmin ?? isAdmin) ||
    user?.role === 'digimon_creator';

  const wasDragged = useRef(false);

  const boundsRef = useRef({
    W,
    H,
    topClamp: 0,
    botClamp: 0,
  });

  useEffect(() => {
    boundsRef.current = {
      W: stageWidth,
      H,
      topClamp: insets.top + 8,
      botClamp: insets.bottom + 60,
    };
    const maxY = H - FAB_SIZE - (insets.bottom + 60);
    const nextX = Math.max(EDGE_GAP, Math.min(stageWidth - FAB_SIZE - EDGE_GAP, fabPos.current.x));
    const nextY = Math.max(insets.top + 8, Math.min(maxY, fabPos.current.y));
    fabPos.current = { x: nextX, y: nextY };
    animPos.setValue({ x: nextX, y: nextY });
  }, [stageWidth, H, insets.top, insets.bottom]);

  const initialX = stageWidth - FAB_SIZE - EDGE_GAP;
  const initialY =
    H - FAB_SIZE - (insets.bottom + 80);

  const fabPos = useRef({
    x: initialX,
    y: initialY,
  });

  const animPos = useRef(
    new Animated.ValueXY({
      x: initialX,
      y: initialY,
    })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > TAP_SLOP ||
        Math.abs(gs.dy) > TAP_SLOP,

      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > TAP_SLOP ||
        Math.abs(gs.dy) > TAP_SLOP,

      onPanResponderGrant: () => {
        wasDragged.current = true;

        animPos.setOffset({
          x: fabPos.current.x,
          y: fabPos.current.y,
        });

        animPos.setValue({
          x: 0,
          y: 0,
        });
      },

      onPanResponderMove: Animated.event(
        [null, {
          dx: animPos.x,
          dy: animPos.y,
        }],
        {
          useNativeDriver: false,
        }
      ),

      onPanResponderRelease: (_, gs) => {
        animPos.flattenOffset();

        const {
          W: sw,
          H: sh,
          topClamp,
          botClamp,
        } = boundsRef.current;

        const rawX =
          fabPos.current.x + gs.dx;

        const rawY =
          fabPos.current.y + gs.dy;

        const snapX =
          rawX + FAB_SIZE / 2 < sw / 2
            ? EDGE_GAP
            : sw - FAB_SIZE - EDGE_GAP;

        const snapY = Math.max(
          topClamp,
          Math.min(
            sh - FAB_SIZE - botClamp,
            rawY
          )
        );

        fabPos.current = {
          x: snapX,
          y: snapY,
        };

        Animated.spring(animPos, {
          toValue: {
            x: snapX,
            y: snapY,
          },
          useNativeDriver: false,
          bounciness: 10,
        }).start();

        setTimeout(() => {
          wasDragged.current = false;
        }, 300);
      },
    })
  ).current;

  function handleLogout() {
    if (Platform.OS === 'web') {
      setConfirmLogout(true);
    } else {
      Alert.alert(
        t('nav.logoutTitle'),
        t('nav.logoutAlertMsg'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('nav.logoutConfirm'),
            style: 'destructive',
            onPress: async () => {
              setOpen(false);
              await resetGame();
              await logout();
              router.replace('/login' as any);
            },
          },
        ]
      );
    }
  }

  async function doLogout() {
    setConfirmLogout(false);
    setOpen(false);

    await resetGame();
    await logout();

    router.replace('/login' as any);
  }

  const visible = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !canShowAdmin) {
      return false;
    }

    if (
      item.minLevel &&
      tamerLevel < item.minLevel
    ) {
      return false;
    }

    return true;
  });

  function navigate(route: string) {
    setOpen(false);

    setTimeout(() => {
      router.push(route as any);
    }, 150);
  }

  return (
    <>
      <Animated.View
        style={[
          styles.fabWrapper,
          { left: animPos.x, top: animPos.y },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => {
            if (!wasDragged.current) {
              setOpen(true);
            }
          }}
          activeOpacity={0.85}
          style={styles.fabBtn}
        >
          {fabImageFailed ? (
            <Feather name="menu" size={26} color="#ffffff" />
          ) : (
            <Image
              source={FAB_IMG}
              style={styles.fabImg}
              resizeMode="contain"
              onError={() => setFabImageFailed(true)}
            />
          )}

          {unreadMailCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadMailCount > 9
                  ? '9+'
                  : unreadMailCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setOpen(false)
        }
      >
        <Pressable
          style={[
            styles.overlay,
            Platform.OS === 'web'
              ? styles.overlayWeb
              : null,
          ]}
          onPress={() => {
            setOpen(false);
            setConfirmLogout(false);
          }}
        >
          <Pressable
            style={[
              styles.menu,
              Platform.OS === 'web'
                ? styles.menuWeb
                : null,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              pixelStyle,
            ]}
          >
            {confirmLogout ? (
              <View style={styles.confirmBox}>
                <Feather
                  name="log-out"
                  size={28}
                  color="#ef4444"
                  style={{
                    marginBottom: 12,
                  }}
                />

                <Text
                  style={styles.confirmTitle}
                >
                  {t('nav.logoutTitle')}
                </Text>

                <Text
                  style={styles.confirmSub}
                >
                  {t('nav.logoutSub')}
                </Text>

                <View
                  style={styles.confirmBtns}
                >
                  <TouchableOpacity
                    style={
                      styles.confirmCancel
                    }
                    onPress={() =>
                      setConfirmLogout(false)
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        styles.confirmCancelText
                      }
                    >
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmOk}
                    onPress={doLogout}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        styles.confirmOkText
                      }
                    >
                      {t('nav.logoutConfirm')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View
                  style={styles.menuHeader}
                >
                  <Image
                    source={FAB_IMG}
                    style={{
                      width: 38,
                      height: 38,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    style={[
                      styles.menuTitle,
                      {
                        color:
                          colors.foreground,
                      },
                    ]}
                  >
                    {t('nav.menuTitle')}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setOpen(false)
                    }
                  >
                    <Feather
                      name="x"
                      size={22}
                      color={
                        colors.mutedForeground
                      }
                    />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={visible}
                  numColumns={3}
                  keyExtractor={(item) =>
                    item.route
                  }
                  scrollEnabled={false}
                  columnWrapperStyle={{
                    gap: 10,
                  }}
                  contentContainerStyle={{
                    gap: 10,
                    paddingTop: 8,
                  }}
                  renderItem={({ item }) => {
                    const badgeCount =
                      item.isChat
                        ? unreadChat
                        : item.isMail
                          ? unreadMailCount
                          : 0;

                    const hasUnread =
                      badgeCount > 0;

                    return (
                      <TouchableOpacity
                        style={
                          styles.navItem
                        }
                        onPress={() =>
                          navigate(
                            item.route
                          )
                        }
                        activeOpacity={0.75}
                      >
                        <View
                          style={
                            styles.navIcon
                          }
                        >
                          <Image
                            source={
                              item.image
                            }
                            style={{
                              width:
                                item.bigIcon
                                  ? 64
                                  : 32,
                              height:
                                item.bigIcon
                                  ? 64
                                  : 32,
                            }}
                            resizeMode="contain"
                          />
                        </View>

                        <Text
                          style={[
                            styles.navLabel,
                            {
                              color:
                                colors.foreground,
                            },
                          ]}
                        >
                          {t(
                            item.labelKey
                          )}
                        </Text>

                        {hasUnread && (
                          <View
                            style={[
                              styles.navBadge,
                              {
                                backgroundColor:
                                  '#ef4444',
                              },
                            ]}
                          >
                            <Text
                              style={
                                styles.badgeText
                              }
                            >
                              {badgeCount >
                              9
                                ? '9+'
                                : badgeCount}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />

                <TouchableOpacity
                  style={[
                    styles.changePasswordBtn,
                    {
                      backgroundColor: '#3b82f622',
                      borderColor: '#3b82f6',
                    },
                    pixelStyle,
                  ]}
                  onPress={() => {
                    setOpen(false);
                    setConfirmLogout(false);
                    setChangePasswordOpen(true);
                  }}
                  activeOpacity={0.75}
                >
                  <Feather name="key" size={24} color="#60a5fa" />
                  <Text style={styles.changePasswordText}>Alterar senha</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.logoutBtn,
                    {
                      backgroundColor:
                        '#ef444422',
                      borderColor:
                        '#ef4444',
                    },
                    pixelStyle,
                  ]}
                  onPress={handleLogout}
                  activeOpacity={0.75}
                >
                  <Image
                    source={ICON_LOGOUT}
                    style={{
                      width: 26,
                      height: 26,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    style={[
                      styles.logoutText,
                      {
                        color: '#ef4444',
                      },
                    ]}
                  >
                    {t('nav.logout')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ChangePasswordModal
        visible={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    zIndex: 999,
  },

  fabBtn: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#0f1629',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },

  fabImg: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: IMG_SIZE / 2,
  },

  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },

  overlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  /*
   * No navegador o Modal ocupa o viewport inteiro.
   * Esta regra mantém o conteúdo do menu centralizado
   * na mesma região visual do jogo.
   */
  overlayWeb: {
    alignItems: 'center',
  },

  menu: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },

  /*
   * Limite equivalente à largura mobile do jogo.
   * width 100% permite adaptação em telas menores.
   */
  menuWeb: {
    width: '100%',
    maxWidth: 420,
  },

  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
    position: 'relative',
  },

  navIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  navBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  changePasswordBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
  },

  changePasswordText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60a5fa',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  logoutText: {
    fontSize: 12,
    fontWeight: '700',
  },

  passwordOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  passwordBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000aa',
  },

  passwordSheet: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },

  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },

  passwordIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f622',
    borderWidth: 1,
    borderColor: '#3b82f666',
  },

  passwordHeaderCopy: {
    flex: 1,
    gap: 3,
  },

  passwordTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  passwordSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },

  passwordClose: {
    padding: 4,
  },

  passwordInput: {
    width: '100%',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
  },

  passwordMessageError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#ef444466',
    backgroundColor: '#ef444422',
    padding: 9,
  },

  passwordMessageErrorText: {
    flex: 1,
    color: '#f87171',
    fontSize: 11,
  },

  passwordMessageSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#22c55e66',
    backgroundColor: '#22c55e22',
    padding: 9,
  },

  passwordMessageSuccessText: {
    flex: 1,
    color: '#4ade80',
    fontSize: 11,
  },

  passwordSubmit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    marginTop: 4,
  },

  passwordSubmitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  passwordCancel: {
    alignItems: 'center',
    paddingVertical: 5,
  },

  passwordCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },

  confirmBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  confirmTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 6,
  },

  confirmSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },

  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  confirmCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },

  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },

  confirmOk: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },

  confirmOkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
