"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { toast } from "@/components/ui/sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { MetricCard } from "@/features/admin/components/metric-card";
import { SectionCard } from "@/features/admin/components/section-card";
import { getTaxPeriod, sumBy } from "@/features/admin/lib/calculations";
import { deleteRow, listRows, upsertRow } from "@/features/admin/lib/data-client";
import { formatCurrency, formatDate } from "@/features/admin/lib/format";
import type { Database } from "@/types/supabase";

type W2PaychecksPageProps = {
  userId: string;
  userEmail: string;
};

type W2PaycheckRow = Database["public"]["Tables"]["w2_paychecks"]["Row"];

type W2PaycheckDraft = {
  pay_date: string;
  employer: string;
  gross_pay: string;
  federal_tax_withheld: string;
  state_tax_withheld: string;
  social_security_withheld: string;
  medicare_withheld: string;
  other_pre_tax_deductions: string;
  other_post_tax_deductions: string;
  net_pay: string;
  state_code: string;
  notes: string;
};

const emptyDraft: W2PaycheckDraft = {
  pay_date: new Date().toISOString().slice(0, 10),
  employer: "",
  gross_pay: "",
  federal_tax_withheld: "0",
  state_tax_withheld: "0",
  social_security_withheld: "0",
  medicare_withheld: "0",
  other_pre_tax_deductions: "0",
  other_post_tax_deductions: "0",
  net_pay: "",
  state_code: "",
  notes: "",
};

function createDraftFromRow(row: W2PaycheckRow): W2PaycheckDraft {
  return {
    pay_date: row.pay_date,
    employer: row.employer,
    gross_pay: String(row.gross_pay),
    federal_tax_withheld: String(row.federal_tax_withheld),
    state_tax_withheld: String(row.state_tax_withheld),
    social_security_withheld: String(row.social_security_withheld),
    medicare_withheld: String(row.medicare_withheld),
    other_pre_tax_deductions: String(row.other_pre_tax_deductions),
    other_post_tax_deductions: String(row.other_post_tax_deductions),
    net_pay: String(row.net_pay),
    state_code: row.state_code ?? "",
    notes: row.notes ?? "",
  };
}

