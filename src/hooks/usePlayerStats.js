import { useMemo } from 'react';

const STATS_ORDER = [
  'Posesión',
  'Tiros',
  'Goles esperados',
  'Pases',
  'Entradas',
  'Entradas con éxito',
  'Recuperaciones',
  'Recuperación de balón',
  'Atajadas',
  'Faltas cometidas',
  'Fueras de lugar',
  'Tiros de esquina',
  'Tiros libres',
  'Penales',
  'Tarjetas amarillas',
];

const NORMALIZE_KEY = {
  posesion: 'Posesión',
  'posesión (%)': 'Posesión',
  '% de posesión': 'Posesión',
  posesion: 'Posesión',
  tiros: 'Tiros',
  'goles esperados': 'Goles esperados',
  goles_esperados: 'Goles esperados',
  pases: 'Pases',
  entradas: 'Entradas',
  'entradas con éxito': 'Entradas con éxito',
  entradas_con_exito: 'Entradas con éxito',
  recuperaciones: 'Recuperaciones',
  'recuperación de balón (seg.)': 'Recuperación de balón',
  recuperacion_de_balon: 'Recuperación de balón',
  atajadas: 'Atajadas',
  'faltas cometidas': 'Faltas cometidas',
  faltas_cometidas: 'Faltas cometidas',
  'fueras de lugar': 'Fueras de lugar',
  fueras_de_lugar: 'Fueras de lugar',
  'tiros de esquina': 'Tiros de esquina',
  tiros_de_esquina: 'Tiros de esquina',
  'tiros libres': 'Tiros libres',
  tiros_libres: 'Tiros libres',
  penales: 'Penales',
  'tarjetas amarillas': 'Tarjetas amarillas',
  tarjetas_amarillas: 'Tarjetas amarillas',
  'tasa de éxito en regates': 'Éxito en regates',
  'precisión de tiros': 'Precisión tiros',
  'precisión de pases': 'Precisión pases',
};

/**
 * Calcula estadísticas de un jugador on-demand a partir de partidos y stats.
 * Incluye datos de estadisticas_tabla (team-level) del lado del jugador.
 *
 * @param {string} playerName - Nombre del jugador a calcular
 * @param {Array} matches - Array de partidos_v2
 * @param {Function} getStatsForMatch - Función para obtener stats de un partido
 * @returns {{ playerStats: Object|null, loading: boolean }}
 */
