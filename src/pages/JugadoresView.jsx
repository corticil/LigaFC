import { useState } from 'react';
import { User } from 'lucide-react';
import PlayerStatsSection from '../components/PlayerStatsSection';
import { useMatchStats } from '../hooks/useMatchStats';
import { usePlayerStats } from '../hooks/usePlayerStats';

export default function JugadoresView({ filteredMatches, players = [], getTeamById = null }) {
  const { getStatsForMatch } = useMatchStats();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const { playerStats } = usePlayerStats(selectedPlayer, filteredMatches, getStatsForMatch);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pl-1">
        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Jugadores</h2>
          <p className="text-xs text-zinc-500">Estadísticas individuales de cada jugador</p>
        </div>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition mb-4"
        >
          <option value="">-- Seleccionar Jugador --</option>
          {players.map(player => (
            <option key={player.id} value={player.nombre}>
              {player.nombre}
            </option>
          ))}
        </select>

        {selectedPlayer && playerStats ? (
          <PlayerStatsSection playerStats={playerStats} resolveTeam={getTeamById} />
        ) : (
          <div className="text-center py-12">
            <User className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium">Seleccioná un jugador para ver sus estadísticas</p>
            <p className="text-xs text-zinc-600 mt-1">Elegí del menú de arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}
