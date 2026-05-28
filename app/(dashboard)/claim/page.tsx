'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/tables/data-table';
import { useClaims } from '@/hooks/use-claims';
import type { PlaceClaim } from '@/types/claim';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function statusVariant(status: string) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'destructive' as const;
  return 'secondary' as const;
}

export default function ClaimRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const router = useRouter();
  const { data, isLoading } = useClaims({
    page,
    limit: 20,
    status: status === 'all' ? undefined : status,
  });

  const columns: Column<PlaceClaim>[] = [
    {
      key: 'place',
      header: 'Place',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.place?.name ?? `#${row.placeId}`}</p>
          <p className="text-xs text-muted-foreground">ID {row.placeId}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Claimant',
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{row.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusVariant(row.status)} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      cell: (row) => (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>
          {row.updatedByUserAt ? (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-400 text-blue-600">
                Updated by user
              </Badge>
            </div>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Place claims</h1>
          <p className="text-sm text-muted-foreground">
            Review ownership requests and assign places after approval.
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/claim/${row.id}`)}
      />
    </div>
  );
}
