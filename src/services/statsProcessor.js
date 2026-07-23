import { supabase } from '../config/supabaseClient';
import Tesseract from 'tesseract.js';
import { teams as defaultTeams } from '../data/teams';

const devLog = (...args) => { if (import.meta.env.DEV) console.log(...args); };

export const GEMINI_MODELS = {
  flash: 'gemini-2.5-flash',
  flashLite: 'gemini-3.1-flash-lite',
};

// ─── Compresión ────────────────────────────────────────────────────────────

/**
 * Comprime una imagen a WebP con resolución máxima de 1200px
 * @param {File} file - Archivo de imagen original
 * @param {number} maxDimension - Ancho/alto máximo (default 1200)
 * @param {number} quality - Calidad 0-1 (default 0.5)
 * @returns {Promise<Blob>} Blob con la imagen comprimida
 */
export function compressImage(file, maxDimension = 800, quality = 0.4) {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('La imagen es demasiado grande. Intentá con una de menor resolución.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) { height = Math.round((height / width) * maxDimension); width = maxDimension; }
          else { width = Math.round((width / height) * maxDimension); height = maxDimension; }
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('No se pudo comprimir la imagen'));
          }, 'image/webp', quality);
        } catch (e) {
          reject(new Error('No hay memoria suficiente para procesar esta imagen. Tomá la foto de nuevo con menor resolución.'));
        }
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un File/Blob a base64 (parte de datos solamente)
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
function imageFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Envía la imagen al proxy de Vite que reenvía a Gemini API
 * El proxy (/api/gemini) inyecta la API key desde .env, nunca expuesta al cliente
 * @param {File} imageFile - Imagen comprimida lista para enviar
 * @returns {Promise<Object>} JSON parseado con partido, estadísticas y jugadores
 */
