import React, {useEffect} from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Avatar,
    Button,
    Select,
    SelectItem,
    Selection,
    Chip,
    Progress,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Input,
    Switch,
    Textarea,
    Drawer,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerContent,
    Divider,
    useDisclosure,
    addToast
} from '@heroui/react';
import {
    UserPlusIcon,
    CameraIcon,
    PencilIcon,
    MapPinIcon,
    CalendarIcon,
    EnvelopeIcon,
    PhoneArrowDownLeftIcon,
    GlobeAltIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    BuildingOffice2Icon,
    PlusIcon,
    IdentificationIcon,
    StarIcon,
    ArrowDownTrayIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Link } from "@heroui/link";
import Dashboard from "@/layouts/Dashboard";
import { useNavigate } from "react-router-dom";
import { useSuppliers } from "@/store/extendedStore.ts";
import { useAuthStore } from '@/store/authStore';
import { createDefaultDocuments, fetchSupplierByCardCode, updateSupplierProfile, type SupplierApiRecord, type Contacto, type Banco, type DocumentoEvaluacion} from '@/services/providers/providersApi';
import { ProveedorValidator, TipoProveedorCodigo } from "@/pages/Proveedores/Profile/ProveedorValidator.ts";
import {TicketIcon } from "@heroicons/react/16/solid";
import { fetchCondicionesPago, type CondicionPago, getCondicionPagoDescripcion } from '@/services/maestros/condicionesPagoApi';
import { generateSupplierPDF, openSupplierPDFInNewTab } from '@/utils/pdfGenerator';

type BankTheme = {
    cardClass: string;
    headerColor: string;
    labelColor: string;
    valueColor: string;
    badgeClass: string;
};

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

export enum PaymentTermsCode{

}

const DEFAULT_BANK_THEME: BankTheme = {
    cardClass: "bg-white border border-gray-200 text-gray-900",
    headerColor: "text-gray-900",
    labelColor: "text-gray-500",
    valueColor: "text-gray-800",
    badgeClass: "bg-gray-100 text-gray-700 border border-gray-200",
};

const BANK_THEME_VARIANTS: Array<{ keywords: string[]; theme: BankTheme }> = [
    {
        keywords: ["bcp", "credito del peru", "banco de credito"],
        theme: {
            cardClass: "bg-gradient-to-br from-[#002B7F] via-[#003C9E] to-[#F97316] text-white border-none",
            headerColor: "text-white",
            labelColor: "text-white/80",
            valueColor: "text-white",
            badgeClass: "bg-white/50 text-white border border-white/30",
        },
    },
    {
        keywords: ["continental", "bbva"],
        theme: {
            cardClass: "bg-gradient-to-br from-[#001E62] via-[#103B9A] to-[#1D4ED8] text-white border-none",
            headerColor: "text-white",
            labelColor: "text-white/80",
            valueColor: "text-white",
            badgeClass: "bg-white/20 text-white border border-white/30",
        },
    },
    {
        keywords: ["interbank"],
        theme: {
            cardClass: "bg-gradient-to-br from-[#006C3D] via-[#008F4D] to-[#00A859] text-white border-none",
            headerColor: "text-white",
            labelColor: "text-white/80",
            valueColor: "text-white",
            badgeClass: "bg-white/20 text-white border border-white/30",
        },
    },
    {
        keywords: ["scotiabank"],
        theme: {
            cardClass: "bg-gradient-to-br from-[#B00020] via-[#D61F46] to-[#EF4444] text-white border-none",
            headerColor: "text-white",
            labelColor: "text-white/80",
            valueColor: "text-white",
            badgeClass: "bg-white/20 text-white border border-white/40",
        },
    },
];

const removeDiacritics = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getBankTheme = (bankName?: string): BankTheme => {
    if (!bankName) {
        return DEFAULT_BANK_THEME;
    }

    const normalized = removeDiacritics(bankName).toLowerCase();

    const variant = BANK_THEME_VARIANTS.find(({ keywords }) =>
        keywords.some((keyword) => normalized.includes(keyword))
    );

    return variant?.theme ?? DEFAULT_BANK_THEME;
};

const displayBankValue = (value?: string | null) =>
    value && value.trim().length > 0 ? value : "—";

const resolveImageSource = (value?: string | null, fallbackMimeType = 'image/jpeg'): string => {
    if (!value) {
        return '';
    }

    if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
        return value;
    }

    return `data:${fallbackMimeType};base64,${value}`;
};

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

const DOCUMENT_KEYS = DOCUMENT_OPTIONS.map((option) => option.value);
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

const isValueFilled = (value: unknown): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).length > 0;
    }

    return Boolean(value);
};

const countFilledValues = (values: Array<unknown>): number =>
    values.reduce<number>((accumulator, current) => accumulator + (isValueFilled(current) ? 1 : 0), 0);

type BankFieldProps = {
    label: string;
    value: string;
    theme: BankTheme;
};

const BankField: React.FC<BankFieldProps> = ({ label, value, theme }) => (
    <div className="space-y-0">
        <p className={`text-[10px] lowercase tracking-wide ${theme.labelColor}`}>{label}</p>
        <p className={`text-[10px] font-semibold leading-5 ${theme.valueColor}`}>{value}</p>
    </div>
);

type SectionKey = 'coverimage' | 'avatar' | 'general' | 'addresses' | 'contacts' | 'banks' | 'documents' | 'commercial' | 'services';

const SECTION_TITLES: Record<SectionKey, string> = {
    coverimage: "Imagen de portada",
    avatar: 'Logo de empresa',
    general: 'Información General',
    addresses: 'Direcciones',
    contacts: 'Personas de Contacto',
    banks: 'Referencias Bancarias',
    documents: 'Documentos de Evaluación',
    commercial: 'Referencias Comerciales',
    services: 'Servicios Ofrecidos',
};

type CommercialReference = {
    DocEntry: string,
    U_CardCode: string,
    U_RazonSocial: string;
    U_Contacto: string;
    U_Telefonos: string;
};

type ServiceOffered = {
    principalActivity: string;
    serviceLine: string;
    paymentTerms: string;
};

type BankDisplay = {
    bankName: string;
    accountNumber: string;
    accountType: string;
    currency: string;
    sectorista: string;
    phoneNumber: string;
    address: string;
    swiftCode: string;
    iban: string;
};

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

const getDocumentFlag = (value: unknown): boolean => {
    if (Array.isArray(value)) {
        return value.some((item) => {
            if (typeof item === 'boolean') return item;
            if (item && typeof item === 'object') {
                const record = item as { cargado?: boolean; state?: string };
                return Boolean(record.cargado) || record.state === 'aprobado';
            }
            return false;
        });
    }

    if (value && typeof value === 'object') {
        const record = value as { cargado?: boolean; state?: string };
        return Boolean(record.cargado) || record.state === 'aprobado';
    }

    return Boolean(value);
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "Activo":
            return "success";
        case "Pendiente":
            return "warning";
        case "Suspendido":
            return "default";
        case "Inactivo":
            return "danger";
        default:
            return "default";
    }
};
const getProgressColor = (puntuacion: number) => {
    if (puntuacion >= 80) return 'success';
    if (puntuacion >= 40) return 'warning';
    if (puntuacion >= 0) return 'danger';
    return 'default';
};

