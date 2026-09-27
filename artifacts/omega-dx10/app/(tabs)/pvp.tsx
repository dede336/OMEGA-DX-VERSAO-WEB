import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { CharacterAvatar } from '@/components/GameComponents';
import { EQUIPMENT_ITEMS } from '@/constants/gameData';
import { getEquipItemImage } from '@/constants/equipImages';
import { pixelStyle } from '@/constants/pixelStyle';
import { getCharacter } from '@/constants/extendedCharacters';
import ENERGY_PILL_IMAGE from '@/constants/energyPillImage';

const PVP_ICON = require('../../assets/images/icone_pvp.gif');
const PVP_COIN_ICON = require('../../assets/images/moeda_pvp.gif');
const MAX_BATTLES = 5;
const RECHARGE_MS = 30 * 60 * 1000;
const PVP_SHOP_IMAGES: Record<string, any> = {
  miracle_piece: getEquipItemImage('piece_brasao_milagre'),
  // Cartas não possuem um asset genérico de verso no projeto; usa o mesmo ícone de cartas da Mochila.
  random_card: null,
  gold_battery_10: require('../../assets/images/battery_gold.webp'),
  energy_pill: ENERGY_PILL_IMAGE,
  pink_flower: require('../../assets/images/deco_flower.webp'),
  food_apple: require('../../assets/images/food_apple.webp'),
  food_sushi: require('../../assets/images/food_sushi.webp'),
  food_water: require('../../assets/images/food_water.webp'),
  food_salad: require('../../assets/images/food_salad.webp'),
  food_burger: require('../../assets/images/food_burger.webp'),
  food_pizza: require('../../assets/images/food_pizza.webp'),
};

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
  if (points < 100) return 50;
  if (rank <= 10) return 500;
  if (rank <= 20) return 300;
  if (rank <= 50) return 200;
  return 150;
}

