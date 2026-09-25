import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ModalDrawer } from './ModalDrawer';

export const LandingPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, joinCoupleSpace, startDemoMode } =
    useAuth();

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'create' | 'join'>('create');
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  const openCreateFlow = () => {
    setAuthMode('create');
    setIsRegister(true);
    setFormError('');
    setAuthModalOpen(true);
  };

  const openJoinFlow = () => {
    setAuthMode('join');
    setFormError('');
    setAuthModalOpen(true);
  };

  const handleGoogleAuth = async () => {
    setLoadingAction(true);
    setFormError('');
    try {
      await loginWithGoogle();
      setAuthModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar com Google';
      setFormError(msg.includes('popup-closed') ? 'Janela fechada antes da conclusão.' : msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoadingAction(true);

    try {
      if (authMode === 'join') {
        if (!inviteCode.trim()) {
          setFormError('Por favor, informe o código de convite (ex: NOSSO-892).');
          setLoadingAction(false);
          return;
        }

        // If email provided, sign in or register first
        if (email && password) {
          if (isRegister) {
            await registerWithEmail(email, password, name || 'Parceiro(a)');
          } else {
            await loginWithEmail(email, password);
          }
        } else {
          // Quick join in demo mode or without credentials
          startDemoMode(inviteCode.trim().toUpperCase());
          setAuthModalOpen(false);
          return;
        }

        const success = await joinCoupleSpace(inviteCode);
        if (!success) {
          setFormError('Código de convite não encontrado ou inválido.');
          setLoadingAction(false);
          return;
        }
        setAuthModalOpen(false);
      } else {
        // Create space flow
        if (isRegister) {
          if (!name.trim()) {
            setFormError('Por favor, informe seu nome.');
            setLoadingAction(false);
            return;
          }
          await registerWithEmail(email, password, name);
        } else {
          await loginWithEmail(email, password);
        }
        setAuthModalOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setFormError('E-mail ou senha incorretos.');
      } else if (msg.includes('email-already-in-use')) {
        setFormError('Este e-mail já está cadastrado. Alterne para entrar.');
      } else {
        setFormError(msg);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex flex-col justify-between selection:bg-[#561c24] selection:text-[#E8d8c4]">
      {/* ========================================================================= */}
      {/* PRIMEIRA PARTE DA HOME: TOTALMENTE BORDÔ COM DESTAQUES EM BEGE (INVERTIDO) */}
      {/* ========================================================================= */}
      <section className="bg-[#561c24] text-[#f4eae0] border-b-2 border-[#3f1218] relative overflow-hidden">
        {/* Subtle decorative stationery grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#6d2932_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Top Brand Bar (Inverted inside Bordô) */}
        <header className="px-6 py-6 sm:px-12 flex items-center justify-between border-b border-[#c7b7a3]/20 max-w-6xl mx-auto w-full relative z-10">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl sm:text-3xl tracking-tight font-medium text-[#E8d8c4]">
              Nosso Espaço
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#E8d8c4] border border-[#c7b7a3]/40 px-2 py-0.5 bg-[#6d2932]/60">
              A Dois
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => startDemoMode()}
              className="text-xs uppercase tracking-wider text-[#561c24] font-bold transition-all px-4 py-2 bg-[#E8d8c4] hover:bg-white border border-[#E8d8c4] shadow-xs"
            >
              Explorar Demonstração
            </button>
          </div>
        </header>

        {/* Hero Body (Inverted with High Impact) */}
        <div className="max-w-4xl mx-auto px-6 sm:px-12 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center relative z-10">
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#f4eae0] leading-[1.12] tracking-tight">
            Tudo o que é nosso, <br className="hidden sm:inline" />
            <span className="italic font-serif text-[#E8d8c4] underline decoration-[#c7b7a3]/40 underline-offset-8">
              em um só lugar.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#c7b7a3] mt-6 sm:mt-8 max-w-2xl mx-auto font-sans leading-relaxed">
            Sem feeds públicos, sem notificações vazias ou interferências externas. Um refúgio minimalista e sofisticado para planejar próximos momentos, organizar memórias e aprofundar o diálogo diário a dois.
          </p>

          {/* Prominent Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button
              type="button"
              onClick={openCreateFlow}
              className="w-full sm:w-auto px-9 py-4 bg-[#E8d8c4] text-[#561c24] font-bold tracking-wider text-xs uppercase hover:bg-white transition-all shadow-[0_10px_25px_rgba(0,0,0,0.25)] cursor-pointer"
            >
              Criar Nosso Espaço
            </button>
            <button
              type="button"
              onClick={openJoinFlow}
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-[#E8d8c4] border border-[#c7b7a3]/60 hover:border-white hover:text-white font-semibold tracking-wider text-xs uppercase transition-colors cursor-pointer"
            >
              Já tenho um código
            </button>
          </div>

          {/* Quick Assurance Strip (Without dividing border line) */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-[#c7b7a3]">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">✓</span> 100% Privado • Apenas Vocês Dois
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">✓</span> Sincronizado em Tempo Real
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">✓</span> Zero Anúncios & Sem Redes Sociais
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEGUNDA PARTE DA HOME: EXPLICAÇÃO DETALHADA DE TODAS AS FUNCIONALIDADES */}
      {/* ========================================================================= */}
      <main className="max-w-6xl mx-auto px-6 sm:px-12 py-16 sm:py-24 w-full flex-1 space-y-16">
        {/* Intro to Features */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] block mb-2 font-semibold">
            Arquitetura de Intimidade
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#561c24] font-normal tracking-tight">
            Como o Nosso Espaço funciona
          </h2>
          <p className="text-sm sm:text-base text-[#6d2932] mt-3 font-sans leading-relaxed">
            Cada módulo foi desenhado com base em rituais reais de convivência, para transformar pequenos instantes em lembranças duradouras.
          </p>
        </div>

        {/* BENTO GRID EXPLANATORY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Card 1: Pareamento Privado */}
          <div className="md:col-span-12 lg:col-span-6 bg-[#f4eae0] border border-[#c7b7a3] p-8 sm:p-10 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#561c24] font-normal leading-snug">
                Código exclusivo de 2 membros
              </h3>
              <p className="text-sm text-[#6d2932] mt-3 font-sans leading-relaxed">
                Um de vocês cria o espaço com um clique e recebe uma chave de acesso única e privada gerada na hora. O parceiro insere essa chave e ambos passam a compartilhar o mesmo espaço em tempo real.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#c7b7a3]/60 flex items-center justify-between text-xs">
              <span className="text-[#561c24] font-semibold">Sem terceiros, sem seguidores</span>
              <span className="font-mono text-[#6d2932]">Apenas vocês dois</span>
            </div>
          </div>

          {/* Card 2: Linha do Tempo & Shows */}
          <div className="md:col-span-12 lg:col-span-6 bg-[#f4eae0] border border-[#c7b7a3] p-8 sm:p-10 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#561c24] font-normal leading-snug">
                Shows, viagens e calendário de memórias
              </h3>
              <p className="text-sm text-[#6d2932] mt-3 font-sans leading-relaxed">
                Contagem regressiva precisa em dias, horas e minutos para festivais, viagens, peças de teatro e datas de aniversário. Inclui um <strong>mini calendário mensal interativo</strong> com setas para explorar datas futuras e recordar momentos já vividos.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#c7b7a3]/60 flex items-center justify-between text-xs">
              <span className="text-[#561c24] font-semibold">Contagem regressiva ao vivo</span>
              <span className="font-mono text-[#6d2932]">Datas futuras e passadas</span>
            </div>
          </div>

          {/* Card 3: Listas & Ranking Conjunto */}
          <div className="md:col-span-12 lg:col-span-7 bg-[#f4eae0] border border-[#c7b7a3] p-8 sm:p-10 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#561c24] font-normal leading-snug">
                Listas & Ranking com temáticas próprias
              </h3>
              <p className="text-sm text-[#6d2932] mt-3 font-sans leading-relaxed">
                Além de listas clássicas para <em>Filmes & Séries</em>, <em>Livros</em> e <em>Lugares</em>, vocês podem criar <strong>qualquer lista temática própria</strong> (ex: Vinhos & Drinks, Cafés Especiais, Jogos de Tabuleiro, Receitas). Cada parceiro dá sua nota de 1 a 5 estrelas e deixa seu comentário; o app calcula a média exata do casal e ordena por maiores e menores notas.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#c7b7a3]/60 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-mono font-bold text-[#561c24] text-sm">Votos Individuais</span>
                <span className="text-[#6d2932]">Notas & comentários de cada um</span>
              </div>
              <div>
                <span className="block font-mono font-bold text-[#561c24] text-sm">Temáticas Livres</span>
                <span className="text-[#6d2932]">Crie qualquer assunto que quiserem</span>
              </div>
            </div>
          </div>

          {/* Card 4: Cartas de Diálogo */}
          <div className="md:col-span-12 lg:col-span-5 bg-[#561c24] text-[#E8d8c4] border border-[#561c24] p-8 sm:p-10 flex flex-col justify-between shadow-md">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#E8d8c4] font-normal leading-snug">
                Baralho de cartas para conversas profundas
              </h3>
              <p className="text-sm text-[#c7b7a3] mt-3 font-sans leading-relaxed">
                Cartas táteis para reacender a curiosidade e o diálogo a dois. Toque para virar em 3D e revelar perguntas sobre Romance, Filosofia e Criatividade — ou cadastrem suas próprias perguntas secretas de casal.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#c7b7a3]/40 flex items-center justify-between text-xs text-[#E8d8c4]">
              <span>Toque para virar & botões ágeis</span>
              <span className="font-mono text-[#c7b7a3]">+50 reflexões</span>
            </div>
          </div>

          {/* Card 5: Métricas de Cumplicidade */}
          <div className="md:col-span-12 bg-[#eee2d4] border border-[#c7b7a3] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
            <div className="max-w-2xl">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#561c24] font-normal leading-snug">
                Mural de Memórias & Cumplicidade
              </h3>
              <p className="text-sm text-[#6d2932] mt-3 font-sans leading-relaxed">
                Uma visão panorâmica e afetuosa de todo o acervo do casal: dias consecutivos juntos no app, total de experiências registradas, nota média histórica, amostras do topo e da base do ranking, e métricas em tempo real de cada lista criada.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={openCreateFlow}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors text-center cursor-pointer shadow-xs"
              >
                Começar Agora
              </button>
              <button
                type="button"
                onClick={() => startDemoMode()}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#f4eae0] border border-[#c7b7a3] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:border-[#561c24] transition-colors text-center cursor-pointer"
              >
                Testar Modo Demo
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER: APENAS O BOTÃO DA WAVEM DESTACADO EM BORDÔ (SEM SLOGAN)          */}
      {/* ========================================================================= */}
      <footer className="py-8 px-6 max-w-6xl mx-auto w-full flex items-center justify-center">
        <a
          href="https://linktr.ee/thewavem"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#561c24] text-[#E8d8c4] hover:bg-[#6d2932] hover:text-white border-2 border-[#561c24] font-semibold text-xs uppercase tracking-widest transition-all shadow-md"
        >
          <span>Criado por Wavem</span>
          <span className="text-sm">↗</span>
        </a>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL / DRAWER DE ENTRADA & CADASTRO                                      */}
      {/* ========================================================================= */}
      <ModalDrawer
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authMode === 'create' ? (isRegister ? 'Criar Nosso Espaço' : 'Acessar Espaço') : 'Entrar com Código'}
        subtitle={
          authMode === 'create'
            ? 'Crie seu santuário compartilhado e convide sua pessoa especial.'
            : 'Digite o código de convite que seu parceiro(a) gerou.'
        }
      >
        <div className="space-y-5">
          {formError && (
            <div className="p-3 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
              {formError}
            </div>
          )}

          {/* Social Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loadingAction}
            className="w-full py-3 px-4 bg-[#f4eae0] border border-[#561c24] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:bg-[#E8d8c4] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continuar com Google</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#c7b7a3]" />
            <span className="text-[11px] uppercase tracking-wider text-[#6d2932]">ou com e-mail</span>
            <div className="flex-1 h-px bg-[#c7b7a3]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'join' && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                  Código de Convite do Espaço
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Código do seu parceiro(a)"
                  className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-center font-mono text-base font-bold tracking-widest outline-none"
                />
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como seu parceiro te chama"
                  className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loadingAction}
              className="w-full py-3 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors cursor-pointer"
            >
              {loadingAction
                ? 'Processando...'
                : authMode === 'create'
                ? isRegister
                  ? 'Criar Espaço Compartilhado'
                  : 'Entrar no Espaço'
                : 'Conectar com Código'}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-[#c7b7a3] text-xs text-[#6d2932]">
            {authMode === 'create' ? (
              <button
                type="button"
                onClick={() => setIsRegister((prev) => !prev)}
                className="underline hover:text-[#561c24] cursor-pointer"
              >
                {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode('create')}
                className="underline hover:text-[#561c24] cursor-pointer"
              >
                Criar um novo espaço
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setAuthModalOpen(false);
                startDemoMode(inviteCode.trim() || undefined);
              }}
              className="font-medium text-[#561c24] hover:underline cursor-pointer"
            >
              Testar em modo demo →
            </button>
          </div>
        </div>
      </ModalDrawer>
    </div>
  );
};
