import {Link} from 'react-router-dom';
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

export default UnauthorizedHome;