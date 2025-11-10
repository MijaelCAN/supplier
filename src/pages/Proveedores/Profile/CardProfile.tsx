import React, {useEffect} from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Avatar,
    Button,
    Chip,
    Progress,
    Accordion,
    AccordionItem,
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
    ChatBubbleLeftIcon,
    EllipsisHorizontalIcon,
    CameraIcon,
    PencilIcon,
    MapPinIcon,
    CalendarIcon,
    EnvelopeIcon,
    PhoneArrowDownLeftIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    BuildingOffice2Icon,
    PlusIcon,
    IdentificationIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import {Link} from "@heroui/link";
import {DeleteIcon} from "@/components/icons.tsx";
import Dashboard from "@/layouts/Dashboard";
import {useNavigate} from "react-router-dom";
import {useSuppliers} from "@/store/extendedStore.ts";
import { useAuthStore } from '@/store/authStore';
import {createDefaultDocuments, fetchSupplierByCardCode, updateSupplierProfile, type SupplierApiRecord, type Contacto, type Banco, type DocumentoEvaluacion} from '@/services/providers/providersApi';

type BankTheme = {
    cardClass: string;
    headerColor: string;
    labelColor: string;
    valueColor: string;
    badgeClass: string;
};

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
            badgeClass: "bg-white/20 text-white border border-white/30",
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

type SectionKey = 'general' | 'addresses' | 'contacts' | 'banks' | 'documents' | 'commercial' | 'services';

const SECTION_TITLES: Record<SectionKey, string> = {
    general: 'Información General',
    addresses: 'Direcciones',
    contacts: 'Personas de Contacto',
    banks: 'Referencias Bancarias',
    documents: 'Documentos de Evaluación',
    commercial: 'Referencias Comerciales',
    services: 'Servicios Ofrecidos',
};

