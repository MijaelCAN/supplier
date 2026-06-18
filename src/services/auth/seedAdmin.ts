import {
    addDoc,
    collection,
    getDocs,
    limit,
    query,
    serverTimestamp,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const USERS_COLLECTION = 'users';
const ADMIN_USERNAME = 'admin_vistony';
const ADMIN_ROLE_TYPE = 'internal';
const ADMIN_ROLE = 'admin';
const SEED_FLAG_KEY = 'portal_seed_admin_created';
const DEFAULT_ADMIN_PASSWORD = 'Admin2025*';

const settings = {
    edit_profile: true,
    view_providers: true,
    validate_providers: true,
    schedule_visits: true,
    view_visits: true,
    confirm_availability: true,
    upload_delivery_docs: true,
    validate_entry: true,
    approve_quality: true,
    register_reception: true,
    upload_invoices: true,
    validate_documents: true,
    schedule_payments: true,
    create_bids: true,
    participate_bids: true,
    evaluate_providers: true,
    system_config: true,
} satisfies Record<string, boolean>;

const markSeeded = () => {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(SEED_FLAG_KEY, 'true');
        } catch (error) {
            console.warn('No se pudo registrar el estado de seed en localStorage.', error);
        }
    }
};

const hasLocalSeedFlag = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.localStorage.getItem(SEED_FLAG_KEY) === 'true';
    } catch (error) {
        console.warn('No se pudo leer el estado de seed en localStorage.', error);
        return false;
    }
};

let seedPromise: Promise<void> | null = null;

export const ensureAdminSeeded = (): Promise<void> => {
    if (seedPromise) {
        return seedPromise;
    }

    seedPromise = (async () => {
        try {
            if (hasLocalSeedFlag()) {
                return;
            }

            const usersRef = collection(db, USERS_COLLECTION);
            const existing = await getDocs(
                query(
                    usersRef,
                    where('username', '==', ADMIN_USERNAME),
                    where('role_type', '==', ADMIN_ROLE_TYPE),
                    limit(1),
                ),
            );

            if (!existing.empty) {
                markSeeded();
                return;
            }

            const { hash } = await import('bcryptjs');
            const passwordHash = await hash(DEFAULT_ADMIN_PASSWORD, 10);

            await addDoc(usersRef, {
                username: ADMIN_USERNAME,
                role_type: ADMIN_ROLE_TYPE,
                role: ADMIN_ROLE,
                email: 'admin@empresa.com',
                user_code: '3550',
                user_name: 'Laura Mendoza Torres',
                department: 'Almacén I&M',
                position: 'Supervisor de Recepción',
                phone: '963852741',
                avatar: 'https://i.pravatar.cc/150?u=admin',
                account_status: 'active',
                use_supplier_portal: true,
                passwordHash,
                settings,
                supplier_id: null,
                last_login: null,
                created_at: serverTimestamp(),
            });

            markSeeded();

            console.info(
                '[Firebase Seed] Usuario administrador creado. Usuario: admin_vistony, ' +
                `contraseña temporal: ${DEFAULT_ADMIN_PASSWORD}`,
            );
        } catch (error) {
            console.error('[Firebase Seed] No se pudo crear el usuario administrador inicial.', error);
        }
    })();

    return seedPromise;
};

export const resetAdminSeedFlag = () => {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.removeItem(SEED_FLAG_KEY);
        } catch (error) {
            console.warn('No se pudo limpiar el estado de seed en localStorage.', error);
        }
    }
    seedPromise = null;
};


