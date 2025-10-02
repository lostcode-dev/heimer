import { useEffect, useState } from "react";
import CustomInputGroup from "@/components/custom/Input/CustomInputGroup";
import CustomSelect from "@/components/custom/Input/CustomSelect";
import CustomInput from "@/components/custom/Input/CustomInput";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { apiTechnicianSearch, apiTechnicians } from "@/lib/api";
import { toast } from "sonner";
import { TechnicianForm } from "@/features/app/technicians/TechnicianForm";
import { formatBRL, parseBRL } from "@/lib/format";

export type TechnicianItem = {
  technician_id: string;
  name?: string;
  technician_price?: number | null;
};

export default function TechnicianListInput({
  label = "Técnicos",
  value,
  onChange,
  disabled,
}: {
  label?: string;
  value: TechnicianItem[];
  onChange: (items: TechnicianItem[]) => void;
  disabled?: boolean;
}) {
  const list = value?.length ? value : [{ technician_id: "" }];
  const [openCreate, setOpenCreate] = useState(false);

  const add = () => onChange([...list, { technician_id: "" }]);
  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));
  const patch = (idx: number, next: Partial<TechnicianItem>) =>
    onChange(list.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  async function handleCreateTechnician(data: { full_name: string; email?: string | null; phone?: string | null; is_active?: boolean; notes?: string | null }) {
    try {
      const created = (await apiTechnicians.create(data)) as any;
      toast.success("Técnico criado");
      const idx = list.findIndex((r) => !r.technician_id);
      if (idx >= 0) {
        const next = list.map((r, i) => (i === idx ? { ...r, technician_id: created.id } : r));
        onChange(next);
      } else {
        onChange([...list, { technician_id: created.id }]);
      }
      setOpenCreate(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao criar técnico");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CustomInputGroup
        label={label}
        htmlFor="technician"
        instruction="Associe um ou mais técnicos para este serviço."
        additionalElement={
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenCreate(true)}>
            <Plus className="mr-1 size-4" /> Novo
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {list.map((item, idx) => {
            const isLast = idx === list.length - 1;
            return (
              <Row
                key={idx}
                item={item}
                onChange={(next) => patch(idx, next)}
                onAdd={isLast ? add : undefined}
                onRemove={!isLast ? () => remove(idx) : undefined}
                disabled={disabled}
              />
            );
          })}
        </div>
      </CustomInputGroup>
      <TechnicianForm open={openCreate} onOpenChange={setOpenCreate} onSubmit={handleCreateTechnician} />
    </div>
  );
}

function Row({
  item,
  onChange,
  onAdd,
  onRemove,
  disabled,
}: {
  item: TechnicianItem;
  onChange: (next: Partial<TechnicianItem>) => void;
  onAdd?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      try {
        const data = await apiTechnicianSearch.search(query);
        if (!active) return;
        setOptions(data.map((t: any) => ({ value: t.id, label: t.full_name })));
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [open, query]);

  return (
    <div className="grid gap-2 md:grid-cols-10">
      <div className="md:col-span-6">
        <CustomSelect
          name="technician"
          label="Técnico"
          value={item.technician_id}
          options={options}
          placeholder="Selecione um técnico"
          onChange={(v) => onChange({ technician_id: v })}
          disabled={disabled}
          searchable
          onSearch={setQuery}
          loading={loading}
          onOpenChange={setOpen}
        />
      </div>
      <div className="md:col-span-3">
        <CustomInput
          name="technician_price"
          label="Preço"
          value={formatBRL(item.technician_price ?? 0)}
          onChange={(v) => onChange({ technician_price: parseBRL(v) })}
          disabled={disabled}
        />
      </div>
      <div className="md:col-span-1 flex items-end gap-2">
        {onAdd && (
          <Button type="button" variant="outline" size="icon" onClick={onAdd} aria-label="Adicionar">
            <Plus className="size-4" />
          </Button>
        )}
        {onRemove && (
          <Button type="button" variant="destructive" size="icon" onClick={onRemove} aria-label="Remover">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
