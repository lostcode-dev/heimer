import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CustomModalFormProps {
  open: boolean
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  onSubmit?: (e: React.FormEvent) => void
  submitLabel?: string
  submitDisabled?: boolean
}

export default function CustomModalForm({
  open,
  title,
  description,
  children,
  footer,
  onOpenChange,
  onSubmit,
  submitLabel,
  submitDisabled,
}: CustomModalFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) onSubmit(e)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {children}
          </form>
        </div>
        <DialogFooter>
          {footer ?? (
            <>
              <Button type="submit" onClick={handleSubmit} disabled={submitDisabled}>
                {submitLabel ?? 'Salvar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
