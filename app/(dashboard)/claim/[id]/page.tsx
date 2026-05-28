'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApproveClaim, useClaim, useRejectClaim } from '@/hooks/use-claims';
import { useFilesByIds } from '@/hooks/use-files';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, FileText, ExternalLink, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FileEntity } from '@/types';

function FileRow({ file, onPreview }: { file: FileEntity; onPreview: (f: FileEntity) => void }) {
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  return (
    <div
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onPreview(file)}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.fileName} className="object-cover w-full h-full" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-[220px]">{file.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {isPdf ? 'PDF' : isImage ? 'Image' : file.mimeType} · {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          asChild
          onClick={(e) => e.stopPropagation()}
          title="Open in new tab"
        >
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          onClick={(e) => e.stopPropagation()}
          title="Download"
        >
          <a href={file.url} download={file.fileName}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function FileSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Skeleton className="w-12 h-12 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function ClaimDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { data: claim, isLoading } = useClaim(Number.isFinite(id) ? id : null);
  const approveMutation = useApproveClaim();
  const rejectMutation = useRejectClaim();
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingFile, setViewingFile] = useState<FileEntity | null>(null);

  const fileIds =
    !claim?.documentFiles?.length && claim?.documentFileIds?.length
      ? (claim.documentFileIds as number[])
      : [];
  const fileIdQueries = useFilesByIds(fileIds);

  if (isLoading || !claim) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isPending = claim.status === 'pending';

  const directFiles = (claim.documentFiles as FileEntity[] | undefined) ?? [];
  const hasDocuments = directFiles.length > 0 || fileIds.length > 0;

  const onApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id: claim.id, adminNotes });
      toast.success('Claim approved and place assigned to claimant');
      router.push('/claim');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Failed to approve claim');
    }
  };

  const onReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        id: claim.id,
        rejectionReason,
        adminNotes,
      });
      toast.success('Claim rejected');
      router.push('/claim');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Failed to reject claim');
    }
  };
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/claim" className="text-sm text-muted-foreground hover:underline">
          ← Back to claims
        </Link>
        <h1 className="text-2xl font-bold mt-2">Claim #{claim.id}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge className="capitalize">{claim.status}</Badge>
          {claim.updatedByUserAt ? (
            <Badge variant="outline" className="border-blue-400 text-blue-600">
              Updated by user · {formatDate(claim.updatedByUserAt)}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Place</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Name: </span>
            {claim.place?.name ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Place ID: </span>
            <Link href={`/places/${claim.placeId}`} className="text-blue-600 hover:underline">
              {claim.placeId}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Claimant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{claim.fullName}</p>
          <p>{claim.email}</p>
          {claim.phone ? <p>{claim.phone}</p> : null}
          {claim.businessName ? <p>Business: {claim.businessName}</p> : null}
          {claim.relationship ? <p>Relationship: {claim.relationship}</p> : null}
          {claim.message ? <p className="mt-2 whitespace-pre-wrap">{claim.message}</p> : null}
          <p className="text-muted-foreground text-xs mt-2">
            Submitted {formatDate(claim.createdAt)}
          </p>
        </CardContent>
      </Card>

      {claim.userUpdateMessage || claim.updatedByUserAt ? (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <span>User Update</span>
              {claim.updatedByUserAt ? (
                <span className="text-xs font-normal text-muted-foreground">
                  {formatDate(claim.updatedByUserAt)}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {claim.userUpdateMessage ? (
              <p className="whitespace-pre-wrap">{claim.userUpdateMessage}</p>
            ) : (
              <p className="text-muted-foreground italic">
                No message — user uploaded new documents only.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {hasDocuments ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Documents
              <span className="text-muted-foreground font-normal text-sm ml-2">
                — click to preview
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Files populated directly from the claim response */}
            {directFiles.map((file) => (
              <FileRow key={file.id} file={file} onPreview={setViewingFile} />
            ))}

            {/* Files fetched by ID */}
            {fileIds.map((fileId, i) => {
              const q = fileIdQueries[i];
              if (!q || q.isLoading || q.isPending) return <FileSkeleton key={fileId} />;
              if (q.data) return <FileRow key={fileId} file={q.data} onPreview={setViewingFile} />;
              // Fetch failed — show the ID with a download fallback
              return (
                <div
                  key={fileId}
                  className="flex items-center justify-between p-3 border border-dashed rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">File #{fileId}</p>
                      <p className="text-xs text-destructive">Could not load file details</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {isPending ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Internal notes (optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection reason (if rejecting)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onApprove}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Approve & assign place
              </Button>
              <Button
                variant="destructive"
                onClick={onReject}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {claim.rejectionReason ? <p>Rejection: {claim.rejectionReason}</p> : null}
            {claim.adminNotes ? <p className="mt-2">Notes: {claim.adminNotes}</p> : null}
            {claim.reviewedAt ? (
              <p className="mt-2">Reviewed {formatDate(claim.reviewedAt)}</p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Document viewer dialog */}
      <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold truncate">
                  {viewingFile?.fileName}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {viewingFile?.mimeType} · {viewingFile ? formatFileSize(viewingFile.size) : ''}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewingFile?.url}
                  download={viewingFile?.fileName}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <a
                  href={viewingFile?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in new tab
                </a>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-muted/20 min-h-0">
            {viewingFile?.mimeType?.startsWith('image/') ? (
              <div className="flex items-center justify-center p-4 min-h-[50vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingFile.url}
                  alt={viewingFile.fileName}
                  className="max-w-full max-h-[75vh] object-contain rounded shadow-sm"
                />
              </div>
            ) : viewingFile?.mimeType === 'application/pdf' ? (
              <iframe
                src={viewingFile.url}
                className="w-full h-[75vh]"
                title={viewingFile.fileName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Preview not available for this file type.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <a href={viewingFile?.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in new tab
                    </a>
                  </Button>
                  <Button asChild>
                    <a href={viewingFile?.url} download={viewingFile?.fileName}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
