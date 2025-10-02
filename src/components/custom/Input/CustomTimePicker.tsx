import { Input } from "@/components/ui/input"
import CustomInputGroup from "./CustomInputGroup"

interface CustomTimePickerProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function CustomTimePicker({
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
}: CustomTimePickerProps) {

  return (
    <CustomInputGroup
      label={label}
      htmlFor={htmlFor ?? name}
      error={error}
      required={required}
    >
      <Input
        id={id ?? name}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="time"
        step="60"
        defaultValue="00:00"
        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </CustomInputGroup>

  )
}
