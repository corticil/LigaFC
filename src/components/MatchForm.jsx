import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teams } from '../data/teams';
import { PLAYERS } from '../data/players';
import { PlusCircle, Trophy, User } from 'lucide-react';

export default function MatchForm({ onAddMatch, onSuccess, tournaments = [] }) {
  const navigate = useNavigate();
  const [jugador1, setJugador1] = useState(PLAYERS[0]);
  const [jugador2, setJugador2] = useState(PLAYERS[1]);
  const [equipo1Id, setEquipo1Id] = useState(teams[0]?.id || '');
  const [equipo2Id, setEquipo2Id] = useState(teams[1]?.id || '');
  const [goles1, setGoles1] = useState('');
  const [goles2, setGoles2] = useState('');
  const [nota, setNota] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [torneoId, setTorneoId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Buscar los objetos de equipo seleccionados para mostrar sus logos
  const selectedTeam1 = teams.find(t => t.id === equipo1Id);
  const selectedTeam2 = teams.find(t => t.id === equipo2Id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (jugador1 === jugador2) {
      setValidationError('Un jugador no puede jugar contra sí mismo.');
      return;
    }

    if (goles1 === '' || goles2 === '') {
      setValidationError('Debes ingresar los goles de ambos equipos.');
      return;
    }

    const g1 = parseInt(goles1, 10);
    const g2 = parseInt(goles2, 10);

    if (isNaN(g1) || g1 < 0 || isNaN(g2) || g2 < 0) {
      setValidationError('Los goles deben ser números mayores o iguales a 0.');
      return;
    }

    setIsSubmitting(true);

    const result = await onAddMatch({
      jugador_1: jugador1,
      jugador_2: jugador2,
      equipo_1_id: equipo1Id,
      equipo_2_id: equipo2Id,
      goles_1: g1,
      goles_2: g2,
      nota,
      fecha,
      torneo_id: torneoId || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      setGoles1('');
      setGoles2('');
      setNota('');
      setTorneoId('');
      navigate('/');
    } else {
      setValidationError(result.error || 'Ocurrió un error al registrar el partido.');
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-md max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
          <Trophy className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">Registrar Encuentro</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Jugador 1 / Local */}
        <div className="space-y-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Local</span>
            <div className="flex items-center gap-2">
              {selectedTeam1 && (
                <img 
                  src={selectedTeam1.logoUrl} 
                  alt={selectedTeam1.name} 
                  className="w-7 h-7 object-contain transition-all duration-300"
                  onError={(e) => {
                    e.target.src = 'https://crests.football-data.org/none.png';
                  }}
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jugador1" className="block text-xs text-zinc-400 mb-1.5 font-medium">Jugador</label>
              <select
                id="jugador1"
                value={jugador1}
                onChange={(e) => {
                  const val = e.target.value;
                  setJugador1(val);
                  if (val === jugador2) {
                    const other = PLAYERS.find(p => p !== val);
                    setJugador2(other);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {PLAYERS.map(player => (
                  <option key={`form-p1-${player}`} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="equipo1" className="block text-xs text-zinc-400 mb-1.5 font-medium">Equipo</label>
              <select
                id="equipo1"
                value={equipo1Id}
                onChange={(e) => setEquipo1Id(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="goles1" className="block text-xs text-zinc-400 mb-1.5 font-medium">Goles Anotados</label>
            <input
              id="goles1"
              type="number"
              min="0"
              placeholder="0"
              value={goles1}
              onChange={(e) => setGoles1(e.target.value)}
              className="w-full md:w-32 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white text-center font-bold placeholder-zinc-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              required
            />
          </div>
        </div>

        {/* Separador Versus */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-800/80"></div>
          <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-zinc-600">VS</span>
          <div className="flex-grow border-t border-zinc-800/80"></div>
        </div>

        {/* Jugador 2 / Visitante */}
        <div className="space-y-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Visitante</span>
            <div className="flex items-center gap-2">
              {selectedTeam2 && (
                <img 
                  src={selectedTeam2.logoUrl} 
                  alt={selectedTeam2.name} 
                  className="w-7 h-7 object-contain transition-all duration-300"
                  onError={(e) => {
                    e.target.src = 'https://crests.football-data.org/none.png';
                  }}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jugador2" className="block text-xs text-zinc-400 mb-1.5 font-medium">Jugador</label>
              <select
                id="jugador2"
                value={jugador2}
                onChange={(e) => {
                  const val = e.target.value;
                  setJugador2(val);
                  if (val === jugador1) {
                    const other = PLAYERS.find(p => p !== val);
                    setJugador1(other);
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {PLAYERS.map(player => (
                  <option key={`form-p2-${player}`} value={player}>
                    {player}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="equipo2" className="block text-xs text-zinc-400 mb-1.5 font-medium">Equipo</label>
              <select
                id="equipo2"
                value={equipo2Id}
                onChange={(e) => setEquipo2Id(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="goles2" className="block text-xs text-zinc-400 mb-1.5 font-medium">Goles Anotados</label>
            <input
              id="goles2"
              type="number"
              min="0"
              placeholder="0"
              value={goles2}
              onChange={(e) => setGoles2(e.target.value)}
              className="w-full md:w-32 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white text-center font-bold placeholder-zinc-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              required
            />
          </div>
        </div>

        {/* Torneo + Detalles adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="torneo" className="block text-xs text-zinc-400 mb-1.5 font-medium">
              Torneo <span className="text-zinc-600">(opcional)</span>
            </label>
            <select
              id="torneo"
              value={torneoId}
              onChange={(e) => setTorneoId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
            >
              <option value="">-- Sin torneo --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.nombre || t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className="block text-xs text-zinc-400 mb-1.5 font-medium">Fecha del Encuentro</label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="nota" className="block text-xs text-zinc-400 mb-1.5 font-medium">Notas / Comentarios (opcional)</label>
            <input
              id="nota"
              type="text"
              placeholder="Ej: Gol de oro, partidazo"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {validationError && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
            {validationError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-zinc-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
        >
          <PlusCircle className="w-5 h-5" />
          {isSubmitting ? 'Registrando...' : 'Registrar Partido'}
        </button>
      </form>
    </div>
  );
}
