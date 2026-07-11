import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsOverview from '../components/StatsOverview';
import MatchLog from '../components/MatchLog';
import H2HMatrix from '../components/H2HMatrix';
import { useMatchStats } from '../hooks/useMatchStats';

export default function PublicView({ stats, filteredMatches, filters, loading, error, players = [], teamsList = [], getTeamById = null }) {
  const { getStatsForMatch } = useMatchStats();
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Panel de Estadísticas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Resumen y Métricas</h2>
          </div>
          <Link to="/admin" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition">
            Área de Administración <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <StatsOverview stats={stats} />
      </section>

      {/* Matriz de H2H */}
      <section>
        <H2HMatrix matches={filteredMatches} players={players} />
      </section>

      {/* Historial y Filtros */}
      <section>
        <MatchLog 
          filteredMatches={filteredMatches} 
          filters={filters} 
          loading={loading}
          error={error}
          readOnly={true}
          getStatsForMatch={getStatsForMatch}
          players={players}
          teamsList={teamsList}
          resolveTeam={getTeamById}
        />
      </section>
    </div>
  );
}
