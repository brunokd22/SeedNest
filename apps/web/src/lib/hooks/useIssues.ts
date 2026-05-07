'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { PaginatedResponse } from '@seednest/shared';

// ── Types ─────────────────────────────────────────────────────────────────────
export type IssueComment = {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string; image?: string | null; role: string };
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  nurseryId: string;
  customerId: string;
  orderId: string | null;
  seedlingId: string | null;
  createdAt: string;
  updatedAt: string;
  nursery: { name: string; id: string };
  order?: { id: string } | null;
  seedling?: { name: string; id: string } | null;
  customer: { name: string };
  _count?: { comments: number };
};

export type IssueWithComments = Issue & {
  comments: IssueComment[];
};

export type CreateIssuePayload = {
  nurseryId: string;
  title: string;
  description: string;
  type: string;
  orderId?: string;
  seedlingId?: string;
};

type ApiOk<T> = { success: boolean; data: T };

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useMyIssues(filters: {
  status?: string;
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: ['my-issues', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });
      if (filters.status) params.set('status', filters.status);
      const { data } = await api.get<ApiOk<PaginatedResponse<Issue>>>(
        `/api/my-issues?${params}`,
      );
      return data.data;
    },
  });
}

export function useMyIssue(issueId: string) {
  return useQuery({
    queryKey: ['my-issue', issueId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<IssueWithComments>>(
        `/api/my-issues/${issueId}`,
      );
      return data.data;
    },
    enabled: !!issueId,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateIssuePayload) => {
      const { data } = await api.post<ApiOk<Issue>>('/api/issues', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-issues'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAddCustomerComment(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string }) => {
      const { data } = await api.post<ApiOk<IssueComment>>(
        `/api/my-issues/${issueId}/comments`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-issue', issueId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useReopenIssue(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ApiOk<Issue>>(
        `/api/my-issues/${issueId}/reopen`,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-issue', issueId] });
      qc.invalidateQueries({ queryKey: ['my-issues'] });
      toast.success('Issue reopened');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
