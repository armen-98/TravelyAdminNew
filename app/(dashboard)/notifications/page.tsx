"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useNotifications,
  useSendNotification,
} from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useUsers } from "@/hooks/use-users";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const notifSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
  audience: z.enum(["all", "selected"]),
  userIds: z.array(z.number()).optional(),
}).superRefine((values, ctx) => {
  if (values.audience === "selected" && (!values.userIds || values.userIds.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["userIds"],
      message: "Select at least one user",
    });
  }
});

type NotifForm = z.infer<typeof notifSchema>;

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 30 });
  const send = useSendNotification();
  const [usersSearch, setUsersSearch] = useState("");
  const { data: usersData, isLoading: usersLoading } = useUsers({
    page: 1,
    limit: 200,
    search: usersSearch || undefined,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
    defaultValues: {
      audience: "all",
      userIds: [],
    },
  });

  const audience = watch("audience");
  const selectedUserIds = watch("userIds") ?? [];
  const selectedUsersCount = selectedUserIds.length;
  const users = usersData?.data ?? [];
  const selectedUsersLabel = useMemo(() => {
    if (selectedUsersCount === 0) return "No users selected";
    if (selectedUsersCount === 1) return "1 user selected";
    return `${selectedUsersCount} users selected`;
  }, [selectedUsersCount]);

  const toggleUserSelection = (userId: number) => {
    const next = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];
    setValue("userIds", next, { shouldValidate: true });
  };

  const onSubmit = (values: NotifForm) => {
    send.mutate(
      {
        title: values.title,
        body: values.body,
        userIds: values.audience === "selected" ? values.userIds : undefined,
      },
      {
        onSuccess: () =>
          reset({
            title: "",
            body: "",
            audience: "all",
            userIds: [],
          }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-yellow-100">
          <Bell className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Send push notifications to all users or selected users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send notification form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>
              Choose your audience and send a push notification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Audience *</Label>
                <Select
                  value={audience}
                  onValueChange={(value) => {
                    const nextAudience = value as "all" | "selected";
                    setValue("audience", nextAudience, { shouldValidate: true });
                    if (nextAudience === "all") {
                      setValue("userIds", [], { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="selected">Selected users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Notification title"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  {...register("body")}
                  placeholder="Write your notification message..."
                  rows={4}
                />
                {errors.body && (
                  <p className="text-red-500 text-xs">{errors.body.message}</p>
                )}
              </div>

              {audience === "selected" && (
                <div className="space-y-2">
                  <Label htmlFor="users-search">Choose users *</Label>
                  <Input
                    id="users-search"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Search users by name or email"
                  />
                  <div className="border rounded-lg p-2 max-h-56 overflow-y-auto space-y-2">
                    {usersLoading ? (
                      <p className="text-xs text-muted-foreground px-2 py-1">Loading users...</p>
                    ) : users.length > 0 ? (
                      users.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        const initials = (user.fullName || `User ${user.id}`)
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleUserSelection(user.id)}
                            className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profileImage?.url} />
                                <AvatarFallback className="text-xs font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{user.fullName || `User #${user.id}`}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        No users found for this search.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedUsersLabel}</p>
                  {errors.userIds && (
                    <p className="text-red-500 text-xs">{errors.userIds.message}</p>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium mb-2">
                  Preview
                </p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Travely</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={send.isPending}
              >
                {send.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {audience === "all" ? "Send to All Users" : "Send to Selected Users"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Previously sent notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {data.data.map((notif: import("@/types").Notification) => (
                  <div
                    key={notif.id}
                    className="border rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {notif.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{notif.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(notif.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications sent yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
