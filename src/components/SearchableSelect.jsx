import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [coords, setCoords] = useState({ top: 'auto', bottom: 'auto', left: 0, width: 0, maxHeight: 240 });
    const dropdownRef = useRef(null);
    const portalRef = useRef(null);

    // Calculate smart positioning
    const updatePosition = () => {
        if (!isOpen || !dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        
        // Window dimensions
        const windowHeight = window.innerHeight;
        
        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        let position = {
            left: rect.left,
            width: rect.width,
            top: 'auto',
            bottom: 'auto',
            maxHeight: 240
        };

        // Decide whether to open down or up based on available space
        if (spaceBelow < 250 && spaceAbove > spaceBelow) {
            // Open upwards
            position.bottom = windowHeight - rect.top + 8;
            position.maxHeight = Math.min(spaceAbove - 16, 240);
        } else {
            // Open downwards
            position.top = rect.bottom + 8;
            position.maxHeight = Math.min(spaceBelow - 16, 240);
        }

        setCoords(position);
    };

    // Update coordinates when opening
    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen]);

    // Handle Resize / Scroll to update position
    useEffect(() => {
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // true for capture to catch nested scrolls

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (portalRef.current && !portalRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option =>
        (option.label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option.value === value);

    const toggleDropdown = () => {
        if (!isOpen) {
            // position is updated via useEffect
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Portal Content
    const dropdownContent = (
        <div
            ref={portalRef}
            className="fixed z-[9999] bg-white border border-slate-100 rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in duration-200"
            style={{
                top: coords.top !== 'auto' ? coords.top : undefined,
                bottom: coords.bottom !== 'auto' ? coords.bottom : undefined,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight
            }}
        >
            {options.length > 5 && (
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            <div className="overflow-y-auto flex-1 py-1.5 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                        <div
                            key={option.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(option.value);
                            }}
                            className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between transition-colors ${option.value === value
                                ? 'bg-slate-50 text-brand-primary font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <span className="align-middle">{option.label}</span>
                            {option.value === value && <Check size={14} strokeWidth={1.5} className="text-brand-primary" />}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
                        Nenhum resultado encontrado
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => !disabled && toggleDropdown()}
                className={`w-full h-[46px] bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
                    } ${isOpen ? 'ring-2 ring-cyan-500/10 border-cyan-500/50 bg-white' : 'shadow-sm'}`}
            >
                <span className={`block truncate text-sm font-medium ${selectedOption ? 'text-slate-700' : 'text-slate-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder || 'Selecione...'}
                </span>
                <ChevronDown size={18} strokeWidth={2} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
            </div>

            {isOpen && coords.width > 0 && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default SearchableSelect;
