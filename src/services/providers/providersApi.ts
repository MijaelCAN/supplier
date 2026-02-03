import type {
    contactPerson,
    Direction,
    ReferenciaBancaria,
    ReferenciaComercial,
    ServiciosOfrecidos,
    Supplier
} from '@/store/types';
import type { Supplier as SupplierStore } from '@/store/index';
import {httpClient, buildSecureUrl} from "@/services/http/httpClient.ts";

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
    DocEntry: string;
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
const SUNAT_RUC_ENDPOINT = 'https://apiperu.dev/api/ruc_sunat';
const SUNAT_API_TOKEN = 'b16dde83c5863385f85337a7622ea978acbd12cc406fec979fed510123a7ffda';
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
        DocEntry: ref.DocEntry || '',
        U_CardCode: ref.U_CardCode || '',
        U_RazonSocial: ref.U_RazonSocial || '',
        U_Contacto: ref.U_Contacto || '',
        U_Telefonos: ref.U_Telefonos || '',
        registrationDate: undefined,
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

    const params: Record<string, string> = {};
    if (cardCode && cardCode.trim() !== '') {
        params['CardCode'] = cardCode.trim();
    }

    return buildSecureUrl(baseUrl, SUPPLIERS_ENDPOINT, params);
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

    if (!response.ok) {
        console.error(`Error HTTP al consultar proveedores: ${response.status}`);
        throw new Error(`Error al consultar proveedores (${response.status})`);
    }

    let json;
    try {
        json = await response.json();
        //console.log('JSON parseado correctamente:', json);
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
    data?: {
        direccion: string;
        direccion_completa: string;
        ruc: string;
        nombre_o_razon_social: string;
        estado: string;
        condicion: string;
        departamento: string;
        provincia: string;
        distrito: string;
        ubigeo_sunat: string;
        ubigeo: string[];
        actividades_economicas: string[];
        es_agente_de_retencion: string;
        es_agente_de_percepcion: string;
        es_agente_de_percepcion_combustible: string;
        es_buen_contribuyente: string;
    };
    time?: number;
    total_time?: number;
};

export const fetchSunatSupplierData = async (ruc: string): Promise<SunatApiResponse> => {
    const sanitizedRuc = ruc.trim();
    if (!/^\d{11}$/.test(sanitizedRuc)) {
        throw new Error('El RUC debe contener 11 dígitos.');
    }

    // Usar fetch directamente para evitar que httpClient modifique headers o agregue tokens
    // Las APIs externas pueden ser sensibles a headers adicionales o modificados
    const response = await fetch(SUNAT_RUC_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUNAT_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            ruc: sanitizedRuc
        }),
        // No incluir credentials para evitar problemas de CORS
        credentials: 'omit',
    });
    

    if (!response.ok) {
        let errorMessage = `No se pudo consultar el RUC (HTTP ${response.status}).`;
        try {
            const errorText = await response.text();
            if (errorText) {
                errorMessage += ` ${errorText}`;
                console.error('Error response body:', errorText);
            }
        } catch (e) {
            console.error('No se pudo leer el cuerpo de la respuesta de error');
        }
        throw new Error(errorMessage);
    }

    const json = (await response.json()) as SunatApiResponse;
    
    if (!json.success || !json.data) {
        throw new Error('No se pudo obtener información del RUC desde SUNAT.');
    }
    
    return json;
};


