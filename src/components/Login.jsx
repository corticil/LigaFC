import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

export default function Login({ onAuthenticate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Credenciales inválidas. Verificá email y contraseña.'
        : authError.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      onAuthenticate(true);
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
        {/* Keyframes de animación shake (definidos en index.css) */}

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/5">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            LigaFC <span className="text-xs bg-zinc-800 text-zinc-400 font-semibold px-2 py-0.5 rounded-full border border-zinc-700">Bitácora</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-2">
            Iniciá sesión con tu cuenta de administrador para acceder al historial y registrar encuentros
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs text-zinc-400 font-medium">Email</label>
            <input
              type="email"
              placeholder="admin@ligafc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-400 font-medium">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
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
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25"
          >
            <Unlock className="w-4 h-4" />
            {loading ? 'Entrando...' : 'Entrar a la Bitácora'}
          </button>
        </form>
      </div>
    </div>
  );
}
