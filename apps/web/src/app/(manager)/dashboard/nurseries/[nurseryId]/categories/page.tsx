'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCategoriesByNursery,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from '@/lib/hooks/useCategories';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const params = useParams<{ nurseryId: string }>();
  const nurseryId = params.nurseryId;
  const pathname = `/dashboard/nurseries/${nurseryId}/categories`;
  const tabBase = `/dashboard/nurseries/${nurseryId}`;

  const { data: categories, isLoading } = useCategoriesByNursery(nurseryId);
  const createCategory = useCreateCategory(nurseryId);
  const updateCategory = useUpdateCategory(nurseryId);
  const deleteCategory = useDeleteCategory(nurseryId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // ── Add form ────────────────────────────────────────────────────────────────
  const addForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) });
  const addNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isAdding) addNameRef.current?.focus();
  }, [isAdding]);

  const onAdd = (values: CategoryFormValues) => {
    createCategory.mutate(values, {
      onSuccess: () => {
        toast.success('Category created');
        addForm.reset();
        setIsAdding(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  // ── Edit form ───────────────────────────────────────────────────────────────
  const editForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) });

  const startEdit = (cat: Category) => {
    editForm.reset({ name: cat.name, description: cat.description ?? '' });
    setEditingId(cat.id);
  };

  const onEdit = (values: CategoryFormValues) => {
    if (!editingId) return;
    updateCategory.mutate(
      { id: editingId, ...values },
      {
        onSuccess: () => {
          toast.success('Category updated');
          setEditingId(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <Tabs value={pathname}>
        <TabsList>
          <TabsTrigger value={tabBase} asChild>
            <Link href={tabBase}>Details</Link>
          </TabsTrigger>
          <TabsTrigger value={pathname} asChild>
            <Link href={pathname}>Categories</Link>
          </TabsTrigger>
          <TabsTrigger value={`${tabBase}/seedlings`} asChild>
            <Link href={`${tabBase}/seedlings`}>Seedlings</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* ── Inline add form ────────────────────────────────────────────── */}
          {isAdding && (
            <form
              onSubmit={addForm.handleSubmit(onAdd)}
              className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3"
            >
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Category name"
                  {...addForm.register('name')}
                  ref={(el) => {
                    addForm.register('name').ref(el);
                    addNameRef.current = el;
                  }}
                  autoFocus
                />
                {addForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {addForm.formState.errors.name.message}
                  </p>
                )}
                <Input
                  placeholder="Description (optional)"
                  {...addForm.register('description')}
                />
              </div>
              <div className="flex gap-1">
                <Button type="submit" size="icon" disabled={createCategory.isPending}>
                  {createCategory.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => { setIsAdding(false); addForm.reset(); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* ── Category list ──────────────────────────────────────────────── */}
          {isLoading ? (
            <CategoriesSkeleton />
          ) : !categories || categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No categories yet. Add one to organise your seedlings.
            </p>
          ) : (
            categories.map((cat) =>
              editingId === cat.id ? (
                /* ── Edit mode ────────────────────────────────────────────── */
                <form
                  key={cat.id}
                  onSubmit={editForm.handleSubmit(onEdit)}
                  className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      {...editForm.register('name')}
                      autoFocus
                    />
                    <Input
                      placeholder="Description (optional)"
                      {...editForm.register('description')}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button type="submit" size="icon" disabled={updateCategory.isPending}>
                      {updateCategory.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                /* ── View mode ────────────────────────────────────────────── */
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat.name}</span>
                      {(cat._count?.seedlings ?? 0) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {cat._count!.seedlings} seedlings
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="truncate text-xs text-muted-foreground mt-0.5 max-w-xs">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ),
            )
          )}
        </CardContent>
      </Card>

      {/* ── Delete confirm ─────────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {(deleteTarget?._count?.seedlings ?? 0) > 0 ? (
                <>
                  This category has{' '}
                  <span className="font-medium">
                    {deleteTarget!._count!.seedlings} seedlings
                  </span>
                  . They will become uncategorised.
                </>
              ) : (
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-medium">{deleteTarget?.name}</span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deleteCategory.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success('Category deleted');
                    setDeleteTarget(null);
                  },
                  onError: (err) => toast.error(err.message),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-md border px-4 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </>
  );
}