const fetchSupplierResponse = async (
    cardCode?: string,
    init?: RequestInit,
): Promise<SuppliersApiResponse | SuppliersApiListResponse> => {
    const response = await httpClient(buildEndpointUrl(cardCode), {
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

    const response = await httpClient(url.toString(), {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const json = (await handleResponse(response)) as SuppliersApiListResponse;
    const records = (Array.isArray(json.data) ? json.data : json.data ? [json.data] : [])
        .filter((record): record is SupplierApiRecord => Boolean(record));

    return records.map(mapApiRecordToSupplier);
};

export const    fetchSupplierByCardCode = async (
    cardCode: string,
): Promise<{ supplier: Supplier; record: SupplierApiRecord } | null> => {

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
    const response = await httpClient(buildEndpointUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    // Primero parsear el JSON para verificar el statusCode
    let json;
    try {
        json = await response.json();
    } catch (error) {
        throw new Error('No se pudo parsear la respuesta del servidor.');
    }

    // Verificar si hay un error en el statusCode (cualquier código >= 400 o statusCode en el JSON)
    if (!response.ok || (json.statusCode && json.statusCode >= 400)) {
        const errorMessage = json.message || `Error al crear el proveedor (${json.statusCode || response.status})`;
        throw new Error(errorMessage);
    }

    // Si la respuesta es exitosa pero no tiene data, intentar refrescar
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

/**
 * Convierte un Supplier de la API (tipo completo de @/store/types) 
 * al tipo Supplier del store simple (de @/store/index)
 * Maneja casos null/undefined y asegura compatibilidad de tipos
 * @param apiSupplier - El Supplier que viene de la API (puede ser undefined)
 * @returns Supplier del store simple o null si no hay supplier
 */
export const convertApiSupplierToStoreSupplier = (
    apiSupplier: Supplier | undefined
): SupplierStore | null => {
    if (!apiSupplier) {
        return null;
    }
    
    // Obtener ciudad y país de las direcciones si existen
    const firstAddress = apiSupplier.addresses && apiSupplier.addresses.length > 0 
        ? apiSupplier.addresses[0] 
        : null;
    
    // Obtener contactPerson como string (primer contacto si es array)
    const contactPersonStr = Array.isArray(apiSupplier.contactPerson) && apiSupplier.contactPerson.length > 0
        ? apiSupplier.contactPerson[0].name
        : typeof apiSupplier.contactPerson === 'string'
        ? apiSupplier.contactPerson
        : '';
    
    // Convertir status del tipo completo al tipo simple
    const statusMap: Record<Supplier['status'], SupplierStore['status']> = {
        'Activo': 'A',
        'Inactivo': 'I',
        'Pendiente': 'P',
        'Suspendido': 'S',
        'Observado': 'P',
        'Rechazado': 'I',
        'EnProceso': 'P'
    };
    
    // Convertir certificaciones a array de strings
    const certifications: string[] = [];
    if (apiSupplier.Documentos) {
        if (apiSupplier.Documentos.certificaciones === true) {
            certifications.push('ISO 9001');
        }
        // Puedes agregar más certificaciones según sea necesario
    }
    
    const storeSupplier: SupplierStore = {
        docEntry: apiSupplier.docEntry,
        cardCode: apiSupplier.cardCode,
        cardName: apiSupplier.cardName,
        email: apiSupplier.email,
        phone: apiSupplier.phone,
        website: apiSupplier.website,
        address: apiSupplier.address,
        city: firstAddress?.city || firstAddress?.departament || 'Lima',
        country: 'Perú', // Valor por defecto
        contactPerson: contactPersonStr,
        contactEmail: apiSupplier.contactEmail,
        contactPhone: apiSupplier.contactPhone,
        businessType: apiSupplier.businessType,
        personType: apiSupplier.personType,
        status: statusMap[apiSupplier.status] || 'P',
        rating: apiSupplier.rating,
        totalOrders: apiSupplier.totalOrders,
        totalAmount: apiSupplier.totalAmount,
        paymentTerms: apiSupplier.paymentTerms,
        certifications: certifications,
        registrationDate: apiSupplier.registrationDate || '',
        lastOrderDate: apiSupplier.lastOrderDate || '',
        avatar: apiSupplier.avatar,
        generalManager: apiSupplier.generalManager,
        adminManager: apiSupplier.adminManager,
        salesManager: apiSupplier.salesManager,
    };
    
    return storeSupplier;
};

