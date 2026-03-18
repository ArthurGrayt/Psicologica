import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calendar, X, Save, User, Building, Briefcase, MapPin, ChevronLeft, FileText, Users, CheckSquare, Square, Link as LinkIcon, Copy, ExternalLink, CheckCircle, Lock, QrCode, Trash2 } from 'lucide-react';
import DashboardTable from '../components/DashboardTable';
import { QRCodeCanvas } from 'qrcode.react';
import { useCompanyData } from '../hooks/useCompanyData';
import SearchableSelect from '../components/SearchableSelect';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../services/pdfReportGenerator';
import SignatureUploadModal from '../components/SignatureUploadModal';
import DoctorSelectionModal from '../components/DoctorSelectionModal';
import DateRangePicker from '../components/DateRangePicker';
import { generateNarrative } from '../utils/narrativeLogic';
import logoGamaUrl from '../assets/logo-gama.png';

const Dashboard = () => {
    // Estado Mockado Removido. Apenas dados reais.
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]); // State for filtered results
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Advanced Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        name: '',
        company: '',
        role: '',
        sector: '',
        date: '',
        status: '',
        locked: 'all' // all, locked, unlocked
    });

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [activeEditTab, setActiveEditTab] = useState('data'); // 'data' | 'analysis'
    const [isMultipleModalOpen, setIsMultipleModalOpen] = useState(false);

    // Form Generation State
    const [generatedLink, setGeneratedLink] = useState(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);

    // State for Quick Create Collaborator
    const [isCreatingCollaborator, setIsCreatingCollaborator] = useState(false);

    // Signature Modal State
    const [isSigModalOpen, setIsSigModalOpen] = useState(false);
    const [patientToSign, setPatientToSign] = useState(null);
    const [isSigningLoading, setIsSigningLoading] = useState(false);

    // Doctor Selection Modal State (For Report Generation)
    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
    const [selectedPatientForReport, setSelectedPatientForReport] = useState(null);

    // Hook de Dados de Empresa
    const { companies, units, fetchUnits } = useCompanyData();

    // Transform options for SearchableSelect
    const companyOptions = companies.map(c => ({ label: c.nome_fantasia, value: c.id }));
    const unitOptions = units.map(u => ({ label: u.nome_unidade, value: u.id }));

    // States for Multiple Insertion
    const [multipleInsertion, setMultipleInsertion] = useState({ company: '', unit: '' });

    const [availableCollaborators, setAvailableCollaborators] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);

    // Reference Data for Dropdowns
    const [roles, setRoles] = useState([]);
    const [sectors, setSectors] = useState([]);

    // New Collaborator Form State
    const [newCollaborator, setNewCollaborator] = useState({
        name: '',
        cpf: '',
        sexo: '', // M or F
        data_nascimento: '', // YYYY-MM-DD
        roleId: '', // ID do cargo
        sectorId: '' // ID do setor
    });

    const roleOptions = roles.map(r => ({ label: r.nome || r.nome_cargo || 'Cargo sem nome', value: r.id }));
    const sectorOptions = sectors.map(s => ({ label: s.nome || s.nome_setor || 'Setor sem nome', value: s.id }));

    // Fetch Params (Cargos e Setores)
    React.useEffect(() => {
        const fetchParams = async () => {
            try {
                const [rolesRes, sectorsRes] = await Promise.all([
                    supabase.from('cargos').select('*'),
                    supabase.from('setor').select('*')
                ]);

                if (rolesRes.error) throw rolesRes.error;
                if (sectorsRes.error) throw sectorsRes.error;

                setRoles(rolesRes.data || []);
                setSectors(sectorsRes.data || []);
            } catch (err) {
                console.error('Erro ao carregar parâmetros (cargos/setores):', err);
            }
        };
        fetchParams();
    }, []);
    // Fetch Patients from DB
    const fetchPatients = async () => {
        // Define o estado de carregamento como verdadeiro e limpa erros anteriores
        setIsLoading(true);
        setFetchError(null);
        console.log('--- INICIANDO FETCH PATIENTS EXCLUSIVO VIA TABELA PATIENTS ---');
        try {
            // 1. Busca dados diretamente da tabela 'patients' com joins para cargos, setores e colaboradores
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select(`
                    id,
                    uuid_colab,
                    name,
                    status,
                    assinatura,
                    created_at,
                    role_id,
                    sector_id,
                    cargos:role_id (nome),
                    setor:sector_id (nome),
                    colaboradores:uuid_colab (
                        cpf,
                        sexo,
                        data_nascimento,
                        unidade (
                            nome_unidade,
                            clientes:empresaid (nome_fantasia)
                        )
                    )
                `);

            // Verifica se houve erro na busca de pacientes
            if (patientsError) {
                console.error('Erro ao buscar pacientes:', patientsError);
                throw patientsError;
            }

            // Se não houver pacientes, limpa a lista e encerra
            if (!patientsData || patientsData.length === 0) {
                console.warn('Nenhum paciente encontrado na tabela patients.');
                setPatients([]);
                setFilteredPatients([]);
                return;
            }

            // 2. Busca avaliações (assessments) vinculadas a esses pacientes (via uuid_colab)
            const patientUuids = patientsData.map(p => p.uuid_colab).filter(Boolean);
            const { data: assessmentsData, error: assessmentsError } = await supabase
                .from('assessments')
                .select('id, patient_id, status, locked, created_at')
                .in('patient_id', patientUuids);

            // Verifica se houve erro na busca de avaliações
            if (assessmentsError) {
                console.error('Erro ao buscar avaliações:', assessmentsError);
            }

            // 3. Mapeamento final dos dados para exibição no Dashboard
            const mappedPatients = patientsData.map(p => {
                // Resolve o nome do cargo e setor usando os joins realizados
                const cargoNome = p.cargos ? (p.cargos.nome || 'Cargo') : 'Sem Cargo';
                const setorNome = p.setor ? (p.setor.nome || 'Setor') : 'Sem Setor';
                
                // Formata a data de criação do registro no formato de exibição
                const dateObj = new Date(p.created_at || new Date());
                const day = dateObj.getDate().toString().padStart(2, '0');
                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const month = months[dateObj.getMonth()];
                const year = dateObj.getFullYear();
                const dateStr = `${day} ${month} ${year}`;

                // Busca avaliações correspondentes a este paciente (usando uuid_colab)
                const patientAssessments = (assessmentsData || []).filter(a => a.patient_id === p.uuid_colab);
                let latestAssessment = null;
                if (patientAssessments.length > 0) {
                    // Ordena para pegar a avaliação mais recente
                    latestAssessment = patientAssessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                }

                // Resolve dados detalhados via join com colaboradores
                const colab = p.colaboradores || {};
                const empresaName = (colab.unidade?.clientes?.nome_fantasia || '').trim();
                const unidadeName = (colab.unidade?.nome_unidade || '').trim();
                
                let companyFull = '—';
                if (empresaName) {
                    if (unidadeName && unidadeName !== empresaName) {
                        companyFull = `${empresaName} (${unidadeName})`;
                    } else {
                        companyFull = empresaName;
                    }
                }

                // Formatação da data de nascimento para exibição em PT-BR
                let formattedNasc = '—';
                if (colab.data_nascimento) {
                    const d = new Date(colab.data_nascimento);
                    if (!isNaN(d.getTime())) {
                        formattedNasc = d.toLocaleDateString('pt-BR');
                    }
                }

                // Retorna o objeto formatado para a tabela (com dados restaurados)
                return {
                    id: p.id,
                    uuid_colab: p.uuid_colab,
                    name: p.name,
                    company: companyFull, 
                    cpf: colab.cpf || '—',     
                    sexo: colab.sexo ? colab.sexo.charAt(0).toUpperCase() : '—',    
                    nascimento: formattedNasc,
                    role: cargoNome,
                    sector: setorNome,
                    date: dateStr,
                    raw_date: p.created_at,
                    status: latestAssessment ? latestAssessment.status : (p.status || 'Pendente'),
                    assessmentId: latestAssessment ? latestAssessment.id : null,
                    locked: latestAssessment ? latestAssessment.locked : false,
                    assinatura: p.assinatura
                };
            });

            // Atualiza os estados de pacientes carregados e filtrados
            console.log('Pacientes carregados via Tabela Patients:', mappedPatients);
            setPatients(mappedPatients);
            setFilteredPatients(mappedPatients);
        } catch (err) {
            // Loga o erro caso ocorra qualquer exceção durante o processo
            console.error('EXCEÇÃO em fetchPatients:', err);
            setFetchError(err.message);
        } finally {
            // Finaliza o estado de carregamento
            setIsLoading(false);
            console.log('--- FINALIZADO FETCH PATIENTS ---');
        }
    };

    // Load on Mount
    React.useEffect(() => {
        fetchPatients();
    }, []);

    // Search & Filter Effect
    React.useEffect(() => {
        let result = [...patients];

        // 1. General Search Term (matches any field)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p => {
                const matchName = p.name?.toLowerCase().includes(lowerTerm);
                const matchCompany = p.company?.toLowerCase().includes(lowerTerm);
                const matchRole = p.role?.toLowerCase().includes(lowerTerm);
                const matchSector = p.sector?.toLowerCase().includes(lowerTerm);
                const matchDate = p.date?.toLowerCase().includes(lowerTerm);
                const matchCpf = p.cpf?.toString().toLowerCase().includes(lowerTerm);
                const matchNasc = p.nascimento?.toString().toLowerCase().includes(lowerTerm);
                const matchSexo = p.sexo?.toString().toLowerCase().includes(lowerTerm);

                let statusTerm = '';
                if (p.status === 'pending') statusTerm = 'pendente';
                if (p.status === 'in_progress') statusTerm = 'em progresso análise';
                if (p.status === 'completed') statusTerm = 'concluído finalizado';
                const matchStatus = statusTerm.includes(lowerTerm) || p.status?.toLowerCase().includes(lowerTerm);

                return matchName || matchCompany || matchRole || matchSector || matchDate || matchStatus || matchCpf || matchNasc || matchSexo;
            });
        }

        // 2. Specific Advanced Filters (AND logic)
        if (filters.name) {
            result = result.filter(p => p.name?.toLowerCase().includes(filters.name.toLowerCase()));
        }
        if (filters.company) {
            result = result.filter(p => p.company === filters.company);
        }
        if (filters.role) {
            result = result.filter(p => p.role === filters.role);
        }
        if (filters.sector) {
            result = result.filter(p => p.sector === filters.sector);
        }
        if (filters.date) {
            const { from, to } = filters.date;
            result = result.filter(p => {
                const pDate = new Date(p.raw_date);
                if (from && to) {
                    // Normalize para comparar apenas as datas (sem considerar hora)
                    const start = new Date(from.setHours(0, 0, 0, 0));
                    const end = new Date(to.setHours(23, 59, 59, 999));
                    return pDate >= start && pDate <= end;
                }
                if (from) {
                    const singleDate = new Date(from.setHours(0, 0, 0, 0));
                    const pDateNormalized = new Date(pDate.setHours(0, 0, 0, 0));
                    return pDateNormalized.getTime() === singleDate.getTime();
                }
                return true;
            });
        }
        if (filters.status) {
            result = result.filter(p => p.status === filters.status);
        }
        if (filters.locked !== 'all') {
            const shouldBeLocked = filters.locked === 'locked';
            result = result.filter(p => p.locked === shouldBeLocked);
        }

        setFilteredPatients(result);
    }, [searchTerm, patients, filters]);

    // Reset page when filters or search term change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters]);

    // Calculate Paginated Data (Outside useEffect for reactivity)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

    // Handler for Report Generation (Normal and Signed)
    const handleGenerateReportTrigger = (patient, isSigned = false) => {
        if (isSigned) {
            setPatientToSign(patient);
            setIsSigModalOpen(true);
        } else {
            // New Flow: Select Doctor first
            setSelectedPatientForReport(patient);
            setIsDoctorModalOpen(true);
        }
    };

    const handleDoctorConfirm = (doctor) => {
        if (selectedPatientForReport) {
            generateReportLogic(selectedPatientForReport, doctor);
            setSelectedPatientForReport(null); // Clear after generating
        }
    };

    const handleSignAndDownload = async (pfxBase64, password) => {
        if (!patientToSign) return;
        setIsSigningLoading(true);
        try {
            console.log('Generating PDF base64...');
            // Need to fetch full patient data/assessment like in normal report generation?
            // The existing generateReportLogic likely fetches data. I should reuse it or copy relevant parts.
            // Let's assume I can call a helper that gets the data.
            // Actually, I need to see the existing `onGenerateReport` passed to `DashboardTable`.
            // Searching for `<DashboardTable` in this file...

            // Wait, I can't see the render part in lines 1-600.
            // I'll implement this helper assuming I have access to the same data fetching logic.
            // I will implement `generateReportData` helper.

            const { pdfBase64, patientName } = await generateReportData(patientToSign, true);

            console.log('Sending to Edge Function...');
            const { data, error } = await supabase.functions.invoke('sign-pdf', {
                body: {
                    pdf_base64: pdfBase64,
                    pfx_base64: pfxBase64,
                    pfx_password: password
                }
            });

            if (error) {
                let errorMessage = "Falha desconhecida";
                try {
                    const errorBody = await error.context?.json();
                    if (errorBody && errorBody.error) {
                        errorMessage = `${errorBody.error} (Detalhes: ${errorBody.details || ''})`;
                    } else {
                        errorMessage = error.message;
                    }
                } catch (e) {
                    errorMessage = error.message;
                }
                throw new Error(errorMessage);
            }

            if (data.error) throw new Error(data.details || data.error);

            // Convert Base64 response to Blob
            const binaryString = window.atob(data.signed_pdf_base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });

            // Download Blob
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${patientName.replace(/\s+/g, '_')}_Laudo_Assinado.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setIsSigModalOpen(false);
            setPatientToSign(null);

        } catch (err) {
            console.error('Error signing PDF:', err);
            // Show more detailed error if available
            alert('Erro ao assinar: ' + (err.message || 'Falha desconhecida'));
        } finally {
            setIsSigningLoading(false);
        }
    };

    // Existing helper refactor needed here?
    // I'll add the `generateReportData` function here.

    const generateReportData = async (patient, returnBase64 = false, doctor = null) => {
        // Busca a avaliação específica vinculada ao paciente
        let assessment = null;
        
        if (patient.assessmentId) {
            // Se já temos o ID da avaliação (vindo do Dashboard), buscamos direto por ele
            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .eq('id', patient.assessmentId)
                .maybeSingle(); // maybeSingle não joga erro 406 se não encontrar
            
            assessment = data;
            if (error) console.error('Erro ao buscar avaliação por ID:', error);
        }

        // Fallback: Busca pela última avaliação do patient_id (comportamento legado ou contingência)
        if (!assessment) {
            const { data, error } = await supabase
                .from('assessments')
                .select('*')
                .eq('patient_id', patient.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            assessment = data;
            if (error) console.error('Erro ao buscar avaliação por Patient ID:', error);
        }

        if (!assessment) throw new Error("Não foi encontrada nenhuma avaliação iniciada para este paciente.");

        // Fetch Answers
        const { data: answers } = await supabase
            .from('answers')
            .select('*')
            .eq('assessment_id', assessment.id);

        // Fetch Questions
        const { data: questions } = await supabase
            .from('questions')
            .select(`
                id, text, category_key,
                categories:category_key (name)
            `);

        let narrativeData = null;
        try {
            console.log('Calculating narrative client-side...');
            narrativeData = generateNarrative(assessment, answers, questions);
        } catch (err) {
            console.error('Error in client-side narrative generation:', err);
            narrativeData = {
                intro: "Não foi possível gerar a análise detalhada.",
                full_analysis: "Erro de processamento.",
                status_label: "EM ANÁLISE",
                is_apto: true
            };
        }

        // Load Logo Base64
        let logoBase64 = null;
        try {
            const response = await fetch(logoGamaUrl);
            const blob = await response.blob();
            logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error loading logo:', error);
        }

        const options = doctor ? { doctor } : {};
        if (returnBase64) {
            options.returnBase64 = true;
            const b64 = generatePDF(patient, assessment, answers, questions, logoBase64, narrativeData, options);
            return { pdfBase64: b64, patientName: patient.name };
        } else {
            generatePDF(patient, assessment, answers, questions, logoBase64, narrativeData, options);
        }
    };

    // Replace the old onGenerateReport in render logic logic. 
    // Since I can't see the render, I'll assume I have to replace where it's defined or passed.
    // I'll insert these handlers here.

    const generateReportLogic = (patient, doctor = null) => generateReportData(patient, false, doctor);

    // Unique values for dropdowns
    const uniqueOptions = {
        companies: [...new Set(patients.map(p => p.company))].filter(Boolean).sort(),
        roles: [...new Set(patients.map(p => p.role))].filter(Boolean).sort(),
        sectors: [...new Set(patients.map(p => p.sector))].filter(Boolean).sort(),
        statuses: [...new Set(patients.map(p => p.status))].filter(Boolean).sort()
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            company: '',
            role: '',
            sector: '',
            date: '',
            status: '',
            locked: 'all'
        });
        setSearchTerm('');
    };

    // Handlers
    const handleSort = (key, direction) => {
        const sorted = [...filteredPatients].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setFilteredPatients(sorted);
    };

    const handleSaveEdit = async () => {
        if (!selectedPatient) return;
        try {
            console.log('--- SALVANDO EDIÇÃO ---', selectedPatient);
            // 1. Atualizar Tabela Patients (Nome)
            // Agora atualizamos exclusivamente na tabela patients
            const { error: pError } = await supabase
                .from('patients')
                .update({
                    name: selectedPatient.name
                })
                .eq('id', selectedPatient.id);

            if (pError) throw pError;

            setSelectedPatient(null);
            fetchPatients();
            alert('Dados atualizados com sucesso!');
        } catch (err) {
            console.error('Erro ao atualizar paciente:', err.message);
            alert('Erro ao atualizar: ' + err.message);
        }
    };

    const handleUpdatePatient = (field, value) => {
        if (!selectedPatient) return;
        const updated = { ...selectedPatient, [field]: value };
        setSelectedPatient(updated);
        // Update both lists
        setPatients(patients.map(p => p.id === updated.id ? updated : p));
        // Filtered will update via Effect or valid re-render, but usually better to update state source
    };

    const handleDeletePatient = async (id) => {
        try {
            // Deletar o paciente diretamente da tabela patients
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Atualizar estado local
            // Atualizar estado local
            const newPatients = patients.filter(p => p.id !== id);
            setPatients(newPatients);
            // setFilteredPatients will auto-update via Effect if we depended on patients, 
            // but we added it to dependency array so it should trigger.

            // alert('Paciente excluído com sucesso.'); 
            // Opcional: Toast notification

        } catch (err) {
            console.error('Erro ao excluir paciente:', err);
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Handler: Toggle Lock
    const handleToggleLock = async (patientId, assessmentId, currentLockState) => {
        if (!assessmentId) {
            alert('Este paciente não possui uma avaliação criada para travar/liberar.');
            return;
        }

        try {
            const newLockState = !currentLockState;

            const { error } = await supabase
                .from('assessments')
                .update({ locked: newLockState })
                .eq('id', assessmentId);

            if (error) throw error;

            // Update Local State Optimistically
            setPatients(prev => prev.map(p => {
                if (p.id === patientId) {
                    return { ...p, locked: newLockState };
                }
                return p;
            }));

        } catch (err) {
            console.error('Error toggling lock:', err);
            alert('Erro ao alterar status de bloqueio: ' + err.message);
        }
    };

    // Handler: Generate Assessment Link
    const handleGenerateAssessment = async (patientId) => {
        try {
            // 1. Create Assessment
            const { data, error } = await supabase
                .from('assessments')
                .insert({
                    patient_id: patientId,
                    status: 'sent', // Changed to 'sent' (Enviado)
                    locked: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Generate Link
            const link = `${window.location.origin}/quiz/${data.id}`;
            setGeneratedLink(link);
            setIsLinkModalOpen(true);

            // Refresh list to pick up the new assessment
            fetchPatients();

        } catch (err) {
            console.error('Error generating assessment:', err);
            alert('Erro ao gerar link: ' + err.message);
        }
    };

    // Handler Create Collaborator (Quick)
    const handleCreateCollaborator = async () => {
        // Validação básica
        if (!newCollaborator.name.trim() || !multipleInsertion.unit) {
            alert('Nome e Unidade são obrigatórios.');
            return;
        }

        try {
            const unitId = Number(multipleInsertion.unit);
            console.log(`Criando Colaborador Completo:`, newCollaborator, `Unidade: ${unitId}`);

            const payload = {
                nome: newCollaborator.name,
                unidade: unitId,
                avulso: true,
                cpf: newCollaborator.cpf || null,
                sexo: newCollaborator.sexo || null,
                data_nascimento: newCollaborator.data_nascimento || null,
                cargo: newCollaborator.roleId || null,
                setorid: newCollaborator.sectorId || null
            };

            const { data, error } = await supabase
                .from('colaboradores')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            console.log('Colaborador criado:', data);

            // 2. Criar registro correspondente na tabela 'patients' para que apareça no Dashboard
            const { error: patientError } = await supabase
                .from('patients')
                .insert({
                    uuid_colab: data.id,
                    name: data.nome,
                    role_id: data.cargo,
                    sector_id: data.setorid,
                    status: 'Pendente'
                });

            if (patientError) {
                console.error('Erro ao criar registro em patients:', patientError);
            }

            // Reset
            setNewCollaborator({ name: '', cpf: '', sexo: '', data_nascimento: '', roleId: '', sectorId: '' });
            setIsCreatingCollaborator(false);

            // Refresh list
            handleSearchCollaborators();
            alert('Colaborador adicionado com sucesso!');

        } catch (err) {
            console.error('Erro ao criar colaborador:', err.message);
            alert('Erro ao criar: ' + err.message);
        }
    };



    // Handlers para Multiple Insertion Dropdowns
    const handleMultipleCompanyChange = (value) => {
        setMultipleInsertion({ ...multipleInsertion, company: value, unit: '' });
        fetchUnits(value);
        setAvailableCollaborators([]);
    };

    const handleMultipleUnitChange = (value) => {
        setMultipleInsertion({ ...multipleInsertion, unit: value });
    };

    const handleSearchCollaborators = async () => {
        if (!multipleInsertion.unit) {
            console.log('handleSearch: Nenhuma unidade selecionada.');
            return;
        }

        const unitIdRaw = multipleInsertion.unit;
        const unitId = Number(unitIdRaw);

        console.log(`--- INICIANDO BUSCA DE COLABORADORES ---`);
        console.log(`Unidade Selecionada (Raw):`, unitIdRaw, `(Type: ${typeof unitIdRaw})`);
        console.log(`Unidade Selecionada (Number):`, unitId, `(Type: ${typeof unitId})`);

        try {
            // BUSCA 1: Tentar buscar TUDO dessa unidade sem JOINS para ver se existe algo
            const { count, error: countError } = await supabase
                .from('colaboradores')
                .select('*', { count: 'exact', head: true })
                .eq('unidade', unitId);

            if (countError) console.error('Erro ao contar colaboradores da unidade:', countError);
            console.log(`Verificação Inicial: Existem ${count} colaboradores com unidade=${unitId}`);

            if (count === 0) {
                console.warn('ALERTA: Nenhum colaborador encontrado para este ID de unidade na tabela colaboradores.');
                // Não vou retornar aqui para permitir mostrar a UI vazia onde tem o botão de adicionar
                setAvailableCollaborators([]);
                // return; 
            }

            // BUSCA 2: Busca completa com Joins
            console.log('Executando query completa com Joins...');

            const { data, error } = await supabase
                .from('colaboradores')
                .select(`
                    id, 
                    nome, 
                    cargo, 
                    setorid,
                    cargos:cargo (*),      
                    setor:setorid (*)
                `)
                .eq('unidade', unitId);

            if (error) {
                console.error('ERRO SUPABASE (Query Completa):', error);
                throw error;
            }

            console.log('DADOS RETORNADOS (Query Completa):', data);

            // Mapeamento
            const mapped = (data || []).map(c => {
                const cargoObj = c.cargos;
                const setorObj = c.setor;

                const cargoNome = cargoObj ? (cargoObj.nome || 'Cargo') : (c.cargo ? `ID: ${c.cargo}` : 'Sem Cargo');
                const setorNome = setorObj ? (setorObj.nome || 'Setor') : (c.setorid ? `ID: ${c.setorid}` : 'Sem Setor');

                return {
                    id: c.id,
                    name: c.nome,
                    role: cargoNome,
                    sector: setorNome,
                    originalData: c
                };
            });

            console.log(`Mapeamento concluído. ${mapped.length} itens prontos para exibir.`);
            setAvailableCollaborators(mapped);

        } catch (err) {
            console.error('EXCEÇÃO em handleSearchCollaborators:', err);
            console.error('Mensagem:', err.message);
        }
    };

    // Trigger busca quando Unit está selecionada
    React.useEffect(() => {
        if (isMultipleModalOpen && multipleInsertion.unit) {
            handleSearchCollaborators();
        }
    }, [multipleInsertion.company, multipleInsertion.unit, isMultipleModalOpen]);


    // --- Narrative Preview Logic (Side Panel) ---
    const [narrativePreview, setNarrativePreview] = useState({ loading: false, data: null, error: null });

    useEffect(() => {
        let isMounted = true;

        async function fetchNarrative() {
            if (!selectedPatient || !selectedPatient.assessmentId) {
                setNarrativePreview({ loading: false, data: null, error: null });
                return;
            }

            setNarrativePreview({ loading: true, data: null, error: null });

            try {
                const { data, error } = await supabase
                    .rpc('get_narrative_report', { target_assessment_id: selectedPatient.assessmentId });

                if (isMounted) {
                    if (error) throw error;
                    setNarrativePreview({ loading: false, data, error: null });
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching preview:', err);
                    setNarrativePreview({
                        loading: false,
                        data: null,
                        error: "Não foi possível carregar a análise. (Erro RPC ou Banco de Dados)"
                    });
                }
            }
        }

        fetchNarrative();

        return () => { isMounted = false; };
    }, [selectedPatient?.assessmentId]); // Depend on ID to re-fetch on mount/change



    const toggleCollaboratorSelection = (id) => {
        if (selectedCollaborators.includes(id)) {
            setSelectedCollaborators(selectedCollaborators.filter(cId => cId !== id));
        } else {
            setSelectedCollaborators([...selectedCollaborators, id]);
        }
    };

    const handleImportCollaborators = async () => {
        try {
            const selectedCols = availableCollaborators.filter(c => selectedCollaborators.includes(c.id));

            // Preparar payload para tabela 'agendamentos'
            // A partir de agora, "Importar" significa criar um agendamento de Avaliação Psicológica
            const inserts = selectedCols.map(c => ({
                colaborador_id: c.id,
                exames_snapshot: ['Avaliação Psicológica'],
                status: 'pendente',
                unidade: Number(multipleInsertion.unit) || null
            }));

            console.log('Criando agendamentos para pacientes:', inserts);

            const { error } = await supabase
                .from('agendamentos')
                .insert(inserts);

            if (error) throw error;

            // 2. Sincronizar com a tabela 'patients'
            // Criamos ou atualizamos registros em 'patients' para cada colaborador importado
            const patientInserts = selectedCols.map(c => ({
                uuid_colab: c.id,
                name: c.name || c.nome,
                role_id: (c.originalData?.cargo) || c.role_id || null,
                sector_id: (c.originalData?.setorid) || c.sector_id || null,
                status: 'Pendente'
            }));

            console.log('Sincronizando tabela patients:', patientInserts);

            const { error: patientError } = await supabase
                .from('patients')
                .upsert(patientInserts, { onConflict: 'uuid_colab' });

            if (patientError) {
                console.error('Erro ao sincronizar com patients:', patientError);
            }

            // Sucesso
            setIsMultipleModalOpen(false);
            setMultipleInsertion({ company: '', unit: '' });
            setAvailableCollaborators([]);
            setSelectedCollaborators([]);

            // Recarregar Dados Reais
            fetchPatients();

        } catch (err) {
            console.error('Erro ao importar pacientes:', err.message);
            alert('Erro ao importar: ' + err.message);
        }
    };


    return (
        <div className="flex flex-col h-full gap-6 relative">



            {/* Modal de Inserção Múltipla */}
            {isMultipleModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-10 animate-fadeIn">
                    <div
                        className={`bg-white rounded-[32px] p-5 md:p-8 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col max-h-[75vh] md:max-h-[90vh] overflow-hidden ${isCreatingCollaborator ? 'w-full max-w-6xl' : 'w-full max-w-2xl'
                            }`}
                    >
                        {/* DEBUG LOG */}
                        {console.log('[RENDER] Modal. isCreatingCollaborator:', isCreatingCollaborator)}

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                {isCreatingCollaborator && (
                                    <button
                                        onClick={() => setIsCreatingCollaborator(false)}
                                        className="lg:hidden p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors bg-slate-100"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                <h2 className="text-2xl font-bold text-slate-800">Inserir Paciente</h2>
                            </div>
                            <button onClick={() => setIsMultipleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex gap-8 flex-1 overflow-hidden relative">
                            {/* LADO ESQUERDO: Busca e Lista */}
                            <div className={`flex-1 flex flex-col space-y-6 overflow-hidden transition-all duration-300 ${isCreatingCollaborator ? 'hidden lg:flex' : 'flex'}`}>
                                {/* Seleção de Contexto */}
                                <div className="grid grid-cols-2 gap-4 p-1">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                                        <SearchableSelect
                                            options={companyOptions}
                                            value={multipleInsertion.company}
                                            onChange={handleMultipleCompanyChange}
                                            placeholder="Buscar Empresa..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                        <SearchableSelect
                                            options={unitOptions}
                                            value={multipleInsertion.unit}
                                            onChange={handleMultipleUnitChange}
                                            placeholder="Buscar Unidade..."
                                            disabled={!multipleInsertion.company}
                                        />
                                    </div>
                                </div>

                                {/* Lista de Colaboradores */}
                                <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col relative transition-all">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <h3 className="font-semibold text-slate-700">Colaboradores Encontrados</h3>
                                        <div className="text-xs text-slate-500">
                                            {selectedCollaborators.length} selecionados
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1 min-h-0">
                                        {availableCollaborators.length > 0 ? (
                                            availableCollaborators.map((collab) => (
                                                <div
                                                    key={collab.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedCollaborators.includes(collab.id) ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                                    onClick={() => toggleCollaboratorSelection(collab.id)}
                                                >
                                                    <div className={`text-slate-400 ${selectedCollaborators.includes(collab.id) ? 'text-blue-600' : ''}`}>
                                                        {selectedCollaborators.includes(collab.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-800">{collab.name}</div>
                                                        <div className="text-xs text-slate-500">{collab.role} • {collab.sector}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                                <Users size={32} className="mb-2 opacity-50" />
                                                {multipleInsertion.company && multipleInsertion.unit ? (
                                                    <p className="text-sm">Nenhum colaborador encontrado.</p>
                                                ) : (
                                                    <p className="text-sm">Selecione Empresa e Unidade para buscar.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botão de Expandir (Rodapé da lista) */}
                                    {multipleInsertion.unit && !isCreatingCollaborator && (
                                        <div className="border-t border-slate-100 p-3 bg-slate-50 animate-fadeIn">
                                            <button
                                                onClick={() => {
                                                    console.log('[UI] Clicked Include Manual. Setting state true.');
                                                    setIsCreatingCollaborator(true);
                                                }}
                                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm hover:bg-white hover:border-slate-400 hover:text-slate-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} />
                                                Não encontrou? Incluir manualmente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* LADO DIREITO: Formulário de Criação (Condicional) */}
                            {console.log('[RENDER] Right Side Block. Visible?', isCreatingCollaborator)}
                            <div className={`
                                flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col
                                transition-all duration-500 ease-in-out transform origin-left
                                ${isCreatingCollaborator ? 'opacity-100 translate-x-0 lg:w-1/2 flex' : 'opacity-0 -translate-x-10 w-0 hidden'}
                            `}>

                                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo *</label>
                                        <input
                                            type="text"
                                            value={newCollaborator.name}
                                            onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Nome do colaborador"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">CPF</label>
                                        <input
                                            type="text"
                                            value={newCollaborator.cpf}
                                            onChange={(e) => setNewCollaborator({ ...newCollaborator, cpf: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Nascimento</label>
                                            <input
                                                type="date"
                                                value={newCollaborator.data_nascimento}
                                                onChange={(e) => setNewCollaborator({ ...newCollaborator, data_nascimento: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Sexo</label>
                                            <select
                                                value={newCollaborator.sexo}
                                                onChange={(e) => setNewCollaborator({ ...newCollaborator, sexo: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all appearance-none"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="M">Masculino</option>
                                                <option value="F">Feminino</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                                            <SearchableSelect
                                                options={roleOptions}
                                                value={newCollaborator.roleId}
                                                onChange={(val) => setNewCollaborator({ ...newCollaborator, roleId: val })}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                                            <SearchableSelect
                                                options={sectorOptions}
                                                value={newCollaborator.sectorId}
                                                onChange={(val) => setNewCollaborator({ ...newCollaborator, sectorId: val })}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3">
                                    <button
                                        onClick={() => setIsCreatingCollaborator(false)}
                                        className="w-full md:w-auto px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors order-2 md:order-1"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateCollaborator}
                                        className="w-full md:w-auto px-8 py-3 bg-[#139690] text-white font-bold rounded-xl hover:bg-opacity-90 shadow-lg shadow-[#139690]/20 transition-all active:scale-95 order-1 md:order-2"
                                    >
                                        Cadastrar Colaborador
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`mt-4 flex gap-3 pt-4 border-t border-slate-100 flex-shrink-0 ${isCreatingCollaborator ? 'hidden lg:flex' : 'flex'}`}>
                            <button
                                onClick={() => setIsMultipleModalOpen(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={handleImportCollaborators}
                                disabled={selectedCollaborators.length === 0}
                                className="flex-1 py-3 bg-[#139690] text-white rounded-xl font-bold hover:bg-opacity-90 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Importar ({selectedCollaborators.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* 1. Card Superior (Filtros e Busca) */}
            <div className="xl:bg-white xl:p-5 xl:rounded-[32px] xl:shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 transition-all duration-500 xl:mb-0">
                <div className="flex items-center gap-3 w-full xl:w-auto">
                        {selectedPatient ? (
                            <div className="flex flex-col gap-4 w-full">
                                <button
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setActiveEditTab('data');
                                    }}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                                >
                                    <div className="bg-slate-100 p-2 rounded-full">
                                        <ChevronLeft size={20} />
                                    </div>
                                    <span>Voltar para Lista</span>
                                </button>

                                {/* Tabs Mobile/Tablet - Paciente */}
                                <div className="xl:hidden flex p-1 bg-slate-100 rounded-2xl w-full">
                                    <button
                                        onClick={() => setActiveEditTab('data')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeEditTab === 'data' ? 'bg-white text-[#139690] shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Editar Paciente
                                    </button>
                                    <button
                                        onClick={() => setActiveEditTab('analysis')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeEditTab === 'analysis' ? 'bg-white text-[#139690] shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Análise Psicossocial
                                    </button>
                                </div>
                            </div>
                        ) : (
                        <div className="flex gap-3 w-full xl:w-auto">
                            <div className="relative flex-1 xl:w-96 transition-all duration-500">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar paciente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-3 w-full bg-white xl:bg-gray-100 border border-transparent xl:border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 shadow-sm xl:shadow-none transition-all text-slate-700 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Botão de Filtro Mobile/Tablet (Quadrado) */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`xl:hidden flex items-center justify-center w-12 h-12 rounded-2xl border transition-all shadow-sm ${showFilters ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-white text-slate-600 border-white'}`}
                            >
                                <Filter size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {!selectedPatient && (
                    <div className="hidden xl:flex items-center gap-3 w-full xl:w-auto overflow-hidden">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium text-sm whitespace-nowrap ${showFilters ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                        >
                            <Filter size={18} />
                            <span>{showFilters ? 'Ocultar Filtros' : 'Filtrar'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Painel de Filtros Avançados */}
            <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[800px] opacity-100 overflow-visible mt-3' : 'max-h-0 opacity-0 invisible overflow-hidden'}`}>
                <div className="bg-white p-6 xl:p-7 rounded-[24px] xl:rounded-[32px] shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-6">
                    
                    {/* Linha 1: Campos Principais (Empresa, Cargo, Setor) */}
                    <div className="flex flex-1 flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Empresa</label>
                            <SearchableSelect
                                options={uniqueOptions.companies.map(c => ({ value: c, label: c }))}
                                value={filters.company}
                                onChange={(val) => handleFilterChange('company', val)}
                                placeholder="Todas as Empresas"
                            />
                        </div>

                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                            <SearchableSelect
                                options={uniqueOptions.roles.map(r => ({ value: r, label: r }))}
                                value={filters.role}
                                onChange={(val) => handleFilterChange('role', val)}
                                placeholder="Todos os Cargos"
                            />
                        </div>

                        <div className="flex-1 min-w-[180px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Setor</label>
                            <SearchableSelect
                                options={uniqueOptions.sectors.map(s => ({ value: s, label: s }))}
                                value={filters.sector}
                                onChange={(val) => handleFilterChange('sector', val)}
                                placeholder="Todos os Setores"
                            />
                        </div>
                    </div>

                    {/* Linha 2: Controles Secundários (Data, Status, Bloqueio, Limpar) */}
                    <div className="flex flex-wrap xl:flex-nowrap gap-4 items-end">
                        <div className="flex-none">
                            <DateRangePicker 
                                value={filters.date} 
                                onChange={(range) => handleFilterChange('date', range)}
                                onClear={() => handleFilterChange('date', null)}
                            />
                        </div>

                        <div className="flex-1 xl:w-[140px] xl:flex-none">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                            <SearchableSelect
                                options={[
                                    { value: 'pending', label: 'Status' },
                                    { value: 'in_progress', label: 'Análise' },
                                    { value: 'completed', label: 'Concluído' }
                                ]}
                                value={filters.status}
                                onChange={(val) => handleFilterChange('status', val)}
                                placeholder="Status"
                            />
                        </div>

                        <div className="flex-1 xl:w-[110px] xl:flex-none">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bloqueio</label>
                            <SearchableSelect
                                options={[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'locked', label: 'Sim' },
                                    { value: 'unlocked', label: 'Não' }
                                ]}
                                value={filters.locked}
                                onChange={(val) => handleFilterChange('locked', val)}
                                placeholder="Todos"
                            />
                        </div>

                        <div className="xl:ml-0">
                            <button
                                onClick={clearFilters}
                                className="w-[46px] h-[46px] bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-red-500 hover:border-red-200 border border-slate-100 transition-all flex items-center justify-center shadow-sm"
                                title="Limpar Filtros"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile/Tablet Section Header - Movido para baixo dos filtros */}
            {!selectedPatient && (
                <div className="flex xl:hidden items-center justify-between mb-4 mt-4">
                    <h2 className="text-lg font-bold text-slate-800">Lista de Pacientes</h2>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        Total: {filteredPatients.length}
                    </span>
                </div>
            )}

            {/* Container Principal: Tabela -> Edição (Split) */}
            <div className="flex flex-1 gap-6 overflow-visible relative">

                {/* Lado Esquerdo: Tabela OU Formulário */}
                <div className={`flex flex-col overflow-visible transition-all duration-500 ease-in-out ${selectedPatient ? 'xl:w-2/5 bg-white p-6 xl:p-8 rounded-[32px] shadow-sm w-full' : 'w-full xl:bg-white xl:rounded-[32px] xl:shadow-sm'} ${selectedPatient && activeEditTab !== 'data' ? 'hidden xl:flex' : 'flex'}`}>

                    {selectedPatient ? (
                        // MODO EDIÇÃO: Formulário
                        // Mobile/Tablet: Mostra apenas o formulário (controlled by hidden above for desktop split)
                        <div className="flex flex-col h-full animate-fadeIn">
                            <div className="mb-6 xl:mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Editar Paciente</h2>
                                <p className="text-slate-500">Atualize os dados cadastrais.</p>
                            </div>

                            <div className="space-y-4 xl:space-y-6 overflow-y-auto pr-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <User size={16} className="text-slate-400" /> Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedPatient.name}
                                        onChange={(e) => handleUpdatePatient('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <Building size={16} className="text-slate-400" /> Empresa
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedPatient.company}
                                        disabled
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed transition-all opacity-70"
                                        placeholder="Empresa (vínculo automático)"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">Vínculo com empresa não é editável aqui.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                        <User size={16} className="text-slate-400" /> CPF
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedPatient.cpf === '—' ? '' : selectedPatient.cpf}
                                        onChange={(e) => handleUpdatePatient('cpf', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        placeholder="000.000.000-00"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <Calendar size={16} className="text-slate-400" /> Nascimento
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedPatient.raw_nascimento || ''}
                                            onChange={(e) => handleUpdatePatient('raw_nascimento', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <User size={16} className="text-slate-400" /> Sexo
                                        </label>
                                        <select
                                            value={selectedPatient.sexo === '—' ? '' : selectedPatient.sexo}
                                            onChange={(e) => handleUpdatePatient('sexo', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <Briefcase size={16} className="text-slate-400" /> Cargo
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedPatient.role}
                                            onChange={(e) => handleUpdatePatient('role', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <MapPin size={16} className="text-slate-400" /> Setor
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedPatient.sector}
                                            onChange={(e) => handleUpdatePatient('sector', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 xl:pt-6 flex gap-3">
                                <button onClick={() => { setSelectedPatient(null); setActiveEditTab('data'); }} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveEdit} className="flex-1 py-3 bg-[#139690] text-white rounded-xl font-bold hover:bg-opacity-90 shadow-lg transition-colors flex items-center justify-center gap-2">
                                    <Save size={18} />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    ) : (
                        // MODO VISUALIZAÇÃO: Tabela com Loading e Empty State
                        isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="w-8 h-8 border-4 border-[#050a30] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p>Carregando pacientes do banco de dados...</p>
                            </div>
                        ) : fetchError ? (
                            <div className="h-full flex flex-col items-center justify-center text-red-500">
                                <p className="font-semibold text-lg">Erro ao carregar dados</p>
                                <p className="font-mono text-sm mt-2 max-w-md text-center">{fetchError}</p>
                                <button onClick={fetchPatients} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200">
                                    Tentar Novamente
                                </button>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="bg-slate-50 p-6 rounded-full mb-4">
                                    <Users size={40} className="opacity-50" />
                                </div>
                                <p className="text-lg font-medium text-slate-600">Nenhum paciente cadastrado</p>
                                <p className="text-sm max-w-xs text-center mt-2 opacity-80">Use o botão "Inserção Múltipla" acima para buscar colaboradores e cadastrá-los como pacientes.</p>
                            </div>
                        ) : (
                            <DashboardTable
                                patients={paginatedPatients}
                                totalItems={filteredPatients.length}
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onEdit={setSelectedPatient}
                                onSort={handleSort}
                                onDelete={handleDeletePatient}
                                onGenerateForm={handleGenerateAssessment}
                                onToggleLock={handleToggleLock}
                                onGenerateReport={handleGenerateReportTrigger}
                            />
                        )
                    )}
                </div>

                {/* 3. Painel Lateral (Placeholder para manter layout de Split conforme pedido) */}
                <div
                    className={`bg-white rounded-[32px] shadow-sm flex-col transition-all duration-500 ease-in-out transform ${selectedPatient
                        ? 'w-full xl:flex-1 translate-x-0 opacity-100 flex'
                        : 'translate-x-full opacity-0 absolute right-0 xl:w-1/2'
                        } ${selectedPatient && activeEditTab !== 'analysis' ? 'hidden xl:flex' : 'flex'}`}
                >
                    {selectedPatient && (
                        <div className="flex flex-col h-full p-8 relative overflow-y-auto custom-scrollbar">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 sticky top-0 bg-white z-10 py-2">
                                <FileText size={20} className="text-[#35b6cf]" />
                                Análise Psicossocial
                            </h3>

                            {narrativePreview.loading ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                                    <div className="w-8 h-8 border-4 border-[#35b6cf] border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p>Gerando análise...</p>
                                </div>
                            ) : narrativePreview.error ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                    <p className="font-bold flex items-center gap-2 mb-2">
                                        <Lock size={16} /> Erro na Análise
                                    </p>
                                    {narrativePreview.error}
                                </div>
                            ) : narrativePreview.data ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className={`p-6 rounded-[24px] mb-8 border-2 flex items-center justify-between gap-4 transition-all duration-300 ${narrativePreview.data.is_apto ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900 shadow-sm shadow-emerald-900/5' : 'bg-amber-50/50 border-amber-100 text-amber-900 shadow-sm shadow-amber-900/5'}`}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] opacity-60 uppercase tracking-[0.15em] font-black mb-1">Status da Avaliação</span>
                                            <span className="text-xl font-black leading-none tracking-tight">
                                                {narrativePreview.data.is_apto ? "APTO PARA FUNÇÃO" : "AVALIAÇÃO REQUERIDA"}
                                            </span>
                                        </div>
                                        <div className={`p-3 rounded-2xl ${narrativePreview.data.is_apto ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
                                            {narrativePreview.data.is_apto ? <CheckCircle size={24} /> : <FileBadge size={24} />}
                                        </div>
                                    </div>

                                    <div className="prose prose-slate prose-sm max-w-none">
                                        {(narrativePreview.data.intro || narrativePreview.data.narrative) ? (
                                            <div className="text-slate-700 space-y-6">
                                                {/* 1. Introdução */}
                                                {narrativePreview.data.intro && (
                                                    <p className="text-[15px] leading-relaxed text-justify font-medium">
                                                        {narrativePreview.data.intro}
                                                    </p>
                                                )}

                                                {/* 2. Análise Completa */}
                                                <p className="text-[15px] leading-relaxed text-justify opacity-90 border-l-2 border-slate-100 pl-6 italic">
                                                    {narrativePreview.data.full_analysis ||
                                                        narrativePreview.data.narrative ||
                                                        `${narrativePreview.data.mental_text || ''}\n\n${narrativePreview.data.habits_text || ''}`}
                                                </p>

                                                {/* 4. Rodapé */}
                                                <div className="pt-6 border-t border-slate-100">
                                                    <p className="text-[11px] text-slate-400 font-medium text-center uppercase tracking-widest leading-loose">
                                                        {narrativePreview.data.disclaimer}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="italic text-slate-400">Nenhuma análise estruturada disponível (Resultados insuficientes).</p>
                                        )}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
                                        Esta análise é gerada automaticamente com base nas respostas do colaborador e não substitui o laudo assinado pelo médico.
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                                        <FileText size={40} className="opacity-50" />
                                    </div>
                                    <p className="text-lg font-medium text-slate-600">Aguardando Avaliação</p>
                                    <p className="text-sm max-w-xs text-center mt-2 opacity-80">
                                        O colaborador ainda não completou o questionário ou a análise não pôde ser processada.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Modal de Assinatura Digital */}
            <SignatureUploadModal
                isOpen={isSigModalOpen}
                onClose={() => {
                    setIsSigModalOpen(false);
                    setPatientToSign(null);
                }}
                onSign={handleSignAndDownload}
                loading={isSigningLoading}
            />

            {/* Modal de Seleção de Médico */}
            <DoctorSelectionModal
                isOpen={isDoctorModalOpen}
                onClose={() => {
                    setIsDoctorModalOpen(false);
                    setSelectedPatientForReport(null);
                }}
                onConfirm={handleDoctorConfirm}
            />

            {/* Modal de Link Gerado */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-4xl w-full animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <LinkIcon size={20} className="text-[#35b6cf]" />
                                {showQrCode ? 'QR Code do Link' : 'Link Gerado'}
                            </h3>
                            <button onClick={() => { setIsLinkModalOpen(false); setShowQrCode(false); }} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        {showQrCode ? (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm mb-6">
                                    <QRCodeCanvas
                                        value={generatedLink}
                                        size={520}
                                        level={"H"}
                                        includeMargin={true}
                                    />
                                </div>
                                <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">
                                    Peça para o paciente escanear este código com a câmera do celular para abrir a avaliação.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowQrCode(false)}
                                        className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-slate-500 mb-4">
                                    Envie este link para o paciente preencher a avaliação de onde estiver.
                                </p>

                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 mb-6">
                                    <span className="text-sm text-slate-600 truncate font-mono select-all">
                                        {generatedLink}
                                    </span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedLink);
                                            alert('Link copiado!');
                                        }}
                                        className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                        title="Copiar"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowQrCode(true)}
                                        className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <QrCode size={18} />
                                        Gerar QR Code
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsLinkModalOpen(false)}
                                            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            Fechar
                                        </button>
                                        <a
                                            href={generatedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-2.5 bg-[#35b6cf] text-white rounded-xl font-medium hover:bg-[#2ca1b7] shadow-lg shadow-cyan-500/20 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Abrir <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;
