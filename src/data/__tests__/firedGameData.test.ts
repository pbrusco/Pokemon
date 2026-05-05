/**
 * Pins the structural contract of the auto-extracted FireRed game data.
 * If any of these tables shrink unexpectedly or lose required fields, the
 * test flags it instantly — preventing silent regressions when the
 * pokefirered disassembly format shifts.
 */

import { describe, it, expect } from 'vitest';
import { FIRERED_NPCS } from '../firered/firedNpcs.generated';
import { FIRERED_TRAINERS, FIRERED_TRAINER_PARTIES } from '../firered/firedTrainers.generated';
import { FIRERED_WILD_ENCOUNTERS } from '../firered/firedWildEncounters.generated';
import { FIRERED_SIGNS } from '../firered/firedSigns.generated';
import { FIRERED_ITEMS } from '../firered/firedItems.generated';

describe('extracted FireRed game data', () => {
  it('emits NPCs for at least 300 maps', () => {
    expect(Object.keys(FIRERED_NPCS).length).toBeGreaterThan(300);
  });

  it('emits at least 700 trainers, half of which link to a real (non-dummy) party', () => {
    const trainerCount = Object.keys(FIRERED_TRAINERS).length;
    expect(trainerCount).toBeGreaterThan(700);
    let withParty = 0;
    for (const t of Object.values(FIRERED_TRAINERS)) {
      if (t.partyKey && FIRERED_TRAINER_PARTIES[t.partyKey]) withParty++;
    }
    // ~half of gTrainers entries are RS-only macro placeholders (Aqua, Magma,
    // RS classes, etc.) that FRLG never populated. The real FRLG content
    // makes up the rest, all of which point at parties we extracted.
    expect(withParty).toBeGreaterThan(trainerCount * 0.4);
  });

  it('every trainer party has at least one mon with species + level', () => {
    for (const [key, party] of Object.entries(FIRERED_TRAINER_PARTIES)) {
      expect(party.mons.length, `party ${key} has zero mons`).toBeGreaterThan(0);
      for (const mon of party.mons) {
        expect(mon.species, `${key} mon missing species`).toBeTruthy();
        expect(typeof mon.lvl, `${key} mon missing lvl`).toBe('number');
      }
    }
  });

  it('emits wild encounter tables for at least 100 Kanto maps', () => {
    expect(Object.keys(FIRERED_WILD_ENCOUNTERS).length).toBeGreaterThan(100);
    // Spot-check Pallet Town (water-only)
    const pallet = FIRERED_WILD_ENCOUNTERS['MAP_PALLET_TOWN'];
    expect(pallet?.water_mons?.mons.length).toBeGreaterThan(0);
  });

  it('emits sign data for at least 150 maps', () => {
    expect(Object.keys(FIRERED_SIGNS).length).toBeGreaterThan(150);
  });

  it('emits at least 300 items, each with english name + price', () => {
    expect(Object.keys(FIRERED_ITEMS).length).toBeGreaterThan(300);
    for (const [id, item] of Object.entries(FIRERED_ITEMS)) {
      expect(item.english, `item ${id} missing english`).toBeTruthy();
      expect(typeof item.price, `item ${id} missing price`).toBe('number');
    }
  });

  it('NPCs flagged as trainers point at a real trainer entry', () => {
    let trainerNpcCount = 0;
    for (const npcs of Object.values(FIRERED_NPCS)) {
      for (const npc of npcs) {
        if (!npc.trainerId) continue;
        trainerNpcCount++;
        expect(
          FIRERED_TRAINERS[npc.trainerId],
          `NPC at script ${npc.script} references unknown trainer ${npc.trainerId}`
        ).toBeDefined();
      }
    }
    // Sanity: there should be hundreds of trainer NPCs across Kanto.
    expect(trainerNpcCount).toBeGreaterThan(200);
  });
});
