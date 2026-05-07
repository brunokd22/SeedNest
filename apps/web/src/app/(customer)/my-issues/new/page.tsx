'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { AlertTriangle, HelpCircle, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateIssue } from '@/lib/hooks/useIssues';
import { useMyOrders } from '@/lib/hooks/useOrders';
import { cn } from '@/lib/utils';

const schema = z.object({
  nurseryId: z.string().min(1, 'Nursery is required'),
  orderId: z.string().optional(),
  seedlingId: z.string().optional(),
  type: z.enum(['REPLACEMENT_REQUEST', 'QUERY', 'COMPLAINT', 'GENERAL_REQUEST']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
});

type FormValues = z.infer<typeof schema>;

const ISSUE_TYPES = [
  {
    value: 'REPLACEMENT_REQUEST',
    label: 'Replacement Request',
    icon: RefreshCw,
    color: 'border-orange-400 bg-orange-50 text-orange-700',
    activeColor: 'ring-2 ring-orange-400',
    emoji: '🔄',
  },
  {
    value: 'QUERY',
    label: 'Question / Query',
    icon: HelpCircle,
    color: 'border-blue-400 bg-blue-50 text-blue-700',
    activeColor: 'ring-2 ring-blue-400',
    emoji: '❓',
  },
  {
    value: 'COMPLAINT',
    label: 'Complaint',
    icon: AlertTriangle,
    color: 'border-red-400 bg-red-50 text-red-700',
    activeColor: 'ring-2 ring-red-400',
    emoji: '⚠️',
  },
  {
    value: 'GENERAL_REQUEST',
    label: 'General Request',
    icon: MessageSquare,
    color: 'border-gray-400 bg-gray-50 text-gray-700',
    activeColor: 'ring-2 ring-gray-400',
    emoji: '💬',
  },
] as const;

export default function NewIssuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qNurseryId = searchParams.get('nurseryId') ?? '';
  const qOrderId = searchParams.get('orderId') ?? '';

  const createIssue = useCreateIssue();
  const { data: ordersData } = useMyOrders(1, 20);
  const orders = ordersData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nurseryId: qNurseryId,
      orderId: qOrderId || undefined,
      type: undefined,
      title: '',
      description: '',
    },
  });

  const selectedOrderId = watch('orderId');
  const titleValue = watch('title');
  const descValue = watch('description');

  // When an order is selected, auto-set nurseryId
  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      if (order) setValue('nurseryId', order.nurseryId);
    }
  }, [selectedOrderId, orders, setValue]);

  // Seedlings from the selected order's items
  const selectedOrderItems =
    orders.find((o) => o.id === selectedOrderId)?.items ?? [];

  const onSubmit = (values: FormValues) => {
    createIssue.mutate(
      {
        nurseryId: values.nurseryId,
        title: values.title,
        description: values.description,
        type: values.type,
        orderId: values.orderId || undefined,
        seedlingId: values.seedlingId || undefined,
      },
      {
        onSuccess: (issue) => {
          toast.success("Issue raised successfully! We'll notify the nursery.");
          router.push(`/my-issues/${issue.id}`);
        },
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Raise a Support Issue</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. Linked Order */}
        <div className="space-y-1.5">
          <Label>Linked Order (optional)</Label>
          <Controller
            control={control}
            name="orderId"
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an order (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No linked order</SelectItem>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      Order #{o.id.slice(0, 8).toUpperCase()} —{' '}
                      {format(new Date(o.createdAt), 'dd MMM yyyy')} —{' '}
                      {o.nursery.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* 2. Issue Type */}
        <div className="space-y-2">
          <Label>Issue Type <span className="text-destructive">*</span></Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                {ISSUE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => field.onChange(t.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all',
                      field.value === t.value
                        ? t.color + ' ' + t.activeColor
                        : 'border-border hover:border-muted-foreground/40',
                    )}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.type && (
            <p className="text-xs text-destructive">{errors.type.message}</p>
          )}
        </div>

        {/* 3. Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Title <span className="text-destructive">*</span></Label>
            <span className="text-xs text-muted-foreground">{titleValue.length}/200</span>
          </div>
          <Input
            {...register('title')}
            placeholder="Brief summary of your issue"
            maxLength={200}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* 4. Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Description <span className="text-destructive">*</span></Label>
            <span className="text-xs text-muted-foreground">{descValue.length}/5000</span>
          </div>
          <Textarea
            {...register('description')}
            placeholder="Please describe your issue in detail..."
            rows={5}
            maxLength={5000}
            style={{ minHeight: 120 }}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* 5. Linked Seedling (only when order selected) */}
        {selectedOrderId && selectedOrderItems.length > 0 && (
          <div className="space-y-1.5">
            <Label>Linked Seedling (optional)</Label>
            <Controller
              control={control}
              name="seedlingId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a seedling (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific seedling</SelectItem>
                    {selectedOrderItems.map((item) => (
                      <SelectItem key={item.seedlingId} value={item.seedlingId}>
                        {item.seedlingName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={createIssue.isPending}
        >
          {createIssue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Issue
        </Button>
      </form>
    </div>
  );
}
