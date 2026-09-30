import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattleTeam, chooseBattleSlot, ownBattleTeam } from '../utils/friendSupport.ts';

test('moving or replacing support preserves three slots and only one borrowed partner', () => {
  assert.deepEqual(chooseBattleSlot(['a', 'friend:old', 'b'], 0, 'friend:new'), ['friend:new', 'a', 'b']);
  assert.deepEqual(chooseBattleSlot(['friend:old', 'a', 'b'], 2, 'friend:old'), ['b', 'a', 'friend:old']);
  assert.deepEqual(chooseBattleSlot(['a', 'b', 'friend:old'], 2, null), ['a', 'b']);
});
test('borrowed IDs never enter persistent own team and survive auto reconstruction', () => {
  const team = ['a', 'friend:test', 'b'];
  assert.deepEqual(ownBattleTeam(team), ['a', 'b']);
  assert.deepEqual(createBattleTeam(ownBattleTeam(team), 'test', 1), team);
  assert.deepEqual(createBattleTeam(['a', 'b', 'c'], 'test', 2), ['a', 'b', 'friend:test']);
});
