import type {
    contactPerson,
    Direction,
    ReferenciaBancaria,
    ReferenciaComercial,
    ServiciosOfrecidos,
    Supplier
} from '@/store/types';

interface Direccion {
    CodDireccion: string;
    Departamento: string;
    Direccion: string;
    Distrito: string;
    NroLinea: string;
    Provincia: string;
    Ubigeo: string;
}

export interface Contacto {
    Active: string;
    E_MailL: string;
    Name: string;
    Profesion: string;
    Telefono: string;
}

export interface Banco {
    Banco: string;
    Cuenta: string;
    Sectorista: string;
}

export interface DocumentoEvaluacion {
    DocEntry: string;
    U_CardCode: string;
    U_DocumentoEvaluacion: string;
    U_LinkDocumento: string;
    U_NombDocu: string;
    U_Status: string;
    U_typeArchiv: string;
}
export interface SupplierApiRecord {
    DocEntry?: string;
    CodigoSN: string;
    NombreSN: string;
    RUC: string;
    TipoPersona: string;
    Moneda: string;
    Telefono1: string;
    Telefono2: string;
    TelefonoMovil: string;
    Correo: string;
    TipoDocumento: string;
    Direccion: string;
    Distrito: string;
    Provincia: string;
    Departamento: string;
    Ubigeo: string;
    CondicionPago: string;
    DireccionSUNAT: string;
    ResolucionAgenteRetencion: string;
    ResolucionAgentePercepcion: string;
    website: string | null;
    createDate: string;
    updateDate: string;
    statusContributer: string | null;
    statusDomicilio: string | null;
    agentePercepcion: string;
    exoPercepcion: string;
    agenteRetencion: string;
    goodContributor: string;
    economiActivitySunat: string;
    status: string;
    approvalDate: string;
    coverImage: string;
    Avatar: string;
    generalManager: string;
    adminManager: string;
    salesManager: string,
    Contactos: Contacto[];
    Bancos: Banco[];
    Direcciones: Direccion[];
    DocumentoEvaluacion: DocumentoEvaluacion[];
    ReferenciasComerciales?: ReferenciaComercial[];
    ServiciosOfrecidos?: ServiciosOfrecidos[];
}

interface SuppliersApiResponse {
    statusCode: number;
    message: string;
    data: SupplierApiRecord;
}

const resolveEnv = (key: string): string | undefined => {
    if (key in import.meta.env && typeof import.meta.env[key] === 'string') {
        return import.meta.env[key] as string;
    }

    const viteKey = `VITE_${key}`;
    if (viteKey in import.meta.env && typeof import.meta.env[viteKey] === 'string') {
        return import.meta.env[viteKey] as string;
    }

    const reactKey = `REACT_APP_${key}`;
    if (reactKey in import.meta.env && typeof import.meta.env[reactKey] === 'string') {
        return import.meta.env[reactKey] as string;
    }

    return undefined;
};

const DEFAULT_SUPPLIERS_API_BASE_URL = 'http://192.168.254.27:8082';
const SUPPLIERS_ENDPOINT = '/api/Proveedores';
const SUNAT_RUC_ENDPOINT = 'https://miapi.cloud/v1/ruc/completo';
const SUNAT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxNjAsImV4cCI6MTc1MzgyMDM4OH0.92i1bhAjras26HI3-HdW7aplYv9T9GlJEV5fVV7CAVI';
const DOCUMENT_KEY_ALIASES: Record<string, string> = {
    certificacionISO: 'certificaciones',
    licenciaMuni: 'licenciaMunicipal',
    historicoPrecios: 'historialPrecios',
    matrizAAmbientales: 'matrizAmbiental',
    matrizIPERC: 'matrizIperc',
};

const toBooleanFlag = (value?: string) => value?.toUpperCase() === 'Y';

const normaliseString = (value?: string | null) => (value ?? '').trim();

const normaliseDocumentoEvaluacionKey = (key?: string): string | undefined => {
    if (!key) {
        return undefined;
    }
    return DOCUMENT_KEY_ALIASES[key] ?? key;
};

const normaliseSupplierRecord = (record: SupplierApiRecord): SupplierApiRecord => ({
    ...record,
    DocumentoEvaluacion: (record.DocumentoEvaluacion ?? []).map((doc) => ({
        ...doc,
        U_DocumentoEvaluacion: normaliseDocumentoEvaluacionKey(doc.U_DocumentoEvaluacion) ?? '',
    })),
});

const SUPPLIER_STATUS_VALUES: Supplier['status'][] = [
    'Activo',
    'Inactivo',
    'Pendiente',
    'Suspendido',
    'Observado',
    'Rechazado',
    'EnProceso',
];

