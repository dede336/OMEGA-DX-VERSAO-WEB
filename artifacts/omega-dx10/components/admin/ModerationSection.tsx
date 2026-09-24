import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { pixelStyle } from '@/constants/pixelStyle';

type Report = {
  id: number; messageKind: 'global' | 'private'; reason: string; reportedUsername: string;
  createdAt: string; message?: { content: string; deletedAt?: string | null } | null;
};
type ContextMessage = { id: number; content: string; from?: string; createdAt: string };
type Ban = { id: number; username: string; reason: string; createdByRole: 'admin'; expiresAt: string; active: boolean };

export default function ModerationSection() {
  const { token, getApiUrl, user } = useAuth();
  const colors = useColors();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState('1440');
  const [reason, setReason] = useState('Comportamento ofensivo e desrespeito às regras da comunidade');
  const [contexts, setContexts] = useState<Record<number, ContextMessage[]>>({});
  const [bans, setBans] = useState<Ban[]>([]);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const load = useCallback(async () => {
    setLoading(true);
    const [reportsResponse, bansResponse] = await Promise.all([
      fetch(`${getApiUrl()}/moderation/reports?status=pending`, { headers }),
      fetch(`${getApiUrl()}/moderation/bans`, { headers }),
    ]);
    const [reportsData, bansData] = await Promise.all([reportsResponse.json(), bansResponse.json()]);
    setReports(reportsData.reports ?? []);
    setBans((bansData.bans ?? []).filter((ban: Ban) => ban.active && new Date(ban.expiresAt) > new Date()));
    setLoading(false);
  }, [getApiUrl, token]);
  useEffect(() => { load(); }, [load]);

  async function action(path: string, method: 'POST' | 'DELETE' = 'POST', body?: object) {
    const response = await fetch(`${getApiUrl()}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) Alert.alert('Ação não realizada', data.error ?? 'Erro desconhecido');
    else await load();
  }

  async function toggleContext(reportId: number) {
    if (contexts[reportId]) { setContexts((old) => { const next = { ...old }; delete next[reportId]; return next; }); return; }
    const response = await fetch(`${getApiUrl()}/moderation/reports/${reportId}/context`, { headers });
    const data = await response.json();
    setContexts((old) => ({ ...old, [reportId]: data.messages ?? [] }));
  }

  function confirmBan(report: Report) {
    const minutes = Number(duration);
    Alert.alert('Confirmar banimento', `Bloquear a conta de ${report.reportedUsername} por ${minutes} minuto(s)?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Banir conta', style: 'destructive', onPress: () => action(`/moderation/reports/${report.id}/ban`, 'POST', { durationMinutes: minutes, reason }) },
    ]);
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />;
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>🛡️ Moderação sigilosa</Text>
      <Text style={{ color: colors.mutedForeground, lineHeight: 19 }}>
        O jogador denunciado nunca vê quem denunciou. A moderação é exclusiva do Admin.
      </Text>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.foreground, fontWeight: '700' }}>Prazo em minutos</Text>
        <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={[{ color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 10 }, pixelStyle]} />
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>60 = 1 hora · 1440 = 1 dia · 10080 = 7 dias</Text>
        <Text style={{ color: colors.foreground, fontWeight: '700' }}>Motivo informado ao jogador</Text>
        <TextInput value={reason} onChangeText={setReason} multiline maxLength={300} style={[{ color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 70 }, pixelStyle]} />
      </View>
      {reports.length === 0 ? <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 30 }}>Nenhuma denúncia pendente.</Text> : reports.map((report) => (
        <View key={report.id} style={[{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }, pixelStyle]}>
          <Text style={{ color: colors.foreground, fontWeight: '800' }}>{report.messageKind === 'global' ? '🌍 Pública' : '🔒 Privada'} · {report.reportedUsername}</Text>
          <Text style={{ color: colors.mutedForeground }}>Motivo da denúncia: {report.reason}</Text>
          <Text style={{ color: colors.foreground }}>“{report.message?.content ?? 'Mensagem indisponível'}”</Text>
          <TouchableOpacity onPress={() => toggleContext(report.id)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{contexts[report.id] ? 'Ocultar conversa' : 'Ver contexto da conversa'}</Text>
          </TouchableOpacity>
          {contexts[report.id]?.map((message) => (
            <Text key={message.id} style={{ color: colors.mutedForeground, fontSize: 11 }}><Text style={{ fontWeight: '700' }}>{message.from ?? 'Jogador'}:</Text> {message.content}</Text>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity onPress={() => confirmBan(report)} style={{ backgroundColor: '#dc2626', padding: 10, borderRadius: 9 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Banir conta</Text></TouchableOpacity>
            {report.messageKind === 'global' && <TouchableOpacity onPress={() => action(`/moderation/reports/${report.id}/global-message`, 'DELETE')} style={{ backgroundColor: '#f59e0b', padding: 10, borderRadius: 9 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Apagar pública</Text></TouchableOpacity>}
            <TouchableOpacity onPress={() => action(`/moderation/reports/${report.id}/dismiss`)} style={{ backgroundColor: '#64748b', padding: 10, borderRadius: 9 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Arquivar</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 12 }}>Contas suspensas</Text>
      {bans.length === 0 ? <Text style={{ color: colors.mutedForeground }}>Nenhum banimento ativo.</Text> : bans.map((ban) => (
        <View key={ban.id} style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 }}>
          <Text style={{ color: colors.foreground, fontWeight: '800' }}>{ban.username}</Text>
          <Text style={{ color: colors.mutedForeground }}>{ban.reason}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Até {new Date(ban.expiresAt).toLocaleString('pt-BR')} · aplicado por Admin</Text>
          {(user?.isAdmin || ban.createdByRole !== 'admin') && (
            <TouchableOpacity onPress={() => action(`/moderation/bans/${ban.id}/revoke`)} style={{ alignSelf: 'flex-start', backgroundColor: '#2563eb', padding: 9, borderRadius: 9 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Desfazer banimento</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}
