"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarId: string | null;
  avatarUrl: string | null;
}

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const loadData = async () => {
      try {
        const [userRes, avatarsRes] = await Promise.all([
          fetch('http://localhost:3000/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:3000/auth/avatars')
        ]);

        if (userRes.ok && avatarsRes.ok) {
          const userData = await userRes.json();
          const avatarsData = await avatarsRes.json();
          
          setUser(userData);
          setFullName(userData.fullName || '');
          setSelectedAvatarId(userData.avatarId);
          setAvatars(avatarsData);

          // We fetch pix key from localStorage since we aren't storing it on User model yet
          setPixKey(localStorage.getItem('pixKey') || '');
        } else {
          throw new Error('Falha ao carregar perfil');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const token = localStorage.getItem('token');
    
    // Save PixKey locally
    localStorage.setItem('pixKey', pixKey);

    try {
      const res = await fetch('http://localhost:3000/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          avatarId: selectedAvatarId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
        
        // Update user state to reflect new avatar globally if needed
        const newAvatar = avatars.find(a => a.id === selectedAvatarId);
        if (newAvatar) {
            const currentObj = JSON.parse(localStorage.getItem('user') || '{}');
            currentObj.avatar = newAvatar.imageUrl;
            currentObj.fullName = fullName;
            localStorage.setItem('user', JSON.stringify(currentObj));
            
            // Dispatch a storage event to force header update
            window.dispatchEvent(new Event('storage'));
        }

      } else {
        setMessage({ text: data.error || 'Erro ao atualizar', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Erro de conexão', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        
        <main className="flex-grow flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </main>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-8 flex items-center gap-3">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Meu Perfil
        </h1>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* BG Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-500 opacity-5 rounded-full blur-3xl pointer-events-none"></div>

            <form onSubmit={handleSave} className="space-y-6 relative z-10">
              
              {message && (
                <div className={\`p-4 rounded-xl font-bold \${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}\`}>
                  {message.text}
                </div>
              )}

              {/* Seção de Avatar */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Escolha seu Avatar</label>
                <div className="flex flex-wrap gap-4">
                  {avatars.map(av => (
                    <div 
                      key={av.id}
                      onClick={() => setSelectedAvatarId(av.id)}
                      className={\`cursor-pointer rounded-full p-1 border-2 transition-all \${selectedAvatarId === av.id ? 'border-yellow-500 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'border-transparent hover:border-gray-500 grayscale hover:grayscale-0'}\`}
                    >
                      <img src={av.imageUrl} alt={av.name} className="w-16 h-16 rounded-full bg-gray-700 object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">E-mail (Login)</label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Configurações Financeiras */}
              <div className="pt-4 border-t border-gray-700">
                <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Chave PIX (Para Saques)</label>
                <input 
                  type="text" 
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Seu CPF, E-mail ou Telefone..."
                  className="w-full max-w-md bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2">Esta chave será usada automaticamente quando você solicitar um saque.</p>
              </div>

              <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg font-bold transition-colors w-full md:w-auto"
                >
                  Sair da Conta (Logout)
                </button>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black px-8 py-3 rounded-xl uppercase tracking-wider transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

            </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
