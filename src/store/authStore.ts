import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole } from '@/routes/menuTypes'

// Tipos para autenticación
export interface User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
    supplierId?: string; // Para usuarios proveedores
    isActive: boolean;
}

// Usuarios estáticos para demostración
const staticUsers: User[] = [
    {
        id: '1',
        email: 'admin@vistony.com',
        password: 'admin123',
        firstName: 'Juan',
        lastName: 'Administrador',
        role: UserRole.ADMIN,
        avatar: 'https://i.pravatar.cc/150?u=admin',
        isActive: true
    },
    {
        id: '2',
        email: 'compras@vistony.com',
        password: 'compras123',
        firstName: 'María',
        lastName: 'Compras',
        role: UserRole.COMPRAS,
        avatar: 'https://i.pravatar.cc/150?u=compras',
        isActive: true
    },
    {
        id: '3',
        email: 'finanzas@vistony.com',
        password: 'finanzas123',
        firstName: 'Carlos',
        lastName: 'Finanzas',
        role: UserRole.FINANZAS,
        avatar: 'https://i.pravatar.cc/150?u=finanzas',
        isActive: true
    },
    {
        id: '4',
        email: 'proveedor@techcorp.com',
        password: 'proveedor123',
        firstName: 'Ana',
        lastName: 'Proveedor',
        role: UserRole.PROVEEDOR,
        avatar: 'https://i.pravatar.cc/150?u=proveedor',
        supplierId: '1', // Relacionado con el primer proveedor del store
        isActive: true
    }
];

interface AuthState {
    currentUser: User | null;
    isAuthenticated: boolean;
    users: User[];
    
    // Acciones
    login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
    logout: () => void;
    getCurrentUser: () => User | null;
    getUsersByRole: (role: UserRole) => User[];
    addUser: (userData: Omit<User, 'id'>) => User;
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            isAuthenticated: false,
            users: staticUsers,

            login: async (email: string, password: string) => {
                // Simular delay de autenticación
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const user = get().users.find(u => 
                    u.email === email && 
                    u.password === password && 
                    u.isActive
                );

                if (user) {
                    set({ 
                        currentUser: user, 
                        isAuthenticated: true 
                    });
                    
                    return { 
                        success: true, 
                        message: 'Login exitoso', 
                        user 
                    };
                } else {
                    return { 
                        success: false, 
                        message: 'Credenciales incorrectas o usuario inactivo' 
                    };
                }
            },

            logout: () => {
                set({ 
                    currentUser: null, 
                    isAuthenticated: false 
                });
            },

            getCurrentUser: () => {
                return get().currentUser;
            },

            getUsersByRole: (role: UserRole) => {
                return get().users.filter(u => u.role === role);
            },

            addUser: (userData) => {
                const newUser: User = {
                    ...userData,
                    id: Date.now().toString(),
                };
                
                set(state => ({
                    users: [...state.users, newUser]
                }));
                
                return newUser;
            },

            updateUser: (id: string, updates: Partial<User>) => {
                set(state => ({
                    users: state.users.map(user => 
                        user.id === id ? { ...user, ...updates } : user
                    ),
                    currentUser: state.currentUser?.id === id 
                        ? { ...state.currentUser, ...updates }
                        : state.currentUser
                }));
            },

            deleteUser: (id: string) => {
                set(state => ({
                    users: state.users.filter(user => user.id !== id),
                    currentUser: state.currentUser?.id === id ? null : state.currentUser,
                    isAuthenticated: state.currentUser?.id === id ? false : state.isAuthenticated
                }));
            },

            // Function to create a supplier user account
            createSupplierUser: (supplierData: { 
                email: string; 
                companyName: string; 
                contactPerson: string; 
                supplierId: string;
                tempPassword: string;
            }) => {
                const newUser: User = {
                    id: Date.now().toString(),
                    email: supplierData.email,
                    password: supplierData.tempPassword,
                    firstName: supplierData.contactPerson.split(' ')[0] || 'Usuario',
                    lastName: supplierData.contactPerson.split(' ').slice(1).join(' ') || 'Proveedor',
                    role: UserRole.PROVEEDOR,
                    avatar: `https://i.pravatar.cc/150?u=${supplierData.email}`,
                    supplierId: supplierData.supplierId,
                    isActive: true
                };
                
                set(state => ({
                    users: [...state.users, newUser]
                }));
                
                return newUser;
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ 
                currentUser: state.currentUser,
                isAuthenticated: state.isAuthenticated 
            }),
        }
    )
);

// Hook personalizado para acceso fácil a la autenticación
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
