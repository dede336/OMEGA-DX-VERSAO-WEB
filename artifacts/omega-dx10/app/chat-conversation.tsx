import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Platform, KeyboardAvoidingView, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useSocket, ChatMessage } from '@/context/SocketContext';
import { pixelStyle } from '@/constants/pixelStyle';
import { CHAT_EMOJIS, CHAT_UNIT_LIMIT, countChatUnits } from '@/utils/chat';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ChatConversationScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user, getApiUrl } = useAuth();
  const { onlineUsers, sendMessage, markRead, recentMessages, chatError, clearChatError } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const apiUrl = getApiUrl();
  const isOnline = onlineUsers.has(username ?? '');

  const fetchHistory = useCallback(async () => {
    if (!username) return;
    try {
      const res = await fetch(`${apiUrl}/chat/messages/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
    setLoading(false);
  }, [apiUrl, token, username]);

  useEffect(() => {
    fetchHistory();
    if (username) markRead(username);
  }, [username]);

  // Merge socket-delivered messages
  useEffect(() => {
    const socketMsgs = recentMessages[username ?? ''] ?? [];
    if (socketMsgs.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMsgs = socketMsgs.filter((m) => !existingIds.has(m.id));
      if (newMsgs.length === 0) return prev;
      return [...prev, ...newMsgs];
    });
    markRead(username ?? '');
  }, [recentMessages[username ?? '']]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  function handleSend() {
    const content = input.trim();
    if (!content || !username || countChatUnits(content) > CHAT_UNIT_LIMIT) return;
    setSending(true);
    sendMessage(username, content);
    setInput('');
    setSending(false);
  }

  function reportPrivateMessage(messageId: number) {
    Alert.alert('Denunciar mensagem', 'A denúncia é sigilosa. A moderação poderá analisar esta conversa, mas o jogador não saberá quem denunciou.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Denunciar', style: 'destructive', onPress: async () => {
        const response = await fetch(`${apiUrl}/chat/report`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageKind: 'private', messageId, reason: 'Conteúdo ofensivo' }),
        });
        const data = await response.json();
        Alert.alert(response.ok ? 'Denúncia enviada' : 'Não foi possível denunciar', data.message || data.error);
      } },
    ]);
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 16 : insets.bottom + 8;

  // Group messages by date
  let lastDate = '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: '#3b82f622' }]}>
              <Text style={{ fontSize: 15 }}>🧑‍💻</Text>
            </View>
            <View style={[styles.presenceDot, { backgroundColor: isOnline ? '#22c55e' : '#6b7280' }]} />
          </View>
          <View>
            <Text style={[styles.headerUsername, { color: colors.foreground }]}>{username}</Text>
            <Text style={{ color: isOnline ? '#22c55e' : colors.mutedForeground, fontSize: 12 }}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 12, paddingBottom: 16, gap: 4 }}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 20 }}>👋</Text>
                <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 12 }}>
                  Diga olá para {username}!
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.from === user?.username;
              const msgDate = formatDate(item.createdAt);
              const showDate = msgDate !== lastDate;
              lastDate = msgDate;
              return (
                <>
                  {showDate && (
                    <View style={styles.dateDivider}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{msgDate}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
                    activeOpacity={0.85}
                    onLongPress={() => !isMe && reportPrivateMessage(item.id)}
                  >
                    <View style={[
                      styles.bubbleContent,
                      { backgroundColor: isMe ? '#3b82f6' : colors.card, borderColor: colors.border },
                      pixelStyle,
                    ]}>
                      <Text style={{ color: isMe ? '#fff' : colors.foreground, fontSize: 12 }}>
                        {item.content}
                      </Text>
                      <Text style={{ color: isMe ? '#ffffffaa' : colors.mutedForeground, fontSize: 10, alignSelf: 'flex-end', marginTop: 2 }}>
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              );
            }}
          />
        )}

        {!!chatError && (
          <TouchableOpacity style={styles.errorBanner} onPress={clearChatError}>
            <Text style={{ color: '#fff', fontSize: 12, flex: 1 }}>{chatError}</Text>
          </TouchableOpacity>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiBar} contentContainerStyle={{ gap: 8 }}>
          {CHAT_EMOJIS.map((emoji) => (
            <TouchableOpacity key={emoji} onPress={() => setInput((value) => `${value}${emoji}`)}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={[styles.counter, { color: countChatUnits(input) > CHAT_UNIT_LIMIT ? '#ef4444' : colors.mutedForeground }]}>
          {countChatUnits(input)}/{CHAT_UNIT_LIMIT} palavras/emojis
        </Text>
        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: botPad }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }, pixelStyle]}
            value={input}
            onChangeText={setInput}
            placeholder="Mensagem..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: input.trim() ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending || countChatUnits(input) > CHAT_UNIT_LIMIT}
          >
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerUsername: { fontSize: 14, fontWeight: '700' },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  presenceDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2, borderColor: 'transparent',
  },
  dateDivider: {
    alignItems: 'center', marginVertical: 8,
  },
  bubble: { flexDirection: 'row', marginVertical: 1 },
  bubbleMe: { justifyContent: 'flex-end' },
  bubbleThem: { justifyContent: 'flex-start' },
  bubbleContent: {
    maxWidth: '78%', padding: 10, borderRadius: 16,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 12, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emojiBar: { maxHeight: 38, marginHorizontal: 12, marginTop: 6 },
  counter: { fontSize: 10, textAlign: 'right', marginHorizontal: 14, marginTop: 2 },
  errorBanner: { backgroundColor: '#ef4444', padding: 10, marginHorizontal: 12, borderRadius: 10 },
});
