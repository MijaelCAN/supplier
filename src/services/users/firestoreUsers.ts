import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreUserDocument, RoleType } from '@/services/auth/firestoreAuth';
import { UserRole } from '@/routes/menuTypes';

const USERS_COLLECTION = 'users';

export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface ManagedUser {
    id: string;
    username: string;
    email: string;
    userCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    department?: string;
    position?: string;
    phone?: string;
    avatar?: string;
    supplierId?: string | null;
    accountStatus: AccountStatus;
    useSupplierPortal: boolean;
    settings: Record<string, boolean>;
    roleType: RoleType;
    lastLogin?: string;
    createdAt?: string;
}

export interface CreateManagedUserPayload {
    username: string;
    password: string;
    roleType: RoleType;
    role: UserRole;
    email: string;
    userCode: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    phone?: string;
    avatar?: string;
    supplierId?: string | null;
    useSupplierPortal: boolean;
    settings: Record<string, boolean>;
    accountStatus: AccountStatus;
}

export interface UpdateManagedUserPayload {
    username?: string;
    password?: string;
    roleType?: RoleType;
    role?: UserRole;
    email?: string;
    userCode?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    position?: string;
    phone?: string;
    avatar?: string;
    supplierId?: string | null;
    useSupplierPortal?: boolean;
    settings?: Record<string, boolean>;
    accountStatus?: AccountStatus;
}

const normalizeName = (firstName?: string, lastName?: string, fallback?: string) => {
    if (firstName || lastName) {
        return `${firstName ?? ''} ${lastName ?? ''}`.replace(/\s+/g, ' ').trim();
    }

    return fallback ?? '';
};

const splitName = (fullName?: string) => {
    if (!fullName) {
        return {
            firstName: '',
            lastName: '',
        };
    }

    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return {
            firstName: parts[0],
            lastName: '',
        };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
};

const toIsoString = (value?: Timestamp | null): string | undefined => {
    if (!value) {
        return undefined;
    }

    try {
        return value.toDate().toISOString();
    } catch (error) {
        console.warn('No se pudo convertir Timestamp a ISO string.', error);
        return undefined;
    }
};

const sanitizeSettings = (settings?: Record<string, boolean>): Record<string, boolean> => {
    if (!settings) {
        return {};
    }

    return Object.entries(settings).reduce<Record<string, boolean>>((acc, [key, value]) => {
        acc[key] = Boolean(value);
        return acc;
    }, {});
};

const mapDocToManagedUser = (id: string, data: FirestoreUserDocument): ManagedUser => {
    const { firstName, lastName } = splitName(data.user_name ?? data.username);

    return {
        id,
        username: data.username,
        email: data.email,
        userCode: data.user_code,
        firstName,
        lastName,
        fullName: data.user_name ?? `${firstName} ${lastName}`.trim(),
        role: data.role,
        roleType: data.role_type,
        department: data.department,
        position: data.position,
        phone: data.phone,
        avatar: data.avatar,
        supplierId: data.supplier_id ?? null,
        accountStatus: data.account_status,
        useSupplierPortal: Boolean(data.use_supplier_portal),
        settings: sanitizeSettings(data.settings),
        lastLogin: toIsoString(data.last_login ?? null),
        createdAt: toIsoString(data.created_at ?? null),
    };
};

const ensureUniqueUsername = async (username: string, roleType: RoleType, excludeId?: string) => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
        usersRef,
        where('username', '==', username),
        where('role_type', '==', roleType),
        limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return;
    }

    if (excludeId && snapshot.docs[0].id === excludeId) {
        return;
    }

    throw new Error('Ya existe un usuario con el mismo nombre y tipo de rol.');
};

export const listManagedUsers = async (): Promise<ManagedUser[]> => {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));

    return snapshot.docs
        .map((document) => mapDocToManagedUser(document.id, document.data() as FirestoreUserDocument))
        .sort((a, b) => a.userCode.localeCompare(b.userCode, 'es'));
};

const buildFirestorePayload = (
    payload: Partial<CreateManagedUserPayload & UpdateManagedUserPayload>,
) => {
    const document: Partial<FirestoreUserDocument> & {
        use_supplier_portal?: boolean;
        supplier_id?: string | null;
        account_status?: AccountStatus;
        settings?: Record<string, boolean>;
    } = {};

    if (payload.username !== undefined) {
        document.username = payload.username.trim().toLowerCase();
    }

    if (payload.roleType !== undefined) {
        document.role_type = payload.roleType;
    }

    if (payload.role !== undefined) {
        document.role = payload.role;
    }

    if (payload.email !== undefined) {
        document.email = payload.email.trim().toLowerCase();
    }

    if (payload.userCode !== undefined) {
        document.user_code = payload.userCode.trim();
    }

    if (
        payload.firstName !== undefined ||
        payload.lastName !== undefined ||
        payload.username !== undefined
    ) {
        document.user_name = normalizeName(
            payload.firstName,
            payload.lastName,
            payload.username,
        );
    }

    if (payload.department !== undefined) {
        document.department = payload.department;
    }

    if (payload.position !== undefined) {
        document.position = payload.position;
    }

    if (payload.phone !== undefined) {
        document.phone = payload.phone;
    }

    if (payload.avatar !== undefined) {
        document.avatar = payload.avatar;
    }

    if (payload.useSupplierPortal !== undefined) {
        document.use_supplier_portal = payload.useSupplierPortal;
    }

    if (payload.settings !== undefined) {
        document.settings = { ...payload.settings };
    }

    if (payload.accountStatus !== undefined) {
        document.account_status = payload.accountStatus;
    }

    /*if (payload.roleType === 'provider') {
        document.supplier_id = payload.supplierId ?? null;
    } else if (payload.supplierId !== undefined) {
        document.supplier_id = payload.supplierId ?? null;
    }*/

    return document;
};

export const createManagedUser = async (
    payload: CreateManagedUserPayload,
): Promise<ManagedUser> => {
    const username = payload.username.trim().toLowerCase();
    const email = payload.email.trim().toLowerCase();
    const userCode = payload.userCode.trim();

    await ensureUniqueUsername(username, payload.roleType);

    const firestorePayload = buildFirestorePayload({
        ...payload,
        username,
        email,
        userCode,
    });

    const { hash } = await import('bcryptjs');
    const passwordHash = await hash(payload.password, 10);

    const usersRef = collection(db, USERS_COLLECTION);
    const docRef = await addDoc(usersRef, {
        ...firestorePayload,
        passwordHash,
        last_login: null,
        created_at: serverTimestamp(),
    });

    const saved = await getDoc(docRef);

    return mapDocToManagedUser(docRef.id, saved.data() as FirestoreUserDocument);
};

export const updateManagedUser = async (
    id: string,
    payload: UpdateManagedUserPayload,
): Promise<ManagedUser> => {
    const docRef = doc(db, USERS_COLLECTION, id);

    if (payload.username || payload.roleType) {
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
            throw new Error('El usuario que intenta actualizar no existe.');
        }

        const data = snapshot.data() as FirestoreUserDocument;

        await ensureUniqueUsername(
            (payload.username ?? data.username).trim().toLowerCase(),
            payload.roleType ?? data.role_type,
            id,
        );
    }

    const updatePayload = buildFirestorePayload(payload);

    if (payload.password) {
        const { hash } = await import('bcryptjs');
        updatePayload.passwordHash = await hash(payload.password, 10);
    }

    await updateDoc(docRef, updatePayload);

    const updated = await getDoc(docRef);

    return mapDocToManagedUser(id, updated.data() as FirestoreUserDocument);
};

export const deleteManagedUser = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, USERS_COLLECTION, id));
};

