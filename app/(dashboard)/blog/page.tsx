"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/tables/data-table";
import { useBlogs, useDeleteBlog, useUpdateBlog } from "@/hooks/use-blog";
import type { Blog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  const { data, isLoading } = useBlogs({ page });
  const deleteBlog = useDeleteBlog();
  const updateBlog = useUpdateBlog();

  const handleApprove = (blog: Blog) =>
    updateBlog.mutate({ id: blog.id, isActive: true });

  const handleReject = (blog: Blog) =>
    updateBlog.mutate({ id: blog.id, isActive: false });

  const columns: Column<Blog>[] = [
    {
      key: "title",
      header: "Title",
      cell: (blog) => (
        <div>
          <p className="font-medium text-sm">{blog.title}</p>
          <p className="text-xs text-muted-foreground">
            by {blog.user?.fullName ?? "Unknown"}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (blog) => (
        <span className="text-sm">{blog.category?.name ?? "—"}</span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      cell: (blog) => (
        <Badge variant={blog.isActive ? "success" : "outline"}>
          {blog.isActive ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "publishedAt",
      header: "Published",
      cell: (blog) => (
        <span className="text-sm text-muted-foreground">
          {blog.publishedAt ? formatDate(blog.publishedAt) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (blog) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(blog.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (blog) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/blog/${blog.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!blog.isActive ? (
              <DropdownMenuItem
                className="text-green-600 focus:text-green-600"
                onClick={() => handleApprove(blog)}
                disabled={updateBlog.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-orange-600 focus:text-orange-600"
                onClick={() => handleReject(blog)}
                disabled={updateBlog.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Unpublish
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setDeleteTarget(blog)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Blog</h1>
            <p className="text-muted-foreground text-sm">
              Manage blog posts and articles
              {data?.total ? ` · ${data.total} total` : ""}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data ?? []) as Blog[]}
        isLoading={isLoading}
        searchKey="title"
        searchPlaceholder="Search blog posts..."
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) deleteBlog.mutate(deleteTarget.id);
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
