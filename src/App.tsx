/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LandingPage } from "./components/LandingPage";
import { SpaceSelection } from "./components/SpaceSelection";
import { Navbar, NavTab } from "./components/Navbar";
import { CoupleHeader } from "./components/CoupleHeader";
import { EventsSection } from "./components/EventsSection";
import { MediaLibrary } from "./components/MediaLibrary";
import { QuestionsGame } from "./components/QuestionsGame";
import { MetricsSection } from "./components/MetricsSection";
import { ProfileSection } from "./components/ProfileSection";

function MainApp() {
  const { user, couple, loading, isDemo, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("events");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto border-2 border-[#561c24] border-t-transparent animate-spin" />
          <p className="font-serif text-lg tracking-wide">
            Abrindo Nosso Espaço...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in -> Landing Page
  if (!user && !couple) {
    return <LandingPage />;
  }

  // Signed in, but no active space selected -> Space Selection Screen (Lobby/Slots)
  if (user && !couple) {
    return <SpaceSelection />;
  }

  // Active Paired Couple Experience (Dashboard of Selected Space)
  return (
    <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex flex-col justify-between selection:bg-[#561c24] selection:text-[#E8d8c4]">
      {/* Explicit Demo Mode Exit Banner */}
      {isDemo && (
        <div className="bg-[#561c24] text-[#E8d8c4] border-b border-[#3f1218] px-4 py-2 text-xs flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-medium">
              Modo Teste Ativo (Dados de Demonstração)
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-2.5 py-0.5 bg-[#E8d8c4] text-[#561c24] font-semibold uppercase tracking-wider text-[10px] hover:bg-white transition-colors cursor-pointer"
          >
            Sair do Modo Teste ✕
          </button>
        </div>
      )}

      <div>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <CoupleHeader />

        <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12 pb-28 sm:pb-16 w-full">
          {activeTab === "events" && <EventsSection />}
          {activeTab === "library" && <MediaLibrary />}
          {activeTab === "questions" && <QuestionsGame />}
          {activeTab === "metrics" && (
            <MetricsSection
              onNavigateToTab={(tab) => {
                if (
                  tab === "events" ||
                  tab === "library" ||
                  tab === "questions" ||
                  tab === "metrics" ||
                  tab === "profile"
                ) {
                  setActiveTab(tab);
                }
              }}
            />
          )}
          {activeTab === "profile" && <ProfileSection />}
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
