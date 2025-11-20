import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Selection } from '@react-types/shared';
import {
    addToast,
    Alert,
    Avatar,
    Button,
    Card,
    CardBody,
    Checkbox,
    CheckboxGroup,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Pagination,
    Select,
    SelectItem,
    Spinner,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    ToastProvider,
    useDisclosure,
} from '@heroui/react';
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
    KeyIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Dashboard from '@/layouts/Dashboard';
import {
    AccountStatus,
    createManagedUser,
    deleteManagedUser,
    listManagedUsers,
    ManagedUser,
    updateManagedUser,
} from '@/services/users/firestoreUsers';
import { RoleType } from '@/services/auth/firestoreAuth';
import { UserRole } from '@/routes/menuTypes';
import { useAuthStore } from '@/store/authStore';
import { useExtendedStore } from '@/store/extendedStore';

const toastPlacement = 'bottom-right' as const;

const ROLE_LABELS: Record<UserRole, { label: string; color: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'default' }> = {
    [UserRole.ADMIN]: { label: 'Administrador', color: 'danger' },
    [UserRole.PROVEEDOR]: { label: 'Proveedor', color: 'warning' },
    [UserRole.COMPRAS]: { label: 'Compras', color: 'primary' },
    [UserRole.FINANZAS]: { label: 'Finanzas', color: 'success' },
    [UserRole.SOLICITANTE]: { label: 'Solicitante', color: 'secondary' },
    [UserRole.CALIDAD]: { label: 'Calidad', color: 'secondary' },
    [UserRole.ALMACEN]: { label: 'Almacén', color: 'warning' },
    [UserRole.SEGURIDAD]: { label: 'Seguridad', color: 'default' },
};

const SETTINGS_CATALOG = [
    { key: 'edit_profile', label: 'Editar perfil' },
    { key: 'view_providers', label: 'Ver proveedores' },
    { key: 'validate_providers', label: 'Validar proveedores' },
    { key: 'schedule_visits', label: 'Programar visitas' },
    { key: 'view_visits', label: 'Ver visitas' },
    { key: 'confirm_availability', label: 'Confirmar disponibilidad' },
    { key: 'upload_delivery_docs', label: 'Subir guías de entrega' },
    { key: 'validate_entry', label: 'Validar ingreso' },
    { key: 'approve_quality', label: 'Aprobar calidad' },
    { key: 'register_reception', label: 'Registrar recepción' },
    { key: 'upload_invoices', label: 'Subir facturas' },
    { key: 'validate_documents', label: 'Validar documentos' },
    { key: 'schedule_payments', label: 'Programar pagos' },
    { key: 'create_bids', label: 'Crear licitaciones' },
    { key: 'participate_bids', label: 'Participar en licitaciones' },
    { key: 'evaluate_providers', label: 'Evaluar proveedores' },
    { key: 'system_config', label: 'Configuración del sistema' },
];

const ALL_SETTINGS_KEYS = SETTINGS_CATALOG.map((item) => item.key);

const DEFAULT_SETTINGS_BY_ROLE: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: ALL_SETTINGS_KEYS,
    [UserRole.COMPRAS]: [
        'view_providers',
        'validate_providers',
        'schedule_visits',
        'view_visits',
        'confirm_availability',
        'create_bids',
        'participate_bids',
        'evaluate_providers',
    ],
    [UserRole.FINANZAS]: ['upload_invoices', 'validate_documents', 'schedule_payments'],
    [UserRole.PROVEEDOR]: [
        'edit_profile',
        'view_visits',
        'confirm_availability',
        'upload_delivery_docs',
        'upload_invoices',
        'participate_bids',
    ],
    [UserRole.ALMACEN]: ['validate_entry', 'approve_quality', 'register_reception'],
    [UserRole.SEGURIDAD]: ['validate_entry', 'confirm_availability', 'view_visits'],
    [UserRole.SOLICITANTE]: ['schedule_visits', 'view_visits', 'create_bids'],
    [UserRole.CALIDAD]: ['approve_quality', 'evaluate_providers'],
};

const inferRoleType = (role: UserRole): RoleType => (role === UserRole.PROVEEDOR ? 'provider' : 'internal');

const mapSettingsArrayToRecord = (selected: string[]): Record<string, boolean> =>
    SETTINGS_CATALOG.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.key] = selected.includes(item.key);
        return acc;
    }, {});

