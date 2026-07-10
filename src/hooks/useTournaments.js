import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { PLAYERS } from '../data/players';

function getAllMatchups(players) {
  const matchups = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matchups.push({ p1: players[i], p2: players[j] });
    }
  }
  return matchups;
}

export function useTournaments(allMatches) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTournamentId, setActiveTournamentId] = useState(() => {
    return localStorage.getItem('ligafc_active_tournament_id') || null;
  });

  // Persistir el torneo activo seleccionado en localStorage (solo preferencia de UI)
  useEffect(() => {
    if (activeTournamentId) {
      localStorage.setItem('ligafc_active_tournament_id', activeTournamentId);
    } else {
      localStorage.removeItem('ligafc_active_tournament_id');
    }
  }, [activeTournamentId]);

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('torneos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTournaments(data || []);
    } catch (err) {
      console.error('Error al cargar torneos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const activeTournament = useMemo(() => {
    return tournaments.find(t => t.id === activeTournamentId) || null;
  }, [tournaments, activeTournamentId]);

  // Calcular tabla de posiciones basada en torneo_id del partido
  const standings = useMemo(() => {
    if (!activeTournament || !allMatches) return [];

    const tMatches = allMatches.filter(m => m.torneo_id === activeTournament.id);

    const playerStats = {};
    PLAYERS.forEach(p => {
      playerStats[p] = { player: p, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    tMatches.forEach(m => {
      const p1 = m.jugador_1.trim();
      const p2 = m.jugador_2.trim();
      const g1 = m.goles_1;
      const g2 = m.goles_2;

      if (!playerStats[p1]) playerStats[p1] = { player: p1, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      if (!playerStats[p2]) playerStats[p2] = { player: p2, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

      playerStats[p1].pld++;
      playerStats[p1].gf += g1;
      playerStats[p1].ga += g2;

      playerStats[p2].pld++;
      playerStats[p2].gf += g2;
      playerStats[p2].ga += g1;

      if (g1 > g2) {
        playerStats[p1].w++; playerStats[p1].pts += 3;
        playerStats[p2].l++;
      } else if (g1 < g2) {
        playerStats[p2].w++; playerStats[p2].pts += 3;
        playerStats[p1].l++;
      } else {
        playerStats[p1].d++; playerStats[p1].pts += 1;
        playerStats[p2].d++; playerStats[p2].pts += 1;
      }
    });

    Object.values(playerStats).forEach(s => { s.gd = s.gf - s.ga; });

    return Object.values(playerStats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }, [activeTournament, allMatches]);

  // Partidos pendientes: combinaciones posibles que aún no se jugaron en el torneo activo
  const pendingMatches = useMemo(() => {
    if (!activeTournament || !allMatches) return [];

    const tMatches = allMatches.filter(m => m.torneo_id === activeTournament.id);
    const allMatchups = getAllMatchups(PLAYERS);

    return allMatchups.filter(matchup => {
      return !tMatches.some(m => {
        const mp1 = m.jugador_1.trim().toLowerCase();
        const mp2 = m.jugador_2.trim().toLowerCase();
        const mp1low = matchup.p1.toLowerCase();
        const mp2low = matchup.p2.toLowerCase();
        return (mp1 === mp1low && mp2 === mp2low) || (mp1 === mp2low && mp2 === mp1low);
      });
    });
  }, [activeTournament, allMatches]);

  const addTournament = async (tournament) => {
    try {
      const { data, error } = await supabase
        .from('torneos')
        .insert([{
          nombre: tournament.name,
          fecha_inicio: tournament.startDate,
          fecha_fin: tournament.endDate,
        }])
        .select();
      if (error) throw error;
      if (data && data[0]) {
        setTournaments(prev => [data[0], ...prev]);
        setActiveTournamentId(data[0].id);
      }
      return { success: true };
    } catch (err) {
      console.error('Error al crear torneo:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteTournament = async (id) => {
    try {
      const { error } = await supabase.from('torneos').delete().eq('id', id);
      if (error) throw error;
      setTournaments(prev => prev.filter(t => t.id !== id));
      if (activeTournamentId === id) setActiveTournamentId(null);
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar torneo:', err);
      return { success: false };
    }
  };

  return {
    tournaments,
    loading,
    activeTournamentId,
    setActiveTournamentId,
    activeTournament,
    standings,
    pendingMatches,
    addTournament,
    deleteTournament,
    refresh: fetchTournaments,
  };
}
