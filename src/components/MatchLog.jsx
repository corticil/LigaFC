import { useRef, useState, useEffect } from 'react';
import { teams as defaultTeams, getTeamById as defaultGetTeamById } from '../data/teams';
import { Calendar, Trash2, Users, Shield, RotateCcw, AlertCircle, Download, Check, BarChart3, Pencil } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import MatchStatsModal from './MatchStatsModal';
import MatchEditModal from './MatchEditModal';
export default function MatchLog({ 
  filteredMatches, 
  filters, 
  onDeleteMatch,
  onUpdateMatch,
  loading,
  error,
  readOnly = false,
  getStatsForMatch,
  players = [],
  teamsList = [],
  resolveTeam = null,
}) {
  const [statsModalMatch, setStatsModalMatch] = useState(null);
  const [editModalMatch, setEditModalMatch] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const {
    h2hPlayer1,
    setH2hPlayer1,
    h2hPlayer2,
    setH2hPlayer2,
    filterTeamId,
    setFilterTeamId,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    clearFilters
  } = filters;

  const hasActiveFilters = h2hPlayer1 || h2hPlayer2 || filterTeamId || filterDateFrom || filterDateTo;

  useEffect(() => {
    setCurrentPage(1);
  }, [h2hPlayer1, h2hPlayer2, filterTeamId, filterDateFrom, filterDateTo]);

  const dateFilterActive = filterDateFrom || filterDateTo;
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const paginatedMatches = dateFilterActive
    ? filteredMatches
    : filteredMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      );

  const teamLookup = (id) => {
    if (resolveTeam) return resolveTeam(id);
    if (teamsList.length > 0) {
      const team = teamsList.find(t => t.id === id);
      if (team) return { id: team.id, name: team.name, logoUrl: team.logoUrl };
    }
    return defaultGetTeamById(id);
  };

  const teamsForFilter = teamsList.length > 0 ? teamsList : defaultTeams;

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

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const historyRef = useRef(null);

