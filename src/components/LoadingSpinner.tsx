import { FC } from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ message = "Cargando..." }) => {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-rojo/20 border-t-rojo mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">{message}</p>
            </div>
        </div>
    );
};


