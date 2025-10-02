import React, { useRef, useState, useEffect } from "react";
import { ImagePlus, X as IconX } from "lucide-react";

interface CustomInputImageProps {
  label?: string;
  description?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  accept?: string;
  allowedFormats?: string[];
  onChange?: (files: File[]) => void;
  className?: string;
  value?: string | string[] | File | File[];
}

const CustomInputImage: React.FC<CustomInputImageProps> = ({
  label = "Drop your images here",
  description = "SVG, PNG, JPG or GIF (max. 2MB)",
  multiple = true,
  maxSizeMB = 2,
  accept = "image/png, image/jpeg, image/svg+xml, image/gif",
  allowedFormats,
  onChange,
  className = "",
  value,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const computedAccept = allowedFormats
    ? allowedFormats
      .map((f) => {
        if (f.startsWith(".")) return f;
        if (f === "jpg") return ".jpg,.jpeg,image/jpeg";
        if (f === "png") return ".png,image/png";
        if (f === "svg") return ".svg,image/svg+xml";
        if (f === "gif") return ".gif,image/gif";
        return f;
      })
      .join(",")
    : accept;

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const validFiles: File[] = [];
  const previewUrls: string[] = [];
    Array.from(selectedFiles).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mime = file.type;
      const isAllowed =
        !allowedFormats ||
        allowedFormats.some((f) => {
          const cleanFormat = f.replace(".", "").toLowerCase();
          return (
            cleanFormat === ext ||
            mime === `image/${cleanFormat}` ||
            (cleanFormat === "png" && (mime === "image/png" || mime === "image/x-png"))
          );
        });
      if (
        file.size <= maxSizeMB * 1024 * 1024 &&
        isAllowed
      ) {
        validFiles.push(file);
        previewUrls.push(URL.createObjectURL(file));
      } else {
        console.log(
          "[CustomInputImage] Arquivo rejeitado:",
          file.name,
          "| tipo:",
          file.type,
          "| tamanho:",
          file.size,
          "| permitido:",
          isAllowed
        );
      }
    });
    setFiles(validFiles);
    setPreviews(previewUrls);
    onChange?.(validFiles);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
  const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange?.(newFiles);
  };

  const showSinglePreview = !multiple && previews.length === 1;

  const handleRemoveClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    handleRemove(idx);
  };

  useEffect(() => {
    if (!value) return;
    if (typeof value === "string" && value) {
      setPreviews([value]);
      setFiles([]);
    } else if (Array.isArray(value) && value.length > 0) {
      setPreviews((value as Array<string | File>).map((v) => (typeof v === 'string' ? v : URL.createObjectURL(v))));
      setFiles([]);
    }
  }, [value]);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <label className="block mb-2 text-sm font-medium text-foreground">{label}</label>
      <div
        className="h-full flex flex-col items-center justify-center border border-dashed border-primary/50 hover:border-primary border-input rounded-md min-h-[120px] bg-background cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 outline-none relative"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={computedAccept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {showSinglePreview ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-primary/20">
            <div className="relative rounded-md overflow-hidden  flex items-center justify-center">
              <img
                src={previews[0]}
                alt="preview"
                className="object-cover w-full h-full"
              />
            </div>
            <button
              type="button"
              className="absolute cursor-pointer top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(e) => handleRemoveClick(e, 0)}
              aria-label="Remove image"
              tabIndex={0}
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 mx-4 py-6">
            <ImagePlus className="text-muted-foreground mb-1" size={28} />
            <span className="text-xs text-muted-foreground text-center">{description}</span>
          </div>
        )}
      </div>
      {multiple && previews.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {previews.map((src, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted">
              <img
                src={src}
                alt={`preview-${idx}`}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={(e) => handleRemoveClick(e, idx)}
                aria-label="Remove image"
                tabIndex={0}
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomInputImage;
