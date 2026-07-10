import { BarChart3, User, X } from 'lucide-react';
import { getTeamById } from '../data/teams';

/**
 * MatchStatsModal: Modal que muestra las estadísticas detalladas de un partido
 * - Scoreboard con equipos, jugadores y marcador
 * - Estadísticas generales (posesión, tiros, etc.)
 * - Rendimiento por equipo (regates, precisión tiros, precisión pases)
 * - Stats individuales por jugador (si la IA los detectó)
 */
export default function MatchStatsModal({ match, stats, onClose }) {
  if (!match || !stats) return null;

  const team1 = getTeamById(match.equipo_1_id);
  const team2 = getTeamById(match.equipo_2_id);

  const statsTable = stats.estadisticas_tabla;
  const rendimiento = stats.rendimiento_general;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Estadísticas del Partido
          </h3>
          <button onClick={onClose} className="p-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 text-right">
                <p className="text-xs text-zinc-500">{match.jugador_1}</p>
                <p className="text-sm font-bold text-white">{team1?.name || 'Local'}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">{match.goles_1}</span>
                <span className="text-base text-zinc-600 font-bold">-</span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-400">{match.goles_2}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-zinc-500">{match.jugador_2}</p>
                <p className="text-sm font-bold text-white">{team2?.name || 'Visitante'}</p>
              </div>
            </div>
            {stats.tiempo_partido && (
              <p className="text-[10px] text-zinc-500 mt-1.5">{stats.tiempo_partido}</p>
            )}
          </div>

          {statsTable && Object.keys(statsTable).length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estadísticas</span>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {Object.entries(statsTable).map(([metrica, valores]) => (
                  <div key={metrica} className="grid grid-cols-3 gap-3 px-4 py-2.5 items-center hover:bg-zinc-800/20 transition-colors">
                    <div className="text-right"><span className="text-xs font-bold text-emerald-400">{valores.local}</span></div>
                    <div className="text-center"><span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{metrica}</span></div>
                    <div className="text-left"><span className="text-xs font-bold text-indigo-400">{valores.visitante}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rendimiento && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
                <BarChart3 className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Rendimiento</span>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {['exito_regates', 'precision_tiros', 'precision_pases'].map((key) => (
                  <div key={key} className="grid grid-cols-3 gap-3 px-4 py-2.5 items-center hover:bg-zinc-800/20 transition-colors">
                    <div className="text-right"><span className="text-xs font-bold text-emerald-400">{rendimiento.local?.[key] || '-'}</span></div>
                    <div className="text-center"><span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                      {key === 'exito_regates' ? 'Regates' : key === 'precision_tiros' ? 'Precisión Tiros' : 'Precisión Pases'}
                    </span></div>
                    <div className="text-left"><span className="text-xs font-bold text-indigo-400">{rendimiento.visitante?.[key] || '-'}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.jugadores_stats?.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
                <User className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stats por Jugador</span>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {stats.jugadores_stats.map((j, i) => (
                  <div key={i} className="px-4 py-3 space-y-2 hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${j.equipo === 'local' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                      <span className="text-xs font-bold text-white">{j.nombre}</span>
                      <span className="text-[10px] text-zinc-500">{j.equipo === 'local' ? 'Local' : 'Visitante'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-zinc-950 rounded-lg py-1.5">
                        <p className="text-[10px] text-zinc-500">Regates</p>
                        <p className="text-xs font-bold text-emerald-400">{j.exito_regates || '-'}</p>
                      </div>
                      <div className="bg-zinc-950 rounded-lg py-1.5">
                        <p className="text-[10px] text-zinc-500">Prec. Tiros</p>
                        <p className="text-xs font-bold text-yellow-400">{j.precision_tiros || '-'}</p>
                      </div>
                      <div className="bg-zinc-950 rounded-lg py-1.5">
                        <p className="text-[10px] text-zinc-500">Prec. Pases</p>
                        <p className="text-xs font-bold text-sky-400">{j.precision_pases || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
