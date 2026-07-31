import { useState } from 'react';
import { Pencil, Shield, User, X, AlertCircle } from 'lucide-react';

export default function MatchEditModal({ match, players = [], teamsList = [], onClose, onSave }) {
  const playerOptions = () => {
    const opts = players.map(p => ({ id: p.id, nombre: p.nombre }));
    if (!opts.some(p => p.nombre === match.jugador_1)) opts.unshift({ id: match.jugador_1_id, nombre: match.jugador_1 });
    if (!opts.some(p => p.nombre === match.jugador_2)) opts.push({ id: match.jugador_2_id, nombre: match.jugador_2 });
    return opts;
  };

  const teamOptions = () => {
    const opts = [...teamsList];
    if (!opts.some(t => t.id === match.equipo_1_id)) opts.unshift({ id: match.equipo_1_id, name: 'Equipo 1 desconocido' });
    if (!opts.some(t => t.id === match.equipo_2_id)) opts.push({ id: match.equipo_2_id, name: 'Equipo 2 desconocido' });
    return opts;
  };

  const playerList = playerOptions();
  const teamList = teamOptions();

  const [jugador1, setJugador1] = useState(match.jugador_1);
  const [jugador1Id, setJugador1Id] = useState(match.jugador_1_id || null);
  const [equipo1Id, setEquipo1Id] = useState(match.equipo_1_id || '');
  const [jugador2, setJugador2] = useState(match.jugador_2);
  const [jugador2Id, setJugador2Id] = useState(match.jugador_2_id || null);
  const [equipo2Id, setEquipo2Id] = useState(match.equipo_2_id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  const findPlayer = (name) => playerList.find(p => p.nombre === name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (jugador1 === jugador2) {
      setValidationError('Un jugador no puede jugar contra sí mismo.');
      return;
    }
    if (!equipo1Id || !equipo2Id) {
      setValidationError('Debes seleccionar ambos equipos.');
      return;
    }

    setIsSaving(true);
    const result = await onSave(match.id, {
      jugador_1: jugador1,
      jugador_2: jugador2,
      jugador_1_id: findPlayer(jugador1)?.id || jugador1Id,
      jugador_2_id: findPlayer(jugador2)?.id || jugador2Id,
      equipo_1_id: equipo1Id,
      equipo_2_id: equipo2Id,
    });
    setIsSaving(false);

    if (result?.success) {
      onClose();
    } else {
      setValidationError(result?.error || 'Ocurrió un error al actualizar el partido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Pencil className="w-4 h-4 text-rose-400" />
            Editar Participantes
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Jugador 1 / Local */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Local</span>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Jugador</label>
              <select
                value={jugador1}
                onChange={(e) => {
                  const val = e.target.value;
                  setJugador1(val);
                  setJugador1Id(findPlayer(val)?.id || null);
                  if (val === jugador2) {
                    const other = playerList.find(p => p.nombre !== val);
                    setJugador2(other?.nombre || '');
                    setJugador2Id(other?.id || null);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {playerList.map(p => (
                  <option key={`edit-p1-${p.id || p.nombre}`} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Equipo</label>
              <select
                value={equipo1Id}
                onChange={(e) => setEquipo1Id(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {teamList.map(t => (
                  <option key={`edit-t1-${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Separador Versus */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-zinc-600">VS</span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
          </div>

          {/* Jugador 2 / Visitante */}
          <div className="space-y-3 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Visitante</span>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Jugador</label>
              <select
                value={jugador2}
                onChange={(e) => {
                  const val = e.target.value;
                  setJugador2(val);
                  setJugador2Id(findPlayer(val)?.id || null);
                  if (val === jugador1) {
                    const other = playerList.find(p => p.nombre !== val);
                    setJugador1(other?.nombre || '');
                    setJugador1Id(other?.id || null);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {playerList.map(p => (
                  <option key={`edit-p2-${p.id || p.nombre}`} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Equipo</label>
              <select
                value={equipo2Id}
                onChange={(e) => setEquipo2Id(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {teamList.map(t => (
                  <option key={`edit-t2-${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {validationError && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {validationError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[10px] text-zinc-600">Solo se modifican los participantes. Las stats de IA vinculadas no se actualizan.</p>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-shrink-0 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-50 text-zinc-950 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/10"
            >
              <Pencil className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
