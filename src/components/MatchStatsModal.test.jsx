import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchStatsModal from './MatchStatsModal';

vi.mock('../data/teams', () => ({
  getTeamById: (id) => {
    const teams = { 'eq-1': { name: 'Real Madrid' }, 'eq-2': { name: 'Barcelona' } };
    return teams[id] || null;
  },
}));

const mockMatch = {
  equipo_1_id: 'eq-1',
  equipo_2_id: 'eq-2',
  jugador_1: 'Carlos',
  jugador_2: 'Luis',
  goles_1: 2,
  goles_2: 1,
};

const mockStats = {
  tiempo_partido: '90:00',
  estadisticas_tabla: { Posesión: { local: 55, visitante: 45 }, Tiros: { local: 12, visitante: 8 } },
  rendimiento_general: {
    local: { exito_regates: '75%', precision_tiros: '80%', precision_pases: '90%' },
    visitante: { exito_regates: '65%', precision_tiros: '70%', precision_pases: '85%' },
  },
  jugadores_stats: [
    { nombre: 'Messi', equipo: 'local', exito_regates: '85%', precision_tiros: '90%', precision_pases: '92%' },
  ],
};

describe('MatchStatsModal', () => {
  it('renders scoreboard with teams and players', () => {
    render(<MatchStatsModal match={mockMatch} stats={mockStats} onClose={() => {}} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('Real Madrid')).toBeInTheDocument();
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
  });

  it('renders stats table with metrics', () => {
    render(<MatchStatsModal match={mockMatch} stats={mockStats} onClose={() => {}} />);
    expect(screen.getByText('Posesión')).toBeInTheDocument();
    expect(screen.getByText('Tiros')).toBeInTheDocument();
  });

  it('renders rendimiento section', () => {
    render(<MatchStatsModal match={mockMatch} stats={mockStats} onClose={() => {}} />);
    expect(screen.getByText('Rendimiento')).toBeInTheDocument();
    expect(screen.getAllByText('Regates').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Precisión Tiros')).toBeInTheDocument();
    expect(screen.getByText('Precisión Pases')).toBeInTheDocument();
  });

  it('renders per-player stats section', () => {
    render(<MatchStatsModal match={mockMatch} stats={mockStats} onClose={() => {}} />);
    expect(screen.getByText('Messi')).toBeInTheDocument();
    expect(screen.getByText('Stats por Jugador')).toBeInTheDocument();
  });

  it('calls onClose when clicking backdrop', async () => {
    const onClose = vi.fn();
    const { container } = render(<MatchStatsModal match={mockMatch} stats={mockStats} onClose={onClose} />);
    await userEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not render when match or stats is null', () => {
    const { container } = render(<MatchStatsModal match={null} stats={null} onClose={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});
