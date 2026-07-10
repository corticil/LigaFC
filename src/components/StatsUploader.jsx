import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, Loader2, AlertCircle, BarChart3, FileCheck, X, RotateCcw, User, Camera, Sparkles, Crop } from 'lucide-react';
import { teams } from '../data/teams';
import { PLAYERS } from '../data/players';
import { extractStatsFromImage, extractStatsFromImageOcr, extractStatsFromImageOcrWithZones, saveStatsToSupabase, compressImage, GEMINI_MODELS } from '../services/statsProcessor';
import ZoneEditor, { loadZones } from './ZoneEditor';

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function findTeam(name) {
  const normalized = normalize(name);
  const exact = teams.find(t => normalize(t.name) === normalized);
  if (exact) return exact;
  return teams.find(t => normalize(t.name).includes(normalized) || normalized.includes(normalize(t.name)));
}

/**
 * StatsUploader: Componente de 3 pasos para importar estadísticas con IA
 *
 * Paso 1 - Upload: Arrastrar/seleccionar/tomar foto de una pantalla de estadísticas
 * Paso 2 - Procesar: Enviar la imagen a Gemini 2.5 Flash vía proxy y extraer datos
 * Paso 3 - Confirmar: Revisar y corregir datos antes de guardar
 *
 * Estados: idle | loading | error | saving
 */
