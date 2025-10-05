import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomFormProps {
  open: boolean;
  title: string;
  description?: string;

  children: React.ReactNode;
  footer?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  variant?: 'drawer' | 'dialog';
}

export default function CustomForm({
  open,
  title,
  description,
  children,
  footer,
  onOpenChange,
  onSubmit,
  submitLabel,
  submitDisabled,
  variant = 'drawer',
}: CustomFormProps) {
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  if (variant === 'dialog' || (!isMobile && variant !== 'drawer')) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader className="gap-1">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-1 text-sm">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {children}
            </form>
          </div>
          <DialogFooter>
            {footer || (
              <>
                <Button type="submit" onClick={handleSubmit} disabled={submitDisabled}>
                  {submitLabel ?? 'Salvar'}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {children}
          </form>
        </div>
        <DrawerFooter>
          {footer || (
            <>
              <Button type="submit" onClick={handleSubmit} disabled={submitDisabled}>
                {submitLabel ?? 'Salvar'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