const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const matches = paginatedMatches;
      if (!matches.length) return;
      
      // Pre-cargar imágenes como data URLs para asegurar que se rendericen
      const loadImageAsDataUrl = (url) => {
        if (!url) return Promise.resolve('');
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve('');
          img.src = url;
        });
      };
      
      // Pre-cargar todos los logos
      const logoUrls = new Set();
      matches.forEach(m => {
        const t1 = teamsList.find(t => t.id === m.equipo_1_id);
        const t2 = teamsList.find(t => t.id === m.equipo_2_id);
        if (t1?.logoUrl) logoUrls.add(t1.logoUrl);
        if (t2?.logoUrl) logoUrls.add(t2.logoUrl);
      });
      const logoDataUrls = {};
      await Promise.all(Array.from(logoUrls).map(async (url) => {
        logoDataUrls[url] = await loadImageAsDataUrl(url);
      }));
      
      const esc = (s) => String(s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
      
      const formatDateStr = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
      };
      
      const teamLookup = (id) => teamsList.find(t => t.id === id);
      
      const cardsHtml = matches.map((match) => {
        const team1 = teamLookup(match.equipo_1_id);
        const team2 = teamLookup(match.equipo_2_id);
        const winner = match.goles_1 > match.goles_2 ? 1 : match.goles_1 < match.goles_2 ? 2 : 0;
        
        const logo1 = team1?.logoUrl ? logoDataUrls[team1.logoUrl] : '';
        const logo2 = team2?.logoUrl ? logoDataUrls[team2.logoUrl] : '';
        const name1 = team1?.name || 'Equipo Desconocido';
        const name2 = team2?.name || 'Equipo Desconocido';
        const player1 = match.jugador_1;
        const player2 = match.jugador_2;
        const dateStr = formatDateStr(match.fecha);
        const nota = match.nota;
        
        const winnerStyle1 = winner === 1 ? 'opacity: 1;' : winner === 0 ? 'opacity: 0.9;' : 'opacity: 0.5;';
        const winnerStyle2 = winner === 2 ? 'opacity: 1;' : winner === 0 ? 'opacity: 0.9;' : 'opacity: 0.5;';
        
        const scoreStyle1 = winner === 1 
          ? 'background:#14532d;color:#4ade80;border:1px solid #22c55e;' 
          : 'background:#18181b;color:#71717a;border:1px solid #27272a;';
        const scoreStyle2 = winner === 2 
          ? 'background:#14532d;color:#4ade80;border:1px solid #22c55e;' 
          : 'background:#18181b;color:#71717a;border:1px solid #27272a;';
        
        return `
          <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div style="display:flex;align-items:center;justify-content:flex-end;flex:1;gap:12px;${winner === 1 ? 'opacity:1;' : winner === 0 ? 'opacity:0.9;' : 'opacity:0.5;'}">
                <div style="text-align:right;min-width:0;">
                  <p style="font-size:14px;font-weight:700;color:#fff;letter-spacing:0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${player1}</p>
                  <p style="font-size:12px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${team1?.name || 'Equipo Desconocido'}</p>
                </div>
                <div style="width:40px;height:40px;background:#27272a;border-radius:8px;padding:6px;display:flex;align-items:center;justify-content:center;border:1px solid #27272a;flex-shrink:0;">
                  ${logo1 ? `<img src="${logo1}" alt="" style="width:100%;height:100%;object-fit:contain;" />` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#52525b;">⚽</div>'}
                </div>
              </div>
              
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;min-width:120px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:28px;font-weight:900;padding:6px 12px;border-radius:8px;${match.goles_1 > match.goles_2 ? 'background:#14532d;color:#4ade80;border:1px solid #22c55e;' : 'background:#18181b;color:#71717a;border:1px solid #27272a;'}">${match.goles_1}</span>
                  <span style="font-size:12px;font-weight:600;color:#71717a;">-</span>
                  <span style="font-size:28px;font-weight:900;padding:6px 12px;border-radius:8px;${match.goles_2 > match.goles_1 ? 'background:#14532d;color:#4ade80;border:1px solid #22c55e;' : 'background:#18181b;color:#71717a;border:1px solid #27272a;'}">${match.goles_2}</span>
                </div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:4px;font-size:11px;color:#71717a;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;width:12px;height:12px;vertical-align:middle;">
                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
                    <path d="M16 2v4"/>
                    <path d="M8 14h4"/>
                  </svg>
                  <span>${formatDateStr(match.fecha)}</span>
                </div>
              </div>
              
              <div style="display:flex;align-items:center;justify-content:flex-start;flex:1;gap:12px;${match.goles_2 > match.goles_1 ? 'opacity:1;' : match.goles_1 === match.goles_2 ? 'opacity:0.9;' : 'opacity:0.5;'}">
                <div style="width:40px;height:40px;background:#27272a;border-radius:8px;padding:6px;display:flex;align-items:center;justify-content:center;border:1px solid #27272a;flex-shrink:0;">
                  ${team2?.logoUrl && logoDataUrls[team2.logoUrl] ? `<img src="${logoDataUrls[team2.logoUrl]}" alt="" style="width:100%;height:100%;object-fit:contain;" />` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#52525b;">⚽</div>'}
                </div>
                <div style="text-align:left;min-width:0;">
                  <p style="font-size:14px;font-weight:700;color:#fff;letter-spacing:0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${match.jugador_2}</p>
                  <p style="font-size:12px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${team2?.name || 'Equipo Desconocido'}</p>
                </div>
              </div>
            </div>
            
            ${match.nota ? `
              <div style="margin-top:12px;padding-top:8px;border-top:1px solid #27272a;display:flex;align-items:flex-start;gap:8px;">
                <span style="font-size:10px;font-weight:700;color:#4ade80;background:rgba(74,222,128,0.1);padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Nota</span>
                <p style="font-size:11px;color:#a1a1aa;font-style:italic;">"${match.nota}"</p>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
      
      const html = `
        <div style="width:1080px;background:#09090b;padding:24px;border-radius:16px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fafafa;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:16px;padding-left:4px;">
            <h3 style="font-size:14px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Historial (${paginatedMatches.length})</h3>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">${cardsHtml}</div>
        </div>
      `;
      
      // Crear contenedor offscreen
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1080px;';
      container.innerHTML = html;
      document.body.appendChild(container);
      
      // Esperar un frame para asegurar render
      await new Promise(r => requestAnimationFrame(r));
      
      // Capturar
      const dataUrl = await toPng(container, {
        pixelRatio: 2,
        width: 1080,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      });
      
      // Limpiar
      document.body.removeChild(container);
      
      // Descargar
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `LigaFC_Historial.png`;
      link.click();
      
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Error al descargar el historial:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contenedor de Filtros */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md relative z-20">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtro Head to Head */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtro Cara a Cara</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={h2hPlayer1}
                  onChange={(e) => setH2hPlayer1(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Jugador 1 --</option>
                  {players.map(player => (
                    <option key={`p1-${player.id}`} value={player.id}>
                      {player.nombre}
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
                  {players.map(player => (
                    <option 
                      key={`p2-${player.id}`} 
                      value={player.id}
                      disabled={player.id === h2hPlayer1}
                    >
                      {player.nombre}
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
                {teamsForFilter.map(team => {
                  const teamId = team.id || team.slug;
                  const teamName = team.name || team.nombre;
                  return (
                    <option key={`filter-${teamId}`} value={teamId}>
                      {teamName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Filtro por Fecha */}
          <div className="space-y-3 relative z-30">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtro por Fecha</h3>
            <div className="flex items-center gap-2">
              <DatePicker
                selected={filterDateFrom ? parse(filterDateFrom, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => setFilterDateFrom(date ? format(date, 'yyyy-MM-dd') : '')}
                selectsStart
                startDate={filterDateFrom ? parse(filterDateFrom, 'yyyy-MM-dd', new Date()) : null}
                endDate={filterDateTo ? parse(filterDateTo, 'yyyy-MM-dd', new Date()) : null}
                placeholderText="Desde"
                locale={es}
                dateFormat="dd/MM/yyyy"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-[7px] px-2 text-[10px] sm:text-xs text-white focus:outline-none focus:border-indigo-500 transition text-center"
                wrapperClassName="w-full"
              />
              <span className="text-xs font-bold text-zinc-600">-</span>
              <DatePicker
                selected={filterDateTo ? parse(filterDateTo, 'yyyy-MM-dd', new Date()) : null}
                onChange={(date) => setFilterDateTo(date ? format(date, 'yyyy-MM-dd') : '')}
                selectsEnd
                startDate={filterDateFrom ? parse(filterDateFrom, 'yyyy-MM-dd', new Date()) : null}
                endDate={filterDateTo ? parse(filterDateTo, 'yyyy-MM-dd', new Date()) : null}
                minDate={filterDateFrom ? parse(filterDateFrom, 'yyyy-MM-dd', new Date()) : null}
                placeholderText="Hasta"
                locale={es}
                dateFormat="dd/MM/yyyy"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-[7px] px-2 text-[10px] sm:text-xs text-white focus:outline-none focus:border-indigo-500 transition text-center"
                wrapperClassName="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Partidos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pl-1">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Historial ({filteredMatches.length})
          </h3>
          
          {filteredMatches.length > 0 && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              data-exclude="true"
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 transition text-xs font-semibold flex-shrink-0"
              title="Descargar historial como imagen"
            >
              {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{downloaded ? '¡Guardado!' : 'Descargar'}</span>
            </button>
          )}
        </div>

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
          <div className="space-y-4" ref={historyRef}>
            {paginatedMatches.map((match) => {
              const team1 = teamLookup(match.equipo_1_id);
              const team2 = teamLookup(match.equipo_2_id);

              const winner = match.goles_1 > match.goles_2 ? 1 : match.goles_1 < match.goles_2 ? 2 : 0;

              return (
                <div 
                  key={match.id}
                  className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 transition-all duration-300 shadow-md group relative overflow-hidden"
                >
                  {/* Tarjeta del Encuentro */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Jugador 1 y Equipo */}
                    <div className={`flex items-center justify-end flex-1 w-full gap-2 sm:gap-3 ${winner === 1 ? 'opacity-100' : winner === 2 ? 'opacity-50' : 'opacity-90'}`}>
                      <div className="text-right min-w-0">
                        <p className="text-[11px] sm:text-sm font-bold text-white tracking-wide truncate">{match.jugador_1}</p>
                        <p className="text-[9px] sm:text-xs text-zinc-500 truncate hidden sm:block">{team1?.name || 'Equipo Desconocido'}</p>
                      </div>
                      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-zinc-950 rounded-lg p-1 sm:p-1.5 flex items-center justify-center border border-zinc-800/80 flex-shrink-0">
                        {team1 ? (
                          <img 
                            src={team1.logoUrl} 
                            alt={team1.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = '/logos/real-madrid.svg'; }}
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    </div>

                    {/* Marcador */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[70px] sm:min-w-[100px]">
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <span className={`text-base sm:text-2xl font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg ${
                          winner === 1 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800/50'
                        }`}>
                          {match.goles_1}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-zinc-600">-</span>
                        <span className={`text-base sm:text-2xl font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg ${
                          winner === 2 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-950 text-zinc-400 border border-zinc-800/50'
                        }`}>
                          {match.goles_2}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 sm:mt-2 text-[9px] sm:text-[10px] text-zinc-500">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-600" />
                        <span>{formatDate(match.fecha)}</span>
                      </div>
                    </div>

                    {/* Jugador 2 y Equipo */}
                    <div className={`flex items-center justify-start flex-1 w-full gap-2 sm:gap-3 ${winner === 2 ? 'opacity-100' : winner === 1 ? 'opacity-50' : 'opacity-90'}`}>
                      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-zinc-950 rounded-lg p-1 sm:p-1.5 flex items-center justify-center border border-zinc-800/80 flex-shrink-0">
                        {team2 ? (
                          <img 
                            src={team2.logoUrl} 
                            alt={team2.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.src = '/logos/real-madrid.svg'; }}
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[11px] sm:text-sm font-bold text-white tracking-wide truncate">{match.jugador_2}</p>
                        <p className="text-[9px] sm:text-xs text-zinc-500 truncate hidden sm:block">{team2?.name || 'Equipo Desconocido'}</p>
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

                  {/* Botón Ver Stats */}
                  {/* Botón "Ver Stats": visible solo si existen estadísticas para este partido */}
                  {getStatsForMatch?.(match) && (
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={() => setStatsModalMatch(match)}
                        className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition flex items-center gap-1.5"
                      >
                        <BarChart3 className="w-3 h-3" />
                        Ver Stats
                      </button>
                    </div>
                  )}

                  {/* Botones de editar/eliminar (visible en mobile, hover en desktop) */}
                  {!readOnly && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {onUpdateMatch && (
                        <button
                          onClick={() => setEditModalMatch(match)}
                          className="p-2 sm:p-1.5 rounded-lg text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200"
                          title="Editar participantes"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres eliminar este partido?')) {
                            onDeleteMatch(match.id);
                          }
                        }}
                        className="p-2 sm:p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200"
                        title="Eliminar partido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!dateFilterActive && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>
            <span className="text-xs text-zinc-400 font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {statsModalMatch && (
        <MatchStatsModal
          match={statsModalMatch}
          stats={getStatsForMatch?.(statsModalMatch)}
          onClose={() => setStatsModalMatch(null)}
          resolveTeam={teamLookup}
        />
      )}

      {editModalMatch && (
        <MatchEditModal
          match={editModalMatch}
          players={players}
          teamsList={teamsList}
          onClose={() => setEditModalMatch(null)}
          onSave={onUpdateMatch}
        />
      )}
    </div>
  );
}
