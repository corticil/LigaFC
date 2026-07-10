import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabase;
export let isLocalStorageMock = false;

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  isLocalStorageMock = false;
  console.log('⚡ Conectado correctamente a la base de datos de Supabase.');
} else {
  isLocalStorageMock = true;
  console.warn('⚠️ No se detectaron credenciales de Supabase válidas. Usando almacenamiento local (localStorage) como fallback.');

  // ─── Helpers genéricos ────────────────────────────────────────────────────
  const getLocalData = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { console.error('Error leyendo localStorage:', e); return []; }
  };

  const saveLocalData = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error('Error guardando localStorage:', e); }
  };

  // ─── Tabla "partidos" ─────────────────────────────────────────────────────
  const mockPartidos = () => {
    const KEY = 'ligafc_partidos';
    const get = () => getLocalData(KEY);
    const save = (d) => saveLocalData(KEY, d);

    return {
      select: (columns = '*') => {
        const execute = () => ({ data: get(), error: null });
        const order = (column, { ascending = true } = {}) => {
          const subOrder = (col2, options2 = {}) => {
            const { data } = execute();
            const sorted = [...data].sort((a, b) => {
              const valA = a[column] || '', valB = b[column] || '';
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              if (col2) {
                const valA2 = a[col2] || '', valB2 = b[col2] || '';
                const asc2 = options2.ascending !== false;
                if (valA2 < valB2) return asc2 ? -1 : 1;
                if (valA2 > valB2) return asc2 ? 1 : -1;
              }
              return 0;
            });
            return Promise.resolve({ data: sorted, error: null });
          };
          return {
            order: subOrder,
            then: (fn) => {
              const { data } = execute();
              const sorted = [...data].sort((a, b) => {
                const valA = a[column] || '', valB = b[column] || '';
                if (valA < valB) return ascending ? -1 : 1;
                if (valA > valB) return ascending ? 1 : -1;
                return 0;
              });
              return Promise.resolve({ data: sorted, error: null }).then(fn);
            }
          };
        };
        return { order, then: (fn) => Promise.resolve(execute()).then(fn) };
      },

      insert: (rows) => {
        const data = get();
        const newRows = rows.map(row => ({
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          torneo_id: null,
          ...row
        }));
        save([...newRows, ...data]);
        return {
          select: () => Promise.resolve({ data: newRows, error: null }),
          then: (fn) => Promise.resolve({ data: newRows, error: null }).then(fn)
        };
      },

      delete: () => ({
        eq: (field, value) => {
          if (field === 'id') {
            save(get().filter(item => item.id !== value));
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: new Error('Filtro no soportado en mock') });
        }
      })
    };
  };

  // ─── Tabla "torneos" ──────────────────────────────────────────────────────
  const mockTorneos = () => {
    const KEY = 'ligafc_torneos_v2';
    const get = () => getLocalData(KEY);
    const save = (d) => saveLocalData(KEY, d);

    return {
      select: (columns = '*') => {
        const order = (column, { ascending = true } = {}) => {
          const data = get();
          const sorted = [...data].sort((a, b) => {
            const valA = a[column] || '', valB = b[column] || '';
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
          });
          return Promise.resolve({ data: sorted, error: null });
        };
        return {
          order,
          then: (fn) => Promise.resolve({ data: get(), error: null }).then(fn)
        };
      },

      insert: (rows) => {
        const data = get();
        const newRows = rows.map(row => ({
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          ...row
        }));
        save([...newRows, ...data]);
        return {
          select: () => Promise.resolve({ data: newRows, error: null }),
          then: (fn) => Promise.resolve({ data: newRows, error: null }).then(fn)
        };
      },

      delete: () => ({
        eq: (field, value) => {
          if (field === 'id') {
            save(get().filter(item => item.id !== value));
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: new Error('Filtro no soportado en mock') });
        }
      })
    };
  };

  // ─── Tabla "partidos_stats" ────────────────────────────────────────────────
  // Mock para pruebas locales en localStorage
  // Almacena partido + estadísticas generales + stats por jugador en JSONB
  const mockPartidosStats = () => {
    const KEY = 'ligafc_partidos_stats';
    const get = () => getLocalData(KEY);
    const save = (d) => saveLocalData(KEY, d);

    return {
      // select: devuelve todos los registros, con soporte para .order()
      select: (columns = '*') => {
        const order = (column, { ascending = true } = {}) => {
          const data = get();
          const sorted = [...data].sort((a, b) => {
            const valA = a[column] || '', valB = b[column] || '';
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
          });
          return Promise.resolve({ data: sorted, error: null });
        };
        return {
          order,
          then: (fn) => Promise.resolve({ data: get(), error: null }).then(fn)
        };
      },

      // insert: agrega nuevos registros con ID y fecha automáticos
      insert: (rows) => {
        const data = get();
        const newRows = rows.map(row => ({
          id: Math.random().toString(36).substring(2, 11),
          creado_en: new Date().toISOString(),
          ...row
        }));
        save([...newRows, ...data]);
        return {
          select: () => Promise.resolve({ data: newRows, error: null }),
          then: (fn) => Promise.resolve({ data: newRows, error: null }).then(fn)
        };
      },

      // delete: elimina un registro por ID (.eq('id', valor))
      delete: () => ({
        eq: (field, value) => {
          if (field === 'id') {
            save(get().filter(item => item.id !== value));
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: new Error('Filtro no soportado en mock') });
        }
      })
    };
  };

  // ─── Cliente Mock unificado ───────────────────────────────────────────────
  supabase = {
    from: (tableName) => {
      if (tableName === 'partidos') return mockPartidos();
      if (tableName === 'torneos')  return mockTorneos();
      if (tableName === 'partidos_stats') return mockPartidosStats();
      throw new Error(`La tabla "${tableName}" no está mockeada.`);
    }
  };
}
