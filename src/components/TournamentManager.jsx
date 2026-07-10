import { useState, useRef } from 'react';
import { Trophy, Plus, Trash2, Calendar, Crown, Medal, Swords, CheckCircle, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import { toPng } from 'html-to-image';
import { Download, Check } from 'lucide-react';

export default function TournamentManager({ 
  tournaments, 
  activeTournamentId, 
  setActiveTournamentId, 
  activeTournament, 
  standings, 
  pendingMatches,
  addTournament, 
  deleteTournament,
  allMatches = []
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTournament, setNewTournament] = useState({ name: '', startDate: '', endDate: '' });
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const tableRef = useRef(null);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTournament.name || !newTournament.startDate || !newTournament.endDate) return;
    addTournament(newTournament);
    setNewTournament({ name: '', startDate: '', endDate: '' });
    setShowForm(false);
  };

  const handleDownload = async () => {
    if (!tableRef.current) return;
    try {
      setIsDownloading(true);
      tableRef.current.classList.add('add-capture-padding');
      
      const dataUrl = await toPng(tableRef.current, {
        backgroundColor: '#09090b',
        pixelRatio: 2,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        filter: (node) => {
          if (node.hasAttribute && node.hasAttribute('data-exclude')) return false;
          return true;
        }
      });
      
      tableRef.current.classList.remove('add-capture-padding');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `LigaFC_Torneo_${activeTournament?.name || 'Tabla'}.png`;
      link.click();
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Error al descargar:', err);
      if (tableRef.current) tableRef.current.classList.remove('add-capture-padding');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Torneos Cortos</h2>
              <p className="text-xs text-zinc-500">Gestiona mini-ligas y mira la tabla de posiciones</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 px-3 py-2 rounded-lg font-bold transition text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Torneo
          </button>
        </div>
      </div>

      {/* Lista de Torneos */}
      {tournaments.length > 0 && !showForm && (
        <div className="space-y-2">
          {tournaments.map(t => {
            const isActive = t.id === activeTournamentId;
            const matchCount = allMatches?.filter(m => m.torneo_id === t.id).length || 0;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTournamentId(isActive ? null : t.id)}
                className={`w-full text-left bg-zinc-900 border rounded-xl p-4 transition-all duration-200 group ${
                  isActive
                    ? 'border-yellow-500/40 bg-yellow-500/5 shadow-lg shadow-yellow-500/5'
                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-400'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                        {t.nombre || t.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{t.fecha_inicio || t.startDate || 'Sin fecha'} — {t.fecha_fin || t.endDate || 'Sin fecha'}</span>
                        <span>·</span>
                        <span>{matchCount} partido{matchCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    isActive ? 'text-yellow-400 rotate-90' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tournaments.length === 0 && !showForm && (
        <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
          <Trophy className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 font-medium">No hay torneos creados</p>
          <p className="text-xs text-zinc-600 mt-1">Creá uno nuevo para empezar a seguir una mini-liga.</p>
        </div>
      )}

      {/* Formulario de Creación */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-white mb-4">Crear Nuevo Torneo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre del Torneo</label>
              <input
                type="text"
                required
                placeholder="Ej. Copa Verano 2026"
                value={newTournament.name}
                onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Fecha de Inicio</label>
              <DatePicker
                selected={newTournament.startDate ? parse(newTournament.startDate, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => setNewTournament({...newTournament, startDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                selectsStart
                startDate={newTournament.startDate ? parse(newTournament.startDate, 'yyyy-MM-dd', new Date()) : null}
                endDate={newTournament.endDate ? parse(newTournament.endDate, 'yyyy-MM-dd', new Date()) : null}
                placeholderText="Desde"
                locale={es}
                dateFormat="dd/MM/yyyy"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition"
                wrapperClassName="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Fecha de Fin</label>
              <DatePicker
                selected={newTournament.endDate ? parse(newTournament.endDate, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => setNewTournament({...newTournament, endDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                selectsEnd
                startDate={newTournament.startDate ? parse(newTournament.startDate, 'yyyy-MM-dd', new Date()) : null}
                endDate={newTournament.endDate ? parse(newTournament.endDate, 'yyyy-MM-dd', new Date()) : null}
                minDate={newTournament.startDate ? parse(newTournament.startDate, 'yyyy-MM-dd', new Date()) : null}
                placeholderText="Hasta"
                locale={es}
                dateFormat="dd/MM/yyyy"
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition"
                wrapperClassName="w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-yellow-500 text-yellow-950 rounded-lg text-xs font-bold hover:bg-yellow-400 transition">Crear Torneo</button>
          </div>
        </form>
      )}

      {/* Tabla de Posiciones */}
      {activeTournament && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl" ref={tableRef}>
          {/* Header de la Tabla */}
          <div className="p-4 sm:p-6 border-b border-zinc-800/80 bg-zinc-900 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide">{activeTournament.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20">
                  En Curso
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{activeTournament.startDate} al {activeTournament.endDate}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                data-exclude="true"
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition text-xs font-semibold"
                title="Descargar tabla como imagen"
              >
                {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">{downloaded ? '¡Guardado!' : 'Descargar'}</span>
              </button>
              <button
                onClick={() => {
                  if(confirm('¿Eliminar torneo? Esto NO borrará los partidos, solo la configuración de la tabla.')) {
                    deleteTournament(activeTournament.id);
                  }
                }}
                data-exclude="true"
                className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Eliminar Torneo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid de Posiciones */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-zinc-950/50 text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="p-4 w-12 text-center">Pos</th>
                  <th className="p-4">Jugador</th>
                  <th className="p-4 text-center">PTS</th>
                  <th className="p-4 text-center">PJ</th>
                  <th className="p-4 text-center">V</th>
                  <th className="p-4 text-center">E</th>
                  <th className="p-4 text-center">D</th>
                  <th className="p-4 text-center">GF</th>
                  <th className="p-4 text-center">GC</th>
                  <th className="p-4 text-center">DIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {standings.map((stat, index) => {
                  const isLeader = index === 0 && stat.pld > 0;
                  return (
                    <tr 
                      key={stat.player} 
                      className={`group transition-colors ${
                        isLeader ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-zinc-800/30'
                      }`}
                    >
                      <td className="p-4 text-center">
                        {isLeader ? (
                          <div className="w-6 h-6 mx-auto bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center">
                            <Crown className="w-3.5 h-3.5" />
                          </div>
                        ) : index === 1 && stat.pld > 0 ? (
                          <div className="w-6 h-6 mx-auto bg-zinc-400/20 text-zinc-400 rounded-full flex items-center justify-center">
                            <Medal className="w-3.5 h-3.5" />
                          </div>
                        ) : index === 2 && stat.pld > 0 ? (
                          <div className="w-6 h-6 mx-auto bg-amber-700/20 text-amber-600 rounded-full flex items-center justify-center">
                            <Medal className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-bold text-sm">{index + 1}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${isLeader ? 'text-yellow-400' : 'text-white'}`}>
                          {stat.player}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-base font-black ${isLeader ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {stat.pts}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium text-zinc-300">{stat.pld}</td>
                      <td className="p-4 text-center text-zinc-400">{stat.w}</td>
                      <td className="p-4 text-center text-zinc-400">{stat.d}</td>
                      <td className="p-4 text-center text-zinc-400">{stat.l}</td>
                      <td className="p-4 text-center text-zinc-400">{stat.gf}</td>
                      <td className="p-4 text-center text-zinc-400">{stat.ga}</td>
                      <td className="p-4 text-center font-bold text-zinc-300">
                        {stat.gd > 0 ? `+${stat.gd}` : stat.gd}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {standings.every(s => s.pld === 0) && (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No hay partidos registrados en las fechas de este torneo.
            </div>
          )}
        </div>
      )}

      {/* Partidos Pendientes */}
      {activeTournament && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900 flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Partidos Pendientes</h3>
              <p className="text-xs text-zinc-500">
                {pendingMatches.length === 0
                  ? '¡Todos los partidos del torneo están jugados!'
                  : `Faltan ${pendingMatches.length} de 6 enfrentamientos`}
              </p>
            </div>
          </div>

          {pendingMatches.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-400">¡Torneo completado!</p>
              <p className="text-xs text-zinc-500">Todos los jugadores ya se enfrentaron entre sí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-5">
              {pendingMatches.map((match, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/60 rounded-xl px-4 py-3 gap-2"
                >
                  <span className="text-sm font-bold text-white truncate">{match.p1}</span>
                  <span className="text-xs font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md flex-shrink-0">VS</span>
                  <span className="text-sm font-bold text-white truncate text-right">{match.p2}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
