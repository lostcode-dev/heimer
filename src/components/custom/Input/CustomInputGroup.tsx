import React from "react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CustomInputProps {
  label?: string;
  htmlFor?: string;
  children?: React.ReactNode;
  error?: string;
  required?: boolean;
  instruction?: string;
  additionalElement?: React.ReactNode;
  labelPosition?: "top" | "left";
  className?: string;
}

const CustomInputGroup: React.FC<CustomInputProps> = ({
  label,
  htmlFor,
  children,
  error,
  required = false,
  instruction,
  additionalElement,
  labelPosition = "top",
  className,
}) => {
  return (
    <div className={`grid gap-3 ${className ?? ""}`}>
      <div
        className={`gap-3 ${labelPosition === "left" ? "flex items-center " : "grid"
          }`}
      >
        {(label || additionalElement) && (
          <div
            className={`flex items-center ${labelPosition === "left" ? "order-last" : "order-first"
              }`}
          >
            {label && <Label htmlFor={htmlFor} className="flex items-center gap-2">
              <span>
                {label} {required && <span className="text-red-500">*</span>}
              </span>
              {instruction && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground inline-flex" aria-label="Instruções">
                      <Info className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{instruction}</TooltipContent>
                </Tooltip>
              )}
            </Label>}
            {additionalElement && (
              <div className="ml-auto">{additionalElement}</div>
            )}
          </div>
        )}

        {children}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default CustomInputGroup;
