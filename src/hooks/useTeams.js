import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { teams as hardcodedTeams } from '../data/teams';

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function useTeams() {
  const [teamsList, setTeamsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;

      if (data && data.length > 0) {
        setTeamsList(data);
      } else {
        // Seed from hardcoded fallback
        const seed = hardcodedTeams.map(t => ({
          id: t.id,
          nombre: t.name,
          slug: t.id,
          logo_url: t.logoUrl,
          created_at: new Date().toISOString(),
        }));
        for (const t of seed) {
          await supabase.from('equipos').insert([{ nombre: t.nombre, slug: t.slug, logo_url: t.logo_url }]);
        }
        setTeamsList(seed);
      }
    } catch (err) {
      console.error('Error al cargar equipos:', err);
      // Fallback to hardcoded
      setTeamsList(hardcodedTeams.map(t => ({
        id: t.id,
        nombre: t.name,
        slug: t.id,
        logo_url: t.logoUrl,
        created_at: new Date().toISOString(),
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const addTeam = async ({ nombre, logo_url }) => {
    try {
      const trimmedName = nombre.trim();
      if (!trimmedName) return { success: false, error: 'El nombre no puede estar vacío' };
      const slug = slugify(trimmedName);
      if (teamsList.some(t => t.slug === slug)) {
        return { success: false, error: 'Ya existe un club con ese nombre' };
      }
      const { data, error } = await supabase
        .from('equipos')
        .insert([{ nombre: trimmedName, slug, logo_url: logo_url || null }])
        .select();
      if (error) throw error;
      if (data && data[0]) {
        setTeamsList(prev => [...prev, data[0]].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      return { success: true };
    } catch (err) {
      console.error('Error al agregar equipo:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteTeam = async (id) => {
    try {
      const { error } = await supabase.from('equipos').delete().eq('id', id);
      if (error) throw error;
      setTeamsList(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar equipo:', err);
      return { success: false, error: err.message };
    }
  };

  // Lookup helpers (backward compatible with existing components)
  const getTeamById = useCallback((id) => {
    const team = teamsList.find(t => t.id === id || t.slug === id);
    if (!team) return null;
    return { id: team.id || team.slug, name: team.nombre, logoUrl: team.logo_url };
  }, [teamsList]);

  // Normalized array for backward compatibility with components that expect `teams`
  const teamsNormalized = teamsList.map(t => ({
    id: t.id || t.slug,
    name: t.nombre,
    logoUrl: t.logo_url,
  }));

  return {
    teamsList,
    teamsNormalized,
    addTeam,
    deleteTeam,
    getTeamById,
    loading,
    refresh: fetchTeams,
  };
}
