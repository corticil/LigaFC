import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { getTeamById } from '../data/teams';

/**
 * Hook personalizado para cargar y consultar estadísticas de partidos
 *
 * Busca las stats de un partido primero por FK (partido_id),
 * y si no encuentra, hace fallback por nombre de equipo y marcador
 * (para datos antiguos que no tienen la relación FK)
 *
 * @returns {{ allStats: Array, getStatsForMatch: Function, loading: boolean }}
 */
export function useMatchStats() {
  const [allStats, setAllStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carga todas las estadísticas al montar el componente
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('partidos_stats')
          .select('*');
        if (error) throw error;
        setAllStats(data || []);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  /**
   * Encuentra las estadísticas correspondientes a un partido
   * @param {Object} match - Partido del cual buscar stats
   * @returns {Object|null}
   */
  const getStatsForMatch = (match) => {
    // 1. Busca por FK directo (partido_id)
    const byId = allStats.find(s => s.partido_id === match.id);
    if (byId) return byId;

    // 2. Fallback: compara nombres de equipo + marcador
    const team1 = getTeamById(match.equipo_1_id);
    const team2 = getTeamById(match.equipo_2_id);

    return allStats.find(s =>
      s.goles_local === match.goles_1 &&
      s.goles_visitante === match.goles_2 &&
      team1 && team2 &&
      (s.nombre_local && s.nombre_local.toLowerCase().includes(team1.name.toLowerCase().split(' ')[0].toLowerCase())) &&
      (s.nombre_visitante && s.nombre_visitante.toLowerCase().includes(team2.name.toLowerCase().split(' ')[0].toLowerCase()))
    ) || null;
  };

  return { allStats, getStatsForMatch, loading };
}
