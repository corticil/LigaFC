import { supabase } from '../config/supabaseClient';
import { teams as defaultTeams } from '../data/teams';

const devLog = (...args) => { if (import.meta.env.DEV) console.log(...args); };

export const GEMINI_MODELS = {
  flash: 'gemini-2.5-flash',
  flashLite: 'gemini-3.1-flash-lite',
};

// ─── Compresión ────────────────────────────────────────────────────────────

/**
 * Comprime una imagen a WebP con resolución máxima de 1200px
 * Camino principal usa createImageBitmap con decodificación escalada para evitar
 * quedarse sin memoria con fotos de cámara de alta resolución (ej. 50MP+)
 * @param {File} file - Archivo de imagen original
 * @param {number} maxDimension - Ancho/alto máximo (default 800)
 * @param {number} quality - Calidad 0-1 (default 0.4)
 * @returns {Promise<Blob>} Blob con la imagen comprimida
 */
export async function compressImage(file, maxDimension = 800, quality = 0.4) {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen es demasiado grande. Intentá con una de menor resolución.');
  }

  // Decodificación escalada: el navegador reduce la imagen durante la decodificación,
  // sin materializar nunca el bitmap completo en RAM
  if (typeof createImageBitmap === 'function') {
    let bmp = null;
    try {
      // Solo una dimensión => la otra se calcula preservando el aspecto
      bmp = await createImageBitmap(file, {
        resizeWidth: maxDimension,
        imageOrientation: 'from-image',
      });

      // Retrato: normalizar el lado largo (ya está en RAM chica, reescalar es barato)
      if (bmp.height > bmp.width && bmp.height > maxDimension) {
        const resized = await createImageBitmap(bmp, { resizeHeight: maxDimension });
        bmp.close();
        bmp = resized;
      }

      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      canvas.getContext('2d').drawImage(bmp, 0, 0);
      bmp.close();
      bmp = null;

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen'))),
          'image/webp',
          quality
        );
      });
      return blob;
    } catch (err) {
      devLog('[compressImage] createImageBitmap no disponible o falló, usando fallback:', err);
      if (bmp) bmp.close();
    }
  }

  // Fallback: Image + canvas (mismo comportamiento que antes, con limpieza explícita)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
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
        img.src = ''; // liberar el caché de decodificación del navegador
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo comprimir la imagen'));
        }, 'image/webp', quality);
      } catch (e) {
        img.src = '';
        reject(new Error('No hay memoria suficiente para procesar esta imagen. Tomá la foto de nuevo con menor resolución.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = objectUrl;
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

