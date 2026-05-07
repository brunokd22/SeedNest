'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { PaginatedResponse } from '@seednest/shared';
import type { Issue, IssueWithComments, IssueComment } from './useIssues';

export type { Issue, IssueWithComments, IssueComment };

type ApiOk<T> = { success: boolean; data: T };

export function useManagerIssues(filters: {
  nurseryId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}) {
  return useQuery({
    queryKey: ['manager-issues', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });
      if (filters.nurseryId) params.set('nurseryId', filters.nurseryId);
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      const { data } = await api.get<ApiOk<PaginatedResponse<Issue>>>(
        `/api/issues?${params}`,
      );
      return data.data;
    },
  });
}

export function useManagerIssue(issueId: string) {
  return useQuery({
    queryKey: ['manager-issue', issueId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<IssueWithComments>>(
        `/api/issues/${issueId}`,
      );
      return data.data;
    },
    enabled: !!issueId,
  });
}

export function useAddManagerComment(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string }) => {
      const { data } = await api.post<ApiOk<IssueComment>>(
        `/api/issues/${issueId}/comments`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-issue', issueId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateIssueStatus(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: string }) => {
      const { data } = await api.patch<ApiOk<Issue>>(
        `/api/issues/${issueId}/status`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager-issue', issueId] });
      qc.invalidateQueries({ queryKey: ['manager-issues'] });
      toast.success('Status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
