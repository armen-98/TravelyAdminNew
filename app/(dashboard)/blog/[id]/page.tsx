"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBlog, useCreateBlog, useUpdateBlog } from "@/hooks/use-blog";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/forms/rich-text-editor"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />,
  }
);

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Content is required"),
  image: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  isActive: z.boolean().default(false),
});

type BlogForm = z.infer<typeof blogSchema>;

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const { data: blog, isLoading } = useBlog(isNew ? 0 : Number(id));
  const { data: categories } = useCategories();
  const create = useCreateBlog();
  const update = useUpdateBlog();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BlogForm>({
    resolver: zodResolver(blogSchema),
    defaultValues: { isActive: false },
  });

  const isActive = watch("isActive");
  const content = watch("description");

  useEffect(() => {
    if (blog && !isNew) {
      reset({
        title: blog.title,
        description: blog.description,
        image: blog.image ?? "",
        categoryId: blog.category?.id,
        isActive: blog.isActive,
      });
    }
  }, [blog, isNew, reset]);

  const onSubmit = (values: BlogForm) => {
    if (isNew) {
      create.mutate(values, { onSuccess: () => router.push("/blog") });
    } else {
      update.mutate(
        { id: Number(id), ...values },
        { onSuccess: () => router.push("/blog") }
      );
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? "New Blog Post" : "Edit Blog Post"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Blog post title"
              />
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <RichTextEditor
                content={content ?? ""}
                onChange={(val) => setValue("description", val)}
              />
              {errors.description && (
                <p className="text-red-500 text-xs">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Cover Image URL</Label>
              <Input
                id="image"
                {...register("image")}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                onValueChange={(val) => setValue("categoryId", Number(val))}
                defaultValue={blog?.category?.id?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.data?.map((cat: import("@/types").Category) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={(val) => setValue("isActive", val)}
              />
              <Label>Published</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={create.isPending || update.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {isNew ? "Publish Post" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
