import React from "react";
import { Plus, Trash2 } from "lucide-react";
import CustomInputGroup from "./CustomInputGroup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CustomListInputProps {
  label?: string;
  instruction?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
}

export const CustomListInput: React.FC<CustomListInputProps> = ({
  label,
  instruction,
  values,
  onChange,
  placeholder,
  disabled,
  name,
}) => {
  const add = () => onChange([...(values || []), ""]);
  const remove = (idx: number) => onChange((values || []).filter((_, i) => i !== idx));
  const change = (idx: number, v: string) => onChange((values || []).map((s, i) => (i === idx ? v : s)));

  const list = values && values.length ? values : [""];

  return (
    <CustomInputGroup label={label} instruction={instruction} htmlFor={name}>
      <div className="flex flex-col gap-2">
        {list.map((val, idx) => {
          const isLast = idx === list.length - 1;
          return (
            <div key={idx} className="flex items-center gap-2">
              <Input
                id={idx === 0 ? name : undefined}
                value={val}
                onChange={(e) => change(idx, e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
              />
              {isLast ? (
                <Button type="button" variant="outline" size="icon" onClick={add} aria-label="Adicionar">
                  <Plus className="size-4" />
                </Button>
              ) : (
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(idx)} aria-label="Remover">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </CustomInputGroup>
  );
};

export default CustomListInput;
