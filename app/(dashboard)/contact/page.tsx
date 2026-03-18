"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/tables/data-table";
import { useContactRequests } from "@/hooks/use-contact-requests";
import { useResolveContactRequest } from "@/hooks/use-contact-requests";
import type { ContactRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Mail } from "lucide-react";

export default function ContactPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useContactRequests({ page });
  const router = useRouter();
  const resolveMutation = useResolveContactRequest();

  const [attachmentPreview, setAttachmentPreview] = useState<{
    url: string;
    filename?: string;
    mimetype?: string;
  } | null>(null);

  const columns: Column<ContactRequest>[] = [
    {
      key: "user",
      header: "User",
      cell: (req) => (
        req.user?.id ? (
          <Link
            href={`/users/${req.user.id}`}
            className="text-sm text-blue-600 hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {req.user?.fullName ?? req.user?.email ?? `#${req.user.id}`}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">
            {req.user?.fullName ?? req.user?.email ?? "Unknown"}
          </span>
        )
      ),
    },
    {
      key: "subject",
      header: "Subject",
      cell: (req) => (
        <p className="text-sm font-medium truncate" title={req.subject}>
          {req.subject}
        </p>
      ),
    },
    {
      key: "message",
      header: "Message",
      cell: (req) => (
        <p className="text-sm text-muted-foreground max-w-xs truncate" title={req.message}>
          {req.message}
        </p>
      ),
    },
    {
      key: "cc",
      header: "CC",
      cell: (req) =>
        req.cc ? (
          <span className="text-sm text-muted-foreground">{req.cc}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (req) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(req.createdAt)}
        </span>
      ),
    },
    {
      key: "attachmentFile",
      header: "Attachment",
      cell: (req) => {
        const url = req.attachmentFile?.url;
        if (!url) return <Badge variant="outline">No file</Badge>;

        const mimeType =
          (req.attachmentFile as any)?.mimetype ??
          (req.attachmentFile as any)?.mimeType ??
          "";

        if (mimeType.startsWith("image/")) {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setAttachmentPreview({
                  url,
                  filename: req.attachmentFile?.filename,
                  mimetype: mimeType,
                });
              }}
            >
              <ExternalLink className="h-4 w-4" />
              View
            </Button>
          );
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (req) => {
        if (req.isResolved) return <Badge variant="success">Resolved</Badge>;
        return (
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              resolveMutation.mutate(req.id);
            }}
            disabled={resolveMutation.isPending}
          >
            Resolve
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100">
          <Mail className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground text-sm">
            View all contact messages
            {data?.total ? ` · ${data.total} total` : ""}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data ?? []) as ContactRequest[]}
        isLoading={isLoading}
        searchKey="subject"
        searchPlaceholder="Search by subject..."
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
        onRowClick={(req) => router.push(`/contact/${req.id}`)}
      />

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

