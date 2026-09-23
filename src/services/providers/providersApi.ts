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
    cod_direccion: string;
    departamento: string;
    direccion: string;
    distrito: string;
    nro_linea: string;
    provincia: string;
    ubigeo  : string;
}

export interface Contacto {
    active: string;
    apellido: string;
    doc_entry: string;
    e_mail_l: string;
    name: string;
    nombre: string;
    profesion: string;
    segundo_nombre: string;
    telefono: string;
}

export interface Banco {
    banco: string;
    cuenta: string;
    sectorista: string;
}

export interface DocumentoEvaluacion {
    doc_entry: string;
    u_card_code: string;
    u_documento_evaluacion: string;
    u_link_documento: string;
    u_nomb_docu: string;
    u_observacion: string;
    u_status: string;
    u_type_archiv: string;
}
export interface SupplierApiRecord {
    doc_entry?: string;
    codigo_sn: string;
    nombre_sn: string;
    ruc: string;
    tipo_persona: string;
    cod_tipo_persona?: string;
    moneda: string;
    telefono1: string;
    telefono2: string;
    telefono_movil: string;
    correo: string;
    tipo_documento: string;
    cod_tipo_documeto?: string;
    direccion: string; // falta
    distrito: string;
    provincia: string;
    departamento: string;
    ubigeo: string;
    condicion_pago: string;
    cod_condicion_pago?: string;
    direccion_sunat: string;
    resolucion_agente_retencion: string;
    resolucion_agente_percepcion: string;
    website: string | null;
    create_date: string;
    update_date: string;
    status_contributer: string | null;
    status_domicilio: string | null;
    agente_percepcion: string;
    exo_percepcion: string;
    agente_retencion: string;
    good_contributor: string;
    economi_activity_sunat: string;
    status: string;
    approval_date: string;
    cover_image: string;
    avatar: string;
    general_manager: string;
    admin_manager: string;
    sales_manager: string,
    contactos: Contacto[];
    bancos: Banco[];
    direcciones: Direccion[];
    documento_evaluacion: DocumentoEvaluacion[];
    referencias_comerciales?: ReferenciaComercial[];
    ServiciosOfrecidos?: ServiciosOfrecidos[];
}

interface SuppliersApiResponse {
    status_code: number;
    success: boolean;
    message: string;
    data: SupplierApiRecord;
}

import { getApiBaseUrl } from "@/config/api.ts";


