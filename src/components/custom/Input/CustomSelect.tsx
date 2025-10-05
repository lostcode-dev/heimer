import React from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import CustomInputGroup from "./CustomInputGroup";

interface CustomSelectProps {
    name?: string;
    label?: string;
    htmlFor?: string;
    className?: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    options: { value: string; label: string; disabled?: boolean }[];
    onChange: (value: string) => void;
    additionalElement?: React.ReactNode;
    // New optional features
    searchable?: boolean;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    loading?: boolean;
    emptyMessage?: string;
    onOpenChange?: (open: boolean) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    name,
    label,
    htmlFor,
    className,
    value,
    placeholder,
    required = false,
    error,
    disabled = false,
    options,
    onChange,
    additionalElement,
    searchable = false,
    onSearch,
    searchPlaceholder = 'Buscar... ',
    loading = false,
    emptyMessage = 'Nenhum resultado',
    onOpenChange,
}) => {
    return (
        <CustomInputGroup
            label={label}
            htmlFor={htmlFor ?? name}
            error={error}
            required={required}
            additionalElement={additionalElement}
            className={className}
        >
            <Select
                value={value && value.length ? value : undefined}
                onValueChange={onChange}
                disabled={disabled}
                name={name}
                onOpenChange={onOpenChange}
            >
                <SelectTrigger id={name} className={"w-full truncate"}>
                    <SelectValue placeholder={placeholder} className="truncate" />
                </SelectTrigger>
                <SelectContent>
                    {searchable && (
                        <div className="sticky top-0 z-10 bg-background p-2">
                            <input
                                type="text"
                                className="w-full rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2"
                                placeholder={searchPlaceholder}
                                onChange={(e) => onSearch && onSearch(e.target.value)}
                            />
                        </div>
                    )}
                    {loading && (
                        <div className="space-y-1 p-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
                            ))}
                        </div>
                    )}
                    {!loading && options.filter((o) => o.value !== '').length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">{emptyMessage}</div>
                    )}
                    {!loading && options
                        .filter((option) => option.value !== '')
                        .map((option) => (
                            <SelectItem key={option.value} value={option.value} disabled={!!option.disabled}>
                                {option.label}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </CustomInputGroup>
    );
};

export default CustomSelect;
