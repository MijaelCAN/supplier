import React, { useState, useMemo } from 'react';
import {
    Button,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Pagination,
    Card,
    CardBody,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Switch,
    Avatar,
    CheckboxGroup,
    Checkbox
} from "@heroui/react";
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    UserPlusIcon,
    ChevronDownIcon,
    UserCircleIcon,
    ShieldCheckIcon,
    KeyIcon
} from "@heroicons/react/24/outline";
import Dashboard from "@/layouts/Dashboard";
import { useAuth, useExtendedStore } from '@/store/extendedStore';
import { User } from '@/store/types';

const UserManagement = () => {
    const { users, currentUser } = useAuth();
    const addUser = useExtendedStore(state => state.addUser);
    const updateUser = useExtendedStore(state => state.updateUser);
    const deleteUser = useExtendedStore(state => state.deleteUser);
    const departments = useExtendedStore(state => state.departments);

    const [filterValue, setFilterValue] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Modales
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
    const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

    // Estado para formularios
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'compras' as 'admin' | 'proveedor' | 'compras' | 'finanzas',
        department: '',
        position: '',
        isActive: true,
        permissions: [] as string[]
    });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const roles = [
        { key: 'admin', label: 'Administrador', color: 'danger' },
        { key: 'compras', label: 'Compras', color: 'primary' },
        { key: 'finanzas', label: 'Finanzas', color: 'success' },
        { key: 'proveedor', label: 'Proveedor', color: 'warning' }
    ];

    const allPermissions = [
        { key: 'suppliers', label: 'Gestión de Proveedores' },
        { key: 'orders', label: 'Órdenes de Compra' },
        { key: 'invoices', label: 'Facturas' },
        { key: 'payments', label: 'Pagos' },
        { key: 'reports', label: 'Reportes' },
        { key: 'evaluations', label: 'Evaluaciones' },
        { key: 'homologations', label: 'Homologaciones' },
        { key: 'users', label: 'Gestión de Usuarios' },
        { key: 'config', label: 'Configuración del Sistema' }
    ];

    const filteredUsers = useMemo(() => {
        let filtered = users;

        if (filterValue) {
            filtered = filtered.filter(user =>
                user.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
                user.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
                user.email.toLowerCase().includes(filterValue.toLowerCase()) ||
                user.username.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        if (roleFilter !== "all") {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        if (statusFilter !== "all") {
            const isActive = statusFilter === "active";
            filtered = filtered.filter(user => user.isActive === isActive);
        }

        return filtered;
    }, [users, filterValue, roleFilter, statusFilter]);

    const pages = Math.ceil(filteredUsers.length / rowsPerPage);
    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredUsers.slice(start, end);
    }, [page, filteredUsers, rowsPerPage]);

    const getRoleColor = (role: string) => {
        const roleConfig = roles.find(r => r.key === role);
        return roleConfig?.color || 'default';
    };

    const getRoleLabel = (role: string) => {
        const roleConfig = roles.find(r => r.key === role);
        return roleConfig?.label || role;
    };

    const getDefaultPermissions = (role: string) => {
        switch (role) {
            case 'admin':
                return allPermissions.map(p => p.key);
            case 'compras':
                return ['suppliers', 'orders', 'evaluations', 'homologations', 'reports'];
            case 'finanzas':
                return ['invoices', 'payments', 'reports'];
            case 'proveedor':
                return ['orders', 'invoices'];
            default:
                return [];
        }
    };

    const handleCreateUser = () => {
        if (!formData.username || !formData.email || !formData.firstName || !formData.lastName) {
            return;
        }

        const newUser: Omit<User, 'id'> = {
            ...formData,
            createdDate: new Date().toISOString().split('T')[0],
            permissions: formData.permissions.length > 0 ? formData.permissions : getDefaultPermissions(formData.role)
        };

        addUser(newUser);
        resetForm();
        onCreateOpenChange();
    };

    const handleEditUser = () => {
        if (selectedUser && formData.username && formData.email && formData.firstName && formData.lastName) {
            updateUser(selectedUser.id, {
                ...formData,
                permissions: formData.permissions.length > 0 ? formData.permissions : getDefaultPermissions(formData.role)
            });
            resetForm();
            setSelectedUser(null);
            onEditOpenChange();
        }
    };

    const handleDeleteUser = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
            onDeleteOpenChange();
        }
    };

    const handleToggleUserStatus = (userId: string, isActive: boolean) => {
        updateUser(userId, { isActive });
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            role: 'compras',
            department: '',
            position: '',
            isActive: true,
            permissions: []
        });
    };

    const openCreateModal = () => {
        resetForm();
        onCreateOpen();
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            position: user.position,
            isActive: user.isActive,
            permissions: user.permissions || []
        });
        onEditOpen();
    };

    const openDetailModal = (user: User) => {
        setSelectedUser(user);
        onDetailOpen();
    };

    const openDeleteModal = (user: User) => {
        setUserToDelete(user);
        onDeleteOpen();
    };

    const topContent = (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Buscar usuarios..."
                    startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                />
                <div className="flex gap-3">
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="flat">
                                Rol
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Filtros de rol"
                            closeOnSelect={false}
                            selectedKeys={roleFilter}
                            selectionMode="single"
                            onSelectionChange={(selection) => setRoleFilter(Array.from(selection)[0] as string)}
                        >
                            <DropdownItem key="all">Todos</DropdownItem>
                            {roles.map(role => (
                                <DropdownItem key={role.key}>{role.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="flat">
                                Estado
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Filtros de estado"
                            closeOnSelect={false}
                            selectedKeys={statusFilter}
                            selectionMode="single"
                            onSelectionChange={(selection) => setStatusFilter(Array.from(selection)[0] as string)}
                        >
                            <DropdownItem key="all">Todos</DropdownItem>
                            <DropdownItem key="active">Activos</DropdownItem>
                            <DropdownItem key="inactive">Inactivos</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <Button color="primary" endContent={<PlusIcon className="h-4 w-4" />} onPress={openCreateModal}>
                        Nuevo Usuario
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-600">Administra los usuarios del sistema y sus permisos</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <UserCircleIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total Usuarios</p>
                                <p className="text-xl font-bold">{users.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <UserPlusIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Usuarios Activos</p>
                                <p className="text-xl font-bold">{users.filter(u => u.isActive).length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-500">Administradores</p>
                                <p className="text-xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex flex-row items-center gap-4">
                            <KeyIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-500">Proveedores</p>
                                <p className="text-xl font-bold">{users.filter(u => u.role === 'proveedor').length}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-0">
                        <Table
                            aria-label="Tabla de usuarios"
                            topContent={topContent}
                            topContentPlacement="outside"
                            bottomContent={
                                pages > 0 ? (
                                    <div className="flex w-full justify-center">
                                        <Pagination
                                            isCompact
                                            showControls
                                            showShadow
                                            color="primary"
                                            page={page}
                                            total={pages}
                                            onChange={setPage}
                                        />
                                    </div>
                                ) : null
                            }
                            classNames={{
                                wrapper: "min-h-[222px]",
                            }}
                        >
                            <TableHeader>
                                <TableColumn>USUARIO</TableColumn>
                                <TableColumn>ROL</TableColumn>
                                <TableColumn>DEPARTAMENTO</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn>ÚLTIMO ACCESO</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {items.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={user.avatar}
                                                    name={`${user.firstName} ${user.lastName}`}
                                                    size="sm"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                    <p className="text-xs text-gray-400">@{user.username}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                className="capitalize" 
                                                color={getRoleColor(user.role) as any} 
                                                size="sm" 
                                                variant="flat"
                                            >
                                                {getRoleLabel(user.role)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <p className="text-sm">{user.department}</p>
                                                <p className="text-xs text-gray-500">{user.position}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    isSelected={user.isActive}
                                                    size="sm"
                                                    color="success"
                                                    onValueChange={(isActive) => handleToggleUserStatus(user.id, isActive)}
                                                    isDisabled={user.id === currentUser?.id}
                                                />
                                                <span className="text-xs text-gray-500">
                                                    {user.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-gray-500">
                                                {user.lastLogin ? user.lastLogin : 'Nunca'}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative flex justify-end items-center gap-2">
                                                <Dropdown>
                                                    <DropdownTrigger>
                                                        <Button isIconOnly size="sm" variant="light">
                                                            <EllipsisVerticalIcon className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu>
                                                        <DropdownItem onPress={() => openDetailModal(user)}>
                                                            <div className="flex items-center gap-2">
                                                                <EyeIcon className="h-4 w-4" />
                                                                Ver detalles
                                                            </div>
                                                        </DropdownItem>
                                                        <DropdownItem onPress={() => openEditModal(user)}>
                                                            <div className="flex items-center gap-2">
                                                                <PencilIcon className="h-4 w-4" />
                                                                Editar
                                                            </div>
                                                        </DropdownItem>
                                                        {user.id !== currentUser?.id && (
                                                            <DropdownItem 
                                                                onPress={() => openDeleteModal(user)}
                                                                className="text-danger"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <TrashIcon className="h-4 w-4" />
                                                                    Eliminar
                                                                </div>
                                                            </DropdownItem>
                                                        )}
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Modal de Detalles */}
                <Modal 
                    isOpen={isDetailOpen} 
                    onOpenChange={onDetailOpenChange}
                    size="lg"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h3>Detalles del Usuario</h3>
                                </ModalHeader>
                                <ModalBody>
                                    {selectedUser && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    src={selectedUser.avatar}
                                                    name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                                                    size="lg"
                                                />
                                                <div>
                                                    <h4 className="text-lg font-bold">
                                                        {selectedUser.firstName} {selectedUser.lastName}
                                                    </h4>
                                                    <p className="text-gray-500">{selectedUser.email}</p>
                                                    <p className="text-sm text-gray-400">@{selectedUser.username}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Rol</p>
                                                    <Chip 
                                                        color={getRoleColor(selectedUser.role) as any} 
                                                        variant="flat"
                                                    >
                                                        {getRoleLabel(selectedUser.role)}
                                                    </Chip>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Estado</p>
                                                    <Chip 
                                                        color={selectedUser.isActive ? 'success' : 'danger'} 
                                                        variant="flat"
                                                    >
                                                        {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                                                    </Chip>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Departamento</p>
                                                    <p className="text-sm">{selectedUser.department}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Posición</p>
                                                    <p className="text-sm">{selectedUser.position}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
                                                    <p className="text-sm">{selectedUser.createdDate}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Último Acceso</p>
                                                    <p className="text-sm">{selectedUser.lastLogin || 'Nunca'}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500 mb-2">Permisos</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedUser.permissions.map(permission => {
                                                        const permissionInfo = allPermissions.find(p => p.key === permission);
                                                        return (
                                                            <Chip 
                                                                key={permission}
                                                                size="sm" 
                                                                variant="flat" 
                                                                color="primary"
                                                            >
                                                                {permissionInfo?.label || permission}
                                                            </Chip>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cerrar
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Modal de Crear/Editar Usuario */}
                <Modal 
                    isOpen={isCreateOpen || isEditOpen} 
                    onOpenChange={isCreateOpen ? onCreateOpenChange : onEditOpenChange}
                    size="2xl"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>{isCreateOpen ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Nombre de Usuario"
                                            placeholder="username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                username: e.target.value
                                            })}
                                        />
                                        <Input
                                            label="Email"
                                            type="email"
                                            placeholder="usuario@empresa.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                email: e.target.value
                                            })}
                                        />
                                        <Input
                                            label="Nombres"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                firstName: e.target.value
                                            })}
                                        />
                                        <Input
                                            label="Apellidos"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                lastName: e.target.value
                                            })}
                                        />
                                        <Select
                                            label="Rol"
                                            selectedKeys={[formData.role]}
                                            onSelectionChange={(keys) => {
                                                const role = Array.from(keys)[0] as 'admin' | 'proveedor' | 'compras' | 'finanzas';
                                                setFormData({
                                                    ...formData,
                                                    role,
                                                    permissions: getDefaultPermissions(role)
                                                });
                                            }}
                                        >
                                            {roles.map(role => (
                                                <SelectItem key={role.key} value={role.key}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            label="Departamento"
                                            placeholder="Seleccionar departamento"
                                            selectedKeys={formData.department ? [formData.department] : []}
                                            onSelectionChange={(keys) => 
                                                setFormData({
                                                    ...formData,
                                                    department: Array.from(keys)[0] as string
                                                })
                                            }
                                        >
                                            {departments.map(dept => (
                                                <SelectItem key={dept.key} value={dept.key}>
                                                    {dept.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Input
                                            label="Posición"
                                            placeholder="Cargo o posición"
                                            value={formData.position}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                position: e.target.value
                                            })}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                isSelected={formData.isActive}
                                                onValueChange={(isActive) => setFormData({
                                                    ...formData,
                                                    isActive
                                                })}
                                            />
                                            <span className="text-sm">Usuario activo</span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Permisos</p>
                                        <CheckboxGroup
                                            value={formData.permissions}
                                            onValueChange={(permissions) => setFormData({
                                                ...formData,
                                                permissions
                                            })}
                                        >
                                            <div className="grid grid-cols-2 gap-2">
                                                {allPermissions.map(permission => (
                                                    <Checkbox 
                                                        key={permission.key} 
                                                        value={permission.key}
                                                        size="sm"
                                                    >
                                                        {permission.label}
                                                    </Checkbox>
                                                ))}
                                            </div>
                                        </CheckboxGroup>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        color="primary" 
                                        onPress={isCreateOpen ? handleCreateUser : handleEditUser}
                                    >
                                        {isCreateOpen ? 'Crear Usuario' : 'Guardar Cambios'}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* Modal de Eliminar */}
                <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3>Confirmar Eliminación</h3>
                                </ModalHeader>
                                <ModalBody>
                                    <p>¿Está seguro que desea eliminar al usuario <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?</p>
                                    <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button color="danger" onPress={handleDeleteUser}>
                                        Eliminar Usuario
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </Dashboard>
    );
};

export default UserManagement;
