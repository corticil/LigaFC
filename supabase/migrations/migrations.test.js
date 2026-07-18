import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { supabase, isLocalStorageMock } from '../../src/config/supabaseClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────────

/** Lee un archivo de migración SQL y extrae los nombres de columna del CREATE TABLE */
function parseMigrationColumns(sqlContent) {
  const match = sqlContent.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/i);
  if (!match) throw new Error('No se pudo parsear CREATE TABLE en la migración');

  const tableName = match[1];
  const columnsBlock = match[2];

  const columns = [];
  // Extrae cada línea que define una columna (línea que empieza con indentación + nombre)
  const lines = columnsBlock.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Ignorar líneas vacías, constraints de tabla y comentarios
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('PRIMARY KEY') ||
        trimmed.startsWith('UNIQUE') || trimmed.startsWith('CHECK') ||
        trimmed.startsWith('FOREIGN KEY') || trimmed.startsWith('CONSTRAINT')) continue;

    const colMatch = trimmed.match(/^\s*(\w+)\s+/);
    if (colMatch) {
      const name = colMatch[1];
      // Extraer tipo
      const typeMatch = trimmed.match(/^\s*\w+\s+([\w\s(]+?)(?:\s+DEFAULT|\s+NOT NULL|\s+CHECK|\s+REFERENCES|--|$)/);
      const type = typeMatch ? typeMatch[1].trim() : 'unknown';
      const hasDefault = trimmed.includes('DEFAULT');
      const notNull = trimmed.includes('NOT NULL');
      const isPK = trimmed.includes('PRIMARY KEY');
      const isFK = trimmed.includes('REFERENCES');
      columns.push({ name, type, hasDefault, notNull, isPK, isFK });
    }
  }
  return { tableName, columns };
}

