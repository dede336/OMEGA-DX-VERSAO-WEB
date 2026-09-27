import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { CharacterAvatar } from '@/components/GameComponents';
import { EQUIPMENT_ITEMS } from '@/constants/gameData';
import { getEquipItemImage } from '@/constants/equipImages';
import { pixelStyle } from '@/constants/pixelStyle';

const PVP_ICON = require('../../assets/images/friend-battle-icon.webp');
const MAX_BATTLES = 5;
const RECHARGE_MS = 30 * 60 * 1000;

type PvpEntry = {
  rank: number;
  username: string;
  tamerName: string;
  tamerLevel: number;
  tamerId: string | null;
  pvpPoints: number;
  pvpTeam?: string[];
};

function rewardForRank(rank: number, points: number) {
  if (points < 100) return 0;
  if (rank <= 10) return 500;
  if (rank <= 20) return 300;
  if (rank <= 50) return 200;
  return 150;
}

export default function PvpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getApiUrl } = useAuth();
  const game = useGame();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedTeam, setSelectedTeam] = useState<string[]>(game.pvpTeam);
  const [crest, setCrest] = useState<string | null>(game.pvpCrest);
  const [digivice, setDigivice] = useState<string | null>(game.pvpDigivice);
  const [ranking, setRanking] = useState<PvpEntry[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    game.refreshPvpBattles();
    const timer = setInterval(() => {
      setNow(Date.now());
      game.refreshPvpBattles();
    }, 10000);
    return () => clearInterval(timer);
  }, [game.refreshPvpBattles]);

  useEffect(() => {
    fetch(`${getApiUrl()}/leaderboard?limit=100&type=pvp`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => setRanking(Array.isArray(rows) ? rows : []))
      .catch(() => setRanking([]));
  }, [getApiUrl, game.pvpPoints, game.pvpTeam]);

  const ownedCrests = useMemo(() => EQUIPMENT_ITEMS.filter((item) =>
    item.slot === 'brasao' && (game.inventory.includes(item.id) || game.equippedItems.brasao === item.id)
  ), [game.inventory, game.equippedItems.brasao]);

  const ownedDigivices = useMemo(() => EQUIPMENT_ITEMS.filter((item) =>
    item.slot === 'digivice' && (game.inventory.includes(item.id) || game.equippedItems.digivice === item.id)
  ), [game.inventory, game.equippedItems.digivice]);

  const me = ranking.find((entry) => entry.username === user?.username);
  const rank = me?.rank ?? 0;
  const projectedReward = rank > 0 ? rewardForRank(rank, game.pvpPoints) : (game.pvpPoints >= 100 ? 150 : 0);

  const nextBattleMs = game.pvpBattleCharges >= MAX_BATTLES
    ? 0
    : Math.max(0, RECHARGE_MS - (now - game.pvpLastChargeAt));
  const nextMin = Math.floor(nextBattleMs / 60000);
  const nextSec = Math.floor((nextBattleMs % 60000) / 1000);

  function toggleDigimon(ownedId: string) {
    setSelectedTeam((prev) => {
      if (prev.includes(ownedId)) return prev.filter((id) => id !== ownedId);
      if (prev.length >= 3) return prev;
      return [...prev, ownedId];
    });
  }

  function saveRegistration() {
    if (selectedTeam.length !== 3 || !crest || !digivice) {
      Alert.alert('Registro PvP', 'Escolha exatamente 3 Digimons, 1 Brasão e 1 Digivice.');
      return;
    }
    if (game.registerPvpTeam(selectedTeam, crest, digivice)) {
      Alert.alert('PvP', 'Equipe de defesa registrada.');
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: 110 }}>
      <View style={styles.titleRow}>
        <Image source={PVP_ICON} style={styles.titleIcon} resizeMode="contain" />
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>PvP Competitivo</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Ranking semanal • reset na segunda-feira</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <View style={styles.statRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{game.pvpPoints}</Text><Text style={[styles.statLabel,{color:colors.mutedForeground}]}>PONTOS</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{game.pvpBattleCharges}/5</Text><Text style={[styles.statLabel,{color:colors.mutedForeground}]}>BATALHAS</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{rank ? `#${rank}` : '—'}</Text><Text style={[styles.statLabel,{color:colors.mutedForeground}]}>RANK</Text></View>
        </View>
        {game.pvpBattleCharges < 5 && <Text style={[styles.timer,{color:colors.mutedForeground}]}>Próxima batalha em {nextMin}:{String(nextSec).padStart(2,'0')}</Text>}
        {game.pvpBattleCharges === 5 && <Text style={styles.full}>● Batalhas cheias — 5/5</Text>}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: game.pvpPoints >= 100 ? '#22c55e' : colors.border }, pixelStyle]}>
        <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Recompensa semanal</Text>
        <Text style={[styles.progress,{color: game.pvpPoints >= 100 ? '#22c55e' : '#f59e0b'}]}>
          {game.pvpPoints >= 100 ? '✓ Qualificado para recompensa' : `${game.pvpPoints}/100 pontos para se qualificar`}
        </Text>
        <Text style={[styles.rules,{color:colors.mutedForeground}]}>1º–10º: 500 Gemas • 11º–20º: 300 • 21º–50º: 200 • 51º+: 150</Text>
        {projectedReward > 0 && <Text style={styles.reward}>Recompensa pela posição atual: {projectedReward} 💎</Text>}
      </View>

      <Text style={[styles.heading,{color:colors.foreground}]}>Equipe de defesa</Text>
      <Text style={[styles.help,{color:colors.mutedForeground}]}>Escolha 3 Digimons. Este é o time que os outros Tamers poderão enfrentar.</Text>
      <View style={styles.grid}>
        {game.collection.filter((owned) => {
          const c:any = (require('@/constants/extendedCharacters') as any).getCharacter(owned.characterId);
          return String(c?.rarity ?? '') !== 'EGG';
        }).map((owned) => {
          const active = selectedTeam.includes(owned.ownedId);
          return (
            <TouchableOpacity key={owned.ownedId} style={[styles.digimon, { borderColor: active ? '#22c55e' : colors.border, backgroundColor: colors.card }]} onPress={() => toggleDigimon(owned.ownedId)}>
              <CharacterAvatar characterId={owned.characterId} size={52} />
              <Text style={[styles.lv,{color:colors.foreground}]}>Lv {owned.level}</Text>
              {active && <View style={styles.check}><Feather name="check" size={11} color="#fff" /></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.heading,{color:colors.foreground}]}>Brasão</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.equipRow}>
        {ownedCrests.map((item) => <TouchableOpacity key={item.id} style={[styles.equip,{borderColor:crest===item.id?'#22c55e':colors.border,backgroundColor:colors.card}]} onPress={()=>setCrest(item.id)}>
          <Image source={getEquipItemImage(item.id, game.tamerId)} style={styles.equipImg} resizeMode="contain" />
          <Text style={[styles.equipName,{color:colors.foreground}]} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>)}
      </ScrollView>

      <Text style={[styles.heading,{color:colors.foreground}]}>Digivice</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.equipRow}>
        {ownedDigivices.map((item) => <TouchableOpacity key={item.id} style={[styles.equip,{borderColor:digivice===item.id?'#22c55e':colors.border,backgroundColor:colors.card}]} onPress={()=>setDigivice(item.id)}>
          <Image source={getEquipItemImage(item.id, game.tamerId)} style={styles.equipImg} resizeMode="contain" />
          <Text style={[styles.equipName,{color:colors.foreground}]} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>)}
      </ScrollView>

      <TouchableOpacity style={[styles.register, selectedTeam.length !== 3 || !crest || !digivice ? {opacity:.45}:null]} onPress={saveRegistration}>
        <Text style={styles.registerText}>REGISTRAR EQUIPE PvP</Text>
      </TouchableOpacity>

      <Text style={[styles.heading,{color:colors.foreground}]}>Ranking PvP</Text>
      {ranking.map((entry) => <View key={entry.username} style={[styles.rankRow,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Text style={[styles.rankPos,{color:colors.foreground}]}>#{entry.rank}</Text>
        <View style={{flex:1}}><Text style={[styles.rankName,{color:colors.foreground}]}>{entry.tamerName}</Text><Text style={[styles.rankUser,{color:colors.mutedForeground}]}>@{entry.username}</Text></View>
        <Text style={styles.rankPts}>{entry.pvpPoints} pts</Text>
      </View>)}
    </ScrollView>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,paddingHorizontal:14}, titleRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:14}, titleIcon:{width:48,height:48,borderRadius:10},
  title:{fontSize:17,fontWeight:'900'}, sub:{fontSize:9,marginTop:3}, card:{borderWidth:1,borderRadius:14,padding:14,marginBottom:14}, statRow:{flexDirection:'row',justifyContent:'space-around'},
  stat:{alignItems:'center'},statValue:{fontSize:17,fontWeight:'900',color:'#60a5fa'},statLabel:{fontSize:8,marginTop:3},timer:{fontSize:9,textAlign:'center',marginTop:10},
  full:{fontSize:9,textAlign:'center',marginTop:10,color:'#22c55e',fontWeight:'800'},sectionTitle:{fontSize:12,fontWeight:'900'},progress:{fontSize:10,fontWeight:'800',marginTop:8},
  rules:{fontSize:8,lineHeight:14,marginTop:8},reward:{fontSize:9,color:'#facc15',fontWeight:'800',marginTop:8},heading:{fontSize:12,fontWeight:'900',marginTop:8,marginBottom:8},
  help:{fontSize:8,lineHeight:13,marginBottom:8},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},digimon:{width:76,height:84,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center',position:'relative'},
  lv:{fontSize:8,fontWeight:'800'},check:{position:'absolute',top:4,right:4,width:18,height:18,borderRadius:9,backgroundColor:'#22c55e',alignItems:'center',justifyContent:'center'},
  equipRow:{gap:8,paddingBottom:6},equip:{width:92,minHeight:94,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center',padding:7},equipImg:{width:48,height:48},equipName:{fontSize:7,textAlign:'center',marginTop:4},
  register:{backgroundColor:'#2563eb',borderRadius:12,paddingVertical:14,alignItems:'center',marginVertical:16},registerText:{color:'#fff',fontSize:10,fontWeight:'900'},
  rankRow:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:10,padding:10,marginBottom:7},rankPos:{width:34,fontSize:10,fontWeight:'900'},rankName:{fontSize:9,fontWeight:'800'},rankUser:{fontSize:7,marginTop:2},rankPts:{fontSize:9,fontWeight:'900',color:'#60a5fa'},
});