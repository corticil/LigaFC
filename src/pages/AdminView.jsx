import { useState } from 'react';
import { PlusCircle, Trophy, Sparkles, ClipboardList, Users } from 'lucide-react';
import MatchForm from '../components/MatchForm';
import TournamentManager from '../components/TournamentManager';
import StatsUploader from '../components/StatsUploader';
import MatchLog from '../components/MatchLog';
import PlayerManager from '../components/PlayerManager';
import TeamManager from '../components/TeamManager';
import { useMatchStats } from '../hooks/useMatchStats';

export default function AdminView({ 
  addMatch,
  deleteMatch,
  updateMatch,
  filters,
  filteredMatches,
  allMatches,
  tournaments,
  activeTournamentId,
  setActiveTournamentId,
  activeTournament,
  standings,
  pendingMatches,
  addTournament,
  deleteTournament,
  players,
  playerNames,
  uniquePlayers,
  onAddPlayer,
  onDeletePlayer,
  teamsList,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  tournamentPlayers,
}) {
  const [activeTab, setActiveTab] = useState('registrar');
  const [modoRegistro, setModoRegistro] = useState('ia');
  const { getStatsForMatch } = useMatchStats();

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Pestañas de Navegación */}
      <div className="grid grid-cols-2 sm:flex border-b border-zinc-900 max-w-lg mx-auto bg-zinc-900/20 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab('registrar')}
          className={`py-2.5 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'registrar'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Registrar
        </button>
        <button
          onClick={() => setActiveTab('partidos')}
          className={`py-2.5 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'partidos'
              ? 'bg-rose-500 text-rose-950 shadow-md shadow-rose-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Partidos
        </button>
        <button
          onClick={() => setActiveTab('torneos')}
          className={`py-2.5 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'torneos'
              ? 'bg-yellow-500 text-yellow-950 shadow-md shadow-yellow-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Torneos
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`py-2.5 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'data'
              ? 'bg-blue-500 text-blue-950 shadow-md shadow-blue-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Gestión
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="transition-all duration-300">
        {activeTab === 'registrar' && (
          <section className="max-w-2xl mx-auto py-4">
            {/* Switch de modo de registro */}
            <div className="flex items-center justify-center gap-1 bg-zinc-900/40 border border-zinc-800 rounded-xl p-1 w-fit mx-auto mb-6">
              <button
                onClick={() => setModoRegistro('ia')}
                className={`py-2 px-4 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                  modoRegistro === 'ia'
                    ? 'bg-purple-500 text-purple-950 shadow-md shadow-purple-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Stats IA
              </button>
              <button
                onClick={() => setModoRegistro('manual')}
                className={`py-2 px-4 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                  modoRegistro === 'manual'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>

            {/* Modo Stats IA */}
            <div className={modoRegistro === 'ia' ? 'max-w-xl mx-auto' : 'hidden'}>
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Importar Stats con IA
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Subí una captura de pantalla de estadísticas de FC para extraer y guardar los datos automáticamente
                </p>
              </div>
              <StatsUploader onAddMatch={addMatch} tournaments={tournaments} players={players} teamsList={teamsList.map(t => ({ id: t.id || t.slug, name: t.nombre, logoUrl: t.logo_url }))} />
            </div>

            {/* Modo Manual */}
            <div className={modoRegistro === 'manual' ? '' : 'hidden'}>
              <MatchForm
                onAddMatch={addMatch}
                tournaments={tournaments}
                players={players}
                teamsList={teamsList.map(t => ({ id: t.id || t.slug, name: t.nombre, logoUrl: t.logo_url }))}
                onSuccess={() => {
                  filters.clearFilters();
                }}
              />
            </div>
          </section>
        )}
        {activeTab === 'torneos' && (
          <TournamentManager
            tournaments={tournaments}
            activeTournamentId={activeTournamentId}
            setActiveTournamentId={setActiveTournamentId}
            activeTournament={activeTournament}
            standings={standings}
            pendingMatches={pendingMatches}
            addTournament={addTournament}
            deleteTournament={deleteTournament}
            allMatches={allMatches}
            players={players}
            tournamentPlayers={tournamentPlayers}
          />
        )}
        {activeTab === 'partidos' && (
          <section className="max-w-2xl mx-auto py-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <ClipboardList className="w-5 h-5 text-rose-400" />
                Administrar Partidos
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Editá los participantes o eliminá partidos y estadísticas. Se pueden restaurar desde la base de datos.
              </p>
            </div>
            <MatchLog
              filteredMatches={filteredMatches}
              filters={filters}
              onDeleteMatch={deleteMatch}
              onUpdateMatch={updateMatch}
              loading={false}
              error={null}
              readOnly={false}
              getStatsForMatch={getStatsForMatch}
              players={uniquePlayers}
              teamsList={teamsList.map(t => ({ id: t.id || t.slug, name: t.nombre, logoUrl: t.logo_url }))}
            />
          </section>
        )}
        {activeTab === 'data' && (
          <section className="max-w-4xl mx-auto py-4 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Gestión de Jugadores y Clubes
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Agregá o eliminá jugadores y clubes. Los cambios se reflejan en todo el sistema.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlayerManager
                players={players}
                playerNames={playerNames}
                onAddPlayer={onAddPlayer}
                onDeletePlayer={onDeletePlayer}
              />
              <TeamManager
                teamsList={teamsList}
                onAddTeam={onAddTeam}
                onUpdateTeam={onUpdateTeam}
                onDeleteTeam={onDeleteTeam}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