export function usePlayerStats(playerName, matches, getStatsForMatch) {
  const playerStats = useMemo(() => {
    if (!playerName || !matches || matches.length === 0) return null;

    const playerMatches = matches.filter(
      m => m.jugador_1 === playerName || m.jugador_2 === playerName
    );

    if (playerMatches.length === 0) return null;

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsScored = 0;
    let goalsConceded = 0;

    let currentStreak = 0;
    let currentStreakType = null;
    let maxWinStreak = 0;
    let maxLoseStreak = 0;

    const precisionStats = { exito_regates: [], precision_tiros: [], precision_pases: [] };

    const rendimientoGeneral = { exito_regates: [], precision_tiros: [], precision_pases: [] };

    const tableStatsAccum = {};
    let tableStatsCount = 0;

    const sortedAsc = [...playerMatches].sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
      return a.created_at < b.created_at ? -1 : 1;
    });

    sortedAsc.forEach(m => {
      const isPlayer1 = m.jugador_1 === playerName;
      const playerGoals = isPlayer1 ? m.goles_1 : m.goles_2;
      const rivalGoals = isPlayer1 ? m.goles_2 : m.goles_1;
      goalsScored += playerGoals;
      goalsConceded += rivalGoals;

      let result;
      if (playerGoals > rivalGoals) {
        wins++;
        result = 'win';
      } else if (playerGoals < rivalGoals) {
        losses++;
        result = 'loss';
      } else {
        draws++;
        result = 'draw';
      }

      if (result === currentStreakType) {
        currentStreak++;
      } else {
        currentStreak = 1;
        currentStreakType = result;
      }
      if (result === 'win' && currentStreak > maxWinStreak) maxWinStreak = currentStreak;
      if (result === 'loss' && currentStreak > maxLoseStreak) maxLoseStreak = currentStreak;

      const matchStats = getStatsForMatch?.(m);

      if (matchStats?.jugadores_stats) {
        const psEntry = matchStats.jugadores_stats.find(
          j => j.nombre === playerName
        );
        if (psEntry) {
          const parsePercent = (v) => {
            const n = parseFloat(String(v).replace('%', ''));
            return isNaN(n) ? null : n;
          };
          const regates = parsePercent(psEntry.exito_regates);
          const tiros = parsePercent(psEntry.precision_tiros);
          const pases = parsePercent(psEntry.precision_pases);
          if (regates !== null) precisionStats.exito_regates.push(regates);
          if (tiros !== null) precisionStats.precision_tiros.push(tiros);
          if (pases !== null) precisionStats.precision_pases.push(pases);
        }
      }

      if (matchStats?.rendimiento_general) {
        const side = isPlayer1 ? 'local' : 'visitante';
        const rg = matchStats.rendimiento_general[side];
        if (rg) {
          const parsePercent = (v) => {
            const n = parseFloat(String(v).replace('%', ''));
            return isNaN(n) ? null : n;
          };
          const regates = parsePercent(rg.exito_regates);
          const tiros = parsePercent(rg.precision_tiros);
          const pases = parsePercent(rg.precision_pases);
          if (regates !== null) rendimientoGeneral.exito_regates.push(regates);
          if (tiros !== null) rendimientoGeneral.precision_tiros.push(tiros);
          if (pases !== null) rendimientoGeneral.precision_pases.push(pases);
        }
      }

      if (matchStats?.estadisticas_tabla) {
        const side = isPlayer1 ? 'local' : 'visitante';
        const tabla = matchStats.estadisticas_tabla;
        tableStatsCount++;
        Object.entries(tabla).forEach(([key, val]) => {
          const numVal = typeof val === 'object' && val !== null ? val[side] : val;
          const parsed = parseFloat(String(numVal).replace('%', '').replace(/[^\d.\-]/g, ''));
          if (!isNaN(parsed)) {
            const normalizedKey = NORMALIZE_KEY[key.toLowerCase()] || key;
            if (!tableStatsAccum[normalizedKey]) tableStatsAccum[normalizedKey] = [];
            tableStatsAccum[normalizedKey].push(parsed);
          }
        });
      }
    });

    const total = playerMatches.length;
    const avgGoals = total > 0 ? (goalsScored / total).toFixed(1) : '0.0';
    const winPct = total > 0 ? ((wins / total) * 100).toFixed(0) : '0';

    const avg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(0) : null;

    const lastMatch = sortedAsc[sortedAsc.length - 1];

    const estadisticasTablaAvg = {};
    Object.entries(tableStatsAccum).forEach(([key, values]) => {
      const avgVal = avg(values);
      if (avgVal !== null) {
        const sum = values.reduce((a, b) => a + b, 0);
        estadisticasTablaAvg[key] = { value: avgVal, sum, count: values.length };
      }
    });

    const sortedTableStats = STATS_ORDER
      .filter(key => estadisticasTablaAvg[key] !== undefined)
      .map(key => ({ key, ...estadisticasTablaAvg[key] }));

    Object.entries(estadisticasTablaAvg).forEach(([key]) => {
      if (!STATS_ORDER.includes(key)) {
        sortedTableStats.push({ key, ...estadisticasTablaAvg[key] });
      }
    });

    return {
      playerName,
      totalMatches: total,
      goalsScored,
      goalsConceded,
      avgGoals,
      wins,
      draws,
      losses,
      winPct,
      maxWinStreak,
      maxLoseStreak,
      streakCurrent: currentStreak,
      streakType: currentStreakType,
      avgRegates: avg(precisionStats.exito_regates),
      avgTiros: avg(precisionStats.precision_tiros),
      avgPases: avg(precisionStats.precision_pases),
      avgRgRegates: avg(rendimientoGeneral.exito_regates),
      avgRgTiros: avg(rendimientoGeneral.precision_tiros),
      avgRgPases: avg(rendimientoGeneral.precision_pases),
      lastMatch,
      estadisticasTablaAvg: sortedTableStats,
    };
  }, [playerName, matches, getStatsForMatch]);

  return { playerStats, loading: false };
}
