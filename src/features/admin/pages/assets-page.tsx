"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { calculateBusinessUseAmount, sumBy } from "@/features/admin/lib/calculations";
import { getLocalDateInputValue } from "@/features/admin/lib/date";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import type { Database } from "@/types/supabase";

type AssetsPageProps = {
  userId: string;
  userEmail: string;
};

type AssetRow = Database["public"]["Tables"]["assets"]["Row"];

type AssetDraft = {
  asset_name: string;
  business_id: string;
  purchase_date: string;
  cost: string;
  business_use_percent: string;
  asset_category: string;
  notes: string;
};

const emptyDraft: AssetDraft = {
  asset_name: "",
  business_id: "",
  purchase_date: getLocalDateInputValue(),
  cost: "",
  business_use_percent: "100",
  asset_category: "equipment",
  notes: "",
};

function createDraftFromRow(row: AssetRow): AssetDraft {
  return {
    asset_name: row.asset_name,
    business_id: row.business_id,
    purchase_date: row.purchase_date,
    cost: String(row.cost),
    business_use_percent: String(row.business_use_percent),
    asset_category: row.asset_category,
    notes: row.notes ?? "",
  };
}

export function AssetsPage({ userId, userEmail }: AssetsPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const assetsQuery = useQuery({
    queryKey: ["asset-entries"],
    queryFn: () => listRows("assets", { orderBy: "purchase_date", ascending: false }),
  });

  const businesses = referenceQuery.data?.businesses ?? [];
  const entries = assetsQuery.data ?? [];

  const [draft, setDraft] = useState<AssetDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<AssetRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cost = Number(draft.cost || 0);
  const businessUsePercent = Number(draft.business_use_percent || 0);
  const businessUseAmount = calculateBusinessUseAmount(cost, businessUsePercent);

  const totalCost = sumBy(entries, (entry) => entry.cost);
  const totalBusinessUse = sumBy(entries, (entry) => entry.business_use_amount);

  const saveMutation = useMutation({
    mutationFn: async () =>
      upsertRow("assets", {
        id: editingRow?.id,
        user_id: userId,
        business_id: draft.business_id,
        asset_name: draft.asset_name.trim(),
        purchase_date: draft.purchase_date,
        cost,
        business_use_percent: businessUsePercent,
        business_use_amount: businessUseAmount,
        asset_category: draft.asset_category.trim(),
        notes: draft.notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success(editingRow ? "Asset updated." : "Asset created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["asset-entries"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save asset entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("assets", id),
    onSuccess: () => {
      toast.success("Asset deleted.");
      queryClient.invalidateQueries({ queryKey: ["asset-entries"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete asset entry.");
    },
  });

  function openCreateDialog() {
    setEditingRow(null);
    setDraft({
      ...emptyDraft,
      business_id: businesses[0]?.id ?? "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(row: AssetRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.business_id || !draft.asset_name.trim() || cost <= 0) {
      toast.error("Complete the required asset fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Assets / Equipment"
      subtitle="Track larger business purchases separately so durable equipment remains visible across the year."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Asset cost" value={formatCurrency(totalCost)} />
          <MetricCard label="Business-use amount" value={formatCurrency(totalBusinessUse)} tone="positive" />
          <MetricCard label="Tracked assets" value={String(entries.length)} />
        </div>

        <SectionCard
          title="Asset register"
          description="Use this page for computers, monitors, desks, webcams, and other larger business purchases."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add asset
            </Button>
          }
        >
          {entries.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Purchase date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Business use</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.asset_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.notes ?? "No notes"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {businesses.find((business) => business.id === entry.business_id)?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell>{formatDate(entry.purchase_date)}</TableCell>
                    <TableCell>{entry.asset_category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.cost, true)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(entry.business_use_amount, true)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No assets recorded yet" description="Add equipment purchases here to keep them separate from your regular expense ledger." />
          )}
        </SectionCard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit asset" : "Create asset"}</DialogTitle>
            <DialogDescription>
              Business-use amount is calculated automatically from the cost and business-use percentage.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset_name">Asset name</Label>
                <Input
                  id="asset_name"
                  value={draft.asset_name}
                  onChange={(event) => setDraft((current) => ({ ...current, asset_name: event.target.value }))}
                  placeholder="Computer, monitor, webcam"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Business</Label>
                <Select
                  value={draft.business_id}
                  onValueChange={(value) => setDraft((current) => ({ ...current, business_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={draft.purchase_date}
                  onChange={(event) => setDraft((current) => ({ ...current, purchase_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_category">Category</Label>
                <Input
                  id="asset_category"
                  value={draft.asset_category}
                  onChange={(event) => setDraft((current) => ({ ...current, asset_category: event.target.value }))}
                  placeholder="equipment"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.cost}
                  onChange={(event) => setDraft((current) => ({ ...current, cost: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_use_percent">Business-use percent</Label>
                <Input
                  id="business_use_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={draft.business_use_percent}
                  onChange={(event) => setDraft((current) => ({ ...current, business_use_percent: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-sm text-muted-foreground">Business-use amount</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(businessUseAmount, true)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional serial number, model, or context"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
