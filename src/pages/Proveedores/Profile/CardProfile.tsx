import React, {useEffect, useMemo} from 'react';
import {
    Card,
    CardBody,
    Button,
    Select,
    SelectItem,
    Selection,
    Chip,
    Spinner,
    Input,
    Switch,
    Tabs,
    Tab,
    Divider,
    Alert,
    addToast
} from '@heroui/react';
import {PencilIcon, DocumentArrowDownIcon, ArrowDownTrayIcon} from '@heroicons/react/24/outline';
import Dashboard from "@/layouts/Dashboard";
import { useParams, useLocation } from "react-router-dom";
import { useSuppliers } from "@/store/extendedStore.ts";
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/routes/menuTypes';
import { useConfigData } from '@/store';
import { fetchSupplierByCardCode, updateSupplierProfile, type SupplierApiRecord, type Contacto, type Banco, type DocumentoEvaluacion} from '@/services/providers/providersApi';
import { fetchCondicionesPago, type CondicionPago } from '@/services/maestros/condicionesPagoApi';
import { generateSupplierPDF, openSupplierPDFInNewTab } from '@/utils/pdfGenerator';
import { UbigeoSelector } from '@/components/UbigeoSelector';

export enum PersonaTypeCode {
    JURIDICA = 'TPJ',
    NATURAL = 'TPN',
    NO_DOMICILIADO = 'SND',
    ADQUIRIENTE_TICKET = 'AT'
}

export enum DocumentTypeCode {
    DNI = '1',
    CARNET_EXTRANJERIA = '4',
    RUC = '6',
    PASAPORTE = '7',
    CEDULA_DIPLOMATICA = 'A',
    DOC_IDENT_PAIS_RESIDENCIA = 'B',
    TAX_IDENTIFICATION_NUMBER = 'C',
    IDENTIFICATION_NUMBER = 'D',
    TARJETA_ANDINA_MIGRACION = 'E',
    PERMISO_TEMPORAL_PERMANENCIA = 'F',
    SALVOCONDUCTO = 'G'
}


const normalizeImagePayloadValue = (value?: string | null): string => {
    if (!value) {
        return '';
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    if (trimmed.startsWith('data:')) {
        const [, data] = trimmed.split(',', 2);
        return data ?? '';
    }

    return trimmed;
};

const DOCUMENT_OPTIONS = [
    { value: 'certificaciones', label: 'Certificaciones ISO' },
    { value: 'licenciaMunicipal', label: 'Licencia Municipal' },
    { value: 'referenciasComerciales', label: 'Referencias Comerciales' },
    { value: 'referenciasBancarias', label: 'Referencias Bancarias' },
    { value: 'historialPrecios', label: 'Historial de Precios' },
    { value: 'condicionesPago', label: 'Condiciones de Pago' },
    { value: 'vigenciaPoder', label: 'Vigencia de Poder' },
    { value: 'fichaRuc', label: 'Ficha RUC' },
    { value: 'matrizAmbiental', label: 'Matriz Ambiental' },
    { value: 'matrizIperc', label: 'Matriz IPERC' },
] as const;

const DOCUMENT_KEY_ALIASES: Record<string, string> = {
    certificacionISO: 'certificaciones',
    licenciaMuni: 'licenciaMunicipal',
    historicoPrecios: 'historialPrecios',
    matrizAAmbientales: 'matrizAmbiental',
    matrizIPERC: 'matrizIperc',
};

const normaliseDocumentKey = (value?: string): string | undefined =>
    value ? DOCUMENT_KEY_ALIASES[value] ?? value : undefined;

type DocumentResource = {
    href: string;
    isDataUrl: boolean;
};

const buildDocumentResource = (value: string, mimeType = 'application/pdf'): DocumentResource | null => {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('http')) {
        return {
            href: trimmed,
            isDataUrl: false,
        };
    }

    return {
        href: `data:${mimeType};base64,${trimmed}`,
        isDataUrl: true,
    };
};

const resolveDocumentResource = (value: unknown): DocumentResource | null => {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        return buildDocumentResource(value);
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const resource = resolveDocumentResource(item);
            if (resource) {
                return resource;
            }
        }
        return null;
    }

    if (typeof value === 'object') {
        const record = value as {
            U_LinkDocumento?: string;
            link?: string;
            url?: string;
            href?: string;
            U_Link?: string;
            U_typeArchiv?: string;
        };

        const mimeType =
            typeof record.U_typeArchiv === 'string' && record.U_typeArchiv
                ? record.U_typeArchiv
                : 'application/pdf';

        const candidates = [
            record.U_LinkDocumento,
            record.link,
            record.url,
            record.href,
            record.U_Link,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'string') {
                const resource = buildDocumentResource(candidate, mimeType);
                if (resource) {
                    return resource;
                }
            }
        }
        return null;
    }

    return null;
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result;

            if (typeof result === 'string') {
                const [, base64Value] = result.split(',');
                resolve(base64Value ?? result);
            } else {
                reject(new Error('No se pudo leer el archivo seleccionado.'));
            }
        };

        reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
        reader.readAsDataURL(file);
    });

const createEmptyContact = (): Contacto => ({
    Active: 'Y',
    DocEntry: '0',
    E_MailL: '',
    Name: '',
    Profesion: '',
    Telefono: '',
});

const createEmptyBank = (): Banco => ({
    Banco: '',
    Cuenta: '',
    Sectorista: '',
});

const createEmptyDocument = (cardCode: string): DocumentoEvaluacion => ({
    DocEntry: '0',
    U_CardCode: cardCode,
    U_DocumentoEvaluacion: '',
    U_LinkDocumento: '',
    U_NombDocu: '',
    U_Status: 'Pendiente',
    U_typeArchiv: 'application/pdf',
});


export const getPersonTypeEnumKey = (code: string): string => {
    const entry = Object.entries(PersonaTypeCode).find(([, value]) => value === code);
    return  entry ? entry[0] : 'UNKNOWN'
}
export const getDocumentTypeEnumKey = (code: string): string => {
    const entry = Object.entries(DocumentTypeCode).find(([, value]) => value === code);
    return entry ? entry[0] : 'UNKNOWN';
};

