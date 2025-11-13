import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import type { UserRole } from '@/routes/menuTypes';
import { db } from '@/lib/firebase';

export type RoleType = 'internal' | 'provider';

export interface FirestoreUserDocument {
    username: string;
    email: string;
    user_code: string;
    user_name: string;
    role: UserRole;
    role_type: RoleType;
    department?: string;
    position?: string;
    phone?: string;
    avatar?: string;
    supplier_id?: string;
    account_status: 'active' | 'inactive' | 'suspended';
    use_supplier_portal?: boolean;
    settings?: Record<string, boolean>;
    last_login?: Timestamp;
    passwordHash?: string;
    password?: string;
    created_at?: Timestamp;
}

export interface PortalUser {
    id: string;
    username: string;
    email: string;
    userCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    roleType: RoleType;
    department?: string;
    position?: string;
    phone?: string;
    avatar?: string;
    supplierId?: string;
    accountStatus: 'active' | 'inactive' | 'suspended';
    useSupplierPortal: boolean;
    settings: Record<string, boolean>;
    lastLogin?: string;
}

export type AuthErrorCode =
    | 'MISSING_FIELDS'
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_INACTIVE'
    | 'USER_NOT_FOUND'
    | 'UNKNOWN';

export class AuthError extends Error {
    constructor(
        public readonly code: AuthErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export interface LoginPayload {
    username: string;
    password: string;
    roleType: RoleType;
}

export interface LoginSuccess {
    token: string;
    user: PortalUser;
}

const USERS_COLLECTION = 'users';

const isBcryptHash = (value?: string): value is string => {
    if (!value) {
        return false;
    }

    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
};

const normalizeName = (userName: string) => {
    const parts = userName.trim().split(' ');
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

const sanitizeUser = (id: string, data: FirestoreUserDocument): PortalUser => {
    const { firstName, lastName } = normalizeName(data.user_name ?? data.username ?? '');

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
        supplierId: data.supplier_id,
        accountStatus: data.account_status,
        useSupplierPortal: Boolean(data.use_supplier_portal),
        settings: data.settings ?? {},
        lastLogin: data.last_login?.toDate().toISOString(),
    };
};

const generateClientToken = (user: PortalUser): string => {
    const tokenPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        roleType: user.roleType,
        issuedAt: Date.now(),
    };

    return btoa(JSON.stringify(tokenPayload));
};

const validatePassword = async (candidate: string, stored?: string): Promise<boolean> => {
    if (!stored) {
        return false;
    }

    if (isBcryptHash(stored)) {
        const { compare } = await import('bcryptjs');
        return compare(candidate, stored);
    }

    return candidate === stored;
};

export const loginWithFirestore = async (
    payload: LoginPayload,
): Promise<LoginSuccess> => {
    const { username, password, roleType } = payload;

    if (!username || !password || !roleType) {
        throw new AuthError(
            'MISSING_FIELDS',
            "Los campos 'username', 'password' y 'role_type' son obligatorios.",
        );
    }

    const usersRef = collection(db, USERS_COLLECTION);
    const loginQuery = query(
        usersRef,
        where('username', '==', username.trim().toLowerCase()),
        where('role_type', '==', roleType),
        limit(1),
    );

    const snapshot = await getDocs(loginQuery);

    if (snapshot.empty) {
        throw new AuthError('USER_NOT_FOUND', 'Credenciales de acceso incorrectas.');
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as FirestoreUserDocument;

    if (data.account_status !== 'active') {
        throw new AuthError('ACCOUNT_INACTIVE', 'Su cuenta está inactiva. Contacte con el administrador.');
    }

    const passwordIsValid = await validatePassword(password, data.passwordHash ?? data.password);

    if (!passwordIsValid) {
        throw new AuthError('INVALID_CREDENTIALS', 'Credenciales de acceso incorrectas.');
    }

    const user = sanitizeUser(docSnap.id, data);

    await updateDoc(doc(db, USERS_COLLECTION, docSnap.id), {
        last_login: serverTimestamp(),
    });

    const token = generateClientToken(user);

    return {
        token,
        user,
    };
};

export interface CreateSupplierUserPayload {
    username: string;
    email: string;
    userCode: string;
    userName: string;
    supplierId: string;
    tempPassword: string;
    companyName?: string;
    phone?: string;
    avatar?: string;
    useSupplierPortal?: boolean;
    accountStatus?: 'active' | 'inactive' | 'suspended';
    role?: UserRole;
}

export const createSupplierUserDocument = async (
    payload: CreateSupplierUserPayload,
): Promise<void> => {
    const {
        username,
        email,
        userCode,
        userName,
        supplierId,
        tempPassword,
        companyName,
        phone,
        avatar,
        useSupplierPortal,
        accountStatus,
        role,
    } = payload;

    const { hash } = await import('bcryptjs');

    const hashedPassword = await hash(tempPassword, 10);

    const usersRef = collection(db, USERS_COLLECTION);

    await addDoc(usersRef, {
        username: username.trim().toLowerCase(),
        email,
        user_code: userCode,
        user_name: userName,
        role: role ?? 'proveedor',
        role_type: 'provider',
        phone: phone ?? '',
        avatar: avatar ?? `https://i.pravatar.cc/150?u=${email}`,
        supplier_id: supplierId,
        account_status: accountStatus ?? 'active',
        use_supplier_portal: useSupplierPortal ?? true,
        settings: {
            view_providers: true,
            view_visits: true,
            upload_delivery_docs: true,
            upload_invoices: true,
        },
        passwordHash: hashedPassword,
        last_login: null,
        company: companyName ?? '',
        created_at: serverTimestamp(),
    });
};

export const findUserByUsername = async (
    username: string,
): Promise<{ id: string; data: FirestoreUserDocument } | null> => {
    if (!username) {
        return null;
    }

    const usersRef = collection(db, USERS_COLLECTION);
    const userQuery = query(
        usersRef,
        where('username', '==', username.trim().toLowerCase()),
        limit(1),
    );

    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
        return null;
    }

    const docSnap = snapshot.docs[0];
    return {
        id: docSnap.id,
        data: docSnap.data() as FirestoreUserDocument,
    };
};

export const updateUserPassword = async (
    userId: string,
    newPassword: string,
): Promise<void> => {
    const { hash } = await import('bcryptjs');
    const hashedPassword = await hash(newPassword, 10);

    const userRef = doc(db, USERS_COLLECTION, userId);

    await updateDoc(userRef, {
        passwordHash: hashedPassword,
        password: null,
        updated_at: serverTimestamp(),
    });
};

