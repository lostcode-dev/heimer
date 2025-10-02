import CustomTimePicker from "./CustomTimePicker"
import CustomDatePicker from "./CustomDatePicker"
import { useEffect, useState } from "react";
import { CardFooter } from "@/components/ui/card";
import dayjs from "dayjs";

interface CustomDateTimePickerProps {
    id?: string;
    name?: string;
    placeholder?: string;
    label?: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    value?: string;
    onChange: (value: string) => void;
}

function getTimeStringFromDate(date?: Date) {
    if (!date) return "00:00"
    return dayjs(date).format("HH:mm")
}

function combineDateAndTime(date: string, time: string) {
    const [hours, minutes] = time.split(":").map(Number)
    return dayjs(date)
        .set("hour", hours || 0)
        .set("minute", minutes || 0)
        .set("second", 0)
        .set("millisecond", 0)
        .format("YYYY-MM-DDTHH:mm:ss")
}

export default function CustomDateTimePicker({
    id,
    placeholder,
    name,
    value,
    label,
    htmlFor,
    required,
    error,
    disabled,
    onChange,
}: CustomDateTimePickerProps) {
    const [date, setDate] = useState<string | undefined>(value ? dayjs(value).format("YYYY-MM-DD") : undefined)
    const [time, setTime] = useState<string>(getTimeStringFromDate(value ? dayjs(value).toDate() : undefined))

    useEffect(() => {
        if (date) onChange(combineDateAndTime(date, time))
    }, [date, time])

    return (
        <CustomDatePicker
            id={id}
            placeholder={placeholder}
            name={name}
            value={value}
            label={label}
            htmlFor={htmlFor}
            required={required}
            error={error}
            disabled={disabled}
            onChange={setDate}
            withTime
        >
            <CardFooter className="flex gap-2 border-t px-4 !pt-4 pb-2 *:[div]:w-full">
                <CustomTimePicker
                    id={id ? `${id}-time` : undefined}
                    name={name ? `${name}-time` : undefined}
                    value={time}
                    onChange={setTime}
                    disabled={disabled}
                />
            </CardFooter>
        </CustomDatePicker>
    )
}
