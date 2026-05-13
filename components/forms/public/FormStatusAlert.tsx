import * as React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormStatusAlertProps {
  status: "idle" | "success" | "error";
  message?: string;
  className?: string;
}

export function FormStatusAlert({
  status,
  message,
  className,
}: FormStatusAlertProps) {
  if (status === "idle" || !message) return null;

  const isSuccess = status === "success";

  return (
    <div
      className={cn(
        "rounded-lg p-4 flex items-start gap-3",
        isSuccess ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800",
        className,
      )}
      role="alert"
    >
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-600" />
      )}
      <div className="text-sm font-medium leading-relaxed">{message}</div>
    </div>
  );
}
