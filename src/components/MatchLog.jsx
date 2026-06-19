import { teams, getTeamById } from '../data/teams';
import { PLAYERS } from '../data/players';
import { Calendar, Trash2, Users, Shield, RotateCcw, AlertCircle } from 'lucide-react';

export default function MatchLog({ 
  filteredMatches, 
  filters, 
  onDeleteMatch,
  loading,
  error
}) {
  const {
    h2hPlayer1,
    setH2hPlayer1,
    h2hPlayer2,
    setH2hPlayer2,
    filterTeamId,
    setFilterTeamId,
    clearFilters
  } = filters;

  const hasActiveFilters = h2hPlayer1 || h2hPlayer2 || filterTeamId;

  // Formatear fecha de forma legible
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00'); // Evitar desajustes de zona horaria
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Contenedor de Filtros */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Filtros y Búsqueda</h2>
              <p className="text-xs text-zinc-500">Filtra partidos cara a cara o por tu equipo favorito</p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filtro Head to Head */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtro Head-to-Head (Cara a Cara)</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={h2hPlayer1}
                  onChange={(e) => setH2hPlayer1(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Jugador 1 --</option>
                  {PLAYERS.map(player => (
                    <option key={`p1-${player}`} value={player}>
                      {player}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-bold text-zinc-600">VS</span>

              <div className="flex-1">
                <select
                  value={h2hPlayer2}
                  onChange={(e) => setH2hPlayer2(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Jugador 2 --</option>
                  {PLAYERS.map(player => (
                    <option 
                      key={`p2-${player}`} 
                      value={player}
                      disabled={player === h2hPlayer1}
                    >
                      {player}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filtro por Equipo */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtro por Equipo</h3>
            <div className="relative">
              <select
                value={filterTeamId}
                onChange={(e) => setFilterTeamId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">-- Todos los equipos --</option>
                {teams.map(team => (
                  <option key={`filter-${team.id}`} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Partidos */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">
          Historial de Partidos ({filteredMatches.length})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
            <p className="text-sm text-zinc-500">Cargando partidos...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
            <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium">No se encontraron partidos</p>
            <p className="text-xs text-zinc-600 mt-1">Registra un partido en la pestaña de registro o cambia los filtros.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => {
              const team1 = getTeamById(match.equipo_1_id);
              const team2 = getTeamById(match.equipo_2_id);

              const winner = match.goles_1 > match.goles_2 ? 1 : match.goles_1 < match.goles_2 ? 2 : 0;

              return (
                <div 
                  key={match.id}
                  className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 transition-all duration-300 shadow-md group relative overflow-hidden"
                >
                  {/* Tarjeta del Encuentro */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Jugador 1 y Equipo */}
                    <div className={`flex items-center justify-end flex-1 w-full gap-3 ${winner === 1 ? 'opacity-100' : winner === 2 ? 'opacity-50' : 'opacity-90'}`}>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white tracking-wide">{match.jugador_1}</p>
                        <p className="text-xs text-zinc-500">{team1?.name || 'Equipo Desconocido'}</p>
                      </div>
                      <div className="w-10 h-10 bg-zinc-950 rounded-lg p-1.5 flex items-center justify-center border border-zinc-800/80">
                        {team1 ? (
                          <img 
                            src={team1.logoUrl} 
                            alt={team1.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = 'https://crests.football-data.org/none.png'; }}
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    </div>

                    {/* Marcador */}
                    <div className="flex flex-col items-center justify-center min-w-[100px]">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-black px-3 py-1 rounded-lg ${
                          winner === 1 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800/50'
                        }`}>
                          {match.goles_1}
                        </span>
                        <span className="text-xs font-semibold text-zinc-600">-</span>
                        <span className={`text-2xl font-black px-3 py-1 rounded-lg ${
                          winner === 2 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800/50'
                        }`}>
                          {match.goles_2}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-500">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        <span>{formatDate(match.fecha)}</span>
                      </div>
                    </div>

                    {/* Jugador 2 y Equipo */}
                    <div className={`flex items-center justify-start flex-1 w-full gap-3 ${winner === 2 ? 'opacity-100' : winner === 1 ? 'opacity-50' : 'opacity-90'}`}>
                      <div className="w-10 h-10 bg-zinc-950 rounded-lg p-1.5 flex items-center justify-center border border-zinc-800/80">
                        {team2 ? (
                          <img 
                            src={team2.logoUrl} 
                            alt={team2.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = 'https://crests.football-data.org/none.png'; }}
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white tracking-wide">{match.jugador_2}</p>
                        <p className="text-xs text-zinc-500">{team2?.name || 'Equipo Desconocido'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notas del Partido */}
                  {match.nota && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-start gap-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded tracking-wider mt-0.5">Nota</span>
                      <p className="text-xs text-zinc-400 italic">"{match.nota}"</p>
                    </div>
                  )}

                  {/* Botón de eliminar (visible al hacer hover) */}
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de que quieres eliminar este partido?')) {
                        onDeleteMatch(match.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Eliminar partido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
