import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractStatsFromImage, saveStatsToSupabase, parseOcrText, GEMINI_MODELS } from './statsProcessor';
import { supabase } from '../config/supabaseClient';

describe('extractStatsFromImage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses Gemini response correctly with all fields', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              partido: { local: 'Real Madrid', visitante: 'Barcelona', goles_local: 2, goles_visitante: 1, tiempo: '90:00' },
              estadisticas_tabla: { Posesión: { local: 55, visitante: 45 } },
              rendimiento_general: { local: { exito_regates: '75%', precision_tiros: '80%', precision_pases: '90%' }, visitante: { exito_regates: '65%', precision_tiros: '70%', precision_pases: '85%' } },
              jugadores_stats: [{ nombre: 'Messi', equipo: 'local', exito_regates: '85%', precision_tiros: '90%', precision_pases: '92%' }],
            }),
          }],
        },
      }],
      _model: 'gemini-2.5-flash',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await extractStatsFromImage(new File([''], 'test.jpg', { type: 'image/jpeg' }));
    expect(result.nombre_local).toBe('Real Madrid');
    expect(result.nombre_visitante).toBe('Barcelona');
    expect(result.goles_local).toBe(2);
    expect(result.goles_visitante).toBe(1);
    expect(result.tiempo_partido).toBe('90:00');
    expect(result.estadisticas_tabla.Posesión.local).toBe(55);
    expect(result.rendimiento_general.local.exito_regates).toBe('75%');
    expect(result.jugadores_stats).toHaveLength(1);
    expect(result.jugadores_stats[0].nombre).toBe('Messi');
    expect(result.modelo_usado).toBe('gemini-2.5-flash');
  });

  it('handles missing optional fields gracefully', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              partido: { local: 'A', visitante: 'B', goles_local: 0, goles_visitante: 0 },
            }),
          }],
        },
      }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await extractStatsFromImage(new File([''], 'test.jpg', { type: 'image/jpeg' }));
    expect(result.nombre_local).toBe('A');
    expect(result.estadisticas_tabla).toEqual({});
    expect(result.rendimiento_general).toEqual({});
    expect(result.jugadores_stats).toEqual([]);
  });

  it('throws if Gemini does not return text', async () => {
    const mockResponse = { candidates: [{ content: { parts: [{}] } }] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await expect(extractStatsFromImage(new File([''], 'test.jpg', { type: 'image/jpeg' }))).rejects.toThrow(
      'Gemini no devolvió texto en la respuesta'
    );
  });

  it('sends model in fetch body and returns modelo_usado', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              partido: { local: 'A', visitante: 'B', goles_local: 1, goles_visitante: 0, tiempo: '45:00' },
            }),
          }],
        },
      }],
      _model: 'gemini-3.1-flash-lite',
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    global.fetch = fetchSpy;

    const result = await extractStatsFromImage(
      new File([''], 'test.jpg', { type: 'image/jpeg' }),
      GEMINI_MODELS.flashLite,
    );

    expect(result.modelo_usado).toBe('gemini-3.1-flash-lite');
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.model).toBe('gemini-3.1-flash-lite');
  });

  it('falls back to Flash-Lite when Flash returns 429', async () => {
    const flashResponse = { ok: false, status: 429, text: () => Promise.resolve('RESOURCE_EXHAUSTED') };
    const liteResponse = {
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                partido: { local: 'X', visitante: 'Y', goles_local: 3, goles_visitante: 2, tiempo: '90:00' },
              }),
            }],
          },
        }],
      }),
    };

    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(flashResponse)
      .mockResolvedValueOnce(liteResponse);
    global.fetch = fetchSpy;

    const result = await extractStatsFromImage(
      new File([''], 'test.jpg', { type: 'image/jpeg' }),
    );

    expect(result.modelo_usado).toBe('gemini-3.1-flash-lite');
    expect(result.nombre_local).toBe('X');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const body1 = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body1.model).toBe('gemini-2.5-flash');
    const body2 = JSON.parse(fetchSpy.mock.calls[1][1].body);
    expect(body2.model).toBe('gemini-3.1-flash-lite');
  });
});

