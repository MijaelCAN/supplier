import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Divider,
    Avatar,
    Chip
} from "@heroui/react";
import {
    UserIcon,
    LockClosedIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    CreditCardIcon,
    ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { useAuth } from '@/store/extendedStore';

const LoginPage = () => {
    const navigate = useNavigate();
    const { users, setCurrentUser } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!selectedUserId) return;

        setIsLoading(true);
        
        // Simular delay de autenticación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = users.find(u => u.id === selectedUserId);
        if (user) {
            setCurrentUser(user);
            
            // Redirigir según el rol del usuario
            switch (user.role) {
                case 'admin':
                    navigate('/dashboard');
                    break;
                case 'proveedor':
                    navigate('/proveedor/perfil');
                    break;
                case 'compras':
                    navigate('/orden-compra');
                    break;
                case 'finanzas':
                    navigate('/finanzas/pagos');
                    break;
                default:
                    navigate('/dashboard');
            }
        }
        
        setIsLoading(false);
    };

    const getRoleInfo = (role: string) => {
        switch (role) {
            case 'admin':
                return {
                    label: 'Administrador',
                    color: 'danger' as const,
                    icon: <ShieldCheckIcon className="h-4 w-4" />
                };
            case 'compras':
                return {
                    label: 'Compras',
                    color: 'primary' as const,
                    icon: <UserGroupIcon className="h-4 w-4" />
                };
            case 'finanzas':
                return {
                    label: 'Finanzas',
                    color: 'success' as const,
                    icon: <CreditCardIcon className="h-4 w-4" />
                };
            case 'proveedor':
                return {
                    label: 'Proveedor',
                    color: 'warning' as const,
                    icon: <BuildingOfficeIcon className="h-4 w-4" />
                };
            default:
                return {
                    label: role,
                    color: 'default' as const,
                    icon: <UserIcon className="h-4 w-4" />
                };
        }
    };

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="w-full">
                    <CardHeader className="flex flex-col gap-3 pb-6">
                        <div className="flex items-center justify-center">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Portal de Proveedores</h1>
                            <p className="text-gray-600">Accede a tu cuenta para gestionar proveedores</p>
                        </div>
                    </CardHeader>
                    
                    <CardBody className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800">Selecciona un Usuario de Demostración</h2>
                            
                            <Select
                                label="Usuario"
                                placeholder="Selecciona un usuario para iniciar sesión"
                                selectedKeys={selectedUserId ? [selectedUserId] : []}
                                onSelectionChange={(keys) => setSelectedUserId(Array.from(keys)[0] as string)}
                                startContent={<UserIcon className="h-4 w-4" />}
                            >
                                {users.filter(u => u.isActive).map(user => {
                                    const roleInfo = getRoleInfo(user.role);
                                    return (
                                        <SelectItem 
                                            key={user.id} 
                                            value={user.id}
                                            startContent={
                                                <Avatar 
                                                    src={user.avatar} 
                                                    name={`${user.firstName} ${user.lastName}`}
                                                    size="sm"
                                                />
                                            }
                                            endContent={
                                                <Chip 
                                                    size="sm" 
                                                    color={roleInfo.color} 
                                                    variant="flat"
                                                    startContent={roleInfo.icon}
                                                >
                                                    {roleInfo.label}
                                                </Chip>
                                            }
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.firstName} {user.lastName}</span>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                                <span className="text-xs text-gray-400">{user.department} - {user.position}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </Select>

                            {selectedUser && (
                                <Card className="bg-gray-50">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar 
                                                src={selectedUser.avatar} 
                                                name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                                                size="md"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                                                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Chip 
                                                        size="sm" 
                                                        color={getRoleInfo(selectedUser.role).color} 
                                                        variant="flat"
                                                        startContent={getRoleInfo(selectedUser.role).icon}
                                                    >
                                                        {getRoleInfo(selectedUser.role).label}
                                                    </Chip>
                                                    <span className="text-xs text-gray-500">
                                                        {selectedUser.department}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </div>

                        <Divider />

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700">Credenciales de Demostración</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-100 rounded-full flex items-center justify-center">
                                        <ShieldCheckIcon className="h-2 w-2 text-red-600" />
                                    </div>
                                    <span>Admin: Acceso completo</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                                        <UserGroupIcon className="h-2 w-2 text-blue-600" />
                                    </div>
                                    <span>Compras: Órdenes y proveedores</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                                        <CreditCardIcon className="h-2 w-2 text-green-600" />
                                    </div>
                                    <span>Finanzas: Facturas y pagos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <BuildingOfficeIcon className="h-2 w-2 text-yellow-600" />
                                    </div>
                                    <span>Proveedor: Vista limitada</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            color="primary"
                            size="lg"
                            className="w-full"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            isDisabled={!selectedUserId}
                            startContent={!isLoading && <LockClosedIcon className="h-4 w-4" />}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                Esta es una demostración del portal de proveedores.
                                <br />
                                Selecciona cualquier usuario para explorar el sistema.
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
