import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function NameWithAvatar({ name, phone, avatarUrl, size = 'sm' }: { name?: string | null; phone?: string | null; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const initials = (() => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '-'
    const first = parts[0]?.[0]
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
    return `${(first || '').toUpperCase()}${(last || '').toUpperCase()}` || '-'
  })()
  const cls = size === 'md' ? 'h-9 w-9' : 'h-8 w-8'
  return (
    <div className="flex items-center gap-3">
      <Avatar className={cls}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || '-'} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span className="font-medium">{name || '-'}</span>
        {phone !== undefined ? (
          <span className="text-xs text-muted-foreground">{phone || '-'}</span>
        ) : null}
      </div>
    </div>
  )
}
