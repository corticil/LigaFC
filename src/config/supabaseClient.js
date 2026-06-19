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

  // Cliente Mock para simular Supabase
  supabase = {
    from: (tableName) => {
      if (tableName !== 'partidos') {
        throw new Error(`La tabla "${tableName}" no está mockeada.`);
      }

      const getLocalMatches = () => {
        try {
          return JSON.parse(localStorage.getItem('ligafc_partidos') || '[]');
        } catch (e) {
          console.error('Error al leer de localStorage:', e);
          return [];
        }
      };

      const saveLocalMatches = (matches) => {
        try {
          localStorage.setItem('ligafc_partidos', JSON.stringify(matches));
        } catch (e) {
          console.error('Error al guardar en localStorage:', e);
        }
      };

      return {
        select: (columns = '*') => {
          const execute = () => {
            const data = getLocalMatches();
            return { data, error: null };
          };

          const order = (column, { ascending = true } = {}) => {
            const subOrder = (col2, options2 = {}) => {
              const { data } = execute();
              const sorted = [...data].sort((a, b) => {
                // Ordenar por la columna principal (generalmente fecha)
                const valA = a[column] || '';
                const valB = b[column] || '';
                
                if (valA < valB) return ascending ? -1 : 1;
                if (valA > valB) return ascending ? 1 : -1;

                // Orden secundario si existe
                if (col2) {
                  const valA2 = a[col2] || '';
                  const valB2 = b[col2] || '';
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
              // Permite resolver directamente con .then() tras el primer .order()
              then: (onFulfilled) => {
                const { data } = execute();
                const sorted = [...data].sort((a, b) => {
                  const valA = a[column] || '';
                  const valB = b[column] || '';
                  if (valA < valB) return ascending ? -1 : 1;
                  if (valA > valB) return ascending ? 1 : -1;
                  return 0;
                });
                return Promise.resolve({ data: sorted, error: null }).then(onFulfilled);
              }
            };
          };

          return {
            order,
            then: (onFulfilled) => {
              return Promise.resolve(execute()).then(onFulfilled);
            }
          };
        },

        insert: (rows) => {
          const data = getLocalMatches();
          const newRows = rows.map(row => ({
            id: Math.random().toString(36).substring(2, 11),
            created_at: new Date().toISOString(),
            ...row
          }));
          const updated = [...newRows, ...data];
          saveLocalMatches(updated);

          return {
            select: () => {
              return Promise.resolve({ data: newRows, error: null });
            },
            then: (onFulfilled) => {
              return Promise.resolve({ data: newRows, error: null }).then(onFulfilled);
            }
          };
        },

        delete: () => {
          return {
            eq: (field, value) => {
              if (field === 'id') {
                const data = getLocalMatches();
                const filtered = data.filter(item => item.id !== value);
                saveLocalMatches(filtered);
                return Promise.resolve({ data: null, error: null });
              }
              return Promise.resolve({ data: null, error: new Error('Filtro de borrado no soportado en mock') });
            }
          };
        }
      };
    }
  };
}
