import React, { useState } from 'react';
import { QuestionItem } from '../types';
import { ModalDrawer } from './ModalDrawer';

interface AllQuestionsViewProps {
  questions: QuestionItem[];
  customCategories: string[];
  onBackToGame: () => void;
  onSaveQuestion: (question: QuestionItem) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onAddCategory: (newCategory: string) => void;
}

export const AllQuestionsView: React.FC<AllQuestionsViewProps> = ({
  questions,
  customCategories,
  onBackToGame,
  onSaveQuestion,
  onDeleteQuestion,
  onAddCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('Romance');
  const [isEditingOpen, setIsEditingOpen] = useState<boolean>(false);

  // New category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // New question modal
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState<boolean>(false);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newQuestionCategory, setNewQuestionCategory] = useState<string>('Romance');

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // All distinct categories
  const allCategories = Array.from(
    new Set([
      'Todas',
      'Romance',
      'Filosofia',
      'Criatividade',
      'Intimidade',
      'Futuro',
      ...customCategories,
      ...questions.map((q) => q.category),
    ])
  );

  // Filtered questions
  const filtered = questions.filter((q) => {
    const matchesCategory =
      selectedCategory === 'Todas' || q.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenEdit = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditText(q.text);
    setEditCategory(q.category);
    setIsEditingOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editText.trim()) return;
    setIsSaving(true);
    try {
      const updated: QuestionItem = {
        ...editingQuestion,
        text: editText.trim(),
        category: editCategory.trim(),
      };
      await onSaveQuestion(updated);
      setIsEditingOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setIsSaving(true);
    try {
      const newQ: QuestionItem = {
        id: `q-cust-${Date.now()}`,
        text: newQuestionText.trim(),
        category: newQuestionCategory.trim(),
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      await onSaveQuestion(newQ);
      setNewQuestionText('');
      setIsNewQuestionOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setSelectedCategory(trimmed);
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-[#c7b7a3] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToGame}
            className="text-xs font-mono uppercase tracking-wider text-[#6d2932] hover:text-[#561c24] underline mb-2 block"
          >
            ← Voltar ao Baralho Interativo
          </button>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal tracking-tight">
            Todas as Perguntas ({filtered.length})
          </h2>
          <p className="text-xs sm:text-sm text-[#6d2932] mt-1 font-sans">
            Consulte todo o acervo de cartas, edite textos, remova perguntas indesejadas e adicione novas categorias.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-[#f4eae0] border border-[#561c24] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:bg-[#E8d8c4] transition-colors"
          >
            + Nova Categoria
          </button>

          <button
            type="button"
            onClick={() => setIsNewQuestionOpen(true)}
            className="px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
          >
            + Nova Pergunta
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar pergunta por palavra-chave..."
            className="w-full px-4 py-2.5 bg-[#f4eae0] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                  : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Grid / List */}
      {filtered.length === 0 ? (
        <div className="bg-[#f4eae0] border border-[#c7b7a3] p-12 text-center">
          <p className="font-serif text-xl text-[#561c24]">Nenhuma pergunta encontrada.</p>
          <p className="text-xs text-[#6d2932] mt-2 font-sans">
            Tente outra busca ou adicione uma nova pergunta para esta categoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-[#eee2d4] border border-[#c7b7a3] p-5 flex flex-col justify-between hover:border-[#6d2932] transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-[#6d2932] bg-[#E8d8c4] px-2 py-0.5 border border-[#c7b7a3]/60">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#6d2932]">
                    {item.isCustom ? 'Do Casal' : 'Oficial'}
                  </span>
                </div>

                <p className="font-serif text-lg sm:text-xl text-[#561c24] leading-relaxed mt-2">
                  "{item.text}"
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#c7b7a3]/70 flex items-center justify-between">
                <span className="text-[11px] text-[#6d2932] font-mono">
                  Carta #{idx + 1}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="text-xs font-medium text-[#561c24] hover:text-[#6d2932] underline-offset-4 hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Tem certeza de que deseja excluir esta pergunta?')) {
                        onDeleteQuestion(item.id);
                      }
                    }}
                    className="text-xs text-[#6d2932] hover:text-[#561c24] underline-offset-4 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Edit Question */}
      <ModalDrawer
        isOpen={isEditingOpen}
        onClose={() => setIsEditingOpen(false)}
        title="Editar Carta de Pergunta"
        subtitle="Altere o texto ou categoria desta carta de conversa."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Texto da Pergunta
            </label>
            <textarea
              rows={4}
              required
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Categoria
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            >
              {allCategories
                .filter((c) => c !== 'Todas')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditingOpen(false)}
              className="px-4 py-2 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alteração'}
            </button>
          </div>
        </form>
      </ModalDrawer>

      {/* Modal: Add New Question */}
      <ModalDrawer
        isOpen={isNewQuestionOpen}
        onClose={() => setIsNewQuestionOpen(false)}
        title="Nova Carta de Pergunta"
        subtitle="Adicione uma pergunta ao acervo para enriquecer o baralho do casal."
      >
        <form onSubmit={handleCreateNewQuestion} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Texto da Pergunta
            </label>
            <textarea
              rows={4}
              required
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Ex: O que você mais valoriza em mim nos dias difíceis?"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Categoria
            </label>
            <select
              value={newQuestionCategory}
              onChange={(e) => setNewQuestionCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            >
              {allCategories
                .filter((c) => c !== 'Todas')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewQuestionOpen(false)}
              className="px-4 py-2 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Adicionar Pergunta'}
            </button>
          </div>
        </form>
      </ModalDrawer>

      {/* Modal: Add New Category */}
      <ModalDrawer
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Adicionar Categoria de Pergunta"
        subtitle="Crie um novo tema para agrupar as cartas do casal."
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Segredos, Planos Malucos, Viagens"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
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
              Criar Categoria
            </button>
          </div>
        </form>
      </ModalDrawer>
    </div>
  );
};
