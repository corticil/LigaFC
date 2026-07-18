import { useState, useRef, useCallback } from 'react';
import { User, Download, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import PlayerStatsSection from '../components/PlayerStatsSection';
import { useMatchStats } from '../hooks/useMatchStats';
import { usePlayerStats } from '../hooks/usePlayerStats';

export default function JugadoresView({ filteredMatches, players = [], getTeamById = null }) {
  const { getStatsForMatch } = useMatchStats();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const { playerStats } = usePlayerStats(selectedPlayer, filteredMatches, getStatsForMatch);
  const statsRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!statsRef.current || !selectedPlayer) return;
    try {
      setIsDownloading(true);
      statsRef.current.classList.add('hide-scrollbars');

      const pngDataUrl = await toPng(statsRef.current, {
        backgroundColor: '#09090b',
        pixelRatio: 2,
        filter: (node) => {
          if (node.hasAttribute && node.hasAttribute('data-exclude')) return false;
          return true;
        },
      });

      statsRef.current.classList.remove('hide-scrollbars');

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const link = document.createElement('a');
        link.href = jpegDataUrl;
        link.download = `LigaFC_Stats_${selectedPlayer}.jpg`;
        link.click();

        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2000);
      };
      img.src = pngDataUrl;
    } catch (err) {
      console.error('Error al descargar stats:', err);
      if (statsRef.current) statsRef.current.classList.remove('hide-scrollbars');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedPlayer]);

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
        <div className="flex items-center gap-2 mb-4">
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition"
          >
            <option value="">-- Seleccionar Jugador --</option>
            {players.map(player => (
              <option key={player.id} value={player.nombre}>
                {player.nombre}
              </option>
            ))}
          </select>

          {selectedPlayer && playerStats && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              data-exclude="true"
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-2.5 rounded-lg border border-zinc-700 transition text-xs font-semibold flex-shrink-0"
              title="Descargar stats como imagen"
            >
              {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{downloaded ? '¡Guardado!' : 'Descargar'}</span>
            </button>
          )}
        </div>

        {selectedPlayer && playerStats ? (
          <div ref={statsRef}>
            <PlayerStatsSection playerStats={playerStats} resolveTeam={getTeamById} />
          </div>
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
