import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { QuestionItem } from '../types';

interface QuestionCardProps {
  question: QuestionItem;
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrev: () => void;
  isCustomOnly?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onNext,
  onPrev,
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0.4, 0.9, 1, 0.9, 0.4]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    if (info.offset.x < -90) {
      setIsFlipped(false);
      onNext();
    } else if (info.offset.x > 90) {
      setIsFlipped(false);
      onPrev();
    }
  };

  const toggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Filosofia':
        return 'text-[#561c24] border-[#561c24]/30 bg-[#c7b7a3]/20';
      case 'Romance':
        return 'text-[#6d2932] border-[#6d2932]/30 bg-[#6d2932]/10';
      case 'Criatividade':
        return 'text-[#7a333d] border-[#7a333d]/30 bg-[#E8d8c4]';
      default:
        return 'text-[#561c24] border-[#561c24]/30 bg-[#eee2d4]';
    }
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[440px] sm:h-[480px] perspective-1000 select-none">
      {/* Background stacked cards for visual depth (deck effect) */}
      <div className="absolute inset-0 bg-[#dfcfbc] border border-[#c7b7a3] translate-y-3 scale-[0.94] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[#e4d6c6] border border-[#c7b7a3] translate-y-1.5 scale-[0.97] opacity-70 pointer-events-none" />

      {/* Main Interactive Draggable & Flippable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        className="w-full h-full cursor-grab active:cursor-grabbing relative"
        whileTap={{ scale: 0.99 }}
      >
        <div
          onClick={toggleFlip}
          className="w-full h-full relative transform-style-3d transition-transform duration-700 ease-out"
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT OF CARD (Cover) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-[#f4eae0] border-2 border-[#561c24] p-6 sm:p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(86,28,36,0.08)]">
            {/* Inner fine border for stationery look */}
            <div className="absolute inset-3 border border-[#c7b7a3] pointer-events-none" />

            {/* Header: Category & Counter */}
            <div className="relative z-10 flex items-center justify-between">
              <span
                className={`text-[11px] font-medium uppercase tracking-widest px-2.5 py-1 border ${getCategoryColor(
                  question.category
                )}`}
              >
                {question.category}
              </span>
              <span className="font-mono text-xs text-[#6d2932]">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
              </span>
            </div>

            {/* Center Emblem & Call to flip */}
            <div className="relative z-10 text-center my-auto py-6">
              <div className="w-12 h-12 mx-auto mb-4 border border-[#561c24]/40 flex items-center justify-center rotate-45">
                <span className="font-serif text-lg text-[#561c24] -rotate-45 font-medium">N</span>
              </div>
              <h4 className="font-serif text-2xl sm:text-3xl text-[#561c24] font-normal tracking-wide">
                Nosso Diálogo
              </h4>
              <p className="text-xs uppercase tracking-widest text-[#6d2932] mt-2 font-sans">
                {question.isCustom ? 'Pergunta do Casal' : 'Cartas de Intimidade'}
              </p>
              <div className="mt-8">
                <span className="inline-block text-xs text-[#561c24] border-b border-[#561c24] pb-0.5 tracking-wider font-medium">
                  Toque para revelar a pergunta
                </span>
              </div>
            </div>

            {/* Footer buttons - direct tap buttons */}
            <div className="relative z-10 flex items-center justify-between text-xs text-[#561c24]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="px-2.5 py-1 bg-[#E8d8c4] border border-[#c7b7a3] hover:border-[#561c24] font-medium transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">Toque para virar</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="px-2.5 py-1 bg-[#E8d8c4] border border-[#c7b7a3] hover:border-[#561c24] font-medium transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>

          {/* BACK OF CARD (Question Content) */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[#561c24] text-[#E8d8c4] border-2 border-[#561c24] p-6 sm:p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(86,28,36,0.15)]"
          >
            {/* Inner fine border */}
            <div className="absolute inset-3 border border-[#c7b7a3]/30 pointer-events-none" />

            {/* Back Header */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-widest px-2.5 py-1 border border-[#c7b7a3]/40 text-[#E8d8c4]">
                {question.category}
              </span>
              <span className="font-mono text-xs text-[#c7b7a3]">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
              </span>
            </div>

            {/* Main Question Text */}
            <div className="relative z-10 my-auto py-4">
              <p className="font-serif text-xl sm:text-2xl leading-relaxed text-[#E8d8c4] text-center font-normal px-2">
                "{question.text}"
              </p>
              <div className="w-8 h-px bg-[#c7b7a3]/40 mx-auto mt-6" />
              <p className="text-[11px] uppercase tracking-widest text-[#c7b7a3] text-center mt-3 font-sans">
                Ouçam-se com presença e sem pressa
              </p>
            </div>

            {/* Back Footer */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-[#c7b7a3]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  onPrev();
                }}
                className="hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                ← Anterior
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="text-[10px] uppercase tracking-wider text-[#c7b7a3]/80 hover:text-white"
              >
                Virar de volta
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  onNext();
                }}
                className="hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Próxima →
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
