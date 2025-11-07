import React from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Avatar,
    Button,
    Chip,
    Progress,
    Accordion,
    AccordionItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    getKeyValue,
    Input,
    Select,
    SelectItem, Switch
} from '@heroui/react';
import {
    UserPlusIcon,
    ChatBubbleLeftIcon,
    EllipsisHorizontalIcon,
    CameraIcon,
    PencilIcon,
    MapPinIcon,
    CalendarIcon,
    EnvelopeIcon,
    PhoneArrowDownLeftIcon,
    GlobeAltIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    BuildingOffice2Icon,
    PlusIcon,
    IdentificationIcon,
    PhoneIcon,
    BanknotesIcon,
    CurrencyDollarIcon, UserIcon, StarIcon,
} from '@heroicons/react/24/outline';
import {Link} from "@heroui/link";
import {DeleteIcon} from "@/components/icons.tsx";
import {useConfigData} from "@/store";
import Dashboard from "@/layouts/Dashboard";
import {useNavigate} from "react-router-dom";
import {useSuppliers} from "@/store/extendedStore.ts";

const getStatusColor = (status: string) => {
    switch (status) {
        case "Activo":
            return "success";
        case "Pendiente":
            return "warning";
        case "Suspendido":
            return "default";
        case "Inactivo":
            return "danger";
        default:
            return "default";
    }
};
const getProgressColor = (puntuacion: number) => {
    if (puntuacion >= 80) return 'success';
    if (puntuacion >= 40) return 'warning';
    if (puntuacion >= 0) return 'danger';
    return 'default';
};

