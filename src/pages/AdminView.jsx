import { useState } from 'react';
import { PlusCircle, Trophy, Sparkles, ArrowLeft, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  onAddPlayer,
  onDeletePlayer,
  teamsList,
  onAddTeam,
  onDeleteTeam,
}) {
  const [activeTab, setActiveTab] = useState('registrar');
  const { getStatsForMatch } = useMatchStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition">
          <ArrowLeft className="w-3 h-3" /> Volver a la vista pública
        </Link>
      </div>

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
          onClick={() => setActiveTab('stats-ai')}
          className={`py-2.5 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'stats-ai'
              ? 'bg-purple-500 text-purple-950 shadow-md shadow-purple-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Stats AI
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
          onClick={() => setActiveTab('gestionar')}
          className={`py-2.5 px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'gestionar'
              ? 'bg-rose-500 text-rose-950 shadow-md shadow-rose-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Gestionar
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
            <MatchForm 
              onAddMatch={addMatch} 
              tournaments={tournaments}
              players={playerNames}
              teamsList={teamsList.map(t => ({ id: t.id || t.slug, name: t.nombre, logoUrl: t.logo_url }))}
              onSuccess={() => {
                filters.clearFilters();
              }} 
            />
          </section>
        )}
        {activeTab === 'stats-ai' && (
          <section className="max-w-xl mx-auto py-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Importar Stats con IA
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Subí una captura de pantalla de estadísticas de FC para extraer y guardar los datos automáticamente
              </p>
            </div>
            <StatsUploader onAddMatch={addMatch} tournaments={tournaments} players={playerNames} teamsList={teamsList.map(t => ({ id: t.id || t.slug, name: t.nombre, logoUrl: t.logo_url }))} />
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
          />
        )}
        {activeTab === 'gestionar' && (
          <section className="max-w-2xl mx-auto py-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Gestionar Partidos
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Elimina partidos y estadísticas. Se pueden restaurar desde la base de datos.
              </p>
            </div>
            <MatchLog
              filteredMatches={filteredMatches}
              filters={filters}
              onDeleteMatch={deleteMatch}
              loading={false}
              error={null}
              readOnly={false}
              getStatsForMatch={getStatsForMatch}
              players={playerNames}
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
                onDeleteTeam={onDeleteTeam}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