type CommercialReference = {
    name: string;
    contact: string;
    phone: string;
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

const SupplierProfileCard = () => {
 
     const {selectedSupplier, setSelectedSupplier} = useSuppliers();
     const currentUser = useAuthStore((state) => state.currentUser);
     const supplierCode = currentUser?.supplierId ?? currentUser?.userCode ?? '';
     const [isLoading, setIsLoading] = React.useState(false);
     const [formData, setFormData] = React.useState<SupplierApiRecord | null>(null);
     const [activeSection, setActiveSection] = React.useState<SectionKey | null>(null);
     const {isOpen, onOpen, onOpenChange} = useDisclosure();
     const [isSaving, setIsSaving] = React.useState(false);
     const [apiError, setApiError] = React.useState<string | null>(null);
     const navigate = useNavigate()
 
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
     const displayPhone = formData?.Telefono1 ?? selectedSupplier?.phone ?? '—';
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

            try {
                console.log("API", "nuevas api");
                const result = await fetchSupplierByCardCode(supplierCode);
                if (result && isMounted) {
                    console.log("API-IF",result)
                    setSelectedSupplier(result.supplier);
                    setFormData({
                        ...result.record,
                        ReferenciasComerciales: result.record.ReferenciasComerciales ?? [],
                        ServiciosOfrecidos: result.record.ServiciosOfrecidos ?? [],
                    });
                }
            } catch (error) {
                console.error('No se pudo obtener la información del proveedor.', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadSupplier();

        return () => {
            isMounted = false;
        };
    }, [supplierCode, setSelectedSupplier]);

    const handleOpenSection = (section: SectionKey) => {
        if (!formData) {
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

    const handleCommercialChange = (index: number, field: keyof CommercialReference, value: string) => {
         setFormData((prev) => {
             if (!prev) return prev;
            const referencias: CommercialReference[] = [...(prev.ReferenciasComerciales ?? [])];
            while (referencias.length <= index) {
                referencias.push({name: '', contact: '', phone: ''});
            }
            referencias[index] = {...referencias[index], [field]: value} as CommercialReference;
            return {...prev, ReferenciasComerciales: referencias};
         });
     };
 
     const addCommercial = () => {
         setFormData((prev) => (prev ? {
             ...prev,
            ReferenciasComerciales: [...(prev.ReferenciasComerciales ?? []), {name: '', contact: '', phone: ''}],
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

    const handleSaveSection = async (onClose: () => void) => {
        if (!formData) {
            return;
        }

        setIsSaving(true);
        setApiError(null);

        try {
            const result = await updateSupplierProfile(formData);
            setFormData({
                ...result.record,
                ReferenciasComerciales: result.record.ReferenciasComerciales ?? [],
                ServiciosOfrecidos: result.record.ServiciosOfrecidos ?? [],
            });
            setSelectedSupplier(result.supplier);
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
        }
    };

    const renderSectionContent = () => {
        if (!formData || !activeSection) {
            return <p className="text-sm text-gray-500">Selecciona una sección para editar.</p>;
        }

        switch (activeSection) {
            case 'general':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Código" value={formData.CodigoSN} onValueChange={(value) => handleFieldChange('CodigoSN', value)} isDisabled/>
                            <Input label="Razón Social" value={formData.NombreSN} onValueChange={(value) => handleFieldChange('NombreSN', value)} required/>
                            <Input label="RUC" value={formData.RUC} onValueChange={(value) => handleFieldChange('RUC', value)} required/>
                            <Input label="Tipo de Persona" value={formData.TipoPersona} onValueChange={(value) => handleFieldChange('TipoPersona', value)}/>
                            <Input label="Tipo de Documento" value={formData.TipoDocumento} onValueChange={(value) => handleFieldChange('TipoDocumento', value)}/>
                            <Input label="Moneda" value={formData.Moneda} onValueChange={(value) => handleFieldChange('Moneda', value)}/>
                            <Input label="Teléfono 1" value={formData.Telefono1} onValueChange={(value) => handleFieldChange('Telefono1', value)}/>
                            <Input label="Teléfono 2" value={formData.Telefono2} onValueChange={(value) => handleFieldChange('Telefono2', value)}/>
                            <Input label="Teléfono Móvil" value={formData.TelefonoMovil} onValueChange={(value) => handleFieldChange('TelefonoMovil', value)}/>
                            <Input label="Correo" value={formData.Correo} onValueChange={(value) => handleFieldChange('Correo', value)}/>
                            <Input label="Sitio Web" value={formData.website ?? ''} onValueChange={(value) => handleFieldChange('website', value)}/>
                            <Input label="Condición de Pago" value={formData.CondicionPago} onValueChange={(value) => handleFieldChange('CondicionPago', value)}/>
                            <Input label="Resolución Agente Retención" value={formData.ResolucionAgenteRetencion} onValueChange={(value) => handleFieldChange('ResolucionAgenteRetencion', value)}/>
                            <Input label="Resolución Agente Percepción" value={formData.ResolucionAgentePercepcion} onValueChange={(value) => handleFieldChange('ResolucionAgentePercepcion', value)}/>
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
                        <Textarea label="Dirección Fiscal" value={formData.Direccion ?? ''} onValueChange={(value) => handleFieldChange('Direccion', value)}/>
                        <Textarea label="Dirección SUNAT" value={formData.DireccionSUNAT ?? ''} onValueChange={(value) => handleFieldChange('DireccionSUNAT', value)}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Distrito" value={formData.Distrito} onValueChange={(value) => handleFieldChange('Distrito', value)}/>
                            <Input label="Provincia" value={formData.Provincia} onValueChange={(value) => handleFieldChange('Provincia', value)}/>
                            <Input label="Departamento" value={formData.Departamento} onValueChange={(value) => handleFieldChange('Departamento', value)}/>
                            <Input label="Ubigeo" value={formData.Ubigeo} onValueChange={(value) => handleFieldChange('Ubigeo', value)}/>
                        </div>
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
                                        <Button color="danger" variant="light" size="sm" onPress={() => removeContact(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" onPress={addContact}>
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
                                <Card key={`bank-${index}`} className={`${theme.cardClass}`}>
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
                                            <Button color="danger" variant="light" size="sm" onPress={() => removeBank(index)}>
                                                Eliminar
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })}
                        <Button variant="bordered" size="sm" onPress={addBank}>
                            Agregar cuenta bancaria
                        </Button>
                    </div>
                );
            }
            case 'documents': {
                const documentos = formData.DocumentoEvaluacion ?? [];
                return (
                    <div className="space-y-4">
                        {documentos.map((documento, index) => (
                            <Card key={`document-${index}`} className="border border-gray-200 dark:border-gray-700">
                                <CardBody className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Documento" value={documento.U_DocumentoEvaluacion} onValueChange={(value) => handleDocumentChange(index, 'U_DocumentoEvaluacion', value)}/>
                                        <Input label="Nombre de Archivo" value={documento.U_NombDocu} onValueChange={(value) => handleDocumentChange(index, 'U_NombDocu', value)}/>
                                        <Input label="Estado" value={documento.U_Status} onValueChange={(value) => handleDocumentChange(index, 'U_Status', value)}/>
                                        <Input label="Tipo de Archivo" value={documento.U_typeArchiv} onValueChange={(value) => handleDocumentChange(index, 'U_typeArchiv', value)}/>
                                    </div>
                                    <Textarea label="Enlace" value={documento.U_LinkDocumento} onValueChange={(value) => handleDocumentChange(index, 'U_LinkDocumento', value)}/>
                                    <div className="flex justify-end">
                                        <Button color="danger" variant="light" size="sm" onPress={() => removeDocument(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" onPress={addDocument}>
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
                                    <Input label="Razón Social" value={referencia.name} onValueChange={(value) => handleCommercialChange(index, 'name', value)}/>
                                    <Input label="Contacto" value={referencia.contact} onValueChange={(value) => handleCommercialChange(index, 'contact', value)}/>
                                    <Input label="Teléfono" value={referencia.phone} onValueChange={(value) => handleCommercialChange(index, 'phone', value)}/>
                                    <div className="md:col-span-3 flex justify-end">
                                        <Button color="danger" variant="light" size="sm" onPress={() => removeCommercial(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" onPress={addCommercial}>
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
                                        <Button color="danger" variant="light" size="sm" onPress={() => removeService(index)}>
                                            Eliminar
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        <Button variant="bordered" size="sm" onPress={addService}>
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


    /*let list =  ({
        async load({signal}) {
            delay(3000)
            let jsonR =  json;

            setIsLoading(false);

            return {
                items: jsonR.results,
            };
        },
        async sort({items, sortDescriptor}) {
            return {
                items: items.sort((a, b) => {
                    let first = a[sortDescriptor.column];
                    let second = b[sortDescriptor.column];
                    let cmp = (parseInt(first) || first) < (parseInt(second) || second) ? -1 : 1;

                    if (sortDescriptor.direction === "descending") {
                        cmp *= -1;
                    }

                    return cmp;
                }),
            };
        },
    });*/

    function getRandomColor() {
        const colors = ['rgba(255,107,107,0.68)', 'rgba(107,203,119,0.68)', 'rgba(77,150,255,0.68)', 'rgba(255,217,61,0.68)', '#9D4EDD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function getNumberDocuments() {
        const documents = selectedSupplier?.Documentos ?? createDefaultDocuments();
        const values = Object.values(documents as unknown as Record<string, unknown>);
        return values.filter((value) => getDocumentFlag(value)).length;
    }

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

    return (
        <Dashboard>
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
                            isIconOnly
                            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white"
                            size="sm"
                            onPress={() => handleOpenSection('general')}
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
                                isIconOnly
                                size="sm"
                                className="absolute bottom-2 right-2 bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                onPress={() => handleOpenSection('general')}
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
                                        isIconOnly
                                        size="sm"
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

                            {/*<div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div>
                                <span className="font-semibold">{friendsCount.toLocaleString()} amigos</span>
                                <span>{mutualFriends} amigos en común</span>
                                <span>Última Actualización {lastProfileUpdate}</span>
                            </div>
                            <div>
                                // progresBarr de perfil completado
                            </div>
                        </div>*/}
                        </div>


                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                color="primary"
                                startContent={<StarIcon className="w-4 h-4 bg:shadow-amber-400"/>}
                                className="bg-blue-600 hover:bg-blue-700"
                                onPress={() => navigate("/proveedor/evaluacion")}
                            >
                                EVALUACIÓNES
                            </Button>
                            <Button
                                size="sm"
                                variant="bordered"
                                startContent={<ChatBubbleLeftIcon className="w-4 h-4"/>}
                            >
                                Evaluación
                            </Button>
                            <Button
                                size="sm"
                                isIconOnly
                                variant="bordered"
                            >
                                <EllipsisHorizontalIcon className="w-5 h-5"/>
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
                                className="font-semibold text-xs">{getNumberDocuments()}/10 </span><span
                                className="text-xs">Documentos</span></div>
                            <span
                                className="text-xs">Última actualización: {displayLastUpdate}</span>
                        </div>

                        {/* Derecha - Progress bar */}
                        <div className="w-52">

                            <Progress
                                className="max-w-md"
                                color={getProgressColor(45)} // HACER DINAMICO ESTE NUMEO
                                label="Completado                 "
                                maxValue={100}
                                showValueLabel={true}
                                size="sm"
                                radius="sm"
                                value={78} // HACER DINAMICO ESTE NUMERO
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
                                    className="text-xs">Cotactar con {primaryContact?.Name || " - "}</span>
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
                    {/* Tags/Interests */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        {/*<div className="flex flex-wrap gap-2">
                        <Chip color="primary" variant="flat" size="sm">React</Chip>
                        <Chip color="secondary" variant="flat" size="sm">TypeScript</Chip>
                        <Chip color="success" variant="flat" size="sm">Tailwind CSS</Chip>
                        <Chip color="warning" variant="flat" size="sm">JavaScript</Chip>
                        <Chip color="danger" variant="flat" size="sm">Node.js</Chip>
                    </div>*/}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {selectedSupplier?.registradoMype && (
                                <Chip
                                    color="primary"
                                    variant="flat"
                                    startContent={<CheckCircleIcon className="h-3 w-3"/>}
                                    size="sm"
                                >
                                    Registrado como MyPE
                                </Chip>
                            )}

                            {selectedSupplier?.emisorFacElectronica ? (
                                <Chip
                                    color="success"
                                    variant="flat"
                                    startContent={<DocumentTextIcon className="h-3 w-3"/>}
                                    size="sm"
                                >
                                    Emisor de Facturas Electrónicas
                                </Chip>
                            ) : (
                                <Chip
                                    color="warning"
                                    variant="flat"
                                    startContent={<ExclamationTriangleIcon className="h-3 w-3"/>}
                                    size="sm"
                                >
                                    No Emisor de Facturas Electrónicas
                                </Chip>
                            )}
                        </div>
                    </div>
                    {/*<Card className="w-full">
                    <CardBody className="p-0">
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
                            <div className="relative col-span-6 md:col-span-4">
                                <Image
                                    alt="Album cover"
                                    className="object-cover"
                                    height={200}
                                    shadow="md"
                                    src="https://heroui.com/images/album-cover.png"
                                    width="100%"
                                />
                            </div>

                            <div className="relative col-span-6 md:col-span-8 p-2">
                                <div className="flex justify-between gap-3 mb-0">
                                    <div className="flex items-center gap-3">
                                        <BuildingOffice2Icon className="h-5 w-5 text-gray-600"/>
                                        <span className="text-lg font-bold">Almacen</span>
                                    </div>
                                    <Button
                                        isIconOnly
                                        startContent={
                                            <PlusIcon  className="h-5 w-5 text-gray-600"/>
                                        }
                                    >
                                    </Button>
                                </div>
                                <span className="text-xs text-gray-500">Av. La marina 235, interior 45-B</span>
                                <span className="text-xs text-gray-500">San Bartolo - Lima - Lima</span>
                                <span className="text-xs text-gray-500">Ubigeo: 102105</span>

                            </div>
                        </div>
                    </CardBody>
                </Card>*/}

                    <br></br><br></br>
                    {/*================== DIRECCIONES ======================*/}
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Direcciónes</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('addresses')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                <div className="flex items-center">
                                    <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                    <span className="font-bold mr-4">{displayPhone}</span>
                                </div>
                            </div>

                            {/*<div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div>
                                <span className="font-semibold">{friendsCount.toLocaleString()} amigos</span>
                                <span>{mutualFriends} amigos en común</span>
                                <span>Última Actualización {lastProfileUpdate}</span>
                            </div>
                            <div>
                                // progresBarr de perfil completado
                            </div>
                        </div>*/}
                        </div>
                        {/* Action Buttons */}
                    </div>
                    {selectedSupplier?.addresses && selectedSupplier.addresses.length > 0 ? (
                        selectedSupplier.addresses?.map((item, index) => (
                            <Card key={index} radius="lg" shadow="sm" className="w-full  mx-auto mt-4">
                                <CardBody className="p-4">
                                    <div className="grid grid-cols-6 md:grid-cols-12 gap-6 items-center">
                                        {/* Imagen */}
                                        {/*<div className="relative col-span-6 md:col-span-4">
                                <Image
                                    alt={`${name} - cover`}
                                    className="object-cover rounded-lg"
                                    height="30%"
                                    src="https://heroui.com/images/album-cover.png"
                                    width="100%"
                                />
                            </div>*/}

                                        {/* Info */}
                                        <div className="relative col-span-12 md:col-span-12">
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 text-gray-800">
                                                    <BuildingOffice2Icon className="h-5 w-5 text-gray-600"/>
                                                    <span className="text-lg font-semibold">{item.address}</span>
                                                    <span className="text-sm text-gray-500">{`(${item.type})`}</span>
                                                </div>

                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    radius="full"
                                                    startContent={<PencilIcon className="h-4 w-4 text-gray-600"/>}
                                                    aria-label="Agregar"
                                                />
                                            </div>

                                            {/* Dirección */}
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPinIcon className="h-5 w-5 mt-1 text-gray-500"/>
                                                <div className="flex flex-col">
                                                    <span>{item.address}</span>
                                                    <span>{item.city} - {item.province} - {item.departament}</span>
                                                </div>
                                            </div>

                                            {/* Ubigeo */}
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

                    {/*=================================== PERSONA DE CONTACTO ================================= */}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Persona de Contacto</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('contacts')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    {contactList.length > 0 ? (
                         <Accordion selectionMode="multiple">
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
                                            <span className="text-xs">{contacto.Telefono || 'Sin teléfono'}</span>
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
                        </Accordion>
                    ) : (
                        <div>
                            <span>No hay personas de Contacto registrada</span>
                        </div>
                    )}


                    {/*=================================== REFERENCIAS BANCARIAS ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Referencias Bancarias</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('banks')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
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


                    {/*=================================== REFERENCIAS COMERCIALES ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Referencias Comerciales</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('commercial')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
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
                                    <TableCell>{ref.name || '-'}</TableCell>
                                    <TableCell>{ref.contact || '-'}</TableCell>
                                    <TableCell>{ref.phone || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>


                    {/*=================================== SERVICIOS OFRECIDOS ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Servicios Ofrecidos</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('services')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    </div>


                    {/*=================================== DOCUMENTOS ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                        onPress={() => handleOpenSection('documents')}
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.certificacionISO)}>Certificaciones ISO(9001, 14001, 45001)</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.licenciaMuni)}>Licencia Municipal de Funcionamiento</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.referenciasComerciales)}>Referencias Comerciales</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.referenciasBancarias)}>Referencias Bancarias</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.historicoPrecios)}>Historial de Precios</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.condicionesPago)}>Condiciones de pago</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.vigenciaPoder)}>Vigencia de Poder</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.fichaRuc)}>Ficha RUC</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.matrizAAmbientales)}>Matriz de aspectos e impactos Ambientales</Switch>
                        <Switch size="sm" isSelected={getDocumentFlag(selectedSupplier?.Documentos?.matrizIPERC)}>Matriz IPERC</Switch>
                    </div>

                </CardBody>
            </Card>
            <Drawer isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="right">
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
                                <Button variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button color="primary" isLoading={isSaving} onPress={() => handleSaveSection(onClose)}>
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