const SupplierProfileCard = () => {

    const {selectedSupplier} = useSuppliers()
    const [isLoading] = React.useState(false);
    const {estadosSupplier} = useConfigData()
    const navigate = useNavigate()


    /*let list =  ({
        async load({signal}) {
            delay(3000)
            let jsonR =  json;

            setIsLoading(false);

            return {
                items: jsonR.results,
            };
        },
        async sort({items, sortDescriptor}) {
            return {
                items: items.sort((a, b) => {
                    let first = a[sortDescriptor.column];
                    let second = b[sortDescriptor.column];
                    let cmp = (parseInt(first) || first) < (parseInt(second) || second) ? -1 : 1;

                    if (sortDescriptor.direction === "descending") {
                        cmp *= -1;
                    }

                    return cmp;
                }),
            };
        },
    });*/

    function getRandomColor() {
        const colors = ['rgba(255,107,107,0.68)', 'rgba(107,203,119,0.68)', 'rgba(77,150,255,0.68)', 'rgba(255,217,61,0.68)', '#9D4EDD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }


    return (
        <Dashboard>
            <Card className=" mx-auto shadow-lg">
                {/* Cover Image Section */}
                <CardHeader className="p-0 relative">
                    <div className="w-full h-48 relative overflow-hidden rounded-t-lg">
                        {/*<img
                            src={coverImage}
                            alt="Imagen de portada"
                            className="w-full h-48 object-cover"
                        />*/}
                        {selectedSupplier?.coverImage ? (
                            <img
                                src={selectedSupplier?.coverImage}
                                alt="Imagen de portada"
                                className="w-full h-48 object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-48"
                                style={{backgroundColor: getRandomColor()}}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"/>

                        {/* Cover Photo Edit Button */}
                        <Button
                            isIconOnly
                            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white"
                            size="sm"
                        >
                            <CameraIcon className="w-4 h-4 text-gray-700"/>
                        </Button>
                    </div>
                    {/* Profile Picture */}
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <Avatar
                                src={selectedSupplier?.avatar}
                                alt={selectedSupplier?.cardName}
                                className="w-32 h-32 border-4 border-white shadow-lg"
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                className="absolute bottom-2 right-2 bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                            >
                                <CameraIcon className="w-4 h-4 text-gray-600"/>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                {/* Profile Info Section */}
                <CardBody className="pt-20 px-8 pb-6">
                    <div className="flex justify-between items-start mb-0">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-gray-900">{selectedSupplier?.cardName}</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PencilIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                <div className="flex items-center">
                                    <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600 mr-3"/>
                                    <span className="font-bold mr-4">{selectedSupplier?.phone}</span>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-1 max-w-md">{selectedSupplier?.cardCode}</p>

                            {/*<div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div>
                                <span className="font-semibold">{friendsCount.toLocaleString()} amigos</span>
                                <span>{mutualFriends} amigos en común</span>
                                <span>Última Actualización {lastProfileUpdate}</span>
                            </div>
                            <div>
                                // progresBarr de perfil completado
                            </div>
                        </div>*/}
                        </div>


                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                color="primary"
                                startContent={<StarIcon className="w-4 h-4 bg:shadow-amber-400"/>}
                                className="bg-blue-600 hover:bg-blue-700"
                                onPress={() => navigate("/proveedor/evaluacion")}
                            >
                                EVALUACIÓN
                            </Button>
                            <Button
                                size="sm"
                                variant="bordered"
                                startContent={<ChatBubbleLeftIcon className="w-4 h-4"/>}
                            >
                                Evaluación
                            </Button>
                            <Button
                                size="sm"
                                isIconOnly
                                variant="bordered"
                            >
                                <EllipsisHorizontalIcon className="w-5 h-5"/>
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-between w-full items-center gap-4 text-sm text-gray-500 mb-4">
                        {/* Izquierda */}
                        <div className="flex space-x-5 items-center">
                            <Chip
                                color={getStatusColor(selectedSupplier?.status || "")}
                                variant="shadow"
                                size="sm"
                            >
                                {selectedSupplier?.status}
                            </Chip>
                            <div><span
                                className="font-semibold text-xs">{selectedSupplier?.Documentos?.length || 0}/30 </span><span
                                className="text-xs">Documentos</span></div>
                            <span
                                className="text-xs">Última actualización: {selectedSupplier?.lastProfileUpdate || selectedSupplier?.registrationDate}</span>
                        </div>

                        {/* Derecha - Progress bar */}
                        <div className="w-52">

                            <Progress
                                className="max-w-md"
                                color={getProgressColor(45)} // HACER DINAMICO ESTE NUMEO
                                label="Completado                 "
                                maxValue={100}
                                showValueLabel={true}
                                size="sm"
                                radius="sm"
                                value={78} // HACER DINAMICO ESTE NUMERO
                            />

                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-0">
                            <div className="flex items-center gap-3 text-gray-700">
                                <EnvelopeIcon className="w-4 h-4 text-gray-500"/>
                                <span className="text-xs">{selectedSupplier?.email}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <UserPlusIcon className="w-4 h-4 text-gray-500"/>
                                <span
                                    className="text-xs">Cotactar con {selectedSupplier?.contactPerson?.[0].name || " - "}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <MapPinIcon className="w-4 h-4 text-gray-500"/>
                                <span
                                    className="text-xs">{selectedSupplier?.addresses?.[0].address} - {selectedSupplier?.addresses?.[0].city}, {selectedSupplier?.addresses?.[0].province}</span>
                            </div>
                        </div>
                        <div className="space-y-0">
                            <div className="flex items-center gap-3 text-gray-700">
                                <GlobeAltIcon className="w-4 h-4 text-gray-500"/>
                                <Link className="text-xs" href={selectedSupplier?.website}>
                                    {selectedSupplier?.website}
                                </Link>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <CalendarIcon className="w-4 h-4 text-gray-500"/>
                                <span className="text-xs">Se unió en {selectedSupplier?.registrationDate}</span>
                            </div>
                        </div>
                    </div>
                    {/* Tags/Interests */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        {/*<div className="flex flex-wrap gap-2">
                        <Chip color="primary" variant="flat" size="sm">React</Chip>
                        <Chip color="secondary" variant="flat" size="sm">TypeScript</Chip>
                        <Chip color="success" variant="flat" size="sm">Tailwind CSS</Chip>
                        <Chip color="warning" variant="flat" size="sm">JavaScript</Chip>
                        <Chip color="danger" variant="flat" size="sm">Node.js</Chip>
                    </div>*/}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {selectedSupplier?.registradoMype && (
                                <Chip
                                    color="primary"
                                    variant="flat"
                                    startContent={<CheckCircleIcon className="h-3 w-3"/>}
                                    size="sm"
                                >
                                    Registrado como MyPE
                                </Chip>
                            )}

                            {selectedSupplier?.emisorFacElectronica ? (
                                <Chip
                                    color="success"
                                    variant="flat"
                                    startContent={<DocumentTextIcon className="h-3 w-3"/>}
                                    size="sm"
                                >
                                    Emisor de Facturas Electrónicas
                                </Chip>
                            ) : (
                                <Chip
                                    color="warning"
                                    variant="flat"
                                    startContent={<ExclamationTriangleIcon className="h-3 w-3"/>}
                                    size="sm"
                                >
                                    No Emisor de Facturas Electrónicas
                                </Chip>
                            )}
                        </div>
                    </div>
                    {/*<Card className="w-full">
                    <CardBody className="p-0">
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-6 md:gap-4 items-center justify-center">
                            <div className="relative col-span-6 md:col-span-4">
                                <Image
                                    alt="Album cover"
                                    className="object-cover"
                                    height={200}
                                    shadow="md"
                                    src="https://heroui.com/images/album-cover.png"
                                    width="100%"
                                />
                            </div>

                            <div className="relative col-span-6 md:col-span-8 p-2">
                                <div className="flex justify-between gap-3 mb-0">
                                    <div className="flex items-center gap-3">
                                        <BuildingOffice2Icon className="h-5 w-5 text-gray-600"/>
                                        <span className="text-lg font-bold">Almacen</span>
                                    </div>
                                    <Button
                                        isIconOnly
                                        startContent={
                                            <PlusIcon  className="h-5 w-5 text-gray-600"/>
                                        }
                                    >
                                    </Button>
                                </div>
                                <span className="text-xs text-gray-500">Av. La marina 235, interior 45-B</span>
                                <span className="text-xs text-gray-500">San Bartolo - Lima - Lima</span>
                                <span className="text-xs text-gray-500">Ubigeo: 102105</span>

                            </div>
                        </div>
                    </CardBody>
                </Card>*/}

                    <br></br><br></br>
                    {/*================== DIRECCIONES ======================*/}
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Direcciónes</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                <div className="flex items-center">
                                    <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                    <span className="font-bold mr-4">{selectedSupplier?.phone}</span>
                                </div>
                            </div>

                            {/*<div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div>
                                <span className="font-semibold">{friendsCount.toLocaleString()} amigos</span>
                                <span>{mutualFriends} amigos en común</span>
                                <span>Última Actualización {lastProfileUpdate}</span>
                            </div>
                            <div>
                                // progresBarr de perfil completado
                            </div>
                        </div>*/}
                        </div>
                        {/* Action Buttons */}
                    </div>
                    {selectedSupplier?.addresses && selectedSupplier.addresses.length > 0 ? (
                        selectedSupplier.addresses?.map((item, index) => (
                            <Card key={index} radius="lg" shadow="sm" className="w-full  mx-auto mt-4">
                                <CardBody className="p-4">
                                    <div className="grid grid-cols-6 md:grid-cols-12 gap-6 items-center">
                                        {/* Imagen */}
                                        {/*<div className="relative col-span-6 md:col-span-4">
                                <Image
                                    alt={`${name} - cover`}
                                    className="object-cover rounded-lg"
                                    height="30%"
                                    src="https://heroui.com/images/album-cover.png"
                                    width="100%"
                                />
                            </div>*/}

                                        {/* Info */}
                                        <div className="relative col-span-12 md:col-span-12">
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 text-gray-800">
                                                    <BuildingOffice2Icon className="h-5 w-5 text-gray-600"/>
                                                    <span className="text-lg font-semibold">{item.address}</span>
                                                    <span className="text-sm text-gray-500">{`(${item.type})`}</span>
                                                </div>

                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    radius="full"
                                                    startContent={<PencilIcon className="h-4 w-4 text-gray-600"/>}
                                                    aria-label="Agregar"
                                                />
                                            </div>

                                            {/* Dirección */}
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPinIcon className="h-5 w-5 mt-1 text-gray-500"/>
                                                <div className="flex flex-col">
                                                    <span>{item.address}</span>
                                                    <span>{item.city} - {item.province} - {item.departament}</span>
                                                </div>
                                            </div>

                                            {/* Ubigeo */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <IdentificationIcon className="h-4 w-4 text-gray-400"/>
                                                <span>Ubigeo: {item.ubigeo}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    ) : (
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            <span className="text-xs text-center">No hay direcciones registradas</span>
                        </div>
                    )}

                    {/*=================================== PERSONA DE CONTACTO ================================= */}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Persona de Contacto</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    {selectedSupplier?.contactPerson && selectedSupplier?.contactPerson.length > 0 ? (
                        <Accordion selectionMode="multiple">
                            {selectedSupplier?.contactPerson.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    aria-label="Zoey Lang"
                                    startContent={
                                        <Avatar
                                            isBordered
                                            color="warning"
                                            radius="lg"
                                            src="https://i.pravatar.cc/150?u=a04258114e29026702d"
                                        />
                                    }
                                    subtitle={
                                        <p className="flex space-x-4 items-center text-sm text-gray-500">
                                            <span className="text-primary ml-3">{item.email}</span>
                                            <span className="text-xs">{item.phone}</span>
                                        </p>
                                    }
                                    title={
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-md ml-3">{item.name}</span>
                                            <div className="flex space-x-2">
                                                <PencilIcon className="w-3 h-3 text-gray-600"/>
                                                <DeleteIcon className="w-3 h-3 text-gray-600"/>
                                            </div>
                                        </div>
                                    }
                                >
                                    {/*<Card shadow="sm" className="w-full">
                                        <CardBody className="p-4 space-y-2 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <IdentificationIcon className="h-5 w-5 text-gray-500"/>
                                                <span className="font-medium">Carlos Andress Milon Song</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <PhoneIcon className="h-5 w-5 text-gray-500"/>
                                                <span>{item.phone}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <EnvelopeIcon className="h-5 w-5 text-gray-500"/>
                                                <span>carlos.milon@example.com</span>
                                            </div>
                                        </CardBody>
                                    </Card>*/}
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div>
                            <span>No hay personas de Contacto registrada</span>
                        </div>
                    )}


                    {/*=================================== REFERENCIAS BANCARIAS ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Referencias Bancarias</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    {/* <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400')] bg-cover bg-center opacity-20" /> */}
                    {selectedSupplier?.bankReferences && selectedSupplier.bankReferences.length > 0 ? (
                        <div
                            className="relative w-full max-w-md p-0.5 rounded-xl overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-700 to-purple-800 shadow-xl"
                        >
                            <Card
                                shadow="md"
                                radius="lg"
                                className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 text-white"
                            >
                                <CardBody className="space-y-3 text-sm font-medium">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <h2 className="text-lg font-semibold">Banco de Crédito del Perú</h2>
                                            <PencilIcon className="w-3 h-3 text-white"/>
                                        </div>
                                        <GlobeAltIcon className="h-5 w-5 text-white/70"/>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-white/70">
                                        <span>Perú</span>
                                        <span>Soles (PEN)</span>
                                    </div>

                                    <div className="border-t border-white/20 pt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <BanknotesIcon className="h-4 w-4 text-white/70"/>
                                            <span className="text-xs">Tipo de cuenta: Cuenta Corriente</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <IdentificationIcon className="h-4 w-4 text-white/70"/>
                                            <span className="text-xs">Número: 123-45678901-0-12</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-4 w-4 text-white/70"/>
                                            <span className="text-xs">CCI: 0021123456789011234</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <GlobeAltIcon className="h-4 w-4 text-white/70"/>
                                            <span className="text-xs">IBAN: pe2112345678901234567891245</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/20 pt-3">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4 text-white/70"/>
                                            <span>Sectorista: María Fernanda Quispe</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PhoneIcon className="h-4 w-4 text-white/70"/>
                                            <span>+51 987 654 321</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center">
                            <span className="text-xs">No hay referencias Bancarias registradas</span>
                        </div>
                    )}


                    {/*=================================== REFERENCIAS COMERCIALES ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Referencias Comerciales</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    <Table
                        aria-label="Example table with client side sorting"
                    >
                        <TableHeader>
                            <TableColumn key="name" allowsSorting>
                                Razon Social
                            </TableColumn>
                            <TableColumn key="contact" allowsSorting>
                                Contacto
                            </TableColumn>
                            <TableColumn key="phone" allowsSorting>
                                Telefono
                            </TableColumn>
                        </TableHeader>
                        <TableBody
                            isLoading={isLoading}
                            items={selectedSupplier?.commercialReferences || []}
                            loadingContent={<Spinner label="Loading..."/>}
                            emptyContent="No hay referencias comerciales"
                        >
                            {(item) => (
                                <TableRow key={item}>
                                    {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>


                    {/*=================================== SERVICIOS OFRECIDOS ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Servicios Ofrecidos</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedSupplier?.ServiciosOfrecidos && selectedSupplier.ServiciosOfrecidos.length > 0 ? (
                            <>
                                <Input
                                    label="Actividad principal"
                                    placeholder="Importaciones y servicios"
                                    isRequired
                                />
                                <Input
                                    label="linea de servicio"
                                    type="text"
                                    isRequired
                                />
                                <Select className="max-w-xs" label="Condicion de Pago" placeholder="Select an animal">
                                    {estadosSupplier.map((status) => (
                                        <SelectItem key={status.key}>{status.label}</SelectItem>
                                    ))}
                                </Select>
                            </>
                        ) : (
                            <div className="flex flex-wrap textjustify-center text-xs"><span className="">No hay servicios registrados</span></div>
                        )}
                    </div>


                    {/*=================================== DOCUMENTOS ==============================*/}
                    <div className="flex justify-between items-start mt-6 border-t border-gray-200 pt-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="bg-gray-100 hover:bg-gray-200 min-w-8 h-8"
                                    >
                                        <PlusIcon className="w-4 h-4 text-gray-600"/>
                                    </Button>
                                </div>
                                {/*<div className="flex items-center">
                                <PhoneArrowDownLeftIcon className="h-5 w-5 text-gray-600"/>
                                <span className="font-bold mr-4">{phone}</span>
                            </div>*/}
                            </div>
                        </div>
                        {/* Action Buttons */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.certificacionISO}>Certificaciones ISO(9001, 14001, 45001)</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.licenciaMuni}>Licencia Municipal de Funcionamiento</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.referenciasComerciales}>Referencias Comerciales</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.referenciasBancarias}>Referencias Bancarias</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.historicoPrecios}>Historial de Precios</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.condicionesPago}>Condiciones de pago</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.vigenciaPoder}>Vigencia de Poder</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.fichaRuc}>Ficha RUC</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.matrizAAmbientales}>Matriz de aspectos e impactos Ambientales</Switch>
                        <Switch size="sm" isSelected={selectedSupplier?.Documentos?.matrizIPERC}>Matriz IPERC</Switch>
                        {/*<Switch
                        size="sm"
                        isSelected={}
                        onValueChange={}
                    >
                        Certificaciones ISO (9001, 14001, 45001)
                    </Switch>
                    <Switch
                        size="sm"
                        isSelected={formData.documentos.licenciaMunicipal}
                        onValueChange={(value) => handleDocumentChange('licenciaMunicipal', value)}
                    >
                        Licencia Municipal de Funcionamiento
                    </Switch>
                    <Switch
                        size="sm"
                        isSelected={formData.documentos.referenciasComerciales}
                        onValueChange={(value) => handleDocumentChange('referenciasComerciales', value)}
                    >
                        Referencias Comerciales
                    </Switch>
                    <Switch
                        size="sm"
                        isSelected={formData.documentos.referenciasBancarias}
                        onValueChange={(value) => handleDocumentChange('referenciasBancarias', value)}
                    >
                        Referencias Bancarias
                    </Switch>
                    <Switch
                        size="sm"
                        isSelected={formData.documentos.historialPrecios}
                        onValueChange={(value) => handleDocumentChange('historialPrecios', value)}
                    >
                        Historial de Precios
                    </Switch>*/}
                    </div>

                </CardBody>
            </Card>
        </Dashboard>
    );
};
export default SupplierProfileCard;