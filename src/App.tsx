/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Navbar, NavTab } from './components/Navbar';
import { CoupleHeader } from './components/CoupleHeader';
import { EventsSection } from './components/EventsSection';
import { MediaLibrary } from './components/MediaLibrary';
import { QuestionsGame } from './components/QuestionsGame';
import { MetricsSection } from './components/MetricsSection';
import { ProfileSection } from './components/ProfileSection';

function MainApp() {
  const { user, couple, loading, createCoupleSpace, joinCoupleSpace, startDemoMode, logout } =
    useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('events');

  // Couple onboarding states if user signed in without couple
  const [spaceNameInput, setSpaceNameInput] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [onboardError, setOnboardError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto border-2 border-[#561c24] border-t-transparent animate-spin" />
          <p className="font-serif text-lg tracking-wide">Abrindo Nosso Espaço...</p>
        </div>
      </div>
    );
  }

  // Not signed in or no couple -> Landing Page
  if (!user && !couple) {
    return <LandingPage />;
  }

  // Signed in with Firebase Auth, but hasn't created or joined a space yet
  if (user && !couple) {
    const handleCreateSpace = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);
      setOnboardError('');
      try {
        await createCoupleSpace(spaceNameInput.trim() || undefined);
      } catch (err: unknown) {
        setOnboardError(err instanceof Error ? err.message : 'Erro ao criar espaço.');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleJoinCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!joinCodeInput.trim()) return;
      setIsProcessing(true);
      setOnboardError('');
      try {
        const ok = await joinCoupleSpace(joinCodeInput.trim());
        if (!ok) {
          setOnboardError('Código de convite não encontrado. Verifique com seu parceiro(a).');
        }
      } catch (err: unknown) {
        setOnboardError(err instanceof Error ? err.message : 'Erro ao entrar com código.');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex flex-col justify-center px-6 py-12">
        <div className="max-w-xl mx-auto w-full bg-[#f4eae0] border-2 border-[#561c24] p-8 sm:p-10 shadow-[0_10px_30px_rgba(86,28,36,0.08)]">
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932]">
              Passo Único de Pareamento
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal mt-1">
              Bem-vindo, {user.displayName}
            </h1>
            <p className="text-sm text-[#6d2932] mt-2 font-sans">
              Para começar, crie um novo espaço a dois ou conecte-se ao espaço já criado pelo seu amor.
            </p>
          </div>

          {onboardError && (
            <div className="p-3 mb-6 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
              {onboardError}
            </div>
          )}

          <div className="space-y-8">
            {/* Option 1: Create space */}
            <form onSubmit={handleCreateSpace} className="space-y-3 border-b border-[#c7b7a3] pb-6">
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold">
                Opção 1 • Criar Nosso Espaço
              </label>
              <input
                type="text"
                value={spaceNameInput}
                onChange={(e) => setSpaceNameInput(e.target.value)}
                placeholder="Ex: Espaço de Lucas & Ana"
                className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
              >
                {isProcessing ? 'Gerando Código...' : 'Criar Espaço e Gerar Código'}
              </button>
            </form>

            {/* Option 2: Join with existing code */}
            <form onSubmit={handleJoinCode} className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold">
                Opção 2 • Já possuo o código de convite
              </label>
              <input
                type="text"
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Código do seu parceiro(a)"
                className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-center font-mono text-lg font-bold tracking-widest outline-none"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-[#f4eae0] border border-[#561c24] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:bg-[#E8d8c4] transition-colors"
              >
                {isProcessing ? 'Conectando...' : 'Parear Espaço'}
              </button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => startDemoMode()}
                className="text-[#6d2932] underline hover:text-[#561c24] cursor-pointer"
              >
                Ou explore o modo demonstração
              </button>
              <span className="hidden sm:inline text-[#c7b7a3]">•</span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-[#6d2932] hover:text-[#561c24] hover:underline cursor-pointer"
              >
                Sair da conta ({user.email || user.displayName})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Paired Couple Experience
  return (
    <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex flex-col justify-between selection:bg-[#561c24] selection:text-[#E8d8c4]">
      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <CoupleHeader />

        <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12 pb-28 sm:pb-16 w-full">
          {activeTab === 'events' && <EventsSection />}
          {activeTab === 'library' && <MediaLibrary />}
          {activeTab === 'questions' && <QuestionsGame />}
          {activeTab === 'metrics' && (
            <MetricsSection onNavigateToTab={(t) => setActiveTab(t as NavTab)} />
          )}
          {activeTab === 'profile' && <ProfileSection />}
        </main>
      </div>

      {/* Footer with highlighted Wavem button */}
      <footer className="py-6 px-6 sm:px-8 max-w-6xl mx-auto w-full flex items-center justify-center pb-20 sm:pb-8">
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
