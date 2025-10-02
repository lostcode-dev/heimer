import { ChevronDownIcon } from "lucide-react"
import dayjs from "dayjs"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import CustomInputGroup from "./CustomInputGroup"
import { useState } from "react"

interface CustomDatePickerProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  withTime?: boolean;
  children?: React.ReactNode;
  onChange: (value: string) => void;

}

export default function CustomDatePicker({
  id,
  placeholder,
  name,
  value,
  label,
  htmlFor,
  required,
  error,
  disabled,
  withTime = false,
  children,
  onChange,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <CustomInputGroup
      label={label}
      htmlFor={htmlFor ?? name}
      error={error}
      required={required}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className="block w-full">
          <Button
            variant="outline"
            id="date-picker"
            className="h-10 flex w-full justify-between font-normal"
            disabled={disabled}
          >
            {value
              ? withTime
                ? dayjs(value).format("DD/MM/YYYY HH:mm")
                : dayjs(value).format("DD/MM/YYYY")
              : (placeholder ?? "Selecionar data")}
            <ChevronDownIcon className="ml-2 inline-block" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            id={id ?? name}
            mode="single"
            selected={dayjs(value).isValid() ? dayjs(value).toDate() : undefined}
            captionLayout="dropdown"
            disabled={disabled}
            onSelect={(date) => {
              onChange(dayjs(date).toISOString())
            }}
          />
          <div>{children}</div>
        </PopoverContent>
      </Popover>
    </CustomInputGroup>
  )
}
