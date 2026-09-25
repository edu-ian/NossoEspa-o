import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { EventItem, MediaItem, QuestionItem, CustomListTheme } from '../types';

export const MetricsSection: React.FC<{ onNavigateToTab?: (tab: string) => void }> = ({
  onNavigateToTab,
}) => {
  const { couple, isDemo } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomListTheme[]>([]);
  const [customQuestions, setCustomQuestions] = useState<QuestionItem[]>([]);
  const [readCardCount, setReadCardCount] = useState<number>(0);

  useEffect(() => {
    if (!couple) return;

    // Track cards flipped/read
    const storedRead = localStorage.getItem(`nosso_read_cards_${couple.id}`);
    if (storedRead) {
      try {
        const parsed = JSON.parse(storedRead);
        setReadCardCount(Array.isArray(parsed) ? parsed.length : Number(parsed) || 0);
      } catch {
        setReadCardCount(0);
      }
    }

    if (isDemo) {
      const storedEvents = localStorage.getItem(`nosso_events_${couple.id}`);
      if (storedEvents) {
        try {
          setEvents(JSON.parse(storedEvents));
        } catch {
          // ignore
        }
      }
      const storedMedia = localStorage.getItem(`nosso_media_${couple.id}`);
      if (storedMedia) {
        try {
          setMediaItems(JSON.parse(storedMedia));
        } catch {
          // ignore
        }
      }
      const storedThemes = localStorage.getItem(`nosso_custom_themes_${couple.id}`);
      if (storedThemes) {
        try {
          setCustomThemes(JSON.parse(storedThemes));
        } catch {
          // ignore
        }
      }
      const storedQ = localStorage.getItem(`nosso_custom_questions_${couple.id}`);
      if (storedQ) {
        try {
          setCustomQuestions(JSON.parse(storedQ));
        } catch {
          // ignore
        }
      }
      return;
    }

    // Live listeners for couple metrics
    const qEvents = query(collection(db, 'events'), where('coupleId', '==', couple.id));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const items: EventItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<EventItem, 'id'>) }));
      setEvents(items);
    });

    const qMedia = query(collection(db, 'media_items'), where('coupleId', '==', couple.id));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      const items: MediaItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<MediaItem, 'id'>) }));
      setMediaItems(items);
    });

    const qThemes = query(collection(db, 'custom_lists'), where('coupleId', '==', couple.id));
    const unsubThemes = onSnapshot(qThemes, (snap) => {
      const themes: CustomListTheme[] = [];
      snap.forEach((d) => themes.push({ id: d.id, ...(d.data() as Omit<CustomListTheme, 'id'>) }));
      setCustomThemes(themes);
    });

    const qQuestions = query(collection(db, 'questions'), where('coupleId', '==', couple.id));
    const unsubQ = onSnapshot(qQuestions, (snap) => {
      const items: QuestionItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<QuestionItem, 'id'>) }));
      setCustomQuestions(items);
    });

    return () => {
      unsubEvents();
      unsubMedia();
      unsubThemes();
      unsubQ();
    };
  }, [couple, isDemo]);

  // Derived counts for built-in lists
  const movies = mediaItems.filter((i) => i.type === 'movie' || i.type === 'series');
  const watchedMovies = movies.filter((i) => i.status === 'watched');
  const toWatchMovies = movies.filter((i) => i.status === 'to_watch');

  const books = mediaItems.filter((i) => i.type === 'book');
  const readBooks = books.filter((i) => i.status === 'read');
  const toReadBooks = books.filter((i) => i.status === 'to_read');

  const places = mediaItems.filter((i) => i.type === 'place_wish' || i.type === 'place_visited');
  const visitedPlaces = places.filter((i) => i.status === 'visited');
  const toVisitPlaces = places.filter((i) => i.status === 'to_visit');

  // Custom Themes Metrics
  const customItems = mediaItems.filter((i) => i.type === 'custom' || !!i.customThemeId);
  const completedCustomItems = customItems.filter((i) => i.status === 'completed');
  const pendingCustomItems = customItems.filter((i) => i.status === 'pending');

  const themesWithStats = customThemes.map((theme) => {
    const itemsOfTheme = customItems.filter(
      (item) => item.customThemeId === theme.id || item.customThemeName === theme.name
    );
    const completed = itemsOfTheme.filter((item) => item.status === 'completed');
    const pending = itemsOfTheme.filter((item) => item.status === 'pending');
    const rated = completed.filter((item) => typeof item.averageScore === 'number' && item.averageScore > 0);
    const avgScore =
      rated.length > 0
        ? (rated.reduce((sum, item) => sum + (item.averageScore || 0), 0) / rated.length).toFixed(1)
        : null;

    return {
      ...theme,
      totalCount: itemsOfTheme.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      avgScore,
    };
  });

  // All Evaluated items (Movies, Series, Books, Places, and Custom Themes)
  const evaluatedItems = mediaItems.filter(
    (i) => typeof i.averageScore === 'number' && i.averageScore > 0
  );
  const totalAverage =
    evaluatedItems.length > 0
      ? (
          evaluatedItems.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) /
          evaluatedItems.length
        ).toFixed(1)
      : '—';

  // Highest and Lowest rated items
  const sortedByScore = [...evaluatedItems].sort(
    (a, b) => (b.averageScore || 0) - (a.averageScore || 0)
  );
  const highestItem = sortedByScore[0];
  const lowestItem = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null;

  // Events breakdown
  const now = Date.now();
  const upcomingEvents = events.filter((e) => new Date(e.dateTime).getTime() >= now);
  const pastEvents = events.filter((e) => new Date(e.dateTime).getTime() < now);
  const nextEvent = [...upcomingEvents].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  )[0];

  // Days since space creation
  const createdDate = couple?.createdAt ? new Date(couple.createdAt).getTime() : now;
  const daysConnected = Math.max(1, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)));
  const formattedCreationDate = new Date(createdDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Samples for each category
  const sampleWatchedMovie = watchedMovies[0];
  const sampleToWatchMovie = toWatchMovies[0];
  const sampleReadBook = readBooks[0];
  const sampleToReadBook = toReadBooks[0];
  const sampleVisitedPlace = visitedPlaces[0];
  const sampleToVisitPlace = toVisitPlaces[0];
  const samplePastEvent = pastEvents[0];
  const sampleQuestion = customQuestions[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Section Header */}
      <div className="border-b border-[#c7b7a3] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] block mb-1">
            Estatísticas & Cumplicidade
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal tracking-tight">
            Métricas do Nosso Espaço
          </h2>
          <p className="text-xs sm:text-sm text-[#6d2932] mt-0.5 font-sans">
            Um panorama vivo e afetuoso de tudo o que vocês já viveram, assistiram, leram e conversaram.
          </p>
        </div>

        {onNavigateToTab && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateToTab('events')}
              className="text-xs font-semibold uppercase tracking-wider text-[#561c24] hover:text-[#6d2932] underline-offset-4 hover:underline"
            >
              + Eventos
            </button>
            <span className="text-[#c7b7a3]">•</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('library')}
              className="text-xs font-semibold uppercase tracking-wider text-[#561c24] hover:text-[#6d2932] underline-offset-4 hover:underline"
            >
              + Listas
            </button>
            <span className="text-[#c7b7a3]">•</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('questions')}
              className="text-xs font-semibold uppercase tracking-wider text-[#561c24] hover:text-[#6d2932] underline-offset-4 hover:underline"
            >
              + Cartas
            </button>
          </div>
        )}
      </div>

      {/* PAINEL VISUAL DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* CARD: DIAS JUNTOS NO APLICATIVO (Elegante em Bordô, Proporcional e Equilibrado) */}
        <div className="md:col-span-12 lg:col-span-6 bg-[#561c24] text-[#E8d8c4] border border-[#561c24] p-5 sm:p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
          {/* Subtle inner paper border */}
          <div className="absolute inset-2 border border-[#c7b7a3]/20 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E8d8c4] bg-[#6d2932] px-2.5 py-0.5 border border-[#c7b7a3]/30 font-semibold">
                Tempo Compartilhado
              </span>
              <span className="text-[11px] font-mono text-[#c7b7a3]">
                Desde {formattedCreationDate}
              </span>
            </div>

            <div className="my-3">
              <span className="text-[11px] uppercase tracking-wider text-[#c7b7a3] font-medium block mb-0.5">
                Dias cultivando este espaço a dois
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E8d8c4] tracking-tight">
                  {daysConnected}
                </span>
                <span className="font-serif text-lg sm:text-xl text-[#c7b7a3] font-normal italic">
                  {daysConnected === 1 ? 'dia de cumplicidade' : 'dias de cumplicidade'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#c7b7a3] font-sans leading-relaxed">
              Cada dia que vocês abrem o aplicativo juntos aprofunda o carinho e o afeto. Usem este espaço diariamente para manter suas memórias e diálogos vivos.
            </p>
          </div>

          <div className="relative z-10 mt-5 pt-3 border-t border-[#c7b7a3]/30 flex flex-wrap items-center justify-between gap-2 text-xs text-[#E8d8c4]">
            <span className="font-medium text-xs">
              Casal: <strong className="underline decoration-[#c7b7a3]">{couple?.spaceName || 'Josef & Fulana'}</strong>
            </span>
            <span className="text-[11px] text-[#c7b7a3] font-mono">
              Espaço Privado
            </span>
          </div>
        </div>

        {/* BENTO CARD: NOTA MÉDIA DO CASAL */}
        <div className="md:col-span-12 lg:col-span-6 bg-[#f4eae0] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                Sintonia de Opinião
              </span>
              <span className="text-[11px] font-mono text-[#561c24] bg-[#E8d8c4] px-2 py-0.5 border border-[#c7b7a3]">
                {evaluatedItems.length} avaliados
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl text-[#561c24] font-medium leading-tight">
              Nota Média do Casal
            </h3>
            <p className="text-xs text-[#6d2932] mt-1 font-sans">
              Média conjunta calculada a partir dos votos individuais de ambos.
            </p>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-bold text-[#561c24]">
                {totalAverage}
              </span>
              <span className="text-xs font-mono text-[#6d2932]">/ 5.0 estrelas</span>
            </div>

            {/* Stars representation */}
            <div className="flex items-center gap-1 text-[#561c24] text-base mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= Math.round(Number(totalAverage) || 0)
                      ? 'text-[#561c24]'
                      : 'text-[#c7b7a3] opacity-40'
                  }
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#c7b7a3]/70 text-xs text-[#6d2932]">
            <span>
              {evaluatedItems.length > 0
                ? `${evaluatedItems.length} experiências mútuas no ranking histórico.`
                : 'Avaliem filmes, livros e lugares para compor a média conjunta.'}
            </span>
          </div>
        </div>

        {/* BENTO CARD: FILMES & SÉRIES (COM AMOSTRAS) */}
        <div className="md:col-span-6 lg:col-span-4 bg-[#eee2d4] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                Cinema & Telas
              </span>
              <span className="font-mono text-xs font-bold text-[#561c24]">
                {movies.length} obras
              </span>
            </div>

            <h3 className="font-serif text-xl text-[#561c24] font-medium">
              Filmes & Séries
            </h3>

            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="bg-[#E8d8c4] p-2.5 border border-[#c7b7a3]">
                <span className="font-mono text-2xl font-bold text-[#561c24] block">
                  {watchedMovies.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">
                  Assistidos
                </span>
              </div>
              <div className="bg-[#E8d8c4] p-2.5 border border-[#c7b7a3]">
                <span className="font-mono text-2xl font-bold text-[#561c24] block">
                  {toWatchMovies.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">
                  Na Fila
                </span>
              </div>
            </div>

            {/* Amostras reais */}
            <div className="mt-4 space-y-2">
              {sampleWatchedMovie && (
                <div className="bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/60 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-[#6d2932] block font-semibold">
                    Amostra de Assistido:
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-serif font-medium text-[#561c24] line-clamp-1">
                      {sampleWatchedMovie.title}
                    </span>
                    {sampleWatchedMovie.averageScore && (
                      <span className="font-mono text-[11px] font-bold text-[#561c24] ml-2 shrink-0">
                        ★ {sampleWatchedMovie.averageScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {sampleToWatchMovie && (
                <div className="bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/60 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-[#6d2932] block font-semibold">
                    Próximo para Assistir:
                  </span>
                  <span className="font-serif font-medium text-[#561c24] line-clamp-1 mt-0.5 block">
                    {sampleToWatchMovie.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('library')}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#561c24] hover:underline"
              >
                Abrir Lista de Filmes →
              </button>
            )}
          </div>
        </div>

        {/* BENTO CARD: LIVROS & LEITURAS (COM AMOSTRAS) */}
        <div className="md:col-span-6 lg:col-span-4 bg-[#eee2d4] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                Estante Compartilhada
              </span>
              <span className="font-mono text-xs font-bold text-[#561c24]">
                {books.length} livros
              </span>
            </div>

            <h3 className="font-serif text-xl text-[#561c24] font-medium">
              Livros & Leituras
            </h3>

            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="bg-[#E8d8c4] p-2.5 border border-[#c7b7a3]">
                <span className="font-mono text-2xl font-bold text-[#561c24] block">
                  {readBooks.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">
                  Concluídos
                </span>
              </div>
              <div className="bg-[#E8d8c4] p-2.5 border border-[#c7b7a3]">
                <span className="font-mono text-2xl font-bold text-[#561c24] block">
                  {toReadBooks.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">
                  Queremos Ler
                </span>
              </div>
            </div>

            {/* Amostras reais */}
            <div className="mt-4 space-y-2">
              {sampleReadBook && (
                <div className="bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/60 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-[#6d2932] block font-semibold">
                    Amostra de Livro Lido:
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-serif font-medium text-[#561c24] line-clamp-1">
                      {sampleReadBook.title}
                    </span>
                    {sampleReadBook.averageScore && (
                      <span className="font-mono text-[11px] font-bold text-[#561c24] ml-2 shrink-0">
                        ★ {sampleReadBook.averageScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {sampleToReadBook && (
                <div className="bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/60 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-[#6d2932] block font-semibold">
                    Próxima Leitura:
                  </span>
                  <span className="font-serif font-medium text-[#561c24] line-clamp-1 mt-0.5 block">
                    {sampleToReadBook.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('library')}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#561c24] hover:underline"
              >
                Abrir Lista de Livros →
              </button>
            )}
          </div>
        </div>

        {/* BENTO CARD: LUGARES & ENCONTROS (COM AMOSTRAS) */}
        <div className="md:col-span-6 lg:col-span-4 bg-[#eee2d4] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                Passeios & Viagens
              </span>
              <span className="font-mono text-xs font-bold text-[#561c24]">
                {places.length} locais
              </span>
            </div>

            <h3 className="font-serif text-xl text-[#561c24] font-medium">
              Lugares para Ir & Já Fomos
            </h3>

            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="bg-[#E8d8c4] p-2.5 border border-[#c7b7a3]">
                <span className="font-mono text-2xl font-bold text-[#561c24] block">
                  {visitedPlaces.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">
                  Visitados
                </span>
              </div>
              <div className="bg-[#E8d8c4] p-2.5 border border-[#c7b7a3]">
                <span className="font-mono text-2xl font-bold text-[#561c24] block">
                  {toVisitPlaces.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932]">
                  Desejados
                </span>
              </div>
            </div>

            {/* Amostras reais */}
            <div className="mt-4 space-y-2">
              {sampleVisitedPlace && (
                <div className="bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/60 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-[#6d2932] block font-semibold">
                    Amostra de Local Visitado:
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-serif font-medium text-[#561c24] line-clamp-1">
                      {sampleVisitedPlace.title}
                    </span>
                    {sampleVisitedPlace.averageScore && (
                      <span className="font-mono text-[11px] font-bold text-[#561c24] ml-2 shrink-0">
                        ★ {sampleVisitedPlace.averageScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {sampleToVisitPlace && (
                <div className="bg-[#f4eae0] p-2.5 border border-[#c7b7a3]/60 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-[#6d2932] block font-semibold">
                    Na Lista de Desejos:
                  </span>
                  <span className="font-serif font-medium text-[#561c24] line-clamp-1 mt-0.5 block">
                    {sampleToVisitPlace.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('library')}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#561c24] hover:underline"
              >
                Abrir Lista de Lugares →
              </button>
            )}
          </div>
        </div>

        {/* BENTO CARD: BARALHO DE DIÁLOGO (SEM a linha de categorias disponíveis) */}
        <div className="md:col-span-6 lg:col-span-6 bg-[#f4eae0] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                Troca Íntima & Conversa
              </span>
              <span className="font-mono text-xs font-bold text-[#561c24]">
                Diálogo a Dois
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl text-[#561c24] font-medium">
              Cartas de Diálogo
            </h3>
            <p className="text-xs text-[#6d2932] mt-1 font-sans">
              Perguntas que estimulam conversas que não acontecem na pressa do cotidiano.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 text-center">
              <div className="bg-[#E8d8c4] p-3 border border-[#c7b7a3]">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#561c24] block">
                  {readCardCount > 0 ? readCardCount : 12}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-medium">
                  Cartas Lidas / Viradas
                </span>
              </div>
              <div className="bg-[#E8d8c4] p-3 border border-[#c7b7a3]">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#561c24] block">
                  {customQuestions.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-medium">
                  Perguntas Criadas
                </span>
              </div>
            </div>

            {/* Amostra de Pergunta */}
            <div className="mt-4 bg-[#eee2d4] p-3.5 border border-[#c7b7a3]/70">
              <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-semibold block mb-1">
                Amostra do Baralho:
              </span>
              <p className="font-serif italic text-xs sm:text-sm text-[#561c24] leading-relaxed">
                "{sampleQuestion
                  ? sampleQuestion.text
                  : 'Qual foi o exato momento em que você percebeu que estava apaixonado(a) por mim?'}"
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('questions')}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#561c24] hover:underline"
              >
                Jogar Baralho de Cartas →
              </button>
            )}
          </div>
        </div>

        {/* BENTO CARD: LINHA DO TEMPO & SHOWS (COM AMOSTRA DO PRÓXIMO MOMENTO) */}
        <div className="md:col-span-6 lg:col-span-6 bg-[#f4eae0] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                Contagem Regressiva
              </span>
              <span className="font-mono text-xs font-bold text-[#561c24]">
                {events.length} eventos no total
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl text-[#561c24] font-medium">
              Momentos & Shows Agendados
            </h3>
            <p className="text-xs text-[#6d2932] mt-1 font-sans">
              Shows, festivais, viagens e aniversários aguardados ou já vividos.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 text-center">
              <div className="bg-[#E8d8c4] p-3 border border-[#c7b7a3]">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#561c24] block">
                  {upcomingEvents.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-medium">
                  Momentos Futuros
                </span>
              </div>
              <div className="bg-[#E8d8c4] p-3 border border-[#c7b7a3]">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#561c24] block">
                  {pastEvents.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-medium">
                  Memórias Vividas
                </span>
              </div>
            </div>

            {/* Amostra do Próximo Momento */}
            <div className="mt-4 bg-[#eee2d4] p-3.5 border border-[#c7b7a3]/70">
              <span className="text-[10px] uppercase tracking-wider text-[#6d2932] font-semibold block mb-1">
                Amostra do Próximo na Agenda:
              </span>
              {nextEvent ? (
                <div>
                  <h4 className="font-serif text-sm font-semibold text-[#561c24]">
                    {nextEvent.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-[#6d2932] mt-1 font-mono">
                    <span>{nextEvent.location}</span>
                    <span>
                      {new Date(nextEvent.dateTime).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              ) : samplePastEvent ? (
                <div>
                  <h4 className="font-serif text-sm font-semibold text-[#561c24]">
                    {samplePastEvent.title}
                  </h4>
                  <span className="text-xs text-[#6d2932] font-mono mt-1 block">
                    Vivido em: {new Date(samplePastEvent.dateTime).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-[#6d2932] italic">Nenhum evento registrado ainda.</span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('events')}
                className="text-[11px] font-semibold uppercase tracking-wider text-[#561c24] hover:underline"
              >
                Abrir Linha do Tempo & Calendário →
              </button>
            )}
          </div>
        </div>

        {/* BENTO CARD: LISTAS TEMÁTICAS PRÓPRIAS (COM AMOSTRAS DAS TEMÁTICAS) */}
        <div className="md:col-span-12 bg-[#eee2d4] border border-[#c7b7a3] p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c7b7a3] pb-3 mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold block mb-0.5">
                Listas Personalizadas
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[#561c24] font-medium">
                Temáticas Autorais & Ranking Conjunto
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#561c24] bg-[#E8d8c4] px-3 py-1 border border-[#c7b7a3]">
                {customThemes.length} {customThemes.length === 1 ? 'temática criada' : 'temáticas criadas'}
              </span>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('library')}
                  className="text-xs font-semibold uppercase tracking-wider text-[#561c24] hover:underline"
                >
                  Criar Nova Lista →
                </button>
              )}
            </div>
          </div>

          {/* Amostras das Temáticas Criadas */}
          {themesWithStats.length === 0 ? (
            <div className="bg-[#f4eae0] border border-[#c7b7a3] p-6 text-center">
              <p className="font-serif text-base text-[#561c24]">
                Nenhuma lista temática criada ainda.
              </p>
              <p className="text-xs text-[#6d2932] mt-1">
                Adicione suas próprias listas (ex: Vinhos & Drinks, Jogos de Tabuleiro, Cafeterias, Receitas) para que suas métricas apareçam aqui!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themesWithStats.map((th) => (
                <div
                  key={th.id}
                  className="bg-[#f4eae0] border border-[#c7b7a3] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#6d2932]">
                        Amostra de Temática
                      </span>
                      {th.avgScore && (
                        <span className="text-xs font-mono font-bold text-[#561c24] bg-[#E8d8c4] px-2 py-0.5 border border-[#c7b7a3]/60">
                          ★ {th.avgScore}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-lg text-[#561c24] font-medium leading-snug">
                      {th.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#c7b7a3]/60 flex items-center justify-between text-xs text-[#6d2932]">
                    <span>
                      <strong>{th.completedCount}</strong> avaliados
                    </span>
                    <span>
                      <strong>{th.pendingCount}</strong> pendentes
                    </span>
                    <span className="font-mono text-[#561c24] font-semibold">
                      Total: {th.totalCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6d2932]">
            <span>
              Total em listas próprias: <strong>{completedCustomItems.length}</strong> itens avaliados e <strong>{pendingCustomItems.length}</strong> desejos pendentes.
            </span>
            <span className="font-mono text-[11px] text-[#561c24]">
              {customItems.length} registros cadastrados
            </span>
          </div>
        </div>

        {/* BENTO CARD: MAIOR NOTA CONQUISTADA ★ */}
        {highestItem && (
          <div className="md:col-span-6 bg-[#E8d8c4] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-[#561c24] font-semibold">
                  ★ Amostra do Topo do Ranking
                </span>
                <span className="text-xs font-mono font-bold text-[#561c24]">
                  Maior Nota
                </span>
              </div>

              <h4 className="font-serif text-2xl text-[#561c24] font-medium mt-1">
                {highestItem.title}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-3xl font-bold text-[#561c24]">
                  {highestItem.averageScore?.toFixed(1)}
                </span>
                <span className="text-xs text-[#6d2932]">estrelas de média</span>
              </div>
              {(highestItem.authorOrDirector || highestItem.location || highestItem.customThemeName) && (
                <p className="text-xs text-[#6d2932] mt-1 font-sans">
                  {highestItem.customThemeName
                    ? `Lista: ${highestItem.customThemeName}`
                    : highestItem.authorOrDirector || highestItem.location}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60 text-xs text-[#6d2932]">
              A experiência mais bem avaliada conjuntamente por vocês.
            </div>
          </div>
        )}

        {/* BENTO CARD: PIOR NOTA CONQUISTADA ▼ */}
        {lowestItem && (
          <div className="md:col-span-6 bg-[#E8d8c4] border border-[#c7b7a3] p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-[#6d2932] font-semibold">
                  ▼ Amostra da Menor Nota
                </span>
                <span className="text-xs font-mono font-bold text-[#6d2932]">
                  Pior Nota
                </span>
              </div>

              <h4 className="font-serif text-2xl text-[#561c24] font-medium mt-1">
                {lowestItem.title}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-3xl font-bold text-[#561c24]">
                  {lowestItem.averageScore?.toFixed(1)}
                </span>
                <span className="text-xs text-[#6d2932]">estrelas de média</span>
              </div>
              {(lowestItem.authorOrDirector || lowestItem.location || lowestItem.customThemeName) && (
                <p className="text-xs text-[#6d2932] mt-1 font-sans">
                  {lowestItem.customThemeName
                    ? `Lista: ${lowestItem.customThemeName}`
                    : lowestItem.authorOrDirector || lowestItem.location}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#c7b7a3]/60 text-xs text-[#6d2932]">
              Mesmo as opiniões divergentes ou críticas constroem a história de vocês.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
