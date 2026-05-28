'use client';

import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { FileEntity } from '@/types';
import { toast } from 'sonner';

async function fetchFileById(id: number): Promise<FileEntity> {
  try {
    const { data } = await api.get<FileEntity | { data: FileEntity }>(`/admin/files/${id}`);
    return (data as { data: FileEntity }).data ?? (data as FileEntity);
  } catch {
    const { data } = await api.get<FileEntity | { data: FileEntity }>(`/files/${id}`);
    return (data as { data: FileEntity }).data ?? (data as FileEntity);
  }
}

export function useFilesByIds(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['files', id],
      queryFn: () => fetchFileById(id),
      enabled: id > 0,
      retry: 0,
    })),
  });
}

export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const { data } = await api.get<{ data: FileEntity[] } | FileEntity[]>('/files/my');
      return Array.isArray(data) ? data : (data as { data: FileEntity[] }).data;
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/files${folder ? `?folder=${folder}` : ''}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded successfully');
    },
    onError: () => toast.error('Failed to upload file'),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/files/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted');
    },
    onError: () => toast.error('Failed to delete file'),
  });
}
