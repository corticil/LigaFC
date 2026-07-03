import { getTeamById } from '../data/teams';
import { Award, BarChart3, HelpCircle, TrendingUp, Flame, Star } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const { totalMatches, avgGoals, biggestWin, topScorer, h2h } = stats;

  if (totalMatches === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Partidos Jugados</p>
            <p className="text-xl font-bold text-white mt-1">0</p>
          </div>
          <BarChart3 className="w-8 h-8 text-zinc-700" />
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Promedio de Goles</p>
            <p className="text-xl font-bold text-white mt-1">0.0</p>
          </div>
          <TrendingUp className="w-8 h-8 text-zinc-700" />
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Mayor Victoria</p>
            <p className="text-xs text-zinc-400 mt-1">N/A</p>
          </div>
          <Award className="w-8 h-8 text-zinc-700" />
        </div>
      </div>
    );
  }

  // Si hay un H2H activo, mostramos el breakdown arriba de las estadísticas generales
  return (
    <div className="space-y-4">
      {/* Visualización de Cara a Cara (Head-to-Head Breakdown) */}
      {h2h && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/80 border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Análisis Cara a Cara
          </h3>

          <div className="flex items-center justify-between text-sm text-white mb-2 font-semibold">
            <div className="text-left">
              <span>{h2h.player1}</span>
              <span className="block text-xl font-black text-indigo-400 mt-0.5">{h2h.p1Wins} <span className="text-xs text-zinc-500 font-normal">W</span></span>
            </div>
            <div className="text-center text-zinc-500 text-xs font-medium flex flex-col items-center">
              <span>{h2h.draws} Empates</span>
              <div className="mt-1">
                {h2h.winDiff === 0 ? (
                  <span className="text-[9px] bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-750 font-semibold tracking-wide">
                    Empate técnico
                  </span>
                ) : (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border tracking-wider uppercase ${
                    h2h.leader === h2h.player1
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                  }`}>
                    {h2h.leader} +{h2h.winDiff}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span>{h2h.player2}</span>
              <span className="block text-xl font-black text-purple-400 mt-0.5">{h2h.p2Wins} <span className="text-xs text-zinc-500 font-normal">W</span></span>
            </div>
          </div>

          {/* Barra de Porcentajes del H2H */}
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${h2h.p1WinPct}%` }}
              title={`${h2h.player1}: ${h2h.p1WinPct}%`}
            />
            <div 
              className="h-full bg-zinc-700 transition-all duration-500" 
              style={{ width: `${h2h.drawPct}%` }}
              title={`Empates: ${h2h.drawPct}%`}
            />
            <div 
              className="h-full bg-purple-500 transition-all duration-500" 
              style={{ width: `${h2h.p2WinPct}%` }}
              title={`${h2h.player2}: ${h2h.p2WinPct}%`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-medium">
            <span>{h2h.p1WinPct}% Victorias</span>
            <span>{h2h.drawPct}% Empatados</span>
            <span>{h2h.p2WinPct}% Victorias</span>
          </div>
        </div>
      )}

      {/* Grid de Estadísticas */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${h2h ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {/* Partidos Jugados */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Partidos Filtrados</p>
            <p className="text-2xl font-black text-white mt-1">{totalMatches}</p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Promedio de Goles */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-zinc-500 font-medium">Promedio Goles</p>
            <p className="text-2xl font-black text-white mt-1">{avgGoals}</p>
          </div>
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Mayor Victoria */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 font-medium">Mayor Goleada</p>
            {biggestWin ? (
              <div className="mt-1 truncate">
                <p className="text-sm font-bold text-emerald-400">
                  Diff: +{biggestWin.diff} ({biggestWin.match.goles_1} - {biggestWin.match.goles_2})
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {biggestWin.match.jugador_1} vs {biggestWin.match.jugador_2}
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold text-white mt-1">Sin diferencias</p>
            )}
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Máximo Goleador */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500 font-medium">Mayor Goleador (Partido)</p>
            {topScorer ? (
              <div className="mt-1 truncate">
                <p className="text-sm font-bold text-yellow-400">
                  {topScorer.player}: {topScorer.goals} <span className="text-[10px] text-zinc-500 font-normal">goles</span>
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  vs {topScorer.player === topScorer.match.jugador_1 ? topScorer.match.jugador_2 : topScorer.match.jugador_1}
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold text-white mt-1">N/A</p>
            )}
          </div>
          <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400">
            <Star className="w-6 h-6" />
          </div>
        </div>

        {/* Mayor Racha H2H */}
        {h2h && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-md">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 font-medium">Mayor Racha (H2H)</p>
              <div className="mt-1 flex flex-col gap-0.5">
                <p className="text-sm font-bold text-indigo-400 truncate">
                  {h2h.player1}: {h2h.p1MaxStreak} <span className="text-[10px] text-zinc-500 font-normal">wins</span>
                </p>
                <p className="text-sm font-bold text-purple-400 truncate">
                  {h2h.player2}: {h2h.p2MaxStreak} <span className="text-[10px] text-zinc-500 font-normal">wins</span>
                </p>
              </div>
            </div>
            <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 ml-2">
              <Flame className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
