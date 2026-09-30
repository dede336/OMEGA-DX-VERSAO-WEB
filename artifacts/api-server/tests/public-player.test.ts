import test from 'node:test';
import assert from 'node:assert/strict';
import { publicHome, publicPartner } from '../src/lib/public-player.ts';

test('profile uses active partner rather than first member of saved team', () => {
  const save = { selectedOwnedId: 'second', team: ['first'], collection: [
    { ownedId: 'first', characterId: 'agumon', level: 1 },
    { ownedId: 'second', characterId: 'gabumon', level: 45, ascensionStars: 2 },
  ] };
  assert.equal(publicPartner(save)?.characterId, 'gabumon');
  assert.equal(publicPartner(save)?.ascensionStars, 2);
  assert.equal(publicPartner({ ...save, selectedOwnedId: 'missing' }), null);
});
test('public profile exposes display data without private save fields', () => {
  const save = { playerName: 'Test', inventory: ['secret'], password: 'secret', messages: ['secret'], selectedOwnedId: 'a', collection: [{ ownedId: 'a', characterId: 'agumon', level: 10, mailGiftId: 'secret' }], equippedItems: { brasao: 'crest', digivice: 'vice', secret: 'private' } };
  const profile = publicHome(save);
  assert.equal(profile.collectionSize, 1);
  assert.equal(JSON.stringify(profile).includes('secret'), false);
  profile.selectedCharacter!.level = 99;
  assert.equal(save.collection[0].level, 10);
});