describe('saveStatsToSupabase', () => {
  it('inserts stats with partido_id and returns the saved record', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ id: '123', nombre_local: 'Real Madrid' }],
      error: null,
    });

    vi.spyOn(supabase, 'from').mockReturnValue({
      insert: mockInsert.mockReturnValue({ select: mockSelect }),
    });

    const statsData = {
      nombre_local: 'Real Madrid',
      nombre_visitante: 'Barcelona',
      goles_local: 2,
      goles_visitante: 1,
      tiempo_partido: '90:00',
      estadisticas_tabla: { Posesión: { local: 55, visitante: 45 } },
      rendimiento_general: {},
      jugadores_stats: [],
    };

    const result = await saveStatsToSupabase(statsData, 'partido-456');
    expect(result.id).toBe('123');
    expect(supabase.from).toHaveBeenCalledWith('partidos_stats_v2');
  });
});

describe('parseOcrText', () => {
  it('extracts teams, score and time from match header', () => {
    const text = `Real Madrid
2 - 1
Barcelona
90:00`;
    const result = parseOcrText(text);
    expect(result.nombre_local).toBe('Real Madrid');
    expect(result.nombre_visitante).toBe('FC Barcelona');
    expect(result.goles_local).toBe(2);
    expect(result.goles_visitante).toBe(1);
    expect(result.tiempo_partido).toBe('90:00');
  });

  it('extracts stats table rows', () => {
    const text = `Local Visitante
Posesión 55 45
Tiros 12 8`;
    const result = parseOcrText(text);
    expect(result.estadisticas_tabla.Posesión).toEqual({ local: '55', visitante: '45' });
    expect(result.estadisticas_tabla.Tiros).toEqual({ local: '12', visitante: '8' });
  });

  it('handles score with different dash formats', () => {
    const text = `Equipo A
3–0
Equipo B`;
    const result = parseOcrText(text);
    expect(result.goles_local).toBe(3);
    expect(result.goles_visitante).toBe(0);
  });

  it('returns defaults when no data found', () => {
    const result = parseOcrText('12345 !@#$%');
    expect(result.nombre_local).toBe('');
    expect(result.goles_local).toBe(0);
    expect(result.estadisticas_tabla).toEqual({});
  });

  it('extracts team names from alpha lines when no score found', () => {
    const text = `Real Madrid CF
FC Barcelona
Partido amistoso`;
    const result = parseOcrText(text);
    expect(result.nombre_local).toBe('Real Madrid');
    expect(result.nombre_visitante).toBe('FC Barcelona');
  });

  it('parses real OCR output with messy formatting', () => {
    const text = `ATLÉTICO DE MADRID il 2:4 Hh om
91:33 —
M9 Resumen Posesión Tiros Pases Defensa Eventos a
37 % de posesión es] TT
95% | li Recuperación de balón (seg.). 7 ] 93%
5 Tiros 1]
137 Pases 229]
= Ei Entradas 1 —
. I La] Entradas con éxito 1 J Ea
80% | : \\ 73%
70 E 70
(50%) 7 Recuperaciones 18
= la Atajadas 2 =
PRECISIÓN EN TIROS PRECISION EN TIROS
| 2 Faltas cometidas 0
= 1 Fueras de lugar 1
: ; [+] Tiros de esquina 1]
84 % 1 Tires libres 3] 96%
i o Penales 0 E
PRECISIÓN DE PASES I2 Tarjetas amarillas o | PRECISION DE PASES`;

    const result = parseOcrText(text);
    expect(result.goles_local).toBe(2);
    expect(result.goles_visitante).toBe(4);
    expect(result.nombre_local).toBe('Atlético de Madrid');
    expect(result.estadisticas_tabla.Tiros).toBeDefined();
    expect(result.estadisticas_tabla.Pases).toBeDefined();
    expect(result.estadisticas_tabla['Recuperación de balón']).toBeDefined();
    expect(result.estadisticas_tabla['Faltas cometidas']).toBeDefined();
  });
});