export default function PvpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, token, getApiUrl } = useAuth();
  const game = useGame();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedTeam, setSelectedTeam] = useState<string[]>(game.pvpTeam);
  const [crest, setCrest] = useState<string | null>(game.pvpCrest);
  const [digivice, setDigivice] = useState<string | null>(game.pvpDigivice);
  const [ranking, setRanking] = useState<PvpEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  const [category, setCategory] = useState('INICIANTE');
  const [opponent, setOpponent] = useState<any | null>(null);
  const [pvpResult, setPvpResult] = useState<'win' | 'loss' | null>(null);
  const [pvpBusy, setPvpBusy] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [digimonSearch, setDigimonSearch] = useState('');

  useEffect(() => {
    game.refreshPvpBattles();
    const timer = setInterval(() => {
      setNow(Date.now());
      game.refreshPvpBattles();
    }, 10000);
    return () => clearInterval(timer);
  }, [game.refreshPvpBattles]);

  useEffect(() => {
    if (token) {
      fetch(`${getApiUrl()}/pvp/state`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return;
          setCategory(data.category ?? 'INICIANTE');
          game.applyPvpServerState({
            pvpPoints: data.pvpPoints,
            pvpCoins: data.pvpCoins,
            pvpBattleCharges: data.pvpBattleCharges,
            pvpLastChargeAt: data.pvpLastChargeAt,
          });
        }).catch(() => {});
    }
    fetch(`${getApiUrl()}/leaderboard?limit=100&type=pvp`)
      .then((r) => r.ok ? r.json() : [])
      .then((rows) => setRanking(Array.isArray(rows) ? rows : []))
      .catch(() => setRanking([]));
  }, [getApiUrl, token, game.pvpTeam]);

  const ownedCrests = useMemo(() => EQUIPMENT_ITEMS.filter((item) =>
    item.slot === 'brasao' && (game.inventory.includes(item.id) || game.equippedItems.brasao === item.id)
  ), [game.inventory, game.equippedItems.brasao]);

  const ownedDigivices = useMemo(() => EQUIPMENT_ITEMS.filter((item) =>
    item.slot === 'digivice' && (game.inventory.includes(item.id) || game.equippedItems.digivice === item.id)
  ), [game.inventory, game.equippedItems.digivice]);

  const me = ranking.find((entry) => entry.username === user?.username);
  const rank = me?.rank ?? 0;
  const projectedReward = rank > 0 ? rewardForRank(rank, game.pvpPoints) : (game.pvpPoints >= 100 ? 150 : 50);

  const nextBattleMs = game.pvpBattleCharges >= MAX_BATTLES
    ? 0
    : Math.max(0, RECHARGE_MS - (now - game.pvpLastChargeAt));
  const nextMin = Math.floor(nextBattleMs / 60000);
  const nextSec = Math.floor((nextBattleMs % 60000) / 1000);

  function chooseDigimonForSlot(ownedId: string) {
    if (pickerSlot === null) return;
    setSelectedTeam((prev) => {
      const next = [prev[0] ?? '', prev[1] ?? '', prev[2] ?? ''];
      const old = next.indexOf(ownedId);
      if (old >= 0 && old !== pickerSlot) next[old] = '';
      next[pickerSlot] = ownedId;
      return next;
    });
    setPickerSlot(null); setDigimonSearch('');
  }

  const selectableDigimons = useMemo(() => game.collection.filter((owned) => {
    const ch = getCharacter(owned.characterId);
    if (!ch || String(ch.rarity ?? '') === 'EGG') return false;
    const q = digimonSearch.trim().toLowerCase();
    return !q || ch.name.toLowerCase().includes(q);
  }), [game.collection, digimonSearch]);

  function buyShopItem(itemId: string, label: string, price: number) {
    Alert.alert('Loja PvP', `Comprar ${label} por ${price} Moedas PvP?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Comprar',
        onPress: async () => {
          if (!token) return;
          try {
            const res = await fetch(`${getApiUrl()}/pvp/shop`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ itemId }),
            });
            const data = await res.json();
            if (!res.ok) { Alert.alert('Loja PvP', data.error ?? 'Compra não concluída.'); return; }
            const s = data.saveData ?? {};
            game.applyPvpServerState({
              pvpCoins: data.pvpCoins,
              inventory: s.inventory,
              pieces: s.pieces,
              farmFoods: s.farmFoods,
              farmDecorInventory: s.farmDecorInventory,
            });
            Alert.alert('Compra concluída', data.reward ?? label);
          } catch { Alert.alert('Loja PvP', 'Não foi possível concluir a compra.'); }
        },
      },
    ]);
  }

  async function findOpponent() {
    if (!token || game.pvpTeam.length !== 3 || !game.pvpCrest || !game.pvpDigivice) {
      Alert.alert('PvP', 'Registre sua equipe de defesa antes de procurar uma batalha.');
      return;
    }
    if (game.pvpBattleCharges <= 0) { Alert.alert('PvP', 'Sem batalhas disponíveis.'); return; }
    setPvpBusy(true); setPvpResult(null);
    try {
      const res = await fetch(`${getApiUrl()}/pvp/opponent`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { Alert.alert('PvP', data.error ?? 'Nenhum adversário disponível.'); return; }
      setOpponent(data);
      setCategory(data.category ?? category);
    } finally { setPvpBusy(false); }
  }

  async function registerBattleResult(won: boolean) {
    if (!token || pvpBusy) return;
    setPvpBusy(true);
    try {
      const res = await fetch(`${getApiUrl()}/pvp/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ won }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('PvP', data.error ?? 'Resultado não registrado.'); return; }
      game.applyPvpServerState({
        pvpPoints: data.pvpPoints, pvpCoins: data.pvpCoins,
        pvpBattleCharges: data.pvpBattleCharges, pvpLastChargeAt: data.pvpLastChargeAt,
      });
      setPvpResult(won ? 'win' : 'loss');
    } finally { setPvpBusy(false); }
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

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Batalha PvP • Categoria {category}</Text>
        <Text style={[styles.help,{color:colors.mutedForeground}]}>O adversário é sorteado aleatoriamente entre Tamers da sua categoria.</Text>
        {!opponent ? (
          <TouchableOpacity style={[styles.register, (game.pvpBattleCharges <= 0 || pvpBusy) ? {opacity:.45}:null]} onPress={findOpponent} disabled={pvpBusy}>
            <Text style={styles.registerText}>{pvpBusy ? 'PROCURANDO...' : 'PROCURAR ADVERSÁRIO'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{gap:8}}>
            <Text style={[styles.shopName,{color:colors.foreground}]}>{opponent.tamerName} • @{opponent.username}</Text>
            <View style={styles.grid}>{(opponent.team ?? []).map((d:any)=><View key={d.ownedId} style={[styles.digimon,{borderColor:colors.border,backgroundColor:colors.background}]}><CharacterAvatar characterId={d.characterId} size={52}/><Text style={[styles.lv,{color:colors.foreground}]}>Lv {d.level}</Text></View>)}</View>
            <Text style={[styles.help,{color:colors.mutedForeground}]}>Equipe defensiva registrada • Brasão e Digivice preservados.</Text>
            <Text style={[styles.help,{color:'#f59e0b'}]}>A arena competitiva usará esta defesa. Enquanto a integração visual da batalha é finalizada, o resultado só pode ser registrado pelo fluxo de batalha.</Text>
          </View>
        )}
        {pvpResult && <View style={styles.resultCard}>
          <Text style={[styles.resultTitle,{color:pvpResult==='win'?'#22c55e':'#ef4444'}]}>{pvpResult==='win'?'VITÓRIA':'DERROTA'}</Text>
          <Text style={[styles.resultGain,{color:colors.foreground}]}>{pvpResult==='win'?'+10 Pontos PvP  •  +10 Moedas PvP':'−5 Pontos PvP  •  Moedas PvP mantidas'}</Text>
        </View>}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: game.pvpPoints >= 100 ? '#22c55e' : colors.border }, pixelStyle]}>
        <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Recompensa semanal</Text>
        <Text style={[styles.progress,{color: game.pvpPoints >= 100 ? '#22c55e' : '#f59e0b'}]}>
          {game.pvpPoints >= 100 ? '✓ Classificado no ranking semanal' : `${game.pvpPoints}/100 pontos • ainda não classificado`}
        </Text>
        <Text style={[styles.rules,{color:colors.mutedForeground}]}>1º–10º: 500 Gemas • 11º–20º: 300 • 21º–50º: 200 • 51º+: 150 • Abaixo de 100 pontos: 50 Gemas</Text>
        {projectedReward > 0 && <Text style={styles.reward}>Recompensa pela posição atual: {projectedReward} 💎</Text>}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pixelStyle]}>
        <View style={styles.shopHeader}>
          <View>
            <Text style={[styles.sectionTitle,{color:colors.foreground}]}>Loja PvP</Text>
            <Text style={[styles.help,{color:colors.mutedForeground,marginBottom:0}]}>Moedas PvP são permanentes e não são perdidas em derrotas.</Text>
          </View>
          <View style={styles.coinPill}><Image source={PVP_COIN_ICON} style={styles.coinIcon} resizeMode="contain" /><Text style={styles.coinValue}>{game.pvpCoins}</Text><Text style={styles.coinLabel}> MOEDAS PvP</Text></View>
        </View>
        {[
          ['miracle_piece','Milagre Piece','1 unidade',1500],
          ['random_card','Carta Aleatória','1 carta aleatória',2000],
          ['gold_battery_10','Bateria Dourada','10 unidades',500],
          ['energy_pill','Pílula de Energia','1 unidade',500],
          ['pink_flower','Flor Rosa','Decoração DigiFarm ×1',20],
          ['food_apple','Maçã','Comida ×1',50],
          ['food_sushi','Sushi','Comida ×1',50],
          ['food_water','Água','Comida ×1',50],
          ['food_salad','Salada','Comida ×1',50],
          ['food_burger','Hambúrguer','Comida ×1',50],
          ['food_pizza','Pizza','Comida ×1',50],
        ].map(([id,name,detail,price]) => (
          <View key={String(id)} style={[styles.shopRow,{borderColor:colors.border}]}>
            <Image source={PVP_SHOP_IMAGES[String(id)]} style={styles.shopImage} resizeMode="contain" />
            <View style={{flex:1}}>
              <Text style={[styles.shopName,{color:colors.foreground}]}>{String(name)}</Text>
              <Text style={[styles.shopDetail,{color:colors.mutedForeground}]}>{String(detail)}</Text>
            </View>
            <TouchableOpacity disabled={game.pvpCoins < Number(price)} style={[styles.buyBtn, game.pvpCoins < Number(price) ? {opacity:.45}:null]} onPress={()=>buyShopItem(String(id),String(name),Number(price))}>
              <View style={styles.priceRow}><Image source={PVP_COIN_ICON} style={styles.priceCoinIcon} resizeMode="contain" /><Text style={styles.buyText}>{Number(price)}</Text></View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={[styles.heading,{color:colors.foreground}]}>Equipe de defesa</Text>
      <Text style={[styles.help,{color:colors.mutedForeground}]}>Escolha somente 3 Digimons. Toque no slot, pesquise e selecione.</Text>
      <View style={styles.slotRow}>
        {[0,1,2].map((slot) => {
          const owned=game.collection.find((d)=>d.ownedId===selectedTeam[slot]); const ch=owned?getCharacter(owned.characterId):null;
          return <TouchableOpacity key={slot} style={[styles.teamSlot,{borderColor:owned?'#22c55e':colors.border,backgroundColor:colors.card}]} onPress={()=>{setPickerSlot(slot);setDigimonSearch('');}}>
            {owned&&ch?<><CharacterAvatar characterId={owned.characterId} size={58}/><Text style={[styles.slotName,{color:colors.foreground}]} numberOfLines={1}>{ch.name}</Text><Text style={[styles.lv,{color:colors.mutedForeground}]}>Lv {owned.level}</Text></>:<><Feather name="plus" size={26} color={colors.mutedForeground}/><Text style={[styles.slotEmpty,{color:colors.mutedForeground}]}>SLOT {slot+1}</Text></>}
          </TouchableOpacity>
        })}
      </View>
      <Modal visible={pickerSlot!==null} transparent animationType="slide" onRequestClose={()=>setPickerSlot(null)}>
        <View style={styles.modalOverlay}><View style={[styles.pickerSheet,{backgroundColor:colors.background,borderColor:colors.border}]}>
          <View style={styles.pickerHeader}><Text style={[styles.sectionTitle,{color:colors.foreground}]}>Escolher Digimon • Slot {(pickerSlot??0)+1}</Text><TouchableOpacity onPress={()=>setPickerSlot(null)}><Feather name="x" size={22} color={colors.foreground}/></TouchableOpacity></View>
          <TextInput value={digimonSearch} onChangeText={setDigimonSearch} placeholder="Pesquisar Digimon..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput,{color:colors.foreground,borderColor:colors.border,backgroundColor:colors.card}]}/>
          <ScrollView contentContainerStyle={styles.pickerGrid}>{selectableDigimons.map((owned)=>{const ch=getCharacter(owned.characterId);if(!ch)return null;const used=selectedTeam.includes(owned.ownedId)&&selectedTeam[pickerSlot??-1]!==owned.ownedId;return <TouchableOpacity disabled={used} key={owned.ownedId} style={[styles.pickerDigimon,{borderColor:colors.border,backgroundColor:colors.card},used&&{opacity:.35}]} onPress={()=>chooseDigimonForSlot(owned.ownedId)}><CharacterAvatar characterId={owned.characterId} size={50}/><Text style={[styles.slotName,{color:colors.foreground}]} numberOfLines={1}>{ch.name}</Text><Text style={[styles.lv,{color:colors.mutedForeground}]}>Lv {owned.level}</Text></TouchableOpacity>})}</ScrollView>
        </View></View>
      </Modal>

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
  shopHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10},coinPill:{flexDirection:'row',alignItems:'center',backgroundColor:'#7c3aed',borderRadius:10,paddingHorizontal:9,paddingVertical:7},coinIcon:{width:22,height:22,marginRight:5},coinValue:{color:'#fff',fontSize:13,fontWeight:'900'},coinLabel:{color:'#ede9fe',fontSize:7,fontWeight:'800'},
  shopRow:{flexDirection:'row',alignItems:'center',gap:10,borderTopWidth:1,paddingVertical:9},shopImage:{width:42,height:42},shopName:{fontSize:9,fontWeight:'900'},shopDetail:{fontSize:7,marginTop:2},buyBtn:{minWidth:68,backgroundColor:'#7c3aed',borderRadius:9,paddingHorizontal:9,paddingVertical:8,alignItems:'center'},priceRow:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4},priceCoinIcon:{width:16,height:16},buyText:{color:'#fff',fontSize:8,fontWeight:'900'},
  resultCard:{borderWidth:1,borderColor:'#ffffff22',borderRadius:12,padding:12,alignItems:'center',gap:5},resultTitle:{fontSize:18,fontWeight:'900',letterSpacing:2},resultGain:{fontSize:9,fontWeight:'800'},
  slotRow:{flexDirection:'row',gap:8,marginBottom:10},teamSlot:{flex:1,height:126,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center',padding:6},slotName:{fontSize:7,fontWeight:'900',marginTop:4,textAlign:'center',width:'100%'},slotEmpty:{fontSize:8,fontWeight:'900',marginTop:8},modalOverlay:{flex:1,backgroundColor:'#000b',justifyContent:'flex-end'},pickerSheet:{height:'78%',borderTopWidth:1,borderTopLeftRadius:18,borderTopRightRadius:18,padding:14},pickerHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10},searchInput:{borderWidth:1,borderRadius:10,paddingHorizontal:12,paddingVertical:10,fontSize:10,marginBottom:10},pickerGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingBottom:40},pickerDigimon:{width:'31%',minHeight:100,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center',padding:6},rankRow:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderRadius:10,padding:10,marginBottom:7},rankPos:{width:34,fontSize:10,fontWeight:'900'},rankName:{fontSize:9,fontWeight:'800'},rankUser:{fontSize:7,marginTop:2},rankPts:{fontSize:9,fontWeight:'900',color:'#60a5fa'},
});