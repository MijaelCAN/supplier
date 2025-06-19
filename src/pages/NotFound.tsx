import React from 'react';
import { Button } from "@heroui/react";
import { HomeIcon } from "@heroicons/react/24/outline";
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h1 className="text-9xl font-bold text-gray-200">404</h1>
                    <h2 className="text-3xl font-bold text-gray-900 mt-4">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-600 mt-4 text-lg">
                        Lo sentimos, la página que buscas no existe o ha sido movida.
                    </p>
                    <div className="mt-8">
                        <Button
                            color="primary"
                            size="lg"
                            startContent={<HomeIcon className="h-5 w-5" />}
                            onPress={() => navigate('/')}
                        >
                            Volver al inicio
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
