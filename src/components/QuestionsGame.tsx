import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { QuestionItem } from '../types';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { QuestionCard } from './QuestionCard';
import { ModalDrawer } from './ModalDrawer';
import { AllQuestionsView } from './AllQuestionsView';

export const QuestionsGame: React.FC = () => {
  const { couple, user, isDemo, currentUserId } = useAuth();
  const [customQuestions, setCustomQuestions] = useState<QuestionItem[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>(['Intimidade', 'Futuro']);
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [onlyCustom, setOnlyCustom] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'game' | 'all'>('game');

  // Modals in game view
  const [isManagerOpen, setIsManagerOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  // Form for new custom question
  const [newText, setNewText] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Romance');
  const [customCatInput, setCustomCatInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!couple) return;

    // Load custom categories if stored
    const savedCats = localStorage.getItem(`nosso_custom_categories_${couple.id}`);
    if (savedCats) {
      try {
        setCustomCategories(JSON.parse(savedCats));
      } catch {
        // ignore
      }
    }

    if (isDemo) {
      const local = localStorage.getItem(`nosso_custom_questions_${couple.id}`);
      if (local) {
        try {
          setCustomQuestions(JSON.parse(local));
        } catch {
          setCustomQuestions([]);
        }
      } else {
        const demoCustom: QuestionItem[] = [
          {
            id: 'cust-demo-1',
            coupleId: couple.id,
            text: 'Se pudéssemos repetir qualquer viagem nossa, qual seria e o que faríamos diferente?',
            category: 'Romance',
            isCustom: true,
            createdBy: 'user-demo-1',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'cust-demo-2',
            coupleId: couple.id,
            text: 'Qual hábito meu você secretamente acha mais engraçado ou fofo?',
            category: 'Intimidade',
            isCustom: true,
            createdBy: 'user-demo-2',
            createdAt: new Date().toISOString(),
          },
        ];
        setCustomQuestions(demoCustom);
        localStorage.setItem(`nosso_custom_questions_${couple.id}`, JSON.stringify(demoCustom));
      }
      return;
    }

    const q = query(collection(db, 'questions'), where('coupleId', '==', couple.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: QuestionItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<QuestionItem, 'id'>) });
        });
        setCustomQuestions(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'questions');
      }
    );

    return () => unsubscribe();
  }, [couple, isDemo]);

  // Merge default + custom questions
  const allQuestions = [...DEFAULT_QUESTIONS, ...customQuestions];

  // Record card read in localStorage for metrics
  const recordCardRead = (cardId: string) => {
    if (!couple) return;
    try {
      const key = `nosso_read_cards_${couple.id}`;
      const raw = localStorage.getItem(key);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(cardId);
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  };

  // Filter based on "onlyCustom" and category
  const filteredQuestions = allQuestions.filter((q) => {
    if (onlyCustom && !q.isCustom) return false;
    if (activeCategory === 'Todas') return true;
    if (activeCategory === 'Personalizadas') return q.isCustom;
    return q.category === activeCategory;
  });

  // Clamp current index
  useEffect(() => {
    if (currentIndex >= filteredQuestions.length) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions.length, currentIndex]);

  // When active card changes, record it
  useEffect(() => {
    const currentQ = filteredQuestions[currentIndex];
    if (currentQ) {
      recordCardRead(currentQ.id);
    }
  }, [currentIndex, filteredQuestions]);

  const handleNext = () => {
    if (filteredQuestions.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredQuestions.length);
  };

  const handlePrev = () => {
    if (filteredQuestions.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredQuestions.length) % filteredQuestions.length);
  };

  // Keyboard shortcut listener for desktop (ArrowRight, ArrowLeft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'all') return;
      if (isManagerOpen || isCategoryModalOpen) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredQuestions.length, isManagerOpen, isCategoryModalOpen, viewMode]);

  const handleAddCustomCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || customCategories.includes(trimmed)) return;
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    if (couple) {
      localStorage.setItem(`nosso_custom_categories_${couple.id}`, JSON.stringify(updated));
    }
  };

  const handleSaveQuestion = async (q: QuestionItem) => {
    if (!couple) return;

    if (isDemo) {
      const existsIndex = customQuestions.findIndex((item) => item.id === q.id);
      let updated: QuestionItem[];
      if (existsIndex >= 0) {
        updated = customQuestions.map((item) => (item.id === q.id ? q : item));
      } else {
        updated = [q, ...customQuestions];
      }
      setCustomQuestions(updated);
      localStorage.setItem(`nosso_custom_questions_${couple.id}`, JSON.stringify(updated));
      return;
    }

    const isNew =
      !q.id ||
      q.id.startsWith('q-cust-') ||
      q.id.startsWith('rom-') ||
      q.id.startsWith('fil-') ||
      q.id.startsWith('cri-') ||
      q.id.startsWith('int-') ||
      q.id.startsWith('fut-');

    try {
      if (!isNew) {
        await updateDoc(doc(db, 'questions', q.id), sanitizeFirestorePayload({
          text: q.text,
          category: q.category,
        }));
      } else {
        await addDoc(collection(db, 'questions'), sanitizeFirestorePayload({
          coupleId: couple.id,
          text: q.text,
          category: q.category,
          isCustom: true,
          createdBy: auth.currentUser?.uid || user?.uid || currentUserId || 'user-1',
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'questions');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (isDemo && couple) {
      const updated = customQuestions.filter((q) => q.id !== id);
      setCustomQuestions(updated);
      localStorage.setItem(`nosso_custom_questions_${couple.id}`, JSON.stringify(updated));
      return;
    }

    try {
      if (id.startsWith('rom-') || id.startsWith('fil-') || id.startsWith('cri-') || id.startsWith('int-') || id.startsWith('fut-')) {
        // Hide standard question locally for couple
        const hiddenKey = `nosso_hidden_questions_${couple?.id}`;
        const raw = localStorage.getItem(hiddenKey);
        const list = raw ? JSON.parse(raw) : [];
        list.push(id);
        localStorage.setItem(hiddenKey, JSON.stringify(list));
      } else {
        await deleteDoc(doc(db, 'questions', id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `questions/${id}`);
    }
  };

  const handleAddCustomQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !newText.trim()) return;
    setIsSaving(true);

    const categoryFinal =
      newCategory === 'Outro' && customCatInput.trim() ? customCatInput.trim() : newCategory;

    if (newCategory === 'Outro' && customCatInput.trim()) {
      handleAddCustomCategory(customCatInput.trim());
    }

    const payload: QuestionItem = {
      id: `q-cust-${Date.now()}`,
      coupleId: couple.id,
      text: newText.trim(),
      category: categoryFinal,
      isCustom: true,
      createdBy: currentUserId || user?.uid || 'user-1',
      createdAt: new Date().toISOString(),
    };

    try {
      await handleSaveQuestion(payload);
      setNewText('');
      setCustomCatInput('');
      setIsManagerOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Distinct category pills for game view
  const categoriesList = Array.from(
    new Set(['Todas', 'Romance', 'Filosofia', 'Criatividade', 'Intimidade', 'Futuro', ...customCategories])
  );

  // If in "all questions" view mode
  if (viewMode === 'all') {
    return (
      <AllQuestionsView
        questions={allQuestions}
        customCategories={customCategories}
        onBackToGame={() => setViewMode('game')}
        onSaveQuestion={handleSaveQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        onAddCategory={handleAddCustomCategory}
      />
    );
  }

  const activeQuestion = filteredQuestions[currentIndex];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#c7b7a3] pb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] block mb-1">
            Baralho de Conexão & Diálogo
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal tracking-tight">
            Jogo de Cartas do Casal
          </h2>
          <p className="text-xs sm:text-sm text-[#6d2932] mt-1 font-sans">
            Toque para virar a carta em 3D e navegue pelas cartas com os botões ou setas do teclado.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* View All Questions Button */}
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className="px-4 py-2 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
          >
            Ver Todas as Perguntas ({allQuestions.length})
          </button>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-[#f4eae0] border border-[#c7b7a3] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:border-[#561c24] transition-colors"
          >
            + Categoria
          </button>

          {/* Custom Questions Toggle */}
          <button
            type="button"
            onClick={() => setOnlyCustom((prev) => !prev)}
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
              onlyCustom
                ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
            }`}
          >
            {onlyCustom ? '✓ Só Personalizadas' : 'Todas'}
          </button>

          <button
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="px-3.5 py-2 bg-[#f4eae0] border border-[#561c24] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:bg-[#E8d8c4] transition-colors"
          >
            + Nova Pergunta
          </button>
        </div>
      </div>

      {/* Category Pills */}
      {!onlyCustom && (
        <div className="flex flex-wrap items-center gap-2 py-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                  : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Card Display Area */}
      <div className="py-6">
        {filteredQuestions.length === 0 ? (
          <div className="bg-[#f4eae0] border border-[#c7b7a3] p-12 text-center max-w-md mx-auto">
            <p className="font-serif text-xl text-[#561c24]">Nenhuma pergunta nesta seleção.</p>
            <p className="text-xs text-[#6d2932] mt-2 font-sans">
              Cadastre sua primeira pergunta personalizada para jogar apenas com o conteúdo de vocês!
            </p>
            <button
              type="button"
              onClick={() => setIsManagerOpen(true)}
              className="mt-6 px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              Adicionar Pergunta
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {activeQuestion && (
              <QuestionCard
                key={activeQuestion.id}
                question={activeQuestion}
                currentIndex={currentIndex}
                totalQuestions={filteredQuestions.length}
                onNext={handleNext}
                onPrev={handlePrev}
                isCustomOnly={onlyCustom}
              />
            )}

            {/* Desktop Controls & Keyboard hint */}
            <div className="flex items-center justify-between w-full max-w-sm sm:max-w-md mt-6 px-2">
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 bg-[#f4eae0] border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#561c24] hover:border-[#561c24] transition-colors"
              >
                ← Anterior
              </button>

              <span className="hidden sm:inline-block text-[11px] text-[#6d2932] font-mono">
                Use as setas ← → do teclado
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-[#561c24] border border-[#561c24] text-xs font-semibold uppercase tracking-wider text-[#E8d8c4] hover:bg-[#6d2932] transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Drawer for Custom Questions Manager */}
      <ModalDrawer
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        title="Nova Pergunta do Casal"
        subtitle="Crie perguntas íntimas, reflexivas ou secretas de vocês."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddCustomQuestionForm} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Texto da Pergunta
            </label>
            <textarea
              rows={3}
              required
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ex: O que você mais gostaria que nós realizássemos juntos no próximo ano?"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                Categoria
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-xs outline-none"
              >
                {categoriesList
                  .filter((c) => c !== 'Todas')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                <option value="Outro">+ Criar Outra Categoria...</option>
              </select>
            </div>

            {newCategory === 'Outro' && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={customCatInput}
                  onChange={(e) => setCustomCatInput(e.target.value)}
                  placeholder="Ex: Segredos"
                  className="w-full px-3.5 py-2 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-xs outline-none"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsManagerOpen(false)}
              className="px-4 py-2 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isSaving ? 'Salvando...' : '+ Salvar Pergunta'}
            </button>
          </div>
        </form>
      </ModalDrawer>

      {/* Modal: Add New Category */}
      <ModalDrawer
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Adicionar Nova Categoria"
        subtitle="Crie um novo tema para categorizar perguntas do casal."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCatName.trim()) return;
            handleAddCustomCategory(newCatName.trim());
            setActiveCategory(newCatName.trim());
            setNewCatName('');
            setIsCategoryModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ex: Segredos, Lembranças, Futuro"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </ModalDrawer>
    </div>
  );
};
