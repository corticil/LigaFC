import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../config/supabaseClient';

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los filtros
  const [h2hPlayer1, setH2hPlayer1] = useState('');
  const [h2hPlayer2, setH2hPlayer2] = useState('');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Cargar partidos al iniciar
  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('partidos')
        .select('*')
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

  // Agregar un partido
  const addMatch = async (matchData) => {
    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('partidos')
        .insert([
          {
            jugador_1: matchData.jugador_1.trim(),
            jugador_2: matchData.jugador_2.trim(),
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
      
      // Actualizar el estado local agregando el nuevo partido
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

  // Eliminar un partido
  const deleteMatch = async (id) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('partidos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Filtrar del estado local
      setMatches(prev => prev.filter(m => m.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar el partido:', err);
      setError(err.message || 'Error al eliminar el partido');
      return { success: false, error: err.message };
    }
  };

  // Obtener lista única de todos los jugadores registrados (para los filtros dropdown)
  const uniquePlayers = useMemo(() => {
    const players = new Set();
    matches.forEach(m => {
      if (m.jugador_1) players.add(m.jugador_1.trim());
      if (m.jugador_2) players.add(m.jugador_2.trim());
    });
    return Array.from(players).sort((a, b) => a.localeCompare(b));
  }, [matches]);

  // Lógica de Filtrado Desacoplada
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // 1. Filtro Head-to-Head (Mutuo o Individual)
      const p1Filter = h2hPlayer1.trim().toLowerCase();
      const p2Filter = h2hPlayer2.trim().toLowerCase();
      
      const mP1 = match.jugador_1.toLowerCase();
      const mP2 = match.jugador_2.toLowerCase();

      if (p1Filter && p2Filter) {
        // Filtro H2H estricto: Jugador A contra Jugador B (cualquiera de los dos lados)
        const matchSideA = (mP1 === p1Filter && mP2 === p2Filter);
        const matchSideB = (mP1 === p2Filter && mP2 === p1Filter);
        if (!matchSideA && !matchSideB) return false;
      } else if (p1Filter) {
        // Filtro individual Jugador 1
        if (mP1 !== p1Filter && mP2 !== p1Filter) return false;
      } else if (p2Filter) {
        // Filtro individual Jugador 2
        if (mP1 !== p2Filter && mP2 !== p2Filter) return false;
      }

      // 2. Filtro por Equipo
      if (filterTeamId) {
        if (match.equipo_1_id !== filterTeamId && match.equipo_2_id !== filterTeamId) {
          return false;
        }
      }

      // 3. Filtro por Fecha
      if (filterDateFrom && match.fecha < filterDateFrom) return false;
      if (filterDateTo && match.fecha > filterDateTo) return false;

      return true;
    });
  }, [matches, h2hPlayer1, h2hPlayer2, filterTeamId, filterDateFrom, filterDateTo]);

  // Cómputo de Estadísticas del historial filtrado o general
  const stats = useMemo(() => {
    const total = filteredMatches.length;
    if (total === 0) {
      return {
        totalMatches: 0,
        avgGoals: 0,
        biggestWin: null,
        topScorer: null,
        h2h: null
      };
    }

    let totalGoals = 0;
    let maxDiff = -1;
    let biggestWinMatch = null;
    
    let maxGoalsInSingleMatch = -1;
    let topScorerInSingleMatch = null;

    // Métricas para H2H si están ambos jugadores seleccionados
    let p1Wins = 0;
    let p2Wins = 0;
    let draws = 0;
    
    let p1MaxStreak = 0;
    let p2MaxStreak = 0;
    let currentStreakPlayer = null;
    let currentStreakCount = 0;

    const p1Filter = h2hPlayer1.trim().toLowerCase();
    const p2Filter = h2hPlayer2.trim().toLowerCase();

    // Iteramos de más antiguo a más reciente para calcular rachas correctamente
    const chronologicalMatches = [...filteredMatches].reverse();

    chronologicalMatches.forEach(m => {
      const g1 = m.goles_1;
      const g2 = m.goles_2;
      totalGoals += (g1 + g2);

      // Victoria más abultada
      const diff = Math.abs(g1 - g2);
      if (diff > maxDiff) {
        maxDiff = diff;
        biggestWinMatch = m;
      }

      // Máximo Goleador en un Partido
      if (g1 > maxGoalsInSingleMatch) {
        maxGoalsInSingleMatch = g1;
        topScorerInSingleMatch = { player: m.jugador_1, goals: g1, match: m };
      }
      if (g2 > maxGoalsInSingleMatch) {
        maxGoalsInSingleMatch = g2;
        topScorerInSingleMatch = { player: m.jugador_2, goals: g2, match: m };
      }

      // Estadísticas H2H
      if (p1Filter && p2Filter) {
        const isP1Jugador1 = m.jugador_1.toLowerCase() === p1Filter;
        if (g1 === g2) {
          draws++;
          currentStreakPlayer = null;
          currentStreakCount = 0;
        } else {
          const winner = (g1 > g2) ? (isP1Jugador1 ? 'p1' : 'p2') : (isP1Jugador1 ? 'p2' : 'p1');
          
          if (winner === 'p1') {
            p1Wins++;
          } else {
            p2Wins++;
          }

          if (currentStreakPlayer === winner) {
            currentStreakCount++;
          } else {
            currentStreakPlayer = winner;
            currentStreakCount = 1;
          }

          if (winner === 'p1' && currentStreakCount > p1MaxStreak) {
            p1MaxStreak = currentStreakCount;
          } else if (winner === 'p2' && currentStreakCount > p2MaxStreak) {
            p2MaxStreak = currentStreakCount;
          }
        }
      }
    });

    return {
      totalMatches: total,
      avgGoals: (totalGoals / total).toFixed(1),
      biggestWin: biggestWinMatch ? {
        match: biggestWinMatch,
        diff: maxDiff
      } : null,
      topScorer: topScorerInSingleMatch ? topScorerInSingleMatch : null,
      h2h: (p1Filter && p2Filter) ? {
        player1: h2hPlayer1,
        player2: h2hPlayer2,
        p1Wins,
        p2Wins,
        draws,
        p1WinPct: ((p1Wins / total) * 100).toFixed(0),
        p2WinPct: ((p2Wins / total) * 100).toFixed(0),
        drawPct: ((draws / total) * 100).toFixed(0),
        winDiff: Math.abs(p1Wins - p2Wins),
        leader: p1Wins > p2Wins ? h2hPlayer1 : p2Wins > p1Wins ? h2hPlayer2 : null,
        p1MaxStreak,
        p2MaxStreak
      } : null
    };
  }, [filteredMatches, h2hPlayer1, h2hPlayer2]);

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
