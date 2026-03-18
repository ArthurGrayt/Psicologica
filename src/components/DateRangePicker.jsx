import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente de Seleção de Data e Intervalo (DateRangePicker)
 * Compatível com react-day-picker v9.
 * Utiliza apenas Tailwind CSS para garantir consistência visual e evitar problemas de carregamento de CSS externo.
 */
const DateRangePicker = ({ value, onChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatação para exibição no botão gatilho
  const formattedDisplay = () => {
    if (!value) return null;
    if (value.from && value.to) {
      if (isSameDay(value.from, value.to)) {
        return format(value.from, "dd/MM/yyyy");
      }
      return `${format(value.from, "dd/MM/yy")} - ${format(value.to, "dd/MM/yy")}`;
    }
    if (value.from) return format(value.from, "dd/MM/yyyy");
    return null;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão Gatilho */}
      <div className="flex flex-col">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Período</label>
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`h-[46px] min-w-[46px] px-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
              isOpen ? 'bg-white text-[#139690] border-[#139690] ring-2 ring-[#139690]/10' : 'text-slate-400 hover:bg-white hover:text-[#139690]'
            }`}
          >
            <CalendarIcon size={18} className={value ? 'text-[#139690]' : ''} />
            {formattedDisplay() && (
              <span className="text-xs font-bold text-[#139690] whitespace-nowrap hidden sm:inline">
                {formattedDisplay()}
              </span>
            )}
          </button>

          {value && (
            <button
              onClick={() => { onClear(); setIsOpen(false); }}
              className="h-[46px] w-[32px] flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Calendário Selecionador */}
      {isOpen && (
        <>
          {/* Fundo escurecido para Mobile */}
          <div className="fixed inset-0 z-[9998] bg-black/40 xl:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="fixed inset-x-4 top-[10%] xl:absolute xl:inset-auto xl:right-0 xl:top-full mt-2 z-[9999] bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 flex flex-col items-center min-w-[320px]">
            
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Filtrar por Data</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* DayPicker v9 - Mapeamento Manual de Classes para Corrigir Layout em Lista */}
            <div className="daypicker-container relative px-2">
              <DayPicker
                mode="range"
                selected={value}
                onSelect={onChange}
                locale={ptBR}
                showOutsideDays
                classNames={{
                  months: "flex flex-col space-y-4 relative",
                  month: "space-y-4",
                  month_caption: "flex justify-center pt-1 relative items-center mb-4 h-10",
                  caption_label: "text-sm font-bold text-slate-700",
                  nav: "flex items-center justify-between absolute w-full top-0 h-10 px-1 pointer-events-none z-10",
                  button_previous: "h-8 w-8 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 transition-colors pointer-events-auto shadow-sm",
                  button_next: "h-8 w-8 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 transition-colors pointer-events-auto shadow-sm",
                  month_grid: "w-full border-collapse space-y-1 table",
                  weekdays: "flex",
                  weekday: "text-slate-400 rounded-md w-10 font-bold text-[10px] uppercase tracking-widest text-center py-2",
                  weeks: "space-y-1",
                  week: "flex w-full mt-1",
                  day: "h-10 w-10 p-0 flex items-center justify-center relative focus-within:z-20",
                  day_button: "h-9 w-9 p-0 font-medium rounded-full flex items-center justify-center hover:bg-slate-100 transition-all text-sm text-slate-600",
                  range_start: "bg-[#139690] rounded-l-full text-white",
                  range_end: "bg-[#139690] rounded-r-full text-white",
                  range_middle: "bg-[#e6f6f5] !text-[#139690] rounded-none",
                  selected: "bg-[#139690] text-white",
                  today: "text-[#139690] font-black underline underline-offset-4",
                  outside: "text-slate-300 opacity-50",
                  disabled: "text-slate-300 opacity-50"
                }}
                components={{
                  IconLeft: () => <ChevronLeft size={20} />,
                  IconRight: () => <ChevronRight size={20} />
                }}
              />
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 w-full flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</span>
                <p className="text-xs text-[#139690] font-bold">
                  {value?.from ? 'Início selecionado' : 'Selecione uma data'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-6 bg-[#139690] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#139690]/20 hover:opacity-90 transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangePicker;
