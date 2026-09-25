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
import { db, handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MediaItem, MediaType, MediaStatus, PriorityLevel, UserRating, CustomListTheme } from '../types';
import { ModalDrawer } from './ModalDrawer';

type BuiltInTab = 'movies' | 'books' | 'places';
type SubTab = 'wishlist' | 'completed';

const INITIAL_DEMO_MEDIA: MediaItem[] = [
  // Filmes
  {
    id: 'med-1',
    coupleId: 'couple-demo-1',
    type: 'movie',
    status: 'watched',
    title: 'Interestelar (Christopher Nolan)',
    authorOrDirector: 'Christopher Nolan',
    ratings: {
      'user-demo-1': {
        userId: 'user-demo-1',
        userName: 'Josef',
        score: 5,
        comment: 'Uma obra-prima absoluta sobre amor e tempo.',
        updatedAt: '2025-02-10T12:00:00.000Z',
      },
      'user-demo-2': {
        userId: 'user-demo-2',
        userName: 'Fulana',
        score: 5,
        comment: 'Chorei na cena das mensagens. Trilha sonora perfeita.',
        updatedAt: '2025-02-10T12:30:00.000Z',
      },
    },
    averageScore: 5.0,
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-2',
    coupleId: 'couple-demo-1',
    type: 'movie',
    status: 'to_watch',
    title: 'Vidas Passadas (Past Lives)',
    authorOrDirector: 'Celine Song',
    priority: 'high',
    createdBy: 'user-demo-2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-3',
    coupleId: 'couple-demo-1',
    type: 'series',
    status: 'watched',
    title: 'Normal People',
    authorOrDirector: 'Lenny Abrahamson',
    ratings: {
      'user-demo-1': {
        userId: 'user-demo-1',
        userName: 'Josef',
        score: 4,
        comment: 'Atuações viscerais, retrato muito honesto.',
        updatedAt: '2025-01-20T12:00:00.000Z',
      },
      'user-demo-2': {
        userId: 'user-demo-2',
        userName: 'Fulana',
        score: 5,
        comment: 'Minha série favorita da vida toda.',
        updatedAt: '2025-01-20T12:00:00.000Z',
      },
    },
    averageScore: 4.5,
    createdBy: 'user-demo-2',
    createdAt: new Date().toISOString(),
  },

  // Livros
  {
    id: 'med-4',
    coupleId: 'couple-demo-1',
    type: 'book',
    status: 'to_read',
    title: 'Cem Anos de Solidão',
    authorOrDirector: 'Gabriel García Márquez',
    priority: 'high',
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-5',
    coupleId: 'couple-demo-1',
    type: 'book',
    status: 'read',
    title: 'A Insustentável Leveza do Ser',
    authorOrDirector: 'Milan Kundera',
    ratings: {
      'user-demo-1': {
        userId: 'user-demo-1',
        userName: 'Josef',
        score: 5,
        comment: 'Filosofia e afeto costurados de forma primorosa.',
        updatedAt: '2025-01-15T00:00:00.000Z',
      },
      'user-demo-2': {
        userId: 'user-demo-2',
        userName: 'Fulana',
        score: 4,
        comment: 'Muito reflexivo, Tomás e Teresa são inesquecíveis.',
        updatedAt: '2025-01-16T00:00:00.000Z',
      },
    },
    averageScore: 4.5,
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },

  // Lugares
  {
    id: 'med-6',
    coupleId: 'couple-demo-1',
    type: 'place_wish',
    status: 'to_visit',
    title: 'Restaurante Terraço Itália',
    location: 'República, São Paulo',
    priority: 'high',
    createdBy: 'user-demo-2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'med-7',
    coupleId: 'couple-demo-1',
    type: 'place_visited',
    status: 'visited',
    title: 'Café Martinelli no Mirante',
    location: 'Centro Histórico, São Paulo',
    ratings: {
      'user-demo-1': {
        userId: 'user-demo-1',
        userName: 'Josef',
        score: 5,
        comment: 'Vista espetacular no pôr do sol, café com canela muito bom.',
        updatedAt: '2025-02-01T15:00:00.000Z',
      },
      'user-demo-2': {
        userId: 'user-demo-2',
        userName: 'Fulana',
        score: 5,
        comment: 'Nosso encontro mais charmoso desse ano!',
        updatedAt: '2025-02-01T15:30:00.000Z',
      },
    },
    averageScore: 5.0,
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },

  // Exemplo de Lista Personalizada Demo
  {
    id: 'med-8',
    coupleId: 'couple-demo-1',
    type: 'custom',
    status: 'completed',
    title: 'Vinho Catena Zapata Malbec 2019',
    customThemeId: 'theme-vinhos',
    customThemeName: 'Vinhos & Drinks',
    location: 'Jantar de Aniversário',
    ratings: {
      'user-demo-1': {
        userId: 'user-demo-1',
        userName: 'Josef',
        score: 5,
        comment: 'Encorpado e macio, harmonizou perfeitamente com a massa.',
        updatedAt: '2025-02-14T20:00:00.000Z',
      },
      'user-demo-2': {
        userId: 'user-demo-2',
        userName: 'Fulana',
        score: 4,
        comment: 'Muito aromático, excelente escolha!',
        updatedAt: '2025-02-14T20:30:00.000Z',
      },
    },
    averageScore: 4.5,
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_DEMO_THEMES: CustomListTheme[] = [
  {
    id: 'theme-vinhos',
    coupleId: 'couple-demo-1',
    name: 'Vinhos & Drinks',
    pendingLabel: 'Para Degustar',
    completedLabel: 'Degustados (Ranking)',
    createdAt: new Date().toISOString(),
  },
];

export const MediaLibrary: React.FC = () => {
  const { couple, user, isDemo, currentUserId, currentUserName } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomListTheme[]>([]);
  
  // Current active list/tab (built-in 'movies' | 'books' | 'places' or customThemeId)
  const [activeTabKey, setActiveTabKey] = useState<string>('movies');
  const [subTab, setSubTab] = useState<SubTab>('wishlist');
  const [sortRankingMode, setSortRankingMode] = useState<'highest' | 'lowest' | 'recent'>('highest');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [addThemeModalOpen, setAddThemeModalOpen] = useState<boolean>(false);
  const [ratingModalOpen, setRatingModalOpen] = useState<boolean>(false);
  const [selectedItemForRating, setSelectedItemForRating] = useState<MediaItem | null>(null);

  // Form: Add item
  const [title, setTitle] = useState<string>('');
  const [mediaKind, setMediaKind] = useState<'movie' | 'series' | 'book' | 'place' | 'custom'>('movie');
  const [authorOrDirector, setAuthorOrDirector] = useState<string>('');
  const [locationStr, setLocationStr] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form: Add custom theme
  const [newThemeName, setNewThemeName] = useState<string>('');
  const [newThemePendingLabel, setNewThemePendingLabel] = useState<string>('Queremos Conhecer');
  const [newThemeCompletedLabel, setNewThemeCompletedLabel] = useState<string>('Já Experimentamos (Ranking)');

  // Form: Rate item
  const [score, setScore] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    if (!couple) return;

    if (isDemo) {
      const localMedia = localStorage.getItem(`nosso_media_${couple.id}`);
      if (localMedia) {
        try {
          setMediaItems(JSON.parse(localMedia));
        } catch {
          setMediaItems(INITIAL_DEMO_MEDIA);
        }
      } else {
        setMediaItems(INITIAL_DEMO_MEDIA);
        localStorage.setItem(`nosso_media_${couple.id}`, JSON.stringify(INITIAL_DEMO_MEDIA));
      }

      const localThemes = localStorage.getItem(`nosso_custom_themes_${couple.id}`);
      if (localThemes) {
        try {
          setCustomThemes(JSON.parse(localThemes));
        } catch {
          setCustomThemes(INITIAL_DEMO_THEMES);
        }
      } else {
        setCustomThemes(INITIAL_DEMO_THEMES);
        localStorage.setItem(`nosso_custom_themes_${couple.id}`, JSON.stringify(INITIAL_DEMO_THEMES));
      }
      return;
    }

    // Live media items listener
    const qMedia = query(collection(db, 'media_items'), where('coupleId', '==', couple.id));
    const unsubMedia = onSnapshot(
      qMedia,
      (snapshot) => {
        const items: MediaItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<MediaItem, 'id'>) });
        });
        setMediaItems(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'media_items');
      }
    );

    // Live custom themes listener
    const qThemes = query(collection(db, 'custom_lists'), where('coupleId', '==', couple.id));
    const unsubThemes = onSnapshot(
      qThemes,
      (snapshot) => {
        const themes: CustomListTheme[] = [];
        snapshot.forEach((docSnap) => {
          themes.push({ id: docSnap.id, ...(docSnap.data() as Omit<CustomListTheme, 'id'>) });
        });
        setCustomThemes(themes);
      },
      (error) => {
        console.warn('Error fetching custom lists:', error);
      }
    );

    return () => {
      unsubMedia();
      unsubThemes();
    };
  }, [couple, isDemo]);

  const saveUpdatedItems = (updated: MediaItem[]) => {
    setMediaItems(updated);
    if (isDemo && couple) {
      localStorage.setItem(`nosso_media_${couple.id}`, JSON.stringify(updated));
    }
  };

  const saveUpdatedThemes = (updated: CustomListTheme[]) => {
    setCustomThemes(updated);
    if (isDemo && couple) {
      localStorage.setItem(`nosso_custom_themes_${couple.id}`, JSON.stringify(updated));
    }
  };

  const handleAddCustomTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !newThemeName.trim()) return;
    setIsSaving(true);

    const themePayload: Omit<CustomListTheme, 'id'> = {
      coupleId: couple.id,
      name: newThemeName.trim(),
      pendingLabel: newThemePendingLabel.trim() || 'Queremos Experimentar',
      completedLabel: newThemeCompletedLabel.trim() || 'Já Experimentamos (Ranking)',
      createdAt: new Date().toISOString(),
    };

    if (isDemo) {
      const createdTheme: CustomListTheme = {
        id: `theme-${Date.now()}`,
        ...themePayload,
      };
      const updated = [...customThemes, createdTheme];
      saveUpdatedThemes(updated);
      setActiveTabKey(createdTheme.id);
      setIsSaving(false);
      setAddThemeModalOpen(false);
      setNewThemeName('');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'custom_lists'), sanitizeFirestorePayload(themePayload));
      setActiveTabKey(docRef.id);
      setAddThemeModalOpen(false);
      setNewThemeName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'custom_lists');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta lista temática?')) return;

    if (isDemo) {
      const updated = customThemes.filter((t) => t.id !== themeId);
      saveUpdatedThemes(updated);
      setActiveTabKey('movies');
      return;
    }

    try {
      await deleteDoc(doc(db, 'custom_lists', themeId));
      setActiveTabKey('movies');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `custom_lists/${themeId}`);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !title.trim()) return;
    setIsSaving(true);

    let type: MediaType = 'movie';
    let status: MediaStatus = 'to_watch';
    let customThemeId: string | undefined = undefined;
    let customThemeName: string | undefined = undefined;

    if (activeTabKey === 'movies') {
      type = mediaKind === 'series' ? 'series' : 'movie';
      status = 'to_watch';
    } else if (activeTabKey === 'books') {
      type = 'book';
      status = 'to_read';
    } else if (activeTabKey === 'places') {
      type = 'place_wish';
      status = 'to_visit';
    } else {
      // Custom theme
      const themeObj = customThemes.find((t) => t.id === activeTabKey);
      type = 'custom';
      status = 'pending';
      customThemeId = activeTabKey;
      customThemeName = themeObj?.name || 'Lista Personalizada';
    }

    const newItemPayload = sanitizeFirestorePayload({
      coupleId: couple.id,
      type,
      status,
      title: title.trim(),
      customThemeId,
      customThemeName,
      authorOrDirector: authorOrDirector.trim() || undefined,
      location: locationStr.trim() || undefined,
      priority,
      ratings: {},
      createdBy: currentUserId || user?.uid || 'user-1',
      createdAt: new Date().toISOString(),
    });

    if (isDemo) {
      const createdItem: MediaItem = {
        id: `med-${Date.now()}`,
        ...newItemPayload,
      };
      saveUpdatedItems([createdItem, ...mediaItems]);
      setIsSaving(false);
      setAddModalOpen(false);
      setTitle('');
      setAuthorOrDirector('');
      setLocationStr('');
      return;
    }

    try {
      await addDoc(collection(db, 'media_items'), newItemPayload);
      setAddModalOpen(false);
      setTitle('');
      setAuthorOrDirector('');
      setLocationStr('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'media_items');
    } finally {
      setIsSaving(false);
    }
  };

  const openRatingModal = (item: MediaItem) => {
    setSelectedItemForRating(item);
    const existingRating = item.ratings?.[currentUserId];
    if (existingRating) {
      setScore(existingRating.score);
      setComment(existingRating.comment || '');
    } else {
      setScore(5);
      setComment('');
    }
    setRatingModalOpen(true);
  };

  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRating || !couple) return;

    const existingRatings = selectedItemForRating.ratings || {};
    const newRating = sanitizeFirestorePayload({
      userId: currentUserId,
      userName: currentUserName,
      score,
      comment: comment.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });

    const updatedRatings = {
      ...existingRatings,
      [currentUserId]: newRating,
    };

    // Calculate new average
    const scores = Object.values(updatedRatings).map((r: any) => r.score);
    const averageScore = Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1));

    // Determine target completed status
    let newStatus = selectedItemForRating.status;
    let newType = selectedItemForRating.type;

    if (selectedItemForRating.status === 'to_watch') {
      newStatus = 'watched';
    } else if (selectedItemForRating.status === 'to_read') {
      newStatus = 'read';
    } else if (selectedItemForRating.status === 'to_visit') {
      newStatus = 'visited';
      newType = 'place_visited';
    } else if (selectedItemForRating.status === 'pending') {
      newStatus = 'completed';
    }

    const updatedPayload = sanitizeFirestorePayload({
      status: newStatus,
      type: newType,
      ratings: updatedRatings,
      averageScore,
    });

    if (isDemo) {
      const updated = mediaItems.map((item) =>
        item.id === selectedItemForRating.id ? { ...item, ...updatedPayload } : item
      );
      saveUpdatedItems(updated);
      setRatingModalOpen(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'media_items', selectedItemForRating.id), updatedPayload);
      setRatingModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `media_items/${selectedItemForRating.id}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Deseja remover este item da lista?')) return;

    if (isDemo) {
      const updated = mediaItems.filter((i) => i.id !== id);
      saveUpdatedItems(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'media_items', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `media_items/${id}`);
    }
  };

  // Resolve current active theme object if custom
  const currentCustomTheme = customThemes.find((t) => t.id === activeTabKey);

  // Filter items by active tab and status
  const currentCategoryItems = mediaItems.filter((item) => {
    if (activeTabKey === 'movies') {
      return (
        (item.type === 'movie' || item.type === 'series') &&
        (subTab === 'wishlist' ? item.status === 'to_watch' : item.status === 'watched')
      );
    }
    if (activeTabKey === 'books') {
      return (
        item.type === 'book' &&
        (subTab === 'wishlist' ? item.status === 'to_read' : item.status === 'read')
      );
    }
    if (activeTabKey === 'places') {
      return subTab === 'wishlist' ? item.status === 'to_visit' : item.status === 'visited';
    }
    // Custom list theme
    return (
      item.customThemeId === activeTabKey &&
      (subTab === 'wishlist' ? item.status === 'pending' : item.status === 'completed')
    );
  });

  // Sort completed items by highest, lowest or date
  const sortedItems = [...currentCategoryItems].sort((a, b) => {
    if (subTab === 'completed') {
      if (sortRankingMode === 'highest') {
        const scoreA = a.averageScore || 0;
        const scoreB = b.averageScore || 0;
        return scoreB - scoreA;
      }
      if (sortRankingMode === 'lowest') {
        const scoreA = a.averageScore || 0;
        const scoreB = b.averageScore || 0;
        return scoreA - scoreB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (subTab === 'wishlist') {
      const priorityOrder: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
      const pA = priorityOrder[a.priority || 'medium'];
      const pB = priorityOrder[b.priority || 'medium'];
      return pB - pA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getSubTabLabels = () => {
    if (activeTabKey === 'movies') {
      return { wishlist: 'Para Assistir', completed: 'Assistidos (Ranking)' };
    }
    if (activeTabKey === 'books') {
      return { wishlist: 'Queremos Ler', completed: 'Lidos (Ranking)' };
    }
    if (activeTabKey === 'places') {
      return { wishlist: 'Lugares para Ir', completed: 'Lugares que Já Fomos (Ranking)' };
    }
    if (currentCustomTheme) {
      return {
        wishlist: currentCustomTheme.pendingLabel || 'Para Conhecer',
        completed: currentCustomTheme.completedLabel || 'Avaliações (Ranking)',
      };
    }
    return { wishlist: 'Lista de Desejos', completed: 'Concluídos (Ranking)' };
  };

  const subTabLabels = getSubTabLabels();

  const renderStars = (scoreVal: number) => {
    return (
      <div className="flex items-center text-[#561c24] text-sm">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= scoreVal ? 'text-[#561c24]' : 'text-[#c7b7a3] opacity-40'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header of Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#c7b7a3] pb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] block mb-1">
            Listas & Ranking do Casal
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal tracking-tight">
            Listas & Ranking Conjunto
          </h2>
          <p className="text-xs sm:text-sm text-[#6d2932] mt-1 font-sans">
            Crie listas de qualquer temática. Cada um avalia individualmente e o sistema calcula a nota média do casal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setAddThemeModalOpen(true)}
            className="px-4 py-2.5 bg-[#f4eae0] border border-[#561c24] text-[#561c24] text-xs font-semibold uppercase tracking-wider hover:bg-[#E8d8c4] transition-colors"
          >
            + Nova Lista Temática
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTabKey === 'movies') setMediaKind('movie');
              else if (activeTabKey === 'books') setMediaKind('book');
              else if (activeTabKey === 'places') setMediaKind('place');
              else setMediaKind('custom');
              setAddModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
          >
            + Adicionar Item
          </button>
        </div>
      </div>

      {/* Main Tabs (Filmes & Séries | Livros | Lugares | + Listas Temáticas Personalizadas) */}
      <div className="flex flex-wrap border-b border-[#c7b7a3] gap-1.5 sm:gap-2 pb-3 items-center">
        <button
          type="button"
          onClick={() => setActiveTabKey('movies')}
          className={`px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border ${
            activeTabKey === 'movies'
              ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
              : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
          }`}
        >
          Filmes & Séries
        </button>
        <button
          type="button"
          onClick={() => setActiveTabKey('books')}
          className={`px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border ${
            activeTabKey === 'books'
              ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
              : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
          }`}
        >
          Livros
        </button>
        <button
          type="button"
          onClick={() => setActiveTabKey('places')}
          className={`px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border ${
            activeTabKey === 'places'
              ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
              : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
          }`}
        >
          Lugares & Encontros
        </button>

        {/* Custom Lists Themes */}
        {customThemes.map((theme) => (
          <div key={theme.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTabKey(theme.id)}
              className={`px-3.5 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                activeTabKey === theme.id
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                  : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
              }`}
            >
              {theme.name}
            </button>
            {activeTabKey === theme.id && (
              <button
                type="button"
                onClick={() => handleDeleteTheme(theme.id)}
                title="Excluir esta lista temática"
                className="text-[10px] text-[#6d2932]/70 hover:text-[#561c24] p-1.5 ml-0.5 border border-l-0 border-[#561c24] bg-[#561c24] text-[#E8d8c4]"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Sub Tabs (Para Assistir / Assistidos) + Sort Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('wishlist')}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border ${
              subTab === 'wishlist'
                ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
            }`}
          >
            {subTabLabels.wishlist}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('completed')}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border ${
              subTab === 'completed'
                ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
            }`}
          >
            {subTabLabels.completed}
          </button>
        </div>

        {/* Sort Filter for ranking */}
        {subTab === 'completed' && (
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-[#6d2932] uppercase tracking-wider text-[11px] font-semibold mr-1">
              Ordenar por:
            </span>
            <button
              type="button"
              onClick={() => setSortRankingMode('highest')}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                sortRankingMode === 'highest'
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24] font-medium'
                  : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
              }`}
            >
              ★ Maiores Notas
            </button>
            <button
              type="button"
              onClick={() => setSortRankingMode('lowest')}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                sortRankingMode === 'lowest'
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24] font-medium'
                  : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
              }`}
            >
              ▼ Piores Notas
            </button>
            <button
              type="button"
              onClick={() => setSortRankingMode('recent')}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                sortRankingMode === 'recent'
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24] font-medium'
                  : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
              }`}
            >
              Mais Recentes
            </button>
          </div>
        )}
      </div>

      {/* Media Items List / Cards */}
      {sortedItems.length === 0 ? (
        <div className="bg-[#f4eae0] border border-[#c7b7a3] p-12 text-center">
          <p className="font-serif text-xl text-[#561c24]">
            {subTab === 'wishlist'
              ? 'Nenhum item nesta lista de desejos.'
              : 'Nenhum item avaliado ainda.'}
          </p>
          <p className="text-xs text-[#6d2932] mt-2 font-sans">
            {subTab === 'wishlist'
              ? 'Adicione títulos, lugares ou experiências para decidirem juntos o próximo programa.'
              : 'Quando concluírem uma experiência desta lista, cliquem em avaliar para compor o ranking do casal!'}
          </p>
          {subTab === 'wishlist' && (
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-6 px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              Adicionar Primeiro Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedItems.map((item) => {
            const hasMyRating = item.ratings && item.ratings[currentUserId];
            const partnerRatingList = Object.values(item.ratings || {});

            return (
              <div
                key={item.id}
                className="bg-[#eee2d4] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between hover:border-[#6d2932] transition-colors group relative"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-[#6d2932] bg-[#E8d8c4] px-2 py-0.5 border border-[#c7b7a3]/60">
                        {item.customThemeName
                          ? item.customThemeName
                          : item.type === 'movie'
                          ? 'Filme'
                          : item.type === 'series'
                          ? 'Série'
                          : item.type === 'book'
                          ? 'Livro'
                          : 'Lugar'}
                      </span>

                      {item.priority && subTab === 'wishlist' && (
                        <span className="text-[10px] uppercase tracking-wider text-[#561c24] font-medium">
                          Prioridade:{' '}
                          {item.priority === 'high'
                            ? 'Alta'
                            : item.priority === 'medium'
                            ? 'Média'
                            : 'Baixa'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-xs text-[#6d2932]/60 hover:text-[#561c24] underline-offset-4 hover:underline"
                    >
                      Remover
                    </button>
                  </div>

                  {/* Title & Author/Location */}
                  <h3 className="font-serif text-xl sm:text-2xl text-[#561c24] font-normal leading-snug">
                    {item.title}
                  </h3>

                  {(item.authorOrDirector || item.location) && (
                    <p className="text-xs sm:text-sm text-[#6d2932] mt-1 font-sans">
                      {item.authorOrDirector || item.location}
                    </p>
                  )}

                  {/* If in Completed mode: Show Average score & Individual scores */}
                  {subTab === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-[#c7b7a3]/80 space-y-3">
                      {/* Couple Average Banner */}
                      <div className="flex items-center justify-between bg-[#E8d8c4] p-3 border border-[#c7b7a3]">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold block">
                            Nota Média do Casal
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-2xl font-bold text-[#561c24]">
                              {item.averageScore ? item.averageScore.toFixed(1) : '-'}
                            </span>
                            {item.averageScore && renderStars(Math.round(item.averageScore))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openRatingModal(item)}
                          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-[#561c24] text-[#E8d8c4] hover:bg-[#6d2932] transition-colors"
                        >
                          {hasMyRating ? 'Editar Minha Nota' : 'Dar Minha Nota'}
                        </button>
                      </div>

                      {/* Individual Reviews */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] uppercase tracking-wider text-[#6d2932] font-semibold block">
                          Avaliações Individuais:
                        </span>
                        {partnerRatingList.length === 0 ? (
                          <p className="text-xs italic text-[#6d2932]">Nenhuma nota atribuída ainda.</p>
                        ) : (
                          partnerRatingList.map((r) => (
                            <div
                              key={r.userId}
                              className="text-xs bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/50"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-[#561c24]">{r.userName}</span>
                                <div className="flex items-center gap-1.5 font-mono text-[#561c24] font-bold">
                                  <span>{r.score}/5</span>
                                  {renderStars(r.score)}
                                </div>
                              </div>
                              {r.comment && (
                                <p className="text-[#6d2932] mt-1 font-serif italic text-xs">
                                  "{r.comment}"
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Wishlist Bottom Action: Move to completed with rating */}
                {subTab === 'wishlist' && (
                  <div className="mt-5 pt-4 border-t border-[#c7b7a3]/70 flex items-center justify-between">
                    <span className="text-xs text-[#6d2932]">Ainda não avaliado</span>
                    <button
                      type="button"
                      onClick={() => openRatingModal(item)}
                      className="px-3 py-1.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
                    >
                      {activeTabKey === 'movies'
                        ? 'Já Assistimos →'
                        : activeTabKey === 'books'
                        ? 'Já Lemos →'
                        : activeTabKey === 'places'
                        ? 'Já Fomos →'
                        : 'Já Concluímos →'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Drawer: Add Item */}
      <ModalDrawer
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={
          activeTabKey === 'movies'
            ? 'Adicionar Filme ou Série'
            : activeTabKey === 'books'
            ? 'Adicionar Livro'
            : activeTabKey === 'places'
            ? 'Adicionar Lugar ou Encontro'
            : `Adicionar em "${currentCustomTheme?.name || 'Lista'}"`
        }
        subtitle="Adicione à lista compartilhada de desejos do casal."
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          {activeTabKey === 'movies' && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                Tipo
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMediaKind('movie')}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border ${
                    mediaKind === 'movie'
                      ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                      : 'bg-[#E8d8c4] text-[#6d2932] border-[#c7b7a3]'
                  }`}
                >
                  Filme
                </button>
                <button
                  type="button"
                  onClick={() => setMediaKind('series')}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border ${
                    mediaKind === 'series'
                      ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                      : 'bg-[#E8d8c4] text-[#6d2932] border-[#c7b7a3]'
                  }`}
                >
                  Série
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              {activeTabKey === 'movies'
                ? 'Título do Filme ou Série'
                : activeTabKey === 'books'
                ? 'Título do Livro'
                : activeTabKey === 'places'
                ? 'Nome do Lugar / Restaurante'
                : 'Nome / Título do Item'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTabKey === 'movies'
                  ? 'Ex: Casablanca, Duna, Succession'
                  : activeTabKey === 'books'
                  ? 'Ex: Grande Sertão: Veredas'
                  : activeTabKey === 'places'
                  ? 'Ex: Bistrô Paris 6, Parque Ibirapuera'
                  : 'Ex: Catan, Risoto de Funghi, etc.'
              }
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              {activeTabKey === 'movies'
                ? 'Diretor(a) ou Onde Assistir (Opcional)'
                : activeTabKey === 'books'
                ? 'Autor(a) (Opcional)'
                : activeTabKey === 'places'
                ? 'Bairro / Cidade (Opcional)'
                : 'Detalhes ou Local (Opcional)'}
            </label>
            <input
              type="text"
              value={authorOrDirector}
              onChange={(e) => setAuthorOrDirector(e.target.value)}
              placeholder="Informação complementar"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Ordem de Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            >
              <option value="high">Alta (Queremos muito)</option>
              <option value="medium">Média (Em breve)</option>
              <option value="low">Baixa (Quando sobrar tempo)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2.5 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </ModalDrawer>

      {/* Modal / Drawer: Add Custom Theme */}
      <ModalDrawer
        isOpen={addThemeModalOpen}
        onClose={() => setAddThemeModalOpen(false)}
        title="Nova Lista Temática"
        subtitle="Crie sua própria temática de ranking e desejos do casal."
      >
        <form onSubmit={handleAddCustomTheme} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Nome da Temática
            </label>
            <input
              type="text"
              required
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Ex: Jogos de Tabuleiro, Vinhos, Receitas, Músicas"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Nome da Aba 'Desejos' (Opcional)
            </label>
            <input
              type="text"
              value={newThemePendingLabel}
              onChange={(e) => setNewThemePendingLabel(e.target.value)}
              placeholder="Ex: Queremos Experimentar, Para Fazer"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Nome da Aba 'Concluídos com Ranking' (Opcional)
            </label>
            <input
              type="text"
              value={newThemeCompletedLabel}
              onChange={(e) => setNewThemeCompletedLabel(e.target.value)}
              placeholder="Ex: Já Experimentamos (Ranking)"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddThemeModalOpen(false)}
              className="px-4 py-2.5 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isSaving ? 'Criando...' : 'Criar Lista Temática'}
            </button>
          </div>
        </form>
      </ModalDrawer>

      {/* Modal / Drawer: Rating & Review */}
      <ModalDrawer
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title="Avaliação do Casal"
        subtitle={selectedItemForRating ? `Atribuindo sua nota para "${selectedItemForRating.title}"` : ''}
      >
        <form onSubmit={handleSaveRating} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-2">
              Sua Nota Individual (1 a 5 estrelas)
            </label>
            <div className="flex items-center gap-3 bg-[#E8d8c4] p-3 border border-[#c7b7a3] justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  className="text-3xl p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={star <= score ? 'text-[#561c24]' : 'text-[#c7b7a3]'}>★</span>
                </button>
              ))}
              <span className="font-mono text-xl font-bold text-[#561c24] ml-3">{score} / 5</span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Breve Comentário / Sensação (Opcional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que você mais gostou ou achou marcante nessa experiência?"
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none resize-none"
            />
          </div>

          <div className="p-3 bg-[#f4eae0] border border-[#c7b7a3] text-xs text-[#6d2932]">
            Nota sendo registrada para: <strong className="text-[#561c24]">{currentUserName}</strong>. A
            média do casal será recalculada instantaneamente.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setRatingModalOpen(false)}
              className="px-4 py-2.5 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              Confirmar Avaliação
            </button>
          </div>
        </form>
      </ModalDrawer>
    </div>
  );
};
