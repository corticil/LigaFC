import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useMatches } from './hooks/useMatches';
import { useTournaments } from './hooks/useTournaments';
import { usePlayers } from './hooks/usePlayers';
import { useTeams } from './hooks/useTeams';
import Login from './components/Login';
import PublicView from './pages/PublicView';
import AdminView from './pages/AdminView';
import JugadoresView from './pages/JugadoresView';
import { supabase, isLocalStorageMock } from './config/supabaseClient';
import useAnalytics from './hooks/useAnalytics';
import { Database, Code, ChevronDown, ChevronUp, LogOut, User } from 'lucide-react';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isJugadores = location.pathname === '/jugadores';

  const {
    matches,
    filteredMatches,
    uniquePlayers,
    loading,
    error,
    addMatch,
    deleteMatch,
    filters,
    stats
  } = useMatches();

  const {
    players,
    playerNames,
    addPlayer,
    deletePlayer,
  } = usePlayers();

  const {
    teamsList,
    teamsNormalized,
    addTeam,
    deleteTeam,
    getTeamById,
  } = useTeams();

  useAnalytics();

  const {
    tournaments,
    activeTournamentId,
    setActiveTournamentId,
    activeTournament,
    standings,
    pendingMatches,
    addTournament,
    deleteTournament
  } = useTournaments(matches, playerNames);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showDbInstructions, setShowDbInstructions] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500/30 selection:text-white">
      {/* Navbar / Encabezado */}
      <header className="border-b border-zinc-900 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500 text-zinc-950 p-2 rounded-xl font-black text-lg tracking-tighter flex items-center justify-center shadow-lg shadow-emerald-500/20">
              FC
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold tracking-tight text-white">
                LigaFC
              </h1>
            </div>
          </div>

          {/* Tabs de navegación */}
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition ${
                isHome
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Resumen
            </Link>
            <Link
              to="/jugadores"
              className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition ${
                isJugadores
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="flex items-center gap-1"><User className="w-3 h-3" /><span className="hidden sm:inline">Jugadores</span></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Indicador de Estado de Conexión */}
            {isLocalStorageMock && (
              <button 
                onClick={() => setShowDbInstructions(prev => !prev)}
                className="flex items-center gap-1.5 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-semibold px-3 py-2 rounded-lg transition"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Modo Local</span>
                {showDbInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Botón de Cerrar Sesión */}
            {isAuthenticated && (
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 text-[11px] bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-650 border border-zinc-700 text-zinc-350 font-bold px-3 py-2 rounded-lg transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner de instrucciones de base de datos */}
        {isLocalStorageMock && showDbInstructions && (
          <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 flex-shrink-0">
                <Code className="w-6 h-6" />
              </div>
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-sm font-bold text-white">¿Cómo conectar tu base de datos de Supabase?</h3>
                  <p className="text-xs text-zinc-400 mt-1">La aplicación está simulando la base de datos localmente. Sigue estos pasos para persistir los datos en tu propia nube de Supabase:</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-300">1. Crea las Variables de Entorno</p>
                    <p className="text-[11px] text-zinc-500">Crea un archivo llamado <code className="bg-zinc-950 px-1 py-0.5 rounded text-amber-400">.env</code> en la raíz de este proyecto y copia lo siguiente:</p>
                    <pre className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 overflow-x-auto font-mono">
{`VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui`}
                    </pre>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-300">2. Ejecuta el Script SQL en Supabase</p>
                    <p className="text-[11px] text-zinc-500">Ve al editor SQL de tu panel de Supabase y ejecuta este comando para crear la tabla:</p>
                    <pre className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 overflow-x-auto font-mono max-h-[85px]">
{`create table partidos (
  id uuid default gen_random_uuid() primary key,
  jugador_1 text not null,
  jugador_2 text not null,
  equipo_1_id text not null,
  equipo_2_id text not null,
  goles_1 integer not null check (goles_1 >= 0),
  goles_2 integer not null check (goles_2 >= 0),
  nota text,
  fecha date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;`}
                    </pre>
                  </div>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={() => setShowDbInstructions(false)}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-lg border border-zinc-750 transition"
                  >
                    Entendido, cerrar instrucciones
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <PublicView 
              stats={stats} 
              filteredMatches={filteredMatches} 
              filters={filters} 
              loading={loading} 
              error={error}
              players={uniquePlayers}
              teamsList={teamsNormalized}
              getTeamById={getTeamById}
            />
          } />
          
          <Route path="/admin" element={
            isAuthenticated ? (
              <AdminView 
                addMatch={addMatch}
                deleteMatch={deleteMatch}
                filters={filters}
                filteredMatches={filteredMatches}
                allMatches={matches}
                tournaments={tournaments}
                activeTournamentId={activeTournamentId}
                setActiveTournamentId={setActiveTournamentId}
                activeTournament={activeTournament}
                standings={standings}
                pendingMatches={pendingMatches}
                addTournament={addTournament}
                deleteTournament={deleteTournament}
                players={players}
                playerNames={playerNames}
                uniquePlayers={uniquePlayers}
                onAddPlayer={addPlayer}
                onDeletePlayer={deletePlayer}
                teamsList={teamsList}
                onAddTeam={addTeam}
                onDeleteTeam={deleteTeam}
              />
            ) : (
              <Login onAuthenticate={setIsAuthenticated} />
            )
          } />

          <Route path="/jugadores" element={
            <JugadoresView 
              matches={matches}
              filteredMatches={filteredMatches}
              players={uniquePlayers}
              getTeamById={getTeamById}
            />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Pie de Página */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 mt-12 text-center">
        <p className="text-xs text-zinc-600">
          LigaFC Bitácora © 2026. Todos los derechos reservados. Desarrollado con React, Tailwind CSS y Supabase.
        </p>
      </footer>
    </div>
  );
}
