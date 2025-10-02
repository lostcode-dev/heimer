import React, { useRef } from "react";

interface CustomInputColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  instruction?: string;
  name?: string;
}

const CustomInputColorPicker: React.FC<CustomInputColorPickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  instruction,
  name,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1 w-fit">
      {label && (
        <label className="text-sm font-medium text-foreground mb-1" htmlFor={name}>
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="color"
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border rounded cursor-pointer bg-transparent p-0"
          style={{ minWidth: 32, minHeight: 32 }}
        />
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 border rounded px-2 py-1 text-sm"
        />
      </div>
      {instruction && (
        <span className="text-xs text-muted-foreground">{instruction}</span>
      )}
    </div>
  );
};

export default CustomInputColorPicker;
