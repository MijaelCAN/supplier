import { useState } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Select,
    SelectItem,
    Textarea,
    Switch,
    Button,
    Divider,
    Chip,
    Tabs,
    Tab, Progress
} from '@heroui/react';
import {
    UserIcon,
    MapPinIcon,
    PhoneIcon,
    BanknotesIcon,
    BriefcaseIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    DocumentCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon, BuildingOfficeIcon, GlobeAltIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';
import Dashboard from "@/layouts/Dashboard";
import HeaderComponent from "@/components/headerComponent.tsx";

const ProveedorProfile = () => {
    const [formData, setFormData] = useState({
        // Datos generales
        tipoProveedor: '',
        tipoPersona: '',
        tipoDocumento: '',
        numeroDocumento: '',
        razonSocial: '',
        pais: '',
        emisorFacturasElectronicas: false,
        registradoMype: false,
        urlSitioWeb: '',

        // Direcciones
        direcciones: [{
            tipoDireccion: '',
            direccionCompleta: '',
            referencia: '',
            pais: '',
            departamento: '',
            provincia: '',
            distrito: '',
            ubigeo: ''
        }],

        // Personas de contacto
        contactos: [{
            tipoContacto: '',
            nombres: '',
            apellidos: '',
            telefono: '',
            celular: '',
            email: ''
        }],

        // Referencias bancarias
        referenciasBancarias: [{
            pais: '',
            banco: '',
            tipoCuenta: '',
            tipoMoneda: '',
            numeroCuenta: '',
            cci: '',
            codigoIban: '',
            adjunto: '',
            sectorista: '',
            telefonoSectorista: ''
        }],

        // Información de servicios
        rubroProveedor: '',
        tipoActividades: '',

        // Documentos para evaluación
        documentos: {
            certificaciones: false,
            licenciaMunicipal: false,
            referenciasComerciales: false,
            referenciasBancarias: false,
            historialPrecios: false,
            condicionesPago: false,
            vigenciaPoder: false,
            fichaRuc: false,
            matrizAmbiental: false,
            matrizIperc: false
        },

        // Otros
        observaciones: '',
        relacionFamiliar: '',
        tipoRelacion: 'Ninguna',
        nombreColaborador: '',
        declaracionJurada: null,

        isElectronicInvoiceIssuer: true,
        isMypeRegistered: true,
        completionPercentage: 75,
        status: "Aprobado",
        documentsUploaded: 6,
        totalDocuments: 30,
        lastUpdate: "15 de Mayo, 2025",
    });

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

    const tiposProveedor = [
        { key: 'productos', label: 'Productos' },
        { key: 'servicios', label: 'Servicios' },
        { key: 'mixto', label: 'Mixto' }
    ];

    const tiposPersona = [
        { key: 'natural', label: 'Persona Natural' },
        { key: 'juridica', label: 'Persona Jurídica' }
    ];

    const tiposDocumento = [
        { key: 'dni', label: 'DNI' },
        { key: 'ruc', label: 'RUC' },
        { key: 'pasaporte', label: 'Pasaporte' },
        { key: 'ce', label: 'Carné de Extranjería' }
    ];

    const tiposContacto = [
        { key: 'gerente', label: 'Gerente' },
        { key: 'representante', label: 'Representante' },
        { key: 'ventas', label: 'Ventas' },
        { key: 'almacen', label: 'Almacén' },
        { key: 'administrativo', label: 'Administrativo' }
    ];

    const tiposRelacion = [
        { key: 'ninguna', label: 'Ninguna' },
        { key: 'familiar', label: 'Familiar' },
        { key: 'comercial', label: 'Contacto Comercial' }
    ];

    const handleInputChange = (field: string, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleArrayChange = (arrayName, index, field, value) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleDocumentChange = (docType, value) => {
        setFormData(prev => ({
            ...prev,
            documentos: {
                ...prev.documentos,
                [docType]: value
            }
        }));
    };

    const addArrayItem = (arrayName, defaultItem) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...prev[arrayName], defaultItem]
        }));
    };

    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }));
    };
    const tittle = "Perfil de Proveedor"
    const subtittle = "Registra y actualiza tu información. Mantén tus datos actualizados para\n" +
        "                            una mejor gestión comercial."

    return (
        <Dashboard>
            <div className="w-full space-y-6">
                <HeaderComponent title={tittle} subtitle={subtittle} isOptions={false} />

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
                                {getStatusIcon(formData.status)}
                            </div>
                            <Chip
                                color={getStatusColor(formData.status)}
                                variant="flat"
                                size="sm"
                            >
                                {formData.status}
                            </Chip>
                        </div>

                        {/* Progreso de Completado */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Completado
                                    </span>
                                <span className="text-sm font-bold text-primary-600">
                                        {formData.completionPercentage}%
                                    </span>
                            </div>
                            <Progress
                                value={formData.completionPercentage}
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
                                {formData.documentsUploaded}/{formData.totalDocuments}
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
                                {formData.lastUpdate}
                            </div>
                        </div>
                    </div>

                    {/* Información Destacada */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {formData.isMypeRegistered && (
                            <Chip
                                color="success"
                                variant="flat"
                                startContent={<CheckCircleIcon className="h-3 w-3"/>}
                                size="sm"
                            >
                                Registrado como MyPE
                            </Chip>
                        )}

                        {formData.isElectronicInvoiceIssuer ? (
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
                        {/*<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                        </div>*/}
                        <Tabs aria-label="Secciones del perfil" className="w-full" color="default">

                            {/* Información General */}
                            <Tab key="general" title={
                                <div className="flex items-center space-x-2">
                                    {/*<UserIcon className="w-4 h-4"/>*/}
                                    <BuildingOfficeIcon className="h-4 w-4 text-blue-500"/>
                                    <span>Información General</span>
                                </div>
                            }>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 ">
                                    <Select
                                        size="sm"
                                        label="Tipo de Proveedor"
                                        selectedKeys={[formData.tipoProveedor]}
                                        onSelectionChange={(keys) => handleInputChange('tipoProveedor', Array.from(keys)[0])}
                                    >
                                        {tiposProveedor.map(tipo => (
                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        size="sm"
                                        label="Tipo de Persona"
                                        selectedKeys={[formData.tipoPersona]}
                                        onSelectionChange={(keys) => handleInputChange('tipoPersona', Array.from(keys)[0])}
                                    >
                                        {tiposPersona.map(tipo => (
                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        size="sm"
                                        label="Tipo de Documento"
                                        selectedKeys={[formData.tipoDocumento]}
                                        onSelectionChange={(keys) => handleInputChange('tipoDocumento', Array.from(keys)[0])}
                                    >
                                        {tiposDocumento.map(tipo => (
                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Input
                                        size="sm"
                                        label="Número de Documento"
                                        value={formData.numeroDocumento}
                                        onValueChange={(value) => handleInputChange('numeroDocumento', value)}
                                    />

                                    <Input
                                        size="sm"
                                        label="Razón Social"
                                        value={formData.razonSocial}
                                        onValueChange={(value) => handleInputChange('razonSocial', value)}
                                        className="md:col-span-2"
                                    />

                                    <Input
                                        size="sm"
                                        label="País"
                                        value={formData.pais}
                                        onValueChange={(value) => handleInputChange('pais', value)}
                                    />

                                    <Input
                                        size="sm"
                                        label="URL Sitio Web"
                                        value={formData.urlSitioWeb}
                                        onValueChange={(value) => handleInputChange('urlSitioWeb', value)}
                                        className="md:col-span-2"
                                    />
                                </div>

                                <div className="flex gap-6 mt-6">
                                    <Switch
                                        size="sm"
                                        isSelected={formData.emisorFacturasElectronicas}
                                        onValueChange={(value) => handleInputChange('emisorFacturasElectronicas', value)}
                                    >
                                        ¿Emisor de Facturas Electrónicas?
                                    </Switch>

                                    <Switch
                                        size="sm"
                                        isSelected={formData.registradoMype}
                                        onValueChange={(value) => handleInputChange('registradoMype', value)}
                                    >
                                        ¿Registrado como MYPE?
                                    </Switch>
                                </div>
                            </Tab>

                            {/* Direcciones */}
                            <Tab key="direcciones" title={
                                <div className="flex items-center space-x-2">
                                    {/*<MapPinIcon className="w-4 h-4"/>*/}
                                    <GlobeAltIcon className="h-4 w-4 text-green-500"/>
                                    <span>Direcciones</span>
                                </div>
                            }>
                                <div className="space-y-6 mt-4">
                                    {formData.direcciones.map((direccion, index) => (
                                        <Card key={index} className="border dark:bg-gray-700 dark:border-gray-600 ">
                                            <CardHeader className="flex justify-between">
                                                <h4 className="text-lg font-semibold">Dirección {index + 1}</h4>
                                                {formData.direcciones.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        variant="light"
                                                        size="sm"
                                                        onPress={() => removeArrayItem('direcciones', index)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardBody>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Input
                                                        color="default"
                                                        size="sm"
                                                        label="Tipo de Dirección"
                                                        value={direccion.tipoDireccion}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'tipoDireccion', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Dirección Completa"
                                                        value={direccion.direccionCompleta}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'direccionCompleta', value)}
                                                        className="md:col-span-2"
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Referencia"
                                                        value={direccion.referencia}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'referencia', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="País"
                                                        value={direccion.pais}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'pais', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Departamento"
                                                        value={direccion.departamento}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'departamento', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Provincia"
                                                        value={direccion.provincia}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'provincia', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Distrito"
                                                        value={direccion.distrito}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'distrito', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Ubigeo"
                                                        value={direccion.ubigeo}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'ubigeo', value)}
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="bordered"
                                        onPress={() => addArrayItem('direcciones', {
                                            tipoDireccion: '',
                                            direccionCompleta: '',
                                            referencia: '',
                                            pais: '',
                                            departamento: '',
                                            provincia: '',
                                            distrito: '',
                                            ubigeo: ''
                                        })}
                                    >
                                        Agregar Dirección
                                    </Button>
                                </div>
                            </Tab>

                            {/* Contactos */}
                            <Tab key="contactos" title={
                                <div className="flex items-center space-x-2">
                                    {/*<PhoneIcon className="w-4 h-4"/>*/}
                                    <UserGroupIcon className="h-4 w-4 text-purple-500"/>
                                    <span>Personas de Contacto</span>
                                </div>
                            }>
                                <div className="space-y-6 mt-4">
                                    {formData.contactos.map((contacto, index) => (
                                        <Card key={index} className="border">
                                            <CardHeader className="flex justify-between">
                                                <h4 className="text-lg font-semibold">Contacto {index + 1}</h4>
                                                {formData.contactos.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        variant="light"
                                                        size="sm"
                                                        onPress={() => removeArrayItem('contactos', index)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardBody>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Select
                                                        size="sm"
                                                        label="Tipo de Contacto"
                                                        selectedKeys={[contacto.tipoContacto]}
                                                        onSelectionChange={(keys) => handleArrayChange('contactos', index, 'tipoContacto', Array.from(keys)[0])}
                                                    >
                                                        {tiposContacto.map(tipo => (
                                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Input
                                                        size="sm"
                                                        label="Nombres"
                                                        value={contacto.nombres}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'nombres', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Apellidos"
                                                        value={contacto.apellidos}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'apellidos', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Teléfono"
                                                        value={contacto.telefono}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'telefono', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Celular"
                                                        value={contacto.celular}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'celular', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Email"
                                                        type="email"
                                                        value={contacto.email}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'email', value)}
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="bordered"
                                        onPress={() => addArrayItem('contactos', {
                                            tipoContacto: '',
                                            nombres: '',
                                            apellidos: '',
                                            telefono: '',
                                            celular: '',
                                            email: ''
                                        })}
                                    >
                                        Agregar Contacto
                                    </Button>
                                </div>
                            </Tab>

                            {/* Referencias Bancarias */}
                            <Tab key="bancarias" title={
                                <div className="flex items-center space-x-2">
                                    {/*<BanknotesIcon className="w-4 h-4"/>*/}
                                    <BanknotesIcon className="h-4 w-4 text-yellow-500"/>
                                    <span>Referencias Bancarias</span>
                                </div>
                            }>
                                <div className="space-y-6 mt-4">
                                    {formData.referenciasBancarias.map((referencia, index) => (
                                        <Card key={index} className="border">
                                            <CardHeader className="flex justify-between">
                                                <h4 className="text-lg font-semibold">Referencia
                                                    Bancaria {index + 1}</h4>
                                                {formData.referenciasBancarias.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        variant="light"
                                                        size="sm"
                                                        onPress={() => removeArrayItem('referenciasBancarias', index)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardBody>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Input
                                                        size="sm"
                                                        label="País"
                                                        value={referencia.pais}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'pais', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Banco"
                                                        value={referencia.banco}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'banco', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Tipo de Cuenta"
                                                        value={referencia.tipoCuenta}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'tipoCuenta', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Tipo de Moneda"
                                                        value={referencia.tipoMoneda}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'tipoMoneda', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Número de Cuenta"
                                                        value={referencia.numeroCuenta}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'numeroCuenta', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="CCI"
                                                        value={referencia.cci}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'cci', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Código IBAN"
                                                        value={referencia.codigoIban}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'codigoIban', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Adjunto"
                                                        value={referencia.adjunto}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'adjunto', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Sectorista"
                                                        value={referencia.sectorista}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'sectorista', value)}
                                                    />
                                                    <Input
                                                        size="sm"
                                                        label="Teléfono Sectorista"
                                                        value={referencia.telefonoSectorista}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'telefonoSectorista', value)}
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="bordered"
                                        onPress={() => addArrayItem('referenciasBancarias', {
                                            pais: '',
                                            banco: '',
                                            tipoCuenta: '',
                                            tipoMoneda: '',
                                            numeroCuenta: '',
                                            cci: '',
                                            codigoIban: '',
                                            adjunto: '',
                                            sectorista: '',
                                            telefonoSectorista: ''
                                        })}
                                    >
                                        Agregar Referencia Bancaria
                                    </Button>
                                </div>
                            </Tab>

                            {/* Servicios */}
                            <Tab key="servicios" title={
                                <div className="flex items-center space-x-2">
                                    <BriefcaseIcon className="w-4 h-4 text-orange-500"/>
                                    <span>Servicios Ofrecidos</span>
                                </div>
                            }>
                                <div className="space-y-4 mt-4">
                                    <Textarea
                                        label="Rubro de Proveedor"
                                        placeholder="Describa el rubro principal del proveedor"
                                        value={formData.rubroProveedor}
                                        onValueChange={(value) => handleInputChange('rubroProveedor', value)}
                                        minRows={3}
                                    />
                                    <Textarea
                                        label="Tipo de Actividades"
                                        placeholder="Describa las actividades que realiza"
                                        value={formData.tipoActividades}
                                        onValueChange={(value) => handleInputChange('tipoActividades', value)}
                                        minRows={3}
                                    />
                                </div>
                            </Tab>

                            {/* Documentos */}
                            <Tab key="documentos" title={
                                <div className="flex items-center space-x-2">
                                    <DocumentTextIcon className="w-4 h-4 text-red-500"/>
                                    <span>Documentos</span>
                                </div>
                            }>
                                <div className="space-y-4 mt-4">
                                    <h4 className="text-lg font-semibold mb-4">Documentos para la Evaluación</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.certificaciones}
                                                onValueChange={(value) => handleDocumentChange('certificaciones', value)}
                                            >
                                                Certificaciones ISO (9001, 14001, 45001)
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.licenciaMunicipal}
                                                onValueChange={(value) => handleDocumentChange('licenciaMunicipal', value)}
                                            >
                                                Licencia Municipal de Funcionamiento
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.referenciasComerciales}
                                                onValueChange={(value) => handleDocumentChange('referenciasComerciales', value)}
                                            >
                                                Referencias Comerciales
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.referenciasBancarias}
                                                onValueChange={(value) => handleDocumentChange('referenciasBancarias', value)}
                                            >
                                                Referencias Bancarias
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.historialPrecios}
                                                onValueChange={(value) => handleDocumentChange('historialPrecios', value)}
                                            >
                                                Historial de Precios
                                            </Switch>
                                        </div>
                                        <div className="space-y-3">
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.condicionesPago}
                                                onValueChange={(value) => handleDocumentChange('condicionesPago', value)}
                                            >
                                                Condiciones de Pago
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.vigenciaPoder}
                                                onValueChange={(value) => handleDocumentChange('vigenciaPoder', value)}
                                            >
                                                Vigencia de Poder
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.fichaRuc}
                                                onValueChange={(value) => handleDocumentChange('fichaRuc', value)}
                                            >
                                                Ficha RUC
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.matrizAmbiental}
                                                onValueChange={(value) => handleDocumentChange('matrizAmbiental', value)}
                                            >
                                                Matriz de Aspectos e Impactos Ambientales
                                            </Switch>
                                            <Switch
                                                size="sm"
                                                isSelected={formData.documentos.matrizIperc}
                                                onValueChange={(value) => handleDocumentChange('matrizIperc', value)}
                                            >
                                                Matriz IPERC
                                            </Switch>
                                        </div>
                                    </div>
                                </div>
                            </Tab>

                            {/* Otros */}
                            <Tab key="otros" title={
                                <div className="flex items-center space-x-2">
                                    <InformationCircleIcon className="w-4 h-4"/>
                                    <span>Otros</span>
                                </div>
                            }>
                                <div className="space-y-4 mt-4">
                                    <Textarea
                                        label="Observaciones"
                                        placeholder="Ingrese observaciones adicionales"
                                        value={formData.observaciones}
                                        onValueChange={(value) => handleInputChange('observaciones', value)}
                                        minRows={4}
                                    />

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold">Relación con Colaboradores</h4>
                                        <Select
                                            label="Tipo de Relación"
                                            placeholder="Seleccionar tipo de relación"
                                            selectedKeys={[formData.tipoRelacion]}
                                            onSelectionChange={(keys) => handleInputChange('tipoRelacion', Array.from(keys)[0])}
                                        >
                                            {tiposRelacion.map(tipo => (
                                                <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                            ))}
                                        </Select>

                                        {formData.tipoRelacion !== 'ninguna' && (
                                            <Input
                                                label="Nombre del Colaborador"
                                                placeholder="Ingrese nombre del colaborador"
                                                value={formData.nombreColaborador}
                                                onValueChange={(value) => handleInputChange('nombreColaborador', value)}
                                            />
                                        )}
                                    </div>

                                    <Divider/>

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold">Declaración Jurada</h4>
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                                            <p className="text-gray-600 mb-4">Cargar Declaración Jurada</p>
                                            <Button color="primary" variant="bordered" size="sm">
                                                Seleccionar Archivo
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Tab>
                        </Tabs>

                        <Divider className="my-6"/>

                        <div className="flex justify-end gap-4">
                            <Button color="default" variant="bordered" size="sm">
                                Cancelar
                            </Button>
                            <Button color="primary" size="sm">
                                Guardar Perfil
                            </Button>
                        </div>
                    </div>

                    {/* Alertas o Notificaciones */}
                    {/*formData.status === "Pendiente" && (
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
                    )*/}
                </div>
                {/*<Card>
                    <CardHeader className="flex gap-3">
                        <BuildingOfficeIcon className="w-8 h-8 text-primary"/>
                        <div className="flex flex-col">
                            <p className="text-2xl font-bold">Perfil de Proveedor</p>
                            <p className="text-small text-default-500">Registro completo de información del
                                proveedor</p>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <Tabs aria-label="Secciones del perfil" className="w-full">

                            {/* Información General
                            <Tab key="general" title={
                                <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4"/>
                                    <span>Información General</span>
                                </div>
                            }>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    <Select
                                        label="Tipo de Proveedor"
                                        placeholder="Seleccionar tipo"
                                        selectedKeys={[formData.tipoProveedor]}
                                        onSelectionChange={(keys) => handleInputChange('tipoProveedor', Array.from(keys)[0])}
                                    >
                                        {tiposProveedor.map(tipo => (
                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Tipo de Persona"
                                        placeholder="Seleccionar tipo"
                                        selectedKeys={[formData.tipoPersona]}
                                        onSelectionChange={(keys) => handleInputChange('tipoPersona', Array.from(keys)[0])}
                                    >
                                        {tiposPersona.map(tipo => (
                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Tipo de Documento"
                                        placeholder="Seleccionar documento"
                                        selectedKeys={[formData.tipoDocumento]}
                                        onSelectionChange={(keys) => handleInputChange('tipoDocumento', Array.from(keys)[0])}
                                    >
                                        {tiposDocumento.map(tipo => (
                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Input
                                        label="Número de Documento"
                                        placeholder="Ingrese número"
                                        value={formData.numeroDocumento}
                                        onValueChange={(value) => handleInputChange('numeroDocumento', value)}
                                    />

                                    <Input
                                        label="Razón Social"
                                        placeholder="Ingrese razón social"
                                        value={formData.razonSocial}
                                        onValueChange={(value) => handleInputChange('razonSocial', value)}
                                        className="md:col-span-2"
                                    />

                                    <Input
                                        label="País"
                                        placeholder="Ingrese país"
                                        value={formData.pais}
                                        onValueChange={(value) => handleInputChange('pais', value)}
                                    />

                                    <Input
                                        label="URL Sitio Web"
                                        placeholder="https://ejemplo.com"
                                        value={formData.urlSitioWeb}
                                        onValueChange={(value) => handleInputChange('urlSitioWeb', value)}
                                        className="md:col-span-2"
                                    />
                                </div>

                                <div className="flex gap-6 mt-6">
                                    <Switch
                                        isSelected={formData.emisorFacturasElectronicas}
                                        onValueChange={(value) => handleInputChange('emisorFacturasElectronicas', value)}
                                    >
                                        ¿Emisor de Facturas Electrónicas?
                                    </Switch>

                                    <Switch
                                        isSelected={formData.registradoMype}
                                        onValueChange={(value) => handleInputChange('registradoMype', value)}
                                    >
                                        ¿Registrado como MYPE?
                                    </Switch>
                                </div>
                            </Tab>

                            {/* Direcciones *
                            <Tab key="direcciones" title={
                                <div className="flex items-center space-x-2">
                                    <MapPinIcon className="w-4 h-4"/>
                                    <span>Direcciones</span>
                                </div>
                            }>
                                <div className="space-y-6 mt-4">
                                    {formData.direcciones.map((direccion, index) => (
                                        <Card key={index} className="border">
                                            <CardHeader className="flex justify-between">
                                                <h4 className="text-lg font-semibold">Dirección {index + 1}</h4>
                                                {formData.direcciones.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        variant="light"
                                                        size="sm"
                                                        onPress={() => removeArrayItem('direcciones', index)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardBody>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Input
                                                        label="Tipo de Dirección"
                                                        placeholder="Ej: Principal, Sucursal"
                                                        value={direccion.tipoDireccion}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'tipoDireccion', value)}
                                                    />
                                                    <Input
                                                        label="Dirección Completa"
                                                        placeholder="Ingrese dirección"
                                                        value={direccion.direccionCompleta}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'direccionCompleta', value)}
                                                        className="md:col-span-2"
                                                    />
                                                    <Input
                                                        label="Referencia"
                                                        placeholder="Referencia de ubicación"
                                                        value={direccion.referencia}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'referencia', value)}
                                                    />
                                                    <Input
                                                        label="País"
                                                        placeholder="País"
                                                        value={direccion.pais}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'pais', value)}
                                                    />
                                                    <Input
                                                        label="Departamento"
                                                        placeholder="Departamento"
                                                        value={direccion.departamento}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'departamento', value)}
                                                    />
                                                    <Input
                                                        label="Provincia"
                                                        placeholder="Provincia"
                                                        value={direccion.provincia}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'provincia', value)}
                                                    />
                                                    <Input
                                                        label="Distrito"
                                                        placeholder="Distrito"
                                                        value={direccion.distrito}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'distrito', value)}
                                                    />
                                                    <Input
                                                        label="Ubigeo"
                                                        placeholder="Código ubigeo"
                                                        value={direccion.ubigeo}
                                                        onValueChange={(value) => handleArrayChange('direcciones', index, 'ubigeo', value)}
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    <Button
                                        color="primary"
                                        variant="bordered"
                                        onPress={() => addArrayItem('direcciones', {
                                            tipoDireccion: '',
                                            direccionCompleta: '',
                                            referencia: '',
                                            pais: '',
                                            departamento: '',
                                            provincia: '',
                                            distrito: '',
                                            ubigeo: ''
                                        })}
                                    >
                                        Agregar Dirección
                                    </Button>
                                </div>
                            </Tab>

                            {/* Contactos *
                            <Tab key="contactos" title={
                                <div className="flex items-center space-x-2">
                                    <PhoneIcon className="w-4 h-4"/>
                                    <span>Personas de Contacto</span>
                                </div>
                            }>
                                <div className="space-y-6 mt-4">
                                    {formData.contactos.map((contacto, index) => (
                                        <Card key={index} className="border">
                                            <CardHeader className="flex justify-between">
                                                <h4 className="text-lg font-semibold">Contacto {index + 1}</h4>
                                                {formData.contactos.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        variant="light"
                                                        size="sm"
                                                        onPress={() => removeArrayItem('contactos', index)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardBody>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Select
                                                        label="Tipo de Contacto"
                                                        placeholder="Seleccionar tipo"
                                                        selectedKeys={[contacto.tipoContacto]}
                                                        onSelectionChange={(keys) => handleArrayChange('contactos', index, 'tipoContacto', Array.from(keys)[0])}
                                                    >
                                                        {tiposContacto.map(tipo => (
                                                            <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Input
                                                        label="Nombres"
                                                        placeholder="Nombres"
                                                        value={contacto.nombres}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'nombres', value)}
                                                    />
                                                    <Input
                                                        label="Apellidos"
                                                        placeholder="Apellidos"
                                                        value={contacto.apellidos}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'apellidos', value)}
                                                    />
                                                    <Input
                                                        label="Teléfono"
                                                        placeholder="Teléfono fijo"
                                                        value={contacto.telefono}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'telefono', value)}
                                                    />
                                                    <Input
                                                        label="Celular"
                                                        placeholder="Número celular"
                                                        value={contacto.celular}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'celular', value)}
                                                    />
                                                    <Input
                                                        label="Email"
                                                        placeholder="correo@ejemplo.com"
                                                        type="email"
                                                        value={contacto.email}
                                                        onValueChange={(value) => handleArrayChange('contactos', index, 'email', value)}
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    <Button
                                        color="primary"
                                        variant="bordered"
                                        onPress={() => addArrayItem('contactos', {
                                            tipoContacto: '',
                                            nombres: '',
                                            apellidos: '',
                                            telefono: '',
                                            celular: '',
                                            email: ''
                                        })}
                                    >
                                        Agregar Contacto
                                    </Button>
                                </div>
                            </Tab>

                            {/* Referencias Bancarias *
                            <Tab key="bancarias" title={
                                <div className="flex items-center space-x-2">
                                    <BanknotesIcon className="w-4 h-4"/>
                                    <span>Referencias Bancarias</span>
                                </div>
                            }>
                                <div className="space-y-6 mt-4">
                                    {formData.referenciasBancarias.map((referencia, index) => (
                                        <Card key={index} className="border">
                                            <CardHeader className="flex justify-between">
                                                <h4 className="text-lg font-semibold">Referencia
                                                    Bancaria {index + 1}</h4>
                                                {formData.referenciasBancarias.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        variant="light"
                                                        size="sm"
                                                        onPress={() => removeArrayItem('referenciasBancarias', index)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardBody>
                                                <div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <Input
                                                        label="País"
                                                        placeholder="País del banco"
                                                        value={referencia.pais}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'pais', value)}
                                                    />
                                                    <Input
                                                        label="Banco"
                                                        placeholder="Nombre del banco"
                                                        value={referencia.banco}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'banco', value)}
                                                    />
                                                    <Input
                                                        label="Tipo de Cuenta"
                                                        placeholder="Ej: Corriente, Ahorros"
                                                        value={referencia.tipoCuenta}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'tipoCuenta', value)}
                                                    />
                                                    <Input
                                                        label="Tipo de Moneda"
                                                        placeholder="Ej: Soles, Dólares"
                                                        value={referencia.tipoMoneda}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'tipoMoneda', value)}
                                                    />
                                                    <Input
                                                        label="Número de Cuenta"
                                                        placeholder="Número de cuenta"
                                                        value={referencia.numeroCuenta}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'numeroCuenta', value)}
                                                    />
                                                    <Input
                                                        label="CCI"
                                                        placeholder="Código CCI"
                                                        value={referencia.cci}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'cci', value)}
                                                    />
                                                    <Input
                                                        label="Código IBAN"
                                                        placeholder="Código IBAN"
                                                        value={referencia.codigoIban}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'codigoIban', value)}
                                                    />
                                                    <Input
                                                        label="Adjunto"
                                                        placeholder="Archivo adjunto"
                                                        value={referencia.adjunto}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'adjunto', value)}
                                                    />
                                                    <Input
                                                        label="Sectorista"
                                                        placeholder="Nombre del sectorista"
                                                        value={referencia.sectorista}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'sectorista', value)}
                                                    />
                                                    <Input
                                                        label="Teléfono Sectorista"
                                                        placeholder="Teléfono del sectorista"
                                                        value={referencia.telefonoSectorista}
                                                        onValueChange={(value) => handleArrayChange('referenciasBancarias', index, 'telefonoSectorista', value)}
                                                    />
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                    <Button
                                        color="primary"
                                        variant="bordered"
                                        onPress={() => addArrayItem('referenciasBancarias', {
                                            pais: '',
                                            banco: '',
                                            tipoCuenta: '',
                                            tipoMoneda: '',
                                            numeroCuenta: '',
                                            cci: '',
                                            codigoIban: '',
                                            adjunto: '',
                                            sectorista: '',
                                            telefonoSectorista: ''
                                        })}
                                    >
                                        Agregar Referencia Bancaria
                                    </Button>
                                </div>
                            </Tab>

                            {/* Servicios *
                            <Tab key="servicios" title={
                                <div className="flex items-center space-x-2">
                                    <BriefcaseIcon className="w-4 h-4"/>
                                    <span>Servicios Ofrecidos</span>
                                </div>
                            }>
                                <div className="space-y-4 mt-4">
                                    <Textarea
                                        label="Rubro de Proveedor"
                                        placeholder="Describa el rubro principal del proveedor"
                                        value={formData.rubroProveedor}
                                        onValueChange={(value) => handleInputChange('rubroProveedor', value)}
                                        minRows={3}
                                    />
                                    <Textarea
                                        label="Tipo de Actividades"
                                        placeholder="Describa las actividades que realiza"
                                        value={formData.tipoActividades}
                                        onValueChange={(value) => handleInputChange('tipoActividades', value)}
                                        minRows={3}
                                    />
                                </div>
                            </Tab>

                            {/* Documentos *
                            <Tab key="documentos" title={
                                <div className="flex items-center space-x-2">
                                    <DocumentTextIcon className="w-4 h-4"/>
                                    <span>Documentos</span>
                                </div>
                            }>
                                <div className="space-y-4 mt-4">
                                    <h4 className="text-lg font-semibold mb-4">Documentos para la Evaluación</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Switch
                                                isSelected={formData.documentos.certificaciones}
                                                onValueChange={(value) => handleDocumentChange('certificaciones', value)}
                                            >
                                                Certificaciones ISO (9001, 14001, 45001)
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.licenciaMunicipal}
                                                onValueChange={(value) => handleDocumentChange('licenciaMunicipal', value)}
                                            >
                                                Licencia Municipal de Funcionamiento
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.referenciasComerciales}
                                                onValueChange={(value) => handleDocumentChange('referenciasComerciales', value)}
                                            >
                                                Referencias Comerciales
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.referenciasBancarias}
                                                onValueChange={(value) => handleDocumentChange('referenciasBancarias', value)}
                                            >
                                                Referencias Bancarias
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.historialPrecios}
                                                onValueChange={(value) => handleDocumentChange('historialPrecios', value)}
                                            >
                                                Historial de Precios
                                            </Switch>
                                        </div>
                                        <div className="space-y-3">
                                            <Switch
                                                isSelected={formData.documentos.condicionesPago}
                                                onValueChange={(value) => handleDocumentChange('condicionesPago', value)}
                                            >
                                                Condiciones de Pago
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.vigenciaPoder}
                                                onValueChange={(value) => handleDocumentChange('vigenciaPoder', value)}
                                            >
                                                Vigencia de Poder
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.fichaRuc}
                                                onValueChange={(value) => handleDocumentChange('fichaRuc', value)}
                                            >
                                                Ficha RUC
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.matrizAmbiental}
                                                onValueChange={(value) => handleDocumentChange('matrizAmbiental', value)}
                                            >
                                                Matriz de Aspectos e Impactos Ambientales
                                            </Switch>
                                            <Switch
                                                isSelected={formData.documentos.matrizIperc}
                                                onValueChange={(value) => handleDocumentChange('matrizIperc', value)}
                                            >
                                                Matriz IPERC
                                            </Switch>
                                        </div>
                                    </div>
                                </div>
                            </Tab>

                            {/* Otros *
                            <Tab key="otros" title={
                                <div className="flex items-center space-x-2">
                                    <InformationCircleIcon className="w-4 h-4"/>
                                    <span>Otros</span>
                                </div>
                            }>
                                <div className="space-y-4 mt-4">
                                    <Textarea
                                        label="Observaciones"
                                        placeholder="Ingrese observaciones adicionales"
                                        value={formData.observaciones}
                                        onValueChange={(value) => handleInputChange('observaciones', value)}
                                        minRows={4}
                                    />

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold">Relación con Colaboradores</h4>
                                        <Select
                                            label="Tipo de Relación"
                                            placeholder="Seleccionar tipo de relación"
                                            selectedKeys={[formData.tipoRelacion]}
                                            onSelectionChange={(keys) => handleInputChange('tipoRelacion', Array.from(keys)[0])}
                                        >
                                            {tiposRelacion.map(tipo => (
                                                <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                                            ))}
                                        </Select>

                                        {formData.tipoRelacion !== 'ninguna' && (
                                            <Input
                                                label="Nombre del Colaborador"
                                                placeholder="Ingrese nombre del colaborador"
                                                value={formData.nombreColaborador}
                                                onValueChange={(value) => handleInputChange('nombreColaborador', value)}
                                            />
                                        )}
                                    </div>

                                    <Divider/>

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold">Declaración Jurada</h4>
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                                            <p className="text-gray-600 mb-4">Cargar Declaración Jurada</p>
                                            <Button color="primary" variant="bordered" size="sm">
                                                Seleccionar Archivo
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Tab>
                        </Tabs>

                        <Divider className="my-6"/>

                        <div className="flex justify-end gap-4">
                            <Button color="default" variant="bordered" size="lg">
                                Cancelar
                            </Button>
                            <Button color="primary" size="lg">
                                Guardar Perfil
                            </Button>
                        </div>
                    </CardBody>
                </Card>*/}
            </div>
        </Dashboard>
    );
};

export default ProveedorProfile;