const normaliseSupplierStatus = (status?: string): Supplier['status'] =>
    SUPPLIER_STATUS_VALUES.includes(status as Supplier['status'])
        ? (status as Supplier['status'])
        : 'Pendiente';

export const createDefaultDocuments = (overrides?: Partial<Supplier['Documentos']>): Supplier['Documentos'] => ({
    certificaciones: false,
    referenciasBancarias: false,
    vigenciaPoder: false,
    matrizIperc: false,
    licenciaMunicipal: false,
    historialPrecios: false,
    fichaRuc: false,
    referenciasComerciales: false,
    condicionesPago: false,
    matrizAmbiental: false,
    ...overrides
}) as unknown as Supplier['Documentos'];

const generateSupplierId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `supplier-${Math.random().toString(36).slice(2, 11)}`;
};

const mapApiRecordToSupplier = (record: SupplierApiRecord): Supplier => {
    const normalizedRecord = normaliseSupplierRecord(record);
    const cardCode =
        normaliseString(normalizedRecord['CodigoSN']) ||
        normaliseString(normalizedRecord.CodigoSN) ||
        normaliseString(normalizedRecord.NombreSN) ||
        normaliseString(normalizedRecord.RUC);
    const cardName = normaliseString(normalizedRecord.NombreSN);
    const email = normaliseString(normalizedRecord.Correo);
    const phone = normaliseString(normalizedRecord.Telefono1) +"-"+ normaliseString(normalizedRecord.Telefono2);
    const mobile = normaliseString(normalizedRecord.TelefonoMovil);
    const currency = normaliseString(normalizedRecord.Moneda);
    const website = normaliseString(normalizedRecord.website);
    const address = normaliseString(normalizedRecord.Direccion) || normaliseString(normalizedRecord.DireccionSUNAT);
    const paymentTerms = normaliseString(normalizedRecord.CondicionPago);
    const personType = normaliseString(normalizedRecord.TipoPersona);
    const documentType = normaliseString(normalizedRecord.TipoDocumento);
    const frontPage = normalizedRecord.coverImage && normalizedRecord.coverImage.trim() !== '' ? normalizedRecord.coverImage : 'https://static.vecteezy.com/system/resources/thumbnails/019/023/718/small/robotic-arm-industrial-png.png';

    const directions: Direction[] = (normalizedRecord.Direcciones || []).map(direction =>({
        address: direction.Direccion,
        type: direction.CodDireccion,
        departament: direction.Departamento,
        province: direction.Provincia,
        city: direction.Distrito,
        ubigeo: normalizedRecord.Ubigeo
    }))
    const persons: contactPerson[] = (normalizedRecord.Contactos || []).map(contacto =>({
        name: contacto.Name,
        email: contacto.E_MailL,
        phone: '', // No viene de API
        active: contacto.Active === 'Y',
        position: contacto.Profesion
    }));
    const bankReferences: ReferenciaBancaria[] = (normalizedRecord.Bancos || []).map(banco => ({
        bankName: banco.Banco,
        accountNumber: banco.Cuenta,
        phoneNumber: '',     // No viene en la API, asi que valor por defecto
        sectorista: banco.Sectorista || '',
        address: '',         // No viene en la API
        swiftCode: '',       // No viene en la API
        iban: '',            // No viene en la API
        accountType: '',     // No viene en la API
        currency: '',        // No viene en la API
        registrationDate: undefined,
    }));
    const commercialReferences: ReferenciaComercial[] = (normalizedRecord.ReferenciasComerciales || []).map((ref) => ({
        name: ref.name,
        contact: ref.contact,
        phone: ref.phone,
    }));
    const serviciosOfrecidos: ServiciosOfrecidos[] = (normalizedRecord.ServiciosOfrecidos || []).map((serv) => ({
        principalActivity: serv.principalActivity,
        serviceLine: serv.serviceLine,
        paymentTerms: serv.paymentTerms,
    }));

    const documents = createDefaultDocuments({
        certificaciones: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'certificaciones') ?? false,
        referenciasBancarias: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'referenciasBancarias') ?? false,
        vigenciaPoder: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'vigenciaPoder') ?? false,
        matrizIperc: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'matrizIperc') ?? false,
        licenciaMunicipal: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'licenciaMunicipal') ?? false,
        historialPrecios: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'historialPrecios') ?? false,
        fichaRuc: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'fichaRuc') ?? false,
        referenciasComerciales: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'referenciasComerciales') ?? false,
        condicionesPago: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'condicionesPago') ?? false,
        matrizAmbiental: normalizedRecord.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'matrizAmbiental') ?? false,
    });

    console.log("Avtar", normalizedRecord.Avatar)
    const createdAt = normaliseString(normalizedRecord.createDate);
    const updatedAt = normaliseString(normalizedRecord.updateDate);
    const supplier: Supplier = {
        docEntry: cardCode || generateSupplierId(),
        RUC: normalizedRecord.RUC,
        cardCode,
        cardName,
        email,
        phone,
        cellPhone: mobile,
        currency,
        website,
        address,
        taxPayerCategory: normaliseString(normalizedRecord.statusContributer),
        businessType: personType || 'Proveedor',
        personType,
        documentType,
        agenteRetencion: toBooleanFlag(normalizedRecord.agenteRetencion),
        agentePercepcion: toBooleanFlag(normalizedRecord.agentePercepcion),
        exoneradoPercepcion: toBooleanFlag(normalizedRecord.exoPercepcion),
        goodContributor: normalizedRecord.goodContributor === "Y",
        emisorFacElectronica: true,
        estado: normaliseString(normalizedRecord.statusDomicilio),
        condicion: normaliseString(normalizedRecord.statusContributer),
        status: normaliseSupplierStatus(normalizedRecord.status),
        approvalDate: updatedAt || '',
        rejectionReason: [],
        rating: 0,
        totalOrders: 0,
        totalAmount: 0,
        paymentTerms,
        registrationDate: createdAt || '',
        lastOrderDate: '',
        lastProfileUpdate: updatedAt || createdAt || '',
        coverImage: frontPage,
        //avatar: email ? `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}` : '',
        avatar: normalizedRecord.Avatar,
        generalManager: '',
        adminManager: '',
        salesManager: '',
        addresses: directions,
        contactPerson: persons,
        contactEmail: email,
        contactPhone: phone || mobile,
        listaContactos: persons,
        bankReferences: bankReferences,
        commercialReferences: commercialReferences,
        ServiciosOfrecidos: serviciosOfrecidos,
        Documentos: documents,
    };

    return supplier;
};

