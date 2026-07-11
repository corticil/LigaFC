import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamManager from './TeamManager';

vi.mock('../data/teams', () => ({
  getTeamById: (id) => {
    if (id === 'real-madrid') return { id: 'real-madrid', name: 'Real Madrid', logoUrl: '/logos/real-madrid.svg' };
    return null;
  },
}));

describe('TeamManager', () => {
  const defaultProps = {
    teamsList: [
      { id: 'real-madrid', nombre: 'Real Madrid', slug: 'real-madrid', logo_url: '/logos/real-madrid.svg' },
      { id: 'barcelona', nombre: 'FC Barcelona', slug: 'barcelona', logo_url: '/logos/barcelona.svg' },
    ],
    onAddTeam: vi.fn().mockResolvedValue({ success: true }),
    onDeleteTeam: vi.fn().mockResolvedValue({ success: true }),
  };

  it('renders team list with names and slugs', () => {
    render(<TeamManager {...defaultProps} />);
    expect(screen.getByText('Real Madrid')).toBeInTheDocument();
    expect(screen.getByText('FC Barcelona')).toBeInTheDocument();
    expect(screen.getByText('2 registrados')).toBeInTheDocument();
  });

  it('shows new club form when button clicked', () => {
    render(<TeamManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Nuevo Club'));
    expect(screen.getByPlaceholderText('Nombre del club...')).toBeInTheDocument();
    expect(screen.getByText('Subir escudo')).toBeInTheDocument();
  });

  it('calls onDeleteTeam when delete button clicked', async () => {
    window.confirm = vi.fn(() => true);
    render(<TeamManager {...defaultProps} />);
    const deleteButtons = screen.getAllByTitle(/Eliminar/);
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onDeleteTeam).toHaveBeenCalledWith('real-madrid');
  });

  it('validates empty name on submit', async () => {
    render(<TeamManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Nuevo Club'));
    const form = screen.getByPlaceholderText('Nombre del club...').closest('form');
    fireEvent.submit(form);
    expect(await screen.findByText('Ingresá un nombre para el club')).toBeInTheDocument();
  });
});
