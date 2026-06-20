import React, { useState } from 'react';
import { History, PlusCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import MatchForm from '../components/MatchForm';
import MatchLog from '../components/MatchLog';
import StatsOverview from '../components/StatsOverview';
import H2HMatrix from '../components/H2HMatrix';

export default function AdminView({ 
  stats, 
  filteredMatches, 
  filters, 
  loading, 
  error, 
  addMatch, 
  deleteMatch 
}) {
  const [activeTab, setActiveTab] = useState('historial'); // 'historial' | 'registrar'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition">
          <ArrowLeft className="w-3 h-3" /> Volver a la vista pública
        </Link>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-zinc-900 max-w-md mx-auto bg-zinc-900/20 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'historial'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <History className="w-4 h-4" />
          Historial y Stats
        </button>
        <button
          onClick={() => setActiveTab('registrar')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'registrar'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Encuentro
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="transition-all duration-300">
        {activeTab === 'historial' ? (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Panel de Estadísticas */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 pl-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Resumen y Métricas</h2>
              </div>
              <StatsOverview stats={stats} />
            </section>

            {/* Matriz de H2H */}
            <section>
              <H2HMatrix matches={filteredMatches} />
            </section>

            {/* Historial y Filtros */}
            <section>
              <MatchLog 
                filteredMatches={filteredMatches} 
                filters={filters} 
                onDeleteMatch={deleteMatch}
                loading={loading}
                error={error}
                readOnly={false}
              />
            </section>
          </div>
        ) : (
          <section className="max-w-2xl mx-auto py-4">
            <MatchForm 
              onAddMatch={addMatch} 
              onSuccess={() => {
                setActiveTab('historial');
                filters.clearFilters();
              }} 
            />
          </section>
        )}
      </div>
    </div>
  );
}