const buildEndpointUrl = (cardCode?: string) => {
    const baseUrl =
        normaliseString(resolveEnv('SUPPLIERS_API_BASE_URL')) || DEFAULT_SUPPLIERS_API_BASE_URL;

    const url = new URL(`${baseUrl}${SUPPLIERS_ENDPOINT}`);

    if (cardCode && cardCode.trim() !== '') {
        url.searchParams.set('CardCode', cardCode.trim());
    }

    return url.toString();
};


/*const handleResponse = async (response: Response): Promise<SuppliersApiResponse> => {
    if (!response.ok) {
        throw new Error(`Error al consultar proveedores (${response.status})`);
    }

    const json = (await response.json()) as SuppliersApiResponse;

    if (!json || typeof json !== 'object' || !Array.isArray(json.data)) {
        throw new Error('Respuesta del servicio de proveedores inválida.');
    }

    return json;
};*/
type SuppliersApiListResponse = {
    statusCode: number;
    message: string;
    data: SupplierApiRecord[];
    total?: number;
};

const handleResponse = async (response: Response): Promise<SuppliersApiResponse | SuppliersApiListResponse> => {
    console.log('Respuesta recibida:', response);

    if (!response.ok) {
        console.error(`Error HTTP al consultar proveedores: ${response.status}`);
        throw new Error(`Error al consultar proveedores (${response.status})`);
    }

    let json;
    try {
        json = await response.json();
        console.log('JSON parseado correctamente:', json);
    } catch (error) {
        console.error('Error al parsear JSON:', error);
        throw new Error('No se pudo parsear la respuesta JSON.');
    }

    /*if (!json || typeof json !== 'object' || !Array.isArray(json.data)) {
        console.error('Respuesta del servicio de proveedores inválida:', json);
        throw new Error('Respuesta del servicio de proveedores inválida.');
    }*/
    if (json && json.data) {
        const dataArray = Array.isArray(json.data) ? json.data : [json.data];
        // Campos que pueden venir como null y deben ser arrays vacíos
        const arrayFields = ['Contactos', 'Bancos', 'Direcciones', 'DocumentoEvaluacion'];

        dataArray.forEach((record: SupplierApiRecord) => {
            const mutableRecord = record as unknown as Record<string, unknown>;
            arrayFields.forEach(field => {
                if (mutableRecord[field] === null) {
                    console.log(`Campo ${field} es null, transformando a array vacío`);
                    mutableRecord[field] = [];
                }
            });
        });
    }

    return json;
};

