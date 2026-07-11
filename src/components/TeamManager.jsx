import { useState, useRef } from 'react';
import { Shield, Plus, Trash2, Upload, Image } from 'lucide-react';
import { getTeamById as getHardcodedTeam } from '../data/teams';

function compressAndConvertToBase64(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
          else { width = Math.round((width / height) * maxSize); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export default function TeamManager({ teamsList, onAddTeam, onDeleteTeam }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    try {
      const base64 = await compressAndConvertToBase64(file);
      setLogoPreview(base64);
      setLogoFile(file);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) {
      setError('Ingresá un nombre para el club');
      return;
    }
    setSubmitting(true);
    const result = await onAddTeam({
      nombre: newName.trim(),
      logo_url: logoPreview || null,
    });
    setSubmitting(false);
    if (result.success) {
      setNewName('');
      setLogoPreview(null);
      setLogoFile(null);
      setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`¿Eliminar el club "${name}"?`)) {
      await onDeleteTeam(id);
    }
  };

  const getLogo = (team) => {
    if (team.logo_url) return team.logo_url;
    const hardcoded = getHardcodedTeam(team.id || team.slug);
    return hardcoded?.logoUrl || null;
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Clubes</h3>
            <p className="text-xs text-zinc-500">{teamsList.length} registrados</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Club
          </button>
        )}
      </div>

      {/* Formulario de agregar */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-zinc-800/50 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              placeholder="Nombre del club..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Upload de escudo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-700 transition"
            >
              <Upload className="w-4 h-4" />
              {logoPreview ? 'Cambiar escudo' : 'Subir escudo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {logoPreview && (
              <div className="flex items-center gap-2">
                <img src={logoPreview} alt="Preview" className="w-8 h-8 object-contain rounded" />
                <button
                  type="button"
                  onClick={() => { setLogoPreview(null); setLogoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-xs text-zinc-500 hover:text-rose-400 transition"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); setLogoPreview(null); setNewName(''); }}
              className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-bold transition"
            >
              {submitting ? 'Guardando...' : 'Crear Club'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de clubes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/50">
        {teamsList.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm col-span-2">
            No hay clubes registrados
          </div>
        ) : (
          teamsList.map((team) => {
            const logo = getLogo(team);
            return (
              <div key={team.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/20 transition">
                <div className="flex items-center gap-3 min-w-0">
                  {logo ? (
                    <img src={logo} alt={team.nombre} className="w-8 h-8 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-white truncate block">{team.nombre}</span>
                    <span className="text-[10px] text-zinc-600">{team.slug || team.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(team.id, team.nombre)}
                  className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition flex-shrink-0"
                  title={`Eliminar ${team.nombre}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
