import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ModalDrawer } from './ModalDrawer';

export const LandingPage: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    joinCoupleSpace,
    startDemoMode,
    clearActiveSpace,
  } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'create' | 'join' | 'login'>('create');
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [forgotSuccess, setForgotSuccess] = useState<string>('');

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  const openLoginFlow = () => {
    clearActiveSpace();
    setAuthMode('login');
    setIsRegister(false);
    setIsForgotPassword(false);
    setForgotSuccess('');
    setFormError('');
    setAuthModalOpen(true);
  };

  const openCreateFlow = () => {
    clearActiveSpace();
    setAuthMode('create');
    setIsRegister(true);
    setIsForgotPassword(false);
    setForgotSuccess('');
    setFormError('');
    setAuthModalOpen(true);
  };

  const openJoinFlow = () => {
    clearActiveSpace();
    setAuthMode('join');
    setIsForgotPassword(false);
    setForgotSuccess('');
    setFormError('');
    setAuthModalOpen(true);
  };

  const handleGoogleAuth = async () => {
    setLoadingAction(true);
    setFormError('');
    try {
      clearActiveSpace();
      await loginWithGoogle();
      setAuthModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar com Google';
      if (msg.includes('popup-closed') || msg.includes('cancelled-popup-request')) {
        setFormError('Janela de login fechada antes da conclusão.');
      } else if (msg.includes('network-request-failed')) {
        setFormError('Falha de conexão com os servidores do Google.');
      } else if (msg.includes('unauthorized-domain')) {
        setFormError('Domínio não autorizado no Firebase Console. Verifique os domínios autorizados na aba Authentication.');
      } else {
        setFormError(msg);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setForgotSuccess('');
    setLoadingAction(true);
    try {
      await resetPassword(email);
      setForgotSuccess('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir senha';
      if (msg.includes('user-not-found')) {
        setFormError('Nenhuma conta encontrada com este e-mail.');
      } else if (msg.includes('invalid-email')) {
        setFormError('Por favor, informe um e-mail válido.');
      } else {
        setFormError(msg);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoadingAction(true);

    try {
      if (authMode === 'login') {
        if (!email.trim() || !password.trim()) {
          setFormError('Por favor, informe seu e-mail e senha.');
          setLoadingAction(false);
          return;
        }
        clearActiveSpace();
        await loginWithEmail(email, password);
        setAuthModalOpen(false);
        return;
      }

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
      } else if (msg.includes('weak-password')) {
        setFormError('A senha deve ter pelo menos 6 caracteres.');
      } else if (msg.includes('invalid-email')) {
        setFormError('Por favor, informe um e-mail válido.');
      } else if (msg.includes('network-request-failed')) {
        setFormError('Falha de conexão. Verifique sua internet.');
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

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={openLoginFlow}
              className="text-xs uppercase tracking-widest text-[#E8d8c4] hover:text-white font-medium transition-colors px-3 py-1.5 sm:px-4 sm:py-2 border border-[#c7b7a3]/50 hover:border-white cursor-pointer"
            >
              Entrar no meu espaço
            </button>
            <button
              type="button"
              onClick={() => startDemoMode(undefined, true)}
              className="text-xs uppercase tracking-wider text-[#561c24] font-bold transition-all px-3 py-1.5 sm:px-4 sm:py-2 bg-[#E8d8c4] hover:bg-white border border-[#E8d8c4] shadow-xs cursor-pointer"
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
              onClick={openLoginFlow}
              className="w-full sm:w-auto px-9 py-4 bg-[#E8d8c4] text-[#561c24] font-medium tracking-widest text-xs uppercase hover:bg-white transition-all shadow-[0_10px_25px_rgba(0,0,0,0.25)] cursor-pointer"
            >
              Entrar no meu espaço
            </button>
            <button
              type="button"
              onClick={openCreateFlow}
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-[#E8d8c4] border border-[#c7b7a3]/60 hover:border-white hover:text-white font-medium tracking-widest text-xs uppercase transition-colors cursor-pointer"
            >
              Criar Novo Espaço
            </button>
            <button
              type="button"
              onClick={openJoinFlow}
              className="w-full sm:w-auto px-7 py-4 bg-transparent text-[#c7b7a3] hover:text-white font-medium tracking-widest text-xs uppercase transition-colors cursor-pointer"
            >
              Já tenho um código
            </button>
          </div>

          {/* Quick Assurance Strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-[#c7b7a3]">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">✓</span> 100% Privado • Apenas Vocês Dois
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">✓</span> Até 3 Espaços Compartilhados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400">✓</span> Sincronizado em Tempo Real
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEGUNDA PARTE DA HOME: EXPLICAÇÃO DETALHADA DE TODAS AS FUNCIONALIDADES */}
      {/* ========================================================================= */}
      <main className="max-w-6xl mx-auto px-6 sm:px-12 py-16 sm:py-24 w-full flex-1 space-y-16">
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

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1 */}
          <div className="bg-[#f4eae0] border border-[#c7b7a3] p-8 space-y-4 hover:border-[#561c24] transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6d2932] border border-[#c7b7a3] px-2 py-0.5">
              01 • Conexão por Slots
            </span>
            <h3 className="font-serif text-2xl text-[#561c24]">
              Lobby com até 3 Espaços Simultâneos
            </h3>
            <p className="text-xs sm:text-sm text-[#6d2932] leading-relaxed">
              Alterne com facilidade entre diferentes santuários de memórias ou relacionamentos com total privacidade e isolamento de dados.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#f4eae0] border border-[#c7b7a3] p-8 space-y-4 hover:border-[#561c24] transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6d2932] border border-[#c7b7a3] px-2 py-0.5">
              02 • Linha do Tempo & Shows
            </span>
            <h3 className="font-serif text-2xl text-[#561c24]">
              Contagem Regressiva e Calendário
            </h3>
            <p className="text-xs sm:text-sm text-[#6d2932] leading-relaxed">
              Registre passagens, shows, festivais e datas importantes. Tenha um relógio de contagem regressiva sempre à vista.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#f4eae0] border border-[#c7b7a3] p-8 space-y-4 hover:border-[#561c24] transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6d2932] border border-[#c7b7a3] px-2 py-0.5">
              03 • Acervo Bilateral
            </span>
            <h3 className="font-serif text-2xl text-[#561c24]">
              Filmes, Séries, Livros & Lugares
            </h3>
            <p className="text-xs sm:text-sm text-[#6d2932] leading-relaxed">
              Avalie de 1 a 5 estrelas e adicione comentários mútuos para nunca mais perder a lista de restaurantes ou produções que assistiram.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#f4eae0] border border-[#c7b7a3] p-8 space-y-4 hover:border-[#561c24] transition-colors">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6d2932] border border-[#c7b7a3] px-2 py-0.5">
              04 • Cartas de Diálogo
            </span>
            <h3 className="font-serif text-2xl text-[#561c24]">
              Perguntas Reflexivas a Dois
            </h3>
            <p className="text-xs sm:text-sm text-[#6d2932] leading-relaxed">
              Mais de 50 cartas para puxar assuntos profundos em noites tranquilas, além de permitir adicionar as próprias perguntas do casal.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
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
        title={
          isForgotPassword
            ? 'Recuperar Senha'
            : authMode === 'login'
            ? 'Entrar no Meu Espaço'
            : authMode === 'create'
            ? isRegister
              ? 'Criar Nosso Espaço'
              : 'Acessar Espaço'
            : 'Entrar com Código'
        }
        subtitle={
          isForgotPassword
            ? 'Informe seu e-mail para receber as instruções de recuperação.'
            : authMode === 'login'
            ? 'Faça login para visualizar seus slots de santuário e acessar suas memórias a dois.'
            : authMode === 'create'
            ? isRegister
              ? 'Crie seu santuário compartilhado e convide sua pessoa especial.'
              : 'Acesse o espaço já compartilhado com seu parceiro(a).'
            : 'Digite o código de convite que seu parceiro(a) gerou.'
        }
      >
        <div className="space-y-5">
          {formError && (
            <div className="p-3 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
              {formError}
            </div>
          )}

          {forgotSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-600 text-xs text-emerald-900 font-medium">
              {forgotSuccess}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                  E-mail Cadastrado
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

              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-3 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors cursor-pointer shadow-xs"
              >
                {loadingAction ? 'Enviando...' : 'Enviar Link de Redefinição'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setFormError('');
                    setForgotSuccess('');
                  }}
                  className="text-xs text-[#6d2932] underline hover:text-[#561c24] cursor-pointer"
                >
                  ← Voltar para o Login
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Social Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loadingAction}
                className="w-full py-3 px-4 bg-[#f4eae0] border border-[#561c24] text-[#561c24] text-xs uppercase tracking-widest font-medium hover:bg-[#E8d8c4] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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

                {(authMode === 'login' || (!isRegister && authMode === 'create')) && (
                  <div className="text-right -mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setFormError('');
                        setForgotSuccess('');
                      }}
                      className="text-[11px] text-[#6d2932] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full py-3 bg-[#561c24] text-[#E8d8c4] text-xs uppercase tracking-widest font-medium hover:bg-[#6d2932] transition-colors cursor-pointer shadow-xs"
                >
                  {loadingAction
                    ? 'Processando...'
                    : authMode === 'login'
                    ? 'Acessar Meus Slots de Espaço'
                    : authMode === 'create'
                    ? isRegister
                      ? 'Criar Espaço Compartilhado'
                      : 'Entrar no Espaço'
                    : 'Conectar com Código'}
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#c7b7a3] text-xs text-[#6d2932]">
                {authMode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('create');
                      setIsRegister(true);
                    }}
                    className="underline hover:text-[#561c24] cursor-pointer"
                  >
                    Primeira vez aqui? Criar conta
                  </button>
                ) : authMode === 'create' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setIsRegister(false);
                    }}
                    className="underline hover:text-[#561c24] cursor-pointer"
                  >
                    Já tem conta? Entrar no meu espaço
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setIsRegister(false);
                    }}
                    className="underline hover:text-[#561c24] cursor-pointer"
                  >
                    Já tem conta? Entrar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    startDemoMode(undefined, true);
                  }}
                  className="font-medium text-[#561c24] hover:underline cursor-pointer"
                >
                  Explorar slots em demonstração →
                </button>
              </div>
            </>
          )}
        </div>
      </ModalDrawer>
    </div>
  );
};
