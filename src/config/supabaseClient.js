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

    const buildChain = (filters = {}) => {
      const chain = {
        _filters: [...(filters._filters || [])],
        _orders: [...(filters._orders || [])],
        is(field, value) {
          const newFilters = { _filters: [...this._filters, { field, type: 'is_null', value }], _orders: this._orders };
          return buildChain(newFilters);
        },
        order(column, opts = {}) {
          const newOrders = [...this._orders, { column, ascending: opts.ascending !== false }];
          const newFilters = { _filters: this._filters, _orders: newOrders };
          return buildChain(newFilters);
        },
        update(updates) {
          const data = get();
          const updated = data.map(item => {
            const matches = this._filters.every(f => {
              if (f.type === 'eq') return item[f.field] === f.value;
              return true;
            });
            return matches ? { ...item, ...updates } : item;
          });
          save(updated);
          return Promise.resolve({ data: null, error: null });
        },
        then(fn) {
          let data = get();
          this._filters.forEach(f => {
            if (f.type === 'is_null') data = data.filter(item => item[f.field] === null || item[f.field] === undefined);
            if (f.type === 'eq') data = data.filter(item => item[f.field] === f.value);
          });
          if (this._orders.length > 0) {
            data = [...data].sort((a, b) => {
              for (const o of this._orders) {
                const valA = a[o.column] || '', valB = b[o.column] || '';
                if (valA < valB) return o.ascending ? -1 : 1;
                if (valA > valB) return o.ascending ? 1 : -1;
              }
              return 0;
            });
          }
          return Promise.resolve({ data, error: null }).then(fn);
        },
        eq(field, value) {
          const newFilters = { _filters: [...this._filters, { field, type: 'eq', value }], _orders: this._orders };
          return buildChain(newFilters);
        }
      };
      return chain;
    };

    return {
      select: () => buildChain(),
      insert: (rows) => {
        const data = get();
        const newRows = rows.map(row => ({
          id: Math.random().toString(36).substring(2, 11),
          created_at: new Date().toISOString(),
          torneo_id: null,
          eliminado_en: null,
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
      select: () => {
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
  const mockPartidosStats = () => {
    const KEY = 'ligafc_partidos_stats';
    const get = () => getLocalData(KEY);
    const save = (d) => saveLocalData(KEY, d);

    const buildChain = (filters = {}) => {
      const chain = {
        _filters: [...(filters._filters || [])],
        _orders: [...(filters._orders || [])],
        is(field, value) {
          return buildChain({ _filters: [...this._filters, { field, type: 'is_null', value }], _orders: this._orders });
        },
        eq(field, value) {
          return buildChain({ _filters: [...this._filters, { field, type: 'eq', value }], _orders: this._orders });
        },
        order(column, opts = {}) {
          return buildChain({ _filters: this._filters, _orders: [...this._orders, { column, ascending: opts.ascending !== false }] });
        },
        update(updates) {
          const data = get();
          const updated = data.map(item => {
            const matches = this._filters.every(f => {
              if (f.type === 'eq') return item[f.field] === f.value;
              if (f.type === 'is_null') return item[f.field] === null || item[f.field] === undefined;
              return true;
            });
            return matches ? { ...item, ...updates } : item;
          });
          save(updated);
          return Promise.resolve({ data: null, error: null });
        },
        select() {
          let data = get();
          this._filters.forEach(f => {
            if (f.type === 'is_null') data = data.filter(item => item[f.field] === null || item[f.field] === undefined);
            if (f.type === 'eq') data = data.filter(item => item[f.field] === f.value);
          });
          if (this._orders.length > 0) {
            data = [...data].sort((a, b) => {
              const col = this._orders[0].column;
              const asc = this._orders[0].ascending;
              const valA = a[col] || '', valB = b[col] || '';
              if (valA < valB) return asc ? -1 : 1;
              if (valA > valB) return asc ? 1 : -1;
              return 0;
            });
          }
          return Promise.resolve({ data, error: null });
        },
        single() {
          return this.select().then(({ data, error }) => ({ data: data[0] || null, error }));
        },
        then(fn) {
          let data = get();
          this._filters.forEach(f => {
            if (f.type === 'is_null') data = data.filter(item => item[f.field] === null || item[f.field] === undefined);
            if (f.type === 'eq') data = data.filter(item => item[f.field] === f.value);
          });
          if (this._orders.length > 0) {
            data = [...data].sort((a, b) => {
              const col = this._orders[0].column;
              const asc = this._orders[0].ascending;
              const valA = a[col] || '', valB = b[col] || '';
              if (valA < valB) return asc ? -1 : 1;
              if (valA > valB) return asc ? 1 : -1;
              return 0;
            });
          }
          return Promise.resolve({ data, error: null }).then(fn);
        }
      };
      return chain;
    };

    return {
      select: () => buildChain(),
      insert: (rows) => {
        const data = get();
        const newRows = rows.map(row => ({
          id: Math.random().toString(36).substring(2, 11),
          creado_en: new Date().toISOString(),
          eliminado_en: null,
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