export default function StatsUploader({ onAddMatch, tournaments = [] }) {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle');

  const [parsedData, setParsedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState('upload');
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const [jugador1, setJugador1] = useState(PLAYERS[0]);
  const [jugador2, setJugador2] = useState(PLAYERS[PLAYERS.length - 1]);
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [torneoId, setTorneoId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [nota, setNota] = useState('');
  const [ocrMode, setOcrMode] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [geminiModel, setGeminiModel] = useState(GEMINI_MODELS.flash);

  // Maneja la subida de imagen: comprime y genera preview inmediata
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setStatus('idle');
    setParsedData(null);
    setErrorMsg('');
    setStep('upload');
    try {
      const blob = await compressImage(file);
      const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
      setImage(compressedFile);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(blob);
    } catch {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, []);

  // Drag & drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleSelect = useCallback((e) => {
    handleFile(e.target.files[0]);
  }, [handleFile]);

  // Procesa la imagen: Gemini (IA) u OCR (Tesseract.js)
  const handleProcess = useCallback(async () => {
    if (!image) return;
    setStatus('loading');
    setErrorMsg('');
    setOcrProgress(0);
    try {
      const zones = loadZones();
      const hasZones = ocrMode && zones && zones.length > 0;
      const data = ocrMode
        ? hasZones
          ? await extractStatsFromImageOcrWithZones(image, (pct) => setOcrProgress(pct))
          : await extractStatsFromImageOcr(image, (pct) => setOcrProgress(pct))
        : await extractStatsFromImage(image, geminiModel);
      setParsedData(data);
      const matched1 = findTeam(data.nombre_local);
      const matched2 = findTeam(data.nombre_visitante);
      if (matched1) setTeam1Id(matched1.id);
      if (matched2) setTeam2Id(matched2.id);
      setStep('confirm');
      setStatus('idle');
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la imagen');
      setStatus('error');
    }
  }, [image, ocrMode, geminiModel]);

  // Guarda el partido + estadísticas en DB y redirige al home
  const handleConfirm = useCallback(async () => {
    if (!parsedData) return;
    setStatus('saving');
    setErrorMsg('');

    try {
      const matchResult = await onAddMatch({
        jugador_1: jugador1,
        jugador_2: jugador2,
        equipo_1_id: team1Id,
        equipo_2_id: team2Id,
        goles_1: parsedData.goles_local,
        goles_2: parsedData.goles_visitante,
        nota: nota,
        fecha,
        torneo_id: torneoId || null,
      });

      if (!matchResult.success) {
        setErrorMsg(matchResult.error || 'Error al guardar el partido');
        setStatus('error');
        return;
      }

      await saveStatsToSupabase(parsedData, matchResult.data?.id);

      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar');
      setStatus('error');
    }
  }, [parsedData, jugador1, jugador2, team1Id, team2Id, nota, fecha, torneoId, onAddMatch, navigate]);

  const reset = useCallback(() => {
    setImage(null);
    setPreview(null);
    setStatus('idle');
    setParsedData(null);
    setErrorMsg('');
    setStep('upload');
    setTorneoId('');
    setNota('');
    setFecha(new Date().toISOString().split('T')[0]);
    setOcrProgress(0);
  }, []);

  const localName = parsedData?.nombre_local || '';
  const visitName = parsedData?.nombre_visitante || '';
  const statsTable = parsedData?.estadisticas_tabla;

  if (step === 'confirm' && parsedData) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Revisar datos extraídos</h3>
            {parsedData.modelo_usado && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${parsedData.modelo_usado.includes('lite') ? 'bg-yellow-500/15 text-yellow-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {parsedData.modelo_usado.includes('lite') ? 'Flash-Lite' : 'Flash'}
              </span>
            )}
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-white">{teams.find(t => t.id === team1Id)?.name || localName}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-emerald-400">{parsedData.goles_local}</span>
                <span className="text-base text-zinc-600 font-bold">-</span>
                <span className="text-3xl font-black text-indigo-400">{parsedData.goles_visitante}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{teams.find(t => t.id === team2Id)?.name || visitName}</p>
              </div>
            </div>
            {parsedData.tiempo_partido && (
              <p className="text-[10px] text-zinc-500 mt-1.5">{parsedData.tiempo_partido}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Equipo Local</label>
              <select value={team1Id} onChange={e => setTeam1Id(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Equipo Visitante</label>
              <select value={team2Id} onChange={e => setTeam2Id(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Jugador Local
              </label>
              <select value={jugador1} onChange={e => {
                const val = e.target.value;
                setJugador1(val);
                if (val === jugador2) setJugador2(PLAYERS.find(p => p !== val));
              }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition">
                {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Jugador Visitante
              </label>
              <select value={jugador2} onChange={e => {
                const val = e.target.value;
                setJugador2(val);
                if (val === jugador1) setJugador1(PLAYERS.find(p => p !== val));
              }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition">
                {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Torneo <span className="text-zinc-700">(opcional)</span></label>
              <select value={torneoId} onChange={e => setTorneoId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition">
                <option value="">-- Sin torneo --</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.nombre || t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Nota <span className="text-zinc-700">(opcional)</span></label>
              <input type="text" value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej: Partidazo"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition" />
            </div>
          </div>
        </div>

        {statsTable && Object.keys(statsTable).length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-zinc-900/60 border-b border-zinc-800">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estadísticas extraídas</span>
            </div>
            <div className="divide-y divide-zinc-800/50 max-h-60 overflow-y-auto">
              {Object.entries(statsTable).map(([metrica, valores]) => (
                <div key={metrica} className="grid grid-cols-3 gap-4 px-5 py-2.5 items-center hover:bg-zinc-800/20 transition-colors">
                  <div className="text-right"><span className="text-xs font-bold text-emerald-400">{valores.local}</span></div>
                  <div className="text-center"><span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{metrica}</span></div>
                  <div className="text-left"><span className="text-xs font-bold text-indigo-400">{valores.visitante}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedData?.jugadores_stats?.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-zinc-900/60 border-b border-zinc-800">
              <User className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stats por Jugador</span>
            </div>
            <div className="divide-y divide-zinc-800/50">
              {parsedData.jugadores_stats.map((j, i) => (
                <div key={i} className="px-5 py-3 space-y-2 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${j.equipo === 'local' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                    <span className="text-xs font-bold text-white">{j.nombre}</span>
                    <span className="text-[10px] text-zinc-500">{j.equipo === 'local' ? 'Local' : 'Visitante'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-950 rounded-lg py-1.5">
                      <p className="text-[10px] text-zinc-500">Regates</p>
                      <p className="text-xs font-bold text-emerald-400">{j.exito_regates || '-'}</p>
                    </div>
                    <div className="bg-zinc-950 rounded-lg py-1.5">
                      <p className="text-[10px] text-zinc-500">Prec. Tiros</p>
                      <p className="text-xs font-bold text-yellow-400">{j.precision_tiros || '-'}</p>
                    </div>
                    <div className="bg-zinc-950 rounded-lg py-1.5">
                      <p className="text-[10px] text-zinc-500">Prec. Pases</p>
                      <p className="text-xs font-bold text-sky-400">{j.precision_pases || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={reset}
            className="flex-1 py-3 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={handleConfirm} disabled={status === 'saving'}
            className="flex-1 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50">
            {status === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><FileCheck className="w-4 h-4" /> Confirmar y Guardar</>}
          </button>
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-400">Error al guardar</p>
              <p className="text-[11px] text-rose-300/80 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!preview && (
        <div className="space-y-3">
          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current?.click()}
            className="relative cursor-pointer group">
            <div className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 bg-zinc-900/30 hover:bg-zinc-900/60 rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-full group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-300">
                <Upload className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Arrastra una imagen aquí</p>
                <p className="text-xs text-zinc-600 mt-1 group-hover:text-zinc-500 transition-colors">o haz clic para seleccionar un archivo</p>
              </div>
              <span className="text-[10px] text-zinc-700 bg-zinc-800/50 px-3 py-1 rounded-full">PNG, JPG, WEBP</span>
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-zinc-800"></div>
            <span className="text-[10px] text-zinc-600 font-medium">o</span>
            <div className="flex-1 border-t border-zinc-800"></div>
          </div>
          <button onClick={() => cameraRef.current?.click()}
            className="w-full py-3 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-600">
            <Camera className="w-4 h-4" />
            Tomar Foto
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleSelect} className="hidden" />

          {/* Switch: Gemini IA vs OCR Tesseract (visible desde la subida) */}
          <div className="flex items-center justify-center gap-3 px-1 pt-2">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${!ocrMode ? 'text-emerald-400' : 'text-zinc-600'}`}>
              <Sparkles className="w-3 h-3 inline mr-1" />Gemini IA
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={ocrMode}
              onClick={() => setOcrMode(prev => !prev)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${ocrMode ? 'bg-yellow-500' : 'bg-emerald-500'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${ocrMode ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
            </button>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${ocrMode ? 'text-yellow-400' : 'text-zinc-600'}`}>
              OCR Tesseract
            </span>
          </div>

          {!ocrMode && (
            <div className="flex items-center justify-center gap-2 px-1 pt-1">
              <span className="text-[10px] text-zinc-600">Modelo:</span>
              <button
                onClick={() => setGeminiModel(GEMINI_MODELS.flash)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition ${geminiModel === GEMINI_MODELS.flash ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}`}
              >
                Flash (250/día)
              </button>
              <button
                onClick={() => setGeminiModel(GEMINI_MODELS.flashLite)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition ${geminiModel === GEMINI_MODELS.flashLite ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'}`}
              >
                Flash-Lite (1000/día)
              </button>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{image?.name}</p>
                <p className="text-xs text-zinc-500">{((image?.size || 0) / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={reset}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <img src={preview} alt="Preview" className="w-full max-h-80 object-contain" />
          </div>

          {/* Zonas OCR (solo en modo OCR) */}
          {ocrMode && status !== 'loading' && (
            <button onClick={() => setShowZoneEditor(true)}
              className="w-full py-2 rounded-xl text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition flex items-center justify-center gap-2 border border-zinc-700">
              <Crop className="w-3.5 h-3.5" /> Configurar Zonas OCR
            </button>
          )}

          {/* Barra de progreso OCR */}
          {status === 'loading' && ocrMode && ocrProgress > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Reconociendo texto...</span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
              </div>
            </div>
          )}

          <button onClick={handleProcess} disabled={status === 'loading'}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              status === 'loading'
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : ocrMode
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950 shadow-lg shadow-yellow-500/20 active:scale-[0.98]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
            }`}>
            {status === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><Image className="w-4 h-4" /> Extraer y Revisar</>}
          </button>

          {status === 'error' && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-400">Error al procesar</p>
                <p className="text-[11px] text-rose-300/80 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showZoneEditor && (
        <ZoneEditor
          imageUrl={preview}
          onSave={() => {}}
          onClose={() => setShowZoneEditor(false)}
        />
      )}
    </div>
  );
}