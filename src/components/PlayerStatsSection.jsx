import { User, TrendingUp, Target, Crosshair, Footprints, Calendar, Flame, Trophy, BarChart3 } from 'lucide-react';
import { getTeamById } from '../data/teams';

const TABLE_LABELS = {
  'Posesión': '%',
  'Recuperación de balón': '',
  'Tiros': '',
  'Goles esperados': '',
  'Pases': '',
  'Entradas': '',
  'Entradas con éxito': '',
  'Recuperaciones': '',
  'Atajadas': '',
  'Faltas cometidas': '',
  'Fueras de lugar': '',
  'Tiros de esquina': '',
  'Tiros libres': '',
  'Penales': '',
  'Tarjetas amarillas': '',
};

function ProgressBar({ value, color }) {
  const pct = Math.min(100, Math.max(0, parseInt(value) || 0));
  return (
    <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const COLOR_MAP = {
  emerald: 'bg-emerald-500/10 text-emerald-400',
  yellow: 'bg-yellow-500/10 text-yellow-400',
  indigo: 'bg-indigo-500/10 text-indigo-400',
  rose: 'bg-rose-500/10 text-rose-400',
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-md">
      <div>
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-white mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${COLOR_MAP[color] || ''}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

export default function PlayerStatsSection({ playerStats, resolveTeam }) {
  if (!playerStats) return null;

  console.log('[PlayerStatsSection] playerStats:', JSON.parse(JSON.stringify(playerStats)));

  const teamLookup = resolveTeam || getTeamById;
  const lastMatch = playerStats.lastMatch;
  const lastTeam1 = lastMatch ? teamLookup(lastMatch.equipo_1_id) : null;
  const lastTeam2 = lastMatch ? teamLookup(lastMatch.equipo_2_id) : null;
  const lastWinner = lastMatch
    ? lastMatch.goles_1 > lastMatch.goles_2 ? 1 : lastMatch.goles_1 < lastMatch.goles_2 ? 2 : 0
    : 0;
  const isPlayer1Last = lastMatch?.jugador_1 === playerStats.playerName;
  const lastResult = !lastMatch ? null
    : isPlayer1Last
      ? (lastMatch.goles_1 > lastMatch.goles_2 ? 'win' : lastMatch.goles_1 < lastMatch.goles_2 ? 'loss' : 'draw')
      : (lastMatch.goles_2 > lastMatch.goles_1 ? 'win' : lastMatch.goles_2 < lastMatch.goles_1 ? 'loss' : 'draw');

  return (
    <div className="space-y-4">
      {/* Grid de métricas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Partidos" value={playerStats.totalMatches} icon={Trophy} color="emerald" />
        <StatCard label="Goles" value={playerStats.goalsScored} icon={Crosshair} color="yellow" />
        <StatCard label="Prom. Goles" value={playerStats.avgGoals} icon={TrendingUp} color="indigo" />
        <StatCard label="% Victoria" value={`${playerStats.winPct}%`} icon={Flame} color="rose" />
      </div>

      {/* Récord */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Récord</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-zinc-800/50">
          <div className="px-4 py-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{playerStats.wins}</p>
            <p className="text-[10px] text-zinc-500 font-medium uppercase">Victorias</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-2xl font-black text-zinc-400">{playerStats.draws}</p>
            <p className="text-[10px] text-zinc-500 font-medium uppercase">Empates</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-2xl font-black text-rose-400">{playerStats.losses}</p>
            <p className="text-[10px] text-zinc-500 font-medium uppercase">Derrotas</p>
          </div>
        </div>
      </div>

      {/* Barra de proporción victoria/derrota */}
      {playerStats.totalMatches > 0 && (
        <div className="space-y-1">
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${playerStats.winPct}%` }}
            />
            <div
              className="h-full bg-zinc-700 transition-all duration-500"
              style={{ width: `${((playerStats.draws / playerStats.totalMatches) * 100).toFixed(0)}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${((playerStats.losses / playerStats.totalMatches) * 100).toFixed(0)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
            <span>{playerStats.winPct}% Victorias</span>
            <span>{((playerStats.draws / playerStats.totalMatches) * 100).toFixed(0)}% Empatados</span>
            <span>{((playerStats.losses / playerStats.totalMatches) * 100).toFixed(0)}% Derrotas</span>
          </div>
        </div>
      )}

      {/* Rachas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3">
          <p className="text-[10px] text-zinc-500 font-medium uppercase mb-1">Mejor Racha</p>
          <p className="text-lg font-black text-emerald-400">
            {playerStats.maxWinStreak} <span className="text-xs text-zinc-500 font-normal hidden sm:inline">victorias seguidas</span>
          </p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3">
          <p className="text-[10px] text-zinc-500 font-medium uppercase mb-1">Peor Racha</p>
          <p className="text-lg font-black text-rose-400">
            {playerStats.maxLoseStreak} <span className="text-xs text-zinc-500 font-normal hidden sm:inline">derrotas seguidas</span>
          </p>
        </div>
      </div>

      {/* Precisión promedio */}
      {(playerStats.avgRegates || playerStats.avgTiros || playerStats.avgPases) && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <Target className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Precisión Promedio</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {[
              { label: 'Regates', value: playerStats.avgRegates, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
              { label: 'Tiros', value: playerStats.avgTiros, color: 'bg-yellow-400', textColor: 'text-yellow-400' },
              { label: 'Pases', value: playerStats.avgPases, color: 'bg-sky-400', textColor: 'text-sky-400' },
            ].filter(s => s.value !== null).map(s => (
              <div key={s.label} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">{s.label}</span>
                  <span className={`text-sm font-bold ${s.textColor}`}>{s.value}%</span>
                </div>
                <ProgressBar value={s.value} color={s.color} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendimiento General del Equipo */}
      {(playerStats.avgRgRegates || playerStats.avgRgTiros || playerStats.avgRgPases) && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <Footprints className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Rendimiento General</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {[
              { label: 'Éxito Regates', value: playerStats.avgRgRegates, color: 'bg-violet-400', textColor: 'text-violet-400' },
              { label: 'Precisión Tiros', value: playerStats.avgRgTiros, color: 'bg-amber-400', textColor: 'text-amber-400' },
              { label: 'Precisión Pases', value: playerStats.avgRgPases, color: 'bg-cyan-400', textColor: 'text-cyan-400' },
            ].filter(s => s.value !== null).map(s => (
              <div key={s.label} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">{s.label}</span>
                  <span className={`text-sm font-bold ${s.textColor}`}>{s.value}%</span>
                </div>
                <ProgressBar value={s.value} color={s.color} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Último partido */}
      {lastMatch && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Último Partido</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 text-right min-w-0">
                <p className="text-xs font-bold text-white truncate">{lastMatch.jugador_1}</p>
                <p className="text-[10px] text-zinc-500 truncate">{lastTeam1?.name || ''}</p>
              </div>
              <div className="flex items-baseline gap-1.5 flex-shrink-0">
                <span className={`text-lg font-black ${lastWinner === 1 ? 'text-emerald-400' : 'text-zinc-400'}`}>{lastMatch.goles_1}</span>
                <span className="text-xs text-zinc-600 font-bold">-</span>
                <span className={`text-lg font-black ${lastWinner === 2 ? 'text-emerald-400' : 'text-zinc-400'}`}>{lastMatch.goles_2}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-white truncate">{lastMatch.jugador_2}</p>
                <p className="text-[10px] text-zinc-500 truncate">{lastTeam2?.name || ''}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                lastResult === 'win' ? 'bg-emerald-500/10 text-emerald-400' :
                lastResult === 'loss' ? 'bg-rose-500/10 text-rose-400' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {lastResult === 'win' ? 'Victoria' : lastResult === 'loss' ? 'Derrota' : 'Empate'}
              </span>
              <span className="text-[10px] text-zinc-600">{lastMatch.fecha}</span>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de tabla promediadas */}
      {playerStats.estadisticasTablaAvg?.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estadísticas Promedio</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-zinc-800/50">
            {playerStats.estadisticasTablaAvg.map(({ key, value }) => (
              <div key={key} className="px-3 py-2.5">
                <p className="text-[10px] text-zinc-500 font-medium uppercase truncate">{key}</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {value}{TABLE_LABELS[key] || ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
