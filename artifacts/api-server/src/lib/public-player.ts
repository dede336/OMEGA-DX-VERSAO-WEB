// Public projection: never return a save, inventory, email, or authentication fields.
export function publicPartner(save: unknown) {
  const data = (save ?? {}) as Record<string, unknown>;
  const collection = Array.isArray(data.collection) ? data.collection : [];
  const owned = collection.find((entry) => entry?.ownedId === data.selectedOwnedId);
  if (!owned || typeof owned.characterId !== 'string' || typeof owned.ownedId !== 'string') return null;
  return { ownedId: owned.ownedId, characterId: owned.characterId,
    level: Math.max(1, Number(owned.level) || 1), exp: 0,
    ascensionStars: Math.max(0, Math.min(4, Number(owned.ascensionStars) || 0)) };
}

export function publicHome(save: unknown) {
  const data = (save ?? {}) as Record<string, any>;
  const equipment = data.equippedItems ?? {};
  return {
    playerName: typeof data.playerName === 'string' ? data.playerName : '',
    totalPlayerLevel: Number(data.tamerLevel) || 1,
    tamerId: typeof data.tamerId === 'string' ? data.tamerId : null,
    bits: Number(data.bits) || 0, gemas: Number(data.gemas) || 0,
    collectionSize: Array.isArray(data.collection) ? data.collection.length : 0,
    selectedCharacter: publicPartner(save),
    equippedItems: { brasao: typeof equipment.brasao === 'string' ? equipment.brasao : null,
      digivice: typeof equipment.digivice === 'string' ? equipment.digivice : null },
    pvpCrest: typeof data.pvpCrest === 'string' ? data.pvpCrest : null,
    pvpDigivice: typeof data.pvpDigivice === 'string' ? data.pvpDigivice : null,
  };
}
