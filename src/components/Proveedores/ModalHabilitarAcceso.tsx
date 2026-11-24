// Habilitar acceso al portal de un proveedor o empleado que ya existe en SAP (TCK-001333).
// Si ya tenía acceso, el backend restablece la contraseña. Muestra las credenciales y permite enviarlas por correo.
import { FC, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Tab,
    Tabs,
    addToast,
} from '@heroui/react';
import { ClipboardDocumentIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/routes/menuTypes';
import { useAuthStore } from '@/store/authStore';
import type { RoleType } from '@/services/auth/apiAuth';
import {
    habilitarAcceso,
    HabilitarAccesoResult,
    ROLES_INTERNOS,
    validarDocumento,
} from '@/services/auth/accessApi';
import { sendSupplierCredentials } from '@/services/email/emailApi';

const ROL_LABEL: Record<string, string> = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.COMPRAS]: 'Compras',
    [UserRole.FINANZAS]: 'Finanzas',
    [UserRole.CONTABILIDAD]: 'Contabilidad',
    [UserRole.ALMACEN]: 'Almacén',
    [UserRole.CALIDAD]: 'Calidad',
    [UserRole.SEGURIDAD]: 'Seguridad',
    [UserRole.PLANEAMIENTO]: 'Planeamiento',
    [UserRole.SOLICITANTE]: 'Solicitante',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ModalHabilitarAccesoProps {
    isOpen: boolean;
    onClose: () => void;
    /** RUC precargado (p. ej. desde la fila de un proveedor) */
    initialRuc?: string;
}

