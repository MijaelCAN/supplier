import { FC, useEffect, useState, useMemo } from 'react';
import { Select, SelectItem } from '@heroui/react';
import { fetchUbigeos, type UbigeoRecord } from '@/services/maestros/ubigeoApi';

interface UbigeoSelectorProps {
    value?: string;
    onChange?: (ubigeoCode: string) => void;
    onDepartmentChange?: (department: string) => void;
    onProvinceChange?: (province: string) => void;
    onDistrictChange?: (district: string) => void;
    size?: 'sm' | 'md' | 'lg';
    isInvalid?: boolean;
    errorMessage?: string;
    isDisabled?: boolean;
    className?: string;
}

export const UbigeoSelector: FC<UbigeoSelectorProps> = ({
    value,
    onChange,
    onDepartmentChange,
    onProvinceChange,
    onDistrictChange,
    size = 'sm',
    isInvalid = false,
    errorMessage,
    isDisabled = false,
    className = '',
}) => {
    const [ubigeos, setUbigeos] = useState<UbigeoRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // Cargar ubigeos al montar el componente
    useEffect(() => {
        const loadUbigeos = async () => {
            setIsLoading(true);
            try {
                const data = await fetchUbigeos();
                setUbigeos(data);
            } catch (error) {
                console.error('Error al cargar ubigeos:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadUbigeos();
    }, []);

    // Obtener lista única de departamentos
    const departments = useMemo(() => {
        const deps = new Set<string>();
        ubigeos.forEach((ubigeo) => {
            if (ubigeo.u_syp_depa) {
                deps.add(ubigeo.u_syp_depa);
            }
        });
        return Array.from(deps).sort();
    }, [ubigeos]);

    // Obtener lista de provincias filtradas por departamento
    const provinces = useMemo(() => {
        if (!selectedDepartment) return [];
        const provs = new Set<string>();
        ubigeos.forEach((ubigeo) => {
            if (
                ubigeo.u_syp_depa === selectedDepartment &&
                ubigeo.u_syp_prov
            ) {
                provs.add(ubigeo.u_syp_prov);
            }
        });
        return Array.from(provs).sort();
    }, [ubigeos, selectedDepartment]);

    // Obtener lista de distritos filtrados por departamento y provincia
    const districts = useMemo(() => {
        if (!selectedDepartment || !selectedProvince) return [];
        const dists = new Set<string>();
        ubigeos.forEach((ubigeo) => {
            if (
                ubigeo.u_syp_depa === selectedDepartment &&
                ubigeo.u_syp_prov === selectedProvince &&
                ubigeo.u_syp_dist
            ) {
                dists.add(ubigeo.u_syp_dist);
            }
        });
        return Array.from(dists).sort();
    }, [ubigeos, selectedDepartment, selectedProvince]);

    // Encontrar el ubigeo seleccionado basado en el código
    useEffect(() => {
        if (value && ubigeos.length > 0) {
            const ubigeo = ubigeos.find((u) => u.code === value);
            if (ubigeo && ubigeo.u_syp_depa && ubigeo.u_syp_prov && ubigeo.u_syp_dist) {
                // Actualizar solo si los valores son diferentes
                const dept = ubigeo.u_syp_depa;
                const prov = ubigeo.u_syp_prov;
                const dist = ubigeo.u_syp_dist;
                setSelectedDepartment((prev) => prev !== dept ? dept : prev);
                setSelectedProvince((prev) => prev !== prov ? prov : prev);
                setSelectedDistrict((prev) => prev !== dist ? dist : prev);
            } else if (value) {
                // Si el código no se encuentra, limpiar las selecciones
                setSelectedDepartment('');
                setSelectedProvince('');
                setSelectedDistrict('');
            }
        } else if (!value) {
            // Si no hay valor, limpiar las selecciones
            setSelectedDepartment('');
            setSelectedProvince('');
            setSelectedDistrict('');
        }
    }, [value, ubigeos]);

    // Manejar cambio de departamento
    const handleDepartmentChange = (department: string) => {
        setSelectedDepartment(department);
        setSelectedProvince('');
        setSelectedDistrict('');
        onDepartmentChange?.(department);
        onChange?.('');
    };

    // Manejar cambio de provincia
    const handleProvinceChange = (province: string) => {
        setSelectedProvince(province);
        setSelectedDistrict('');
        onProvinceChange?.(province);
        onChange?.('');
    };

    // Manejar cambio de distrito
    const handleDistrictChange = (district: string) => {
        setSelectedDistrict(district);
        onDistrictChange?.(district);
        
        // Buscar el código de ubigeo correspondiente
        const ubigeo = ubigeos.find(
            (u) =>
                u.u_syp_depa === selectedDepartment &&
                u.u_syp_prov === selectedProvince &&
                u.u_syp_dist === district
        );
        
        if (ubigeo) {
            onChange?.(ubigeo.code);
        }
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
            <Select
                label="Departamento"
                placeholder={isLoading ? "Cargando..." : "Seleccione departamento"}
                selectedKeys={selectedDepartment ? [selectedDepartment] : []}
                onSelectionChange={(keys) => {
                    const dept = Array.from(keys)[0] as string;
                    handleDepartmentChange(dept || '');
                }}
                size={size}
                isInvalid={isInvalid && !selectedDepartment}
                errorMessage={isInvalid && !selectedDepartment ? errorMessage : undefined}
                isDisabled={isDisabled || isLoading}
            >
                {departments.map((dept) => (
                    <SelectItem key={dept}>
                        {dept}
                    </SelectItem>
                ))}
            </Select>

            <Select
                label="Provincia"
                placeholder={selectedDepartment ? "Seleccione provincia" : "Primero seleccione departamento"}
                selectedKeys={selectedProvince ? [selectedProvince] : []}
                onSelectionChange={(keys) => {
                    const prov = Array.from(keys)[0] as string;
                    handleProvinceChange(prov || '');
                }}
                size={size}
                isInvalid={Boolean(isInvalid && selectedDepartment && !selectedProvince)}
                errorMessage={isInvalid && selectedDepartment && !selectedProvince ? errorMessage : undefined}
                isDisabled={isDisabled || isLoading || !selectedDepartment}
            >
                {provinces.map((prov) => (
                    <SelectItem key={prov}>
                        {prov}
                    </SelectItem>
                ))}
            </Select>

            <Select
                label="Distrito"
                placeholder={selectedProvince ? "Seleccione distrito" : "Primero seleccione provincia"}
                selectedKeys={selectedDistrict ? [selectedDistrict] : []}
                onSelectionChange={(keys) => {
                    const dist = Array.from(keys)[0] as string;
                    handleDistrictChange(dist || '');
                }}
                size={size}
                isInvalid={Boolean(isInvalid && selectedProvince && !selectedDistrict)}
                errorMessage={isInvalid && selectedProvince && !selectedDistrict ? errorMessage : undefined}
                isDisabled={isDisabled || isLoading || !selectedProvince}
            >
                {districts.map((dist) => (
                    <SelectItem key={dist}>
                        {dist}
                    </SelectItem>
                ))}
            </Select>
        </div>
    );
};

