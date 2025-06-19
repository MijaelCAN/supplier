import Dashboard from "@/layouts/Dashboard";
import {
    Accordion,
    AccordionItem,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Select,
    SelectItem, Switch, Textarea
} from "@heroui/react";
import {
    DocumentTextIcon,
    PlusIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    DocumentCheckIcon,
    BanknotesIcon,
    UserGroupIcon,
    GlobeAltIcon, UserIcon, TrashIcon, PhoneIcon, CloudArrowUpIcon, BriefcaseIcon, MapPinIcon
} from "@heroicons/react/24/outline";
import {useState} from "react";
import {Input} from "@heroui/input";
import {Divider} from "@heroui/divider";

interface ContactPerson {
    id: string;
    type: string;
    firstName: string;
    lastName: string;
    phone: string;
    mobile: string;
    email: string;
}

interface Address {
    id: string;
    type: string;
    fullAddress: string;
    reference: string;
    country: string;
    department: string;
    province: string;
    district: string;
    ubigeo: string;
}

interface BankReference {
    id: string;
    country: string;
    bank: string;
    accountType: string;
    currency: string;
    accountNumber: string;
    cci: string;
    iban: string;
    attachment: File | null;
    sectorist: string;
    sectoristPhone: string;
}

    export default function UpdateProfile() {

        const getStatusColor = (status: string) => {
            switch(status) {
                case "Aprobado": return "success";
                case "Pendiente": return "warning";
                case "En Revisión": return "primary";
                case "Rechazado": return "danger";
                default: return "default";
            }
        };

        const getStatusIcon = (status: string) => {
            switch(status) {
                case "Aprobado": return <CheckCircleIcon className="h-4 w-4" />;
                case "Pendiente": return <ClockIcon className="h-4 w-4" />;
                case "En Revisión": return <ExclamationTriangleIcon className="h-4 w-4" />;
                case "Rechazado": return <ExclamationTriangleIcon className="h-4 w-4" />;
                default: return <ClockIcon className="h-4 w-4" />;
            }
        };
        const [supplierData, setSupplierData] = useState({
            // Datos principales
            supplierType: "",
            personType: "",
            documentType: "",
            documentNumber: "",
            businessName: "",
            country: "",
            isElectronicInvoiceIssuer: true,
            isMypeRegistered: true,
            websiteUrl: "",

            // Servicios
            mainBusinessLine: "",
            businessLineDescription: "",
            activityTypes: "",

            // Otros
            observations: "",
            familyRelation: "Ninguna",
            employeeName: "",
            completionPercentage: 75,
            status: "Aprobado",
            documentsUploaded: 6,
            totalDocuments: 30,
            lastUpdate: "15 de Mayo, 2025",
        });

        const [addresses, setAddresses] = useState<Address[]>([{
            id: "1",
            type: "",
            fullAddress: "",
            reference: "",
            country: "",
            department: "",
            province: "",
            district: "",
            ubigeo: ""
        }]);

        const [contactPersons, setContactPersons] = useState<ContactPerson[]>([{
            id: "1",
            type: "",
            firstName: "",
            lastName: "",
            phone: "",
            mobile: "",
            email: ""
        }]);

        const [bankReferences, setBankReferences] = useState<BankReference[]>([{
            id: "1",
            country: "",
            bank: "",
            accountType: "",
            currency: "",
            accountNumber: "",
            cci: "",
            iban: "",
            attachment: null,
            sectorist: "",
            sectoristPhone: ""
        }]);

        const [documents, setDocuments] = useState({
            certification: false,
            municipalLicense: false,
            commercialReferences: false,
            bankReferences: false,
            priceHistory: false,
            paymentConditions: false,
            powerValidity: false,
            rucCard: false,
            environmentalMatrix: false,
            ipercMatrix: false
        });

        const [declarationFile, setDeclarationFile] = useState<File | null>(null);

        // Opciones para selects
        const supplierTypes = [
            { key: "persona_natural", label: "Persona Natural" },
            { key: "persona_juridica", label: "Persona Jurídica" },
            { key: "consorcio", label: "Consorcio" }
        ];

        const documentTypes = [
            { key: "dni", label: "DNI" },
            { key: "ruc", label: "RUC" },
            { key: "pasaporte", label: "Pasaporte" },
            { key: "ce", label: "Carné de Extranjería" }
        ];

        const addressTypes = [
            { key: "fiscal", label: "Fiscal" },
            { key: "comercial", label: "Comercial" },
            { key: "operativa", label: "Operativa" }
        ];

        const contactTypes = [
            { key: "gerente", label: "Gerente" },
            { key: "representante", label: "Representante" },
            { key: "ventas", label: "Ventas" },
            { key: "almacen", label: "Almacén" },
            { key: "administrativo", label: "Administrativo" }
        ];

        const accountTypes = [
            { key: "ahorros", label: "Ahorros" },
            { key: "corriente", label: "Corriente" },
            { key: "cts", label: "CTS" }
        ];

        const currencies = [
            { key: "PEN", label: "Soles (PEN)" },
            { key: "USD", label: "Dólares (USD)" },
            { key: "EUR", label: "Euros (EUR)" }
        ];

        const relationTypes = [
            { key: "Ninguna", label: "Ninguna" },
            { key: "Familiar", label: "Familiar" },
            { key: "Contacto comercial", label: "Contacto comercial" }
        ];

        // Funciones para manejar arrays
        const addAddress = () => {
            const newAddress: Address = {
                id: Date.now().toString(),
                type: "",
                fullAddress: "",
                reference: "",
                country: "",
                department: "",
                province: "",
                district: "",
                ubigeo: ""
            };
            setAddresses([...addresses, newAddress]);
        };

        const removeAddress = (id: string) => {
            setAddresses(addresses.filter(addr => addr.id !== id));
        };

        const updateAddress = (id: string, field: keyof Address, value: string) => {
            setAddresses(addresses.map(addr =>
                addr.id === id ? { ...addr, [field]: value } : addr
            ));
        };

        const addContactPerson = () => {
            const newContact: ContactPerson = {
                id: Date.now().toString(),
                type: "",
                firstName: "",
                lastName: "",
                phone: "",
                mobile: "",
                email: ""
            };
            setContactPersons([...contactPersons, newContact]);
        };

        const removeContactPerson = (id: string) => {
            setContactPersons(contactPersons.filter(contact => contact.id !== id));
        };

        const updateContactPerson = (id: string, field: keyof ContactPerson, value: string) => {
            setContactPersons(contactPersons.map(contact =>
                contact.id === id ? { ...contact, [field]: value } : contact
            ));
        };

        const addBankReference = () => {
            const newBank: BankReference = {
                id: Date.now().toString(),
                country: "",
                bank: "",
                accountType: "",
                currency: "",
                accountNumber: "",
                cci: "",
                iban: "",
                attachment: null,
                sectorist: "",
                sectoristPhone: ""
            };
            setBankReferences([...bankReferences, newBank]);
        };

        const removeBankReference = (id: string) => {
            setBankReferences(bankReferences.filter(bank => bank.id !== id));
        };

        const updateBankReference = (id: string, field: keyof BankReference, value: string) => {
            setBankReferences(bankReferences.map(bank =>
                bank.id === id ? { ...bank, [field]: value } : bank
            ));
        };

        const handleSubmit = () => {
            console.log("Datos del proveedor:", {
                supplierData,
                addresses,
                contactPersons,
                bankReferences,
                documents,
                declarationFile
            });
            // Aquí iría la lógica para enviar los datos
        };

    return (
        <Dashboard>
            <div className="w-full space-y-6">
                {/* ======================= HEADER =======================*/}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Actualizar mi Perfil</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Registra y actualiza tu información. Mantén tus datos actualizados para
                            una mejor gestión comercial 2.
                        </p>
                    </div>
                    {/*<div className="sm:hidden flex items-center space-x-4">
                        <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                            <BellIcon className="h-6 w-6" />
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                  3
                                </span>
                        </button>

                        <div className="flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">Admin Usuario</p>
                                <p className="text-xs text-gray-500">Administrador</p>
                            </div>
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">AU</span>
                            </div>
                        </div>
                    </div>*/}
                </div>

                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                    {/* Estado y Progreso */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                        {/* Estado del Perfil */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Estado del Perfil
                                    </span>
                                {getStatusIcon(supplierData.status)}
                            </div>
                            <Chip
                                color={getStatusColor(supplierData.status)}
                                variant="flat"
                                size="sm"
                            >
                                {supplierData.status}
                            </Chip>
                        </div>

                        {/* Progreso de Completado */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Completado
                                    </span>
                                <span className="text-sm font-bold text-primary-600">
                                        {supplierData.completionPercentage}%
                                    </span>
                            </div>
                            <Progress
                                value={supplierData.completionPercentage}
                                color="primary"
                                size="sm"
                                className="w-full"
                            />
                        </div>

                        {/* Documentos */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Documentos
                                    </span>
                                <DocumentCheckIcon className="h-4 w-4 text-gray-500"/>
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {supplierData.documentsUploaded}/{supplierData.totalDocuments}
                            </div>
                        </div>

                        {/* Última Actualización */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Última Actualización
                                    </span>
                                <ClockIcon className="h-4 w-4 text-gray-500"/>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {supplierData.lastUpdate}
                            </div>
                        </div>
                    </div>

                    {/* Información Destacada */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {supplierData.isMypeRegistered && (
                            <Chip
                                color="success"
                                variant="flat"
                                startContent={<CheckCircleIcon className="h-3 w-3"/>}
                                size="sm"
                            >
                                Registrado como MyPE
                            </Chip>
                        )}

                        {supplierData.isElectronicInvoiceIssuer ? (
                            <Chip
                                color="primary"
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

                    {/* Secciones de Información */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Secciones de Información Requerida
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <BuildingOfficeIcon className="h-4 w-4 text-blue-500"/>
                                <span className="text-gray-700 dark:text-gray-300">Datos Generales</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <GlobeAltIcon className="h-4 w-4 text-green-500"/>
                                <span className="text-gray-700 dark:text-gray-300">Direcciones</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <UserGroupIcon className="h-4 w-4 text-purple-500"/>
                                <span className="text-gray-700 dark:text-gray-300">Contactos</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <BanknotesIcon className="h-4 w-4 text-yellow-500"/>
                                <span className="text-gray-700 dark:text-gray-300">Ref. Bancarias</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <DocumentCheckIcon className="h-4 w-4 text-red-500"/>
                                <span className="text-gray-700 dark:text-gray-300">Documentos</span>
                            </div>
                        </div>
                    </div>

                    {/* Alertas o Notificaciones */}
                    {supplierData.status === "Pendiente" && (
                        <div
                            className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon
                                    className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5"/>
                                <div>
                                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                        Información Incompleta
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        Completa toda la información requerida y sube los documentos necesarios para
                                        proceder con la evaluación.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ======================= CONTENT ==================================*/}
                <Accordion variant="splitted" selectionMode="multiple" defaultExpandedKeys={["general"]} className="p-0">

                    {/* INFORMACIÓN GENERAL */}
                    <AccordionItem
                        key="general"
                        aria-label="Información General"
                        title={
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Información General</span>
                            </div>
                        }
                    >
                        <Card>
                            <CardBody className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Select
                                        size="sm"
                                        variant="underlined"
                                        label="Tipo de Proveedor"
                                        selectedKeys={supplierData.supplierType ? [supplierData.supplierType] : []}
                                        onSelectionChange={(keys) => setSupplierData({
                                            ...supplierData,
                                            supplierType: Array.from(keys)[0] as string
                                        })}
                                        isRequired
                                    >
                                        {supplierTypes.map((type) => (
                                            <SelectItem key={type.key} value={type.key}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        size="sm"
                                        variant="underlined"
                                        label="Tipo de Persona"
                                        selectedKeys={supplierData.personType ? [supplierData.personType] : []}
                                        onSelectionChange={(keys) => setSupplierData({
                                            ...supplierData,
                                            personType: Array.from(keys)[0] as string
                                        })}
                                        isRequired
                                    >
                                        <SelectItem key="natural" value="natural">Persona Natural</SelectItem>
                                        <SelectItem key="juridica" value="juridica">Persona Jurídica</SelectItem>
                                    </Select>

                                    <Select
                                        size="sm"
                                        variant="underlined"
                                        label="Tipo de Documento"
                                        selectedKeys={supplierData.documentType ? [supplierData.documentType] : []}
                                        onSelectionChange={(keys) => setSupplierData({
                                            ...supplierData,
                                            documentType: Array.from(keys)[0] as string
                                        })}
                                        isRequired
                                    >
                                        {documentTypes.map((doc) => (
                                            <SelectItem key={doc.key} value={doc.key}>
                                                {doc.label}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Input
                                        size="sm"
                                        variant="underlined"
                                        label="Número de Documento"
                                        value={supplierData.documentNumber}
                                        onValueChange={(value) => setSupplierData({
                                            ...supplierData,
                                            documentNumber: value
                                        })}
                                        isRequired
                                    />

                                    <Input
                                        size="sm"
                                        variant="underlined"
                                        label="Razón Social"
                                        value={supplierData.businessName}
                                        onValueChange={(value) => setSupplierData({
                                            ...supplierData,
                                            businessName: value
                                        })}
                                        isRequired
                                    />

                                    <Input
                                        size="sm"
                                        variant="underlined"
                                        label="País"
                                        value={supplierData.country}
                                        onValueChange={(value) => setSupplierData({...supplierData, country: value})}
                                        isRequired
                                    />

                                    <Input
                                        size="sm"
                                        variant="underlined"
                                        label="URL Sitio Web"
                                        value={supplierData.websiteUrl}
                                        onValueChange={(value) => setSupplierData({...supplierData, websiteUrl: value})}
                                    />
                                </div>

                                <Divider/>

                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            isSelected={supplierData.isElectronicInvoiceIssuer}
                                            onValueChange={(value) => setSupplierData({
                                                ...supplierData,
                                                isElectronicInvoiceIssuer: value
                                            })}
                                        />
                                        <span className="text-sm">¿Emisor de facturas electrónicas?</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Switch
                                            isSelected={supplierData.isMypeRegistered}
                                            onValueChange={(value) => setSupplierData({
                                                ...supplierData,
                                                isMypeRegistered: value
                                            })}
                                        />
                                        <span className="text-sm">¿Registrado como MYPE?</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </AccordionItem>

                    {/* DIRECCIONES */}
                    <AccordionItem
                        key="addresses"
                        aria-label="Direcciones"
                        title={
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Direcciones</span>
                                <Chip size="sm" variant="flat" color="primary">{addresses.length}</Chip>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {addresses.map((address, index) => (
                                <Card key={address.id}>
                                    <CardHeader className="flex justify-between items-center">
                                        <h4 className="font-medium">Dirección {index + 1}</h4>
                                        {addresses.length > 1 && (
                                            <Button
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => removeAddress(address.id)}
                                                startContent={<TrashIcon className="h-4 w-4"/>}
                                            >
                                                Eliminar
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardBody className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <Select
                                                label="Tipo de Dirección"
                                                placeholder="Seleccionar tipo"
                                                selectedKeys={address.type ? [address.type] : []}
                                                onSelectionChange={(keys) => updateAddress(address.id, 'type', Array.from(keys)[0] as string)}
                                                isRequired
                                            >
                                                {addressTypes.map((type) => (
                                                    <SelectItem key={type.key} value={type.key}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Input
                                                label="País"
                                                placeholder="Ingresar país"
                                                value={address.country}
                                                onValueChange={(value) => updateAddress(address.id, 'country', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Departamento"
                                                placeholder="Ingresar departamento"
                                                value={address.department}
                                                onValueChange={(value) => updateAddress(address.id, 'department', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Provincia"
                                                placeholder="Ingresar provincia"
                                                value={address.province}
                                                onValueChange={(value) => updateAddress(address.id, 'province', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Distrito"
                                                placeholder="Ingresar distrito"
                                                value={address.district}
                                                onValueChange={(value) => updateAddress(address.id, 'district', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Ubigeo"
                                                placeholder="Código ubigeo"
                                                value={address.ubigeo}
                                                onValueChange={(value) => updateAddress(address.id, 'ubigeo', value)}
                                            />
                                        </div>

                                        <Textarea
                                            label="Dirección Completa"
                                            placeholder="Ingresar dirección completa"
                                            value={address.fullAddress}
                                            onValueChange={(value) => updateAddress(address.id, 'fullAddress', value)}
                                            isRequired
                                        />

                                        <Input
                                            label="Referencia"
                                            placeholder="Referencia adicional"
                                            value={address.reference}
                                            onValueChange={(value) => updateAddress(address.id, 'reference', value)}
                                        />
                                    </CardBody>
                                </Card>
                            ))}

                            <Button
                                variant="bordered"
                                onPress={addAddress}
                                startContent={<PlusIcon className="h-4 w-4"/>}
                                className="w-full"
                            >
                                Agregar Dirección
                            </Button>
                        </div>
                    </AccordionItem>

                    {/* PERSONAS DE CONTACTO */}
                    <AccordionItem
                        key="contacts"
                        aria-label="Personas de Contacto"
                        title={
                            <div className="flex items-center gap-2">
                                <PhoneIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Personas de Contacto</span>
                                <Chip size="sm" variant="flat" color="primary">{contactPersons.length}</Chip>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {contactPersons.map((contact, index) => (
                                <Card key={contact.id}>
                                    <CardHeader className="flex justify-between items-center">
                                        <h4 className="font-medium">Contacto {index + 1}</h4>
                                        {contactPersons.length > 1 && (
                                            <Button
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => removeContactPerson(contact.id)}
                                                startContent={<TrashIcon className="h-4 w-4"/>}
                                            >
                                                Eliminar
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardBody className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <Select
                                                label="Tipo de Contacto"
                                                placeholder="Seleccionar tipo"
                                                selectedKeys={contact.type ? [contact.type] : []}
                                                onSelectionChange={(keys) => updateContactPerson(contact.id, 'type', Array.from(keys)[0] as string)}
                                                isRequired
                                            >
                                                {contactTypes.map((type) => (
                                                    <SelectItem key={type.key} value={type.key}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Input
                                                label="Nombres"
                                                placeholder="Ingresar nombres"
                                                value={contact.firstName}
                                                onValueChange={(value) => updateContactPerson(contact.id, 'firstName', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Apellidos"
                                                placeholder="Ingresar apellidos"
                                                value={contact.lastName}
                                                onValueChange={(value) => updateContactPerson(contact.id, 'lastName', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Teléfono"
                                                placeholder="Número de teléfono"
                                                value={contact.phone}
                                                onValueChange={(value) => updateContactPerson(contact.id, 'phone', value)}
                                            />

                                            <Input
                                                label="Celular"
                                                placeholder="Número de celular"
                                                value={contact.mobile}
                                                onValueChange={(value) => updateContactPerson(contact.id, 'mobile', value)}
                                            />

                                            <Input
                                                label="Email"
                                                type="email"
                                                placeholder="correo@ejemplo.com"
                                                value={contact.email}
                                                onValueChange={(value) => updateContactPerson(contact.id, 'email', value)}
                                                isRequired
                                            />
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}

                            <Button
                                variant="bordered"
                                onPress={addContactPerson}
                                startContent={<PlusIcon className="h-4 w-4"/>}
                                className="w-full"
                            >
                                Agregar Contacto
                            </Button>
                        </div>
                    </AccordionItem>

                    {/* REFERENCIAS BANCARIAS */}
                    <AccordionItem
                        key="banking"
                        aria-label="Referencias Bancarias"
                        title={
                            <div className="flex items-center gap-2">
                                <BanknotesIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Referencias Bancarias</span>
                                <Chip size="sm" variant="flat" color="primary">{bankReferences.length}</Chip>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {bankReferences.map((bank, index) => (
                                <Card key={bank.id}>
                                    <CardHeader className="flex justify-between items-center">
                                        <h4 className="font-medium">Cuenta Bancaria {index + 1}</h4>
                                        {bankReferences.length > 1 && (
                                            <Button
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => removeBankReference(bank.id)}
                                                startContent={<TrashIcon className="h-4 w-4"/>}
                                            >
                                                Eliminar
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardBody className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <Input
                                                label="País"
                                                placeholder="Ingresar país"
                                                value={bank.country}
                                                onValueChange={(value) => updateBankReference(bank.id, 'country', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="Banco"
                                                placeholder="Nombre del banco"
                                                value={bank.bank}
                                                onValueChange={(value) => updateBankReference(bank.id, 'bank', value)}
                                                isRequired
                                            />

                                            <Select
                                                label="Tipo de Cuenta"
                                                placeholder="Seleccionar tipo"
                                                selectedKeys={bank.accountType ? [bank.accountType] : []}
                                                onSelectionChange={(keys) => updateBankReference(bank.id, 'accountType', Array.from(keys)[0] as string)}
                                                isRequired
                                            >
                                                {accountTypes.map((type) => (
                                                    <SelectItem key={type.key} value={type.key}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Select
                                                label="Tipo de Moneda"
                                                placeholder="Seleccionar moneda"
                                                selectedKeys={bank.currency ? [bank.currency] : []}
                                                onSelectionChange={(keys) => updateBankReference(bank.id, 'currency', Array.from(keys)[0] as string)}
                                                isRequired
                                            >
                                                {currencies.map((currency) => (
                                                    <SelectItem key={currency.key} value={currency.key}>
                                                        {currency.label}
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            <Input
                                                label="Número de Cuenta"
                                                placeholder="Ingresar número"
                                                value={bank.accountNumber}
                                                onValueChange={(value) => updateBankReference(bank.id, 'accountNumber', value)}
                                                isRequired
                                            />

                                            <Input
                                                label="CCI"
                                                placeholder="Código CCI"
                                                value={bank.cci}
                                                onValueChange={(value) => updateBankReference(bank.id, 'cci', value)}
                                            />

                                            <Input
                                                label="Código IBAN"
                                                placeholder="Código IBAN"
                                                value={bank.iban}
                                                onValueChange={(value) => updateBankReference(bank.id, 'iban', value)}
                                            />

                                            <Input
                                                label="Sectorista"
                                                placeholder="Nombre del sectorista"
                                                value={bank.sectorist}
                                                onValueChange={(value) => updateBankReference(bank.id, 'sectorist', value)}
                                            />

                                            <Input
                                                label="Teléfono Sectorista"
                                                placeholder="Teléfono del sectorista"
                                                value={bank.sectoristPhone}
                                                onValueChange={(value) => updateBankReference(bank.id, 'sectoristPhone', value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Adjunto</label>
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                                                <CloudArrowUpIcon className="h-8 w-8 mx-auto text-gray-400 mb-2"/>
                                                <p className="text-sm text-gray-600">
                                                    Arrastra archivos aquí o{" "}
                                                    <button
                                                        className="text-primary-600 hover:text-primary-700 font-medium">
                                                        selecciona archivos
                                                    </button>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG hasta 10MB</p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}

                            <Button
                                variant="bordered"
                                onPress={addBankReference}
                                startContent={<PlusIcon className="h-4 w-4"/>}
                                className="w-full"
                            >
                                Agregar Cuenta Bancaria
                            </Button>
                        </div>
                    </AccordionItem>

                    {/* INFORMACIÓN DE SERVICIOS */}
                    <AccordionItem
                        key="services"
                        aria-label="Información de Servicios"
                        title={
                            <div className="flex items-center gap-2">
                                <BriefcaseIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Información de Servicios Ofrecidos</span>
                            </div>
                        }
                    >
                        <Card>
                            <CardBody className="space-y-4">
                                <Input
                                    label="Rubro Principal"
                                    placeholder="Describir rubro principal"
                                    value={supplierData.mainBusinessLine}
                                    onValueChange={(value) => setSupplierData({
                                        ...supplierData,
                                        mainBusinessLine: value
                                    })}
                                    isRequired
                                />

                                <Textarea
                                    label="Descripción del Rubro"
                                    placeholder="Descripción detallada del rubro"
                                    value={supplierData.businessLineDescription}
                                    onValueChange={(value) => setSupplierData({
                                        ...supplierData,
                                        businessLineDescription: value
                                    })}
                                    isRequired
                                />

                                <Textarea
                                    label="Tipo de Actividades"
                                    placeholder="Describir las actividades que realiza"
                                    value={supplierData.activityTypes}
                                    onValueChange={(value) => setSupplierData({...supplierData, activityTypes: value})}
                                    isRequired
                                />
                            </CardBody>
                        </Card>
                    </AccordionItem>

                    {/* DOCUMENTOS PARA EVALUACIÓN */}
                    <AccordionItem
                        key="documents"
                        aria-label="Documentos para Evaluación"
                        title={
                            <div className="flex items-center gap-2">
                                <DocumentCheckIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Documentos para la Evaluación</span>
                            </div>
                        }
                    >
                        <Card>
                            <CardBody className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Certificación ISO 9001 - ISO 14001 - ISO 45001</span>
                                        <Switch
                                            isSelected={documents.certification}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                certification: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span
                                            className="text-sm font-medium">Licencia Municipal de Funcionamiento</span>
                                        <Switch
                                            isSelected={documents.municipalLicense}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                municipalLicense: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Referencias Comerciales</span>
                                        <Switch
                                            isSelected={documents.commercialReferences}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                commercialReferences: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Referencias Bancarias</span>
                                        <Switch
                                            isSelected={documents.bankReferences}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                bankReferences: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Historial de Precios</span>
                                        <Switch
                                            isSelected={documents.priceHistory}
                                            onValueChange={(value) => setDocuments({...documents, priceHistory: value})}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Condiciones de Pago</span>
                                        <Switch
                                            isSelected={documents.paymentConditions}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                paymentConditions: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Vigencia Poder</span>
                                        <Switch
                                            isSelected={documents.powerValidity}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                powerValidity: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Ficha RUC</span>
                                        <Switch
                                            isSelected={documents.rucCard}
                                            onValueChange={(value) => setDocuments({...documents, rucCard: value})}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span
                                            className="text-sm font-medium">Matriz de Aspectos e Impactos Ambientales</span>
                                        <Switch
                                            isSelected={documents.environmentalMatrix}
                                            onValueChange={(value) => setDocuments({
                                                ...documents,
                                                environmentalMatrix: value
                                            })}
                                            color="success"
                                        />
                                    </div>

                                    <div
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <span className="text-sm font-medium">Matriz IPERC</span>
                                        <Switch
                                            isSelected={documents.ipercMatrix}
                                            onValueChange={(value) => setDocuments({...documents, ipercMatrix: value})}
                                            color="success"
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </AccordionItem>

                    {/* OTROS */}
                    <AccordionItem
                        key="others"
                        aria-label="Otros"
                        title={
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Otros</span>
                            </div>
                        }
                    >
                        <Card>
                            <CardBody className="space-y-4">
                                <Textarea
                                    label="Observaciones"
                                    placeholder="Ingrese observaciones adicionales"
                                    value={supplierData.observations}
                                    onValueChange={(value) => setSupplierData({...supplierData, observations: value})}
                                    minRows={3}
                                />

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium">
                                        ¿Indique si tiene alguna relación con algún familiar del colaborador?
                                    </label>

                                    <Select
                                        placeholder="Seleccionar tipo de relación"
                                        selectedKeys={supplierData.familyRelation ? [supplierData.familyRelation] : []}
                                        onSelectionChange={(keys) => setSupplierData({
                                            ...supplierData,
                                            familyRelation: Array.from(keys)[0] as string
                                        })}
                                        isRequired
                                    >
                                        {relationTypes.map((relation) => (
                                            <SelectItem key={relation.key} value={relation.key}>
                                                {relation.label}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {(supplierData.familyRelation === "Familiar" || supplierData.familyRelation === "Contacto comercial") && (
                                        <Input
                                            label="Nombre de Colaborador"
                                            placeholder="Ingrese el nombre del colaborador"
                                            value={supplierData.employeeName}
                                            onValueChange={(value) => setSupplierData({
                                                ...supplierData,
                                                employeeName: value
                                            })}
                                            isRequired
                                        />
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </AccordionItem>

                    {/* DECLARACIÓN JURADA */}
                    <AccordionItem
                        key="declaration"
                        aria-label="Declaración Jurada"
                        title={
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">Declaración Jurada</span>
                            </div>
                        }
                    >
                        <Card>
                            <CardBody>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <h4 className="font-medium mb-2">Cargar Declaración Jurada</h4>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Debe cargar la declaración jurada firmada y sellada
                                        </p>
                                    </div>

                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                                        <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4"/>
                                        <div className="space-y-2">
                                            <p className="text-lg font-medium">
                                                {declarationFile ? declarationFile.name : "Arrastra tu archivo aquí"}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                o{" "}
                                                <button
                                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = '.pdf,.png,.jpg,.jpeg';
                                                        input.onchange = (e) => {
                                                            const file = (e.target as HTMLInputElement).files?.[0];
                                                            if (file) {
                                                                setDeclarationFile(file);
                                                            }
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    selecciona desde tu computadora
                                                </button>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Formatos permitidos: PDF, PNG, JPG (máximo 10MB)
                                            </p>
                                        </div>
                                    </div>

                                    {declarationFile && (
                                        <div
                                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <DocumentTextIcon className="h-5 w-5 text-green-600"/>
                                                <span
                                                    className="text-sm font-medium text-green-800 dark:text-green-200">
                                                        {declarationFile.name}
                                                    </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => setDeclarationFile(null)}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </AccordionItem>
                </Accordion>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8">
                    <Button
                        variant="bordered"
                        size="lg"
                        className="sm:w-auto w-full"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="bordered"
                        size="lg"
                        className="sm:w-auto w-full"
                    >
                        Guardar Borrador
                    </Button>
                    <Button
                        color="primary"
                        size="lg"
                        className="sm:w-auto w-full"
                        onPress={handleSubmit}
                    >
                        Actualizar Perfil
                    </Button>
                </div>
            </div>
        </Dashboard>
    );
    }
