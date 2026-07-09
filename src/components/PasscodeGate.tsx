import React, { useState } from 'react';
import { Heart, ArrowRight, User } from 'lucide-react';

interface PasscodeGateProps {
  correctPasscode: string;
  user1: string;
  user2: string;
  onSuccess: (selectedUser: string) => void;
}

export default function PasscodeGate({ user1, user2, onSuccess }: Omit<PasscodeGateProps, 'correctPasscode'>) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [customUser, setCustomUser] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUser = isNewUser ? customUser.trim() : selectedUser;
    if (!finalUser) {
      setError('Pilih siapa dirimu terlebih dahulu 💖');
      return;
    }
    onSuccess(finalUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-rose-50 via-cream-50 to-rose-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 relative overflow-hidden animate-slide-up">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl mb-4 relative">
            <Heart className="w-8 h-8 animate-pulse text-brand-500" fill="currentColor" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
              2
            </div>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-gray-900">
            KitaPunya 💖
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Ruang Keuangan Bersama Pasangan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {/* Identity Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Siapa dirimu hari ini?
            </label>

            {!isNewUser ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-select-user1"
                  onClick={() => {
                    setSelectedUser(user1);
                    setError('');
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedUser === user1
                      ? 'border-brand-500 bg-brand-50/50 text-brand-600 font-medium shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1 opacity-70" />
                  <span className="text-sm block truncate">{user1}</span>
                </button>

                <button
                  type="button"
                  id="btn-select-user2"
                  onClick={() => {
                    setSelectedUser(user2);
                    setError('');
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedUser === user2
                      ? 'border-brand-500 bg-brand-50/50 text-brand-600 font-medium shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50/50'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1 opacity-70" />
                  <span className="text-sm block truncate">{user2}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  id="input-custom-user"
                  placeholder="Masukkan nama panggilanmu..."
                  value={customUser}
                  onChange={(e) => {
                    setCustomUser(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div className="text-right">
              <button
                type="button"
                id="btn-toggle-new-user"
                onClick={() => {
                  setIsNewUser(!isNewUser);
                  setSelectedUser('');
                  setCustomUser('');
                  setError('');
                }}
                className="text-xs text-rose-500 font-medium hover:underline"
              >
                {isNewUser ? 'Pilih profil terdaftar' : 'Gunakan nama lain...'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium text-center animate-pulse">
              {error}
            </p>
          )}

          <button
            type="submit"
            id="btn-submit-login"
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-medium rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Masuk ke Ruang Kita</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
