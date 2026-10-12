'use client';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import PwaInstallButton from '../components/PwaInstallButton';

export default function Home() {
  // Estados da Aplicação
  const [balance, setBalance] = useState<number>(0.0);
  const [token, setToken] = useState<string | null>(null);

  // Controle de Modais
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAffiliates, setShowAffiliates] = useState(false);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showPostRegisterConsent, setShowPostRegisterConsent] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Estados dos Formulários e Dados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  
  // Controle do PIX Gerado
  const [generatedPix, setGeneratedPix] = useState<{ code: string, txId: string, qrImage?: string } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const [dbAvatars, setDbAvatars] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userData, setUserData] = useState<{ fullName?: string, avatar?: string, role?: string } | null>(null);

  // Ticker de Ganhadores Fake
  const [liveWinner, setLiveWinner] = useState<{ name: string, game: string, amount: string } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/avatars`)
      .then(res => res.json())
      .then(data => {
        setDbAvatars(data);
        if (data.length > 0) setAvatar(data[0].id);
      })
      .catch(e => console.error(e));

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken) {
      setToken(savedToken);
      fetchBalance(savedToken);
      if (savedUser) setUserData(JSON.parse(savedUser));
    }
    const savedPix = localStorage.getItem('pixKey');
    if (savedPix) setPixKey(savedPix);

    // Lógica do Ticker de Ganhadores
    const games = ['Fortune Tiger', 'Aviator', 'Mines', 'Fortune Ox', 'Spaceman'];
    const names = ['Pedro H.', 'Maria S.', 'João G.', 'Lucas M.', 'Ana P.', 'Carlos B.', 'Ronaldo T.'];
    const interval = setInterval(() => {
      setLiveWinner({
        name: names[Math.floor(Math.random() * names.length)],
        game: games[Math.floor(Math.random() * games.length)],
        amount: (Math.random() * 900 + 50).toFixed(2)
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchBalance = async (jwt: string) => {
    try {
      const res = await fetch(`${API_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (data.balance !== undefined) setBalance(data.balance);
    } catch (e) { }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUserData(data.user);
      setShowLogin(false);
      fetchBalance(data.token);
    } else {
      alert(data.error || 'Erro ao fazer login');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert('Você precisa aceitar os Termos de Uso e Jogo Responsável para se cadastrar.');
      return;
    }
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, avatarId: avatar, inviteCode })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUserData(data.user);
      setShowRegister(false);
      fetchBalance(data.token);
      // Exibe imediatamente o termo de consentimento e responsabilidade pós-cadastro
      setShowPostRegisterConsent(true);
    } else {
      alert(data.error || 'Erro ao cadastrar');
    }
  };

  const confirmDeposit = async () => {
    if (!token) return alert('Faça login primeiro');
    const amount = Number(depositAmount);
    if (!amount || isNaN(amount) || amount <= 0) return alert('Valor inválido');

    const res = await fetch(`${API_URL}/wallet/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    
    if (data.pixCode) {
      setGeneratedPix({ code: data.pixCode, txId: data.transactionId, qrImage: data.qrCodeImage });
    } else {
      alert(data.error || 'Erro ao gerar PIX');
    }
  };

  // Botão [DEV] Simular Pagamento do Gateway
  const simulateGatewayPayment = async () => {
    if (!generatedPix) return;
    setCheckingPayment(true);
    try {
      const res = await fetch(`${API_URL}/webhooks/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pix: [{ txid: generatedPix.txId, valor: depositAmount }] })
      });
      if (res.ok) {
        alert('Gateway confirmou o pagamento! Saldo atualizado.');
        setGeneratedPix(null);
        setShowDeposit(false);
        if (token) fetchBalance(token);
      }
    } catch (e) {
      console.error(e);
    }
    setCheckingPayment(false);
  };

  const handleWithdraw = async () => {
    if (!token) return alert('Faça login primeiro');
    const amount = Number(withdrawAmount);
    if (!amount || isNaN(amount) || amount <= 0) return alert('Valor inválido');
    if (!pixKey) return alert('Preencha a chave PIX');

    const res = await fetch(`${API_URL}/wallet/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount, pixKey })
    });
    const data = await res.json();
    
        if (res.ok && data.newBalance !== undefined) {
      setBalance(data.newBalance);
      setShowWithdraw(false);
      alert('Saque solicitado! O dinheiro cairá na sua conta em instantes.');
    } else {
      if (data.newBalance !== undefined) setBalance(data.newBalance);
      alert(data.error || 'Erro ao sacar');
    }
  };

  const openHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/wallet/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTransactions(data);
      setShowHistory(true);
    } catch (e) {
      console.error('Erro ao buscar histórico', e);
    }
  };

  const openAffiliates = async () => {
    if (!token) return alert('Faça login primeiro para acessar o painel de afiliados.');
    try {
      const res = await fetch(`${API_URL}/auth/affiliate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAffiliateData(data);
      setShowAffiliates(true);
    } catch (e) {
      console.error('Erro ao buscar dados de afiliados', e);
    }
  };

  const playGame = async (gameCode: string, provider: string) => {
    if (!token) return alert('Você precisa estar logado para jogar!');
    
    // Jogos locais / Originais não precisam chamar a API de integração do provedor
    if (provider === 'CUSTOM' || provider === 'CLASSIC' || provider === 'SITEBET') {
      window.open(`/play?code=${gameCode}`, '_blank');
      return;
    }

    const res = await fetch(`${API_URL}/games/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ provider, gameCode })
    });
    const data = await res.json();
    
    if (data.gameUrl) {
      window.open(data.gameUrl, '_blank');
    } else {
      alert(data.error || 'Erro ao carregar o jogo');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUserData(null);
    setBalance(0);
  };

  const gamesList = [
    { id: 'fortune-tiger', name: 'Fortune Tiger', image: '🐯', provider: 'SITEBET', category: 'slots' },
    { id: 'sloty', name: 'Fruits', image: '🍉', provider: 'SITEBET', category: 'slots' },
    { id: 'halloween', name: 'Halloween Clássico', image: '🎃', provider: 'CLASSIC', category: 'slots' },
    { id: 'aviator', name: 'Aviator', image: '✈️', provider: 'SPRIBE', category: 'crash' },
    { id: 'mines', name: 'Mines', image: '💣', provider: 'CUSTOM', category: 'crash' },
    { id: 'double', name: 'Roleta Double', image: '🎡', provider: 'SITEBET', category: 'crash' }
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* Sidebar Lateral (Estilo Plataforma Real) */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden lg:flex flex-col flex-shrink-0 z-20">
        <div className="p-6">
          <div className="text-3xl font-black italic text-yellow-500 tracking-tighter">
            SITE<span className="text-white">BET</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar pb-6">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4 px-2">Menu Principal</div>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition">
            🏠 Início
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition">
            🎰 Cassino
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition">
            ✈️ Crash Games
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition">
            ⚽ Esportes
          </button>
          
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-2">Promoções</div>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition">
            🎁 Bônus Diário
          </button>
          <button onClick={openAffiliates} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition relative overflow-hidden group">
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
            🤝 Indique e Ganhe
          </button>

          {/* Banner PWA no Menu Lateral */}
          <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-gray-800/80 to-gray-900 border border-yellow-500/30 text-center flex flex-col items-center">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-1">App no Celular</div>
            <p className="text-[11px] text-gray-400 mb-3">Instale para jogar mais rápido sem abrir o navegador!</p>
            <PwaInstallButton />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Navbar Superior */}
        <header className="w-full flex items-center justify-between p-4 bg-gray-900 shadow-md border-b border-gray-800 z-30">
          <div className="lg:hidden text-2xl font-black italic text-yellow-500 tracking-tighter">
            S<span className="text-white">B</span>
          </div>
          
          {/* Ticker de Ganhadores (Centro) */}
          <div className="hidden md:flex items-center bg-gray-800 rounded-full px-4 py-1.5 border border-gray-700/50 min-w-[300px]">
            <span className="text-yellow-500 mr-2 animate-pulse">🔥</span>
            {liveWinner ? (
              <span className="text-sm font-medium text-gray-300 truncate transition-all duration-500">
                <strong className="text-white">{liveWinner.name}</strong> ganhou <strong className="text-green-400">R$ {liveWinner.amount}</strong> no <span className="text-yellow-400">{liveWinner.game}</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-500">Aguardando prêmios...</span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <PwaInstallButton />
            {token ? (
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 border border-gray-700 px-4 py-1.5 rounded-lg flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Saldo</span>
                  <span className="font-black text-green-400 text-sm">R$ {balance.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => setShowDeposit(true)}
                  className="bg-green-500 text-gray-900 px-5 py-2 rounded-lg font-black hover:bg-green-400 transition hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)] hidden sm:block"
                >
                  DEPOSITAR
                </button>

                {/* Dropdown de Perfil */}
                {userData && (
                  <div className="relative group cursor-pointer ml-2">
                    <div className="flex items-center gap-2 bg-gray-800 p-1 pr-3 rounded-full border border-gray-700 hover:border-yellow-500 transition-colors">
                      {userData.avatar ? (
                        <img src={userData.avatar} alt="Avatar" className="w-9 h-9 rounded-full bg-gray-700 object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm">🧑‍🦱</div>
                      )}
                      <span className="font-bold text-gray-200 hidden md:block text-sm">
                        {userData.fullName?.split(' ')[0] || 'Jogador'}
                      </span>
                      <span className="text-gray-500 text-xs hidden md:block">▼</span>
                    </div>
                    
                    <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50 origin-top-right">
                      
                        {userData?.role === 'ADMIN' && (
                          <button onClick={() => window.open('/admin', '_blank')} className="px-4 py-3 text-left text-sm font-bold text-yellow-500 hover:bg-gray-700 border-b border-gray-700 flex items-center gap-3">
                            🛠️ Painel Admin (Teste)
                          </button>
                        )}

                      <button onClick={() => window.location.href = '/profile'} className="px-4 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 flex items-center gap-3 transition">👤 Meu Perfil</button>
                      <button onClick={openHistory} className="px-4 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 flex items-center gap-3 transition">
                        📜 Histórico de Conta
                      </button>
                      <button onClick={() => setShowWithdraw(true)} className="px-4 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 flex items-center gap-3 transition">
                        💸 Sacar Dinheiro
                      </button>
                      <button onClick={logout} className="px-4 py-3 text-left text-sm font-bold text-red-400 hover:bg-gray-700 hover:text-red-300 flex items-center gap-3 transition">
                        🚪 Sair da Conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)} className="text-gray-300 hover:text-white font-bold transition px-2">
                  Entrar
                </button>
                <button onClick={() => setShowRegister(true)} className="bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg font-black hover:bg-yellow-400 transition hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  CADASTRAR
                </button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {/* Banner Hero Estilo Realsbet */}
          <section className="w-full relative px-4 pt-6 pb-10">
            <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 border border-gray-700 relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
              <div className="absolute right-0 top-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 max-w-xl text-center md:text-left">
                <span className="bg-yellow-500 text-gray-900 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Bônus de Boas-vindas</span>
                <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                  DOBRE SEU PRIMEIRO <span className="text-yellow-500">DEPÓSITO</span>
                </h1>
                <p className="text-gray-400 mb-8 text-lg font-medium">
                  Até R$ 1.000,00 de bônus para jogar nos melhores slots e crash games do mundo com saques instantâneos.
                </p>
                <button 
                  onClick={() => token ? setShowDeposit(true) : setShowRegister(true)}
                  className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-xl font-black text-xl hover:bg-yellow-400 transition-all hover:scale-105 shadow-[0_0_30px_rgba(234,179,8,0.3)] w-full md:w-auto"
                >
                  {token ? 'DEPOSITAR AGORA' : 'RESGATAR BÔNUS'}
                </button>
              </div>
              
              <div className="hidden md:block relative z-10">
                <div className="text-9xl drop-shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-pulse">🎁</div>
              </div>
            </div>
          </section>

          {/* Seção Slots */}
          <section className="w-full px-4 pb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">🎰 Slots Populares</h2>
              <button className="text-yellow-500 hover:text-yellow-400 font-bold text-sm bg-yellow-500/10 px-4 py-2 rounded-lg">Ver todos</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gamesList.filter(g => g.category === 'slots').map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => playGame(game.id, game.provider)}
                  className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-gray-700 transition cursor-pointer border border-gray-700 hover:border-yellow-500 group relative overflow-hidden aspect-[3/4]"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-end pb-6">
                    <button className="bg-yellow-500 text-gray-900 font-black px-6 py-2 rounded-full text-sm hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                      JOGAR
                    </button>
                  </div>
                  <div className="text-7xl mb-4 group-hover:scale-125 transition-transform duration-500 drop-shadow-2xl">{game.image}</div>
                  <h3 className="font-black text-lg text-center leading-tight z-20">{game.name}</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 z-20">{game.provider}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Seção Crash Games */}
          <section className="w-full px-4 pb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">✈️ Crash Games</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gamesList.filter(g => g.category === 'crash').map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => playGame(game.id, game.provider)}
                  className="bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center hover:bg-gray-700 transition cursor-pointer border border-gray-700 hover:border-blue-500 group relative overflow-hidden aspect-[3/4]"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-end pb-6">
                    <button className="bg-blue-500 text-white font-black px-6 py-2 rounded-full text-sm hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      JOGAR
                    </button>
                  </div>
                  <div className="text-7xl mb-4 group-hover:-translate-y-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">{game.image}</div>
                  <h3 className="font-black text-lg text-center leading-tight z-20">{game.name}</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 z-20">{game.provider}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Apostas ao Vivo (Live Bets) */}
          <section className="w-full px-4 pb-20">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">🟢 Apostas ao Vivo</h2>
            <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div className="overflow-x-auto custom-scrollbar relative z-10">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-widest">
                      <th className="p-4 font-bold">Jogo</th>
                      <th className="p-4 font-bold">Jogador</th>
                      <th className="p-4 font-bold text-right">Aposta</th>
                      <th className="p-4 font-bold text-center">Multiplicador</th>
                      <th className="p-4 font-bold text-right">Prêmio</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Linhas Fake Geradas Dinamicamente */}
                    {[
                      { g: 'Fortune Tiger', u: 'Luiz F.', b: 50.0, m: 10.0, p: 500.0 },
                      { g: 'Aviator', u: 'Marcos P.', b: 10.0, m: 2.5, p: 25.0 },
                      { g: 'Fortune Ox', u: 'Ana C.', b: 100.0, m: 0.0, p: 0.0 },
                      { g: 'Mines', u: 'João Silva', b: 5.0, m: 5.4, p: 27.0 },
                      { g: 'Spaceman', u: 'Carlos B.', b: 200.0, m: 1.5, p: 300.0 },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition">
                        <td className="p-4 font-black text-yellow-500">{row.g}</td>
                        <td className="p-4 text-gray-300 flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-[10px]">🧑</div>
                          {row.u}
                        </td>
                        <td className="p-4 font-medium text-right text-gray-400">R$ {row.b.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.m > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                            {row.m.toFixed(2)}x
                          </span>
                        </td>
                        <td className={`p-4 font-black text-right ${row.p > 0 ? 'text-green-500' : 'text-gray-600'}`}>
                          {row.p > 0 ? `+ R$ ${row.p.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Provedores (Providers) */}
          <section className="w-full px-4 pb-20">
            <h2 className="text-xl font-bold mb-6 text-gray-500 uppercase tracking-widest text-center">Provedores Oficiais</h2>
            <div className="flex flex-wrap justify-center gap-4 opacity-50">
              {['PG SOFT', 'PRAGMATIC PLAY', 'SPRIBE', 'EVOLUTION', 'SMARTSOFT'].map(p => (
                <div key={p} className="bg-gray-800 px-6 py-3 rounded-xl font-black tracking-tighter text-gray-400 border border-gray-700">
                  {p}
                </div>
              ))}
            </div>
          </section>

          {/* Footer Simple */}
          <footer className="w-full bg-gray-900 border-t border-gray-800 p-8 text-center text-gray-500 text-sm">
            <p>SITEBET © 2026. Todos os direitos reservados.</p>
            <p className="mt-2 text-xs flex flex-wrap items-center justify-center gap-1.5">
              <span>Jogue com responsabilidade. Proibido para menores de 18 anos.</span>
              <span>•</span>
              <button 
                type="button"
                onClick={() => setShowTermsModal(true)} 
                className="text-yellow-400 hover:text-yellow-300 hover:underline font-bold transition cursor-pointer"
              >
                Termos de Uso e Diversão
              </button>
            </p>
          </footer>
        </main>
      </div>

      {/* MODAIS (MANTIDOS E REFINADOS VISUALMENTE) */}
      
      {/* Modal de Login */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl font-black mb-6 text-white text-center">Entrar</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
              <input type="text" placeholder="Celular ou E-mail" value={email} onChange={e => setEmail(e.target.value)} className="p-4 bg-gray-800 rounded-xl text-white font-medium border border-gray-700 focus:border-yellow-500 outline-none transition" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="p-4 bg-gray-800 rounded-xl text-white font-medium border border-gray-700 focus:border-yellow-500 outline-none transition" required />
              <button type="submit" className="bg-yellow-500 text-gray-900 font-black text-lg py-4 rounded-xl mt-2 hover:bg-yellow-400 transition hover:scale-[1.02]">ACESSAR CONTA</button>
              <button type="button" onClick={() => setShowLogin(false)} className="text-gray-400 font-medium text-sm mt-2 hover:text-white transition">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-3xl font-black mb-6 text-white text-center">Criar Conta</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} className="p-4 bg-gray-800 rounded-xl text-white font-medium border border-gray-700 focus:border-yellow-500 outline-none transition" required />
              <input type="text" placeholder="Celular ou E-mail" value={email} onChange={e => setEmail(e.target.value)} className="p-4 bg-gray-800 rounded-xl text-white font-medium border border-gray-700 focus:border-yellow-500 outline-none transition" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="p-4 bg-gray-800 rounded-xl text-white font-medium border border-gray-700 focus:border-yellow-500 outline-none transition" required />
              <input type="text" placeholder="Código de Indicação (Opcional)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="p-4 bg-gray-800 rounded-xl text-white font-medium border border-gray-700 focus:border-yellow-500 outline-none transition" />
              
              <div className="mt-2 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
                <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider text-center">Escolha seu Avatar</label>
                <div className="flex gap-2 justify-center flex-wrap">
                  {dbAvatars.map((av: any) => (
                    <button 
                      key={av.id} type="button" 
                      onClick={() => setAvatar(av.id)} 
                      title={av.name}
                      className={`w-14 h-14 p-1 rounded-full border-2 transition-all ${avatar === av.id ? 'border-yellow-500 bg-gray-700 scale-110 shadow-lg' : 'border-transparent bg-gray-800 hover:bg-gray-700 hover:scale-105'}`}
                    >
                      <img src={av.imageUrl} alt={av.name} className="w-full h-full object-cover rounded-full" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Termo de Consentimento Obrigatório no Cadastro */}
              <div className="bg-gray-800/80 p-3.5 rounded-xl border border-yellow-500/30 flex items-start gap-3 mt-1">
                <input 
                  type="checkbox" 
                  id="regTerms"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-yellow-500 cursor-pointer flex-shrink-0"
                  required
                />
                <label htmlFor="regTerms" className="text-[11px] text-gray-300 leading-snug cursor-pointer select-none">
                  Declaro ter <strong>18 anos ou mais</strong> e compreendo que o site é <strong>exclusivamente para diversão e lazer</strong>, sem garantia de ganhos ou lucros.{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowTermsModal(true)} 
                    className="text-yellow-400 font-bold underline hover:text-yellow-300 ml-0.5"
                  >
                    Ler Termos
                  </button>
                </label>
              </div>

              <button type="submit" className="bg-yellow-500 text-gray-900 font-black text-lg py-4 rounded-xl mt-2 hover:bg-yellow-400 transition hover:scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.3)]">CADASTRAR E JOGAR</button>
              <button type="button" onClick={() => setShowRegister(false)} className="text-gray-400 font-medium text-sm mt-2 hover:text-white transition">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Depósito */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-green-500/30 p-8 rounded-3xl w-full max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-green-500/20 blur-[60px] pointer-events-none"></div>
            <h2 className="text-3xl font-black mb-2 text-white relative z-10 flex items-center justify-center gap-2">
              <span className="text-green-500">💰</span> Depositar
            </h2>
            <p className="text-gray-400 mb-6 text-sm font-medium relative z-10">Adicione fundos instantaneamente via PIX.</p>
            
            {generatedPix ? (
              <div className="flex flex-col gap-4 relative z-10">
                <div className="bg-white p-4 rounded-xl flex items-center justify-center mx-auto w-48 h-48">
                  {/* Falso QR Code visual estático */}
                  {generatedPix.qrImage ? <img src={generatedPix.qrImage} className="w-full h-full" alt="QR Code" /> : <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-90"></div>}
                </div>
                <p className="text-yellow-500 font-bold text-sm">Escaneie o QR Code ou copie a chave abaixo:</p>
                <textarea 
                  readOnly 
                  value={generatedPix.code} 
                  className="bg-gray-800 text-gray-400 p-3 rounded-lg text-xs h-20 resize-none outline-none border border-gray-700"
                />
                
                <div className="flex flex-col gap-2 mt-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedPix.code).then(() => alert('Chave Copiada!'))}
                    className="bg-gray-800 text-white font-black py-4 rounded-xl border border-gray-700 hover:border-yellow-500 transition-all shadow-lg"
                  >
                    📋 COPIAR CÓDIGO PIX
                  </button>
                  
                  {/* Botão de Teste Local - Aciona o Webhook */}
                  
                    {userData?.role === 'ADMIN' && (
                    <button 
                      onClick={simulateGatewayPayment}
                      disabled={checkingPayment}
                      className="bg-blue-600/20 text-blue-400 border border-blue-500/50 font-black py-3 rounded-xl hover:bg-blue-600 hover:text-white transition mt-2 flex items-center justify-center gap-2 text-sm"
                    >
                      {checkingPayment ? 'PROCESSANDO...' : '🚀 [DEV] SIMULAR PAGAMENTO PAGO'}
                    </button>
                    )}

                </div>

                <button onClick={() => { setGeneratedPix(null); setShowDeposit(false); }} className="text-gray-500 font-medium text-sm mt-4 hover:text-white transition">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                  {[20, 50, 100, 200, 500, 1000].map(val => (
                    <button 
                      key={val}
                      onClick={() => setDepositAmount(val.toString())}
                      className={`${depositAmount === val.toString() ? 'bg-green-500 text-gray-900 border-green-400 scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-white border-gray-700 hover:border-green-500'} border font-black py-4 rounded-xl transition-all`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 text-left mb-8 relative z-10">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Outro valor (R$)</label>
                  <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0,00" className="p-4 bg-gray-800 rounded-xl text-green-400 font-black text-2xl border border-gray-700 focus:border-green-500 outline-none w-full text-center transition" />
                </div>

                <button onClick={confirmDeposit} className="w-full bg-green-500 text-gray-900 font-black text-xl py-5 rounded-xl hover:bg-green-400 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.5)] uppercase tracking-widest relative z-10">
                  GERAR PIX
                </button>
                <button onClick={() => setShowDeposit(false)} className="text-gray-400 font-medium text-sm mt-6 hover:text-white transition relative z-10">Cancelar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Saque */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/30 p-8 rounded-3xl w-full max-w-md text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/20 blur-[60px] pointer-events-none"></div>
            
            <h2 className="text-3xl font-black mb-2 text-white relative z-10">Sacar Dinheiro</h2>
            <p className="text-gray-400 mb-6 text-sm font-medium relative z-10">O dinheiro cai na sua conta em até 1 minuto.</p>
            
            <div className="flex flex-col gap-5 text-left mb-8 relative z-10">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">Chave PIX</label>
                <input 
                  type="text" 
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder="CPF, E-mail ou Telefone"
                  className="p-4 bg-gray-800 rounded-xl text-white font-medium text-lg border border-gray-700 focus:border-red-500 outline-none w-full mt-2 transition" 
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">Valor do Saque (R$)</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0,00"
                  className="p-4 bg-gray-800 rounded-xl text-red-400 font-black text-2xl border border-gray-700 focus:border-red-500 outline-none w-full text-center mt-2 transition" 
                />
              </div>
            </div>

            <button 
              onClick={handleWithdraw}
              className="w-full bg-red-500 text-white font-black text-xl py-5 rounded-xl hover:bg-red-600 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.5)] uppercase tracking-widest relative z-10"
            >
              CONFIRMAR SAQUE
            </button>
            <button onClick={() => setShowWithdraw(false)} className="text-gray-400 font-medium text-sm mt-6 hover:text-white transition relative z-10">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            <h2 className="text-2xl font-black mb-6 text-white text-center">Histórico da Conta</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="text-gray-500 text-center mt-10 p-8 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <span className="text-4xl block mb-2">📭</span>
                  <p className="font-medium">Você ainda não fez nenhuma transação.</p>
                </div>
              ) : (
                transactions.map((t: any) => (
                  <div key={t.id} className="bg-gray-800 p-4 rounded-2xl flex justify-between items-center border border-gray-700/50 hover:bg-gray-700 transition">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${
                        t.type === 'DEPOSIT' ? 'bg-green-500/20' : 
                        t.type === 'WITHDRAW' ? 'bg-red-500/20' : 
                        t.amount > 0 ? 'bg-yellow-500/20' : 'bg-gray-700'
                      }`}>
                        {t.type === 'DEPOSIT' ? '💸' : t.type === 'WITHDRAW' ? '🏦' : '🎰'}
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          {t.type === 'DEPOSIT' ? 'Depósito PIX' : t.type === 'WITHDRAW' ? 'Saque PIX' : 'Rodada de Jogo'}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{new Date(t.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className={`font-black text-lg tracking-tight ${t.amount > 0 ? 'text-green-400' : 'text-gray-300'}`}>
                      {t.amount > 0 ? '+' : ''} R$ {Math.abs(t.amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setShowHistory(false)} className="mt-6 bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 border border-gray-700 w-full transition uppercase tracking-widest text-sm">
              FECHAR
            </button>
          </div>
        </div>
      )}

      {/* Modal de Afiliados */}
      {showAffiliates && affiliateData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-yellow-500/30 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-yellow-500/20 blur-[60px] pointer-events-none"></div>
            
            <h2 className="text-3xl font-black mb-2 text-white relative z-10 text-center">Indique e Ganhe</h2>
            <p className="text-gray-400 mb-8 text-sm font-medium relative z-10 text-center">Receba 20% de todos os depósitos feitos por seus indicados.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Seus Indicados</span>
                <span className="text-2xl font-black text-white">{affiliateData.totalReferrals}</span>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Ganhos Totais</span>
                <span className="text-2xl font-black text-green-400">R$ {affiliateData.estimatedCommission.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Seu Código de Indicação</label>
              <div className="flex bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <input 
                  type="text" 
                  readOnly 
                  value={affiliateData.inviteCode} 
                  className="flex-1 bg-transparent p-4 text-yellow-400 font-bold outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(affiliateData.inviteCode);
                    alert('Código copiado!');
                  }}
                  className="bg-yellow-500 text-gray-900 font-black px-6 hover:bg-yellow-400 transition"
                >
                  COPIAR
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Peça para seus amigos colarem este código ao criarem a conta.</p>
            </div>

            <button onClick={() => setShowAffiliates(false)} className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-700 border border-gray-700 transition uppercase tracking-widest text-sm relative z-10">
              FECHAR PAINEL
            </button>
          </div>
        </div>
      )}

      {/* Modal de Consentimento Exibido Imediatamente Após o Cadastro Finalizado */}
      {showPostRegisterConsent && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gray-900 border-2 border-yellow-500/60 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(234,179,8,0.25)] relative overflow-hidden text-white max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-yellow-500/20 blur-[50px] pointer-events-none"></div>

            <div className="text-center mb-4 relative z-10">
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner animate-pulse">
                🛡️
              </div>
              <span className="bg-yellow-500 text-gray-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 inline-block">
                Cadastro Concluído com Sucesso
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">Termo de Uso & Diversão Consciente</h2>
              <p className="text-xs text-gray-400 mt-1">
                Por favor, leia atentamente as diretrizes da plataforma antes de iniciar suas apostas:
              </p>
            </div>

            {/* Conteúdo rolável com as regras claras */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3.5 my-3 relative z-10 text-xs md:text-sm">
              <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700/80 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">🎯</span>
                <div>
                  <h4 className="font-bold text-yellow-400 text-xs uppercase tracking-wider mb-0.5">Finalidade Exclusiva: Diversão</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    A SiteBet foi concebida unicamente como uma plataforma de <strong>lazer e entretenimento recreativo</strong>. Os jogos destinam-se a momentos de diversão.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 p-3.5 rounded-2xl border border-yellow-500/30 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-300 text-xs uppercase tracking-wider mb-0.5">Sem Garantia de Ganhos ou Lucros</h4>
                  <p className="text-gray-200 text-xs leading-relaxed">
                    Jogos de cassino e apostas envolvem <strong>riscos matemáticos e resultados aleatórios</strong>. Sob nenhuma hipótese garantimos ganhos, retornos financeiros ou renda. Você pode ganhar ou perder o valor apostado.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700/80 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">🔞</span>
                <div>
                  <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider mb-0.5">Maioridade Legal (+18)</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    O acesso, cadastro e participação são restritos a <strong>maiores de 18 anos</strong>. Ao prosseguir, você declara ter idade legal para participar.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/80 p-3.5 rounded-2xl border border-gray-700/80 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">💡</span>
                <div>
                  <h4 className="font-bold text-gray-200 text-xs uppercase tracking-wider mb-0.5">Jogo Responsável</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Nunca utilize recursos orçados para alimentação, saúde, contas essenciais ou sustento da família. Aposte somente valores que não façam falta e estabeleça limites para seu entretenimento.
                  </p>
                </div>
              </div>
            </div>

            {/* Ação de aceite obrigatória */}
            <div className="pt-3 border-t border-gray-800 relative z-10">
              <button 
                type="button"
                onClick={() => {
                  setShowPostRegisterConsent(false);
                  localStorage.setItem('terms_consent_acknowledged', 'true');
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-950 font-black py-4 rounded-xl text-sm uppercase tracking-wider transition hover:scale-[1.01] shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✅</span>
                <span>Estou ciente e aceito os termos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Completo de Termos de Uso e Diversão (aberto via link ou rodapé) */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative text-white max-h-[85vh] flex flex-col">
            <h2 className="text-2xl font-black mb-1 text-yellow-400 flex items-center gap-2">
              📜 Termos de Uso e Jogo Consciente
            </h2>
            <p className="text-xs text-gray-400 mb-4">Diretrizes de transparência, entretenimento e responsabilidade da SiteBet.</p>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 text-xs md:text-sm text-gray-300 pr-2 leading-relaxed">
              <section className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-800">
                <h3 className="font-bold text-white mb-1">1. Natureza do Serviço e Diversão</h3>
                <p>A SiteBet oferece uma plataforma digital com slots, jogos crash e cassino para fins <strong>estritamente recreativos e de entretenimento</strong>.</p>
              </section>

              <section className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-800">
                <h3 className="font-bold text-white mb-1">2. Sem Garantia de Ganhos ou Lucros</h3>
                <p>Nenhum jogo presente no site deve ser interpretado como investimento, emprego, fonte de renda ou promessa de retorno financeiro. Os resultados dependem de geradores matemáticos e regras probabilísticas, havendo risco integral de perda dos valores apostados.</p>
              </section>

              <section className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-800">
                <h3 className="font-bold text-white mb-1">3. Idade Mínima (+18)</h3>
                <p>É estritamente proibido o cadastro e uso por indivíduos menores de 18 anos. Contas identificadas em descumprimento serão permanentemente bloqueadas.</p>
              </section>

              <section className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-800">
                <h3 className="font-bold text-white mb-1">4. Práticas de Jogo Responsável</h3>
                <p>Recomendamos que todos os usuários definam orçamentos prévios de lazer e jamais apostem valores essenciais para o sustento próprio ou de dependentes. Jogue com moderação.</p>
              </section>
            </div>

            <button 
              type="button" 
              onClick={() => setShowTermsModal(false)}
              className="mt-5 w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs border border-gray-700 transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
