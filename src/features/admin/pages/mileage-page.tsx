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
import { useAdminPreference, usePreferredOptions } from "@/features/admin/hooks/use-admin-preferences";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { calculateMileageValue, getTaxPeriod, sumBy } from "@/features/admin/lib/calculations";
import { getDateMonth, getDateYear, getLocalDateInputValue } from "@/features/admin/lib/date";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import { getFederalBusinessMileageRate } from "@/features/admin/lib/tax-planning";
import type { Database } from "@/types/supabase";

type MileagePageProps = {
  userId: string;
  userEmail: string;
};

type MileageRow = Database["public"]["Tables"]["mileage_entries"]["Row"];

type MileageDraft = {
  trip_date: string;
  business_id: string;
  purpose: string;
  origin_location: string;
  destination_location: string;
  miles: string;
  mileage_rate: string;
  is_round_trip: boolean;
  notes: string;
};

const emptyDraft: MileageDraft = {
  trip_date: getLocalDateInputValue(),
  business_id: "",
  purpose: "",
  origin_location: "",
  destination_location: "",
  miles: "",
  mileage_rate: "0",
  is_round_trip: false,
  notes: "",
};

function createDraftFromRow(row: MileageRow): MileageDraft {
  return {
    trip_date: row.trip_date,
    business_id: row.business_id,
    purpose: row.purpose,
    origin_location: row.origin_location,
    destination_location: row.destination_location,
    miles: String(row.miles),
    mileage_rate: String(row.mileage_rate),
    is_round_trip: row.is_round_trip,
    notes: row.notes ?? "",
  };
}

