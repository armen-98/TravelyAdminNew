'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApproveClaim, useClaim, useRejectClaim } from '@/hooks/use-claims';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import NextImage from 'next/image';

export default function ClaimDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { data: claim, isLoading } = useClaim(Number.isFinite(id) ? id : null);
  const approveMutation = useApproveClaim();
  const rejectMutation = useRejectClaim();
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  if (isLoading || !claim) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isPending = claim.status === 'pending';

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
        <Badge className="mt-2 capitalize">{claim.status}</Badge>
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

      {claim.documentFiles?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {claim.documentFiles.map((file) => {
              const isImage = file.mimetype?.startsWith('image/');
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <NextImage
                          src={file.url}
                          alt={file.filename}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : claim.documentFileIds?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              File IDs: {claim.documentFileIds.join(', ')} — view in Files module.
            </p>
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
    </div>
  );
}
