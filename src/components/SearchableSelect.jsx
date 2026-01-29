import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);

    // Update coordinates when opening
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Handle Resize / Scroll to update position
    useEffect(() => {
        const updatePosition = () => {
            if (isOpen && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + window.scrollY + 8,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };

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
                // Check if click is inside the portal dropdown
                const portal = document.getElementById('searchable-select-portal');
                if (portal && !portal.contains(event.target)) {
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

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Portal Content
    const dropdownContent = (
        <div
            id="searchable-select-portal"
            className="fixed z-[9999] bg-white border border-slate-100 rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: '240px'
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
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
            >
                <span className={`block truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder || 'Selecione...'}
                </span>
                <ChevronDown size={20} strokeWidth={1.5} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default SearchableSelect;
