"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import type { ContactRequest } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ExternalLink, ArrowLeft, File } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResolveContactRequest } from "@/hooks/use-contact-requests";

export default function ContactRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [attachmentPreview, setAttachmentPreview] = useState<{
    url: string;
    filename?: string;
    mimetype?: string;
  } | null>(null);

  const resolveMutation = useResolveContactRequest();

  const { data, isLoading } = useQuery({
    queryKey: ["contact-request", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get<{ data: ContactRequest }>(
        `/admin/contact-requests/${id}`,
      );
      return res.data.data ?? (res.data as any);
    },
  });

  const request = data as ContactRequest | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <Card>
          <CardContent className="p-6">Loading request...</CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact request not found.</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const attachmentUrl = request.attachmentFile?.url;
  const mimeType =
    (request.attachmentFile as any)?.mimetype ??
    (request.attachmentFile as any)?.mimeType ??
    "";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Contact Request #{request.id}</h1>
        <Badge variant={request.isResolved ? "success" : "warning"}>
          {request.isResolved ? "Resolved" : "New"}
        </Badge>

        {!request.isResolved ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => resolveMutation.mutate(request.id)}
            disabled={resolveMutation.isPending}
          >
            Resolve
          </Button>
        ) : null}

        {request.user?.id ? (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/users/${request.user.id}`}>View User</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Sender</p>
            <p className="font-medium">
              {request.user?.fullName ??
                request.user?.email ??
                request.name ??
                request.email ??
                "Guest"}
            </p>
            <p className="text-sm text-muted-foreground">
              {request.user?.email ?? request.email ?? ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(request.createdAt)}</p>
            {request.updatedAt ? (
              <p className="text-sm text-muted-foreground">
                Updated: {formatDate(request.updatedAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Source</p>
            <Badge variant="outline" className="uppercase">
              {request.source ?? "mobile"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Has User Account</p>
            {request.user?.id ? (
              <Badge variant="success">Yes</Badge>
            ) : (
              <Badge variant="secondary">No</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium">{request.subject}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Message</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {request.message}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">CC</p>
            <p className="text-sm text-muted-foreground">
              {request.cc ? request.cc : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Attachment</p>
            {attachmentUrl ? (
              mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentUrl}
                  alt={request.attachmentFile?.filename ?? "attachment"}
                  className="w-[100px] h-[100px] object-cover rounded border cursor-pointer hover:opacity-90"
                  onClick={() =>
                    setAttachmentPreview({
                      url: attachmentUrl,
                      filename: request.attachmentFile?.filename,
                      mimetype: mimeType,
                    })
                  }
                  title={request.attachmentFile?.filename ?? "Attachment"}
                />
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(attachmentUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  View file
                </Button>
              )
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <File className="h-4 w-4" />
                No attachment
              </div>
            )}
            {request.attachmentFile?.filename ? (
              <p className="text-sm text-muted-foreground truncate">
                {request.attachmentFile.filename}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!attachmentPreview}
        onOpenChange={(open) => {
          if (!open) setAttachmentPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Attachment</DialogTitle>
            <DialogDescription>
              {attachmentPreview?.filename ?? "No filename"}
            </DialogDescription>
          </DialogHeader>

          {attachmentPreview?.mimetype?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachmentPreview.url}
              alt={attachmentPreview.filename ?? "attachment"}
              className="w-full max-h-[80vh] object-contain rounded-lg border bg-muted"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

