"use client";

import { useState } from "react";
import { useTags, useCreateTag, useDeleteTag } from "@/hooks/use-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import type { Tag as TagType } from "@/types";
import { formatDate } from "@/lib/utils";

export default function TagsPage() {
  const [newTag, setNewTag] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TagType | null>(null);

  const { data: tags, isLoading } = useTags();
  const create = useCreateTag();
  const deleteTag = useDeleteTag();

  const handleCreate = () => {
    if (!newTag.trim()) return;
    create.mutate(newTag.trim(), {
      onSuccess: () => setNewTag(""),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-pink-100">
          <Tag className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-muted-foreground text-sm">
            Manage place tags
            {tags ? ` · ${tags.length} total` : ""}
          </p>
        </div>
      </div>

      {/* Create new tag */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="New tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="max-w-xs"
            />
            <Button
              onClick={handleCreate}
              disabled={!newTag.trim() || create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Tag
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags grid */}
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="group flex items-center gap-1.5 bg-secondary rounded-full pl-3 pr-1.5 py-1"
                >
                  <span className="text-sm font-medium">{tag.name}</span>
                  <button
                    onClick={() => setDeleteTarget(tag)}
                    className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100 hover:text-red-600 text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No tags yet. Create your first tag above.</p>
          </CardContent>
        </Card>
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{deleteTarget?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteTag.mutate(deleteTarget.id);
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
