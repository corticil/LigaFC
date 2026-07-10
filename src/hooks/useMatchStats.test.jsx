import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMatchStats } from './useMatchStats';
import { supabase } from '../config/supabaseClient';

vi.mock('../data/teams', () => ({
  getTeamById: (id) => {
    const teams = { 'eq-1': { name: 'Real Madrid' }, 'eq-2': { name: 'Barcelona' } };
    return teams[id] || null;
  },
}));

const mockStatsFromDB = [
  {
    id: 's1',
    partido_id: 'p1',
    nombre_local: 'Real Madrid',
    nombre_visitante: 'Barcelona',
    goles_local: 2,
    goles_visitante: 1,
    estadisticas_tabla: {},
    rendimiento_general: {},
    jugadores_stats: [],
  },
  {
    id: 's2',
    partido_id: null,
    nombre_local: 'Real Madrid',
    nombre_visitante: 'Barcelona',
    goles_local: 2,
    goles_visitante: 1,
    estadisticas_tabla: {},
    rendimiento_general: {},
    jugadores_stats: [],
  },
];

describe('useMatchStats', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads stats on mount', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => Promise.resolve({ data: mockStatsFromDB, error: null }),
    });

    const { result } = renderHook(() => useMatchStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allStats).toHaveLength(2);
  });

  it('getStatsForMatch finds stats by partido_id', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => Promise.resolve({ data: mockStatsFromDB, error: null }),
    });

    const { result } = renderHook(() => useMatchStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const match = { id: 'p1', equipo_1_id: 'eq-1', equipo_2_id: 'eq-2', goles_1: 2, goles_2: 1 };
    const stats = result.current.getStatsForMatch(match);
    expect(stats).not.toBeNull();
    expect(stats.id).toBe('s1');
  });

  it('getStatsForMatch falls back to team name + score match', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => Promise.resolve({ data: mockStatsFromDB, error: null }),
    });

    const { result } = renderHook(() => useMatchStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const match = { id: 'p99', equipo_1_id: 'eq-1', equipo_2_id: 'eq-2', goles_1: 2, goles_2: 1 };
    const stats = result.current.getStatsForMatch(match);
    expect(stats).not.toBeNull();
    // First match by team name + score (s1 also matches, comes first in array)
    expect(stats.id).toBe('s1');
  });

  it('getStatsForMatch returns null when no match found', async () => {
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: () => Promise.resolve({ data: [], error: null }),
    });

    const { result } = renderHook(() => useMatchStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const match = { id: 'p99', equipo_1_id: 'eq-1', equipo_2_id: 'eq-2', goles_1: 5, goles_2: 0 };
    const stats = result.current.getStatsForMatch(match);
    expect(stats).toBeNull();
  });
});
