import React from 'react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'events' | 'library' | 'questions' | 'metrics' | 'profile';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, currentUserName, isDemo, clearActiveSpace } = useAuth();

  const navItems: { id: NavTab; label: string; mobileLabel: string }[] = [
    { id: 'events', label: 'Timeline & Shows', mobileLabel: 'Eventos' },
    { id: 'library', label: 'Listas & Ranking', mobileLabel: 'Listas' },
    { id: 'questions', label: 'Cartas de Diálogo', mobileLabel: 'Cartas' },
    { id: 'metrics', label: 'Métricas', mobileLabel: 'Métricas' },
    { id: 'profile', label: 'Perfil & Suporte', mobileLabel: 'Perfil' },
  ];

  return (
    <>
      {/* DEMO MODE EXPLICIT TOP BANNER */}
      {isDemo && (
        <div className="bg-[#561c24] text-[#E8d8c4] border-b border-[#3f1218] px-4 py-2 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">
              Você está no <strong>Modo Teste</strong> (Josef & Fulana)
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1 bg-[#E8d8c4] hover:bg-white text-[#561c24] text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Sair do Modo Teste ✕
          </button>
        </div>
      )}

      {/* DESKTOP TOP NAVIGATION */}
      <nav className="hidden sm:block bg-[#f4eae0] border-b border-[#c7b7a3]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className="text-left group cursor-pointer"
            >
              <span className="font-serif text-2xl font-normal text-[#561c24] tracking-tight group-hover:text-[#6d2932] transition-colors">
                Nosso Espaço
              </span>
            </button>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                      isActive
                        ? 'border-[#561c24] text-[#561c24]'
                        : 'border-transparent text-[#6d2932] hover:text-[#561c24] hover:border-[#c7b7a3]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User profile & Actions */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={clearActiveSpace}
              className="bg-[#561c24] hover:bg-[#6d2932] text-[#E8d8c4] hover:text-white text-xs uppercase tracking-widest font-medium px-3.5 py-1.5 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-[#561c24]"
              title="Trocar de espaço (Lobby de slots)"
            >
              <span>⇄</span>
              <span>Trocar Espaço</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="text-xs text-[#6d2932] hover:text-[#561c24] font-sans text-left"
            >
              Olá, <strong className="text-[#561c24] font-medium underline underline-offset-2">{currentUserName}</strong>
              {isDemo && <span className="ml-1 text-[10px] text-[#6d2932]">(Demo)</span>}
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-[#6d2932] hover:text-[#561c24] underline-offset-4 hover:underline font-medium cursor-pointer"
            >
              {isDemo ? 'Sair do Teste' : 'Sair da conta'}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE TOP BAR (Minimal Header with explicit switch space and exit test button) */}
      <div className="sm:hidden bg-[#f4eae0] border-b border-[#c7b7a3] px-3.5 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className="font-serif text-lg text-[#561c24] font-medium tracking-tight"
        >
          Nosso Espaço
        </button>

        <div className="flex items-center gap-2">
          {/* Mobile Bordô Button for Trocar Espaço */}
          <button
            type="button"
            onClick={clearActiveSpace}
            className="bg-[#561c24] hover:bg-[#6d2932] text-[#E8d8c4] hover:text-white text-[11px] uppercase tracking-wider font-medium px-2.5 py-1 shadow-xs transition-colors cursor-pointer border border-[#561c24]"
            title="Trocar de espaço"
          >
            ⇄ Espaços
          </button>

          {isDemo ? (
            <button
              type="button"
              onClick={logout}
              className="px-2 py-1 bg-[#561c24] text-[#E8d8c4] text-[10px] font-bold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              Sair do Teste ✕
            </button>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="text-xs text-[#6d2932] hover:text-[#561c24] underline underline-offset-2 font-medium"
            >
              Sair da conta
            </button>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Bottom Nav Bar - 5 items) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#f4eae0] border-t-2 border-[#561c24] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-14">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center transition-colors px-1 ${
                  isActive ? 'bg-[#E8d8c4] text-[#561c24]' : 'text-[#6d2932] hover:text-[#561c24]'
                }`}
              >
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold text-center leading-tight truncate w-full ${
                    isActive ? 'font-bold underline underline-offset-2' : ''
                  }`}
                >
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
