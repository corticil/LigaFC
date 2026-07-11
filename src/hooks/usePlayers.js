import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { PLAYERS } from '../data/players';

export function usePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;

      if (data && data.length > 0) {
        setPlayers(data);
      } else {
        // Seed from hardcoded fallback
        const seed = PLAYERS.map(nombre => ({
          id: Math.random().toString(36).substring(2, 11),
          nombre,
          created_at: new Date().toISOString(),
        }));
        for (const p of seed) {
          await supabase.from('jugadores').insert([{ nombre: p.nombre }]);
        }
        setPlayers(seed);
      }
    } catch (err) {
      console.error('Error al cargar jugadores:', err);
      // Fallback to hardcoded
      setPlayers(PLAYERS.map(nombre => ({
        id: nombre,
        nombre,
        created_at: new Date().toISOString(),
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const addPlayer = async (nombre) => {
    try {
      const trimmed = nombre.trim();
      if (!trimmed) return { success: false, error: 'El nombre no puede estar vacío' };
      if (players.some(p => p.nombre.toLowerCase() === trimmed.toLowerCase())) {
        return { success: false, error: 'Ya existe un jugador con ese nombre' };
      }
      const { data, error } = await supabase
        .from('jugadores')
        .insert([{ nombre: trimmed }])
        .select();
      if (error) throw error;
      if (data && data[0]) {
        setPlayers(prev => [...prev, data[0]].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      return { success: true };
    } catch (err) {
      console.error('Error al agregar jugador:', err);
      return { success: false, error: err.message };
    }
  };

  const deletePlayer = async (id) => {
    try {
      const { error } = await supabase.from('jugadores').delete().eq('id', id);
      if (error) throw error;
      setPlayers(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar jugador:', err);
      return { success: false, error: err.message };
    }
  };

  // Flat array of names for backward compatibility with components that expect PLAYERS
  const playerNames = players.map(p => p.nombre);

  return {
    players,
    playerNames,
    addPlayer,
    deletePlayer,
    loading,
    refresh: fetchPlayers,
  };
}
