import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Couple } from '../types';
import { ModalDrawer } from './ModalDrawer';

export const SpaceSelection: React.FC = () => {
  const {
    user,
    spaces,
    selectSpace,
    createCoupleSpace,
    joinCoupleSpace,
    leaveOrDeleteSpace,
    logout,
    startDemoMode,
  } = useAuth();

  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null);
  const [spaceNameInput, setSpaceNameInput] = useState<string>('');
  const [codeInput, setCodeInput] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Deletion confirmation
  const [spaceToDelete, setSpaceToDelete] = useState<Couple | null>(null);

  const maxSlots = 3;
  const isFull = spaces.length >= maxSlots;

  const handleOpenCreate = () => {
    if (isFull) {
      setFeedbackError('Limite máximo de 3 espaços atingido. Exclua um espaço para criar outro.');
      return;
    }
    setSpaceNameInput('');
    setFeedbackError('');
    setModalMode('create');
  };

  const handleOpenJoin = () => {
    if (isFull) {
      setFeedbackError('Limite máximo de 3 espaços atingido. Exclua um espaço para entrar em outro.');
      return;
    }
    setCodeInput('');
    setFeedbackError('');
    setModalMode('join');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setFeedbackError('');
    try {
      await createCoupleSpace(spaceNameInput.trim() || undefined);
      setModalMode(null);
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao criar espaço.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setIsProcessing(true);
    setFeedbackError('');
    try {
      const ok = await joinCoupleSpace(codeInput.trim());
      if (!ok) {
        setFeedbackError('Código não encontrado. Peça para seu parceiro(a) confirmar o código.');
      } else {
        setModalMode(null);
      }
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao entrar com código.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteSpace = async () => {
    if (!spaceToDelete) return;
    setIsProcessing(true);
    try {
      await leaveOrDeleteSpace(spaceToDelete.id);
      setSpaceToDelete(null);
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao remover espaço.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to determine partner display name for an occupied slot
  const getPartnerLabel = (space: Couple) => {
    if (!user) return space.spaceName || 'Nosso Espaço';
    const isPartner1 = space.partner1Id === user.uid;
    const partnerName = isPartner1 ? space.partner2Name : space.partner1Name;
    if (partnerName) {
      return `Com ${partnerName}`;
    }
    return 'Aguardando Parceiro(a)';
  };

  return (
    <div className="min-h-screen bg-[#E8d8c4] text-[#561c24] flex flex-col justify-between selection:bg-[#561c24] selection:text-[#E8d8c4]">
      {/* Top Bar */}
      <header className="px-6 py-5 sm:px-12 border-b border-[#c7b7a3] flex items-center justify-between max-w-6xl mx-auto w-full">
        <div>
          <span className="font-serif text-2xl text-[#561c24] font-medium tracking-tight">
            Nosso Espaço
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#6d2932] block font-medium">
            Lobby de Santuários
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#6d2932] hidden sm:inline">
            Olá, <strong className="text-[#561c24]">{user?.displayName || 'Você'}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            className="text-xs uppercase tracking-widest text-[#561c24] hover:text-[#6d2932] transition-colors border border-[#c7b7a3] hover:border-[#561c24] px-3.5 py-1.5 font-medium cursor-pointer"
          >
            Sair da conta
          </button>
        </div>
      </header>

      {/* Main Slots Container */}
      <main className="max-w-6xl mx-auto px-6 sm:px-12 py-12 sm:py-16 w-full flex-1 flex flex-col justify-center">
        {/* Header Title Section with Typography Rule: uppercase tracking-widest font-medium */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[#6d2932] text-xs uppercase tracking-widest font-medium block mb-2">
            Save Slots • Limite de 3 Espaços
          </span>
          <h1 className="text-[#561c24] text-xl sm:text-2xl lg:text-3xl uppercase tracking-widest font-medium">
            Selecione seu Espaço
          </h1>
          <p className="text-xs sm:text-sm text-[#6d2932] mt-3 font-sans leading-relaxed">
            Cada slot representa um refúgio exclusivo compartilhado a dois. Escolha um espaço ativo para entrar ou inicie uma nova conexão.
          </p>

          {feedbackError && (
            <div className="mt-4 p-3 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
              {feedbackError}
            </div>
          )}
        </div>

        {/* 3 SLOTS GRID: Styled as minimalist cards resting on a table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {[0, 1, 2].map((index) => {
            const space = spaces[index];
            const slotNumber = String(index + 1).padStart(2, '0');

            if (space) {
              // OCCUPIED SLOT CARD
              return (
                <div
                  key={space.id}
                  className="bg-[#f4eae0] border-2 border-[#561c24] p-6 sm:p-7 flex flex-col justify-between shadow-[0_8px_24px_rgba(86,28,36,0.06)] relative group hover:shadow-[0_12px_32px_rgba(86,28,36,0.12)] transition-all"
                >
                  {/* Subtle inner paper line */}
                  <div className="absolute inset-2 border border-[#c7b7a3]/40 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-4 text-[#6d2932]">
                      <span className="uppercase tracking-widest font-medium text-[#561c24]">
                        Slot {slotNumber} • Ativo
                      </span>
                      <span className="bg-[#E8d8c4] px-2 py-0.5 border border-[#c7b7a3] font-bold text-[#561c24]">
                        {space.code}
                      </span>
                    </div>

                    <h2 className="text-[#561c24] text-lg sm:text-xl uppercase tracking-widest font-medium line-clamp-2 leading-snug">
                      {space.spaceName || 'Nosso Espaço'}
                    </h2>

                    <div className="mt-3 space-y-1 text-xs text-[#6d2932] font-sans">
                      <p className="font-medium text-[#561c24]">
                        {getPartnerLabel(space)}
                      </p>
                      <p className="text-[11px] font-mono text-[#c7b7a3]">
                        Criado em{' '}
                        {new Date(space.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 pt-5 border-t border-[#c7b7a3]/70 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => selectSpace(space.id)}
                      className="w-full py-3 bg-[#561c24] text-[#E8d8c4] hover:bg-[#6d2932] hover:text-white transition-colors text-xs uppercase tracking-widest font-medium cursor-pointer shadow-xs"
                    >
                      Entrar no Espaço
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpaceToDelete(space)}
                      className="w-full py-1.5 text-[11px] uppercase tracking-wider text-[#6d2932] hover:text-[#561c24] transition-colors font-medium underline-offset-4 hover:underline"
                    >
                      Liberar / Sair do Slot
                    </button>
                  </div>
                </div>
              );
            }

            // EMPTY SLOT CARD
            return (
              <div
                key={`empty-slot-${index}`}
                className="bg-[#f4eae0]/60 border-2 border-dashed border-[#c7b7a3] p-6 sm:p-7 flex flex-col justify-between hover:border-[#561c24]/60 transition-all text-center"
              >
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#c7b7a3] font-medium mb-3">
                    Slot {slotNumber} • Vazio
                  </div>

                  <h2 className="text-[#6d2932] text-base sm:text-lg uppercase tracking-widest font-medium mt-1">
                    Slot Disponível
                  </h2>
                  <p className="text-xs text-[#6d2932] mt-2 font-sans leading-relaxed">
                    Reserve este slot criando um novo espaço próprio ou entrando pelo código que seu amor gerou.
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-[#c7b7a3]/40 space-y-2.5">
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    disabled={isFull}
                    className="w-full py-3 bg-[#E8d8c4] text-[#561c24] hover:bg-white border border-[#c7b7a3] hover:border-[#561c24] transition-all text-xs uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
                  >
                    + Novo Espaço
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenJoin}
                    disabled={isFull}
                    className="w-full py-2.5 bg-transparent text-[#6d2932] hover:text-[#561c24] border border-[#c7b7a3]/60 hover:border-[#561c24] transition-colors text-[11px] uppercase tracking-widest font-medium cursor-pointer disabled:opacity-50"
                  >
                    + Entrar com Código
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slot capacity summary footer */}
        <div className="mt-12 pt-6 border-t border-[#c7b7a3]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6d2932]">
          <span className="font-mono">
            Slots ocupados: <strong className="text-[#561c24]">{spaces.length} de {maxSlots}</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => startDemoMode()}
              className="text-[#561c24] hover:underline font-medium text-xs uppercase tracking-wider"
            >
              Testar com Dados de Demonstração
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 max-w-6xl mx-auto w-full flex items-center justify-center">
        <a
          href="https://linktr.ee/thewavem"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#561c24] text-[#E8d8c4] hover:bg-[#6d2932] hover:text-white border-2 border-[#561c24] text-xs uppercase tracking-widest font-medium transition-all shadow-md"
        >
          <span>Criado por Wavem</span>
          <span className="text-sm">↗</span>
        </a>
      </footer>

      {/* Modal: Create Space */}
      <ModalDrawer
        isOpen={modalMode === 'create'}
        onClose={() => setModalMode(null)}
        title="Criar Novo Espaço"
        subtitle="Crie um novo refúgio compartilhado e convide sua pessoa especial com o código que será gerado."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {feedbackError && (
            <div className="p-3 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
              {feedbackError}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6d2932] font-medium mb-1">
              Nome do Espaço
            </label>
            <input
              type="text"
              required
              value={spaceNameInput}
              onChange={(e) => setSpaceNameInput(e.target.value)}
              placeholder="Ex: Espaço de Lucas & Ana"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-[#561c24] text-[#E8d8c4] hover:bg-[#6d2932] text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer"
          >
            {isProcessing ? 'Criando Espaço...' : 'Criar e Gerar Código'}
          </button>
        </form>
      </ModalDrawer>

      {/* Modal: Join with Code */}
      <ModalDrawer
        isOpen={modalMode === 'join'}
        onClose={() => setModalMode(null)}
        title="Entrar com Código"
        subtitle="Digite a chave privada de pareamento gerada pelo seu amor."
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          {feedbackError && (
            <div className="p-3 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
              {feedbackError}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6d2932] font-medium mb-1">
              Código de Convite
            </label>
            <input
              type="text"
              required
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Ex: NOSSO-412"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-center font-mono text-lg font-bold tracking-widest outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-[#561c24] text-[#E8d8c4] hover:bg-[#6d2932] text-xs uppercase tracking-widest font-medium transition-colors cursor-pointer"
          >
            {isProcessing ? 'Conectando ao Espaço...' : 'Parear Espaço'}
          </button>
        </form>
      </ModalDrawer>

      {/* Modal: Confirm Delete / Leave Space */}
      <ModalDrawer
        isOpen={!!spaceToDelete}
        onClose={() => setSpaceToDelete(null)}
        title="Liberar Slot"
        subtitle={`Tem certeza que deseja sair ou excluir "${spaceToDelete?.spaceName || 'este espaço'}"?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6d2932] leading-relaxed">
            Ao liberar este slot, ele ficará disponível para que você crie outro espaço ou entre em um novo convite. Se você for o único participante, o espaço será removido permanentemente.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSpaceToDelete(null)}
              className="flex-1 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] text-[#561c24] text-xs uppercase tracking-widest font-medium hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={confirmDeleteSpace}
              className="flex-1 py-2.5 bg-[#6d2932] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#561c24] transition-colors"
            >
              {isProcessing ? 'Liberando...' : 'Confirmar Saída'}
            </button>
          </div>
        </div>
      </ModalDrawer>
    </div>
  );
};
