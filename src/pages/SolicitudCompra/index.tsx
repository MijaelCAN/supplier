import Dashboard from "@/layouts/Dashboard";

const SolicitudCompra = () => {
    return (
        <Dashboard>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Solicitud de Compra</h1>
                    <p className="text-gray-600">Gestiona las solicitudes de Compra para tu Área</p>
                </div>
            </div>
        </Dashboard>
    )
}

export {
    SolicitudCompra
}