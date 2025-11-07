import React from 'react';

const GanttChart = () => {
    const sprints = [
        { id: 1, duration: 4 },
        { id: 2, duration: 2 },
        { id: 3, duration: 2 },
        { id: 4, duration: 2 },
        { id: 5, duration: 2 },
        { id: 6, duration: 2 }
    ];

    const tasks = [
        //{ name: 'Configuración Base del Proyecto', sprint: 1, duration: 0.5, category: 'Setup' },
        { name: 'Login y Recuperación de Contraseña', sprint: 1, duration: 1.5, category: 'Autenticación' },
        { name: 'Dashboard o Home Principal para cada Rol', sprint: 1, duration: 1, category: 'Core' },
        { name: 'Perfil de Proveedor', sprint: 2, duration: 1, category: 'Core' },
        { name: 'Listado de Órdenes de Compra', sprint: 2, duration: 1.5, category: 'Órdenes' },
        { name: 'Alta de Proveedor (CRUD)', sprint: 3, duration: 2, category: 'Compras' },
        { name: 'Agenda de Visitas', sprint: 3, duration: 1.5, category: 'Logística' },
        { name: 'Entrega/Recepción', sprint: 4, duration: 2, category: 'Logística' },
        //{ name: 'Módulo de Documentación', sprint: 4, duration: 1, category: 'Soporte' },
        { name: 'Cronograma de Pagos', sprint: 5, duration: 1.5, category: 'Finanzas' },
        { name: 'Evaluación de Proveedores', sprint: 5, duration: 1.5, category: 'Evaluación' },
        //{ name: 'Sistema de Notificaciones', sprint: 6, duration: 1, category: 'Soporte' },
        { name: 'Testing y Pruebas Finales', sprint: 6, duration: 2, category: 'QA' }
    ];

    const categoryColors = {
        //'Setup': '#e5e7eb',
        'Autenticación': '#d1d5db',
        'Core': '#9ca3af',
        'Órdenes': '#6b7280',
        'Compras': '#4b5563',
        'Logística': '#374151',
        'Finanzas': '#1f2937',
        'Evaluación': '#111827',
        'Soporte': '#9ca3af',
        'QA': '#6b7280'
    };

    const getTaskPosition = (sprint, duration) => {
        const sprintWidth = 100 / sprints.length;
        const start = (sprint - 1) * sprintWidth;
        const width = (duration / 2) * sprintWidth;
        return { left: `${start}%`, width: `${width}%` };
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 bg-white">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Portal de Proveedores - Planificación Frontend
                </h1>
                <p className="text-sm text-gray-600">
                    Desarrollo: 6 Sprints × 2 semanas = 12 semanas (3 meses)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    * APIs ya desarrolladas | Considerando desde Agenda hasta Post-Evaluación
                </p>
            </div>

            {/* Timeline Header */}
            <div className="mb-4">
                <div className="flex border-b-2 border-gray-300 pb-2">
                    <div className="w-64 font-semibold text-sm text-gray-700">Módulo/Tarea</div>
                    <div className="flex-1 flex">
                        {sprints.map(sprint => (
                            <div key={sprint.id} className="flex-1 text-center">
                <span className="text-xs font-semibold text-gray-700">
                  Sprint {sprint.id}
                </span>
                                <div className="text-xs text-gray-500">
                                    {sprint.duration}s
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gantt Rows */}
            <div className="space-y-1">
                {tasks.map((task, index) => (
                    <div key={index} className="flex items-center group hover:bg-gray-50 py-1 rounded">
                        <div className="w-64 pr-4">
                            <div className="text-sm text-gray-800">{task.name}</div>
                            <div className="text-xs text-gray-500">{task.category}</div>
                        </div>
                        <div className="flex-1 relative h-8">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex">
                                {sprints.map(sprint => (
                                    <div
                                        key={sprint.id}
                                        className="flex-1 border-r border-gray-200"
                                    />
                                ))}
                            </div>
                            {/* Task bar */}
                            <div
                                className="absolute top-1 h-6 rounded transition-all duration-200 group-hover:opacity-80 flex items-center justify-center"
                                style={{
                                    ...getTaskPosition(task.sprint, task.duration),
                                    backgroundColor: categoryColors[task.category]
                                }}
                            >
                <span className="text-xs text-white font-medium px-2 truncate">
                  {task.duration}s
                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorías</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(categoryColors).map(([category, color]) => (
                        <div key={category} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-gray-600">{category}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen del Proyecto</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <strong>Total Sprints:</strong> 6 (12 semanas)</li>
                    <li>• <strong>Módulos Core:</strong> 11 módulos principales</li>
                    <li>• <strong>Sprint 1:</strong> Autenticación</li>
                    <li>• <strong>Sprint 2:</strong> Dashboard + Órdenes</li>
                    <li>• <strong>Sprint 3:</strong> Administración + Logística inicial</li>
                    <li>• <strong>Sprint 4:</strong> Entregas + Documentación</li>
                    <li>• <strong>Sprint 5:</strong> Finanzas + Evaluación</li>
                    <li>• <strong>Sprint 6:</strong> Notificaciones + QA</li>
                </ul>
            </div>
        </div>
    );
};

export default GanttChart;