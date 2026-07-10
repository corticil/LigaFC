# Migraciones de Base de Datos

Este documento explica cómo crear, mantener y probar migraciones SQL en LigaFC.

## Stack

- **Base de datos**: Supabase (PostgreSQL)
- **Desarrollo local**: Mock en localStorage (`src/config/supabaseClient.js`)
- **Migraciones**: Archivos SQL en `supabase/migrations/`

## Archivos de migración

Las migraciones están en `supabase/migrations/` con el formato `NNN_descripcion.sql`:

| Archivo | Descripción |
|---|---|
| `002_create_partidos_stats.sql` | Crea la tabla `partidos_stats` para estadísticas extraídas por IA |

## Cómo crear una nueva migración

1. Crear el archivo SQL en `supabase/migrations/`:

```sql
-- supabase/migrations/003_nueva_columna.sql
ALTER TABLE partidos_stats ADD COLUMN nueva_columna TEXT DEFAULT '';
```

2. Actualizar el mock en `src/config/supabaseClient.js` si la tabla existe en el mock. Los mocks usan `...row` spread, por lo que nuevas columnas se guardan automáticamente sin cambios en el mock.

3. Actualizar `src/services/statsProcessor.js` si la columna necesita lógica específica (ej: `saveStatsToSupabase`).

4. Escribir tests en `supabase/migrations/migrations.test.js` para verificar la nueva columna.

## Cómo aplicar migraciones

### En producción (Supabase)

```bash
# Usando Supabase CLI (instalar: npm install -g supabase)
supabase migration up

# O ejecutar manualmente desde el SQL Editor de Supabase
# Copiar el contenido de supabase/migrations/003_nueva_columna.sql
```

### En desarrollo local (mock)

El mock en `src/config/supabaseClient.js` no requiere migraciones. Al arrancar la app (`npm run dev`), el mock se inicializa vacío y acepta cualquier columna.

Para pre-poblar datos de prueba, editar el `localStorage` desde la consola del navegador:

```js
localStorage.setItem('ligafc_partidos_stats', JSON.stringify([...]));
```

## Tests de migraciones

Los tests están en `supabase/migrations/migrations.test.js` y verifican:

- Parseo de cada archivo SQL (columnas, tipos, constraints)
- Que el mock maneja todas las columnas del esquema
- Operaciones CRUD: insert, select, delete, order
- Integridad entre tablas (FK, nulls)
- Compatibilidad con el output de `extractStatsFromImage`

Ejecutar:

```bash
npm test
```

## Buenas prácticas

1. **Usar `IF NOT EXISTS`** en CREATE TABLE para que sea re-ejecutable
2. **Numerar migraciones** secuencialmente (002, 003...)
3. **Agregar comentarios** describiendo cada columna
4. **Testear el mock** con los mismos datos que la migración espera
5. **Mantener sincronizados** el SQL y el mock — los tests de migraciones deberían fallar si falta una columna
6. **Usar JSONB** para datos dinámicos que cambian frecuentemente (evita nuevas migraciones)
