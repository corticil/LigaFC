import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlayerManager from './PlayerManager';

describe('PlayerManager', () => {
  const defaultProps = {
    players: [
      { id: '1', nombre: 'Guille', created_at: '2026-01-01' },
      { id: '2', nombre: 'Checho', created_at: '2026-01-01' },
    ],
    playerNames: ['Guille', 'Checho'],
    onAddPlayer: vi.fn().mockResolvedValue({ success: true }),
    onDeletePlayer: vi.fn().mockResolvedValue({ success: true }),
  };

  it('renders player list', () => {
    render(<PlayerManager {...defaultProps} />);
    expect(screen.getByText('Guille')).toBeInTheDocument();
    expect(screen.getByText('Checho')).toBeInTheDocument();
    expect(screen.getByText('2 registrados')).toBeInTheDocument();
  });

  it('adds a player on form submit', async () => {
    render(<PlayerManager {...defaultProps} />);
    const input = screen.getByPlaceholderText('Nombre del jugador...');
    fireEvent.change(input, { target: { value: 'Seba' } });
    fireEvent.click(screen.getByText('Agregar'));
    await waitFor(() => {
      expect(defaultProps.onAddPlayer).toHaveBeenCalledWith('Seba');
    });
  });

  it('shows error for empty name', async () => {
    render(<PlayerManager {...defaultProps} />);
    const form = screen.getByPlaceholderText('Nombre del jugador...').closest('form');
    fireEvent.submit(form);
    expect(await screen.findByText('Ingresá un nombre')).toBeInTheDocument();
  });

  it('calls onDeletePlayer when delete button clicked', async () => {
    window.confirm = vi.fn(() => true);
    render(<PlayerManager {...defaultProps} />);
    const deleteButtons = screen.getAllByTitle(/Eliminar/);
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onDeletePlayer).toHaveBeenCalledWith('1');
  });
});
