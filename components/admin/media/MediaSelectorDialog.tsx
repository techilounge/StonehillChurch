"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { MediaManager } from "./MediaManager";

interface MediaSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaSelectorDialog({ isOpen, onClose, onSelect }: MediaSelectorDialogProps) {
  // Prevent body scrolling when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stonehill-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative flex flex-col w-full max-w-6xl max-h-[90vh] bg-stonehill-cream rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stonehill-line bg-white shrink-0">
          <h2 className="text-xl font-semibold text-stonehill-ink">Select Media Asset</h2>
          <button
            onClick={onClose}
            className="p-2 text-stonehill-ink/60 hover:text-stonehill-ink hover:bg-stonehill-cream rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <MediaManager 
            onSelectAsset={(url) => {
              onSelect(url);
              onClose();
            }} 
          />
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-stonehill-line bg-white flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
