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
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { EventCategory, EventItem } from '../types';
import { EventCountdown } from './EventCountdown';
import { ModalDrawer } from './ModalDrawer';
import { MiniCalendar } from './MiniCalendar';

const INITIAL_DEMO_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    coupleId: 'couple-demo-1',
    title: 'Show do Coldplay - Music of the Spheres',
    category: 'show',
    location: 'Estádio Morumbi, São Paulo',
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18 + 1000 * 60 * 60 * 5).toISOString(),
    notes: 'Compramos pista premium! Chegar 2 horas antes para ver abertura.',
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    coupleId: 'couple-demo-1',
    title: 'Viagem de Fim de Semana em Campos do Jordão',
    category: 'viagem',
    location: 'Chalé Vila das Flores, Campos do Jordão - SP',
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35).toISOString(),
    notes: 'Levar casaco pesado, fondue e vinho tinto.',
    createdBy: 'user-demo-2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    coupleId: 'couple-demo-1',
    title: 'Peça de Teatro: O Fantasma da Ópera',
    category: 'teatro',
    location: 'Teatro Renault, São Paulo',
    dateTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    notes: 'Noite inesquecível com jantar italiano depois.',
    createdBy: 'user-demo-1',
    createdAt: new Date().toISOString(),
  },
];

