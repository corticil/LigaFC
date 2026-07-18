import React, { useMemo, useRef, useState } from 'react';
import { PLAYERS as defaultPlayers } from '../data/players';
import { Grid, Download, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function H2HMatrix({ matches, players = [] }) {
  // Normalize: support both string arrays (defaultPlayers) and {id, nombre} objects
  const playerList = players.length > 0
    ? players.map(p => typeof p === 'string' ? p : p.nombre)
    : defaultPlayers;

  const matrix = useMemo(() => {
    // Inicializar matriz
    const mat = {};
    playerList.forEach(p1 => {
      mat[p1] = {};
      playerList.forEach(p2 => {
        mat[p1][p2] = { w: 0, d: 0, l: 0, played: 0 };
      });
    });

    if (!matches) return mat;

    // Rellenar con datos
    matches.forEach(m => {
      const p1 = m.jugador_1.trim();
      const p2 = m.jugador_2.trim();
      
      // Solo procesar si ambos jugadores están en nuestra lista (por seguridad)
      if (mat[p1] && mat[p2]) {
        const g1 = m.goles_1;
        const g2 = m.goles_2;
        
        mat[p1][p2].played++;
        mat[p2][p1].played++;

        if (g1 > g2) {
          mat[p1][p2].w++;
          mat[p2][p1].l++;
        } else if (g1 < g2) {
          mat[p1][p2].l++;
          mat[p2][p1].w++;
        } else {
          mat[p1][p2].d++;
          mat[p2][p1].d++;
        }
      }
    });

    return mat;
  }, [matches]);

  const matrixRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (!matrixRef.current) return;
    try {
      setIsDownloading(true);
      
      // Añadir clase temporalmente para ocultar las barras de desplazamiento
      matrixRef.current.classList.add('hide-scrollbars');

      const dataUrl = await toPng(matrixRef.current, {
        backgroundColor: '#09090b', // Color de fondo del body
        pixelRatio: 2, // Mejor resolución
        filter: (node) => {
          // Ignorar elementos marcados para no descargar (como el botón)
          if (node.hasAttribute && node.hasAttribute('data-exclude')) {
            return false;
          }
          return true;
        }
      });

      // Quitar clase
      matrixRef.current.classList.remove('hide-scrollbars');

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `LigaFC_Matriz_H2H.png`;
      link.click();
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Error al descargar la matriz:', err);
      if (matrixRef.current) matrixRef.current.classList.remove('hide-scrollbars');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!matches || matches.length === 0) return null;

  return (
    <div ref={matrixRef} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md relative">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Matriz de Enfrentamientos</h2>
            <p className="text-xs text-zinc-500">Historial directo (Victorias - Empates - Derrotas)</p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          data-exclude="true"
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition text-xs font-semibold"
          title="Descargar matriz como imagen"
        >
          {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">{downloaded ? '¡Guardado!' : 'Descargar'}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="bg-zinc-950 p-2 sm:p-3 rounded-tl-xl border-b border-zinc-800 text-zinc-500 font-medium text-[10px] sm:text-sm">Jugador</th>
              {playerList.map(p => (
                <th key={`th-${p}`} className="bg-zinc-950 p-2 sm:p-3 text-center border-b border-zinc-800 text-zinc-400 font-bold text-[10px] sm:text-sm">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerList.map((rowPlayer) => (
              <tr key={`row-${rowPlayer}`} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                <td className="p-2 sm:p-3 font-bold text-zinc-300 bg-zinc-950/50 text-[10px] sm:text-sm">{rowPlayer}</td>
                {playerList.map(colPlayer => {
                  if (rowPlayer === colPlayer) {
                    return (
                      <td key={`cell-${rowPlayer}-${colPlayer}`} className="p-2 sm:p-3 text-center bg-zinc-900/50 text-zinc-600">
                        -
                      </td>
                    );
                  }
                  
                  const stats = matrix[rowPlayer][colPlayer];
                  if (stats.played === 0) {
                    return (
                      <td key={`cell-${rowPlayer}-${colPlayer}`} className="p-2 sm:p-3 text-center text-zinc-600 font-mono text-[10px] sm:text-xs">
                        0-0-0
                      </td>
                    );
                  }

                  // Resaltar si tiene historial positivo
                  const isPositive = stats.w > stats.l;
                  const isNegative = stats.l > stats.w;
                  
                  return (
                    <td key={`cell-${rowPlayer}-${colPlayer}`} className="p-1.5 sm:p-3 text-center font-mono">
                      <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs tracking-tight sm:tracking-wider ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 
                        isNegative ? 'bg-rose-500/10 text-rose-400 font-medium' : 
                        'bg-zinc-800/50 text-zinc-400'
                      }`}>
                        {stats.w}-{stats.d}-{stats.l}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