// =================================== CONSULTA DE DESCRIPCION DE TIPO DE PERSON ============================
const getChipConfig = (personType?: string) => {
    const tipo = ProveedorValidator.obtenerTipoByCodigo(personType) || TipoProveedorCodigo.NATURAL;
    const descripcion = ProveedorValidator.obtenerDescripcionTipo(tipo);

    const configs = {
        [TipoProveedorCodigo.JURIDICA]: {
            color: "primary" as const,
            icon: DocumentTextIcon,
        },
        [TipoProveedorCodigo.NATURAL]: {
            color: "warning" as const,
            icon: ExclamationTriangleIcon,
        },
        [TipoProveedorCodigo.NO_DOMICILIADO]: {
            color: "secondary" as const,
            icon: GlobeAltIcon,
        },
        [TipoProveedorCodigo.ADQUIRIENTE_TICKET]: {
            color: "success" as const,
            icon: TicketIcon,
        }
    };

    return {
        ...configs[tipo],
        descripcion
    };
};
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
     const supplierCode = currentUser?.supplierId ?? currentUser?.userCode ?? '';
     const [isLoading, setIsLoading] = React.useState(false);
     const [formData, setFormData] = React.useState<SupplierApiRecord | null>(null);
     const [activeSection, setActiveSection] = React.useState<SectionKey | null>(null);
     const {isOpen, onOpen, onOpenChange} = useDisclosure();
     const [condicionesPago, setCondicionesPago] = React.useState<CondicionPago[]>([]);
     const [condicionPagoDescripcion, setCondicionPagoDescripcion] = React.useState<string | null>(null);
     const [isSaving, setIsSaving] = React.useState(false);
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [isGlobalLoading, setIsGlobalLoading] = React.useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
     const navigate = useNavigate()
    const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
    const coverImageOriginalRef = React.useRef<string | null>(null);
    const avatarOriginalRef = React.useRef<string | null>(null);
    const savedCoverImageRef = React.useRef<string>('');
    const savedAvatarRef = React.useRef<string>('');
 
     const bankEntries = formData?.Bancos ?? [];
     const bankCards: BankDisplay[] = bankEntries.length > 0
         ? bankEntries.map((bank) => ({
             bankName: bank.Banco,
             accountNumber: bank.Cuenta,
             accountType: '',
             currency: '',
             sectorista: bank.Sectorista,
             phoneNumber: '',
             address: '',
             swiftCode: '',
             iban: '',
         }))
         : (selectedSupplier?.bankReferences ?? []).map((bank) => ({
             bankName: bank.bankName,
             accountNumber: bank.accountNumber,
             accountType: bank.accountType ?? '',
             currency: bank.currency ?? '',
             sectorista: bank.sectorista ?? '',
             phoneNumber: bank.phoneNumber ?? '',
             address: bank.address ?? '',
             swiftCode: bank.swiftCode ?? '',
             iban: bank.iban ?? '',
         }));
     const contactList = formData?.Contactos ?? [];
     const primaryContact = contactList[0];
     const displayName = formData?.NombreSN ?? selectedSupplier?.cardName ?? '—';
     const displayCode = formData?.CodigoSN ?? selectedSupplier?.cardCode ?? '—';
     const displayPhone = selectedSupplier?.phone ?? '—';
     const displayEmail = formData?.Correo ?? selectedSupplier?.email ?? '—';
     const displayWebsite = formData?.website ?? selectedSupplier?.website ?? '';
     const displayRegistration = formData?.createDate ?? selectedSupplier?.registrationDate ?? '—';
     const displayLastUpdate = formData?.updateDate ?? selectedSupplier?.lastProfileUpdate ?? selectedSupplier?.registrationDate ?? '—';
 
     useEffect(() => {
         /*if (selectedSupplier || !supplierCode) {
             return;
         }*/
        console.log("Prueba", "mensaje")
        let isMounted = true;

        const loadSupplier = async () => {
            setIsLoading(true);
            setIsGlobalLoading(true);

            try {
                console.log("API", "nuevas api");
                const result = await fetchSupplierByCardCode(supplierCode);
                if (result && isMounted) {
                    console.log("API-IF",result)
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
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    setIsGlobalLoading(false);
                }
            }
        };

        loadSupplier();
        //ejemplosUso()
         console.log("Phone-CardProfile", )
        return () => {
            isMounted = false;
        };
    }, [supplierCode, setSelectedSupplier]);

    useEffect(() => {
        coverImageOriginalRef.current = null;
        avatarOriginalRef.current = null;
        setCoverPreview(null);
        setAvatarPreview(null);
    }, [selectedSupplier?.cardCode, formData?.CodigoSN]);

    // Cargar condiciones de pago cuando se carga el componente
    useEffect(() => {
        const loadCondicionesPago = async () => {
            try {
                const condiciones = await fetchCondicionesPago();
                setCondicionesPago(condiciones);
            } catch (error) {
                console.error('Error al cargar condiciones de pago:', error);
            }
        };
        loadCondicionesPago();
    }, []);

    // Obtener descripción cuando cambia el código de condición de pago
    useEffect(() => {
        if (formData?.CondicionPago && condicionesPago.length > 0) {
            const condicion = condicionesPago.find(c => c.GroupNum === formData.CondicionPago);
            setCondicionPagoDescripcion(condicion?.PymntGroup || formData.CondicionPago);
        } else if (formData?.CondicionPago && condicionesPago.length === 0) {
            // Si aún no se han cargado las condiciones, intentar obtener la descripción
            getCondicionPagoDescripcion(formData.CondicionPago).then(descripcion => {
                setCondicionPagoDescripcion(descripcion || formData.CondicionPago || null);
            });
        } else {
            setCondicionPagoDescripcion(null);
        }
    }, [formData?.CondicionPago, condicionesPago]);


    const handleOpenSection = (section: SectionKey) => {
        if (!formData) {
            console.log("Notificacion", "Aún no se ha cargado la información del proveedor." )
            addToast({
                title: 'Información no disponible',
                description: 'Aún no se ha cargado la información del proveedor.',
                color: 'warning',
                timeout: 3000,
            });
            return;
        }
        console.log(section)
        setApiError(null);
        setActiveSection(section);
        onOpen();
        setTimeout(() => {
            setIsGlobalLoading(false);
        }, 0);
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

    const handleDocumentSwitchPress = (documentKey: string, label: string) => {
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
    };

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
            await generateSupplierPDF(selectedSupplier, completionPercentage);
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
            await openSupplierPDFInNewTab(selectedSupplier, completionPercentage);
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

    const handleSaveSection = async (onClose: () => void) => {
        if (!formData) {
            return;
        }

        setIsSaving(true);
        setIsGlobalLoading(true);
        setApiError(null);

        try {
            console.log("formData", formData)
            const payload: SupplierApiRecord = {
                ...formData,
                coverImage: normalizeImagePayloadValue(savedCoverImageRef.current || formData.coverImage),
                Avatar: normalizeImagePayloadValue(savedAvatarRef.current || formData.Avatar),
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
            onClose();
            setActiveSection(null);
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

    const renderSectionContent = () => {
        if (!formData || !activeSection) {
            return <p className="text-sm text-gray-500">Selecciona una sección para editar.</p>;
        }

        switch (activeSection) {
            case 'coverimage': {
                const coverFallback = (formData.coverImage || selectedSupplier?.coverImage || '').trim();
                const coverImageSrc = coverPreview ?? resolveImageSource(coverFallback);
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-6 md:flex-row">
                            <div className="flex-1">
                                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                                    {coverImageSrc ? (
                                        <img
                                            alt="Vista previa de la portada"
                                            className="h-full w-full object-cover"
                                            src={coverImageSrc}
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                            Aún no hay imagen de portada
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full space-y-4 md:w-72">
                                <p className="text-sm text-gray-600">
                                    Sube una imagen en formato JPG, PNG o WEBP (máx. 5&nbsp;MB). El archivo se convertirá a base64 al guardar esta sección.
                                </p>
                                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
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
                );
            }
            case 'avatar': {
                const avatarFallback = (formData.Avatar || selectedSupplier?.avatar || '').trim();
                const avatarImageSrc = avatarPreview ?? resolveImageSource(avatarFallback);
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-300 bg-gray-50">
                                {avatarImageSrc ? (
                                    <img
                                        alt="Vista previa del logo"
                                        className="h-full w-full object-cover"
                                        src={avatarImageSrc}
                                    />
                                ) : (
                                    <span className="text-sm text-gray-400">Sin logo</span>
                                )}
                            </div>
                            <div className="flex w-full flex-1 flex-col gap-4">
                                <p className="text-sm text-gray-600">
                                    Sube el logo corporativo (recomendado cuadrado). El archivo se transformará a base64 y se enviará al guardar.
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
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
                );
            }
            case 'general':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Código" value={formData.CodigoSN} onValueChange={(value) => handleFieldChange('CodigoSN', value)} isDisabled/>
                            <Input label="Razón Social" value={formData.NombreSN} onValueChange={(value) => handleFieldChange('NombreSN', value)} isDisabled/>
                            <Input label="RUC" value={formData.RUC} onValueChange={(value) => handleFieldChange('RUC', value)} isDisabled/>
                            <Input label="Tipo de Persona" value={getPersonTypeEnumKey(formData.TipoPersona)} onValueChange={(value) => handleFieldChange('TipoPersona', value)} isDisabled/>
                            <Input label="Tipo de Documento" value={getDocumentTypeEnumKey(formData.TipoDocumento)} onValueChange={(value) => handleFieldChange('TipoDocumento', value)}/>
                            <Input label="Moneda" value={formData.Moneda} onValueChange={(value) => handleFieldChange('Moneda', value)}/>
                            <Input label="Teléfono 1" value={formData.Telefono1} onValueChange={(value) => handleFieldChange('Telefono1', value)}/>
                            <Input label="Teléfono 2" value={formData.Telefono2} onValueChange={(value) => handleFieldChange('Telefono2', value)}/>
                            <Input label="Teléfono Móvil" value={formData.TelefonoMovil} onValueChange={(value) => handleFieldChange('TelefonoMovil', value)}/>
                            <Input label="Correo" value={formData.Correo} onValueChange={(value) => handleFieldChange('Correo', value)}/>
                            <Input label="Sitio Web" value={formData.website ?? ''} onValueChange={(value) => handleFieldChange('website', value)}/>
                            <Input 
                                label="Condición de Pago" 
                                value={condicionPagoDescripcion || formData.CondicionPago || ''} 
                                onValueChange={(value) => handleFieldChange('CondicionPago', value)}
                                isReadOnly
                                description={formData.CondicionPago ? `Código: ${formData.CondicionPago}` : undefined}
                            />
                            <Input label="Resolución Agente Retención" value={formData.ResolucionAgenteRetencion} onValueChange={(value) => handleFieldChange('ResolucionAgenteRetencion', value)} isDisabled/>
                            <Input label="Resolución Agente Percepción" value={formData.ResolucionAgentePercepcion} onValueChange={(value) => handleFieldChange('ResolucionAgentePercepcion', value)} isDisabled/>
                        </div>
                        <Divider/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Estado Contribuyente" value={formData.statusContributer ?? ''} onValueChange={(value) => handleFieldChange('statusContributer', value)}/>
                            <Input label="Estado Domicilio" value={formData.statusDomicilio ?? ''} onValueChange={(value) => handleFieldChange('statusDomicilio', value)}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Fecha de Creación" value={formData.createDate} isDisabled/>
                            <Input label="Última Actualización" value={formData.updateDate} isDisabled/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <Switch isSelected={formData.agenteRetencion === 'Y'} onValueChange={handleToggleField('agenteRetencion')} size="sm">
                                Agente de Retención
                            </Switch>
                            <Switch isSelected={formData.agentePercepcion === 'Y'} onValueChange={handleToggleField('agentePercepcion')} size="sm">
                                Agente de Percepción
                            </Switch>
                            <Switch isSelected={formData.exoPercepcion === 'Y'} onValueChange={handleToggleField('exoPercepcion')} size="sm">
                                Exonerado Percepción
                            </Switch>
                            <Switch isSelected={formData.goodContributor === 'Y'} onValueChange={handleToggleField('goodContributor')} size="sm">
                                Buen Contribuyente
                            </Switch>
                        </div>
                    </div>
                );
            case 'addresses':
                return (
                    <div className="space-y-4">
                        {(formData.Direcciones ?? []).map((direccion, index) => (
                            <Card key={`address-${index}`} className="border border-gray-200">
                                <CardBody className="space-y-4">
                                    <Input
                                        label="Dirección"
                                        value={direccion.Direccion}
                                        onValueChange={(value) =>
                                            setFormData((prev) => {
                                                if (!prev) return prev;
                                                const updated = [...(prev.Direcciones ?? [])];
                                                updated[index] = { ...updated[index], Direccion: value };
                                                return { ...prev, Direcciones: updated };
                                            })
                                        }
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/*<Input
                                            label="Dirección SUNAT"
                                            value={index === 0 ? (formData.DireccionSUNAT ?? '') : ''}
                                            isDisabled={index !== 0}
                                            onValueChange={(value) => handleFieldChange('DireccionSUNAT', value)}
                                        />*/}
                                        <Input
                                            label="Departamento"
                                            value={direccion.Departamento}
                                            onValueChange={(value) =>
                                                setFormData((prev) => {
                                                    if (!prev) return prev;
                                                    const updated = [...(prev.Direcciones ?? [])];
                                                    updated[index] = { ...updated[index], Departamento: value };
                                                    return { ...prev, Direcciones: updated };
                                                })
                                            }
                                        />
                                        <Input
                                            label="Provincia"
                                            value={direccion.Provincia}
                                            onValueChange={(value) =>
                                                setFormData((prev) => {
                                                    if (!prev) return prev;
                                                    const updated = [...(prev.Direcciones ?? [])];
                                                    updated[index] = { ...updated[index], Provincia: value };
                                                    return { ...prev, Direcciones: updated };
                                                })
                                            }
                                        />
                                        <Input
                                            label="Distrito"
                                            value={direccion.Distrito}
                                            onValueChange={(value) =>
                                                setFormData((prev) => {
                                                    if (!prev) return prev;
                                                    const updated = [...(prev.Direcciones ?? [])];
                                                    updated[index] = { ...updated[index], Distrito: value };
                                                    return { ...prev, Direcciones: updated };
                                                })
                                            }
                                        />
                                        <Input
                                            label="Ubigeo"
                                            value={direccion.Ubigeo}
                                            onValueChange={(value) =>
                                                setFormData((prev) => {
                                                    if (!prev) return prev;
                                                    const updated = [...(prev.Direcciones ?? [])];
                                                    updated[index] = { ...updated[index], Ubigeo: value };
                                                    return { ...prev, Direcciones: updated };
                                                })
                                            }
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                );
            case 'contacts': {
                const contactos = formData.Contactos ?? [];
                return (
                    <div className="space-y-4">
                        {contactos.map((contacto, index) => (
                            <Card key={`contact-${index}`} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Nombre" value={contacto.Name} onValueChange={(value) => handleContactChange(index, 'Name', value)}/>
                                        <Input label="Correo" value={contacto.E_MailL} onValueChange={(value) => handleContactChange(index, 'E_MailL', value)}/>
                                        <Input label="Profesión / Cargo" value={contacto.Profesion} onValueChange={(value) => handleContactChange(index, 'Profesion', value)}/>
                                        <Input label="Teléfono" value={contacto.Telefono} onValueChange={(value) => handleContactChange(index, 'Telefono', value)}/>
                                    </div>
                                    <Switch isSelected={contacto.Active === 'Y'} onValueChange={(value) => handleContactChange(index, 'Active', value)} size="sm">
                                        Activo
                                    </Switch>
                                    <div className="flex justify-end">
                                        <Button color="danger" variant="light" size="sm" isDisabled={isGlobalLoading} onPress={() => removeContact(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" isDisabled={isGlobalLoading} onPress={addContact}>
                            Agregar contacto
                        </Button>
                    </div>
                );
            }
            case 'banks': {
                const bancos = bankEntries.length > 0 ? bankEntries : [];
                return (
                    <div className="space-y-4">
                        {bancos.map((banco, index) => {
                            const theme = getBankTheme(banco.Banco);
                            return (
                                <Card key={`bank-${index}`} >
                                    <CardBody className="space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className={`text-xs font-semibold uppercase tracking-wide ${theme.labelColor}`}>Banco</p>
                                                <Input value={banco.Banco} onValueChange={(value) => handleBankChange(index, 'Banco', value)} variant="bordered" size="sm"/>
                                            </div>
                                            <Chip size="sm" className={`${theme.badgeClass}`}>
                                                {`Cuenta ${index + 1}`}
                                            </Chip>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Número de Cuenta" value={banco.Cuenta} onValueChange={(value) => handleBankChange(index, 'Cuenta', value)}/>
                                            <Input label="Sectorista" value={banco.Sectorista} onValueChange={(value) => handleBankChange(index, 'Sectorista', value)}/>
                                        </div>
                                        <div className="flex justify-end">
                                        <Button color="danger" variant="light" size="sm" isDisabled={isGlobalLoading} onPress={() => removeBank(index)}>
                                                Eliminar
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                        <Button variant="bordered" size="sm" isDisabled={isGlobalLoading} onPress={addBank}>
                            Agregar cuenta bancaria
                        </Button>
                    </div>
                );
            }
            case 'documents': {
                const documentos = formData.DocumentoEvaluacion ?? [];
                const usedDocumentKeys = new Set(
                    documentos
                        .map((doc) => normaliseDocumentKey(doc.U_DocumentoEvaluacion))
                        .filter((value): value is string => Boolean(value))
                );
                const availableDocumentOptions = DOCUMENT_OPTIONS.filter(
                    ({ value }) => !usedDocumentKeys.has(value)
                );
                return (
                    <div className="space-y-4">
                        {documentos.map((documento, index) => (
                            <Card key={`document-${index}`} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select
                                            label="Documento"
                                            selectedKeys={
                                                normaliseDocumentKey(documento.U_DocumentoEvaluacion)
                                                    ? [normaliseDocumentKey(documento.U_DocumentoEvaluacion)!]
                                                    : []
                                            }
                                            isDisabled={Boolean(documento.U_DocumentoEvaluacion)}
                                            placeholder="Selecciona un documento"
                                            onSelectionChange={(keys: Selection) => {
                                                if (keys === 'all') {
                                                    return;
                                                }
                                                const selectedKey = [...keys][0] as string | undefined;
                                                if (selectedKey) {
                                                    const normalizedKey = normaliseDocumentKey(selectedKey) ?? selectedKey;
                                                    handleDocumentChange(index, 'U_DocumentoEvaluacion', normalizedKey);
                                                }
                                            }}
                                        >
                                            {(documento.U_DocumentoEvaluacion
                                                ? DOCUMENT_OPTIONS
                                                : availableDocumentOptions
                                            ).map(({ value, label }) => (
                                                <SelectItem key={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Input label="Nombre de Archivo" value={documento.U_NombDocu}
                                               onValueChange={(value) => handleDocumentChange(index, 'U_NombDocu', value)}/>
                                        <Input label="Estado" value={documento.U_Status}
                                               onValueChange={(value) => handleDocumentChange(index, 'U_Status', value)}/>
                                        <Input label="Tipo de Archivo" value={documento.U_typeArchiv}
                                               onValueChange={(value) => handleDocumentChange(index, 'U_typeArchiv', value)}/>
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
                                        {documento.U_LinkDocumento ? (
                                            documento.U_LinkDocumento.startsWith('http') ? (
                                                <Link href={documento.U_LinkDocumento} className="text-xs text-blue-600"
                                                      target="_blank" rel="noopener noreferrer">
                                                    Ver documento actual
                                                </Link>
                                            ) : (
                                                <Chip size="sm" variant="flat" color="primary">
                                                    Archivo cargado (pendiente de guardar)
                                                </Chip>
                                            )
                                        ) : (
                                            <span className="text-[11px] text-gray-500">
                                                    Selecciona un archivo PDF para actualizar el documento.
                                                </span>
                                        )}
                                    </div>
                                    <Textarea
                                        isReadOnly
                                        label="Identificador actual"
                                        minRows={2}
                                        value={documento.U_LinkDocumento ?? ''}
                                    />
                                    <div className="flex justify-end">
                                        <Button color="danger" variant="light" size="sm" isDisabled={isGlobalLoading}
                                                onPress={() => removeDocument(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" isDisabled={isGlobalLoading} onPress={addDocument}>
                            Agregar documento
                        </Button>
                    </div>
                );
            }
            case 'commercial': {
                const referencias: CommercialReference[] = formData.ReferenciasComerciales ?? [];
                return (
                    <div className="space-y-4">
                        {referencias.map((referencia, index) => (
                            <Card key={`ref-${index}`} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="Razón Social" value={referencia.U_RazonSocial}
                                           onValueChange={(value) => handleCommercialChange(index, 'U_RazonSocial', value)}/>
                                    <Input label="Contacto" value={referencia.U_Contacto}
                                           onValueChange={(value) => handleCommercialChange(index, 'U_Contacto', value)}/>
                                    <Input label="Teléfono" value={referencia.U_Telefonos}
                                           onValueChange={(value) => handleCommercialChange(index, 'U_Telefonos', value)}/>
                                    <div className="md:col-span-3 flex justify-end">
                                        <Button color="danger" variant="light" size="sm" isDisabled={isGlobalLoading}
                                                onPress={() => removeCommercial(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" isDisabled={isGlobalLoading} onPress={() => addCommercial(formData?.CodigoSN)}>
                            Agregar referencia comercial
                        </Button>
                    </div>
                );
            }
            case 'services': {
                const servicios: ServiceOffered[] = formData.ServiciosOfrecidos ?? [];
                return (
                    <div className="space-y-4">
                        {servicios.map((servicio, index) => (
                            <Card key={`service-${index}`} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="Actividad Principal" value={servicio.principalActivity} onValueChange={(value) => handleServiceChange(index, 'principalActivity', value)}/>
                                    <Input label="Línea de Servicio" value={servicio.serviceLine} onValueChange={(value) => handleServiceChange(index, 'serviceLine', value)}/>
                                    <Input label="Condición de Pago" value={servicio.paymentTerms} onValueChange={(value) => handleServiceChange(index, 'paymentTerms', value)}/>
                                    <div className="md:col-span-3 flex justify-end">
                                        <Button color="danger" variant="light" size="sm" isDisabled={isGlobalLoading} onPress={() => removeService(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" isDisabled={isGlobalLoading} onPress={addService}>
                            Agregar servicio
                        </Button>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    useEffect(()=>{
       console.log("Informacion", "nueva informacion");
    },[])

    function getRandomColor() {
        const colors = ['rgba(255,107,107,0.68)', 'rgba(107,203,119,0.68)', 'rgba(77,150,255,0.68)', 'rgba(255,217,61,0.68)', '#9D4EDD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function getNumberDocuments() {
        const documents = selectedSupplier?.Documentos ?? createDefaultDocuments();
        const documentsRecord = (documents ?? {}) as unknown as Record<string, unknown>;

        return DOCUMENT_KEYS.reduce<number>((count, key) => {
            const value = documentsRecord[key as string];
            return count + (getDocumentFlag(value) ? 1 : 0);
        }, 0);
    }

    const completionPercentage = React.useMemo(() => {
        if (!selectedSupplier && !formData) {
            return 0;
        }

        const supplierDocumentsRaw = selectedSupplier?.Documentos ?? createDefaultDocuments();
        const supplierDocuments = (supplierDocumentsRaw ?? {}) as unknown as Record<string, unknown>;
        const recordDocuments = formData?.DocumentoEvaluacion ?? [];
        const supplierAddresses = ((selectedSupplier?.addresses ?? []) as unknown as Array<Record<string, unknown>>);
        const taxInfo = selectedSupplier as { taxId?: string; ruc?: string } | null | undefined;

        const generalValues = [
            formData?.NombreSN ?? selectedSupplier?.cardName ?? '',
            formData?.RUC ?? taxInfo?.taxId ?? taxInfo?.ruc ?? '',
            formData?.Correo ?? selectedSupplier?.email ?? '',
            formData?.Telefono1 ?? selectedSupplier?.phone ?? '',
            formData?.Telefono2 ?? '',
            formData?.TelefonoMovil ?? '',
            formData?.CondicionPago ?? '',
            formData?.Moneda ?? '',
            formData?.TipoDocumento ?? '',
            formData?.TipoPersona ?? '',
            formData?.website ?? selectedSupplier?.website ?? '',
        ];

        const primaryAddressCandidate = supplierAddresses[0];
        const addressValuesBase = [
            formData?.Direccion ?? (primaryAddressCandidate?.address as string | undefined) ?? '',
            formData?.DireccionSUNAT ?? '',
            formData?.Distrito ?? (primaryAddressCandidate?.district as string | undefined) ?? (primaryAddressCandidate?.city as string | undefined) ?? '',
            formData?.Provincia ?? (primaryAddressCandidate?.province as string | undefined) ?? '',
            formData?.Departamento ?? (primaryAddressCandidate?.departament as string | undefined) ?? '',
            formData?.Ubigeo ?? (primaryAddressCandidate?.ubigeo as string | undefined) ?? '',
        ];

        let addressFilled = countFilledValues(addressValuesBase);
        let addressTotal = addressValuesBase.length;

        supplierAddresses.slice(1).forEach((addressObject) => {
            const extraValues = [
                addressObject.address as string | undefined,
                addressObject.city as string | undefined,
                addressObject.province as string | undefined,
                addressObject.departament as string | undefined,
                addressObject.ubigeo as string | undefined,
            ];
            addressFilled += countFilledValues(extraValues);
            addressTotal += extraValues.length;
        });

        const contactosFuente = formData?.Contactos ?? [];
        const contactosFieldTotal = contactosFuente.length * 3;
        const contactosFilled = contactosFuente.reduce<number>((acc, contacto) => (
            acc +
            (isValueFilled(contacto.Name) ? 1 : 0) +
            (isValueFilled(contacto.E_MailL) ? 1 : 0) +
            (isValueFilled(contacto.Telefono) ? 1 : 0)
        ), 0);

        const bancosFuente = (formData?.Bancos ?? []).length > 0
            ? formData?.Bancos ?? []
            : ((selectedSupplier?.bankReferences ?? []) as unknown as Array<Record<string, unknown>>).map((bank) => ({
                Banco: bank.bankName,
                Cuenta: bank.accountNumber,
                Sectorista: bank.sectorista,
            })) as Banco[];

        const bancosFieldTotal = bancosFuente.length * 3;
        const bancosFilled = bancosFuente.reduce<number>((acc, banco) => (
            acc +
            (isValueFilled(banco.Banco) ? 1 : 0) +
            (isValueFilled(banco.Cuenta) ? 1 : 0) +
            (isValueFilled(banco.Sectorista) ? 1 : 0)
        ), 0);

        const documentosFilled = DOCUMENT_KEYS.reduce<number>((count, key) => {
            const supplierValue = supplierDocuments[key];
            const matchingRecord = recordDocuments.find((doc) => doc.U_DocumentoEvaluacion === key);
            const hasRecordDoc = matchingRecord ? isValueFilled(matchingRecord.U_LinkDocumento) : false;
            const hasDoc = getDocumentFlag(supplierValue) || hasRecordDoc;
            return count + (hasDoc ? 1 : 0);
        }, 0);

        const referenciasFuente = formData?.ReferenciasComerciales ?? [];
        const referenciasFieldTotal = referenciasFuente.length * 3;
        const referenciasFilled = referenciasFuente.reduce<number>((acc, referencia) => (
            acc +
            (isValueFilled(referencia.U_RazonSocial) ? 1 : 0) +
            (isValueFilled(referencia.U_Contacto) ? 1 : 0) +
            (isValueFilled(referencia.U_Telefonos) ? 1 : 0)
        ), 0);

        const serviciosFuente = formData?.ServiciosOfrecidos ?? [];
        const serviciosFieldTotal = serviciosFuente.length * 3;
        const serviciosFilled = serviciosFuente.reduce<number>((acc, servicio) => (
            acc +
            (isValueFilled(servicio.principalActivity) ? 1 : 0) +
            (isValueFilled(servicio.serviceLine) ? 1 : 0) +
            (isValueFilled(servicio.paymentTerms) ? 1 : 0)
        ), 0);

        const safeDivision = (filled: number, total: number) => (total > 0 ? filled / total : 0);

        const sectionScores = {
            general: safeDivision(countFilledValues(generalValues), generalValues.length),
            addresses: safeDivision(addressFilled, addressTotal),
            contacts: safeDivision(contactosFilled, contactosFieldTotal),
            banks: safeDivision(bancosFilled, bancosFieldTotal),
            documents: safeDivision(documentosFilled, DOCUMENT_KEYS.length),
            commercial: safeDivision(referenciasFilled, referenciasFieldTotal),
            services: safeDivision(serviciosFilled, serviciosFieldTotal),
        };

        const SECTION_WEIGHTS: Record<SectionKey, number> = {
            general: 0.25,
            addresses: 0.15,
            contacts: 0.15,
            banks: 0.1,
            documents: 0.2,
            commercial: 0.075,
            services: 0.075,
            coverimage: 0,
            avatar: 0,
        };

        const weightedScore = (Object.entries(sectionScores) as Array<[SectionKey, number]>).reduce(
            (acc, [section, score]) => acc + score * SECTION_WEIGHTS[section],
            0,
        );

        return Math.min(100, Math.max(0, Math.round(weightedScore * 100)));
    }, [formData, selectedSupplier]);

    if (isLoading && !selectedSupplier) {
        return (
            <Dashboard>
                <div className="flex w-full justify-center py-20">
                    <Spinner label="Cargando información del proveedor..." />
                </div>
            </Dashboard>
        );
    }

    if (!selectedSupplier) {
        return (
            <Dashboard>
                <div className="flex w-full justify-center py-20 text-sm text-gray-500">
                    No se encontró información del proveedor.
                </div>
            </Dashboard>
        );
    }
    //console.log("Avtar", selectedSupplier.avatar)

    return (
        <Dashboard>
            {(isGlobalLoading || isLoading) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Spinner label="Procesando..." color="primary" />
                </div>
            )}
            <Card className=" mx-auto shadow-lg">
                {/* Cover Image Section */}
                <CardHeader className="p-0 relative">
                    <div className="w-full h-48 relative overflow-hidden rounded-t-lg">
                        {/*<img
                            src={coverImage}
                            alt="Imagen de portada"
                            className="w-full h-48 object-cover"
                        />*/}
                        {selectedSupplier?.coverImage ? (
                            <img
                                src={selectedSupplier?.coverImage}
                                alt="Imagen de portada"
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-48"
                                style={{backgroundColor: getRandomColor()}}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"/>

                        {/* Cover Photo Edit Button */}
                        <Button
                            isDisabled={isGlobalLoading}
                            isIconOnly
                            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white"
                            size="sm"
                            onPress={() => handleOpenSection('coverimage')}
                        >
                            <CameraIcon className="w-4 h-4 text-gray-700"/>
                        </Button>
                    </div>
                    {/* Profile Picture */}
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <Avatar
                                src={selectedSupplier?.avatar}
                                alt={selectedSupplier?.cardName}
                                className="w-32 h-32 border-4 border-white shadow-lg"
                            />
                            <Button
                                isDisabled={isGlobalLoading}
                                isIconOnly
                                size="sm"
                                className="absolute bottom-2 right-2 bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                onPress={() => handleOpenSection('avatar')}
                            >
                                <CameraIcon className="w-4 h-4 text-gray-600"/>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                {/* Profile Info Section */}
                <CardBody className="pt-20 px-8 pb-6">
                    <div className="flex justify-between items-start mb-0">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        onPress={() => handleOpenSection('general')}
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PencilIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                <div className="flex items-center">
                                    <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600 mr-3"/>
                                    <span className="font-bold mr-4">{displayPhone}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-1 max-w-md">{displayCode}</p>
                        </div>


                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                color="primary"
                                startContent={<StarIcon className="w-4 h-4"/>}
                                className="bg-blue-600 hover:bg-blue-700"
                                onPress={() => navigate("/proveedor/evaluacion")}
                                isDisabled={isGlobalLoading}
                            >
                                EVALUACIÓNES
                            </Button>
                            <Button
                                size="sm"
                                color="secondary"
                                variant="bordered"
                                startContent={<DocumentArrowDownIcon className="w-4 h-4"/>}
                                onPress={handleViewPDF}
                                isLoading={isGeneratingPDF}
                                isDisabled={isGlobalLoading}
                            >
                                VER PDF
                            </Button>
                            <Button
                                size="sm"
                                color="success"
                                variant="flat"
                                startContent={<ArrowDownTrayIcon className="w-4 h-4"/>}
                                onPress={handleGeneratePDF}
                                isLoading={isGeneratingPDF}
                                isDisabled={isGlobalLoading}
                            >
                                DESCARGAR
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between w-full items-center gap-4 text-sm text-gray-500 mb-4">
                        {/* Izquierda */}
                        <div className="flex space-x-5 items-center">
                            <Chip
                                color={getStatusColor(selectedSupplier?.status || "")}
                                variant="shadow"
                                size="sm"
                            >
                                {selectedSupplier?.status}
                            </Chip>
                            <div><span
                                className="font-semibold text-xs">{getNumberDocuments()}/{DOCUMENT_KEYS.length} </span><span
                                className="text-xs">Documentos</span></div>
                            <span
                                className="text-xs">Última actualización: {displayLastUpdate}</span>
                        </div>

                        {/* Derecha - Progress bar */}
                        <div className="w-52">

                            <Progress
                                className="max-w-md"
                                color={getProgressColor(completionPercentage)}
                                label="Completado"
                                maxValue={100}
                                showValueLabel={true}
                                size="sm"
                                radius="sm"
                                value={completionPercentage}
                            />

                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-0">
                            <div className="flex items-center gap-3 text-gray-700">
                                <EnvelopeIcon className="w-4 h-4 text-gray-500"/>
                                <span className="text-xs">{displayEmail}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <UserPlusIcon className="w-4 h-4 text-gray-500"/>
                                <span
                                    className="text-xs">Contactar con {primaryContact?.Name || " - "}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <MapPinIcon className="w-4 h-4 text-gray-500"/>
                                <span
                                    className="text-xs">{selectedSupplier?.addresses?.[0].address} - {selectedSupplier?.addresses?.[0].city}, {selectedSupplier?.addresses?.[0].province}</span>
                            </div>
                        </div>
                        <div className="space-y-0">
                            <div className="flex items-center gap-3 text-gray-700">
                            <GlobeAltIcon className="w-4 h-4 text-gray-500"/>
                                <Link className="text-xs" href={displayWebsite}>
                                    {displayWebsite || 'Sin sitio web'}
                                </Link>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <CalendarIcon className="w-4 h-4 text-gray-500"/>
                                <span className="text-xs">Se unió en {displayRegistration}</span>
                            </div>
                        </div>
                    </div>

                    {/*====================== SUNAT STATES ======================*/}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2 mb-6">
                            { selectedSupplier?.goodContributor && (
                                <Chip color="success" variant="flat" size="sm">Buen Contribuidor</Chip>
                            )}

                            {(() => {
                                const { color, descripcion } = getChipConfig(selectedSupplier?.personType);
                                return (
                                    <Chip color={color} variant="flat" size="sm">{descripcion}</Chip>
                                );
                            })()}

                            { selectedSupplier?.agentePercepcion && (
                                <Chip color="warning" variant="flat" size="sm">Agente de Percepción</Chip>
                            )}

                            { selectedSupplier?.exoneradoPercepcion && (
                                <Chip color="warning" variant="flat" size="sm">Exonerado Percepción</Chip>
                            )}

                        </div>
                    </div>

                    {/*====================== ADDRESS TITLE ======================*/}
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Direcciones</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('addresses')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*====================== ADDRESS CARD ======================*/}
                    {selectedSupplier?.addresses && selectedSupplier.addresses.length > 0 ? (
                        selectedSupplier.addresses?.map((item, index) => (
                            <Card key={index} radius="lg" shadow="sm" className="w-full  mx-auto mt-4">
                                <CardBody className="p-4">
                                    <div className="grid grid-cols-6 md:grid-cols-12 gap-6 items-center">

                                        {/* INFORMACION EN LA TARJETA COMPLETA */}
                                        <div className="relative col-span-12 md:col-span-12">
                                            {/* CABECERA - PRIMERA LINEA */}
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-gray-800">
                                                    <BuildingOffice2Icon className="h-4 w-4 text-gray-600"/>
                                                    <span className="text-sm font-semibold">{item.address}</span>
                                                    <span className="text-sm text-gray-500">{`(${item.type})`}</span>
                                                </div>

                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    radius="full"
                                                    size="sm"
                                                    startContent={<PencilIcon className="h-4 w-4 text-gray-600"/>}
                                                    aria-label="Agregar"
                                                />
                                            </div>

                                            {/* DIRECCION */}
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPinIcon className="h-4 w-4 mt-0 text-gray-500"/>
                                                <div className="flex flex-col">
                                                    <span>{item.city} - {item.province} - {item.departament}</span>
                                                </div>
                                            </div>

                                            {/* UBIGEO */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <IdentificationIcon className="h-4 w-4 text-gray-400"/>
                                                <span>Ubigeo: {item.ubigeo}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    ) : (
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            <span className="text-xs text-center">No hay direcciones registradas</span>
                        </div>
                    )}

                    { /*====================== CONTACT PERSON TITLE ======================*/ }
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Personas de Contacto</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('contacts')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>


                    { /*====================== CONTACT PERSON CARD ======================*/ }
                    {contactList.length > 0 ? (
                         <>
                         {/*<Accordion selectionMode="multiple">
                                 {contactList.map((contacto, index) => (
                                     <AccordionItem
                                         key={index}
                                         aria-label="Zoey Lang"
                                         startContent={
                                             <Avatar
                                                 isBordered
                                                 color="warning"
                                                 radius="lg"
                                                 src="https://i.pravatar.cc/150?u=a04258114e29026702d"
                                             />
                                         }
                                         subtitle={
                                             <p className="flex space-x-4 items-center text-sm text-gray-500">
                                                 <span className="text-primary ml-3">{contacto.E_MailL || 'Sin correo'}</span>
                                                 <span className="text-xs">{contacto.Profesion || 'Sin asignar'}</span>
                                             </p>
                                         }
                                         title={
                                             <div className="flex justify-between items-center gap-2">
                                                 <span className="text-md ml-3">{contacto.Name || 'Contacto sin nombre'}</span>
                                                 <div className="flex space-x-2">
                                                     <PencilIcon className="w-3 h-3 text-gray-600"/>
                                                     <DeleteIcon className="w-3 h-3 text-gray-600"/>
                                                 </div>
                                             </div>
                                         }
                                     >
                                     </AccordionItem>
                                 ))}
                             </Accordion>*/}
                             <Table
                                 aria-label="Example table with client side sorting"
                             >
                                 <TableHeader>
                                     <TableColumn>Nombres</TableColumn>
                                     <TableColumn>Cargo</TableColumn>
                                     <TableColumn>Email</TableColumn>
                                     <TableColumn>Teléfono</TableColumn>
                                 </TableHeader>
                                 <TableBody emptyContent="No hay referencias comerciales">
                                     {contactList.map((ref, index) => (
                                         <TableRow key={`ref-row-${index}`}>
                                             <TableCell>{ref.Name || '-'}</TableCell>
                                             <TableCell>{ref.Profesion || '-'}</TableCell>
                                             <TableCell>{ref.E_MailL || '-'}</TableCell>
                                             <TableCell>{ref.Telefono || '-'}</TableCell>
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                         </>
                    ) : (
                        <div>
                            <span>No hay personas de Contacto registrada</span>
                        </div>
                    )}


                    { /*====================== BANK REFERENCE TITLE ======================*/ }
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Referencias Bancarias</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('banks')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    { /*====================== BANK REFERENCES CARD ======================*/ }
                    {bankCards.length > 0 ? (
                        <div className="flex flex-wrap justify-start gap-4 w-full">
                            {bankCards.map((bank, index) => {
                                const theme = getBankTheme(bank.bankName);
                                const cardBaseClass = "min-w-[240px] max-w-xs flex-1 rounded-2xl p-4 shadow-md transition-transform duration-200 hover:-translate-y-1";

                                return (
                                    <div
                                        key={`${bank.bankName ?? "bank"}-${index}`}
                                        className={`${cardBaseClass} ${theme.cardClass}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className={`text-xs font-semibold uppercase tracking-wide ${theme.labelColor}`}>Banco</p>
                                                <h4 className={`text-lg font-semibold ${theme.headerColor}`}>
                                                    {displayBankValue(bank.bankName)}
                                                </h4>
                                            </div>
                                            <Chip size="sm" className={`${theme.badgeClass}`}>
                                                {`Cuenta ${index + 1}`}
                                            </Chip>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0">
                                            <BankField label="N° de Cuenta" value={displayBankValue(bank.accountNumber)} theme={theme} />
                                            <BankField label="Tipo de Cuenta" value={displayBankValue(bank.accountType)} theme={theme} />
                                            <BankField label="Moneda" value={displayBankValue(bank.currency)} theme={theme} />
                                            <BankField label="Sectorista" value={displayBankValue(bank.sectorista)} theme={theme} />
                                            <BankField label="Teléfono" value={displayBankValue(bank.phoneNumber)} theme={theme} />
                                            <BankField label="Dirección" value={displayBankValue(bank.address)} theme={theme} />
                                            <BankField label="Código SWIFT" value={displayBankValue(bank.swiftCode)} theme={theme} />
                                            <BankField label="Código IBAN" value={displayBankValue(bank.iban)} theme={theme} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No hay referencias bancarias registradas.</p>
                    )}


                    { /*====================== COMMERCIAL REFERENCE TITLE ======================*/ }
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Referencias Comerciales</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('commercial')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    { /*====================== COMMERCIAL REFERENCES TABLE ======================*/ }
                    <Table
                        aria-label="Example table with client side sorting"
                    >
                        <TableHeader>
                            <TableColumn>Razón Social</TableColumn>
                            <TableColumn>Contacto</TableColumn>
                            <TableColumn>Teléfono</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No hay referencias comerciales">
                            {(formData?.ReferenciasComerciales ?? []).map((ref, index) => (
                                <TableRow key={`ref-row-${index}`}>
                                    <TableCell>{ref.U_RazonSocial || '-'}</TableCell>
                                    <TableCell>{ref.U_Contacto || '-'}</TableCell>
                                    <TableCell>{ref.U_Telefonos || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>


                    { /*====================== OFRECED SERVICES TITLE ======================*/ }
                    {/*<div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Servicios Ofrecidos</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover-bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('services')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>*/}

                    { /*====================== OFRECED SERVICES CARD ======================*/ }
                    {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(formData?.ServiciosOfrecidos ?? []).length > 0 ? (
                            (formData?.ServiciosOfrecidos ?? []).map((servicio, index) => (
                                <Card key={`service-display-${index}`} className="border border-gray-200 dark:border-gray-700">
                                    <CardBody className="space-y-2 text-sm text-gray-700">
                                        <p><strong>Actividad:</strong> {servicio.principalActivity || '-'}</p>
                                        <p><strong>Línea:</strong> {servicio.serviceLine || '-'}</p>
                                        <p><strong>Condición de Pago:</strong> {servicio.paymentTerms || '-'}</p>
                                    </CardBody>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-wrap justify-center text-xs"><span>No hay servicios registrados</span></div>
                        )}
                    </div>*/}


                    { /*====================== DOCUMENTS TITLE ======================*/ }
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
                                    <Button
                                        isDisabled={isGlobalLoading}
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('documents')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    { /*====================== DOCUMENTS SWITCH LIST CARD ======================*/ }
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.certificaciones)}
                            onValueChange={() => handleDocumentSwitchPress('certificaciones', 'Certificaciones ISO')}
                        >
                            Certificaciones ISO(9001, 14001, 45001)
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.licenciaMunicipal)}
                            onValueChange={() => handleDocumentSwitchPress('licenciaMunicipal', 'Licencia Municipal de Funcionamiento')}
                        >
                            Licencia Municipal de Funcionamiento
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.referenciasComerciales)}
                            onValueChange={() => handleDocumentSwitchPress('referenciasComerciales', 'Referencias Comerciales')}
                        >
                            Referencias Comerciales
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.referenciasBancarias)}
                            onValueChange={() => handleDocumentSwitchPress('referenciasBancarias', 'Referencias Bancarias')}
                        >
                            Referencias Bancarias
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.historialPrecios)}
                            onValueChange={() => handleDocumentSwitchPress('historialPrecios', 'Historial de Precios')}
                        >
                            Historial de Precios
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.condicionesPago)}
                            onValueChange={() => handleDocumentSwitchPress('condicionesPago', 'Condiciones de pago')}
                        >
                            Condiciones de pago
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.vigenciaPoder)}
                            onValueChange={() => handleDocumentSwitchPress('vigenciaPoder', 'Vigencia de Poder')}
                        >
                            Vigencia de Poder
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.fichaRuc)}
                            onValueChange={() => handleDocumentSwitchPress('fichaRuc', 'Ficha RUC')}
                        >
                            Ficha RUC
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.matrizAmbiental)}
                            onValueChange={() => handleDocumentSwitchPress('matrizAmbiental', 'Matriz de aspectos e impactos Ambientales')}
                        >
                            Matriz de aspectos e impactos Ambientales
                        </Switch>
                        <Switch
                            size="sm"
                            isSelected={getDocumentFlag(selectedSupplier?.Documentos?.matrizIperc)}
                            onValueChange={() => handleDocumentSwitchPress('matrizIperc', 'Matriz IPERC')}
                        >
                            Matriz IPERC
                        </Switch>
                    </div>

                </CardBody>
            </Card>
            <Drawer isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" placement="right">
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {activeSection ? SECTION_TITLES[activeSection] : 'Editar sección'}
                                </h2>
                                <p className="text-sm text-gray-500">Realiza los cambios necesarios y presiona guardar para actualizar la información en SAP.</p>
                            </DrawerHeader>
                            <DrawerBody>
                                {renderSectionContent()}
                                {apiError && (
                                    <Chip color="danger" variant="flat" className="mt-4">
                                        {apiError}
                                    </Chip>
                                )}
                            </DrawerBody>
                            <DrawerFooter>
                                <Button variant="light" isDisabled={isSaving || isGlobalLoading} onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button color="primary" isDisabled={isSaving || isGlobalLoading} isLoading={isSaving} onPress={() => handleSaveSection(onClose)}>
                                    Guardar cambios
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </Dashboard>
    );
};
export default SupplierProfileCard;

