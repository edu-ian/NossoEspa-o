import React, { useState } from 'react';
import { EventItem } from '../types';

interface MiniCalendarProps {
  events: EventItem[];
  selectedDay?: number | null;
  onSelectDay?: (day: number | null) => void;
  onMonthChange?: (year: number, month: number) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  events,
  selectedDay: controlledSelectedDay,
  onSelectDay: controlledOnSelectDay,
  onMonthChange,
}) => {
  const actualNow = new Date();
  const currentActualYear = actualNow.getFullYear();
  const currentActualMonth = actualNow.getMonth();
  const todayDate = actualNow.getDate();

  // Navigation state for browsing past and future months
  const [viewDate, setViewDate] = useState<Date>(() => new Date(currentActualYear, currentActualMonth, 1));
  const [internalSelectedDay, setInternalSelectedDay] = useState<number | null>(null);

  const selectedDay = controlledSelectedDay !== undefined ? controlledSelectedDay : internalSelectedDay;
  const setSelectedDay = controlledOnSelectDay || setInternalSelectedDay;

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const isCurrentMonth = viewYear === currentActualYear && viewMonth === currentActualMonth;
  const isPastMonth =
    viewYear < currentActualYear || (viewYear === currentActualYear && viewMonth < currentActualMonth);

  const goToPrevMonth = () => {
    setSelectedDay(null);
    setViewDate((prev) => {
      const nextDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      onMonthChange?.(nextDate.getFullYear(), nextDate.getMonth());
      return nextDate;
    });
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    setViewDate((prev) => {
      const nextDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      onMonthChange?.(nextDate.getFullYear(), nextDate.getMonth());
      return nextDate;
    });
  };

  const goToCurrentMonth = () => {
    setSelectedDay(null);
    const nextDate = new Date(currentActualYear, currentActualMonth, 1);
    setViewDate(nextDate);
    onMonthChange?.(currentActualYear, currentActualMonth);
  };

  // Month information in Portuguese
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(viewDate);
  const formattedMonthHeader = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${viewYear}`;

  // Days calculation for viewed month
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Map events of this viewed month by day
  const eventsThisMonth = events.filter((e) => {
    const d = new Date(e.dateTime);
    return (
      !isNaN(d.getTime()) &&
      d.getFullYear() === viewYear &&
      d.getMonth() === viewMonth
    );
  });

  const eventsByDay: Record<number, EventItem[]> = {};
  eventsThisMonth.forEach((e) => {
    const day = new Date(e.dateTime).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Empty leading days padding
  const paddingDays = Array.from({ length: firstDayOfWeek });
  const monthDays = Array.from({ length: daysInViewMonth }, (_, i) => i + 1);

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  return (
    <div className="bg-[#f4eae0] border border-[#c7b7a3] p-5 sm:p-6 select-none">
      {/* Header with Navigation Arrows */}
      <div className="flex items-center justify-between border-b border-[#c7b7a3] pb-3 mb-4 gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6d2932] block">
              {isCurrentMonth
                ? 'Mês Atual'
                : isPastMonth
                ? 'Mês Passado • Memórias Vividas'
                : 'Mês Futuro • Próximos Momentos'}
            </span>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="text-[10px] text-[#561c24] underline hover:text-[#6d2932] cursor-pointer"
              >
                (Voltar para Mês Atual)
              </button>
            )}
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-[#561c24] font-medium leading-tight">
            {formattedMonthHeader}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Previous Month Arrow Button */}
          <button
            type="button"
            onClick={goToPrevMonth}
            aria-label="Ver mês anterior"
            title="Ver mês anterior"
            className="w-8 h-8 flex items-center justify-center bg-[#E8d8c4] border border-[#c7b7a3] text-[#561c24] hover:bg-[#561c24] hover:text-[#E8d8c4] transition-colors font-bold text-sm cursor-pointer"
          >
            ←
          </button>

          {/* Current Month Event Count Badge */}
          <span className="inline-block px-2.5 py-1.5 text-xs font-mono font-semibold bg-[#E8d8c4] border border-[#c7b7a3] text-[#561c24]">
            {eventsThisMonth.length} {eventsThisMonth.length === 1 ? 'evento' : 'eventos'}
          </span>

          {/* Next Month Arrow Button */}
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Ver próximo mês"
            title="Ver próximo mês"
            className="w-8 h-8 flex items-center justify-center bg-[#E8d8c4] border border-[#c7b7a3] text-[#561c24] hover:bg-[#561c24] hover:text-[#E8d8c4] transition-colors font-bold text-sm cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {weekDayLabels.map((wd) => (
          <span
            key={wd}
            className="text-[11px] font-semibold text-[#6d2932] uppercase tracking-wider py-1"
          >
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty days */}
        {paddingDays.map((_, i) => (
          <div key={`empty-${i}`} className="h-9 sm:h-10 opacity-0 pointer-events-none" />
        ))}

        {/* Real Days of the month */}
        {monthDays.map((day) => {
          const isToday = isCurrentMonth && day === todayDate;
          const dayEvents = eventsByDay[day] || [];
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                if (hasEvents) {
                  setSelectedDay(isSelected ? null : day);
                } else if (selectedDay === day) {
                  setSelectedDay(null);
                } else {
                  setSelectedDay(day);
                }
              }}
              className={`h-9 sm:h-10 relative flex flex-col items-center justify-center border transition-all text-xs font-mono cursor-pointer ${
                isSelected
                  ? 'bg-[#561c24] text-[#E8d8c4] border-[#561c24] font-bold shadow-xs'
                  : hasEvents
                  ? 'bg-[#dfcfbc] text-[#561c24] border-[#6d2932] font-semibold hover:border-[#561c24]'
                  : isToday
                  ? 'bg-[#E8d8c4] text-[#561c24] border-[#561c24] font-bold'
                  : 'bg-transparent text-[#561c24]/80 border-transparent hover:bg-[#E8d8c4]/60'
              }`}
              title={
                hasEvents
                  ? `${dayEvents.length} evento(s) no dia ${day}: ${dayEvents.map((e) => e.title).join(', ')}`
                  : undefined
              }
            >
              <span>{day}</span>

              {/* Event Dot Indicator */}
              {hasEvents && (
                <span
                  className={`block w-1.5 h-1.5 rounded-full mt-0.5 ${
                    isSelected ? 'bg-[#E8d8c4]' : 'bg-[#561c24]'
                  }`}
                />
              )}

              {/* Today indicator corner badge */}
              {isToday && !isSelected && (
                <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#561c24] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Info or Viewed Month Summary */}
      <div className="mt-4 pt-3 border-t border-[#c7b7a3]/70">
        {selectedDay && selectedDayEvents.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[#6d2932] font-semibold">
                Eventos do dia {selectedDay} de {monthName} ({viewYear}):
              </span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-[10px] text-[#6d2932] underline hover:text-[#561c24]"
              >
                Limpar filtro
              </button>
            </div>
            <div className="space-y-1.5">
              {selectedDayEvents.map((evt) => {
                const isPastEvent = new Date(evt.dateTime).getTime() < actualNow.getTime();
                return (
                  <div
                    key={evt.id}
                    className="bg-[#E8d8c4] border border-[#c7b7a3] px-3 py-1.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] uppercase px-1 py-0.5 font-mono ${
                          isPastEvent
                            ? 'bg-[#c7b7a3]/40 text-[#6d2932]'
                            : 'bg-[#561c24] text-[#E8d8c4]'
                        }`}
                      >
                        {isPastEvent ? 'Vivido' : 'Futuro'}
                      </span>
                      <span className="font-serif font-medium text-[#561c24] line-clamp-1">
                        {evt.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#6d2932] shrink-0 ml-2">
                      {new Date(evt.dateTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#6d2932]">
            <span>
              {eventsThisMonth.length > 0
                ? `${eventsThisMonth.length} momentos registrados neste mês (${
                    isPastMonth ? 'memórias passadas' : 'planejados'
                  }).`
                : 'Nenhum evento registrado especificamente para este mês.'}
            </span>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-[10px] underline hover:text-[#561c24]"
              >
                Mostrar todos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
