# LigaFC

Aplicación web para gestionar partidos de fútbol, con importación de estadísticas mediante IA (Gemini 2.5 Flash).

## Stack

- **React 19** + **Vite 8** (dev server con proxy)
- **Tailwind CSS v4**
- **Supabase** (base de datos, o localStorage mock para desarrollo local)
- **Gemini 2.5 Flash** (extracción de estadísticas desde imágenes)

## Archivos clave del feature de Stats IA

| Archivo | Propósito |
|---|---|
| `src/services/statsProcessor.js` | Comprime imagen, llama a Gemini vía proxy, normaliza respuesta, guarda en DB |
| `src/components/StatsUploader.jsx` | UI de 3 pasos: upload → procesar → confirmar/guardar |
| `src/components/MatchStatsModal.jsx` | Modal que muestra estadísticas generales + por jugador |
| `src/hooks/useMatchStats.js` | Hook que carga stats y las empareja con partidos (FK + fallback) |
| `src/components/MatchLog.jsx` | Lista de partidos con botón "Ver Stats" si existen |
| `vite.config.js` | Proxy `/api/gemini` que inyecta API key desde `.env` (server-side) |
| `supabase/migrations/002_create_partidos_stats.sql` | Tabla `partidos_stats` con columnas JSONB |
| `src/config/supabaseClient.js` | Cliente Supabase + mock localStorage para desarrollo sin conexión |

## Configuración

### Variables de entorno (`.env`)

```
GEMINI_API_KEY=tu_api_key_de_gemini
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_APP_PASSWORD=ligafc
```

### Desarrollo local

```bash
npm install
npm run dev
```

Para exponer en la red local (probar desde el celular):

```bash
npm run dev -- --host
```

### Seguridad de la API Key

`GEMINI_API_KEY` se lee en `vite.config.js` mediante `loadEnv` y se inyecta solo en el proxy del servidor de desarrollo (`/api/gemini`). Nunca se expone al bundle del navegador.

## Flujo de importación de estadísticas

1. **Upload**: El usuario arrastra/sube/toma foto de una pantalla de estadísticas
2. **Compresión**: La imagen se comprime a JPEG 1920px (calidad 0.7) al subirla
3. **Extracción**: Se envía al proxy de Vite → Gemini 2.5 Flash con `responseMimeType: "application/json"`
4. **Revisión**: El usuario confirma/corrige equipos, jugadores, torneo y fecha
5. **Guardado**: Se crea el partido (tabla `partidos`) y las estadísticas (tabla `partidos_stats`) vinculadas por FK

## Estructura de `partidos_stats`

```json
{
  "id": "uuid",
  "partido_id": "uuid (FK a partidos)",
  "nombre_local": "Real Madrid",
  "nombre_visitante": "Barcelona",
  "goles_local": 2,
  "goles_visitante": 1,
  "tiempo_partido": "90:00",
  "estadisticas_tabla": {
    "Posesión": { "local": 55, "visitante": 45 },
    "Tiros": { "local": 12, "visitante": 8 }
  },
  "rendimiento_general": {
    "local": { "exito_regates": "75%", "precision_tiros": "80%", "precision_pases": "90%" },
    "visitante": { "exito_regates": "65%", "precision_tiros": "70%", "precision_pases": "85%" }
  },
  "jugadores_stats": [
    { "nombre": "Messi", "equipo": "local", "exito_regates": "85%", "precision_tiros": "90%", "precision_pases": "92%" }
  ]
}
```

## Despliegue

- **Plataforma**: Vercel
- **URL**: https://liga-fc.vercel.app

## Mock local (sin Supabase)

Cuando `VITE_SUPABASE_URL` no está configurada o falla la conexión, el sistema usa localStorage como backend simulado. Las tablas disponibles son:

- `partidos` → `localStorage.ligafc_partidos`
- `torneos` → `localStorage.ligafc_torneos`
- `partidos_stats` → `localStorage.ligafc_partidos_stats`