const ModalHabilitarAcceso: FC<ModalHabilitarAccesoProps> = ({ isOpen, onClose, initialRuc }) => {
    const currentUser = useAuthStore((state) => state.currentUser);
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const rolesDisponibles = useMemo(
        () => ROLES_INTERNOS.filter((rol) => rol !== UserRole.ADMIN || isAdmin),
        [isAdmin]
    );

    const [roleType, setRoleType] = useState<RoleType>('provider');
    const [documento, setDocumento] = useState('');
    const [rolInterno, setRolInterno] = useState<UserRole | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<HabilitarAccesoResult | null>(null);
    const [correo, setCorreo] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setRoleType('provider');
        setDocumento(initialRuc?.trim() ?? '');
        setRolInterno('');
        setError(null);
        setResult(null);
        setCorreo('');
        setEmailSent(false);
    }, [isOpen, initialRuc]);

    const handleRoleTypeChange = (key: RoleType) => {
        setRoleType(key);
        setDocumento('');
        setRolInterno('');
        setError(null);
    };

    const handleSubmit = async () => {
        setError(null);
        const errorDocumento = validarDocumento(documento, roleType);
        if (errorDocumento) {
            setError(errorDocumento);
            return;
        }
        if (roleType === 'internal' && !rolInterno) {
            setError('Selecciona el rol del usuario.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await habilitarAcceso({
                usuario: documento,
                roleType,
                rol: roleType === 'provider' ? UserRole.PROVEEDOR : (rolInterno as UserRole),
            });
            setResult(res);
            setCorreo(res.correo);
            addToast({
                title: res.yaExistia ? 'Contraseña restablecida' : 'Acceso habilitado',
                description: `${res.nombre || res.usuario}: ${res.message}`,
                color: 'success',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo habilitar el acceso.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        const texto = `Portal de Proveedores\nUsuario: ${result.usuario}\nContraseña: ${result.password}\n${window.location.origin}/login`;
        try {
            await navigator.clipboard.writeText(texto);
            addToast({ title: 'Copiado', description: 'Credenciales copiadas al portapapeles.', color: 'success' });
        } catch {
            addToast({ title: 'No se pudo copiar', description: 'Cópialas manualmente.', color: 'warning' });
        }
    };

    const handleSendEmail = async () => {
        if (!result) return;
        const to = correo.trim();
        if (!EMAIL_REGEX.test(to)) {
            addToast({ title: 'Correo inválido', description: 'Revisa el correo de destino.', color: 'warning' });
            return;
        }
        setIsSending(true);
        try {
            const emailResult = await sendSupplierCredentials({
                to,
                credentials: {
                    username: result.usuario,
                    password: result.password,
                    supplierName: result.nombre,
                    userFullName: result.nombre || result.usuario,
                    portalLink: `${window.location.origin}/login`,
                    isReset: result.yaExistia,
                },
            });
            if (emailResult.success) {
                setEmailSent(true);
                addToast({ title: 'Correo enviado', description: `Credenciales enviadas a ${to}.`, color: 'success' });
            } else {
                addToast({ title: 'No se pudo enviar el correo', description: emailResult.error || emailResult.message, color: 'danger' });
            }
        } finally {
            setIsSending(false);
        }
    };

    const documentoLabel = roleType === 'provider' ? 'RUC del proveedor' : 'DNI del colaborador';

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isDismissable={!isSubmitting && !isSending}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold">Habilitar acceso al portal</h3>
                            <p className="text-sm font-normal text-default-500">
                                Para proveedores o colaboradores que ya están registrados en SAP.
                            </p>
                        </ModalHeader>
                        <ModalBody>
                            {!result ? (
                                <div className="space-y-4">
                                    <Tabs
                                        aria-label="Tipo de usuario"
                                        selectedKey={roleType}
                                        onSelectionChange={(key) => handleRoleTypeChange(key as RoleType)}
                                        isDisabled={isSubmitting}
                                    >
                                        <Tab key="provider" title="Proveedor (RUC)" />
                                        <Tab key="internal" title="Interno (DNI)" />
                                    </Tabs>
                                    <Input
                                        label={documentoLabel}
                                        placeholder={roleType === 'provider' ? '20xxxxxxxxx' : 'xxxxxxxx'}
                                        value={documento}
                                        onValueChange={(v) => setDocumento(v.replace(/\D/g, ''))}
                                        maxLength={roleType === 'provider' ? 11 : 8}
                                        inputMode="numeric"
                                        isRequired
                                        isDisabled={isSubmitting}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') void handleSubmit();
                                        }}
                                    />
                                    {roleType === 'internal' && (
                                        <Select
                                            label="Rol en el portal"
                                            selectedKeys={rolInterno ? [rolInterno] : []}
                                            onSelectionChange={(keys) => setRolInterno((Array.from(keys)[0] as UserRole) ?? '')}
                                            isRequired
                                            isDisabled={isSubmitting}
                                        >
                                            {rolesDisponibles.map((rol) => (
                                                <SelectItem key={rol}>{ROL_LABEL[rol] ?? rol}</SelectItem>
                                            ))}
                                        </Select>
                                    )}
                                    <Alert
                                        color="warning"
                                        variant="flat"
                                        title="Si ya tiene acceso, se restablece su contraseña"
                                        description="La contraseña anterior deja de funcionar. Envíale las nuevas credenciales."
                                    />
                                    {error && <Alert color="danger" variant="flat" title={error} />}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Alert
                                        color={result.yaExistia ? 'warning' : 'success'}
                                        variant="flat"
                                        title={result.yaExistia ? 'El acceso ya existía: se restableció la contraseña' : 'Acceso habilitado'}
                                        description={result.yaExistia ? 'La contraseña anterior ya no funciona.' : undefined}
                                    />
                                    <div className="rounded-lg border border-default-200 p-4 space-y-2 text-sm">
                                        <p><span className="text-default-500">Nombre:</span> <strong>{result.nombre || '—'}</strong></p>
                                        <p><span className="text-default-500">Usuario:</span> <span className="font-mono">{result.usuario}</span></p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-default-500">Contraseña:</span>
                                            <span className="font-mono bg-default-100 px-2 py-0.5 rounded">{result.password}</span>
                                        </p>
                                        <p>
                                            <span className="text-default-500">Rol:</span>{' '}
                                            {result.roleType === 'provider' ? 'Proveedor' : ROL_LABEL[rolInterno] ?? rolInterno}
                                        </p>
                                    </div>
                                    <Button variant="flat" startContent={<ClipboardDocumentIcon className="h-4 w-4" />} onPress={handleCopy}>
                                        Copiar credenciales
                                    </Button>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                        <Input
                                            label="Enviar credenciales a"
                                            type="email"
                                            value={correo}
                                            onValueChange={setCorreo}
                                            description={result.correo ? 'Correo registrado en SAP' : 'No tiene correo en SAP: ingrésalo'}
                                            isDisabled={isSending}
                                        />
                                        <Button
                                            color="primary"
                                            startContent={<EnvelopeIcon className="h-4 w-4" />}
                                            onPress={handleSendEmail}
                                            isLoading={isSending}
                                            isDisabled={!correo.trim()}
                                            className="sm:mb-6"
                                        >
                                            {emailSent ? 'Reenviar' : 'Enviar'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={close} isDisabled={isSubmitting || isSending}>
                                {result ? 'Cerrar' : 'Cancelar'}
                            </Button>
                            {!result && (
                                <Button
                                    color="primary"
                                    startContent={!isSubmitting ? <KeyIcon className="h-4 w-4" /> : undefined}
                                    onPress={handleSubmit}
                                    isLoading={isSubmitting}
                                >
                                    Habilitar acceso
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export { ModalHabilitarAcceso };