export function W2PaychecksPage({ userId, userEmail }: W2PaychecksPageProps) {
  const queryClient = useQueryClient();
  const w2Query = useQuery({
    queryKey: ["w2-paychecks"],
    queryFn: () => listRows("w2_paychecks", { orderBy: "pay_date", ascending: false }),
  });

  const [draft, setDraft] = useState<W2PaycheckDraft>(emptyDraft);
  const [editingRow, setEditingRow] = useState<W2PaycheckRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const entries = w2Query.data ?? [];
  const grossPay = Number(draft.gross_pay || 0);
  const federalTaxWithheld = Number(draft.federal_tax_withheld || 0);
  const stateTaxWithheld = Number(draft.state_tax_withheld || 0);
  const socialSecurityWithheld = Number(draft.social_security_withheld || 0);
  const medicareWithheld = Number(draft.medicare_withheld || 0);
  const otherPreTaxDeductions = Number(draft.other_pre_tax_deductions || 0);
  const otherPostTaxDeductions = Number(draft.other_post_tax_deductions || 0);
  const netPay = Number(draft.net_pay || 0);

  const filteredEntries = entries.filter((entry) => {
    const matchesFromDate = !fromDate || entry.pay_date >= fromDate;
    const matchesToDate = !toDate || entry.pay_date <= toDate;
    const matchesState = !stateFilter || (entry.state_code ?? "").toUpperCase() === stateFilter.toUpperCase();

    return matchesFromDate && matchesToDate && matchesState;
  });

  const grossTotal = sumBy(filteredEntries, (entry) => entry.gross_pay);
  const netTotal = sumBy(filteredEntries, (entry) => entry.net_pay);
  const federalWithheldTotal = sumBy(filteredEntries, (entry) => entry.federal_tax_withheld);
  const stateWithheldTotal = sumBy(filteredEntries, (entry) => entry.state_tax_withheld);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const taxPeriod = getTaxPeriod(draft.pay_date);

      return upsertRow("w2_paychecks", {
        id: editingRow?.id,
        user_id: userId,
        pay_date: draft.pay_date,
        employer: draft.employer.trim(),
        gross_pay: grossPay,
        federal_tax_withheld: federalTaxWithheld,
        state_tax_withheld: stateTaxWithheld,
        social_security_withheld: socialSecurityWithheld,
        medicare_withheld: medicareWithheld,
        other_pre_tax_deductions: otherPreTaxDeductions,
        other_post_tax_deductions: otherPostTaxDeductions,
        net_pay: netPay,
        state_code: draft.state_code.trim().toUpperCase() || null,
        notes: draft.notes.trim() || null,
        tax_year: taxPeriod.taxYear,
        tax_quarter: taxPeriod.taxQuarter,
      });
    },
    onSuccess: () => {
      toast.success(editingRow ? "W-2 paycheck updated." : "W-2 paycheck created.");
      setDialogOpen(false);
      setEditingRow(null);
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["w2-paychecks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save W-2 paycheck.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRow("w2_paychecks", id),
    onSuccess: () => {
      toast.success("W-2 paycheck deleted.");
      queryClient.invalidateQueries({ queryKey: ["w2-paychecks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
      queryClient.invalidateQueries({ queryKey: ["tax-planning-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete W-2 paycheck.");
    },
  });

  function openCreateDialog() {
    setEditingRow(null);
    setDraft(emptyDraft);
    setDialogOpen(true);
  }

  function openEditDialog(row: W2PaycheckRow) {
    setEditingRow(row);
    setDraft(createDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.pay_date || !draft.employer.trim() || grossPay <= 0 || netPay <= 0) {
      toast.error("Complete the required W-2 paycheck fields before saving.");
      return;
    }

    await saveMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="W-2 Paychecks"
      subtitle="Track each paycheck with gross pay, take-home pay, and the withholding amounts that matter for year-round planning."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Gross pay" value={formatCurrency(grossTotal)} />
          <MetricCard label="Take-home pay" value={formatCurrency(netTotal)} tone="positive" />
          <MetricCard label="Federal withholding" value={formatCurrency(federalWithheldTotal)} />
          <MetricCard label="State withholding" value={formatCurrency(stateWithheldTotal)} />
        </div>

        <SectionCard
          title="Paycheck ledger"
          description="Enter each paycheck as it happens so your dashboard and tax-planning views use real payroll data instead of yearly assumptions."
          action={
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add paycheck
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <Input
              placeholder="Filter by state code"
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              maxLength={2}
            />
          </div>

          <div className="mt-6">
            {filteredEntries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Federal</TableHead>
                    <TableHead className="text-right">State</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.pay_date)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.employer}</p>
                          <p className="text-xs text-muted-foreground">
                            Q{entry.tax_quarter} {entry.tax_year}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{entry.state_code ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.gross_pay, true)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.federal_tax_withheld, true)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.state_tax_withheld, true)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(entry.net_pay, true)}</TableCell>
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
              <EmptyState
                title="No W-2 paychecks yet"
                description="Add each paycheck from 2026 onward so the app can track real payroll cash flow and withholding."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit W-2 paycheck" : "Create W-2 paycheck"}</DialogTitle>
            <DialogDescription>
              Store gross pay, withholding, and net pay separately so the dashboard can track both cash flow and tax coverage.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pay_date">Pay date</Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={draft.pay_date}
                  onChange={(event) => setDraft((current) => ({ ...current, pay_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer">Employer</Label>
                <Input
                  id="employer"
                  value={draft.employer}
                  onChange={(event) => setDraft((current) => ({ ...current, employer: event.target.value }))}
                  placeholder="Employer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross_pay">Gross pay</Label>
                <Input
                  id="gross_pay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.gross_pay}
                  onChange={(event) => setDraft((current) => ({ ...current, gross_pay: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_pay">Take-home pay</Label>
                <Input
                  id="net_pay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.net_pay}
                  onChange={(event) => setDraft((current) => ({ ...current, net_pay: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="federal_tax_withheld">Federal tax withheld</Label>
                <Input
                  id="federal_tax_withheld"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.federal_tax_withheld}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, federal_tax_withheld: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_tax_withheld">State tax withheld</Label>
                <Input
                  id="state_tax_withheld"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.state_tax_withheld}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, state_tax_withheld: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_security_withheld">Social Security withheld</Label>
                <Input
                  id="social_security_withheld"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.social_security_withheld}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, social_security_withheld: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicare_withheld">Medicare withheld</Label>
                <Input
                  id="medicare_withheld"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.medicare_withheld}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, medicare_withheld: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_pre_tax_deductions">Other pre-tax deductions</Label>
                <Input
                  id="other_pre_tax_deductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.other_pre_tax_deductions}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, other_pre_tax_deductions: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_post_tax_deductions">Other post-tax deductions</Label>
                <Input
                  id="other_post_tax_deductions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.other_post_tax_deductions}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, other_post_tax_deductions: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_code">State code on paycheck</Label>
                <Input
                  id="state_code"
                  value={draft.state_code}
                  onChange={(event) => setDraft((current) => ({ ...current, state_code: event.target.value }))}
                  placeholder="MN or TX"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="w2_notes">Notes</Label>
                <Textarea
                  id="w2_notes"
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional notes like bonus, off-cycle paycheck, or state-change context"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingRow ? "Save changes" : "Create paycheck"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

