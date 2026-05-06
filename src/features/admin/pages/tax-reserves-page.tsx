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
import { calculateReserveAmount, getTaxPeriod, sumBy } from "@/features/admin/lib/calculations";
import { getLocalDateInputValue } from "@/features/admin/lib/date";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import type { Database } from "@/types/supabase";

type TaxReservesPageProps = {
  userId: string;
  userEmail: string;
};

type TaxReserveRow = Database["public"]["Tables"]["tax_reserves"]["Row"];
type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];

type TaxReserveDraft = {
  reserve_date: string;
  business_id: string;
  source_income_amount: string;
  reserve_percent: string;
  was_transferred: boolean;
  counts_as_federal_estimated_payment: boolean;
  counts_as_state_estimated_payment: boolean;
  destination_account: string;
  notes: string;
};

const emptyDraft: TaxReserveDraft = {
  reserve_date: getLocalDateInputValue(),
  business_id: "",
  source_income_amount: "",
  reserve_percent: "0",
  was_transferred: false,
  counts_as_federal_estimated_payment: false,
  counts_as_state_estimated_payment: false,
  destination_account: "",
  notes: "",
};

function createDraftFromRow(row: TaxReserveRow): TaxReserveDraft {
  return {
    reserve_date: row.reserve_date,
    business_id: row.business_id,
    source_income_amount: String(row.source_income_amount),
    reserve_percent: String(row.reserve_percent),
    was_transferred: row.was_transferred,
    counts_as_federal_estimated_payment: row.counts_as_federal_estimated_payment,
    counts_as_state_estimated_payment: row.counts_as_state_estimated_payment,
    destination_account: row.destination_account ?? "",
    notes: row.notes ?? "",
  };
}

function getBusinessDefaultPercent(businesses: BusinessRow[], businessId: string) {
  return businesses.find((business) => business.id === businessId)?.default_tax_reserve_percent ?? 0;
}