const recordToSettingsArray = (settings?: Record<string, boolean>): string[] =>
    Object.entries(settings ?? {})
        .filter(([, value]) => value)
        .map(([key]) => key);

const formatIsoDate = (iso?: string) => {
    if (!iso) {
        return 'Nunca';
    }

    try {
        const date = new Date(iso);
        return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (error) {
        console.warn('No se pudo formatear la fecha.', error);
        return iso;
    }
};

interface UserFormState {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    roleType: RoleType;
    accountStatus: AccountStatus;
    userCode: string;
    department: string;
    position: string;
    phone: string;
    avatar: string;
    supplierId: string;
    useSupplierPortal: boolean;
    settings: string[];
    tempPassword: string;
    confirmPassword: string;
}

const createInitialFormState = (): UserFormState => ({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: UserRole.COMPRAS,
    roleType: inferRoleType(UserRole.COMPRAS),
    accountStatus: 'active',
    userCode: '',
    department: '',
    position: '',
    phone: '',
    avatar: '',
    supplierId: '',
    useSupplierPortal: true,
    settings: [...(DEFAULT_SETTINGS_BY_ROLE[UserRole.COMPRAS] ?? [])],
    tempPassword: '',
    confirmPassword: '',
});

const UserManagement: React.FC = () => {
    const departments = useExtendedStore((state) => state.departments);
    const currentUser = useAuthStore((state) => state.currentUser);

    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [filterValue, setFilterValue] = useState('');
    const [roleFilter, setRoleFilter] = useState<Selection>(new Set(['all']));
    const [statusFilter, setStatusFilter] = useState<Selection>(new Set(['all']));
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const [formData, setFormData] = useState<UserFormState>(createInitialFormState);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

    const {
        isOpen: isDetailOpen,
        onOpen: onDetailOpen,
        onClose: onDetailClose,
        onOpenChange: onDetailOpenChange,
    } = useDisclosure();
    const {
        isOpen: isCreateOpen,
        onOpen: onCreateOpen,
        onClose: onCreateClose,
        onOpenChange: onCreateOpenChange,
    } = useDisclosure();
    const {
        isOpen: isEditOpen,
        onOpen: onEditOpen,
        onClose: onEditClose,
        onOpenChange: onEditOpenChange,
    } = useDisclosure();
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose,
        onOpenChange: onDeleteOpenChange,
    } = useDisclosure();

    const fetchUsers = useCallback(async () => {
        setIsFetching(true);
        setFetchError(null);

        try {
            const data = await listManagedUsers();
            setUsers(data);
        } catch (error) {
            console.error('No se pudo cargar la lista de usuarios.', error);
            setFetchError('No se pudo cargar la lista de usuarios.');
            addToast({
                title: 'Error',
                description: 'No se pudo cargar la lista de usuarios.',
                color: 'danger',
            });
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const roleFilterValue = useMemo(() => {
        if (roleFilter === 'all' || (roleFilter instanceof Set && roleFilter.size === 0)) {
            return 'all';
        }
        return Array.from(roleFilter as Set<string>)[0] as string;
    }, [roleFilter]);

    const statusFilterValue = useMemo(() => {
        if (statusFilter === 'all' || (statusFilter instanceof Set && statusFilter.size === 0)) {
            return 'all';
        }
        return Array.from(statusFilter as Set<string>)[0] as string;
    }, [statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [filterValue, roleFilterValue, statusFilterValue]);

    const filteredUsers = useMemo(() => {
        let data = users;

        if (filterValue.trim()) {
            const query = filterValue.trim().toLowerCase();
            data = data.filter((user) =>
                user.email.toLowerCase().includes(query) ||
                user.userCode.toLowerCase().includes(query) ||
                (user.department ?? '').toLowerCase().includes(query),
            );
        }

        if (roleFilterValue !== 'all') {
            data = data.filter((user) => user.role === roleFilterValue);
        }

        if (statusFilterValue !== 'all') {
            data = data.filter((user) => user.accountStatus === statusFilterValue);
        }

        return data;
    }, [users, filterValue, roleFilterValue, statusFilterValue]);

    const pages = filteredUsers.length === 0 ? 1 : Math.ceil(filteredUsers.length / rowsPerPage);

    useEffect(() => {
        if (page > pages) {
            setPage(pages);
        }
    }, [page, pages]);

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredUsers.slice(start, end);
    }, [filteredUsers, page, rowsPerPage]);

    const totalActiveUsers = users.filter((user) => user.accountStatus === 'active').length;
    const totalAdmins = users.filter((user) => user.role === UserRole.ADMIN).length;
    const totalProviders = users.filter((user) => user.role === UserRole.PROVEEDOR).length;

    const handleRoleChange = (role: UserRole) => {
        const nextRoleType = inferRoleType(role);
        const defaultSettings = DEFAULT_SETTINGS_BY_ROLE[role] ?? [];

        setFormData((prev) => ({
            ...prev,
            role,
            roleType: nextRoleType,
            settings: defaultSettings.length > 0 ? defaultSettings : prev.settings.filter((key) => ALL_SETTINGS_KEYS.includes(key)),
            supplierId: nextRoleType === 'provider' ? prev.supplierId : '',
            useSupplierPortal: nextRoleType === 'provider' ? true : prev.useSupplierPortal,
        }));
    };

    const handleRoleTypeChange = (roleType: RoleType) => {
        setFormData((prev) => ({
            ...prev,
            roleType,
            supplierId: roleType === 'provider' ? prev.supplierId : '',
            useSupplierPortal: roleType === 'provider' ? true : prev.useSupplierPortal,
        }));
    };

    const openCreateModal = () => {
        setFormData(createInitialFormState());
        setFormError(null);
        onCreateOpen();
    };

    const openEditModal = (user: ManagedUser) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            roleType: user.roleType,
            accountStatus: user.accountStatus,
            userCode: user.userCode,
            department: user.department ?? '',
            position: user.position ?? '',
            phone: user.phone ?? '',
            avatar: user.avatar ?? '',
            supplierId: user.supplierId ?? '',
            useSupplierPortal: user.useSupplierPortal,
            settings: recordToSettingsArray(user.settings),
            tempPassword: '',
            confirmPassword: '',
        });
        setFormError(null);
        onEditOpen();
    };

    const openDetailModal = (user: ManagedUser) => {
        setSelectedUser(user);
        onDetailOpen();
    };

    const openDeleteModal = (user: ManagedUser) => {
        setUserToDelete(user);
        onDeleteOpen();
    };

    const closeModalsAndResetForm = () => {
        setFormData(createInitialFormState());
        setFormError(null);
        setSelectedUser(null);
    };

    const isCreateMode = isCreateOpen && !isEditOpen;

    const handleSubmit = async () => {
        setFormError(null);

        if (!formData.username.trim() || !formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim() || !formData.userCode.trim()) {
            setFormError("Completa los campos obligatorios: usuario, correo, nombres, apellidos y código de usuario.");
            return;
        }

        if (formData.roleType === 'provider' && !formData.supplierId.trim()) {
            setFormError('El ID de proveedor es obligatorio para usuarios de tipo proveedor.');
            return;
        }

        if (isCreateMode && !formData.tempPassword) {
            setFormError('Debes asignar una contraseña temporal.');
            return;
        }

        if ((formData.tempPassword || formData.confirmPassword) && formData.tempPassword !== formData.confirmPassword) {
            setFormError('La contraseña y la confirmación deben coincidir.');
            return;
        }

        setIsSubmitting(true);

        const settingsRecord = mapSettingsArrayToRecord(formData.settings);

        try {
            if (isCreateMode) {
                const newUser = await createManagedUser({
                    username: formData.username.trim().toLowerCase(),
                    password: formData.tempPassword,
                    roleType: formData.roleType,
                    role: formData.role,
                    email: formData.email.trim().toLowerCase(),
                    userCode: formData.userCode.trim(),
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    department: formData.department || undefined,
                    position: formData.position || undefined,
                    phone: formData.phone || undefined,
                    avatar: formData.avatar || undefined,
                    supplierId: formData.roleType === 'provider' ? formData.supplierId.trim() || null : null,
                    useSupplierPortal: formData.useSupplierPortal,
                    settings: settingsRecord,
                    accountStatus: formData.accountStatus,
                });

                setUsers((prev) => [...prev, newUser].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')));

                addToast({
                    title: 'Usuario creado',
                    description: `Se creó el usuario ${newUser.fullName}.`,
                    color: 'success',
                });

                onCreateClose();
            } else if (selectedUser) {
                const updatedUser = await updateManagedUser(selectedUser.id, {
                    username: formData.username.trim().toLowerCase(),
                    roleType: formData.roleType,
                    role: formData.role,
                    email: formData.email.trim().toLowerCase(),
                    userCode: formData.userCode.trim(),
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    department: formData.department || undefined,
                    position: formData.position || undefined,
                    phone: formData.phone || undefined,
                    avatar: formData.avatar || undefined,
                    supplierId: formData.roleType === 'provider' ? formData.supplierId.trim() || null : null,
                    useSupplierPortal: formData.useSupplierPortal,
                    settings: settingsRecord,
                    accountStatus: formData.accountStatus,
                    password: formData.tempPassword ? formData.tempPassword : undefined,
                });

                setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)).sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')));

                addToast({
                    title: 'Usuario actualizado',
                    description: `Se actualizaron los datos de ${updatedUser.fullName}.`,
                    color: 'success',
                });

                onEditClose();
            }

            closeModalsAndResetForm();
        } catch (error) {
            console.error('No se pudo guardar el usuario.', error);
            setFormError(error instanceof Error ? error.message : 'No se pudo guardar el usuario.');
            addToast({
                title: 'Error',
                description: 'No se pudo guardar el usuario. Verifica los datos e inténtalo nuevamente.',
                color: 'danger',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleUserStatus = async (user: ManagedUser, isActive: boolean) => {
        setStatusChangingId(user.id);

        try {
            const updated = await updateManagedUser(user.id, {
                accountStatus: isActive ? 'active' : 'inactive',
            });

            setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));

            addToast({
                title: 'Estado actualizado',
                description: `${updated.fullName} ahora está ${updated.accountStatus === 'active' ? 'activo' : 'inactivo'}.`,
                color: 'success',
            });
        } catch (error) {
            console.error('No se pudo actualizar el estado del usuario.', error);
            addToast({
                title: 'Error',
                description: 'No se pudo actualizar el estado del usuario.',
                color: 'danger',
            });
        } finally {
            setStatusChangingId(null);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) {
            return;
        }

        setIsDeleting(true);

        try {
            await deleteManagedUser(userToDelete.id);
            setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
            addToast({
                title: 'Usuario eliminado',
                description: `${userToDelete.fullName} fue eliminado del sistema.`,
                color: 'success',
            });
            setUserToDelete(null);
            onDeleteClose();
        } catch (error) {
            console.error('No se pudo eliminar al usuario.', error);
            addToast({
                title: 'Error',
                description: 'No se pudo eliminar al usuario. Intenta nuevamente.',
                color: 'danger',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const renderTopContent = () => (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Input
                    isClearable
                    className="w-full sm:max-w-[380px]"
                    placeholder="Buscar por nombre, usuario, correo o código..."
                    startContent={<MagnifyingGlassIcon className="h-4 w-4" />}
                    value={filterValue}
                    onClear={() => setFilterValue('')}
                    onValueChange={setFilterValue}
                />
                <div className="flex flex-wrap gap-3">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="flat">
                                Rol
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Filtro por rol"
                            selectedKeys={roleFilter}
                            selectionMode="single"
                            onSelectionChange={(selection) => {
                                const value = Array.from(selection)[0] as string;
                                setRoleFilter(new Set([value]));
                            }}
                        >
                            {[
                                { key: "all", label: "Todos" },
                                ...Object.entries(ROLE_LABELS).map(([key, value]) => ({
                                    key,
                                    label: value.label
                                }))
                            ].map(status => (
                                <DropdownItem key={status.key}>{status.label}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="flat">
                                Estado
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Filtro por estado"
                            selectedKeys={statusFilter}
                            selectionMode="single"
                            onSelectionChange={(selection) => {
                                const value = Array.from(selection)[0] as string;
                                setStatusFilter(new Set([value]));
                            }}
                        >
                            <DropdownItem key="all">Todos</DropdownItem>
                            <DropdownItem key="active">Activos</DropdownItem>
                            <DropdownItem key="inactive">Inactivos</DropdownItem>
                            <DropdownItem key="suspended">Suspendidos</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    <Button
                        variant="flat"
                        color="secondary"
                        startContent={<ArrowPathIcon className="h-4 w-4" />}
                        onPress={fetchUsers}
                        isLoading={isFetching}
                    >
                        Actualizar
                    </Button>
                    <Button color="primary" endContent={<PlusIcon className="h-4 w-4" />} onPress={openCreateModal}>
                        Nuevo usuario
                    </Button>
                </div>
            </div>
            {fetchError && (
                <Alert color="warning" variant="flat" description={fetchError} />
            )}
        </div>
    );

    return (
        <Dashboard>
            <ToastProvider placement={toastPlacement} toastOffset={toastPlacement.includes('top') ? 60 : 0} />
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>
                    <p className="text-gray-600">
                        Administra las cuentas del portal, asigna roles, permisos y controla el acceso de forma centralizada.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <UserCircleIcon className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Total usuarios</p>
                                <p className="text-xl font-bold">{users.length}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <UserPlusIcon className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-500">Usuarios activos</p>
                                <p className="text-xl font-bold">{totalActiveUsers}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-500">Administradores</p>
                                <p className="text-xl font-bold">{totalAdmins}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <KeyIcon className="h-8 w-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-500">Proveedores activos</p>
                                <p className="text-xl font-bold">{totalProviders}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-4">
                        <Table
                            aria-label="Listado de usuarios"
                            topContent={renderTopContent()}
                            topContentPlacement="outside"
                            bottomContent={
                                filteredUsers.length > rowsPerPage ? (
                                    <div className="flex w-full justify-center px-6 py-4">
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
                                wrapper: 'min-h-[320px]',
                            }}
                        >
                            <TableHeader>
                                <TableColumn>Usuario</TableColumn>
                                <TableColumn>Rol</TableColumn>
                                <TableColumn>Departamento</TableColumn>
                                <TableColumn>Estado</TableColumn>
                                <TableColumn>Último acceso</TableColumn>
                                <TableColumn align="end">Acciones</TableColumn>
                            </TableHeader>
                            <TableBody
                                items={paginatedUsers}
                                isLoading={isFetching}
                                loadingContent={<Spinner label="Cargando usuarios..." />}
                                emptyContent={isFetching ? ' ' : 'No se encontraron usuarios con los filtros actuales.'}
                            >
                                {(user) => {
                                    const roleMeta = ROLE_LABELS[user.role] ?? {
                                        label: user.role,
                                        color: 'default' as const,
                                    };
                                    const isActive = user.accountStatus === 'active';

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.avatar}
                                                        name={user.fullName}
                                                        size="sm"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                                                        <span className="text-xs text-gray-500">{user.email}</span>
                                                        <span className="text-xs text-gray-400">@{user.username}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip color={roleMeta.color} size="sm" variant="flat">
                                                    {roleMeta.label}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900">{user.department || '—'}</span>
                                                    <span className="text-xs text-gray-500">{user.position || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        size="sm"
                                                        color="success"
                                                        isSelected={isActive}
                                                        onValueChange={(value) => handleToggleUserStatus(user, value)}
                                                        isDisabled={statusChangingId === user.id || user.id === currentUser?.id}
                                                    />
                                                    <span className="text-xs text-gray-600">
                                                        {user.accountStatus === 'active'
                                                            ? 'Activo'
                                                            : user.accountStatus === 'inactive'
                                                                ? 'Inactivo'
                                                                : 'Suspendido'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">{formatIsoDate(user.lastLogin)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    <Dropdown>
                                                        <DropdownTrigger>
                                                            <Button isIconOnly size="sm" variant="light">
                                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownTrigger>
                                                        <DropdownMenu aria-label="Acciones sobre el usuario">
                                                            <DropdownItem key="view" onPress={() => openDetailModal(user)}>
                                                                <div className="flex items-center gap-2">
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    Ver detalles
                                                                </div>
                                                            </DropdownItem>
                                                            <DropdownItem key="edit" onPress={() => openEditModal(user)}>
                                                                <div className="flex items-center gap-2">
                                                                    <PencilIcon className="h-4 w-4" />
                                                                    Editar
                                                                </div>
                                                            </DropdownItem>
                                                            {user.id !== currentUser?.id ? (
                                                                <DropdownItem
                                                                    key="delete"
                                                                    className="text-danger"
                                                                    onPress={() => openDeleteModal(user)}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <TrashIcon className="h-4 w-4" />
                                                                        Eliminar
                                                                    </div>
                                                                </DropdownItem>
                                                            ): null }
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                <Modal isOpen={isDetailOpen} onOpenChange={onDetailOpenChange} size="lg">
                    <ModalContent>
                        <ModalHeader>Detalle del usuario</ModalHeader>
                        <ModalBody>
                            {selectedUser && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar src={selectedUser.avatar} name={selectedUser.fullName} size="lg" />
                                        <div className="flex flex-col">
                                            <span className="text-lg font-semibold text-gray-900">{selectedUser.fullName}</span>
                                            <span className="text-sm text-gray-600">{selectedUser.email}</span>
                                            <span className="text-xs text-gray-500">@{selectedUser.username}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Rol</p>
                                            <Chip color={ROLE_LABELS[selectedUser.role]?.color ?? 'default'} size="sm" variant="flat">
                                                {ROLE_LABELS[selectedUser.role]?.label ?? selectedUser.role}
                                            </Chip>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Tipo de rol</p>
                                            <p className="text-sm text-gray-900">{selectedUser.roleType === 'internal' ? 'Interno' : 'Proveedor'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Estado</p>
                                            <Chip
                                                color={selectedUser.accountStatus === 'active' ? 'success' : selectedUser.accountStatus === 'inactive' ? 'warning' : 'danger'}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {selectedUser.accountStatus === 'active'
                                                    ? 'Activo'
                                                    : selectedUser.accountStatus === 'inactive'
                                                        ? 'Inactivo'
                                                        : 'Suspendido'}
                                            </Chip>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Código</p>
                                            <p className="text-sm text-gray-900">{selectedUser.userCode || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Departamento</p>
                                            <p className="text-sm text-gray-900">{selectedUser.department || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Posición</p>
                                            <p className="text-sm text-gray-900">{selectedUser.position || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Teléfono</p>
                                            <p className="text-sm text-gray-900">{selectedUser.phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Último acceso</p>
                                            <p className="text-sm text-gray-900">{formatIsoDate(selectedUser.lastLogin)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Creado</p>
                                            <p className="text-sm text-gray-900">{formatIsoDate(selectedUser.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Usa portal de proveedores</p>
                                            <Chip color={selectedUser.useSupplierPortal ? 'success' : 'default'} size="sm" variant="flat">
                                                {selectedUser.useSupplierPortal ? 'Sí' : 'No'}
                                            </Chip>
                                        </div>
                                        {selectedUser.supplierId && (
                                            <div>
                                                <p className="text-xs uppercase tracking-wide text-gray-500">ID proveedor</p>
                                                <p className="text-sm text-gray-900">{selectedUser.supplierId}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Permisos</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(selectedUser.settings)
                                                .filter(([, value]) => value)
                                                .map(([key]) => {
                                                    const catalog = SETTINGS_CATALOG.find((item) => item.key === key);
                                                    return (
                                                        <Chip key={key} color="primary" size="sm" variant="flat">
                                                            {catalog?.label ?? key}
                                                        </Chip>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onDetailClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <Modal
                    isOpen={isCreateOpen || isEditOpen}
                    onOpenChange={isCreateOpen ? onCreateOpenChange : onEditOpenChange}
                    size="2xl"
                >
                    <ModalContent>
                        <ModalHeader>{isCreateMode ? 'Crear nuevo usuario' : 'Editar usuario'}</ModalHeader>
                        <ModalBody>
                            {formError && <Alert color="danger" variant="flat" description={formError} />}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    label="Usuario"
                                    placeholder="jefe_compras_01"
                                    value={formData.username}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, username: value }))}
                                />
                                <Input
                                    label="Correo electrónico"
                                    type="email"
                                    placeholder="usuario@empresa.com"
                                    value={formData.email}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
                                />
                                <Input
                                    label="Nombres"
                                    value={formData.firstName}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, firstName: value }))}
                                />
                                <Input
                                    label="Apellidos"
                                    value={formData.lastName}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, lastName: value }))}
                                />
                                <Input
                                    label="Código de usuario"
                                    value={formData.userCode}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, userCode: value }))}
                                />
                                <Select
                                    label="Rol"
                                    selectedKeys={[formData.role]}
                                    onSelectionChange={(selection) => {
                                        const role = Array.from(selection)[0] as UserRole;
                                        handleRoleChange(role);
                                    }}
                                >
                                    {Object.entries(ROLE_LABELS).map(([key, value]) => (
                                        <SelectItem key={key}>
                                            {value.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Select
                                    label="Tipo de rol"
                                    selectedKeys={[formData.roleType]}
                                    onSelectionChange={(selection) => {
                                        const roleType = Array.from(selection)[0] as RoleType;
                                        handleRoleTypeChange(roleType);
                                    }}
                                    isDisabled={formData.role === UserRole.PROVEEDOR}
                                >
                                    <SelectItem key="internal">
                                        Interno
                                    </SelectItem>
                                    <SelectItem key="provider">
                                        Proveedor
                                    </SelectItem>
                                </Select>
                                <Select
                                    label="Estado"
                                    selectedKeys={[formData.accountStatus]}
                                    onSelectionChange={(selection) => {
                                        const status = Array.from(selection)[0] as AccountStatus;
                                        setFormData((prev) => ({ ...prev, accountStatus: status }));
                                    }}
                                >
                                    <SelectItem key="active">
                                        Activo
                                    </SelectItem>
                                    <SelectItem key="inactive">
                                        Inactivo
                                    </SelectItem>
                                    <SelectItem key="suspended">
                                        Suspendido
                                    </SelectItem>
                                </Select>
                                <Select
                                    label="Departamento"
                                    placeholder="Selecciona un departamento"
                                    selectedKeys={formData.department ? [formData.department] : []}
                                    onSelectionChange={(selection) => {
                                        const department = Array.from(selection)[0] as string;
                                        setFormData((prev) => ({ ...prev, department }));
                                    }}
                                >
                                    {departments.map((item) => (
                                        <SelectItem key={item.key} >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    label="Posición"
                                    placeholder="Cargo o función"
                                    value={formData.position}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, position: value }))}
                                />
                                <Input
                                    label="Teléfono"
                                    placeholder="+51 999 999 999"
                                    value={formData.phone}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))}
                                />
                                <Input
                                    label="Avatar"
                                    placeholder="https://..."
                                    value={formData.avatar}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, avatar: value }))}
                                />
                                {formData.roleType === 'provider' && (
                                    <Input
                                        label="ID de proveedor"
                                        placeholder="PROV-001"
                                        value={formData.supplierId}
                                        onValueChange={(value) => setFormData((prev) => ({ ...prev, supplierId: value }))}
                                    />
                                )}
                                <div className="flex items-center gap-3">
                                    <Switch
                                        isSelected={formData.useSupplierPortal}
                                        onValueChange={(value) => setFormData((prev) => ({ ...prev, useSupplierPortal: value }))}
                                        isDisabled={formData.roleType !== 'provider'}
                                    />
                                    <span className="text-sm text-gray-700">Acceso al portal de proveedores</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    label={isCreateMode ? 'Contraseña temporal' : 'Nueva contraseña'}
                                    type="password"
                                    placeholder={isCreateMode ? 'Ingresa una contraseña temporal' : 'Mantener actual'}
                                    value={formData.tempPassword}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tempPassword: value }))}
                                />
                                <Input
                                    label="Confirmar contraseña"
                                    type="password"
                                    placeholder={isCreateMode ? 'Repite la contraseña temporal' : 'Confirma si cambiaste la contraseña'}
                                    value={formData.confirmPassword}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-medium text-gray-700">Permisos adicionales</p>
                                <CheckboxGroup
                                    orientation="horizontal"
                                    value={formData.settings}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, settings: value }))}
                                >
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        {SETTINGS_CATALOG.map((item) => (
                                            <Checkbox key={item.key} value={item.key} size="sm">
                                                {item.label}
                                            </Checkbox>
                                        ))}
                                    </div>
                                </CheckboxGroup>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={() => {
                                    if (isCreateMode) {
                                        onCreateClose();
                                    } else {
                                        onEditClose();
                                    }
                                    closeModalsAndResetForm();
                                }}
                                isDisabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
                                {isCreateMode ? 'Crear usuario' : 'Guardar cambios'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
                    <ModalContent>
                        <ModalHeader>Eliminar usuario</ModalHeader>
                        <ModalBody>
                            <p>
                                ¿Seguro que deseas eliminar a{' '}
                                <span className="font-semibold">{userToDelete?.fullName}</span>? Esta acción no se puede deshacer.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onDeleteClose} isDisabled={isDeleting}>
                                Cancelar
                            </Button>
                            <Button color="danger" onPress={handleDeleteUser} isLoading={isDeleting}>
                                Eliminar usuario
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </Dashboard>
    );
};

export default UserManagement;