export const EventsSection: React.FC = () => {
  const { couple, user, isDemo, currentUserId } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth());

  // Form fields
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<EventCategory>('show');
  const [location, setLocation] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!couple) return;

    if (isDemo) {
      const local = localStorage.getItem(`nosso_events_${couple.id}`);
      if (local) {
        try {
          setEvents(JSON.parse(local));
        } catch {
          setEvents(INITIAL_DEMO_EVENTS);
        }
      } else {
        setEvents(INITIAL_DEMO_EVENTS);
        localStorage.setItem(`nosso_events_${couple.id}`, JSON.stringify(INITIAL_DEMO_EVENTS));
      }
      return;
    }

    const q = query(collection(db, 'events'), where('coupleId', '==', couple.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: EventItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<EventItem, 'id'>) });
        });
        setEvents(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'events');
      }
    );

    return () => unsubscribe();
  }, [couple, isDemo]);

  const openNewModal = () => {
    setEditingEvent(null);
    setTitle('');
    setCategory('show');
    setLocation('');
    // default to tomorrow at 20:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    tomorrow.setHours(20, 0, 0, 0);
    setDateTime(tomorrow.toISOString().slice(0, 16));
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setCategory(evt.category);
    setLocation(evt.location);
    try {
      const d = new Date(evt.dateTime);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateTime(localIso);
    } catch {
      setDateTime(evt.dateTime);
    }
    setNotes(evt.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !title.trim() || !dateTime) return;
    setIsSaving(true);

    const eventPayload = {
      coupleId: couple.id,
      title: title.trim(),
      category,
      location: location.trim(),
      dateTime: new Date(dateTime).toISOString(),
      notes: notes.trim(),
      createdBy: editingEvent ? editingEvent.createdBy : (currentUserId || user?.uid || 'user-1'),
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
    };

    if (isDemo) {
      let updated: EventItem[];
      if (editingEvent) {
        updated = events.map((item) =>
          item.id === editingEvent.id ? { ...item, ...eventPayload } : item
        );
      } else {
        const newEvt: EventItem = {
          id: `evt-${Date.now()}`,
          ...eventPayload,
        };
        updated = [newEvt, ...events];
      }
      setEvents(updated);
      localStorage.setItem(`nosso_events_${couple.id}`, JSON.stringify(updated));
      setIsSaving(false);
      setIsModalOpen(false);
      return;
    }

    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventPayload);
      } else {
        await addDoc(collection(db, 'events'), eventPayload);
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.CREATE, 'events');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente remover este evento da contagem?')) return;

    if (isDemo && couple) {
      const updated = events.filter((e) => e.id !== id);
      setEvents(updated);
      localStorage.setItem(`nosso_events_${couple.id}`, JSON.stringify(updated));
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  // Split upcoming vs past
  const now = Date.now();
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });

  const upcomingEvents = sortedEvents.filter((e) => new Date(e.dateTime).getTime() >= now);
  const pastEvents = sortedEvents
    .filter((e) => new Date(e.dateTime).getTime() < now)
    .reverse();

  const currentActualMonth = new Date().getMonth();
  const currentActualYear = new Date().getFullYear();

  const baseEvents = filter === 'upcoming' ? upcomingEvents : pastEvents;
  const displayedEvents =
    selectedCalendarDay !== null
      ? events.filter((e) => {
          const d = new Date(e.dateTime);
          return (
            d.getFullYear() === calendarYear &&
            d.getMonth() === calendarMonth &&
            d.getDate() === selectedCalendarDay
          );
        })
      : baseEvents;

  return (
    <div className="space-y-8">
      {/* Top Header of Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#c7b7a3] pb-6">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#6d2932] block mb-1">
            Linha do Tempo & Momentos
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#561c24] font-normal tracking-tight">
            Próximos Momentos & Shows
          </h2>
          <p className="text-xs sm:text-sm text-[#6d2932] mt-1 font-sans">
            Contagem regressiva em tempo real para os shows, teatros e viagens que vocês planejaram.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="self-start sm:self-auto px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
        >
          + Adicionar Evento
        </button>
      </div>

      {/* Mini Calendário com navegação entre meses (passados e futuros) */}
      <MiniCalendar
        events={events}
        selectedDay={selectedCalendarDay}
        onSelectDay={setSelectedCalendarDay}
        onMonthChange={(y, m) => {
          setCalendarYear(y);
          setCalendarMonth(m);
          setSelectedCalendarDay(null);
        }}
      />

      {/* Filter Tabs: Próximos vs Passados */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilter('upcoming');
              setSelectedCalendarDay(null);
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border ${
              filter === 'upcoming'
                ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
            }`}
          >
            Próximos Eventos ({upcomingEvents.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('past');
              setSelectedCalendarDay(null);
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border ${
              filter === 'past'
                ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24]'
                : 'bg-[#f4eae0] text-[#6d2932] border-[#c7b7a3] hover:border-[#561c24]'
            }`}
          >
            Eventos Passados ({pastEvents.length})
          </button>
        </div>

        {selectedCalendarDay !== null && (
          <div className="flex items-center gap-2 bg-[#E8d8c4] px-3 py-1.5 border border-[#c7b7a3] text-xs text-[#561c24]">
            <span>Filtrando dia <strong>{selectedCalendarDay}</strong> deste mês</span>
            <button
              type="button"
              onClick={() => setSelectedCalendarDay(null)}
              className="text-[10px] uppercase tracking-wider text-[#6d2932] hover:text-[#561c24] underline ml-1"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Event Cards Grid */}
      {displayedEvents.length === 0 ? (
        <div className="bg-[#f4eae0] border border-[#c7b7a3] p-12 text-center">
          <p className="font-serif text-xl text-[#561c24]">
            {filter === 'upcoming'
              ? 'Nenhum evento futuro agendado ainda.'
              : 'Nenhum evento registrado no histórico.'}
          </p>
          <p className="text-xs text-[#6d2932] mt-2 font-sans">
            {filter === 'upcoming'
              ? 'Cadastre um show, uma viagem ou um jantar especial para acompanhar a contagem.'
              : 'Eventos já realizados aparecerão aqui como memórias.'}
          </p>
          {filter === 'upcoming' && (
            <button
              type="button"
              onClick={openNewModal}
              className="mt-6 px-5 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              Planejar Primeiro Evento
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedEvents.map((evt) => (
            <EventCountdown
              key={evt.id}
              event={evt}
              onDelete={handleDelete}
              onEdit={openEditModal}
            />
          ))}
        </div>
      )}

      {/* Modal / Drawer for Event Creation & Edit */}
      <ModalDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Editar Evento' : 'Novo Momento a Dois'}
        subtitle="Adicione shows, peças, viagens ou datas para contagem regressiva."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Nome do Evento / Show
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Show do Coldplay, Viagem a Roma, etc."
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
              >
                <option value="show">Show</option>
                <option value="teatro">Teatro / Espetáculo</option>
                <option value="festival">Festival</option>
                <option value="viagem">Viagem</option>
                <option value="comemoracao">Comemoração / Aniversário</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
                Local / Cidade
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Estádio Morumbi, SP"
                className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Data e Hora
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6d2932] font-semibold mb-1">
              Notas & Detalhes (Opcional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ingressos comprados, hotel reservado, lembretes..."
              className="w-full px-3.5 py-2.5 bg-[#E8d8c4] border border-[#c7b7a3] focus:border-[#561c24] text-[#561c24] text-sm outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-[#c7b7a3] text-xs font-semibold uppercase tracking-wider text-[#6d2932] hover:text-[#561c24]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#561c24] text-[#E8d8c4] text-xs font-semibold uppercase tracking-wider hover:bg-[#6d2932] transition-colors"
            >
              {isSaving ? 'Salvando...' : editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </ModalDrawer>
    </div>
  );
};