const SupplierProfileCard = () => {
 
     const {selectedSupplier, setSelectedSupplier} = useSuppliers();
     const currentUser = useAuthStore((state) => state.currentUser);
     const { supplierCode: supplierCodeParam } = useParams<{ supplierCode: string }>();
     const location = useLocation();
     const { terminosPago } = useConfigData();
     //console.log("USUARIOOOO ACTUAL: ", currentUser)

     // Determinar el código del proveedor a usar:
     // 1. Si hay un parámetro en la URL (para otros roles consultando un proveedor específico), usarlo
     // 2. Si el usuario es PROVEEDOR y está en su propia ruta (/proveedor/perfil), usar su propio código
     //    (esto tiene prioridad sobre selectedSupplier para evitar mostrar datos de otro proveedor)
     // 3. Si hay un selectedSupplier en el store (para otros roles), usar su cardCode
     // 4. Si el usuario es proveedor pero no hay código específico, usar su supplierId o userCode
     const isProveedorOwnProfile = useMemo(() => {
         return currentUser?.role === UserRole.PROVEEDOR && location.pathname === '/proveedor/perfil';
     }, [currentUser?.role, location.pathname]);
     
     const supplierCode = useMemo(() => {
         return supplierCodeParam 
             ?? (isProveedorOwnProfile ? (currentUser?.supplierId ?? currentUser?.userCode ?? '') : null)
             ?? selectedSupplier?.cardCode 
             ?? (currentUser?.role === UserRole.PROVEEDOR ? (currentUser?.supplierId ?? currentUser?.userCode ?? '') : '');
     }, [supplierCodeParam, isProveedorOwnProfile, currentUser?.supplierId, currentUser?.userCode, currentUser?.role, selectedSupplier?.cardCode]);
     const [isLoading, setIsLoading] = React.useState(false);
     const [formData, setFormData] = React.useState<SupplierApiRecord | null>(null);
     const [condicionesPago, setCondicionesPago] = React.useState<CondicionPago[]>([]);
     const [isLoadingCondicionesPago, setIsLoadingCondicionesPago] = React.useState(false);
     const [isSaving, setIsSaving] = React.useState(false);
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [isGlobalLoading, setIsGlobalLoading] = React.useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
    //const navigate = useNavigate()
    const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
    const coverImageOriginalRef = React.useRef<string | null>(null);
    const avatarOriginalRef = React.useRef<string | null>(null);
    const savedCoverImageRef = React.useRef<string>('');
    const savedAvatarRef = React.useRef<string>('');
 
     // Ref para rastrear el último supplierCode cargado y evitar cargas duplicadas
     const lastLoadedSupplierCodeRef = React.useRef<string | null>(null);

     useEffect(() => {
        // Solo cargar si hay un supplierCode válido y es diferente al último cargado
        if (!supplierCode || supplierCode.trim() === '') {
            return;
        }

        // Evitar cargar si ya se cargó este mismo código
        if (lastLoadedSupplierCodeRef.current === supplierCode) {
            return;
        }

        // Si el usuario es proveedor y está en su propio perfil, limpiar selectedSupplier
        // si no coincide con su código para evitar mostrar datos de otro proveedor
        if (isProveedorOwnProfile && selectedSupplier && selectedSupplier.cardCode !== supplierCode) {
            setSelectedSupplier(null);
        }

        let isMounted = true;

        const loadSupplier = async () => {
            setIsLoading(true);
            setIsGlobalLoading(true);

            try {
                console.log("SUPLIERcode: ", supplierCode)
                const result = await fetchSupplierByCardCode(supplierCode);
                if (result && isMounted) {
                    // Marcar este código como cargado
                    lastLoadedSupplierCodeRef.current = supplierCode;
                    
                    const normalizedCover = normalizeImagePayloadValue(result.record.coverImage);
                    const normalizedAvatar = normalizeImagePayloadValue(result.record.Avatar);
                    savedCoverImageRef.current = normalizedCover;
                    savedAvatarRef.current = normalizedAvatar;
                    setSelectedSupplier(result.supplier);
                    setFormData({
                        ...result.record,
                        coverImage: normalizedCover,
                        Avatar: normalizedAvatar,
                        ReferenciasComerciales: result.record.ReferenciasComerciales ?? [],
                        ServiciosOfrecidos: result.record.ServiciosOfrecidos ?? [],
                    });
                }
            } catch (error) {
                console.error('No se pudo obtener la información del proveedor.', error);
                setApiError('No se pudo cargar la información del proveedor.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    setIsGlobalLoading(false);
                }
            }
        };

        loadSupplier();

        return () => {
            isMounted = false;
        };
    }, [supplierCode, setSelectedSupplier, isProveedorOwnProfile]);

    useEffect(() => {
        coverImageOriginalRef.current = null;
        avatarOriginalRef.current = null;
        setCoverPreview(null);
        setAvatarPreview(null);
    }, [selectedSupplier?.cardCode, formData?.CodigoSN]);

    // Inicializar formData si no hay datos (modo agregar)
    useEffect(() => {
        if (!formData && !isLoading && supplierCode) {
            initializeFormData();
        }
    }, [formData, isLoading, supplierCode]);

    // Cargar condiciones de pago cuando se carga el componente
    useEffect(() => {
        const loadCondicionesPago = async () => {
            setIsLoadingCondicionesPago(true);
            try {
                const condiciones = await fetchCondicionesPago();
                setCondicionesPago(condiciones);
            } catch (error) {
                console.error('Error al cargar condiciones de pago:', error);
            } finally {
                setIsLoadingCondicionesPago(false);
            }
        };
        loadCondicionesPago();
    }, []);

    // Ya no necesitamos el useEffect para condicionPagoDescripcion porque el Select muestra directamente las opciones


    // Función para inicializar formData si no existe (modo agregar)
    const initializeFormData = () => {
        if (!formData && supplierCode) {
            const emptyFormData: SupplierApiRecord = {
                CodigoSN: "",
                NombreSN: "",
                RUC: "",
                TipoPersona: "",
                Moneda: "",
                Telefono1: "",
                Telefono2: "",
                TelefonoMovil: "",
                Correo: "",
                TipoDocumento: "",
                Direccion: "",
                Distrito: "",
                Provincia: "",
                Departamento: "",
                Ubigeo: "",
                CondicionPago: "",
                DireccionSUNAT: "",
                ResolucionAgenteRetencion: "",
                ResolucionAgentePercepcion: "",
                website: null,
                createDate: "",
                updateDate: "",
                statusContributer: null,
                statusDomicilio: null,
                agentePercepcion: "",
                exoPercepcion: "",
                agenteRetencion: "",
                goodContributor: "",
                economiActivitySunat: "",
                status: "",
                approvalDate: "",
                coverImage: "",
                Avatar: "",
                generalManager: "",
                adminManager: "",
                salesManager: "",
                Contactos: [],
                Bancos: [],
                Direcciones: [],
                DocumentoEvaluacion: [],
                ReferenciasComerciales: [],
                ServiciosOfrecidos: []
            };
            setFormData(emptyFormData);
        }
    };

    const handleFieldChange = (field: keyof SupplierApiRecord, value: string) => {
        setFormData((prev) => (prev ? {...prev, [field]: value} : prev));
    };

    const handleToggleField = (
        field: 'agentePercepcion' | 'agenteRetencion' | 'exoPercepcion' | 'goodContributor',
    ) => (value: boolean) => {
        setFormData((prev) => (prev ? {...prev, [field]: value ? 'Y' : 'N'} : prev));
    };

    const handleContactChange = (index: number, field: keyof Contacto, value: string | boolean) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const contactos = [...(prev.Contactos ?? [])];
            while (contactos.length <= index) {
                contactos.push(createEmptyContact());
            }
            const updatedContact: Contacto = {
                ...contactos[index],
                [field]: field === 'Active' ? (value ? 'Y' : 'N') : (value as string),
            } as Contacto;
            contactos[index] = updatedContact;
            return {...prev, Contactos: contactos};
        });
    };

    const addContact = () => {
        setFormData((prev) => (prev ? {...prev, Contactos: [...(prev.Contactos ?? []), createEmptyContact()]} : prev));
    };

    const removeContact = (index: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const contactos = [...(prev.Contactos ?? [])];
            contactos.splice(index, 1);
            return {...prev, Contactos: contactos};
        });
    };

    const handleBankChange = (index: number, field: keyof Banco, value: string) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const bancos = [...(prev.Bancos ?? [])];
            while (bancos.length <= index) {
                bancos.push(createEmptyBank());
            }
            bancos[index] = {...bancos[index], [field]: value} as Banco;
            return {...prev, Bancos: bancos};
        });
    };

    const addBank = () => {
        setFormData((prev) => (prev ? {...prev, Bancos: [...(prev.Bancos ?? []), createEmptyBank()]} : prev));
    };

    const removeBank = (index: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const bancos = [...(prev.Bancos ?? [])];
            bancos.splice(index, 1);
            return {...prev, Bancos: bancos};
        });
    };

    const handleDocumentChange = (
        index: number,
        field: keyof DocumentoEvaluacion,
        value: string,
    ) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const documentos = [...(prev.DocumentoEvaluacion ?? [])];
            while (documentos.length <= index) {
                documentos.push(createEmptyDocument(prev.CodigoSN));
            }
            documentos[index] = {...documentos[index], [field]: value} as DocumentoEvaluacion;
            return {...prev, DocumentoEvaluacion: documentos};
        });
    };

    const addDocument = () => {
        setFormData((prev) => (prev ? {
            ...prev,
            DocumentoEvaluacion: [...(prev.DocumentoEvaluacion ?? []), createEmptyDocument(prev.CodigoSN)],
        } : prev));
    };

    const removeDocument = (index: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const documentos = [...(prev.DocumentoEvaluacion ?? [])];
            documentos.splice(index, 1);
            return {...prev, DocumentoEvaluacion: documentos};
        });
    };

    const handleDocumentFileChange = async (index: number, file: File | null) => {
        if (!file) {
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            setFormData((prev) => {
                if (!prev) return prev;
                const documentos = [...(prev.DocumentoEvaluacion ?? [])];
                while (documentos.length <= index) {
                    documentos.push(createEmptyDocument(prev.CodigoSN));
                }

                documentos[index] = {
                    ...documentos[index],
                    U_LinkDocumento: base64,
                    U_NombDocu: file.name,
                    U_typeArchiv: file.type || 'application/pdf',
                } as DocumentoEvaluacion;

                return {...prev, DocumentoEvaluacion: documentos};
            });
        } catch (error) {
            console.error('No se pudo procesar el archivo seleccionado.', error);
            addToast({
                title: 'Error al cargar archivo',
                description: 'No se pudo procesar el archivo seleccionado.',
                color: 'danger',
                timeout: 4000,
            });
        }
    };

    const handleImageSelection = async (field: 'coverImage' | 'Avatar', file: File | null) => {
        if (!file) {
            return;
        }

        if (!file.type || !file.type.startsWith('image/')) {
            addToast({
                title: 'Formato no permitido',
                description: 'Selecciona un archivo de imagen (JPG, PNG, WEBP o similar).',
                color: 'warning',
                timeout: 4000,
            });
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;

            setFormData((prev) => {
                if (!prev) {
                    return prev;
                }

                if (field === 'coverImage' && coverImageOriginalRef.current === null) {
                    coverImageOriginalRef.current = prev.coverImage ?? '';
                }

                if (field === 'Avatar' && avatarOriginalRef.current === null) {
                    avatarOriginalRef.current = prev.Avatar ?? '';
                }

                return {
                    ...prev,
                    [field]: base64,
                } as SupplierApiRecord;
            });

            if (field === 'coverImage') {
                setCoverPreview(dataUrl);
                savedCoverImageRef.current = base64;
            } else {
                setAvatarPreview(dataUrl);
                savedAvatarRef.current = base64;
            }

            addToast({
                title: 'Imagen lista para guardar',
                description: 'Guarda la sección para enviar la imagen en base64 al servidor.',
                color: 'success',
                timeout: 3000,
            });
        } catch (error) {
            console.error('No se pudo procesar la imagen seleccionada.', error);
            addToast({
                title: 'Error al procesar la imagen',
                description: 'Inténtalo nuevamente con otro archivo.',
                color: 'danger',
                timeout: 4000,
            });
        }
    };

    const handleImageReset = (field: 'coverImage' | 'Avatar') => {
        if (field === 'coverImage') {
            const fallbackValue =
                coverImageOriginalRef.current ??
                savedCoverImageRef.current ??
                selectedSupplier?.coverImage ??
                '';
            const normalized = normalizeImagePayloadValue(fallbackValue);
            coverImageOriginalRef.current = null;
            setCoverPreview(null);
            setFormData((prev) => (prev ? {
                ...prev,
                coverImage: normalized,
            } as SupplierApiRecord : prev));
            savedCoverImageRef.current = normalized;
            addToast({
                title: 'Cambios descartados',
                description: 'Se restauró la imagen de portada anterior.',
                color: 'secondary',
                timeout: 2500,
            });
            return;
        }

        const fallbackValue =
            avatarOriginalRef.current ??
            savedAvatarRef.current ??
            selectedSupplier?.avatar ??
            '';
        const normalized = normalizeImagePayloadValue(fallbackValue);
        avatarOriginalRef.current = null;
        setAvatarPreview(null);
        setFormData((prev) => (prev ? {
            ...prev,
            Avatar: normalized,
        } as SupplierApiRecord : prev));
        savedAvatarRef.current = normalized;
        addToast({
            title: 'Cambios descartados',
            description: 'Se restauró el logo anterior.',
            color: 'secondary',
            timeout: 2500,
        });
    };

    /*const handleDocumentSwitchPress = (documentKey: string, label: string) => {
        const supplierDocuments = selectedSupplier?.Documentos as Record<string, unknown> | undefined;

        const resource =
            resolveDocumentResource(supplierDocuments?.[documentKey]) ??
            resolveDocumentResource(
                formData?.DocumentoEvaluacion?.find((doc) => doc.U_DocumentoEvaluacion === documentKey),
            );

        if (resource) {
            const newWindow = window.open(resource.href, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                addToast({
                    title: 'No se pudo abrir el documento',
                    description: 'Permite las ventanas emergentes para visualizar el documento.',
                    color: 'warning',
                    timeout: 4000,
                });
            }
            return;
        }

        addToast({
            title: 'Documento no disponible',
            description: `No se encontró un documento para ${label}.`,
            color: 'warning',
            timeout: 3000,
        });
    };

    const handleCommercialChange = (index: number, field: keyof CommercialReference, value: string) => {
         setFormData((prev) => {
             if (!prev) return prev;
            const referencias: CommercialReference[] = [...(prev.ReferenciasComerciales ?? [])];
            while (referencias.length <= index) {
                referencias.push({DocEntry: '', U_CardCode: '', U_RazonSocial: '', U_Contacto: '', U_Telefonos: ''});
            }
            referencias[index] = {...referencias[index], [field]: value} as CommercialReference;
            return {...prev, ReferenciasComerciales: referencias};
         });
     };
 
     const addCommercial = (codidoSN: string) => {
         setFormData((prev) => (prev ? {
             ...prev,
            ReferenciasComerciales: [...(prev.ReferenciasComerciales ?? []), {DocEntry: '0', U_CardCode: codidoSN, U_RazonSocial: '', U_Contacto: '', U_Telefonos: ''}],
         } : prev));
     };
 
     const removeCommercial = (index: number) => {
         setFormData((prev) => {
             if (!prev) return prev;
            const referencias = [...(prev.ReferenciasComerciales ?? [])];
             referencias.splice(index, 1);
             return {...prev, ReferenciasComerciales: referencias};
         });
     };
 
     const handleServiceChange = (
         index: number,
         field: keyof ServiceOffered,
         value: string,
     ) => {
         setFormData((prev) => {
             if (!prev) return prev;
            const servicios: ServiceOffered[] = [...(prev.ServiciosOfrecidos ?? [])];
             while (servicios.length <= index) {
                 servicios.push({principalActivity: '', serviceLine: '', paymentTerms: ''});
             }
             servicios[index] = {...servicios[index], [field]: value} as ServiceOffered;
             return {...prev, ServiciosOfrecidos: servicios};
         });
     };

    const addService = () => {
        setFormData((prev) => (prev ? {
            ...prev,
            ServiciosOfrecidos: [...(prev.ServiciosOfrecidos ?? []), {principalActivity: '', serviceLine: '', paymentTerms: ''}],
        } : prev));
    };

    const removeService = (index: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const servicios = [...(prev.ServiciosOfrecidos ?? [])];
            servicios.splice(index, 1);
            return {...prev, ServiciosOfrecidos: servicios};
        });
    };*/

    const handleGeneratePDF = async () => {
        if (!selectedSupplier) {
            addToast({
                title: 'Error',
                description: 'No hay información del proveedor disponible.',
                color: 'danger',
                timeout: 3000,
            });
            return;
        }

        setIsGeneratingPDF(true);
        setIsGlobalLoading(true);

        try {
            await generateSupplierPDF(selectedSupplier);
            addToast({
                title: 'PDF generado',
                description: 'El documento se ha descargado correctamente.',
                color: 'success',
                timeout: 3000,
            });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            addToast({
                title: 'Error al generar PDF',
                description: error instanceof Error ? error.message : 'No se pudo generar el documento.',
                color: 'danger',
                timeout: 4000,
            });
        } finally {
            setIsGeneratingPDF(false);
            setIsGlobalLoading(false);
        }
    };

    const handleViewPDF = async () => {
        if (!selectedSupplier) {
            addToast({
                title: 'Error',
                description: 'No hay información del proveedor disponible.',
                color: 'danger',
                timeout: 3000,
            });
            return;
        }

        setIsGeneratingPDF(true);
        setIsGlobalLoading(true);

        try {
            await openSupplierPDFInNewTab(selectedSupplier);
        } catch (error) {
            console.error('Error al visualizar PDF:', error);
            addToast({
                title: 'Error al visualizar PDF',
                description: error instanceof Error ? error.message : 'No se pudo visualizar el documento.',
                color: 'danger',
                timeout: 4000,
            });
        } finally {
            setIsGeneratingPDF(false);
            setIsGlobalLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (!formData) {
            addToast({
                title: 'Error',
                description: 'No hay datos para guardar.',
                color: 'danger',
                timeout: 3000,
            });
            return;
        }

        setIsSaving(true);
        setIsGlobalLoading(true);
        setApiError(null);

        try {
            const payload: SupplierApiRecord = {
                ...formData,
                coverImage: normalizeImagePayloadValue(savedCoverImageRef.current || formData.coverImage || ''),
                Avatar: normalizeImagePayloadValue(savedAvatarRef.current || formData.Avatar || ''),
            };
            savedCoverImageRef.current = payload.coverImage;
            savedAvatarRef.current = payload.Avatar;
            await updateSupplierProfile(formData.CodigoSN, payload);
            const refreshed = await fetchSupplierByCardCode(formData.CodigoSN);

            if (refreshed) {
                const normalizedCover = normalizeImagePayloadValue(refreshed.record.coverImage);
                const normalizedAvatar = normalizeImagePayloadValue(refreshed.record.Avatar);
                savedCoverImageRef.current = normalizedCover;
                savedAvatarRef.current = normalizedAvatar;
                setFormData({
                    ...refreshed.record,
                    coverImage: normalizedCover,
                    Avatar: normalizedAvatar,
                    ReferenciasComerciales: refreshed.record.ReferenciasComerciales ?? [],
                    ServiciosOfrecidos: refreshed.record.ServiciosOfrecidos ?? [],
                });
                setSelectedSupplier(refreshed.supplier);
                setCoverPreview(null);
                setAvatarPreview(null);
                coverImageOriginalRef.current = null;
                avatarOriginalRef.current = null;
            }
            addToast({
                title: 'Perfil actualizado',
                description: 'Los cambios se guardaron correctamente.',
                color: 'success',
                timeout: 3000,
            });
        } catch (error) {
            console.error('No se pudo actualizar la información del proveedor.', error);
            const message = error instanceof Error ? error.message : 'Error desconocido al actualizar el proveedor.';
            setApiError(message);
            addToast({
                title: 'Error al actualizar',
                description: message,
                color: 'danger',
                timeout: 4000,
            });
        } finally {
            setIsSaving(false);
            setIsGlobalLoading(false);
        }
    };

    // Función para obtener el label del tipo de persona
    const getPersonTypeLabel = (code: string): string => {
        const labels: Record<string, string> = {
            'TPJ': 'Persona Jurídica',
            'TPN': 'Persona Natural',
            'SND': 'No Domiciliado',
            'AT': 'Adquiriente Ticket'
        };
        return labels[code] || code;
    };

    // Función para obtener el label del tipo de documento
    const getDocumentTypeLabel = (code: string): string => {
        const labels: Record<string, string> = {
            '1': 'DNI',
            '4': 'Carnet de Extranjería',
            '6': 'RUC',
            '7': 'Pasaporte',
            'A': 'Cédula Diplomática',
            'B': 'Doc. Ident. País Residencia',
            'C': 'Tax Identification Number',
            'D': 'Identification Number',
            'E': 'Tarjeta Andina Migración',
            'F': 'Permiso Temporal Permanencia',
            'G': 'Salvoconducto'
        };
        return labels[code] || code;
    };

    // Función para agregar dirección vacía
    const addAddress = () => {
        setFormData((prev) => {
            if (!prev) return prev;
            const direcciones = [...(prev.Direcciones ?? [])];
            direcciones.push({
                CodDireccion: '',
                Direccion: '',
                NroLinea: '0',
                Departamento: '',
                Provincia: '',
                Distrito: '',
                Ubigeo: ''
            });
            return { ...prev, Direcciones: direcciones };
        });
    };

    // Función para eliminar dirección
    const removeAddress = (index: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const direcciones = [...(prev.Direcciones ?? [])];
            direcciones.splice(index, 1);
            return { ...prev, Direcciones: direcciones };
        });
    };

    if (!formData) {
        return (
            <Dashboard>
                <div className="flex w-full justify-center py-20 text-sm text-gray-500">
                    {isLoading ? 'Cargando información...' : 'No se encontró información del proveedor.'}
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            {(isGlobalLoading || isLoading) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Spinner label="Procesando..." color="primary" />
                </div>
            )}
            
            <div className="relative min-h-screen pb-8">
                {/* Background con efecto glassmorphism */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 dark:opacity-10"
                        style={{backgroundImage: 'url(/tanques.webp)'}}
                    ></div>
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900"></div>
                    <div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(214,0,28,0.05),transparent_50%)]"></div>
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header con botón de guardar */}
                    <div className="flex justify-between items-center pt-6">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                            {formData.NombreSN || 'Nuevo Proveedor'}
                        </h1>
                        <div className="flex gap-3">
                            {/* Botones de PDF - Solo visibles si NO es proveedor */}
                            {currentUser?.role !== UserRole.PROVEEDOR && (
                                <>
                                    <Button
                                        size="md"
                                        color="secondary"
                                        variant="bordered"
                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                        onPress={handleViewPDF}
                                        isLoading={isGeneratingPDF}
                                        isDisabled={isGlobalLoading || isGeneratingPDF || !selectedSupplier}
                                    >
                                        Ver PDF
                                    </Button>
                                    <Button
                                        size="md"
                                        color="success"
                                        variant="flat"
                                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                        onPress={handleGeneratePDF}
                                        isLoading={isGeneratingPDF}
                                        isDisabled={isGlobalLoading || isGeneratingPDF || !selectedSupplier}
                                    >
                                        Descargar PDF
                                    </Button>
                                </>
                            )}
                            <Button
                                color="primary"
                                size="lg"
                                onPress={handleSaveAll}
                                isLoading={isSaving}
                                isDisabled={isGlobalLoading || isSaving}
                                startContent={<PencilIcon className="w-5 h-5" />}
                            >
                                Guardar Cambios
                            </Button>
                        </div>
                    </div>

                    {apiError && (
                        <Alert
                            color="danger"
                            title="Error al guardar"
                            description={apiError}
                            className="mb-4"
                        />
                    )}

                    {/* Card Flotante con Tabs */}
                    <Card className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-white/30 dark:border-gray-700/30">
                        <CardBody className="p-4">
                            <Tabs
                                aria-label="Formulario de Proveedor"
                                className="w-full"
                                classNames={{
                                    tabList: "w-full justify-center gap-4",  // Esto centra los tabs
                                    cursor: "w-full",
                                    tab: "max-w-fit",  // Importante para que no se estiren
                                }}
                            >
                                <Tab key="general" title="General">
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input 
                                                label="Código" 
                                                value={formData.CodigoSN || ''} 
                                                onValueChange={(value) => handleFieldChange('CodigoSN', value)} 
                                                isDisabled
                                            />
                                            <Input 
                                                label="Razón Social" 
                                                value={formData.NombreSN || ''} 
                                                onValueChange={(value) => handleFieldChange('NombreSN', value)} 
                                            />
                                            <Input 
                                                label="RUC" 
                                                value={formData.RUC || ''} 
                                                onValueChange={(value) => handleFieldChange('RUC', value)} 
                                            />
                                            <Input 
                                                label="Tipo de Persona" 
                                                value={getPersonTypeLabel(formData.TipoPersona || '')} 
                                                onValueChange={(value) => handleFieldChange('TipoPersona', value)}
                                                isReadOnly
                                                description={formData.TipoPersona ? `Código: ${formData.TipoPersona}` : undefined}
                                            />
                                            <Input 
                                                label="Tipo de Documento" 
                                                value={getDocumentTypeLabel(formData.TipoDocumento || '')} 
                                                onValueChange={(value) => handleFieldChange('TipoDocumento', value)}
                                                isReadOnly
                                                description={formData.TipoDocumento ? `Código: ${formData.TipoDocumento}` : undefined}
                                            />
                                            <Input 
                                                label="Moneda" 
                                                value={formData.Moneda || ''} 
                                                onValueChange={(value) => handleFieldChange('Moneda', value)} 
                                            />
                                            <Input 
                                                label="Teléfono 1" 
                                                value={formData.Telefono1 || ''} 
                                                onValueChange={(value) => handleFieldChange('Telefono1', value)} 
                                            />
                                            <Input 
                                                label="Teléfono 2" 
                                                value={formData.Telefono2 || ''} 
                                                onValueChange={(value) => handleFieldChange('Telefono2', value)} 
                                            />
                                            <Input 
                                                label="Teléfono Móvil" 
                                                value={formData.TelefonoMovil || ''} 
                                                onValueChange={(value) => handleFieldChange('TelefonoMovil', value)} 
                                            />
                                            <Input 
                                                label="Correo" 
                                                value={formData.Correo || ''} 
                                                onValueChange={(value) => handleFieldChange('Correo', value)} 
                                            />
                                            <Input 
                                                label="Sitio Web" 
                                                value={formData.website || ''} 
                                                onValueChange={(value) => handleFieldChange('website', value)} 
                                            />
                                            <Select
                                                label="Condición de Pago"
                                                placeholder={isLoadingCondicionesPago ? "Cargando..." : "Seleccione una condición"}
                                                selectedKeys={formData.CondicionPago ? [formData.CondicionPago] : []}
                                                onSelectionChange={(keys) => {
                                                    if (keys === 'all') return;
                                                    const selectedKey = Array.from(keys)[0] as string | undefined;
                                                    if (selectedKey) {
                                                        handleFieldChange('CondicionPago', selectedKey);
                                                    }
                                                }}
                                                isDisabled={isLoadingCondicionesPago}
                                            >
                                                {condicionesPago.length > 0 
                                                    ? condicionesPago.map((condicion) => (
                                                        <SelectItem key={condicion.GroupNum}>
                                                            {condicion.PymntGroup}
                                                        </SelectItem>
                                                    ))
                                                    : terminosPago.map((termino) => (
                                                        <SelectItem key={termino.key}>{termino.label}</SelectItem>
                                                    ))
                                                }
                                            </Select>
                                        </div>
                                        <Divider />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <Switch 
                                                isSelected={formData.agenteRetencion === 'Y'} 
                                                onValueChange={handleToggleField('agenteRetencion')} 
                                                size="sm"
                                            >
                                                Agente de Retención
                                            </Switch>
                                            <Switch 
                                                isSelected={formData.agentePercepcion === 'Y'} 
                                                onValueChange={handleToggleField('agentePercepcion')} 
                                                size="sm"
                                            >
                                                Agente de Percepción
                                            </Switch>
                                            <Switch 
                                                isSelected={formData.exoPercepcion === 'Y'} 
                                                onValueChange={handleToggleField('exoPercepcion')} 
                                                size="sm"
                                            >
                                                Exonerado Percepción
                                            </Switch>
                                            <Switch 
                                                isSelected={formData.goodContributor === 'Y'} 
                                                onValueChange={handleToggleField('goodContributor')} 
                                                size="sm"
                                            >
                                                Buen Contribuyente
                                            </Switch>
                                        </div>
                                    </div>
                                </Tab>
                                
                                <Tab key="addresses" title="Direcciones">
                                    <div className="p-6 space-y-4">
                                        {(formData.Direcciones ?? []).length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 mb-4">No hay direcciones registradas</p>
                                                <Button variant="bordered" onPress={addAddress}>
                                                    Agregar Dirección
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {(formData.Direcciones ?? []).map((direccion, index) => (
                                                    <Card key={`address-${index}`} className="border border-gray-200">
                                                        <CardBody className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-semibold text-lg">Dirección {index + 1}</h4>
                                                                <Button 
                                                                    color="danger" 
                                                                    variant="light" 
                                                                    size="sm" 
                                                                    onPress={() => removeAddress(index)}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                            <Input
                                                                label="Código Dirección"
                                                                value={direccion.CodDireccion || ''}
                                                                onValueChange={(value) => {
                                                                    setFormData((prev) => {
                                                                        if (!prev) return prev;
                                                                        const updated = [...(prev.Direcciones ?? [])];
                                                                        updated[index] = { ...updated[index], CodDireccion: value };
                                                                        return { ...prev, Direcciones: updated };
                                                                    });
                                                                }}
                                                            />
                                                            <Input
                                                                label="Dirección"
                                                                value={direccion.Direccion || ''}
                                                                onValueChange={(value) => {
                                                                    setFormData((prev) => {
                                                                        if (!prev) return prev;
                                                                        const updated = [...(prev.Direcciones ?? [])];
                                                                        updated[index] = { ...updated[index], Direccion: value };
                                                                        return { ...prev, Direcciones: updated };
                                                                    });
                                                                }}
                                                            />
                                                            <UbigeoSelector
                                                                value={direccion.Ubigeo || ''}
                                                                onChange={(ubigeoCode) => {
                                                                    setFormData((prev) => {
                                                                        if (!prev) return prev;
                                                                        const updated = [...(prev.Direcciones ?? [])];
                                                                        updated[index] = { ...updated[index], Ubigeo: ubigeoCode };
                                                                        return { ...prev, Direcciones: updated };
                                                                    });
                                                                }}
                                                                onDepartmentChange={(department) => {
                                                                    setFormData((prev) => {
                                                                        if (!prev) return prev;
                                                                        const updated = [...(prev.Direcciones ?? [])];
                                                                        updated[index] = { ...updated[index], Departamento: department };
                                                                        return { ...prev, Direcciones: updated };
                                                                    });
                                                                }}
                                                                onProvinceChange={(province) => {
                                                                    setFormData((prev) => {
                                                                        if (!prev) return prev;
                                                                        const updated = [...(prev.Direcciones ?? [])];
                                                                        updated[index] = { ...updated[index], Provincia: province };
                                                                        return { ...prev, Direcciones: updated };
                                                                    });
                                                                }}
                                                                onDistrictChange={(district) => {
                                                                    setFormData((prev) => {
                                                                        if (!prev) return prev;
                                                                        const updated = [...(prev.Direcciones ?? [])];
                                                                        updated[index] = { ...updated[index], Distrito: district };
                                                                        return { ...prev, Direcciones: updated };
                                                                    });
                                                                }}
                                                                size="sm"
                                                            />
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                                <Button variant="bordered" onPress={addAddress}>
                                                    Agregar Dirección
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Tab>
                                
                                <Tab key="contacts" title="Contactos">
                                    <div className="p-6 space-y-4">
                                        {(formData.Contactos ?? []).length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 mb-4">No hay contactos registrados</p>
                                                <Button variant="bordered" onPress={addContact}>
                                                    Agregar Contacto
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {(formData.Contactos ?? []).map((contacto, index) => (
                                                    <Card key={`contact-${index}`} className="border border-gray-200">
                                                        <CardBody className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-semibold text-lg">Contacto {index + 1}</h4>
                                                                <Button 
                                                                    color="danger" 
                                                                    variant="light" 
                                                                    size="sm" 
                                                                    onPress={() => removeContact(index)}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <Input 
                                                                    label="Nombre" 
                                                                    value={contacto.Name || ''} 
                                                                    onValueChange={(value) => handleContactChange(index, 'Name', value)} 
                                                                />
                                                                <Input 
                                                                    label="Correo" 
                                                                    value={contacto.E_MailL || ''} 
                                                                    onValueChange={(value) => handleContactChange(index, 'E_MailL', value)} 
                                                                />
                                                                <Input 
                                                                    label="Profesión / Cargo" 
                                                                    value={contacto.Profesion || ''} 
                                                                    onValueChange={(value) => handleContactChange(index, 'Profesion', value)} 
                                                                />
                                                                <Input 
                                                                    label="Teléfono" 
                                                                    value={contacto.Telefono || ''} 
                                                                    onValueChange={(value) => handleContactChange(index, 'Telefono', value)} 
                                                                />
                                                            </div>
                                                            <Switch 
                                                                isSelected={contacto.Active === 'Y'} 
                                                                onValueChange={(value) => handleContactChange(index, 'Active', value)} 
                                                                size="sm"
                                                            >
                                                                Activo
                                                            </Switch>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                                <Button variant="bordered" onPress={addContact}>
                                                    Agregar Contacto
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Tab>
                                
                                <Tab key="banks" title="Bancos">
                                    <div className="p-6 space-y-4">
                                        {(formData.Bancos ?? []).length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 mb-4">No hay bancos registrados</p>
                                                <Button variant="bordered" onPress={addBank}>
                                                    Agregar Banco
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {(formData.Bancos ?? []).map((banco, index) => (
                                                    <Card key={`bank-${index}`} className="border border-gray-200">
                                                        <CardBody className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="font-semibold text-lg">Banco {index + 1}</h4>
                                                                <Button 
                                                                    color="danger" 
                                                                    variant="light" 
                                                                    size="sm" 
                                                                    onPress={() => removeBank(index)}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <Input 
                                                                    label="Banco" 
                                                                    value={banco.Banco || ''} 
                                                                    onValueChange={(value) => handleBankChange(index, 'Banco', value)} 
                                                                />
                                                                <Input 
                                                                    label="Número de Cuenta" 
                                                                    value={banco.Cuenta || ''} 
                                                                    onValueChange={(value) => handleBankChange(index, 'Cuenta', value)} 
                                                                />
                                                                <Input 
                                                                    label="Sectorista" 
                                                                    value={banco.Sectorista || ''} 
                                                                    onValueChange={(value) => handleBankChange(index, 'Sectorista', value)} 
                                                                />
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                                <Button variant="bordered" onPress={addBank}>
                                                    Agregar Banco
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Tab>
                                
                                <Tab key="documents" title="Documentos">
                                    <div className="p-6 space-y-4">
                                        {(formData.DocumentoEvaluacion ?? []).length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 mb-4">No hay documentos registrados</p>
                                                <Button variant="bordered" onPress={addDocument}>
                                                    Agregar Documento
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {(formData.DocumentoEvaluacion ?? []).map((documento, index) => {
                                                    const usedDocumentKeys = new Set(
                                                        (formData.DocumentoEvaluacion ?? [])
                                                            .map((doc) => normaliseDocumentKey(doc.U_DocumentoEvaluacion))
                                                            .filter((value): value is string => Boolean(value))
                                                    );
                                                    const availableDocumentOptions = DOCUMENT_OPTIONS.filter(
                                                        ({ value }) => !usedDocumentKeys.has(value) || documento.U_DocumentoEvaluacion === value
                                                    );
                                                    
                                                    return (
                                                        <Card key={`document-${index}`} className="border border-gray-200">
                                                            <CardBody className="space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <h4 className="font-semibold text-lg">Documento {index + 1}</h4>
                                                                    <Button 
                                                                        color="danger" 
                                                                        variant="light" 
                                                                        size="sm" 
                                                                        onPress={() => removeDocument(index)}
                                                                    >
                                                                        Eliminar
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <Select
                                                                        label="Tipo de Documento"
                                                                        selectedKeys={
                                                                            normaliseDocumentKey(documento.U_DocumentoEvaluacion)
                                                                                ? [normaliseDocumentKey(documento.U_DocumentoEvaluacion)!]
                                                                                : []
                                                                        }
                                                                        isDisabled={Boolean(documento.U_DocumentoEvaluacion)}
                                                                        placeholder="Selecciona un documento"
                                                                        onSelectionChange={(keys: Selection) => {
                                                                            if (keys === 'all') return;
                                                                            const selectedKey = [...keys][0] as string | undefined;
                                                                            if (selectedKey) {
                                                                                const normalizedKey = normaliseDocumentKey(selectedKey) ?? selectedKey;
                                                                                handleDocumentChange(index, 'U_DocumentoEvaluacion', normalizedKey);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {availableDocumentOptions.map(({ value, label }) => (
                                                                            <SelectItem key={value}>{label}</SelectItem>
                                                                        ))}
                                                                    </Select>
                                                                    <Input 
                                                                        label="Nombre de Archivo" 
                                                                        value={documento.U_NombDocu || ''} 
                                                                        onValueChange={(value) => handleDocumentChange(index, 'U_NombDocu', value)} 
                                                                    />
                                                                    <Input 
                                                                        label="Estado" 
                                                                        value={documento.U_Status || ''} 
                                                                        onValueChange={(value) => handleDocumentChange(index, 'U_Status', value)} 
                                                                    />
                                                                    <Input 
                                                                        label="Tipo de Archivo" 
                                                                        value={documento.U_typeArchiv || ''} 
                                                                        onValueChange={(value) => handleDocumentChange(index, 'U_typeArchiv', value)} 
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                                        Archivo PDF
                                                                    </label>
                                                                    <input
                                                                        accept="application/pdf"
                                                                        className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        type="file"
                                                                        onChange={async (event) => {
                                                                            const file = event.target.files?.[0] ?? null;
                                                                            await handleDocumentFileChange(index, file);
                                                                        }}
                                                                    />
                                                                    {documento.U_LinkDocumento && (
                                                                        <Chip size="sm" variant="flat" color="primary">
                                                                            Archivo cargado
                                                                        </Chip>
                                                                    )}
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    );
                                                })}
                                                <Button variant="bordered" onPress={addDocument}>
                                                    Agregar Documento
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Tab>
                                
                                <Tab key="images" title="Imágenes">
                                    <div className="p-6 space-y-6">
                                        {/* Cover Image */}
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Imagen de Portada</h4>
                                            <div className="flex flex-col gap-6 md:flex-row">
                                                <div className="flex-1">
                                                    <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800">
                                                        {coverPreview ? (
                                                            <img
                                                                alt="Vista previa de la portada"
                                                                className="h-full w-full object-cover"
                                                                src={coverPreview}
                                                            />
                                                        ) : (formData.coverImage && formData.coverImage.trim()) ? (
                                                            <img
                                                                alt="Imagen de portada"
                                                                className="h-full w-full object-cover"
                                                                src={formData.coverImage.startsWith('data:') || formData.coverImage.startsWith('http') 
                                                                    ? formData.coverImage 
                                                                    : `data:image/jpeg;base64,${formData.coverImage}`}
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                                                Aún no hay imagen de portada
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-full space-y-4 md:w-72">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Sube una imagen en formato JPG, PNG o WEBP (máx. 5 MB). El archivo se convertirá a base64 al guardar.
                                                    </p>
                                                    <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-600">
                                                        Seleccionar imagen
                                                        <input
                                                            accept="image/*"
                                                            className="sr-only"
                                                            type="file"
                                                            onChange={async (event) => {
                                                                const file = event.target.files?.[0] ?? null;
                                                                await handleImageSelection('coverImage', file);
                                                                event.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            color={coverPreview ? 'success' : 'secondary'}
                                                        >
                                                            {coverPreview ? 'Imagen nueva pendiente de guardar' : 'Mostrando imagen actual'}
                                                        </Chip>
                                                        {coverPreview && (
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                onPress={() => handleImageReset('coverImage')}
                                                            >
                                                                Deshacer
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Divider />
                                        
                                        {/* Avatar */}
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Logo de Empresa</h4>
                                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800">
                                                    {avatarPreview ? (
                                                        <img
                                                            alt="Vista previa del logo"
                                                            className="h-full w-full object-cover"
                                                            src={avatarPreview}
                                                        />
                                                    ) : (formData.Avatar && formData.Avatar.trim()) ? (
                                                        <img
                                                            alt="Logo de empresa"
                                                            className="h-full w-full object-cover"
                                                            src={formData.Avatar.startsWith('data:') || formData.Avatar.startsWith('http') 
                                                                ? formData.Avatar 
                                                                : `data:image/jpeg;base64,${formData.Avatar}`}
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Sin logo</span>
                                                    )}
                                                </div>
                                                <div className="flex w-full flex-1 flex-col gap-4">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Sube el logo corporativo (recomendado cuadrado). El archivo se transformará a base64 y se enviará al guardar.
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-600">
                                                            Seleccionar logo
                                                            <input
                                                                accept="image/*"
                                                                className="sr-only"
                                                                type="file"
                                                                onChange={async (event) => {
                                                                    const file = event.target.files?.[0] ?? null;
                                                                    await handleImageSelection('Avatar', file);
                                                                    event.target.value = '';
                                                                }}
                                                            />
                                                        </label>
                                                        {avatarPreview && (
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                onPress={() => handleImageReset('Avatar')}
                                                            >
                                                                Deshacer
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Chip
                                                        className="w-fit"
                                                        color={avatarPreview ? 'success' : 'secondary'}
                                                        size="sm"
                                                        variant="flat"
                                                    >
                                                        {avatarPreview ? 'Logo nuevo pendiente de guardar' : 'Mostrando logo actual'}
                                                    </Chip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </Dashboard>
    );
};

export default SupplierProfileCard;

