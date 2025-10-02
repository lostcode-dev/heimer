import React from "react";
import { Input } from "@/components/ui/input";
import CustomInputGroup from "./CustomInputGroup";

interface CustomInputProps {
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  additionalElement?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  step?: string;
  instruction?: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  mask?: (raw: string) => string;

}

const CustomInput: React.FC<CustomInputProps> = ({
  id,
  name,
  type = "text",
  placeholder = "",
  value,
  label,
  htmlFor,
  error = "",
  instruction,
  required = false,
  disabled = false,
  additionalElement,
  icon,
  step,
  onKeyDown,
  onChange,
  mask,
}) => {
  return (
    <CustomInputGroup
      label={label}
      htmlFor={htmlFor ?? name}
      error={error}
      instruction={instruction}
      required={required}
      additionalElement={additionalElement}
    >
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-2 flex items-center border-r pr-2">
            {icon}
          </span>
        )}
        <Input
          id={id ?? name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value
            const next = mask ? mask(raw) : raw
            onChange(next)
          }}
          onKeyDown={onKeyDown}
          className={icon ? `pl-9` : ""}
          step={step}
        />
      </div>
    </CustomInputGroup>
  );
};

export default CustomInput;
