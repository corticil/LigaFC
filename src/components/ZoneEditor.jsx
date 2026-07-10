import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, Save, Crop } from 'lucide-react';

const ZONE_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

const STORAGE_KEY = 'ligafc_ocr_zones';

let zoneCounter = 0;
function generateId() {
  zoneCounter++;
  return `z${Date.now()}_${zoneCounter}`;
}

export function loadZones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return getDefaultZones();
}

export function saveZones(zones) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
}

export function resetZones() {
  localStorage.removeItem(STORAGE_KEY);
}

function getDefaultZones() {
  return [
    { id: generateId(), label: 'Header', x: 0, y: 0, w: 100, h: 22 },
    { id: generateId(), label: 'Stats table', x: 0, y: 22, w: 100, h: 58 },
    { id: generateId(), label: 'Bottom', x: 0, y: 80, w: 100, h: 20 },
  ];
}

export default function ZoneEditor({ imageUrl, onSave, onClose }) {
  const [zones, setZones] = useState(() => loadZones());
  const containerRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const getContainerDims = useCallback(() => {
    if (!containerRef.current) return { w: 800, h: 600 };
    const rect = containerRef.current.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }, []);

  const clientToPct = useCallback((clientX, clientY) => {
    const dims = getContainerDims();
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / dims.w) * 100,
      y: ((clientY - rect.top) / dims.h) * 100,
    };
  }, [getContainerDims]);

  const handleMouseDown = useCallback((e, zoneIdx, type, corner) => {
    e.preventDefault();
    const pct = clientToPct(e.clientX, e.clientY);
    setDrag({
      zoneIdx, type, corner,
      startX: pct.x,
      startY: pct.y,
      startZone: { ...zones[zoneIdx] },
    });
  }, [clientToPct, zones]);

  const handleMouseMove = useCallback((e) => {
    if (!drag) return;
    const pct = clientToPct(e.clientX, e.clientY);
    const dx = pct.x - drag.startX;
    const dy = pct.y - drag.startY;
    const z = drag.startZone;

    setZones(prev => {
      const next = [...prev];
      if (drag.type === 'move') {
        next[drag.zoneIdx] = {
          ...z,
          x: clamp(z.x + dx, 0, 100 - z.w),
          y: clamp(z.y + dy, 0, 100 - z.h),
        };
      } else if (drag.type === 'resize') {
        let nx = z.x, ny = z.y, nw = z.w, nh = z.h;
        if (drag.corner.includes('e')) nw = Math.max(5, z.w + dx);
        if (drag.corner.includes('w')) { nx = clamp(z.x + dx, 0, z.x + z.w - 5); nw = z.w - (nx - z.x); }
        if (drag.corner.includes('s')) nh = Math.max(5, z.h + dy);
        if (drag.corner.includes('n')) { ny = clamp(z.y + dy, 0, z.y + z.h - 5); nh = z.h - (ny - z.y); }
        next[drag.zoneIdx] = { ...z, x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) };
      }
      return next;
    });
  }, [drag, clientToPct]);

  const handleMouseUp = useCallback(() => setDrag(null), []);

  const addZone = useCallback(() => {
    setZones(prev => [...prev, {
      id: generateId(),
      label: `Zona ${prev.length + 1}`,
      x: 10, y: 10, w: 80, h: 30,
      color: ZONE_COLORS[prev.length % ZONE_COLORS.length],
    }]);
  }, []);

  const removeZone = useCallback((idx) => {
    setZones(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateLabel = useCallback((idx, label) => {
    setZones(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], label };
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    saveZones(zones);
    if (onSave) onSave(zones);
    onClose();
  }, [zones, onSave, onClose]);

  const handleDefaults = useCallback(() => {
    const defs = getDefaultZones();
    setZones(defs);
    saveZones(defs);
  }, []);

  const coloredZones = zones.map((z, i) => ({
    ...z,
    color: z.color || ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Configurar Zonas OCR</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-2 bg-zinc-900/60 border-b border-zinc-800">
          <p className="text-[10px] text-zinc-500">
            Arrastrá las zonas para moverlas. Usá las esquinas para redimensionar.
            Cada zona se OCRiza por separado para evitar mezclar datos.
          </p>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 select-none">
            <img src={imageUrl} alt="Reference" className="w-full h-auto block" draggable={false} />

            {coloredZones.map((zone, idx) => (
              <div
                key={zone.id}
                className="absolute cursor-move group"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, idx, 'move')}
              >
                <div
                  className="absolute inset-0 rounded-lg opacity-20 border-2 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: zone.color, borderColor: zone.color }}
                />

                <div className="absolute top-1 left-1 flex items-center gap-1 z-10 pointer-events-none">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{ backgroundColor: zone.color, color: '#09090b' }}
                  >
                    {zone.label}
                  </span>
                </div>

                <div className="absolute bottom-1 right-1 flex items-center gap-1 z-10 pointer-events-none">
                  <span className="text-[8px] text-white/50 font-mono">{zone.w}% × {zone.h}%</span>
                </div>

                {['nw', 'ne', 'sw', 'se'].map((corner) => (
                  <div
                    key={corner}
                    className="absolute w-3 h-3 bg-white border-2 border-zinc-900 rounded-sm z-20"
                    style={{
                      [corner.includes('n') ? 'top' : 'bottom']: '-5px',
                      [corner.includes('w') ? 'left' : 'right']: '-5px',
                      cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, idx, 'resize', corner);
                    }}
                  />
                ))}

                <button
                  onClick={(e) => { e.stopPropagation(); removeZone(idx); }}
                  className="absolute -top-2 -right-2 p-0.5 rounded-full bg-zinc-800 text-rose-400 hover:text-rose-300 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Lista de zonas con labels editables */}
          <div className="mt-4 space-y-2">
            {coloredZones.map((zone, idx) => (
              <div key={zone.id} className="flex items-center gap-2 bg-zinc-950 rounded-lg px-3 py-1.5 border border-zinc-800">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
                <input
                  value={zone.label}
                  onChange={(e) => updateLabel(idx, e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none border-b border-transparent focus:border-zinc-600 py-0.5"
                />
                <span className="text-[10px] text-zinc-600 font-mono">{zone.w}% × {zone.h}%</span>
                <button onClick={() => removeZone(idx)} className="text-rose-400 hover:text-rose-300 transition p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800">
          <div className="flex gap-2">
            <button onClick={addZone}
              className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition">
              <Plus className="w-3.5 h-3.5" /> Zona
            </button>
            <button onClick={handleDefaults}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition">
              Reset
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-lg transition">
              Cancelar
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 rounded-lg transition">
              <Save className="w-3.5 h-3.5" /> Guardar Zonas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}