import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const ModalDrawer: React.FC<ModalDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  // ESC keyboard shortcut to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop: Solid tinted overlay, no blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3f1218]/50"
          />

          {/* Modal Content - Centered, solid and stable on mobile and desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative z-10 w-full ${maxWidth} bg-[#f4eae0] border-2 border-[#561c24] max-h-[88vh] flex flex-col shadow-[0_20px_40px_rgba(86,28,36,0.18)] my-auto`}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#c7b7a3] flex items-start justify-between gap-4 bg-[#f4eae0]">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#561c24]">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-[#6d2932] mt-0.5 font-sans">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#6d2932] hover:text-[#561c24] text-xl font-mono leading-none p-1.5 hover:bg-[#E8d8c4] transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto font-sans">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
