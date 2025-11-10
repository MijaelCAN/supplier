import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from '@/routes/menuTypes';
import {
    AuthError,
    AuthErrorCode,
    createSupplierUserDocument,
    LoginSuccess,
    loginWithFirestore,
    PortalUser,
} from '@/services/auth/firestoreAuth';

export type RoleType = 'internal' | 'provider';

export interface LoginResultSuccess {
    success: true;
    message: string;
    user: PortalUser;
    token: string;
}

export interface LoginResultError {
    success: false;
    message: string;
    code: AuthErrorCode;
}

export type LoginResult = LoginResultSuccess | LoginResultError;

interface AuthState {
    currentUser: PortalUser | null;
    isAuthenticated: boolean;
    sessionToken: string | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string, roleType: RoleType) => Promise<LoginResult>;
    logout: () => void;
    clearError: () => void;
    createSupplierUser: (supplierData: {
        email: string;
        companyName: string;
        contactPerson: string;
        supplierId: string;
        tempPassword: string;
    }) => Promise<void>;
}

const mapLoginSuccess = ({ token, user }: LoginSuccess): LoginResultSuccess => ({
    success: true,
    message: 'Login exitoso',
    user,
    token,
});

const mapAuthError = (error: AuthError | Error): LoginResultError => {
    if (error instanceof AuthError) {
        return {
            success: false,
            message: error.message,
            code: error.code,
        };
    }

    return {
        success: false,
        message: 'No se pudo completar el inicio de sesión. Intente nuevamente.',
        code: 'UNKNOWN',
    };
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            currentUser: null,
            isAuthenticated: false,
            sessionToken: null,
            isLoading: false,
            error: null,

            login: async (username: string, password: string, roleType: RoleType) => {
                set({ isLoading: true, error: null });

                try {
                    const result = await loginWithFirestore({
                        username,
                        password,
                        roleType,
                    });

                    const loginResult = mapLoginSuccess(result);

                    set({
                        currentUser: loginResult.user,
                        isAuthenticated: true,
                        sessionToken: loginResult.token,
                        isLoading: false,
                    });

                    return loginResult;
                } catch (error) {
                    const mappedError = mapAuthError(error as Error);
                    set({
                        error: mappedError.message,
                        isAuthenticated: false,
                        currentUser: null,
                        sessionToken: null,
                        isLoading: false,
                    });
                    return mappedError;
                }
            },

            logout: () => {
                set({
                    currentUser: null,
                    isAuthenticated: false,
                    sessionToken: null,
                    error: null,
                });
            },

            clearError: () => {
                set({ error: null });
            },

            createSupplierUser: async (supplierData) => {
                await createSupplierUserDocument(supplierData);
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                currentUser: state.currentUser,
                isAuthenticated: state.isAuthenticated,
                sessionToken: state.sessionToken,
            }),
        },
    ),
);

export const useAuth = () => {
    const store = useAuthStore();
    return {
        ...store,
        isAdmin: store.currentUser?.role === UserRole.ADMIN,
        isProveedor: store.currentUser?.role === UserRole.PROVEEDOR,
        isCompras: store.currentUser?.role === UserRole.COMPRAS,
        isFinanzas: store.currentUser?.role === UserRole.FINANZAS,
    };
};
