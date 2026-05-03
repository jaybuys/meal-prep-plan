"use client";

import { useState, useRef, useTransition } from "react";
import type { ShoppingListItem } from "@/types/database";
import {
  addShoppingListItem,
  updateShoppingListItem,
  deleteShoppingListItem,
  toggleShoppingListItem,
  reorderShoppingList,
  clearCheckedItems,
  clearAllItems,
} from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ShoppingCart,
} from "lucide-react";

interface ShoppingListEditorProps {
  initialItems: ShoppingListItem[];
}

export default function ShoppingListEditor({ initialItems }: ShoppingListEditorProps) {
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [isPending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addShoppingListItem(formData);
      // Optimistically update — refetch will come from revalidation
      const name = (formData.get("name") as string)?.trim();
      const quantity = (formData.get("quantity") as string)?.trim() || null;
      if (name) {
        const maxPos = items.length > 0 ? Math.max(...items.map((i) => i.position)) : -1;
        setItems((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: "",
            name,
            quantity,
            checked: false,
            position: maxPos + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
      formRef.current?.reset();
    });
  }

  function handleToggle(id: string, currentChecked: boolean) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !currentChecked } : item
      )
    );
    startTransition(async () => {
      await toggleShoppingListItem(id, !currentChecked);
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    startTransition(async () => {
      await deleteShoppingListItem(id);
    });
  }

  function startEdit(item: ShoppingListItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQuantity(item.quantity ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditQuantity("");
  }

  function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: editName.trim(), quantity: editQuantity.trim() || null }
          : item
      )
    );
    setEditingId(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("name", editName.trim());
      fd.set("quantity", editQuantity.trim());
      await updateShoppingListItem(fd);
    });
  }

  function handleClearChecked() {
    setItems((prev) => prev.filter((i) => !i.checked));
    startTransition(async () => {
      await clearCheckedItems();
    });
  }

  function handleClearAll() {
    setItems([]);
    startTransition(async () => {
      await clearAllItems();
    });
  }

  // ---- Drag handlers (unchecked items only) ----
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...uncheckedItems];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dragOverIndex, 0, moved);

    // Update positions
    const updated = reordered.map((item, i) => ({ ...item, position: i }));
    setItems([...updated, ...checkedItems]);

    startTransition(async () => {
      await reorderShoppingList(updated.map((i) => i.id));
    });

    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <Card>
        <CardContent className="pt-6">
          <form ref={formRef} action={handleAdd} className="flex gap-2">
            <Input
              name="name"
              placeholder="Item name"
              required
              className="flex-1"
            />
            <Input
              name="quantity"
              placeholder="Qty (optional)"
              className="w-28"
            />
            <Button type="submit" size="sm" disabled={isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Your shopping list is empty. Add items above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Unchecked items */}
          {uncheckedItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  To Buy ({uncheckedItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {uncheckedItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                      dragOverIndex === index && dragIndex !== null
                        ? "border-primary bg-primary/5"
                        : "bg-background hover:bg-muted/50"
                    } ${dragIndex === index ? "opacity-30" : ""}`}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleToggle(item.id, item.checked)}
                    />
                    {editingId === item.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 flex-1 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit(item.id);
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <Input
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          placeholder="Qty"
                          className="h-7 w-20 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit(item.id);
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="rounded p-1 text-green-600 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded p-1 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
                          <span className="truncate text-sm font-medium">{item.name}</span>
                          {item.quantity && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => startEdit(item)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Checked items */}
          {checkedItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground">
                    Done ({checkedItems.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={handleClearChecked}
                    disabled={isPending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear done
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {checkedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 opacity-60"
                  >
                    <div className="w-4" />
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggle(item.id, item.checked)}
                    />
                    <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
                      <span className="truncate text-sm line-through">{item.name}</span>
                      {item.quantity && (
                        <span className="shrink-0 text-xs text-muted-foreground line-through">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Footer actions */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear all
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
