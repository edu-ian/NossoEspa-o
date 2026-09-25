import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const CoupleHeader: React.FC = () => {
  const { couple, user, isDemo, demoPartnerView, toggleDemoPartner, currentUserName } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);

  if (!couple) return null;

  const partnerName =
    couple.partner1Id === user?.uid
      ? couple.partner2Name
      : couple.partner1Name;

  const hasPartner = !!(couple.partner2Id && couple.partner2Name);

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(couple.code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = couple.code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#f4eae0] border-b border-[#c7b7a3] px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Couple Identification */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#561c24] flex items-center justify-center font-serif text-lg font-medium text-[#561c24] bg-[#E8d8c4]">
            &
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#561c24] font-normal leading-tight">
              {couple.spaceName || 'Nosso Espaço'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#6d2932]" />
              <span className="text-xs text-[#6d2932] font-sans">
                {hasPartner
                  ? `Conectados: ${couple.partner1Name} & ${couple.partner2Name}`
                  : `Aguardando parceiro(a) entrar com o código`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Code & Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Couple Code Box */}
          <div className="flex items-center gap-2 bg-[#E8d8c4] border border-[#c7b7a3] px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-semibold">
              Código:
            </span>
            <span className="font-mono text-xs font-bold text-[#561c24] tracking-wider">
              {couple.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs text-[#6d2932] hover:text-[#561c24] underline ml-1 cursor-pointer font-medium"
              title="Copiar código"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          {/* Demo Mode switcher */}
          {isDemo && (
            <div className="flex items-center gap-2 bg-[#dfcfbc] border border-[#c7b7a3] px-2.5 py-1 text-xs">
              <span className="text-[11px] text-[#561c24]">
                Visão de: <strong>{currentUserName}</strong>
              </span>
              <button
                type="button"
                onClick={toggleDemoPartner}
                className="text-[10px] uppercase tracking-wider bg-[#561c24] text-[#E8d8c4] px-2 py-0.5 hover:bg-[#6d2932] transition-colors"
              >
                Alternar Parceiro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
