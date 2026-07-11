import { useState } from 'react';
import { Users, Plus, Trash2, User } from 'lucide-react';

export default function PlayerManager({ players, playerNames, onAddPlayer, onDeletePlayer }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) {
      setError('Ingresá un nombre');
      return;
    }
    setSubmitting(true);
    const result = await onAddPlayer(newName.trim());
    setSubmitting(false);
    if (result.success) {
      setNewName('');
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`¿Eliminar al jugador "${name}"?`)) {
      await onDeletePlayer(id);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900 flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Jugadores</h3>
          <p className="text-xs text-zinc-500">{playerNames.length} registrados</p>
        </div>
      </div>

      {/* Formulario de agregar */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-zinc-800/50 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError(''); }}
          placeholder="Nombre del jugador..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition"
        />
        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </form>
      {error && (
        <div className="px-4 py-2 text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/20">
          {error}
        </div>
      )}

      {/* Lista de jugadores */}
      <div className="divide-y divide-zinc-800/50">
        {players.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No hay jugadores registrados
          </div>
        ) : (
          players.map((player) => (
            <div key={player.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/20 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-sm font-medium text-white">{player.nombre}</span>
              </div>
              <button
                onClick={() => handleDelete(player.id, player.nombre)}
                className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title={`Eliminar ${player.nombre}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
