/*import {Link} from 'react-router-dom';
import {Button, Card, CardBody, CardFooter, CardHeader} from "@heroui/react";

const UnauthorizedHome = () => {

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-danger">Acceso No Autorizado</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        No se ha detectado un rol válido para tu usuario
                    </p>
                </CardHeader>

                <CardBody className="py-6">
                    <div className="flex flex-col gap-4">
                        <p className="text-default-600">
                            Para acceder al sistema necesitas tener un rol definido.
                            Contacta al administrador si crees que esto es un error.
                        </p>
                    </div>
                </CardBody>

                <CardFooter className="flex justify-between">
                    <Button
                        as={Link}
                        to="/login"
                        color="primary"
                        variant="solid"
                    >
                        Volver al Login
                    </Button>

                    <Button
                        as={Link}
                        to="/contact"
                        color="default"
                        variant="light"
                    >
                        Contactar Soporte
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
*/

import { Link } from 'react-router-dom';
import { Button, Card, CardBody, CardFooter, CardHeader, Chip } from "@heroui/react";
import { ShieldExclamationIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const UnauthorizedHome = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-danger-100/20 dark:bg-danger-900/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100/20 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
            </div>

            <Card className="max-w-lg w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50 relative z-10">
                <CardHeader className="flex flex-col gap-4 pb-6 pt-8 px-8">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-danger-500/20 dark:bg-danger-500/30 rounded-full blur-xl"></div>
                            <div className="relative bg-danger-100 dark:bg-danger-900/40 p-5 rounded-full">
                                <ShieldExclamationIcon className="w-12 h-12 text-danger-600 dark:text-danger-400" strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                        <Chip 
                            color="danger" 
                            variant="flat" 
                            size="sm"
                            className="mb-2"
                        >
                            Error 403
                        </Chip>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Acceso No Autorizado
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-base">
                            No se ha detectado un rol válido para tu cuenta
                        </p>
                    </div>
                </CardHeader>

                <CardBody className="px-8 py-6">
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-danger-500 rounded-full"></span>
                                ¿Por qué veo este mensaje?
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>Tu cuenta no tiene un rol asignado en el sistema</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>Los permisos de tu cuenta pueden estar pendientes de configuración</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-400 mt-1">•</span>
                                    <span>Es posible que tu rol haya sido revocado recientemente</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-5 border border-primary-200 dark:border-primary-800">
                            <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                                <EnvelopeIcon className="w-4 h-4" />
                                ¿Necesitas ayuda?
                            </h3>
                            <p className="text-sm text-primary-800 dark:text-primary-200">
                                Contacta al administrador del sistema para solicitar la asignación de un rol apropiado para tu cuenta.
                            </p>
                        </div>
                    </div>
                </CardBody>

                <CardFooter className="flex flex-col sm:flex-row gap-3 px-8 pb-8 pt-4">
                    <Button
                        as={Link}
                        to="/login"
                        color="primary"
                        variant="solid"
                        className="w-full sm:w-auto font-medium"
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                        Volver al Login
                    </Button>

                    <Button
                        as={Link}
                        to="/contact"
                        color="default"
                        variant="bordered"
                        className="w-full sm:w-auto font-medium"
                        startContent={<EnvelopeIcon className="w-4 h-4" />}
                    >
                        Contactar Soporte
                    </Button>
                </CardFooter>
            </Card>

            <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500 dark:text-gray-600 z-10">
                Si el problema persiste, comunícate con el equipo de soporte técnico
            </div>
        </div>
    );
};

export default UnauthorizedHome;