import { type ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
}

export function EmptyState({ icon, title, description, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed p-10 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex gap-3">{primaryAction}{secondaryAction}</div>
      )}
    </div>
  )
}
