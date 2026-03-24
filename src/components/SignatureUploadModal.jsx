import React, { useState, useRef } from 'react';
import { X, Upload, Check, FileText } from 'lucide-react';

const SignatureUploadModal = ({ isOpen, onClose, onSign, loading }) => {
    const [pfxFile, setPfxFile] = useState(null);
    const [password, setPassword] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.name.endsWith('.pfx') || file.name.endsWith('.p12')) {
                setPfxFile(file);
            } else {
                alert('Por favor, selecione um arquivo de certificado válido (.pfx ou .p12).');
            }
        }
    };

    const handleSign = async () => {
        if (!pfxFile || !password) {
            alert('Por favor, selecione o arquivo do certificado e digite a senha.');
            return;
        }

        // Read file as Base64
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            onSign(base64String, password);
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Erro ao ler o arquivo.');
        };
        reader.readAsDataURL(pfxFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[11000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-white/10">
                    <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} className="text-[#35b6cf]" />
                        Assinar Laudo Digitalmente
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 bg-slate-50 space-y-5">
                    {/* File Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 
                            ${pfxFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-[#35b6cf] hover:bg-white'}`}
                    >
                        <input
                            type="file"
                            accept=".pfx,.p12"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {pfxFile ? (
                            <div className="flex flex-col items-center gap-2 text-green-700">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check size={20} />
                                </div>
                                <span className="font-medium text-sm truncate max-w-full px-2">{pfxFile.name}</span>
                                <span className="text-xs opacity-70">Clique para alterar</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-1">
                                    <Upload size={20} />
                                </div>
                                <span className="font-medium text-sm">Selecione o arquivo .PFX ou .P12</span>
                                <span className="text-xs opacity-70">Certificado Digital e-CPF ou e-CNPJ</span>
                            </div>
                        )}
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 ml-1">Senha do Certificado</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/20 outline-none transition-all placeholder:text-slate-400 text-sm"
                            placeholder="Digite a senha..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1 flex items-center gap-1">
                            <LockIcon size={10} /> Sua senha não será salva, apenas usada para assinar agora.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSign}
                        disabled={loading || !pfxFile || !password}
                        className="bg-[#35b6cf] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#2ca0b5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Assinando...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                Assinar e Baixar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LockIcon = ({ size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export default SignatureUploadModal;
