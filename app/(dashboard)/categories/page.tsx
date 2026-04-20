"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryActive,
  useDeleteCategory,
} from "@/hooks/use-categories";
import type { Category } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FolderTree,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/permissions";

// ── Schema ─────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isPro: z.boolean().default(false),
  sortOrder: z.coerce.number().default(0),
  parentId: z.coerce.number().nullable().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

// ── Row ────────────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  depth = 0,
  onEdit,
  onDelete,
  onAddSub,
  toggleActive,
}: {
  cat: Category;
  depth?: number;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: (parent: Category) => void;
  toggleActive: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (cat.children?.length ?? 0) > 0;

  return (
    <>
      <tr className={cn("border-b transition-colors hover:bg-muted/40", depth > 0 && "bg-muted/20")}>
        {/* Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                {expanded
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}
            {cat.color && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
            )}
            <div>
              <div className="font-medium text-sm flex items-center gap-1.5">
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
                {depth === 0 && hasChildren && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                    {cat.children!.length}
                  </Badge>
                )}
              </div>
              {cat.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {cat.description}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Subcategories preview (only for parents) */}
        <td className="px-4 py-3">
          {depth === 0 && hasChildren ? (
            <div className="flex flex-wrap gap-1">
              {cat.children!.slice(0, 4).map((child) => (
                <Badge key={child.id} variant="outline" className="text-xs">
                  {child.icon && <span className="mr-1">{child.icon}</span>}
                  {child.name}
                </Badge>
              ))}
              {cat.children!.length > 4 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{cat.children!.length - 4} more
                </Badge>
              )}
            </div>
          ) : depth > 0 ? (
            <span className="text-xs text-muted-foreground italic">subcategory</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        {/* Sort */}
        <td className="px-4 py-3 text-sm text-center">{cat.sortOrder}</td>

        {/* Active */}
        <td className="px-4 py-3">
          <Switch
            checked={cat.isActive}
            onCheckedChange={() => toggleActive(cat.id)}
          />
        </td>

        {/* Pro */}
        <td className="px-4 py-3">
          <Badge variant={cat.isPro ? "default" : "outline"} className="text-xs">
            {cat.isPro ? "Pro" : "Free"}
          </Badge>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(cat)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {depth === 0 && (
                <DropdownMenuItem onClick={() => onAddSub(cat)}>
                  <FolderTree className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(cat)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Subcategory rows */}
      {hasChildren && expanded &&
        cat.children!.map((child) => (
          <CategoryRow
            key={child.id}
            cat={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSub={onAddSub}
            toggleActive={toggleActive}
          />
        ))}
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: session } = useSession();
  const canChangeProCategory = isSuperAdmin(session?.user?.role);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);

  const { data, isLoading } = useCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const toggleActive = useToggleCategoryActive();
  const deleteCategory = useDeleteCategory();

  const allParents = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const selectedParentId = watch("parentId");

  const openCreate = (parentId: number | null = null) => {
    setEditTarget(null);
    setDefaultParentId(parentId);
    reset({
      name: "",
      description: "",
      icon: "",
      color: "",
      isPro: false,
      sortOrder: 0,
      parentId: parentId ?? undefined,
    });
    setDrawerOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setDefaultParentId(null);
    reset({
      name: cat.name,
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      color: cat.color ?? "",
      isPro: cat.isPro,
      sortOrder: cat.sortOrder,
      parentId: cat.parentId ?? undefined,
    });
    setDrawerOpen(true);
  };

  const onSubmit = (values: CategoryForm) => {
    const payload = {
      ...values,
      isPro: canChangeProCategory ? values.isPro : undefined,
      parentId: values.parentId || null,
    };
    if (editTarget) {
      update.mutate({ id: editTarget.id, ...payload });
    } else {
      create.mutate(payload);
    }
    setDrawerOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <FolderOpen className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground text-sm">
              Manage place categories and subcategories
              {data?.total ? ` · ${data.total} total` : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => openCreate(null)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subcategories</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Order</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : allParents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No categories yet. Create one to get started.
                </td>
              </tr>
            ) : (
              allParents.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onAddSub={(parent) => openCreate(parent.id)}
                  toggleActive={(id) => toggleActive.mutate(id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Category" : "New Category"}</SheetTitle>
            <SheetDescription>
              {editTarget
                ? "Update category details below."
                : "Fill in the details to create a new category."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Parent selector */}
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={selectedParentId != null ? String(selectedParentId) : "none"}
                onValueChange={(val) =>
                  setValue("parentId", val === "none" ? null : Number(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {allParents
                    .filter((p) => p.id !== editTarget?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.icon && <span className="mr-1">{p.icon}</span>}
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="Category name" />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input id="icon" {...register("icon")} placeholder="e.g. 🏨" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    {...register("color")}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                  {watch("color") && (
                    <div
                      className="w-9 h-9 rounded-md border flex-shrink-0"
                      style={{ backgroundColor: watch("color") ?? "" }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPro">Plan</Label>
                {!canChangeProCategory && (
                  <span className="text-xs text-muted-foreground">Only super admin can change</span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Pro Category</p>
                  <p className="text-xs text-muted-foreground">
                    Mark this category as visible for Pro users.
                  </p>
                </div>
                <Switch
                  id="isPro"
                  checked={watch("isPro")}
                  onCheckedChange={(checked) => setValue("isPro", checked)}
                  disabled={!canChangeProCategory}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder")}
                placeholder="0"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={create.isPending || update.isPending}
              >
                {editTarget ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              {(deleteTarget?.children?.length ?? 0) > 0 && (
                <span className="block mt-1 text-orange-600 font-medium">
                  This category has {deleteTarget!.children!.length} subcategories that must be deleted or reassigned first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteCategory.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
