import React from "react";
import CustomInputGroup from "./CustomInputGroup";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomCheckboxProps {
  id?: string;
  name?: string;
  type?: string;
  placeholder?: string;
  value?: boolean;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  additionalElement?: React.ReactNode;
  labelPosition?: "top" | "left";
  onChange: (value: boolean) => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  name,
  value,
  label,
  htmlFor,
  error = "",
  required = false,
  disabled = false,
  additionalElement,
  labelPosition = "left",
  onChange,
}) => {
  return (
    <CustomInputGroup
      label={label}
      htmlFor={htmlFor ?? name}
      error={error}
      required={required}
      additionalElement={additionalElement}
      labelPosition={labelPosition}
    >
      <Checkbox
        id={id ?? name}
        name={name}
        checked={value}
  onCheckedChange={(checked) => onChange(!!checked)}
        disabled={disabled}
      />
    </CustomInputGroup>
  );
};

export default CustomCheckbox;
