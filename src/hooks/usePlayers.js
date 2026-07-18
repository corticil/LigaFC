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
        .from('jugadores_v2')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;

      // Deduplicate by nombre (StrictMode fix)
      const seen = new Set();
      const unique = (data || []).filter(p => {
        const key = p.nombre.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (unique.length < (data || []).length) {
        localStorage.setItem('ligafc_jugadores', JSON.stringify(unique));
      }

      if (unique.length > 0) {
        setPlayers(unique);
      } else {
        // Seed from hardcoded fallback — skip if already seeded
        const existingNames = new Set(data?.map(p => p.nombre.toLowerCase()) || []);
        const toSeed = PLAYERS.filter(nombre => !existingNames.has(nombre.toLowerCase()));
        if (toSeed.length > 0) {
          for (const nombre of toSeed) {
            await supabase.from('jugadores_v2').insert([{ nombre }]);
          }
        }
        // Re-fetch after seeding to get full list
        const { data: seeded } = await supabase.from('jugadores_v2').select('*').order('nombre', { ascending: true });
        setPlayers(seeded || []);
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
        .from('jugadores_v2')
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
      const { error } = await supabase.from('jugadores_v2').delete().eq('id', id);
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
