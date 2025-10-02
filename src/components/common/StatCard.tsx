type StatCardProps = {
  label: string
  value: string
  trend?: string
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="rounded-[14px] border p-4 shadow-sm transition-[transform,opacity] hover:opacity-95 hover:[transform:translateY(-2px)]">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {trend && <div className="mt-1 text-xs text-emerald-600">{trend}</div>}
    </div>
  )
}