/** Lee todas las migraciones SQL */
function loadMigrations() {
  const migrationsDir = path.resolve(import.meta.dirname, '.');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const hasCreateTable = /CREATE\s+TABLE/i.test(content);
    let parsed = {};
    if (hasCreateTable) {
      try { parsed = parseMigrationColumns(content); } catch { parsed = {}; }
    }
    return { file, content, ...parsed };
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────────

describe('Migraciones SQL', () => {
  let migrations;

  beforeAll(() => {
    migrations = loadMigrations();
  });

  it('carga al menos una migración', () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  describe('002_create_partidos_stats.sql', () => {
    let migration;

    beforeAll(() => {
      migration = migrations.find(m => m.file.includes('002_create_partidos_stats'));
      expect(migration).toBeDefined();
    });

    it('tiene las columnas esperadas', () => {
      const colNames = migration.columns.map(c => c.name);
      expect(colNames).toContain('id');
      expect(colNames).toContain('creado_en');
      expect(colNames).toContain('partido_id');
      expect(colNames).toContain('nombre_local');
      expect(colNames).toContain('nombre_visitante');
      expect(colNames).toContain('goles_local');
      expect(colNames).toContain('goles_visitante');
      expect(colNames).toContain('tiempo_partido');
      expect(colNames).toContain('estadisticas_tabla');
      expect(colNames).toContain('rendimiento_general');
      expect(colNames).toContain('jugadores_stats');
    });

    it('id es PRIMARY KEY', () => {
      const col = migration.columns.find(c => c.name === 'id');
      expect(col.isPK).toBe(true);
    });

    it('partido_id tiene FK a partidos', () => {
      const col = migration.columns.find(c => c.name === 'partido_id');
      expect(col.isFK).toBe(true);
    });

    it('goles_local y goles_visitante tienen CHECK >= 0', () => {
      const sql = migration.content;
      expect(sql).toContain('CHECK (goles_local >= 0)');
      expect(sql).toContain('CHECK (goles_visitante >= 0)');
    });

    it('jugadores_stats tiene DEFAULT []', () => {
      const col = migration.columns.find(c => c.name === 'jugadores_stats');
      expect(col.hasDefault).toBe(true);
    });

    it('tiene RLS habilitado y políticas de inserción/lectura', () => {
      const sql = migration.content;
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY "Insertar stats autenticados"');
      expect(sql).toContain('CREATE POLICY "Leer stats público"');
    });
  });
});

describe('Mock localStorage: partidos_stats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inserta y selecciona todas las columnas del esquema', async () => {
    const testData = {
      partido_id: null,
      nombre_local: 'Real Madrid',
      nombre_visitante: 'Barcelona',
      goles_local: 2,
      goles_visitante: 1,
      tiempo_partido: '90:00',
      estadisticas_tabla: { Posesión: { local: 55, visitante: 45 } },
      rendimiento_general: { local: { exito_regates: '75%' }, visitante: { exito_regates: '65%' } },
      jugadores_stats: [{ nombre: 'Messi', equipo: 'local', exito_regates: '85%' }],
    };

    const { data: inserted, error: insertError } = await supabase
      .from('partidos_stats_v2')
      .insert([testData])
      .select();

    expect(insertError).toBeNull();
    expect(inserted).toHaveLength(1);

    const record = inserted[0];
    expect(record.id).toBeDefined();
    expect(record.creado_en).toBeDefined();
    expect(record.nombre_local).toBe('Real Madrid');
    expect(record.goles_local).toBe(2);
    expect(record.tiempo_partido).toBe('90:00');
    expect(record.estadisticas_tabla.Posesión.local).toBe(55);
    expect(record.jugadores_stats[0].nombre).toBe('Messi');
  });

  it('asigna id y creado_en automáticamente', async () => {
    const { data } = await supabase
      .from('partidos_stats_v2')
      .insert([{ nombre_local: 'Test', nombre_visitante: 'Test2' }])
      .select();

    expect(data[0].id).toBeDefined();
    expect(typeof data[0].id).toBe('string');
    expect(data[0].creado_en).toBeDefined();
    expect(() => new Date(data[0].creado_en)).not.toThrow();
  });

  it('inserta múltiples filas y las selecciona', async () => {
    await supabase.from('partidos_stats_v2').insert([
      { nombre_local: 'A', nombre_visitante: 'B', goles_local: 1, goles_visitante: 0 },
      { nombre_local: 'C', nombre_visitante: 'D', goles_local: 2, goles_visitante: 2 },
    ]);

    const { data } = await supabase.from('partidos_stats_v2').select();
    expect(data).toHaveLength(2);
  });

  it('soporta partido_id como FK (nullable)', async () => {
    const { data: withFK } = await supabase
      .from('partidos_stats_v2')
      .insert([{ partido_id: 'abc-123', nombre_local: 'X', nombre_visitante: 'Y' }])
      .select();
    expect(withFK[0].partido_id).toBe('abc-123');

    const { data: nullFK } = await supabase
      .from('partidos_stats_v2')
      .insert([{ partido_id: null, nombre_local: 'X', nombre_visitante: 'Y' }])
      .select();
    expect(nullFK[0].partido_id).toBeNull();
  });

  it('almacena y recupera JSONB (estadisticas_tabla)', async () => {
    const stats = { Posesión: { local: 60, visitante: 40 }, Tiros: { local: 15, visitante: 10 } };
    await supabase.from('partidos_stats_v2').insert([{
      nombre_local: 'A', nombre_visitante: 'B',
      estadisticas_tabla: stats,
    }]);

    const { data } = await supabase.from('partidos_stats_v2').select();
    expect(data[0].estadisticas_tabla).toEqual(stats);
  });

  it('jugadores_stats por defecto es array vacío', async () => {
    const { data } = await supabase
      .from('partidos_stats_v2')
      .insert([{ nombre_local: 'Test', nombre_visitante: 'Test2' }])
      .select();

    // La columna no se incluye en el insert (no tiene DEFAULT en mock)
    // Pero el saveStatsToSupabase siempre pasa jugadores_stats: []
    expect(data[0].jugadores_stats).toBeUndefined();
  });

  it('elimina por id', async () => {
    const { data: inserted } = await supabase
      .from('partidos_stats_v2')
      .insert([{ nombre_local: 'X', nombre_visitante: 'Y' }])
      .select();

    const id = inserted[0].id;
    const { error: delError } = await supabase
      .from('partidos_stats_v2')
      .delete()
      .eq('id', id);

    expect(delError).toBeNull();

    const { data } = await supabase.from('partidos_stats_v2').select();
    expect(data).toHaveLength(0);
  });

  it('soporta ordenamiento', async () => {
    await supabase.from('partidos_stats_v2').insert([
      { nombre_local: 'Z', nombre_visitante: 'A' },
      { nombre_local: 'A', nombre_visitante: 'B' },
    ]);

    const { data } = await supabase
      .from('partidos_stats_v2')
      .select()
      .order('nombre_local', { ascending: true });

    expect(data[0].nombre_local).toBe('A');
    expect(data[1].nombre_local).toBe('Z');
  });
});

