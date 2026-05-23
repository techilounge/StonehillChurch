"use client";

import * as React from "react";
import { useId } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { Plus, Save, Loader2, Menu, LayoutGrid, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/shared/Button";
import { SortableMenuItem } from "./SortableMenuItem";
import { MenuItemForm } from "./MenuItemForm";
import { saveMenuAction } from "@/app/admin/menus/actions";
import type { MenuItem, MenuLocation } from "@/types/menus";
import { DEFAULT_HEADER_MENU, DEFAULT_FOOTER_MENU } from "@/lib/constants/defaultMenus";

interface PageOption {
  slug: string;
  title: string;
}

interface MenuManagerProps {
  initialHeaderItems: MenuItem[];
  initialFooterItems: MenuItem[];
  pages: PageOption[];
}

/** Flatten a hierarchical menu into a flat list with depth metadata for DnD. */
function flattenItems(items: MenuItem[]): Array<{ item: MenuItem; depth: number; parentId: string | null }> {
  const flat: Array<{ item: MenuItem; depth: number; parentId: string | null }> = [];
  for (const item of items) {
    flat.push({ item, depth: 0, parentId: null });
    for (const child of item.children) {
      flat.push({ item: child, depth: 1, parentId: item.id });
    }
  }
  return flat;
}

/** Reconstruct hierarchical items from a flat ordered list. */
function unflattenItems(
  flat: Array<{ item: MenuItem; depth: number; parentId: string | null }>,
): MenuItem[] {
  const result: MenuItem[] = [];
  let currentParent: MenuItem | null = null;

  for (const entry of flat) {
    if (entry.depth === 0) {
      currentParent = { ...entry.item, children: [] };
      result.push(currentParent);
    } else if (currentParent) {
      currentParent.children.push({ ...entry.item, children: [] });
    }
  }

  return result;
}

function MenuTab({
  location,
  items,
  pages,
  onItemsChange,
  onResetClick,
}: {
  location: MenuLocation;
  items: MenuItem[];
  pages: PageOption[];
  onItemsChange: (items: MenuItem[]) => void;
  onResetClick: () => void;
}) {
  const [showForm, setShowForm] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const dndContextId = useId();

  const flatList = React.useMemo(() => flattenItems(items), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = flatList.findIndex((e) => e.item.id === String(active.id));
      const newIndex = flatList.findIndex((e) => e.item.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...flatList];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      onItemsChange(unflattenItems(reordered));
    },
    [flatList, onItemsChange],
  );

  const handleSaveItem = (newItem: MenuItem) => {
    if (editingItem) {
      // Update existing
      const updated = items.map((item) => {
        if (item.id === newItem.id) return { ...newItem, children: item.children };
        return {
          ...item,
          children: item.children.map((child) =>
            child.id === newItem.id ? { ...newItem, children: [] } : child,
          ),
        };
      });
      onItemsChange(updated);
    } else {
      // Add new at top level
      onItemsChange([...items, { ...newItem, children: [] }]);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const updated = items
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: item.children.filter((child) => child.id !== id),
      }));
    onItemsChange(updated);
  };

  const handleIndent = (id: string) => {
    // Find the item in the flat list
    const flatIndex = flatList.findIndex((e) => e.item.id === id);
    if (flatIndex <= 0) return;

    const entry = flatList[flatIndex];
    if (entry.depth !== 0) return; // Already nested

    // Find the previous top-level item
    let prevParentIndex = -1;
    for (let i = flatIndex - 1; i >= 0; i--) {
      if (flatList[i].depth === 0) {
        prevParentIndex = i;
        break;
      }
    }
    if (prevParentIndex === -1) return;

    // Move item as a child of the previous parent
    const updated = items.filter((item) => item.id !== id);
    const prevParent = updated.find((item) => item.id === flatList[prevParentIndex].item.id);
    if (prevParent) {
      prevParent.children = [
        ...prevParent.children,
        { ...entry.item, children: [] },
      ];
    }
    onItemsChange([...updated]);
  };

  const handleOutdent = (id: string) => {
    const updated = items.map((parent) => {
      const childIndex = parent.children.findIndex((c) => c.id === id);
      if (childIndex === -1) return parent;

      const [child] = parent.children.splice(childIndex, 1);
      return { parent, extractedChild: child };
    });

    // Rebuild: insert the outdented child after its former parent at top level
    const newItems: MenuItem[] = [];
    for (const entry of updated) {
      if ("extractedChild" in entry && entry.extractedChild) {
        const parent = (entry as any).parent as MenuItem;
        newItems.push({ ...parent });
        newItems.push({ ...entry.extractedChild, children: [] });
      } else {
        newItems.push(entry as MenuItem);
      }
    }
    onItemsChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 capitalize">
          {location} Menu Structure
        </h3>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onResetClick}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Reset to Default
        </Button>
      </div>

      {flatList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Menu className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">
            No menu items yet
          </p>
          <p className="text-xs text-slate-400 text-center max-w-xs mb-6">
            Add items to build your {location} navigation menu. You can reorder them by
            dragging and nest items to create dropdown menus.
          </p>
          <Button onClick={() => { setEditingItem(null); setShowForm(true); }} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add First Item
          </Button>
        </div>
      ) : (
        <DndContext
          id={dndContextId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <div className="space-y-2">
            <SortableContext
              items={flatList.map((e) => e.item.id)}
              strategy={verticalListSortingStrategy}
            >
              {flatList.map((entry, index) => {
                // Can indent: top-level item that is NOT the first item
                const canIndent =
                  entry.depth === 0 &&
                  index > 0 &&
                  flatList.slice(0, index).some((e) => e.depth === 0);

                return (
                  <SortableMenuItem
                    key={entry.item.id}
                    item={entry.item}
                    depth={entry.depth}
                    canIndent={canIndent}
                    canOutdent={entry.depth === 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onIndent={handleIndent}
                    onOutdent={handleOutdent}
                  />
                );
              })}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* Add button */}
      {flatList.length > 0 && (
        <Button
          variant="outline"
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="w-full border-dashed border-2 hover:border-stonehill-primary hover:text-stonehill-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Menu Item
        </Button>
      )}

      {/* Form modal */}
      {showForm && (
        <MenuItemForm
          editingItem={editingItem}
          pages={pages}
          onSave={handleSaveItem}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

export function MenuManager({ initialHeaderItems, initialFooterItems, pages }: MenuManagerProps) {
  const [activeTab, setActiveTab] = React.useState<MenuLocation>("header");
  const [headerItems, setHeaderItems] = React.useState<MenuItem[]>(initialHeaderItems);
  const [footerItems, setFooterItems] = React.useState<MenuItem[]>(initialFooterItems);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [confirmResetLocation, setConfirmResetLocation] = React.useState<MenuLocation | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleResetToDefault = async (location: MenuLocation) => {
    setIsResetting(true);
    const defaultItems = location === "header" ? DEFAULT_HEADER_MENU : DEFAULT_FOOTER_MENU;
    try {
      const result = await saveMenuAction(location, defaultItems);
      if (result.ok) {
        if (location === "header") {
          setHeaderItems(defaultItems);
          headerRef.current = JSON.stringify(defaultItems);
        } else {
          setFooterItems(defaultItems);
          footerRef.current = JSON.stringify(defaultItems);
        }
        toast.success("Menu has been reset to default.");
        setConfirmResetLocation(null);
      } else {
        toast.error(`Reset failed: ${"error" in result ? result.error.message : "Unknown error"}`);
      }
    } catch {
      toast.error("Failed to reset menu. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // Track changes
  const headerRef = React.useRef(JSON.stringify(initialHeaderItems));
  const footerRef = React.useRef(JSON.stringify(initialFooterItems));

  React.useEffect(() => {
    const headerChanged = JSON.stringify(headerItems) !== headerRef.current;
    const footerChanged = JSON.stringify(footerItems) !== footerRef.current;
    setHasChanges(headerChanged || footerChanged);
  }, [headerItems, footerItems]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save both menus
      const [headerResult, footerResult] = await Promise.all([
        JSON.stringify(headerItems) !== headerRef.current
          ? saveMenuAction("header", headerItems)
          : { ok: true as const },
        JSON.stringify(footerItems) !== footerRef.current
          ? saveMenuAction("footer", footerItems)
          : { ok: true as const },
      ]);

      if (!headerResult.ok) {
        toast.error(`Header menu error: ${"error" in headerResult ? headerResult.error.message : "Unknown error"}`);
        return;
      }
      if (!footerResult.ok) {
        toast.error(`Footer menu error: ${"error" in footerResult ? footerResult.error.message : "Unknown error"}`);
        return;
      }

      headerRef.current = JSON.stringify(headerItems);
      footerRef.current = JSON.stringify(footerItems);
      setHasChanges(false);
      toast.success("Menus saved and published!");
    } catch {
      toast.error("Failed to save menus. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: MenuLocation; label: string; icon: React.ReactNode }[] = [
    { key: "header", label: "Header Menu", icon: <Menu className="h-4 w-4" /> },
    { key: "footer", label: "Footer Menu", icon: <LayoutGrid className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menu Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage navigation menus for the header and footer of your website.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="sm:w-auto w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {hasChanges ? "Save & Publish" : "Saved"}
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-stonehill-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hint bar */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-4 py-2.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-stonehill-accent shrink-0" />
        Drag items to reorder. Use the arrow buttons to nest or un-nest items.
        {hasChanges && (
          <span className="ml-auto text-amber-600 font-medium">Unsaved changes</span>
        )}
      </div>

      {/* Active tab content */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {activeTab === "header" ? (
          <MenuTab
            location="header"
            items={headerItems}
            pages={pages}
            onItemsChange={setHeaderItems}
            onResetClick={() => setConfirmResetLocation("header")}
          />
        ) : (
          <MenuTab
            location="footer"
            items={footerItems}
            pages={pages}
            onItemsChange={setFooterItems}
            onResetClick={() => setConfirmResetLocation("footer")}
          />
        )}
      </div>

      {confirmResetLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isResetting && setConfirmResetLocation(null)}
          />
          
          {/* Dialog Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-6 mx-auto bg-red-50">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
            
            <h3 className="text-2xl text-center font-display font-bold text-slate-900 mb-3">
              Reset {confirmResetLocation === "header" ? "Header" : "Footer"} Menu?
            </h3>
            
            <p className="text-slate-600 text-center mb-8 leading-relaxed">
              Are you sure you want to reset this menu to the default configuration? This will overwrite all customizations.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setConfirmResetLocation(null)} 
                disabled={isResetting}
                className="w-full sm:w-1/2"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleResetToDefault(confirmResetLocation)} 
                disabled={isResetting}
                className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? "Resetting..." : "Reset to Default"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
