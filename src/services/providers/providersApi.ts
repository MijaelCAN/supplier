import type {contactPerson, ReferenciaBancaria, ReferenciaComercial, ServiciosOfrecidos, Supplier} from '@/store/types';

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
    U_CardCode: string;
    U_DocumentoEvaluacion: string;
    U_LinkDocumento: string;
    U_NombDocu: string;
    U_Status: string;
    U_typeArchiv: string;
}

export interface SupplierApiRecord {
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
    Contactos: Contacto[];
    Bancos: Banco[];
    DocumentoEvaluacion: DocumentoEvaluacion[];
    ReferenciasComerciales?: {
        name: string;
        contact: string;
        phone: string;
    }[];
    ServiciosOfrecidos?: {
        principalActivity: string;
        serviceLine: string;
        paymentTerms: string;
    }[];
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

const toBooleanFlag = (value?: string) => value?.toUpperCase() === 'Y';

const normaliseString = (value?: string) => (value ?? '').trim();

export const createDefaultDocuments = (overrides?: Partial<Supplier['Documentos']>): Supplier['Documentos'] => ({
    certificacionISO: false,
    referenciasBancarias: false,
    vigenciaPoder: false,
    matrizIPERC: false,
    licenciaMuni: false,
    historicoPrecios: false,
    fichaRuc: false,
    referenciasComerciales: false,
    condicionesPago: false,
    matrizAAmbientales: false,
    ...overrides
}) as unknown as Supplier['Documentos'];

const generateSupplierId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `supplier-${Math.random().toString(36).slice(2, 11)}`;
};

const mapApiRecordToSupplier = (record: SupplierApiRecord): Supplier => {
    const cardCode =
        normaliseString(record['CodigoSN']) ||
        normaliseString(record.CodigoSN) ||
        //normaliseString(record.CardCode) ||
        normaliseString(record.RUC);

    const cardName = normaliseString(record.NombreSN);
    const email = normaliseString(record.Correo);
    const phone = normaliseString(record.Telefono1) || normaliseString(record.Telefono2);
    const mobile = normaliseString(record.TelefonoMovil);
    const currency = normaliseString(record.Moneda);
    const website = normaliseString(record.website);
    const address = normaliseString(record.Direccion) || normaliseString(record.DireccionSUNAT);
    const district = normaliseString(record.Distrito);
    const province = normaliseString(record.Provincia);
    const department = normaliseString(record.Departamento);
    const ubigeo = normaliseString(record.Ubigeo);
    const paymentTerms = normaliseString(record.CondicionPago);
    const personType = normaliseString(record.TipoPersona);
    const documentType = normaliseString(record.TipoDocumento);
    const persons: contactPerson[] = (record.Contactos || []).map(contacto =>({
        name: contacto.Name,
        email: contacto.E_MailL,
        phone: '', // No viene de API
        active: contacto.Active === 'Y',
        position: contacto.Profesion
    }));
    const bankReferences: ReferenciaBancaria[] = (record.Bancos || []).map(banco => ({
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
    const commercialReferences: ReferenciaComercial[] = (record.ReferenciasComerciales || []).map((ref) => ({
        name: ref.name,
        contact: ref.contact,
        phone: ref.phone,
    }));
    const serviciosOfrecidos: ServiciosOfrecidos[] = (record.ServiciosOfrecidos || []).map((serv) => ({
        principalActivity: serv.principalActivity,
        serviceLine: serv.serviceLine,
        paymentTerms: serv.paymentTerms,
    }));

    const documents = createDefaultDocuments({
        certificacionISO: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'certificacionISO') ?? false,
        referenciasBancarias: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'referenciasBancarias') ?? false,
        vigenciaPoder: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'vigenciaPoder') ?? false,
        matrizIPERC: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'matrizIPERC') ?? false,
        licenciaMuni: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'licenciaMuni') ?? false,
        historicoPrecios: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'historicoPrecios') ?? false,
        fichaRuc: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'fichaRuc') ?? false,
        referenciasComerciales: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'referenciasComerciales') ?? false,
        condicionesPago: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'condicionesPago') ?? false,
        matrizAAmbientales: record.DocumentoEvaluacion?.some(doc => doc.U_DocumentoEvaluacion === 'matrizAAmbientales') ?? false,
    });

    const createdAt = normaliseString(record.createDate);
    const updatedAt = normaliseString(record.updateDate);

    const supplier: Supplier = {
        docEntry: cardCode || generateSupplierId(),
        cardCode,
        cardName,
        email,
        phone,
        cellPhone: mobile,
        currency,
        website,
        address,
        taxPayerCategory: normaliseString(record.statusContributer),
        businessType: personType || 'Proveedor',
        personType,
        documentType,
        agenteRetencion: toBooleanFlag(record.agenteRetencion),
        agentePercepcion: toBooleanFlag(record.agentePercepcion),
        exoneradoPercepcion: toBooleanFlag(record.exoPercepcion),
        registradoMype: false,
        emisorFacElectronica: true,
        estado: normaliseString(record.statusDomicilio),
        condicion: normaliseString(record.statusContributer),
        status: 'Activo',
        approvalDate: updatedAt || '',
        rejectionReason: [],
        rating: 0,
        totalOrders: 0,
        totalAmount: 0,
        paymentTerms,
        registrationDate: createdAt || '',
        lastOrderDate: '',
        lastProfileUpdate: updatedAt || createdAt || '',
        coverImage: '',
        avatar: email ? `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}` : '',
        generalManager: '',
        adminManager: '',
        salesManager: '',
        addresses: [
            {
                address,
                type: 'Principal',
                departament: department,
                province,
                city: district,
                ubigeo,
            },
        ],
        contactPerson: persons,
        contactEmail: email,
        contactPhone: phone || mobile,
        listaContactos: [
            {
                name: cardName || 'Contacto principal',
                email,
                phone: phone || mobile,
            },
        ],
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

    const separator = baseUrl.endsWith('/') ? '' : '/';
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
const handleResponse = async (response: Response): Promise<SuppliersApiResponse> => {
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

    return json;
};


const fetchSupplierResponse = async (
    cardCode?: string,
    init?: RequestInit,
): Promise<SuppliersApiResponse> => {
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
    return mapApiRecordToSupplier(json.data);
};

export const fetchSupplierByCardCode = async (
    cardCode: string,
): Promise<{ supplier: Supplier; record: SupplierApiRecord } | null> => {
    if (!cardCode) {
        return null;
    }

    const json = await fetchSupplierResponse(cardCode);

    return {
        supplier: mapApiRecordToSupplier(json.data),
        record: json.data,
    };
};

export const updateSupplierProfile = async (
    payload: SupplierApiRecord,
): Promise<{ supplier: Supplier; record: SupplierApiRecord }> => {
    const json = await fetchSupplierResponse(undefined, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

    return {
        supplier: mapApiRecordToSupplier(json.data),
        record: json.data,
    };
};

