import React from 'react';
import { X, Download, PenTool, Loader2 } from 'lucide-react';

const PdfPreviewModal = ({ isOpen, onClose, pdfBase64, patientName, onDownload, onSign }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 xl:p-8">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[32px] shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Visualização do Laudo</h2>
                        <p className="text-sm text-slate-400 font-medium">Paciente: {patientName}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* PDF Viewer Body */}
                <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex flex-col items-center justify-center relative">
                    {pdfBase64 ? (
                        <iframe 
                            src={`data:application/pdf;base64,${pdfBase64}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner"
                            title="Visualizador de PDF"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={40} className="animate-spin text-[#139690]" />
                            <p className="text-slate-500 font-medium">Gerando visualização...</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                         Dica: Verifique todos os dados antes de prosseguir com a assinatura.
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={onDownload}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Download size={18} />
                            Baixar PDF
                        </button>
                        
                        <button
                            onClick={onSign}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#139690] text-white font-bold rounded-xl hover:bg-opacity-90 shadow-lg shadow-[#139690]/20 transition-all active:scale-95"
                        >
                            <PenTool size={18} />
                            Assinar Digitalmente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewModal;
