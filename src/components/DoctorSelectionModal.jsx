import React, { useState, useEffect } from 'react';
import { X, User, Check, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DoctorSelectionModal = ({ isOpen, onClose, onConfirm }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDoctors();
            setSelectedDoctorId(''); // Reset selection
        }
    }, [isOpen]);

    const fetchDoctors = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('responsaveis')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDoctors(data || []);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setDoctors([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        const doctor = doctors.find(d => d.id === selectedDoctorId);
        if (doctor) {
            onConfirm(doctor);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header Match Signature Modal */}
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-white/10">
                    <h3 className="font-bold flex items-center gap-2">
                        <User size={18} className="text-[#35b6cf]" />
                        Selecionar Médico Responsável
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 bg-slate-50 space-y-5">

                    <div className="text-center mb-2">
                        <p className="text-sm text-slate-500">
                            Escolha o profissional que assinará o laudo médico no PDF.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 ml-1">
                            Médico / Psicólogo
                        </label>
                        <select
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/20 outline-none transition-all text-sm bg-white"
                            disabled={isLoading}
                        >
                            <option value="">Selecione um profissional...</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedDoctorId || isLoading}
                        className="bg-[#35b6cf] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#2ca0b5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <FileText size={16} />
                        Gerar Laudo PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorSelectionModal;
