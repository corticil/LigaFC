import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabaseClient';

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state — now uses player IDs
  const [h2hPlayer1, setH2hPlayer1] = useState('');
  const [h2hPlayer2, setH2hPlayer2] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('partidos_v2')
        .select('*')
        .is('eliminado_en', null)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMatches(data || []);
    } catch (err) {
      console.error('Error al obtener los partidos:', err);
      setError(err.message || 'Error al obtener el historial de partidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const addMatch = async (matchData) => {
    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('partidos_v2')
        .insert([
          {
            jugador_1: matchData.jugador_1.trim(),
            jugador_2: matchData.jugador_2.trim(),
            jugador_1_id: matchData.jugador_1_id || null,
            jugador_2_id: matchData.jugador_2_id || null,
            equipo_1_id: matchData.equipo_1_id,
            equipo_2_id: matchData.equipo_2_id,
            goles_1: parseInt(matchData.goles_1, 10),
            goles_2: parseInt(matchData.goles_2, 10),
            nota: matchData.nota ? matchData.nota.trim() : '',
            fecha: matchData.fecha || new Date().toISOString().split('T')[0],
            torneo_id: matchData.torneo_id || null,
          }
        ])
        .select();

      if (insertError) throw insertError;
      
      if (data && data[0]) {
        setMatches(prev => [data[0], ...prev]);
      } else {
        await fetchMatches();
      }
      return { success: true, data: data?.[0] };
    } catch (err) {
      console.error('Error al registrar el partido:', err);
      setError(err.message || 'Error al registrar el partido');
      return { success: false, error: err.message };
    }
  };

  const deleteMatch = async (id) => {
    try {
      setError(null);
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('partidos_v2')
        .update({ eliminado_en: now })
        .eq('id', id);

      if (updateError) throw updateError;

      await supabase
        .from('partidos_stats_v2')
        .update({ eliminado_en: now })
        .eq('partido_id', id);

      setMatches(prev => prev.filter(m => m.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar el partido:', err);
      setError(err.message || 'Error al eliminar el partido');
      return { success: false, error: err.message };
    }
  };

  // Unique players derived from matches — uses IDs with name fallback
  const uniquePlayers = useMemo(() => {
    const playerMap = new Map();
    matches.forEach(m => {
      const id1 = m.jugador_1_id || m.jugador_1;
      const name1 = m.jugador_1 || 'Desconocido';
      const id2 = m.jugador_2_id || m.jugador_2;
      const name2 = m.jugador_2 || 'Desconocido';

      if (id1 && !playerMap.has(id1)) playerMap.set(id1, { id: id1, nombre: name1 });
      if (id2 && !playerMap.has(id2)) playerMap.set(id2, { id: id2, nombre: name2 });
    });
    return Array.from(playerMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [matches]);

  // Filtered matches — now filters by player ID
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // 1. H2H filter
      if (h2hPlayer1 || h2hPlayer2) {
        const mP1 = match.jugador_1_id || match.jugador_1;
        const mP2 = match.jugador_2_id || match.jugador_2;

        if (h2hPlayer1 && h2hPlayer2) {
          const matchSideA = (mP1 === h2hPlayer1 && mP2 === h2hPlayer2);
          const matchSideB = (mP1 === h2hPlayer2 && mP2 === h2hPlayer1);
          if (!matchSideA && !matchSideB) return false;
        } else if (h2hPlayer1) {
          if (mP1 !== h2hPlayer1 && mP2 !== h2hPlayer1) return false;
        } else if (h2hPlayer2) {
          if (mP1 !== h2hPlayer2 && mP2 !== h2hPlayer2) return false;
        }
      }

      // 2. Team filter
      if (filterTeamId) {
        if (match.equipo_1_id !== filterTeamId && match.equipo_2_id !== filterTeamId) {
          return false;
        }
      }

      // 3. Date filter
      if (filterDateFrom && match.fecha < filterDateFrom) return false;
      if (filterDateTo && match.fecha > filterDateTo) return false;

      return true;
    });
  }, [matches, h2hPlayer1, h2hPlayer2, filterTeamId, filterDateFrom, filterDateTo]);

  // Stats computation
  const stats = useMemo(() => {
    const total = filteredMatches.length;
    if (total === 0) {
      return { totalMatches: 0, avgGoals: 0, biggestWin: null, topScorer: null, h2h: null };
    }

    let totalGoals = 0;
    let maxDiff = -1;
    let biggestWinMatch = null;
    let maxGoalsInSingleMatch = -1;
    let topScorerInSingleMatch = null;

    let p1Wins = 0;
    let p2Wins = 0;
    let draws = 0;
    let p1MaxStreak = 0;
    let p2MaxStreak = 0;
    let currentStreakPlayer = null;
    let currentStreakCount = 0;

    const chronologicalMatches = [...filteredMatches].reverse();

    chronologicalMatches.forEach(m => {
      const g1 = m.goles_1;
      const g2 = m.goles_2;
      totalGoals += (g1 + g2);

      const diff = Math.abs(g1 - g2);
      if (diff > maxDiff) {
        maxDiff = diff;
        biggestWinMatch = m;
      }

      if (g1 > maxGoalsInSingleMatch) {
        maxGoalsInSingleMatch = g1;
        topScorerInSingleMatch = { player: m.jugador_1, goals: g1, match: m };
      }
      if (g2 > maxGoalsInSingleMatch) {
        maxGoalsInSingleMatch = g2;
        topScorerInSingleMatch = { player: m.jugador_2, goals: g2, match: m };
      }

      // H2H stats — filter by player ID
      if (h2hPlayer1 && h2hPlayer2) {
        const mP1 = m.jugador_1_id || m.jugador_1;
        const isP1 = mP1 === h2hPlayer1;

        if (g1 === g2) {
          draws++;
          currentStreakPlayer = null;
          currentStreakCount = 0;
        } else {
          const winner = (g1 > g2) ? (isP1 ? 'p1' : 'p2') : (isP1 ? 'p2' : 'p1');
          
          if (winner === 'p1') p1Wins++;
          else p2Wins++;

          if (currentStreakPlayer === winner) currentStreakCount++;
          else { currentStreakPlayer = winner; currentStreakCount = 1; }

          if (winner === 'p1' && currentStreakCount > p1MaxStreak) p1MaxStreak = currentStreakCount;
          else if (winner === 'p2' && currentStreakCount > p2MaxStreak) p2MaxStreak = currentStreakCount;
        }
      }
    });

    // Resolve player names from IDs for H2H display
    const p1Name = uniquePlayers.find(p => p.id === h2hPlayer1)?.nombre || h2hPlayer1;
    const p2Name = uniquePlayers.find(p => p.id === h2hPlayer2)?.nombre || h2hPlayer2;

    return {
      totalMatches: total,
      avgGoals: (totalGoals / total).toFixed(1),
      biggestWin: biggestWinMatch ? { match: biggestWinMatch, diff: maxDiff } : null,
      topScorer: topScorerInSingleMatch || null,
      h2h: (h2hPlayer1 && h2hPlayer2) ? {
        player1: p1Name,
        player2: p2Name,
        p1Wins, p2Wins, draws,
        p1WinPct: ((p1Wins / total) * 100).toFixed(0),
        p2WinPct: ((p2Wins / total) * 100).toFixed(0),
        drawPct: ((draws / total) * 100).toFixed(0),
        winDiff: Math.abs(p1Wins - p2Wins),
        leader: p1Wins > p2Wins ? p1Name : p2Wins > p1Wins ? p2Name : null,
        p1MaxStreak, p2MaxStreak
      } : null
    };
  }, [filteredMatches, h2hPlayer1, h2hPlayer2, uniquePlayers]);

  return {
    matches,
    filteredMatches,
    uniquePlayers,
    loading,
    error,
    refresh: fetchMatches,
    addMatch,
    deleteMatch,
    filters: {
      h2hPlayer1,
      setH2hPlayer1,
      h2hPlayer2,
      setH2hPlayer2,
      filterTeamId,
      setFilterTeamId,
      filterDateFrom,
      setFilterDateFrom,
      filterDateTo,
      setFilterDateTo,
      clearFilters: () => {
        setH2hPlayer1('');
        setH2hPlayer2('');
        setFilterTeamId('');
        setFilterDateFrom('');
        setFilterDateTo('');
      }
    },
    stats
  };
}
