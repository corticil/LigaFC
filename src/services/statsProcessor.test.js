import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractStatsFromImage, saveStatsToSupabase, GEMINI_MODELS } from './statsProcessor';
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

