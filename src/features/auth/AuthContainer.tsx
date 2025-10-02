import { cn } from '@/lib/utils'

export function AuthContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-white dark:from-emerald-950 dark:via-slate-950 dark:to-black',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-24 h-[38rem] w-[38rem] rounded-full bg-emerald-300/30 blur-[120px] dark:bg-emerald-600/25" />
        <div className="absolute -bottom-44 -right-24 h-[42rem] w-[42rem] rounded-full bg-emerald-200/35 blur-[140px] dark:bg-emerald-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.10),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,6,23,0.06))] dark:bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.35))]" />
      </div>

      <div className="container relative z-10 mx-auto min-h-screen px-4 flex items-center justify-center py-12">
        {children}
      </div>
    </div>
  )
}
