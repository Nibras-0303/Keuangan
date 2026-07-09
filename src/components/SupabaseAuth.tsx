import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SupabaseAuthProps {
  onAuthSuccess: (session: any) => void;
}

type AuthView = 'login' | 'register' | 'forgot';

export default function SupabaseAuth({ onAuthSuccess }: SupabaseAuthProps) {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi 💖');
      return;
    }

    try {
      setLoading(true);
      resetMessages();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      if (data.session) {
        onAuthSuccess(data.session);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal masuk. Silakan periksa email dan sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Semua kolom wajib diisi untuk mendaftar ✨');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    try {
      setLoading(true);
      resetMessages();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Check if confirmation email is required
        const isConfirmed = data.session !== null;
        if (isConfirmed) {
          setSuccess('Pendaftaran berhasil! Menghubungkan akun Anda...');
          setTimeout(() => {
            if (data.session) onAuthSuccess(data.session);
          }, 1500);
        } else {
          setSuccess('Registrasi berhasil! Silakan periksa email Anda untuk memverifikasi akun sebelum masuk.');
          // Clear fields
          setDisplayName('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Silakan masukkan email Anda 📨');
      return;
    }

    try {
      setLoading(true);
      resetMessages();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess('Instruksi pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim email pemulihan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-rose-50 via-[#faf9f6] to-rose-100/50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 relative overflow-hidden transition-all duration-300">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl mb-4 relative shadow-xs">
            <Heart className="w-8 h-8 text-rose-500" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-gray-900">
            KitaPunya 💖
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {view === 'login' && 'Masuk ke Ruang Keuangan Bersama Kita'}
            {view === 'register' && 'Buat Akun Baru Pasangan Kita'}
            {view === 'forgot' && 'Pulihkan Kata Sandi Ruang Kita'}
          </p>
        </div>

        {/* Global Feedback Messages */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs font-semibold animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* View 1: LOGIN */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5 relative">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-2xl shadow-md shadow-rose-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Masuk Ruang Kita</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Belum memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="text-rose-500 font-bold hover:underline"
                >
                  Daftar Sekarang
                </button>
              </p>
            </div>
          </form>
        )}

        {/* View 2: REGISTER */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-5 relative">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Contoh: Nibras / Zenita"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Ketik ulang kata sandi..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-2xl shadow-md shadow-rose-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Daftar Akun Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-rose-500 font-bold hover:underline"
                >
                  Masuk Sekarang
                </button>
              </p>
            </div>
          </form>
        )}

        {/* View 3: FORGOT PASSWORD */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5 relative">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Alamat Email Pemulihan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-2xl shadow-md shadow-rose-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Kirim Link Pemulihan</span>
              )}
            </button>

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">
                Kembali ke halaman{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-rose-500 font-bold hover:underline"
                >
                  Masuk
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
