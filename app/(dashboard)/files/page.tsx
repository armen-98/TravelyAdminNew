"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useFiles, useUploadFile, useDeleteFile } from "@/hooks/use-files";
import type { FileEntity } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileImage,
  Upload,
  Trash2,
  MoreVertical,
  ExternalLink,
  Loader2,
  File,
  Image,
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

export default function FilesPage() {
  const [deleteTarget, setDeleteTarget] = useState<FileEntity | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files, isLoading } = useFiles();
  const upload = useUploadFile();
  const deleteFile = useDeleteFile();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await upload.mutateAsync({ file });
        }
      } finally {
        setUploading(false);
      }
    },
    [upload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  const isImage = (file: FileEntity) =>
    file.mimetype?.startsWith("image/");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100">
          <FileImage className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-muted-foreground text-sm">
            Upload and manage media files
            {files ? ` · ${files.length} files` : ""}
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {isDragActive
                ? "Drop files here..."
                : uploading
                ? "Uploading..."
                : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse · Images, Videos, PDFs
            </p>
          </div>
        </div>
      </div>

      {/* Files grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : files && files.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="group overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-muted">
                {isImage(file) ? (
                  <NextImage
                    src={file.url}
                    alt={file.filename}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <File className="h-10 w-10" />
                    <Badge variant="outline" className="text-xs">
                      {file.mimetype?.split("/")[1]?.toUpperCase() ?? "FILE"}
                    </Badge>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteTarget(file)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{file.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No files uploaded yet. Drag and drop files above to get started.</p>
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
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.filename}&quot;? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteFile.mutate(deleteTarget.id);
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