const DEFAULT_SUPPLIERS_API_BASE_URL = getApiBaseUrl();
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
    documento_evaluacion: (record.documento_evaluacion ?? []).map((doc) => ({
        ...doc,
        u_documento_evaluacion: normaliseDocumentoEvaluacionKey(doc.u_documento_evaluacion) ?? '',
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
        normaliseString(normalizedRecord['codigo_sn']) ||
        normaliseString(normalizedRecord.codigo_sn) ||
        normaliseString(normalizedRecord.nombre_sn) ||
        normaliseString(normalizedRecord.ruc);
    const cardName = normaliseString(normalizedRecord.nombre_sn);
    const email = normaliseString(normalizedRecord.correo);
    const phone = normaliseString(normalizedRecord.telefono1) +"-"+ normaliseString(normalizedRecord.telefono2);
    const mobile = normaliseString(normalizedRecord.telefono_movil);
    const currency = normaliseString(normalizedRecord.moneda);
    const website = normaliseString(normalizedRecord.website);
    const address = normaliseString(normalizedRecord.direccion) || normaliseString(normalizedRecord.direccion_sunat);
    const paymentTerms = normaliseString(normalizedRecord.condicion_pago);
    const personType = normaliseString(normalizedRecord.tipo_persona);
    const documentType = normaliseString(normalizedRecord.tipo_documento);
    const frontPage = normalizedRecord.cover_image && normalizedRecord.cover_image.trim() !== '' ? normalizedRecord.cover_image : 'https://static.vecteezy.com/system/resources/thumbnails/019/023/718/small/robotic-arm-industrial-png.png';

    const directions: Direction[] = (normalizedRecord.direcciones || []).map(direction =>({
        address: direction.direccion,
        type: direction.cod_direccion,
        departament: direction.departamento,
        province: direction.provincia,
        city: direction.distrito,
        ubigeo: normalizedRecord.ubigeo
    }))
    const persons: contactPerson[] = (normalizedRecord.contactos || []).map(contacto =>({
        name: contacto.nombre,
        email: contacto.e_mail_l,
        phone: '', // No viene de API
        active: contacto.active === 'Y',
        position: contacto.profesion
    }));
    const bankReferences: ReferenciaBancaria[] = (normalizedRecord.bancos || []).map(banco => ({
        bankName: banco.banco,
        accountNumber: banco.cuenta,
        phoneNumber: '',     // No viene en la API, asi que valor por defecto
        sectorista: banco.sectorista || '',
        address: '',         // No viene en la API
        swiftCode: '',       // No viene en la API
        iban: '',            // No viene en la API
        accountType: '',     // No viene en la API
        currency: '',        // No viene en la API
        registrationDate: undefined,
    }));
    const commercialReferences: ReferenciaComercial[] = (normalizedRecord.referencias_comerciales || []).map((ref) => ({
        doc_entry: ref.doc_entry || '',
        u_card_code: ref.u_card_code || '',
        u_razon_social: ref.u_razon_social || '',
        u_contacto: ref.u_contacto || '',
        u_telefonos: ref.u_telefonos || '',
        registrationDate: undefined,
    }));
    const serviciosOfrecidos: ServiciosOfrecidos[] = (normalizedRecord.ServiciosOfrecidos || []).map((serv) => ({
        principalActivity: serv.principalActivity,
        serviceLine: serv.serviceLine,
        paymentTerms: serv.paymentTerms,
    }));

    const documents = createDefaultDocuments({
        certificaciones: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'certificaciones') ?? false,
        referenciasBancarias: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'referenciasBancarias') ?? false,
        vigenciaPoder: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'vigenciaPoder') ?? false,
        matrizIperc: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'matrizIperc') ?? false,
        licenciaMunicipal: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'licenciaMunicipal') ?? false,
        historialPrecios: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'historialPrecios') ?? false,
        fichaRuc: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'fichaRuc') ?? false,
        referenciasComerciales: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'referenciasComerciales') ?? false,
        condicionesPago: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'condicionesPago') ?? false,
        matrizAmbiental: normalizedRecord.documento_evaluacion?.some(doc => doc.u_documento_evaluacion === 'matrizAmbiental') ?? false,
    });

    const createdAt = normaliseString(normalizedRecord.create_date);
    const updatedAt = normaliseString(normalizedRecord.update_date);
    const supplier: Supplier = {
        docEntry: cardCode || generateSupplierId(),
        RUC: normalizedRecord.ruc,
        cardCode,
        cardName,
        email,
        phone,
        cellPhone: mobile,
        currency,
        website,
        address,
        taxPayerCategory: normaliseString(normalizedRecord.status_contributer),
        businessType: personType || 'Proveedor',
        personType,
        documentType,
        agenteRetencion: toBooleanFlag(normalizedRecord.agente_retencion),
        agentePercepcion: toBooleanFlag(normalizedRecord.agente_percepcion),
        exoneradoPercepcion: toBooleanFlag(normalizedRecord.exo_percepcion),
        goodContributor: normalizedRecord.good_contributor === "Y",
        emisorFacElectronica: true,
        estado: normaliseString(normalizedRecord.status_domicilio),
        condicion: normaliseString(normalizedRecord.status_contributer),
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
        avatar: normalizedRecord.avatar,
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
    const baseUrl = DEFAULT_SUPPLIERS_API_BASE_URL;

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
    status_code: number;
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

    // Primero parsear el JSON para verificar el status_code
    let json;
    try {
        json = await response.json();
    } catch (error) {
        throw new Error('No se pudo parsear la respuesta del servidor.');
    }

    // Verificar si hay un error en el status_code (cualquier código >= 400 o status_code en el JSON)
    if (!response.ok || (json.status_code && json.status_code >= 400)) {
        const errorMessage = json.message || `Error al crear el proveedor (${json.status_code || response.status})`;
        throw new Error(errorMessage);
    }

    // Si la respuesta es exitosa pero no tiene data, intentar refrescar
    let record = Array.isArray(json.data) ? json.data[0] : json.data;

    if (!record || typeof record === 'string') {
        const supplierId = typeof json.data === 'string' && json.data ? json.data : payload.codigo_sn;
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

