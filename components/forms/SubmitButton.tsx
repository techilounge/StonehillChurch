"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/shared/Button";
import { Loader2 } from "lucide-react";

export interface SubmitButtonProps extends ButtonProps {
  pendingText?: string;
}

export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? (pendingText ?? children) : children}
    </Button>
  );
}
