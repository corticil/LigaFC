import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login({ onAuthenticate }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(false);

    // Obtener la contraseña de la variable de entorno, con fallback a 'ligafc'
    const correctPassword = import.meta.env.VITE_APP_PASSWORD || 'ligafc';

    if (password.trim() === correctPassword.trim()) {
      // Éxito
      localStorage.setItem('ligafc_authenticated', 'true');
      onAuthenticate(true);
    } else {
      // Error con animación de vibración (shake)
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo (Efecto Neon/Glow) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div 
        className={`w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative transition-transform duration-300 ${
          shake ? 'animate-bounce' : '' // Usamos un efecto rebote/vibración rápido
        }`}
        style={{
          animation: shake ? 'shake 0.4s ease-in-out' : 'none'
        }}
      >
        {/* Estilo CSS inyectado temporalmente para la animación shake */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
        `}} />

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/5">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            LigaFC <span className="text-xs bg-zinc-800 text-zinc-400 font-semibold px-2 py-0.5 rounded-full border border-zinc-700">Bitácora</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-2">
            Introduce la contraseña de acceso para entrar al historial y registrar encuentros
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs text-zinc-400 font-medium">Contraseña de la Liga</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Contraseña incorrecta. Pídesela al administrador.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25"
          >
            <Unlock className="w-4 h-4" />
            Entrar a la Bitácora
          </button>
        </form>
      </div>
    </div>
  );
}
