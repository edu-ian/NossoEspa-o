import React, { useEffect, useState } from 'react';
import { EventItem } from '../types';

interface EventCountdownProps {
  event: EventItem;
  onDelete?: (id: string) => void;
  onEdit?: (event: EventItem) => void;
  isCompact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export const EventCountdown: React.FC<EventCountdownProps> = ({
  event,
  onDelete,
  onEdit,
  isCompact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeLeft(event.dateTime));

  function calculateTimeLeft(targetDateStr: string): TimeRemaining {
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, totalSeconds: 0 };
    }

    if (diff <= 0) {
      const pastSeconds = Math.floor(Math.abs(diff) / 1000);
      const days = Math.floor(pastSeconds / (3600 * 24));
      const hours = Math.floor((pastSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((pastSeconds % 3600) / 60);
      const seconds = pastSeconds % 60;
      return { days, hours, minutes, seconds, isPast: true, totalSeconds: pastSeconds };
    }

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return { days, hours, minutes, seconds, isPast: false, totalSeconds: totalSecs };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(event.dateTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [event.dateTime]);

  const eventDate = new Date(event.dateTime);
  const formattedDate = !isNaN(eventDate.getTime())
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(eventDate)
    : event.dateTime;

  const categoryLabels: Record<string, string> = {
    show: 'Show',
    teatro: 'Teatro',
    festival: 'Festival',
    viagem: 'Viagem',
    comemoracao: 'Comemoração',
    outro: 'Evento',
  };

  if (isCompact) {
    return (
      <div className="bg-[#eee2d4] border border-[#c7b7a3] p-4 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#6d2932] font-semibold">
              {categoryLabels[event.category] || event.category}
            </span>
            <h4 className="font-serif text-lg font-medium text-[#561c24] mt-0.5 line-clamp-1">
              {event.title}
            </h4>
            <p className="text-xs text-[#6d2932] mt-0.5">{event.location}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono text-[#561c24] font-medium">
              {timeLeft.isPast ? 'Ocorrido' : `${timeLeft.days}d ${timeLeft.hours}h`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="group bg-[#eee2d4] border border-[#c7b7a3] p-6 sm:p-7 relative transition-all duration-200 hover:border-[#6d2932]">
      {/* Category Tag & Actions */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-block text-[11px] uppercase tracking-widest font-semibold text-[#6d2932] bg-[#E8d8c4] px-2.5 py-1 border border-[#c7b7a3]/60">
            {categoryLabels[event.category] || event.category}
          </span>
          <span className="text-xs text-[#561c24]/70 font-sans">{formattedDate}</span>
        </div>

        {(onDelete || onEdit) && (
          <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="text-xs text-[#6d2932] hover:text-[#561c24] underline-offset-4 hover:underline px-1 py-0.5"
                title="Editar evento"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="text-xs text-[#6d2932]/70 hover:text-[#561c24] underline-offset-4 hover:underline px-1 py-0.5"
                title="Remover evento"
              >
                Remover
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Title and Location */}
      <div className="mb-6">
        <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#561c24] leading-snug tracking-tight">
          {event.title}
        </h3>
        <p className="text-sm sm:text-base text-[#6d2932] mt-1 font-sans">{event.location}</p>
        {event.notes && (
          <p className="text-xs sm:text-sm text-[#561c24]/80 mt-2 italic font-serif">
            "{event.notes}"
          </p>
        )}
      </div>

      {/* Dynamic Real-Time Countdown */}
      <div className="border-t border-[#c7b7a3] pt-5">
        <div className="text-[11px] tracking-wider uppercase text-[#6d2932] font-semibold mb-3">
          {timeLeft.isPast ? 'Tempo decorrido desde o momento' : 'Contagem Regressiva'}
        </div>

        {!timeLeft.isPast ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="bg-[#E8d8c4] border border-[#c7b7a3] py-2.5 px-1.5">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-[#561c24]">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#6d2932] mt-0.5">
                Dias
              </span>
            </div>

            <div className="bg-[#E8d8c4] border border-[#c7b7a3] py-2.5 px-1.5">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-[#561c24]">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#6d2932] mt-0.5">
                Horas
              </span>
            </div>

            <div className="bg-[#E8d8c4] border border-[#c7b7a3] py-2.5 px-1.5">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-[#561c24]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#6d2932] mt-0.5">
                Min
              </span>
            </div>

            <div className="bg-[#E8d8c4] border border-[#c7b7a3] py-2.5 px-1.5">
              <span className="block font-mono text-xl sm:text-2xl font-bold text-[#561c24]">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#6d2932] mt-0.5">
                Seg
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#E8d8c4] border border-[#c7b7a3] p-3 text-center">
            <p className="font-serif text-sm text-[#561c24]">
              {timeLeft.days > 0
                ? `Aconteceu há ${timeLeft.days} ${timeLeft.days === 1 ? 'dia' : 'dias'} e ${timeLeft.hours}h`
                : `Aconteceu há ${timeLeft.hours}h ${timeLeft.minutes}m`}
            </p>
          </div>
        )}

        {/* Human-readable full phrase */}
        <p className="text-xs text-[#6d2932] mt-3 font-sans text-center">
          {timeLeft.isPast
            ? 'Momento registrado na história de vocês.'
            : `Faltam ${timeLeft.days} dias, ${timeLeft.hours} horas e ${timeLeft.minutes} minutos.`}
        </p>
      </div>
    </article>
  );
};
