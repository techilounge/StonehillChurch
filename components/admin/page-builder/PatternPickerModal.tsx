"use client";

import * as React from "react";
import { X, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { patternsCatalog } from "@/lib/page-builder-patterns";
import { PatternTemplate } from "@/types/pageBuilder";

interface PatternPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: PatternTemplate) => void;
}

export function PatternPickerModal({ isOpen, onClose, onSelect }: PatternPickerModalProps) {
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

  // Group patterns by category
  const groupedPatterns = patternsCatalog.reduce((acc, pattern) => {
    const cat = pattern.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(pattern);
    return acc;
  }, {} as Record<string, PatternTemplate[]>);

  const categoryLabels: Record<string, string> = {
    hero: "Hero Sections",
    about: "About & Mission",
    call_to_action: "Call to Action",
    feature: "Features & Spotlights",
    general: "General Elements",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Pattern Library</h2>
              <p className="text-sm text-slate-500">Select a pre-built template to add to your page.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-900/60 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="space-y-10">
            {Object.entries(groupedPatterns).map(([category, patterns]) => (
              <div key={category}>
                <h3 className="text-lg font-medium text-slate-900 mb-4 pb-2 border-b border-slate-200">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patterns.map((pattern) => (
                    <div 
                      key={pattern.id}
                      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => {
                        onSelect(pattern);
                        onClose();
                      }}
                    >
                      <div className="aspect-video bg-slate-100 flex items-center justify-center p-6 border-b border-slate-100 group-hover:bg-slate-50 transition-colors">
                        {/* A visual placeholder based on category */}
                        <div className="text-slate-400 group-hover:text-primary/70 transition-colors">
                          <LayoutTemplate className="w-12 h-12 opacity-50" />
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-medium text-slate-900 mb-1 group-hover:text-primary transition-colors">
                          {pattern.name}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {pattern.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 mt-auto">
                          <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {pattern.sections.length} Section{pattern.sections.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
