import React from "react";
import { WarningCircle, Info, CheckCircle, XCircle } from "phosphor-react";

interface CustomMessageBoxProps {
  message?: string | null;
  type?: "error" | "warning" | "info" | "success";
}

const typeStyles = {
  error: "border-red-500 bg-red-100/80 text-red-700",
  warning: "border-yellow-500 bg-yellow-100/80 text-yellow-700",
  info: "border-blue-500 bg-blue-100/80 text-blue-700",
  success: "border-green-500 bg-green-100/80 text-green-700",
};

const typeIcons = {
  error: <XCircle size={20} className="text-red-700" />,
  warning: <WarningCircle size={20} className="text-yellow-700" />,
  info: <Info size={20} className="text-blue-700" />,
  success: <CheckCircle size={20} className="text-green-700" />,
};

const CustomMessageBox: React.FC<CustomMessageBoxProps> = ({
  message,
  type = "error",
}) => {
  if (!message) return null;

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out opacity-100 border px-3 py-2 rounded flex items-center gap-2 ${typeStyles[type]}`}
    >
      {typeIcons[type]}
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default CustomMessageBox;