export function MileagePage({ userId, userEmail }: MileagePageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const mileageQuery = useQuery({
    queryKey: ["mileage-entries"],
    queryFn: () => listRows("mileage_entries", { orderBy: "trip_date", ascending: false }),
  });

  const businesses = referenceQuery.data?.businesses ?? [];
  const { storedValue: preferredBusinessId, rememberValue: rememberBusinessId } = useAdminPreference("mileage.business_id");
  const orderedBusinesses = usePreferredOptions(businesses, (business) => business.id, preferredBusinessId);
  const mileageRateOverride = referenceQuery.data?.settings?.default_mileage_rate ?? 0;
  const currentYearMileageRate =
    mileageRateOverride > 0 ? mileageRateOverride : getFederalBusinessMileageRate(new Date().getFullYear());
  const entries = mileageQuery.data ?? [];

  const [draft, setDraft] = useState<MileageDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<MileageRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [businessFilter, setBusinessFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const miles = Number(draft.miles || 0);
  const mileageRate = Number(draft.mileage_rate || 0);
  const deductibleValue = calculateMileageValue(miles, mileageRate);

  const filteredEntries = entries.filter((entry) => {
    const matchesBusiness = businessFilter === "all" || entry.business_id === businessFilter;
    const matchesFromDate = !fromDate || entry.trip_date >= fromDate;
    const matchesToDate = !toDate || entry.trip_date <= toDate;

    return matchesBusiness && matchesFromDate && matchesToDate;
  });

  const totalMiles = sumBy(filteredEntries, (entry) => entry.miles);
  const totalDeductible = sumBy(filteredEntries, (entry) => entry.deductible_value);
  const monthlySummary = Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const monthEntries = filteredEntries.filter((entry) => getDateMonth(entry.trip_date) === monthNumber);

    return {
      label: new Date(Date.UTC(2025, index, 1)).toLocaleString("en-US", { month: "short" }),
      miles: sumBy(monthEntries, (entry) => entry.miles),
      deductible: sumBy(monthEntries, (entry) => entry.deductible_value),
    };
  }).filter((item) => item.miles > 0);

  const quarterlySummary = [1, 2, 3, 4].map((quarter) => {
    const quarterEntries = filteredEntries.filter((entry) => entry.tax_quarter === quarter);
    return {
      quarter,
      miles: sumBy(quarterEntries, (entry) => entry.miles),
      deductible: sumBy(quarterEntries, (entry) => entry.deductible_value),
    };
  }).filter((item) => item.miles > 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const taxPeriod = getTaxPeriod(draft.trip_date);

      return upsertRow("mileage_entries", {
        id: editingRow?.id,
        user_id: userId,
        business_id: draft.business_id,
        trip_date: draft.trip_date,
        purpose: draft.purpose.trim(),
        origin_location: draft.origin_location.trim(),
        destination_location: draft.destination_location.trim(),
        miles,
        mileage_rate: mileageRate,
        deductible_value: deductibleValue,
        is_round_trip: draft.is_round_trip,
        notes: draft.notes.trim() || null,
        tax_year: taxPeriod.taxYear,
        tax_quarter: taxPeriod.taxQuarter,
      });
    },
    onSuccess: () => {
      rememberBusinessId(draft.business_id);
      toast.success(editingRow ? "Mileage entry updated." : "Mileage entry created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["mileage-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save mileage entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("mileage_entries", id),
    onSuccess: () => {
      toast.success("Mileage entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["mileage-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete mileage entry.");
    },
  });

  function openCreateDialog() {
    const autoMileageRate =
      mileageRateOverride > 0 ? mileageRateOverride : getFederalBusinessMileageRate(new Date().getFullYear());
    const preferredBusiness = businesses.find((business) => business.id === preferredBusinessId);

    setEditingRow(null);
    setDraft({
      ...emptyDraft,
      business_id: preferredBusiness?.id ?? businesses[0]?.id ?? "",
      mileage_rate: String(autoMileageRate),
    });
    setDialogOpen(true);
  }

  function openEditDialog(row: MileageRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.business_id || !draft.purpose.trim() || !draft.origin_location.trim() || !draft.destination_location.trim() || miles <= 0) {
      toast.error("Complete the required mileage fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Mileage"
      subtitle="Maintain a detailed mileage log with editable rates, trip purposes, and automatic deductible-value calculations."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total miles" value={totalMiles.toFixed(1)} />
          <MetricCard label="Deductible value" value={formatCurrency(totalDeductible)} tone="positive" />
          <MetricCard
            label="IRS business mileage rate"
            value={currentYearMileageRate ? formatCurrency(currentYearMileageRate, true) : "Not set"}
            helper={
              mileageRateOverride > 0
                ? "New trips are currently using your custom mileage override from Settings"
                : "New trips auto-fill from the federal rate for the trip year"
            }
          />
        </div>

        <SectionCard
          title="Mileage log"
          description="The stored deductible value reflects the miles and rate captured on the entry date, not a later settings value."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add trip
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={businessFilter} onValueChange={setBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All businesses</SelectItem>
                {orderedBusinesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>

          <div className="mt-6">
            {filteredEntries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead className="text-right">Miles</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Deductible</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.trip_date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.purpose}</p>
                          <p className="text-xs text-muted-foreground">
                            Q{entry.tax_quarter} {entry.tax_year}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.origin_location} → {entry.destination_location}
                      </TableCell>
                      <TableCell>
                        {businesses.find((business) => business.id === entry.business_id)?.name ?? "Unknown"}
                      </TableCell>
                      <TableCell className="text-right">{entry.miles.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.mileage_rate, true)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.deductible_value, true)}</TableCell>
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
              <EmptyState title="No trips logged yet" description="Add a mileage entry to start building your business driving history." />
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Monthly summary">
            <div className="space-y-3">
              {monthlySummary.length ? (
                monthlySummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.miles.toFixed(1)} miles</p>
                    </div>
                    <span>{formatCurrency(item.deductible)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No monthly summary yet" description="Your monthly rollups appear here once trips are logged." />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Quarterly summary">
            <div className="space-y-3">
              {quarterlySummary.length ? (
                quarterlySummary.map((item) => (
                  <div key={item.quarter} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <div>
                      <p className="font-medium">Quarter {item.quarter}</p>
                      <p className="text-xs text-muted-foreground">{item.miles.toFixed(1)} miles</p>
                    </div>
                    <span>{formatCurrency(item.deductible)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No quarterly summary yet" description="Your quarterly rollups appear here once trips are logged." />
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit mileage entry" : "Create mileage entry"}</DialogTitle>
            <DialogDescription>
              Each trip stores its own mileage rate so historical entries remain stable even when the federal mileage rate changes in a later year.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trip_date">Date</Label>
                <Input
                  id="trip_date"
                  type="date"
                  value={draft.trip_date}
                  onChange={(event) =>
                    setDraft((current) => {
                      const nextDate = event.target.value;
                      const currentYearForDraft = getDateYear(current.trip_date);
                      const nextYear = getDateYear(nextDate);
                      const currentAutoMileageRate =
                        mileageRateOverride > 0
                          ? mileageRateOverride
                          : getFederalBusinessMileageRate(currentYearForDraft);
                      const autoMileageRate =
                        mileageRateOverride > 0 ? mileageRateOverride : getFederalBusinessMileageRate(nextYear);

                      return {
                        ...current,
                        trip_date: nextDate,
                        mileage_rate:
                          editingRow ||
                          (Number(current.mileage_rate || 0) > 0 &&
                            Number(current.mileage_rate || 0) !== currentAutoMileageRate)
                            ? current.mileage_rate
                            : String(autoMileageRate),
                      };
                    })
                  }
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
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={draft.purpose}
                  onChange={(event) => setDraft((current) => ({ ...current, purpose: event.target.value }))}
                  placeholder="Client meeting or office supply pickup"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="miles">Miles</Label>
                <Input
                  id="miles"
                  type="number"
                  min="0"
                  step="0.1"
                  value={draft.miles}
                  onChange={(event) => setDraft((current) => ({ ...current, miles: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin_location">From</Label>
                <Input
                  id="origin_location"
                  value={draft.origin_location}
                  onChange={(event) => setDraft((current) => ({ ...current, origin_location: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination_location">To</Label>
                <Input
                  id="destination_location"
                  value={draft.destination_location}
                  onChange={(event) => setDraft((current) => ({ ...current, destination_location: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage_rate">Mileage rate</Label>
                <Input
                  id="mileage_rate"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={draft.mileage_rate}
                  onChange={(event) => setDraft((current) => ({ ...current, mileage_rate: event.target.value }))}
                  required
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                <input
                  id="is_round_trip"
                  type="checkbox"
                  checked={draft.is_round_trip}
                  onChange={(event) => setDraft((current) => ({ ...current, is_round_trip: event.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="is_round_trip" className="text-sm">
                  Round trip
                </Label>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-sm text-muted-foreground">Deductible value</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(deductibleValue, true)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Optional route or client context"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
