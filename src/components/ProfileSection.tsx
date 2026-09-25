import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ModalDrawer } from './ModalDrawer';

export const ProfileSection: React.FC = () => {
  const {
    user,
    couple,
    updateProfileName,
    updateCoupleInfo,
    deleteCoupleSpace,
    deleteUserAccount,
    logout,
    isDemo,
    currentUserName,
  } = useAuth();

  const [newName, setNewName] = useState<string>(user?.displayName || currentUserName || '');
  const [newSpaceName, setNewSpaceName] = useState<string>(couple?.spaceName || '');
  const [isUpdatingName, setIsUpdatingName] = useState<boolean>(false);
  const [isUpdatingSpace, setIsUpdatingSpace] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals for critical actions
  const [deleteSpaceModalOpen, setDeleteSpaceModalOpen] = useState<boolean>(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  const WAVEM_RAW_PHONE = '5541995424186';
  const WAVEM_EMAIL = 'contato.thewavem@gmail.com';
  const WAVEM_LINKTREE = 'https://linktr.ee/thewavem';

  const handleCopyEmail = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(WAVEM_EMAIL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = WAVEM_EMAIL;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsUpdatingName(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateProfileName(newName.trim());
      setSuccessMsg('Nome atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg('Não foi possível atualizar o nome.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateSpaceName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !couple) return;
    setIsUpdatingSpace(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateCoupleInfo({ spaceName: newSpaceName.trim() });
      setSuccessMsg('Nome do espaço atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setErrorMsg('Não foi possível atualizar o nome do espaço.');
    } finally {
      setIsUpdatingSpace(false);
    }
  };

  const confirmDeleteSpace = async () => {
    setIsDeleting(true);
    try {
      await deleteCoupleSpace();
      setDeleteSpaceModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao excluir espaço.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      setDeleteAccountModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Falha ao excluir conta. Se fez login há muito tempo, saia e entre novamente.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-[#c7b7a3] pb-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] block mb-1">
          Configurações & Suporte
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal tracking-tight">
          Perfil & Nosso Espaço
        </h2>
        <p className="text-xs sm:text-sm text-[#6d2932] mt-1 font-sans">
          Gerencie suas informações de perfil, espaço compartilhado e canais diretos de suporte da Wavem.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#561c24] text-[#E8d8c4] text-xs font-medium tracking-wide">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#6d2932]/10 border border-[#6d2932] text-xs text-[#561c24]">
          {errorMsg}
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: User Profile */}
        <section className="bg-[#eee2d4] border border-[#c7b7a3] p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-xl text-[#561c24] font-medium">Seu Perfil</h3>
            <p className="text-xs text-[#6d2932] mt-1 mb-5">
              Como seu amor vê seu nome nas cartas, listas e avaliações.
            </p>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                  Seu Nome de Exibição
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                  E-mail da Conta
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || (isDemo ? 'josef@nossoespaco.app' : '—')}
                  className="w-full px-3.5 py-2.5 bg-[#dfcfbc] border border-[#c7b7a3] text-[#6d2932] text-xs outline-none cursor-not-allowed font-mono"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
                >
                  {isUpdatingName ? 'Salvando...' : 'Salvar Alteração de Nome'}
                </button>
                {isDemo && (
                  <button
                    type="button"
                    onClick={logout}
                    className="px-4 py-2 bg-[#dfcfbc] border border-[#561c24] text-[#561c24] text-xs font-bold uppercase tracking-wider hover:bg-[#561c24] hover:text-[#E8d8c4] transition-colors"
                  >
                    Sair do Modo Teste ✕
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Card 2: Space Details */}
        <section className="bg-[#eee2d4] border border-[#c7b7a3] p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-xl text-[#561c24] font-medium">Espaço Compartilhado</h3>
            <p className="text-xs text-[#6d2932] mt-1 mb-5">
              Personalize o título do espaço a dois e consulte o código de convite.
            </p>

            {couple ? (
              <form onSubmit={handleUpdateSpaceName} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                    Título do Espaço
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Ex: Josef & Fulana"
                    className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                    Código de Pareamento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value={couple.code}
                      className="w-full px-3.5 py-2.5 bg-[#dfcfbc] border border-[#c7b7a3] text-[#561c24] text-sm font-mono font-bold tracking-widest outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingSpace}
                    className="px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
                  >
                    {isUpdatingSpace ? 'Salvando...' : 'Salvar Título do Espaço'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-[#6d2932] italic">
                Você ainda não está conectado a um espaço compartilhado.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Card 3: Suporte Wavem (Highlighted) */}
      <section className="bg-[#f4eae0] border-2 border-[#561c24] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] font-semibold block mb-1">
              Atendimento Dedicado
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#561c24] font-normal">
              Suporte com a Wavem
            </h3>
            <p className="text-xs sm:text-sm text-[#6d2932] mt-2 font-sans leading-relaxed">
              Precisa de auxílio, deseja relatar um problema ou enviar uma sugestão de melhoria para o Nosso Espaço?
              Nossa equipe está pronta para ajudar você por mensagem.
            </p>

            {/* Mande um e-mail */}
            <div className="mt-5 pt-4 border-t border-[#c7b7a3]/70">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6d2932] font-semibold block mb-1.5">
                Mande um E-mail
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`mailto:${WAVEM_EMAIL}?subject=${encodeURIComponent('Suporte • Nosso Espaço')}`}
                  className="font-mono text-xs sm:text-sm font-semibold text-[#561c24] bg-[#E8d8c4] px-3.5 py-1.5 border border-[#c7b7a3] hover:border-[#561c24] transition-colors inline-flex items-center gap-2"
                >
                  <span>{WAVEM_EMAIL}</span>
                  <span className="text-xs text-[#6d2932]">✉</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-xs text-[#6d2932] hover:text-[#561c24] underline cursor-pointer px-1 py-1"
                >
                  {copiedEmail ? 'E-mail copiado!' : 'Copiar e-mail'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <a
              href={`https://wa.me/${WAVEM_RAW_PHONE}?text=${encodeURIComponent(
                'Olá Wavem! Estou usando o Nosso Espaço e gostaria de suporte.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider text-center hover:bg-[#6d2932] transition-colors"
            >
              Conversar no WhatsApp
            </a>

            <a
              href={`mailto:${WAVEM_EMAIL}?subject=${encodeURIComponent('Suporte • Nosso Espaço')}`}
              className="px-6 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] text-[#561c24] text-xs font-semibold uppercase tracking-wider text-center hover:border-[#561c24] transition-colors"
            >
              Enviar E-mail ✉
            </a>

            <a
              href={WAVEM_LINKTREE}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 text-center text-xs text-[#6d2932] hover:text-[#561c24] underline-offset-4 hover:underline"
            >
              Conhecer a Wavem (Linktree) ↗
            </a>
          </div>
        </div>
      </section>

      {/* Card 4: Zona de Gerenciamento / Exclusão (Danger Zone) */}
      <section className="bg-[#eee2d4] border border-[#c7b7a3] p-6">
        <h3 className="font-serif text-xl text-[#561c24] font-medium">Ações Críticas</h3>
        <p className="text-xs text-[#6d2932] mt-1 mb-5">
          Opções irreversíveis para desconectar do espaço atual ou encerrar sua conta.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {couple && (
            <button
              type="button"
              onClick={() => setDeleteSpaceModalOpen(true)}
              className="px-4 py-2.5 bg-[#f4eae0] border border-[#6d2932] text-[#6d2932] hover:bg-[#6d2932] hover:text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider transition-colors text-center"
            >
              Excluir / Sair do Espaço
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeleteAccountModalOpen(true)}
            className="px-4 py-2.5 bg-[#f4eae0] border border-[#561c24] text-[#561c24] hover:bg-[#561c24] hover:text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider transition-colors text-center"
          >
            Excluir Minha Conta
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] text-[#6d2932] hover:text-[#561c24] text-xs font-semibold uppercase tracking-wider transition-colors text-center sm:ml-auto"
          >
            Encerrar Sessão
          </button>
        </div>
      </section>

      {/* Modal: Confirm Delete Space */}
      <ModalDrawer
        isOpen={deleteSpaceModalOpen}
        onClose={() => setDeleteSpaceModalOpen(false)}
        title="Excluir Nosso Espaço"
        subtitle="Tem certeza de que deseja excluir o vínculo deste espaço?"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#561c24] leading-relaxed">
            Ao excluir o espaço, o código <strong>{couple?.code}</strong> deixará de ser válido e a
            conexão entre você e seu parceiro(a) será desfeita. Você poderá criar um novo espaço a qualquer momento.
          </p>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#c7b7a3]">
            <button
              type="button"
              onClick={() => setDeleteSpaceModalOpen(false)}
              className="px-4 py-2 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmDeleteSpace}
              className="px-5 py-2 bg-[#6d2932] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#561c24] transition-colors"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </ModalDrawer>

      {/* Modal: Confirm Delete Account */}
      <ModalDrawer
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        title="Excluir Conta Permanentemente"
        subtitle="Esta ação é irreversível."
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#561c24] leading-relaxed">
            Todos os seus dados de perfil, credenciais de login e participação no espaço serão
            removidos do sistema.
          </p>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#c7b7a3]">
            <button
              type="button"
              onClick={() => setDeleteAccountModalOpen(false)}
              className="px-4 py-2 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmDeleteAccount}
              className="px-5 py-2 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isDeleting ? 'Excluindo Conta...' : 'Excluir Minha Conta'}
            </button>
          </div>
        </div>
      </ModalDrawer>
    </div>
  );
};
