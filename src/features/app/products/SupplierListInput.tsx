import { useEffect, useState } from "react";
import CustomInputGroup from "@/components/custom/Input/CustomInputGroup";
import CustomSelect from "@/components/custom/Input/CustomSelect";
import CustomInput from "@/components/custom/Input/CustomInput";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { apiSupplierSearch } from "@/lib/api";
import { formatBRL, parseBRL } from "@/lib/format";
import { SupplierForm } from "@/features/app/suppliers/SupplierForm";
import { apiSuppliers } from "@/lib/api";
import { toast } from "sonner";

export type SupplierItem = {
  supplier_id: string;
  supplier_name?: string;
  supplier_sku?: string | null;
  supplier_price?: number | null;
  notes?: string | null;
};

export default function SupplierListInput({
  label = "Fornecedores",
  value,
  onChange,
  disabled,
}: {
  label?: string;
  value: SupplierItem[];
  onChange: (items: SupplierItem[]) => void;
  disabled?: boolean;
}) {
  const list = value?.length ? value : [{ supplier_id: "" }];
  const [openCreate, setOpenCreate] = useState(false);

  const add = () => onChange([...list, { supplier_id: "" }]);
  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));
  const patch = (idx: number, next: Partial<SupplierItem>) =>
    onChange(list.map((it, i) => (i === idx ? { ...it, ...next } : it)));

  async function handleCreateSupplier(data: { name: string; email?: string | null; phone?: string | null; notes?: string | null; is_active?: boolean; cep?: string | null; street?: string | null; number?: string | null; complement?: string | null; neighborhood?: string | null; city?: string | null; state?: string | null }) {
    try {
      const created = await apiSuppliers.create(data) as any
      toast.success('Fornecedor criado')
      // attach to first empty row, or append a new row
      const idx = list.findIndex((r) => !r.supplier_id)
      if (idx >= 0) {
        const next = list.map((r, i) => (i === idx ? { ...r, supplier_id: created.id } : r))
        onChange(next)
      } else {
        onChange([...list, { supplier_id: created.id }])
      }
      setOpenCreate(false)
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao criar fornecedor')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CustomInputGroup
        label={label}
        htmlFor="supplier"
        instruction="Associe um ou mais fornecedores para este produto."
        additionalElement={(
          <Button type="button" size="sm" variant="outline" onClick={() => setOpenCreate(true)}>
            <Plus className="mr-1 size-4" /> Novo
          </Button>
        )}
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
      <SupplierForm open={openCreate} onOpenChange={setOpenCreate} onSubmit={handleCreateSupplier} />
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
  item: SupplierItem;
  onChange: (next: Partial<SupplierItem>) => void;
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
        const data = await apiSupplierSearch.search(query);
        if (!active) return;
        setOptions(data.map((s: any) => ({ value: s.id, label: s.name })));
      } finally {
        if (active) setLoading(false);
      }
    }
    // preload when opened or when query changes
    run();
    return () => {
      active = false;
    };
  }, [open, query]);

  return (
    <div className="grid gap-2 md:grid-cols-10">
      <div className="md:col-span-6">
        <CustomSelect
          name="supplier"
          label="Fornecedor"
          value={item.supplier_id}
          options={options}
          placeholder="Selecione um fornecedor"
          onChange={(v) => onChange({ supplier_id: v })}
          disabled={disabled}
          searchable
          onSearch={setQuery}
          loading={loading}
          onOpenChange={setOpen}
        />
      </div>
      <div className="md:col-span-3">
        <CustomInput
          name="supplier_price"
          label="Preço"
          value={formatBRL(item.supplier_price ?? 0)}
          onChange={(v) => onChange({ supplier_price: parseBRL(v) })}
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
