import { useState } from 'react';
import { PlusCircle, Trophy, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import MatchForm from '../components/MatchForm';
import TournamentManager from '../components/TournamentManager';
import StatsUploader from '../components/StatsUploader';
import MatchLog from '../components/MatchLog';
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
      <div className="flex border-b border-zinc-900 max-w-lg mx-auto bg-zinc-900/20 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('registrar')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'registrar'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Partido
        </button>
        <button
          onClick={() => setActiveTab('stats-ai')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'stats-ai'
              ? 'bg-purple-500 text-purple-950 shadow-md shadow-purple-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Stats AI
        </button>
        <button
          onClick={() => setActiveTab('torneos')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'torneos'
              ? 'bg-yellow-500 text-yellow-950 shadow-md shadow-yellow-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Torneos
        </button>
        <button
          onClick={() => setActiveTab('gestionar')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'gestionar'
              ? 'bg-rose-500 text-rose-950 shadow-md shadow-rose-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Gestionar
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="transition-all duration-300">
        {activeTab === 'registrar' && (
          <section className="max-w-2xl mx-auto py-4">
            <MatchForm 
              onAddMatch={addMatch} 
              tournaments={tournaments}
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
            <StatsUploader onAddMatch={addMatch} tournaments={tournaments} />
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
            />
          </section>
        )}
      </div>
    </div>
  );
}