async function callGeminiViaProxy(imageFile, model = GEMINI_MODELS.flash) {
  const base64Image = await imageFileToBase64(imageFile);

  const prompt = `Analiza la imagen de esta pantalla de estadísticas de fútbol. Extrae la información y organízala estrictamente en este formato JSON:
{
    "partido": {
        "local": "Nombre Local", "visitante": "Nombre Visitante", "goles_local": 0, "goles_visitante": 0, "tiempo": "00:00"
    },
    "estadisticas_tabla": {
        "Métrica": {"local": 0, "visitante": 0}
    },
    "rendimiento_general": {
        "local": {"exito_regates": "0%", "precision_tiros": "0%", "precision_pases": "0%"},
        "visitante": {"exito_regates": "0%", "precision_tiros": "0%", "precision_pases": "0%"}
    },
    "jugadores_stats": [
        {"nombre": "Nombre Jugador", "equipo": "local", "exito_regates": "0%", "precision_tiros": "0%", "precision_pases": "0%"}
    ]
}`;

  const buildBody = (m) => {
    const isLite = m === GEMINI_MODELS.flashLite;
    const body = {
      model: m,
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/webp', data: base64Image } },
          { text: isLite ? `${prompt}\n\nIMPORTANTE: Devuelve SOLAMENTE el JSON, sin texto adicional, sin markdown, sin backticks.` : prompt },
        ],
      }],
      generationConfig: {},
    };
    // Flash soporta responseMimeType, Flash-Lite puede no soportarlo sin schema
    if (!isLite) {
      body.generationConfig.responseMimeType = 'application/json';
    }
    return JSON.stringify(body);
  };

  const doFetch = (m) => fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: buildBody(m),
  });

  let response = await doFetch(model);

  // Fallback automático: si Flash devuelve 429 (rate limit), reintentar con Flash-Lite
  if (response.status === 429 && model === GEMINI_MODELS.flash) {
    devLog('%c[Gemini] Flash agotado (429), cambiando a Flash-Lite...', 'background:#222;color:#f59e0b;font-weight:bold');
    response = await doFetch(GEMINI_MODELS.flashLite);
    model = GEMINI_MODELS.flashLite;
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errBody}`);
  }

  const data = await response.json();
  devLog('%c[Gemini] Respuesta raw:', 'background:#222;color:#f97316;font-weight:bold', JSON.parse(JSON.stringify(data)));
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió texto en la respuesta');

  // Flash-Lite puede envolver el JSON en markdown backticks
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const parsed = JSON.parse(text);
  parsed._model = model;
  return parsed;
}

/**
 * Orquesta la extracción: comprime la imagen, la envía a Gemini y normaliza la respuesta
 * @param {File} imageFile - Imagen original subida por el usuario
 * @returns {Promise<Object>} Datos normalizados del partido, estadísticas y jugadores
 */
export async function extractStatsFromImage(imageFile, model = GEMINI_MODELS.flash) {
  const parsed = await callGeminiViaProxy(imageFile, model);
  devLog('%c[Gemini] Respuesta completa:', 'background:#222;color:#a78bfa;font-weight:bold', parsed);
  const usedModel = parsed._model || model;
  delete parsed._model;
  const result = {
    nombre_local: parsed.partido?.local || '',
    nombre_visitante: parsed.partido?.visitante || '',
    goles_local: parsed.partido?.goles_local ?? 0,
    goles_visitante: parsed.partido?.goles_visitante ?? 0,
    tiempo_partido: parsed.partido?.tiempo || '',
    estadisticas_tabla: parsed.estadisticas_tabla || {},
    rendimiento_general: parsed.rendimiento_general || {},
    jugadores_stats: parsed.jugadores_stats || [],
  };
  devLog('%c[Gemini] Datos normalizados:', 'background:#222;color:#a78bfa;font-weight:bold', result);
  result.modelo_usado = usedModel;
  return result;
}

/**
 * Guarda los datos de estadísticas en Supabase (o localStorage mock)
 * Vincula opcionalmente al partido mediante partido_id
 * @param {Object} statsData - Datos normalizados desde extractStatsFromImage
 * @param {string} [partidoId] - UUID del partido asociado
 * @returns {Promise<Object>} Registro guardado
 */
export async function saveStatsToSupabase(statsData, partidoId) {
  const { data: { session } } = await supabase.auth.getSession();
  devLog('%c[Gemini] Session before save:', 'background:#222;color:#f59e0b;font-weight:bold', session ? { user: session.user.email, role: session.user.role } : 'NO SESSION');

  const { data, error } = await supabase.from('partidos_stats_v2').insert([{
    partido_id: partidoId || null,
    nombre_local: statsData.nombre_local,
    nombre_visitante: statsData.nombre_visitante,
    goles_local: statsData.goles_local,
    goles_visitante: statsData.goles_visitante,
    tiempo_partido: statsData.tiempo_partido,
    estadisticas_tabla: statsData.estadisticas_tabla,
    rendimiento_general: statsData.rendimiento_general,
    jugadores_stats: statsData.jugadores_stats || [],
  }]).select();

  if (error) throw error;
  const saved = data?.[0] || data;

  return saved;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function findTeam(rawName, teamsRef) {
  const normalized = normalize(rawName);
  const exact = teamsRef.find(t => normalize(t.name) === normalized);
  if (exact) return exact;
  return teamsRef.find(t => normalize(t.name).includes(normalized) || normalized.includes(normalize(t.name)));
}

/**
 * Limpia un nombre de equipo extraído por OCR usando fuzzy matching contra teams conocidos
 * @param {string} rawName - Nombre crudo desde OCR
 * @param {Array} [teamsRef] - Lista de equipos conocidos (fallback a hardcoded)
 * @returns {string} Nombre limpio o el original si no hay match
 */
function cleanTeamName(rawName, teamsRef) {
  const cleaned = rawName.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '').trim();
  if (cleaned.length < 3) return rawName;
  const matched = findTeam(cleaned, teamsRef);
  if (matched) return matched.name;

  // Fallback: extraer la parte más larga que coincida con algún equipo
  const words = cleaned.split(/\s+/);
  for (let len = words.length; len > 1; len--) {
    for (let start = 0; start <= words.length - len; start++) {
      const sub = words.slice(start, start + len).join(' ');
      const m = findTeam(sub, teamsRef);
      if (m) return m.name;
    }
  }
  return cleaned;
}

// ─── OCR (Tesseract.js) ─────────────────────────────────────────────────────

/**
 * Diccionario de estadísticas de fútbol en español (con variaciones OCR)
 * Cada entrada: [regex, nombreCanónico, esPorcentaje]
 */
const STAT_PATTERNS = [
  // Específicos primero (para evitar que genéricos roben datos)
  [/recuperaciones?\s+en\s+el\s+[a-záéíóúñ]+|atajadas?\s*\(/i, null, false], // basura
  [/recuperaci[oó]n\s+de\s+bal[oó]n/i, 'Recuperación de balón', false],
  [/recuperaciones?\b(?!\s+de\s+bal[oó]n)/i, 'Recuperaciones', false],
  [/entradas?\s+con\s+[eé]xito/i, 'Entradas con éxito', false],
  [/entradas?\b(?!\s+con\s+[eé]xito)/i, 'Entradas', false],
  [/tiros?\s+de\s+esquina/i, 'Tiros de esquina', false],
  [/tiros?\s+libres?/i, 'Tiros libres', false],
  [/tiros?\s+(?:a\s+puerta|al\s+arco|a\s+porter[ií]a)/i, 'Tiros a puerta', false],
  [/tiros?\b(?!\s+(?:de|libre|a\s+|al\s+))/i, 'Tiros', false],
  [/[^a-záéíóúñ]tiros?\b/i, 'Tiros', false], // catch "5 Tiros 1" when not at start
  [/goles?\s+esperados?/i, 'Goles esperados', false],
  [/poses[iíó]?[oó]n/i, 'Posesión', true],
  [/%\s+de\s+poses[iíó]?[oó]n/i, 'Posesión', true],
  [/pases?\s*(?:completados)?/i, 'Pases', false],
  [/atajadas?/i, 'Atajadas', false],
  [/faltas?\s+cometidas?/i, 'Faltas cometidas', false],
  [/fueras?\s+de\s+lugar/i, 'Fueras de lugar', false],
  [/fuera\s+de\s+juego/i, 'Fueras de lugar', false],
  [/offside/i, 'Fueras de lugar', false],
  [/c[oó]rners?/i, 'Tiros de esquina', false],
  [/penales?|penaltis?|penalties?/i, 'Penales', false],
  [/tarjetas?\s+amarillas?/i, 'Tarjetas amarillas', false],
  [/tarjetas?\s+rojas?/i, 'Tarjetas rojas', false],
  [/remates?/i, 'Tiros', false],
];

/**
 * Parsea texto OCR de una pantalla de estadísticas de fútbol
 * Busca patrones comunes: equipos, marcador, tiempo, métricas y jugadores
 * @param {string} text - Texto extraído por OCR
 * @returns {Object} Datos normalizados del partido
 */
export function parseOcrText(text, teamsRef) {
  const teamsToUse = teamsRef && teamsRef.length > 0 ? teamsRef : defaultTeams;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    nombre_local: '',
    nombre_visitante: '',
    goles_local: 0,
    goles_visitante: 0,
    tiempo_partido: '',
    estadisticas_tabla: {},
    rendimiento_general: {},
    jugadores_stats: [],
  };

  // ── 1. Línea por línea: marcador, tiempo, equipos ──
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Marcador: "2:4", "2 - 1", "2-1", "3–0"
    const scoreMatch = line.match(/(\d+)\s*[:–—\-]\s*(\d+)/);
    if (scoreMatch && !result.goles_local && !result.goles_visitante) {
      result.goles_local = parseInt(scoreMatch[1]);
      result.goles_visitante = parseInt(scoreMatch[2]);

      // Equipos en líneas anterior y posterior (con fuzzy matching)
      const tryExtractTeam = (idx) => {
        if (idx < 0 || idx >= lines.length) return '';
        const raw = lines[idx].replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '').trim();
        if (raw.length < 3) return '';
        // Si es muy corto o coincide con un patrón de stat, rechazar
        if (raw.length < 6 || /posesi[oó]n|tiros|pases?|goles|entradas?|faltas|atajadas?|penales?|tarjetas?|recuperaci[oó]n|precisi[oó]n|tasa|esquina|libre|rendimiento|exito|regates?/i.test(raw)) return '';
        return cleanTeamName(raw, teamsToUse);
      };

      if (i > 0 && !result.nombre_local) {
        result.nombre_local = tryExtractTeam(i - 1);
      }
      if (i < lines.length - 1 && !result.nombre_visitante) {
        result.nombre_visitante = tryExtractTeam(i + 1);
      }

      // Si el visitante no se encontró o es inválido, buscar líneas más allá
      if (!result.nombre_visitante || result.nombre_visitante.length < 4 || /posesi[oó]n|tiros|pases?|esperados/.test(result.nombre_visitante)) {
        result.nombre_visitante = '';
        for (let j = i + 2; j < Math.min(i + 8, lines.length); j++) {
          const name = tryExtractTeam(j);
          if (name) {
            result.nombre_visitante = name;
            break;
          }
        }
      }

      continue;
    }

    // Tiempo: "91:33", "90:00"
    const timeMatch = line.match(/(\d{2}:\d{2})/);
    if (timeMatch && !result.tiempo_partido) {
      result.tiempo_partido = timeMatch[1];
      continue;
    }
  }

  // ── 2. Línea por línea: stats tabulares (prioridad alta) ──
  for (const raw of lines) {
    const clean = raw.replace(/\s*%\s*/g, '%').replace(/[|\[\](){}\\/=_*"]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length < 3) continue;

    // "label val1 val2" (ej: "Posesión 55 45")
    let m = clean.match(/^([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)\s+(\d{1,4}(?:\.\d)?%?)\s+(\d{1,4}(?:\.\d)?%?)$/);
    if (m) {
      const canonical = matchStatLabel(m[1].trim());
      if (canonical && !result.estadisticas_tabla[canonical]) {
        result.estadisticas_tabla[canonical] = { local: m[2], visitante: m[3] };
        continue;
      }
    }

    // "val1 label val2" (ej: "5 Tiros 1", "137 Pases 229")
    m = clean.match(/^(\d{1,4}(?:\.\d)?%?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)\s+(\d{1,4}(?:\.\d)?%?)$/);
    if (m) {
      const key = m[2].trim();
      if (key.length > 2 && key.length < 30) {
        const canonical = matchStatLabel(key);
        if (canonical && !result.estadisticas_tabla[canonical]) {
          result.estadisticas_tabla[canonical] = { local: m[1], visitante: m[3] };
          continue;
        }
      }
    }

    // "val1% label val2%" (solo cuando label es texto limpio, ej: "95% Recuperación de balón 93%")
    m = clean.match(/^(\d{1,3}%)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)*)\s+(\d{1,3}%)$/);
    if (m) {
      const canonical = matchStatLabel(m[2].trim());
      if (canonical && !result.estadisticas_tabla[canonical]) {
        result.estadisticas_tabla[canonical] = { local: m[1], visitante: m[3] };
        continue;
      }
    }
  }

  // ── 3. Diccionario: stats de gráficos circulares / no detectadas por línea ──
  const flat = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const allNumbers = [...text.matchAll(/(\d{1,4}(?:\.\d)?)(?:\s*%)?/g)].map(m => ({
    val: parseFloat(m[1]),
    isPct: m[0].includes('%'),
    idx: m.index,
  }));

  for (const [regex, canonical, isPctStat] of STAT_PATTERNS) {
    if (result.estadisticas_tabla[canonical]) continue;

    const globalRe = new RegExp(regex.source, regex.flags + 'g');
    const matches = [...flat.matchAll(globalRe)];
    if (!matches.length) continue;

    // Evaluar TODAS las ocurrencias y quedarse con la que tenga más números cerca
    let bestVals = [];
    for (const m of matches) {
      const labelIdx = m.index;
      const labelEnd = labelIdx + m[0].length;

      let nearby = allNumbers
        .map(n => ({ ...n, dist: Math.min(
          Math.abs(n.idx - labelEnd),
          Math.abs(n.idx + String(n.val).length - labelIdx)
        ) }))
        .filter(n => n.dist < 30 && n.isPct === isPctStat)
        .sort((a, b) => a.dist - b.dist);

      // Si el stat espera % pero no hay suficientes, relajar el filtro isPct
      if (isPctStat && nearby.length < 2) {
        nearby = allNumbers
          .map(n => ({ ...n, dist: Math.min(
            Math.abs(n.idx - labelEnd),
            Math.abs(n.idx + String(n.val).length - labelIdx)
          ) }))
          .filter(n => n.dist < 30)
          .sort((a, b) => a.dist - b.dist);
      }

      const vals = nearby.map(n => n.isPct ? `${n.val}%` : `${n.val}`).slice(0, 2);
      if (vals.length > bestVals.length) bestVals = vals;
    }
    if (!bestVals.length) continue;

    if (bestVals.length === 1) {
      if (!result.estadisticas_tabla[canonical]) {
        result.estadisticas_tabla[canonical] = { local: bestVals[0], visitante: '-' };
      }
    } else if (bestVals.length >= 2) {
      if (!result.estadisticas_tabla[canonical]) {
        result.estadisticas_tabla[canonical] = { local: bestVals[0], visitante: bestVals[1] };
      }
    }
  }

  // ── 4. Fallback equipos desde líneas alfabéticas ──
  if (!result.nombre_local || !result.nombre_visitante) {
    const alphaLines = lines
      .map(l => l.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, '').trim())
      .filter(l => l.length > 5 && !/posesi[oó]n|tiros|goles|entradas?|atajadas?|penales?|tarjetas?|recuperaci[oó]n|precisi[oó]n|tasa|esquina|pases?/i.test(l));
    if (!result.nombre_local) result.nombre_local = cleanTeamName(alphaLines[0] || '', teamsToUse);
    if (!result.nombre_visitante) result.nombre_visitante = cleanTeamName(alphaLines[1] || '', teamsToUse);
  }

  // ── 5. Extraer rendimiento_general ──
  // Busca las 3 métricas de rendimiento en el texto plano, solo con números muy cercanos
  const RENDIMIENTO_PATTERNS = [
    { regex: /tasa\s+de\s+[eé]xito\s+en\s+regates?/i, field: 'exito_regates' },
    { regex: /precisi[oó]n\s+(?:de\s+)?(?:en\s+)?tiros?/i, field: 'precision_tiros' },
    { regex: /precisi[oó]n\s+de\s+pases?/i, field: 'precision_pases' },
  ];

  // Primero mover desde estadisticas_tabla si fueron capturados como fila tabular
  for (const { field } of RENDIMIENTO_PATTERNS) {
    // No hay tableKey directo porque los sacamos de STAT_PATTERNS
    // Solo se mueven si están en estadisticas_tabla por paso 2 (línea por línea)
    const foundKey = Object.keys(result.estadisticas_tabla).find(k =>
      RENDIMIENTO_PATTERNS.some(r => r.field === field && r.regex.test(k))
    );
    if (foundKey) {
      if (!result.rendimiento_general.local) result.rendimiento_general.local = {};
      if (!result.rendimiento_general.visitante) result.rendimiento_general.visitante = {};
      result.rendimiento_general.local[field] = result.estadisticas_tabla[foundKey].local;
      result.rendimiento_general.visitante[field] = result.estadisticas_tabla[foundKey].visitante;
      delete result.estadisticas_tabla[foundKey];
    }
  }

  // Si alguna métrica de rendimiento aún no se encontró, buscar directamente en el texto
  // con distancia < 8 para evitar mezclar con otras stats
  const hasAll = RENDIMIENTO_PATTERNS.every(r =>
    result.rendimiento_general.local?.[r.field] || result.rendimiento_general.visitante?.[r.field]
  );

  if (!hasAll) {
    for (const { regex, field } of RENDIMIENTO_PATTERNS) {
      if (result.rendimiento_general.local?.[field] || result.rendimiento_general.visitante?.[field]) continue;

      const globalRe = new RegExp(regex.source, regex.flags + 'g');
      const matches = [...flat.matchAll(globalRe)];
      if (!matches.length) continue;

      let bestVals = [];
      for (const m of matches) {
        const labelIdx = m.index;
        const labelEnd = labelIdx + m[0].length;

        const nearby = allNumbers
          .map(n => ({ ...n, dist: Math.min(
            Math.abs(n.idx - labelEnd),
            Math.abs(n.idx + String(n.val).length - labelIdx)
          ) }))
          .filter(n => n.dist < 8)
          .sort((a, b) => a.dist - b.dist);

        const vals = nearby.map(n => n.isPct ? `${n.val}%` : `${n.val}`).slice(0, 2);
        if (vals.length > bestVals.length) bestVals = vals;
      }

      if (bestVals.length >= 2) {
        if (!result.rendimiento_general.local) result.rendimiento_general.local = {};
        if (!result.rendimiento_general.visitante) result.rendimiento_general.visitante = {};
        result.rendimiento_general.local[field] = bestVals[0];
        result.rendimiento_general.visitante[field] = bestVals[1];
      }
    }
  }

  return result;
}

/**
 * Busca una label de estadística en el diccionario STAT_PATTERNS
 * @param {string} text - Texto a matchear
 * @returns {string|null} Nombre canónico o null
 */
function matchStatLabel(text) {
  for (const [regex, canonical] of STAT_PATTERNS) {
    if (regex.test(text)) return canonical;
  }
  return null;
}

/**
 * Pre-procesa una imagen para OCR: upscale suave + escala de grises + auto-contraste + invertir + umbral
 * (texto blanco → negro, fondo no-blanco → blanco)
 * @param {Blob} imageBlob - Imagen comprimida
 * @returns {Promise<Blob>} Blob pre-procesado (PNG)
 */
function preprocessImageForOcr(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 1.5;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const len = data.length;

      // 1. Escala de grises + auto-contraste
      let min = 255, max = 0;
      for (let i = 0; i < len; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        if (gray < min) min = gray;
        if (gray > max) max = gray;
      }

      const range = max - min;
      if (range > 10) {
        for (let i = 0; i < len; i += 4) {
          data[i] = ((data[i] - min) / range) * 255;
          data[i + 1] = data[i];
          data[i + 2] = data[i];
        }
      }

      // 2. Invertir (texto claro → oscuro) y umbralizar
      for (let i = 0; i < len; i += 4) {
        const inverted = 255 - data[i];
        data[i] = inverted < 128 ? 0 : 255;
        data[i + 1] = data[i];
        data[i + 2] = data[i];
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo generar el blob pre-procesado'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Error al cargar imagen para pre-procesado'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * Extrae estadísticas de una imagen usando OCR (Tesseract.js)
 * Alternativa offline/gratuita a Gemini
 * @param {File|Blob} imageFile - Imagen comprimida
 * @param {Function} [onProgress] - Callback de progreso (pct: number) => void
 * @returns {Promise<Object>} Datos normalizados del partido
 */
export async function extractStatsFromImageOcr(imageFile, onProgress, teamsRef) {
  const processed = await preprocessImageForOcr(imageFile);

  // Debug: mostrar la imagen pre-procesada como data URL (copiar y pegar en el navegador)
  const debugReader = new FileReader();
  debugReader.onload = () => {
    devLog('%c[Tesseract OCR] Pre-procesada (copiá esta URL y pegala en el navegador):', 'background:#222;color:#60a5fa;font-weight:bold');
    devLog(debugReader.result);
  };
  debugReader.readAsDataURL(processed);

  const { data } = await Tesseract.recognize(processed, 'spa+eng', {
    logger: (info) => {
      if (info.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(info.progress * 100));
      }
    },
    config: {
      tessedit_pagesegmentation_mode: '6', // PSM 6: bloque único de texto (tablas)
    },
  });

  const parsed = parseOcrText(data.text, teamsRef);
  devLog('%c[Tesseract OCR] Texto extraído:', 'background:#222;color:#ffd700;font-weight:bold', data.text);
  devLog('%c[Tesseract OCR] Datos parseados:', 'background:#222;color:#4ade80;font-weight:bold', parsed);
  return parsed;
}

// ─── OCR por Zonas ─────────────────────────────────────────────────────────

const ZONE_STORAGE_KEY = 'ligafc_ocr_zones';

function loadOcrZones() {
  try {
    const raw = localStorage.getItem(ZONE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Carga una imagen en un canvas y devuelve el canvas
 * @param {Blob} imageBlob - Imagen a cargar
 * @returns {Promise<{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number}>}
 */
function loadImageToCanvas(imageBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx, width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * Recorta una región del canvas basada en porcentajes
 * @param {HTMLCanvasElement} srcCanvas - Canvas origen
 * @param {number} pctX - X como porcentaje (0-100)
 * @param {number} pctY - Y como porcentaje (0-100)
 * @param {number} pctW - Ancho como porcentaje (0-100)
 * @param {number} pctH - Alto como porcentaje (0-100)
 * @returns {Promise<Blob>} Blob PNG de la región recortada
 */
function cropCanvasRegion(srcCanvas, pctX, pctY, pctW, pctH) {
  return new Promise((resolve, reject) => {
    const x = Math.round((pctX / 100) * srcCanvas.width);
    const y = Math.round((pctY / 100) * srcCanvas.height);
    const w = Math.round((pctW / 100) * srcCanvas.width);
    const h = Math.round((pctH / 100) * srcCanvas.height);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h);

    cropCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo generar blob del recorte'));
    }, 'image/png');
  });
}

/**
 * Extrae estadísticas de una imagen usando OCR por zonas persistentes.
 * Cada zona configurada se OCRiza por separado para evitar mezclar datos
 * entre filas (ej. header con tabla, tabla con rendimiento).
 *
 * @param {File|Blob} imageFile - Imagen comprimida
 * @param {Function} [onProgress] - Callback de progreso (pct: number) => void
 * @returns {Promise<Object>} Datos normalizados del partido
 */
export async function extractStatsFromImageOcrWithZones(imageFile, onProgress, teamsRef) {
  const zones = loadOcrZones();
  if (!zones || zones.length === 0) {
    devLog('%c[OCR Zonas] No hay zonas configuradas, usando OCR normal...', 'background:#222;color:#f59e0b;font-weight:bold');
    return extractStatsFromImageOcr(imageFile, onProgress, teamsRef);
  }

  devLog(`%c[OCR Zonas] Usando ${zones.length} zona(s) persistida(s)`, 'background:#222;color:#60a5fa;font-weight:bold', zones);

  const { canvas } = await loadImageToCanvas(imageFile);
  const totalZones = zones.length;
  let allText = '';

  for (let i = 0; i < totalZones; i++) {
    const zone = zones[i];
    devLog(`%c[OCR Zonas] Procesando zona ${i + 1}/${totalZones}: "${zone.label}" (${zone.w}%×${zone.h}% at ${zone.x}%,${zone.y}%)`, 'background:#222;color:#a78bfa;font-weight:bold');

    const croppedBlob = await cropCanvasRegion(canvas, zone.x, zone.y, zone.w, zone.h);
    const processed = await preprocessImageForOcr(croppedBlob);

    const zoneProgress = (pct) => {
      if (onProgress) {
        const overall = Math.round((i / totalZones) * 100 + (pct / totalZones));
        onProgress(Math.min(overall, 99));
      }
    };

    const { data } = await Tesseract.recognize(processed, 'spa+eng', {
      logger: (info) => {
        if (info.status === 'recognizing text' && onProgress) {
          zoneProgress(Math.round(info.progress * 100));
        }
      },
      config: {
        tessedit_pagesegmentation_mode: '6',
      },
    });

    allText += (allText ? '\n' : '') + data.text;
    devLog(`%c[OCR Zonas] Texto de zona "${zone.label}":`, 'background:#222;color:#ffd700;font-weight:bold', data.text);
  }

  if (onProgress) onProgress(100);

  const parsed = parseOcrText(allText, teamsRef);
  devLog('%c[OCR Zonas] Texto combinado:', 'background:#222;color:#ffd700;font-weight:bold', allText);
  devLog('%c[OCR Zonas] Datos parseados:', 'background:#222;color:#4ade80;font-weight:bold', parsed);
  return parsed;
}