type SunatApiResponse = {
    success: boolean;
    datos?: {
        ruc: string;
        razon_social: string;
        tipo_contribuyente: string;
        nombre_comercial: string;
        fecha_inscripcion: string;
        fecha_inicio_actividades: string;
        estado: string;
        fecha_baja: string | null;
        mensaje_estado: string | null;
        condicion: string;
        domicilio_fiscal: {
            direccion: string;
            distrito: string;
            provincia: string;
            departamento: string;
        };
        sistema_emision?: string;
        actividad_comercio_exterior?: string;
        sistema_contabilidad?: string;
        actividades_economicas?: string[];
        comprobantes_pago?: string[];
        sistema_emision_electronica?: string[];
        emisor_electronico_desde?: string;
        comprobantes_electronicos?: string[];
        afiliado_PLE_desde?: string;
        padrones?: string[];
        agente_retencion?: string;
        agente_percepcion?: string;
    };
};

export const fetchSunatSupplierData = async (ruc: string): Promise<SunatApiResponse> => {
    const sanitizedRuc = ruc.trim();
    if (!/^\d{11}$/.test(sanitizedRuc)) {
        throw new Error('El RUC debe contener 11 dígitos.');
    }

    const url = `${SUNAT_RUC_ENDPOINT}/${sanitizedRuc}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${SUNAT_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`No se pudo consultar el RUC (HTTP ${response.status}).`);
    }

    const json = (await response.json()) as SunatApiResponse;
    return json;
};


const fetchSupplierResponse = async (
    cardCode?: string,
    init?: RequestInit,
): Promise<SuppliersApiResponse | SuppliersApiListResponse> => {
    const response = await fetch(buildEndpointUrl(cardCode), {
        headers: {
            'Content-Type': 'application/json',
        },
        ...init,
    });

    return handleResponse(response);
};

export const fetchSuppliersFromApi = async (cardCode?: string): Promise<Supplier> => {
    const json = await fetchSupplierResponse(cardCode);
    const record = Array.isArray(json.data) ? json.data[0] : json.data;
    if (!record) {
        throw new Error('No se encontraron proveedores.');
    }
    return mapApiRecordToSupplier(record);
};

export const fetchSuppliersListFromApi = async (
    params?: { startDate?: string; endDate?: string },
): Promise<Supplier[]> => {
    const url = new URL(buildEndpointUrl());

    if (params?.startDate) {
        url.searchParams.set('FechaInicio', params.startDate);
    }
    if (params?.endDate) {
        url.searchParams.set('FechaFin', params.endDate);
    }

    const response = await fetch(url.toString(), {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const json = (await handleResponse(response)) as SuppliersApiListResponse;
    const records = (Array.isArray(json.data) ? json.data : json.data ? [json.data] : [])
        .filter((record): record is SupplierApiRecord => Boolean(record));

    return records.map(mapApiRecordToSupplier);
};

export const fetchSupplierByCardCode = async (
    cardCode: string,
): Promise<{ supplier: Supplier; record: SupplierApiRecord } | null> => {
    console.log("Codigo de Proveedor a llmar", cardCode)
    if (!cardCode) {
        return null;
    }

    const json = await fetchSupplierResponse(cardCode);
    const record = Array.isArray(json.data) ? json.data[0] : json.data;

    if (!record) {
        return null;
    }

    const normalizedRecord = normaliseSupplierRecord(record);

    return {
        supplier: mapApiRecordToSupplier(normalizedRecord),
        record: normalizedRecord,
    };
};

export const updateSupplierProfile = async (
    supplierId: string,
    payload: SupplierApiRecord,
): Promise<{ supplier: Supplier; record: SupplierApiRecord }> => {
    console.log("Payload", payload)
    const json = await fetchSupplierResponse(supplierId, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

    const record = Array.isArray(json.data) ? json.data[0] : json.data;
    if (!record) {
        throw new Error('La respuesta al actualizar el proveedor no contiene información válida.');
    }

    const normalizedRecord = normaliseSupplierRecord(record);

    return {
        supplier: mapApiRecordToSupplier(normalizedRecord),
        record: normalizedRecord,
    };
};

export const createSupplierProfile = async (
    payload: SupplierApiRecord,
): Promise<{ supplier: Supplier; record: SupplierApiRecord }> => {
    const response = await fetch(buildEndpointUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const json = await handleResponse(response);
    let record = Array.isArray(json.data) ? json.data[0] : json.data;

    if (!record || typeof record === 'string') {
        const supplierId = typeof json.data === 'string' && json.data ? json.data : payload.CodigoSN;
        const refreshed = await fetchSupplierByCardCode(supplierId);

        if (!refreshed || !refreshed.record) {
            throw new Error('La respuesta al crear el proveedor no contiene información válida.');
        }

        record = refreshed.record;
    }

    const normalizedRecord = normaliseSupplierRecord(record);
    const mapped = mapApiRecordToSupplier(normalizedRecord);

    return {
        supplier: mapped,
        record: normalizedRecord,
    };
};

