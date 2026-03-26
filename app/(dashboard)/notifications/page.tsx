"use client";

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

const notifSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Message is required"),
});

type NotifForm = z.infer<typeof notifSchema>;

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 30 });
  const send = useSendNotification();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotifForm>({
    resolver: zodResolver(notifSchema),
  });

  const onSubmit = (values: NotifForm) => {
    send.mutate(values, { onSuccess: () => reset() });
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
            Send push notifications to all app users
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send notification form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>
              Broadcast a push notification to all registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                Send to All Users
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
