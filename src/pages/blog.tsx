import DefaultLayout from "@/layouts/default";
import {AccordionItem, Autocomplete, Calendar, Card, DateValue, InputOtp, Skeleton} from "@heroui/react";
import {parseDate} from "@internationalized/date";
import {useState} from "react";
import {Input} from "@heroui/input";

export const animals = [
    {label: "Cat", key: "cat", description: "The second most popular pet in the world"},
    {label: "Dog", key: "dog", description: "The most popular pet in the world"},
    {label: "Elephant", key: "elephant", description: "The largest land animal"},
    {label: "Lion", key: "lion", description: "The king of the jungle"},
    {label: "Tiger", key: "tiger", description: "The largest cat species"},
    {label: "Giraffe", key: "giraffe", description: "The tallest land animal"},
    {
        label: "Dolphin",
        key: "dolphin",
        description: "A widely distributed and diverse group of aquatic mammals",
    },
    {label: "Penguin", key: "penguin", description: "A group of aquatic flightless birds"},
    {label: "Zebra", key: "zebra", description: "A several species of African equids"},
    {
        label: "Shark",
        key: "shark",
        description: "A group of elasmobranch fish characterized by a cartilaginous skeleton",
    },
    {
        label: "Whale",
        key: "whale",
        description: "Diverse group of fully aquatic placental marine mammals",
    },
    {label: "Otter", key: "otter", description: "A carnivorous mammal in the subfamily Lutrinae"},
    {label: "Crocodile", key: "crocodile", description: "A large semiaquatic reptile"},
];

export default function DocsPage() {
    const [value, setValue] = useState<DateValue>();
  return (
    <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
            <Card className="w-[200px] space-y-5 p-4" radius="lg">
                <Skeleton className="rounded-lg">
                    <div className="h-24 rounded-lg bg-default-300"/>
                </Skeleton>
                <div className="space-y-3">
                    <Skeleton className="w-3/5 rounded-lg">
                        <div className="h-3 w-3/5 rounded-lg bg-default-200"/>
                    </Skeleton>
                    <Skeleton className="w-4/5 rounded-lg">
                        <div className="h-3 w-4/5 rounded-lg bg-default-200"/>
                    </Skeleton>
                    <Skeleton className="w-2/5 rounded-lg">
                        <div className="h-3 w-2/5 rounded-lg bg-default-300"/>
                    </Skeleton>
                </div>
            </Card>
            <span>fecha seleccionada: {value ? new Date(value).toLocaleDateString(): "asas"}</span>
            <div className="flex gap-x-4">
                <Calendar aria-label="Date (No Selection)" value={value} onChange={setValue}/>
                <Calendar aria-label="Date (Uncontrolled)" defaultValue={parseDate("2020-02-03")}/>
            </div>
            <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                <Input label="Email" type="select"/>
                <Input label="Email" placeholder="Enter your email" type="email"/>
            </div>
            <Autocomplete
                defaultItems={animals}
                placeholder='nuevo animal'
            >
                {(animal)=><AccordionItem>{animal.label}</AccordionItem>}
            </Autocomplete>
            <InputOtp length={8}></InputOtp>
        </section>
    </DefaultLayout>
  );
}
