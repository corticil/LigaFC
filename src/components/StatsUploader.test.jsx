import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatsUploader from './StatsUploader';

vi.mock('../data/teams', () => ({
  teams: [
    { id: 't1', name: 'Real Madrid' },
    { id: 't2', name: 'Barcelona' },
  ],
  getTeamById: () => null,
}));

vi.mock('../data/players', () => ({
  PLAYERS: ['Carlos', 'Luis', 'Messi'],
}));

describe('StatsUploader', () => {
  it('renders upload area with drag and drop', () => {
    render(
      <MemoryRouter>
        <StatsUploader onAddMatch={() => {}} tournaments={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText('Arrastra una imagen aquí')).toBeInTheDocument();
    expect(screen.getByText('Tomar Foto')).toBeInTheDocument();
  });

  it('renders upload view when no image has been processed', () => {
    render(
      <MemoryRouter>
        <StatsUploader onAddMatch={() => {}} tournaments={[]} />
      </MemoryRouter>
    );

    // No se puede setear el estado interno fácilmente; verificamos la vista de upload
    expect(screen.getByText('Arrastra una imagen aquí')).toBeInTheDocument();
    expect(screen.getByText('o haz clic para seleccionar un archivo')).toBeInTheDocument();
  });
});