export function TaxReservesPage({ userId, userEmail }: TaxReservesPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const taxReserveQuery = useQuery({
    queryKey: ["tax-reserve-entries"],
    queryFn: () => listRows("tax_reserves", { orderBy: "reserve_date", ascending: false }),
  });

  const businesses = referenceQuery.data?.businesses ?? [];
  const entries = taxReserveQuery.data ?? [];

  const [draft, setDraft] = useState<TaxReserveDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<TaxReserveRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");

  const sourceIncomeAmount = Number(draft.source_income_amount || 0);
  const reservePercent = Number(draft.reserve_percent || 0);
  const reserveAmount = calculateReserveAmount(sourceIncomeAmount, reservePercent);

  const filteredEntries = entries.filter((entry) => {
    const matchesBusiness = businessFilter === "all" || entry.business_id === businessFilter;
    const matchesQuarter = quarterFilter === "all" || String(entry.tax_quarter) === quarterFilter;

    return matchesBusiness && matchesQuarter;
  });

  const totalTarget = sumBy(filteredEntries, (entry) => entry.reserve_amount);
  const totalTransferred = sumBy(
    filteredEntries.filter((entry) => entry.was_transferred),
    (entry) => entry.reserve_amount,
  );
  const currentYear = new Date().getFullYear();
  const yearToDateEntries = entries.filter((entry) => entry.tax_year === currentYear);
  const quarterSummaries = [1, 2, 3, 4].map((quarter) => {
    const quarterEntries = yearToDateEntries.filter((entry) => entry.tax_quarter === quarter);
    return {
      quarter,
      target: sumBy(quarterEntries, (entry) => entry.reserve_amount),
      transferred: sumBy(quarterEntries.filter((entry) => entry.was_transferred), (entry) => entry.reserve_amount),
    };
  }).filter((item) => item.target > 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const taxPeriod = getTaxPeriod(draft.reserve_date);

      return upsertRow("tax_reserves", {
        id: editingRow?.id,
        user_id: userId,
        business_id: draft.business_id,
        reserve_date: draft.reserve_date,
        source_income_amount: sourceIncomeAmount,
        reserve_percent: reservePercent,
        reserve_amount: reserveAmount,
        was_transferred: draft.was_transferred,
        counts_as_federal_estimated_payment: draft.counts_as_federal_estimated_payment,
        counts_as_state_estimated_payment: draft.counts_as_state_estimated_payment,
        destination_account: draft.destination_account.trim() || null,
        notes: draft.notes.trim() || null,
        tax_year: taxPeriod.taxYear,
        tax_quarter: taxPeriod.taxQuarter,
      });
    },
    onSuccess: () => {
      toast.success(editingRow ? "Tax reserve entry updated." : "Tax reserve entry created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["tax-reserve-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save tax reserve entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("tax_reserves", id),
    onSuccess: () => {
      toast.success("Tax reserve entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["tax-reserve-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete tax reserve entry.");
    },
  });

  function openCreateDialog() {
    const defaultBusiness = businesses[0];
    setEditingRow(null);
    setDraft({
      ...emptyDraft,
      business_id: defaultBusiness?.id ?? "",
      reserve_percent: String(defaultBusiness ? defaultBusiness.default_tax_reserve_percent : 0),
    });
    setDialogOpen(true);
  }

  function openEditDialog(row: TaxReserveRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.business_id || sourceIncomeAmount <= 0 || reservePercent < 0) {
      toast.error("Complete the required tax reserve fields before saving.");
      return;
    }

    if (
      (draft.counts_as_federal_estimated_payment || draft.counts_as_state_estimated_payment) &&
      !draft.was_transferred
    ) {
      toast.error("Mark the amount as actually transferred before counting it as a federal or state tax payment.");
      return;
    }

    if (draft.counts_as_federal_estimated_payment && draft.counts_as_state_estimated_payment) {
      toast.error("Split federal and state tax payments into separate reserve entries.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Tax Reserves"
      subtitle="Track what you plan to reserve from self-employment income and what you actually move into a reserve account."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Reserve target" value={formatCurrency(totalTarget)} />
          <MetricCard label="Transferred" value={formatCurrency(totalTransferred)} tone="positive" />
          <MetricCard label="Remaining gap" value={formatCurrency(Math.max(totalTarget - totalTransferred, 0))} tone="warning" />
        </div>

        <SectionCard
          title="Reserve ledger"
          description="Suggested reserve amounts are calculated automatically from the source income and reserve percentage. Mark entries as federal or state payments when money is actually sent to the IRS or Minnesota."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add reserve
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Select value={businessFilter} onValueChange={setBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All businesses</SelectItem>
                {businesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={quarterFilter} onValueChange={setQuarterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All quarters</SelectItem>
                {[1, 2, 3, 4].map((quarter) => (
                  <SelectItem key={quarter} value={String(quarter)}>
                    Quarter {quarter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6">
            {filteredEntries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead className="text-right">Source income</TableHead>
                    <TableHead className="text-right">Percent</TableHead>
                    <TableHead className="text-right">Reserve amount</TableHead>
                    <TableHead>Transferred</TableHead>
                    <TableHead>Applied to tax</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.reserve_date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {businesses.find((business) => business.id === entry.business_id)?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Q{entry.tax_quarter} {entry.tax_year}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.source_income_amount, true)}</TableCell>
                      <TableCell className="text-right">{entry.reserve_percent.toFixed(0)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.reserve_amount, true)}</TableCell>
                      <TableCell>{entry.was_transferred ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {entry.counts_as_federal_estimated_payment && entry.counts_as_state_estimated_payment ? (
                          <span className="text-xs text-amber-600">Split entry required</span>
                        ) : entry.counts_as_federal_estimated_payment || entry.counts_as_state_estimated_payment ? (
                          <div className="text-xs text-muted-foreground">
                            {entry.counts_as_federal_estimated_payment ? "Federal" : null}
                            {entry.counts_as_federal_estimated_payment && entry.counts_as_state_estimated_payment ? " + " : null}
                            {entry.counts_as_state_estimated_payment ? "State" : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reserve only</span>
                        )}
                      </TableCell>
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
              <EmptyState title="No reserve entries yet" description="Create a reserve target to track what should be set aside and what was actually transferred." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Quarterly summary">
          <div className="space-y-3">
            {quarterSummaries.length ? (
              quarterSummaries.map((item) => (
                <div key={item.quarter} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <div>
                    <p className="font-medium">Quarter {item.quarter}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.transferred)} transferred</p>
                  </div>
                  <span>{formatCurrency(item.target)}</span>
                </div>
              ))
            ) : (
              <EmptyState title="No quarterly summary yet" description="Quarterly reserve summaries appear here once reserve entries are recorded." />
            )}
          </div>
        </SectionCard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit tax reserve entry" : "Create tax reserve entry"}</DialogTitle>
            <DialogDescription>
              Use this page for both reserve transfers and actual quarterly tax payments. Reserve entries can stay informational until you mark them as actual federal or state payments.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reserve_date">Date</Label>
                <Input
                  id="reserve_date"
                  type="date"
                  value={draft.reserve_date}
                  onChange={(event) => setDraft((current) => ({ ...current, reserve_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Business</Label>
                <Select
                  value={draft.business_id}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      business_id: value,
                      reserve_percent: String(getBusinessDefaultPercent(businesses, value)),
                    }))
                  }
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
                <Label htmlFor="source_income_amount">Source income amount</Label>
                <Input
                  id="source_income_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.source_income_amount}
                  onChange={(event) => setDraft((current) => ({ ...current, source_income_amount: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserve_percent">Reserve percent</Label>
                <Input
                  id="reserve_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={draft.reserve_percent}
                  onChange={(event) => setDraft((current) => ({ ...current, reserve_percent: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination_account">Destination account</Label>
                <Input
                  id="destination_account"
                  value={draft.destination_account}
                  onChange={(event) => setDraft((current) => ({ ...current, destination_account: event.target.value }))}
                  placeholder="Savings account or reserve bucket"
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                <input
                  id="was_transferred"
                  type="checkbox"
                  checked={draft.was_transferred}
                  onChange={(event) => setDraft((current) => ({ ...current, was_transferred: event.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="was_transferred" className="text-sm">
                  Amount was actually transferred
                </Label>
              </div>
              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-4">
                <p className="text-sm font-medium">Count this toward quarterly tax payments</p>
                <div className="flex items-center gap-3">
                  <input
                    id="counts_as_federal_estimated_payment"
                    type="checkbox"
                    checked={draft.counts_as_federal_estimated_payment}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        counts_as_federal_estimated_payment: event.target.checked,
                        counts_as_state_estimated_payment: event.target.checked ? false : current.counts_as_state_estimated_payment,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="counts_as_federal_estimated_payment" className="text-sm">
                    This payment went to the IRS
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="counts_as_state_estimated_payment"
                    type="checkbox"
                    checked={draft.counts_as_state_estimated_payment}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        counts_as_state_estimated_payment: event.target.checked,
                        counts_as_federal_estimated_payment: event.target.checked ? false : current.counts_as_federal_estimated_payment,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="counts_as_state_estimated_payment" className="text-sm">
                    This payment went to a state tax agency
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave both unchecked if the money only moved into a savings bucket and has not been paid out yet. If you paid both the IRS and a state agency, record those as separate entries.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-sm text-muted-foreground">Suggested reserve amount</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(reserveAmount, true)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional context such as client invoice or transfer note"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create reserve"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
