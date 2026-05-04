import { describe, it, expect } from 'vitest';
import {
  getMilitaryGroup,
  computeMilitaryPhase,
  BLOCK_SEQUENCES,
  BLOCK_VOLUMES,
  SESSIONS_PER_BLOCK,
  MIL_MARCH_KG,
  MIL_CLUSTER_RUN_PEAK,
} from '../functions/api/_shared/military.js';

// ── getMilitaryGroup ──────────────────────────────────────────────────────────

describe('getMilitaryGroup', () => {
  it('maps keuring KB (0) to keuring_low', () => {
    expect(getMilitaryGroup('keuring', 0)).toBe('keuring_low');
  });

  it('maps keuring K1–K2 to keuring_low', () => {
    expect(getMilitaryGroup('keuring', 1)).toBe('keuring_low');
    expect(getMilitaryGroup('keuring', 2)).toBe('keuring_low');
  });

  it('maps keuring K3–K4 to keuring_mid', () => {
    expect(getMilitaryGroup('keuring', 3)).toBe('keuring_mid');
    expect(getMilitaryGroup('keuring', 4)).toBe('keuring_mid');
  });

  it('maps keuring K5–K6 to keuring_high', () => {
    expect(getMilitaryGroup('keuring', 5)).toBe('keuring_high');
    expect(getMilitaryGroup('keuring', 6)).toBe('keuring_high');
  });

  it('maps opleiding O1–O2 to opleiding_low', () => {
    expect(getMilitaryGroup('opleiding', 1)).toBe('opleiding_low');
    expect(getMilitaryGroup('opleiding', 2)).toBe('opleiding_low');
  });

  it('maps opleiding O3–O4 to opleiding_mid', () => {
    expect(getMilitaryGroup('opleiding', 3)).toBe('opleiding_mid');
    expect(getMilitaryGroup('opleiding', 4)).toBe('opleiding_mid');
  });

  it('maps opleiding O5–O6 to opleiding_high', () => {
    expect(getMilitaryGroup('opleiding', 5)).toBe('opleiding_high');
    expect(getMilitaryGroup('opleiding', 6)).toBe('opleiding_high');
  });
});

// ── BLOCK_SEQUENCES ───────────────────────────────────────────────────────────

describe('BLOCK_SEQUENCES', () => {
  it('all groups have exactly 4 sessions', () => {
    for (const [group, seq] of Object.entries(BLOCK_SEQUENCES)) {
      expect(seq).toHaveLength(SESSIONS_PER_BLOCK, `${group} should have ${SESSIONS_PER_BLOCK} sessions`);
    }
  });

  it('all session types are known strings', () => {
    const known = new Set(['duurloop', 'kracht', 'interval', 'kracht_marsen', 'circuit', 'rust']);
    for (const [group, seq] of Object.entries(BLOCK_SEQUENCES)) {
      for (const s of seq) {
        expect(known.has(s)).toBe(true, `${group} has unknown session type: ${s}`);
      }
    }
  });

  it('every group starts with duurloop (Zone 2) for aerobic base', () => {
    for (const [group, seq] of Object.entries(BLOCK_SEQUENCES)) {
      expect(seq[0]).toBe('duurloop', `${group} should start with duurloop`);
    }
  });

  it('every group includes at least one interval session', () => {
    for (const [group, seq] of Object.entries(BLOCK_SEQUENCES)) {
      expect(seq.includes('interval')).toBe(true, `${group} missing interval`);
    }
  });
});

// ── BLOCK_VOLUMES ─────────────────────────────────────────────────────────────

describe('BLOCK_VOLUMES', () => {
  it('has 6 entries for a 6-block periodization cycle', () => {
    expect(BLOCK_VOLUMES).toHaveLength(6);
  });

  it('all values are positive numbers between 0.4 and 1.5', () => {
    for (const v of BLOCK_VOLUMES) {
      expect(v).toBeGreaterThan(0.4);
      expect(v).toBeLessThanOrEqual(1.5);
    }
  });

  it('block 5 (deload) has the lowest volume', () => {
    // BLOCK_VOLUMES[4] = deload block
    const min = Math.min(...BLOCK_VOLUMES);
    expect(BLOCK_VOLUMES[4]).toBe(min);
  });
});

// ── computeMilitaryPhase ──────────────────────────────────────────────────────