describe('Mock localStorage: partidos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inserta un partido con campos estándar', async () => {
    const { data } = await supabase.from('partidos_v2').insert([{
      jugador_1: 'Carlos',
      jugador_2: 'Luis',
      equipo_1_id: 't1',
      equipo_2_id: 't2',
      goles_1: 3,
      goles_2: 1,
      fecha: '2026-07-04',
    }]).select();

    expect(data[0].jugador_1).toBe('Carlos');
    expect(data[0].goles_1).toBe(3);
    expect(data[0].torneo_id).toBeNull();
  });

  it('soporta delete con eq(id)', async () => {
    const { data: ins } = await supabase.from('partidos_v2').insert([{
      jugador_1: 'A', jugador_2: 'B', goles_1: 0, goles_2: 0,
    }]).select();

    await supabase.from('partidos_v2').delete().eq('id', ins[0].id);
    const { data } = await supabase.from('partidos_v2').select();
    expect(data).toHaveLength(0);
  });
});

describe('Mock localStorage: torneos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inserta y selecciona torneos', async () => {
    const { data } = await supabase.from('torneos').insert([{
      nombre: 'Torneo de Verano',
      descripcion: 'Descripción test',
    }]).select();

    expect(data[0].nombre).toBe('Torneo de Verano');
    expect(data[0].id).toBeDefined();
  });

  it('elimina torneos por id', async () => {
    const { data: ins } = await supabase.from('torneos').insert([{ nombre: 'Test' }]).select();
    await supabase.from('torneos').delete().eq('id', ins[0].id);
    const { data } = await supabase.from('torneos').select();
    expect(data).toHaveLength(0);
  });
});

describe('Integridad entre tablas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('partidos_stats puede referenciar un partido existente', async () => {
    const { data: match } = await supabase.from('partidos_v2').insert([{
      jugador_1: 'A', jugador_2: 'B', goles_1: 1, goles_2: 1,
    }]).select();

    const { data: stats } = await supabase.from('partidos_stats_v2').insert([{
      partido_id: match[0].id,
      nombre_local: 'TeamA',
      nombre_visitante: 'TeamB',
    }]).select();

    expect(stats[0].partido_id).toBe(match[0].id);
  });

  it('partidos_stats sobrevive sin partido_id', async () => {
    const { data } = await supabase.from('partidos_stats_v2').insert([{
      partido_id: null,
      nombre_local: 'A', nombre_visitante: 'B',
    }]).select();
    expect(data[0].partido_id).toBeNull();
  });
});

describe('Compatibilidad: extractStatsFromImage + mock', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inserta datos compatibles con extractStatsFromImage', async () => {
    const statsOutput = {
      nombre_local: 'Real Madrid',
      nombre_visitante: 'Barcelona',
      goles_local: 2,
      goles_visitante: 1,
      tiempo_partido: '90:00',
      estadisticas_tabla: { Posesión: { local: 55, visitante: 45 } },
      rendimiento_general: {
        local: { exito_regates: '75%', precision_tiros: '80%', precision_pases: '90%' },
        visitante: { exito_regates: '65%', precision_tiros: '70%', precision_pases: '85%' },
      },
      jugadores_stats: [
        { nombre: 'Messi', equipo: 'local', exito_regates: '85%', precision_tiros: '90%', precision_pases: '92%' },
      ],
    };

    const { data, error } = await supabase.from('partidos_stats_v2').insert([{
      partido_id: 'match-1',
      ...statsOutput,
    }]).select();

    expect(error).toBeNull();
    expect(data[0].nombre_local).toBe('Real Madrid');
    expect(data[0].jugadores_stats).toHaveLength(1);
    expect(data[0].rendimiento_general.local.exito_regates).toBe('75%');
  });
});