describe('computeMilitaryPhase', () => {
  const baseCoach = {
    active: true,
    track: 'keuring',
    cluster_current: 3,
    cluster_target: 3,
    mode: 'fit',
    block_session_index: 0,
    block_number: 2,           // cyclePosn=2 avoids Cooper test override on block_session_index=0
    last_cooper_distance_m: 1000, // non-null skips first-ever Cooper test gate
    target_date: null,
    pack_weights_available_kg: [10],
  };

  it('block session index 0 → first session type (duurloop for keuring_mid)', () => {
    const result = computeMilitaryPhase({ ...baseCoach, block_session_index: 0 }, {}, '2026-05-04');
    expect(result.sessionType).toBe('duurloop');
    expect(result.sessionType).not.toBe('rust');
  });

  it('block session index 1 → second session type (kracht for keuring_mid)', () => {
    const result = computeMilitaryPhase({ ...baseCoach, block_session_index: 1 }, {}, '2026-05-04');
    expect(result.sessionType).toBe('kracht');
  });

  it('block session index 2 → interval session', () => {
    const result = computeMilitaryPhase({ ...baseCoach, block_session_index: 2 }, {}, '2026-05-04');
    expect(result.sessionType).toBe('interval');
  });

  it('block session index >= SESSIONS_PER_BLOCK → rest earned', () => {
    const result = computeMilitaryPhase({ ...baseCoach, block_session_index: 4 }, {}, '2026-05-04');
    expect(result.sessionType).toBe('rust');
  });

  it('recovery_mode check-in overrides to rest', () => {
    // computeMilitaryPhase reads checkIn.recovery_mode directly (plan.js pre-parses checkin_json)
    const checkIn = { recovery_mode: true };
    const result = computeMilitaryPhase({ ...baseCoach, block_session_index: 0 }, checkIn, '2026-05-04');
    expect(result.checkInOverride).toBe('recovery_mode');
    expect(result.sessionType).toBe('rust');
  });

  it('cyclePosn cycles through 1–6 across block_number values', () => {
    const positions = [1, 2, 3, 4, 5, 6, 7, 8].map(n =>
      computeMilitaryPhase({ ...baseCoach, block_number: n }, {}, '2026-05-04').cyclePosn
    );
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 1, 2]);
  });

  it('milVol for block 1 matches BLOCK_VOLUMES[0]', () => {
    const result = computeMilitaryPhase({ ...baseCoach, block_number: 1 }, {}, '2026-05-04');
    expect(result.milVol).toBe(BLOCK_VOLUMES[0]);
  });

  it('milVol for block 5 (deload) is the lowest volume', () => {
    const result = computeMilitaryPhase({ ...baseCoach, block_number: 5 }, {}, '2026-05-04');
    expect(result.milVol).toBe(BLOCK_VOLUMES[4]);
    expect(result.milVol).toBe(Math.min(...BLOCK_VOLUMES));
  });

  it('isPostAssessment is false when target_date is null', () => {
    const result = computeMilitaryPhase({ ...baseCoach, target_date: null }, {}, '2026-05-04');
    expect(result.isPostAssessment).toBe(false);
  });

  it('isPostAssessment is true when date is past target_date', () => {
    const result = computeMilitaryPhase(
      { ...baseCoach, mode: 'target', target_date: '2026-01-01' },
      {},
      '2026-05-04'
    );
    expect(result.isPostAssessment).toBe(true);
  });

  it('isPostAssessment is always false for open mode', () => {
    const result = computeMilitaryPhase(
      { ...baseCoach, mode: 'open', target_date: '2026-01-01' },
      {},
      '2026-05-04'
    );
    expect(result.isPostAssessment).toBe(false);
  });
});

// ── MIL_MARCH_KG ─────────────────────────────────────────────────────────────

describe('MIL_MARCH_KG', () => {
  it('all group keys present', () => {
    expect(MIL_MARCH_KG.keuring_low).toBeDefined();
    expect(MIL_MARCH_KG.keuring_mid).toBeDefined();
    expect(MIL_MARCH_KG.keuring_high).toBeDefined();
    expect(MIL_MARCH_KG.opleiding_low).toBeDefined();
    expect(MIL_MARCH_KG.opleiding_mid).toBeDefined();
    expect(MIL_MARCH_KG.opleiding_high).toBeDefined();
  });

  it('keuring max march weight increases from low to high group', () => {
    const maxLow  = Math.max(...MIL_MARCH_KG.keuring_low);
    const maxMid  = Math.max(...MIL_MARCH_KG.keuring_mid);
    const maxHigh = Math.max(...MIL_MARCH_KG.keuring_high);
    expect(maxMid).toBeGreaterThanOrEqual(maxLow);
    expect(maxHigh).toBeGreaterThanOrEqual(maxMid);
  });
});

// ── MIL_CLUSTER_RUN_PEAK ──────────────────────────────────────────────────────

describe('MIL_CLUSTER_RUN_PEAK', () => {
  it('all tracks have entries for each cluster level', () => {
    for (const [track, peaks] of Object.entries(MIL_CLUSTER_RUN_PEAK)) {
      expect(Object.keys(peaks).length).toBeGreaterThan(0, `${track} missing cluster levels`);
    }
  });
});
