"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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
import { toast } from "@/components/ui/sonner";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { EmptyState } from "@/features/admin/components/empty-state";
import { SectionCard } from "@/features/admin/components/section-card";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_PERSONAL_CATEGORIES } from "@/features/admin/config/defaults";
import { useAdminReferenceData } from "@/features/admin/hooks/use-admin-reference-data";
import { upsertRow } from "@/features/admin/lib/data-client";
import type { Database } from "@/types/supabase";

type SettingsPageProps = {
  userId: string;
  userEmail: string;
};

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];

type SettingsDraft = {
  full_name: string;
  username: string;
  home_state: string;
  current_state: string;
  default_mileage_rate: string;
  tutoring_tax_reserve_percent: string;
  consulting_tax_reserve_percent: string;
  other_tax_reserve_percent: string;
  w2_annual_income: string;
  w2_annual_tax_withheld: string;
};

type BusinessDraft = {
  name: string;
  slug: string;
  business_kind: "tutoring" | "consulting" | "other";
  default_tax_reserve_percent: string;
  is_active: boolean;
};

const emptyBusinessDraft: BusinessDraft = {
  name: "",
  slug: "",
  business_kind: "other",
  default_tax_reserve_percent: "25",
  is_active: true,
};

function buildSettingsDraft(data: ReturnType<typeof useAdminReferenceData>["data"]): SettingsDraft {
  return {
    full_name: data?.profile?.full_name ?? "",
    username: data?.profile?.username ?? "",
    home_state: data?.profile?.home_state ?? data?.settings?.home_state ?? "",
    current_state: data?.profile?.current_state ?? data?.settings?.current_state ?? "",
    default_mileage_rate: String(data?.settings?.default_mileage_rate ?? 0),
    tutoring_tax_reserve_percent: String(data?.settings?.tutoring_tax_reserve_percent ?? 30),
    consulting_tax_reserve_percent: String(data?.settings?.consulting_tax_reserve_percent ?? 30),
    other_tax_reserve_percent: String(data?.settings?.other_tax_reserve_percent ?? 25),
    w2_annual_income: data?.settings?.w2_annual_income ? String(data.settings.w2_annual_income) : "",
    w2_annual_tax_withheld: data?.settings?.w2_annual_tax_withheld
      ? String(data.settings.w2_annual_tax_withheld)
      : "",
  };
}

function createBusinessDraftFromRow(row: BusinessRow): BusinessDraft {
  return {
    name: row.name,
    slug: row.slug,
    business_kind: row.business_kind,
    default_tax_reserve_percent: String(row.default_tax_reserve_percent),
    is_active: row.is_active,
  };
}

export function SettingsPage({ userId, userEmail }: SettingsPageProps) {
  const queryClient = useQueryClient();
  const referenceQuery = useAdminReferenceData();
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(buildSettingsDraft(referenceQuery.data));
  const [businessDraft, setBusinessDraft] = useState<BusinessDraft>(emptyBusinessDraft);
  const [editingBusiness, setEditingBusiness] = useState<BusinessRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (referenceQuery.data) {
      setSettingsDraft(buildSettingsDraft(referenceQuery.data));
    }
  }, [referenceQuery.data]);

  const settingsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        upsertRow("profiles", {
          id: userId,
          full_name: settingsDraft.full_name.trim() || null,
          username: settingsDraft.username.trim() || null,
          home_state: settingsDraft.home_state.trim() || null,
          current_state: settingsDraft.current_state.trim() || null,
          email: referenceQuery.data?.profile?.email ?? userEmail,
        }),
        upsertRow("user_settings", {
          id: referenceQuery.data?.settings?.id,
          user_id: userId,
          default_mileage_rate: Number(settingsDraft.default_mileage_rate || 0),
          tutoring_tax_reserve_percent: Number(settingsDraft.tutoring_tax_reserve_percent || 0),
          consulting_tax_reserve_percent: Number(settingsDraft.consulting_tax_reserve_percent || 0),
          other_tax_reserve_percent: Number(settingsDraft.other_tax_reserve_percent || 0),
          w2_annual_income: settingsDraft.w2_annual_income ? Number(settingsDraft.w2_annual_income) : null,
          w2_annual_tax_withheld: settingsDraft.w2_annual_tax_withheld
            ? Number(settingsDraft.w2_annual_tax_withheld)
            : null,
          home_state: settingsDraft.home_state.trim() || null,
          current_state: settingsDraft.current_state.trim() || null,
        }),
      ]);
    },
    onSuccess: () => {
      toast.success("Settings updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-reference-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-page-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    },
  });

  const businessMutation = useMutation({
    mutationFn: async () =>
      upsertRow("businesses", {
        id: editingBusiness?.id,
        user_id: userId,
        name: businessDraft.name.trim(),
        slug: businessDraft.slug.trim(),
        business_kind: businessDraft.business_kind,
        default_tax_reserve_percent: Number(businessDraft.default_tax_reserve_percent || 0),
        is_active: businessDraft.is_active,
      }),
    onSuccess: () => {
      toast.success(editingBusiness ? "Business updated." : "Business created.");
      setDialogOpen(false);
      setEditingBusiness(null);
      setBusinessDraft(emptyBusinessDraft);
      queryClient.invalidateQueries({ queryKey: ["admin-reference-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save business.");
    },
  });

  function openCreateBusinessDialog() {
    setEditingBusiness(null);
    setBusinessDraft(emptyBusinessDraft);
    setDialogOpen(true);
  }

  function openEditBusinessDialog(row: BusinessRow) {
    setEditingBusiness(row);
    setBusinessDraft(createBusinessDraftFromRow(row));
    setDialogOpen(true);
  }

  async function handleBusinessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!businessDraft.name.trim() || !businessDraft.slug.trim()) {
      toast.error("Business name and slug are required.");
      return;
    }

    await businessMutation.mutateAsync();
  }

  return (
    <AdminShell
      title="Settings"
      subtitle="Manage your profile, paycheck context, trip defaults, savings suggestions, and active business lines from one place."
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <SectionCard
          title="Profile and defaults"
          description="These values prefill forms and help the dashboard estimate your year-to-date picture. They are editable at any time."
        >
          <form
            className="grid gap-5 lg:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              settingsMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={settingsDraft.full_name}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, full_name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={settingsDraft.username}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, username: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_state">Home state</Label>
              <Input
                id="home_state"
                value={settingsDraft.home_state}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, home_state: event.target.value }))}
                placeholder="MN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_state">Current state</Label>
              <Input
                id="current_state"
                value={settingsDraft.current_state}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, current_state: event.target.value }))}
                placeholder="TX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_mileage_rate">Custom mileage rate override</Label>
              <Input
                id="default_mileage_rate"
                type="number"
                min="0"
                step="0.0001"
                value={settingsDraft.default_mileage_rate}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, default_mileage_rate: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave this at 0 to use the IRS business mileage rate automatically by trip year. Only fill it in if you want the app to use your own override instead.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="w2_annual_income">W-2 yearly salary or expected pay</Label>
              <Input
                id="w2_annual_income"
                type="number"
                min="0"
                step="0.01"
                value={settingsDraft.w2_annual_income}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, w2_annual_income: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Example: enter 80000 if your W-2 job pays about $80,000 per year. The dashboard uses this to estimate your W-2 income across the year.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="w2_annual_tax_withheld">Estimated taxes already taken from W-2 paychecks</Label>
              <Input
                id="w2_annual_tax_withheld"
                type="number"
                min="0"
                step="0.01"
                value={settingsDraft.w2_annual_tax_withheld}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, w2_annual_tax_withheld: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                This is optional. If payroll is already withholding taxes, put your rough yearly total here so the dashboard can show taxes already being covered by your W-2 job.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutoring_tax_reserve_percent">Tutoring save-for-taxes suggestion</Label>
              <Input
                id="tutoring_tax_reserve_percent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={settingsDraft.tutoring_tax_reserve_percent}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, tutoring_tax_reserve_percent: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                This is just the suggested percentage the app drops into new tax-reserve entries for tutoring income. It does not file taxes or force a payment.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consulting_tax_reserve_percent">Consulting save-for-taxes suggestion</Label>
              <Input
                id="consulting_tax_reserve_percent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={settingsDraft.consulting_tax_reserve_percent}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, consulting_tax_reserve_percent: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Use the percentage you personally want the app to suggest when you log reserve transfers for consulting income.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_tax_reserve_percent">Other business save-for-taxes suggestion</Label>
              <Input
                id="other_tax_reserve_percent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={settingsDraft.other_tax_reserve_percent}
                onChange={(event) => setSettingsDraft((current) => ({ ...current, other_tax_reserve_percent: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                This works the same way for any additional self-employment income stream you add later.
              </p>
            </div>

            <div className="lg:col-span-2">
              <Button type="submit" disabled={settingsMutation.isPending}>
                {settingsMutation.isPending ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Businesses"
          description="Manage tutoring, consulting, and any other self-employment business lines used throughout the app."
          action={
            <Button onClick={openCreateBusinessDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add business
            </Button>
          }
        >
          {referenceQuery.data?.businesses.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Reserve default</TableHead>
                  <TableHead>Status</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referenceQuery.data.businesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>{business.name}</TableCell>
                    <TableCell>{business.slug}</TableCell>
                    <TableCell>{business.business_kind}</TableCell>
                    <TableCell className="text-right">{business.default_tax_reserve_percent.toFixed(0)}%</TableCell>
                    <TableCell>{business.is_active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditBusinessDialog(business)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No businesses configured yet" description="Add a business here to make it available across income, expenses, mileage, and reserves." />
          )}
        </SectionCard>

        <SectionCard title="Standardized categories" description="This version keeps categories standardized for reporting consistency.">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Income</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {DEFAULT_INCOME_CATEGORIES.map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">Expenses</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {DEFAULT_EXPENSE_CATEGORIES.map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">Personal cash flow</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {DEFAULT_PERSONAL_CATEGORIES.map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/70 bg-card">
          <DialogHeader>
            <DialogTitle>{editingBusiness ? "Edit business" : "Create business"}</DialogTitle>
            <DialogDescription>
              Business names and kinds drive reporting breakdowns across the rest of the admin app.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleBusinessSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  value={businessDraft.name}
                  onChange={(event) => setBusinessDraft((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_slug">Slug</Label>
                <Input
                  id="business_slug"
                  value={businessDraft.slug}
                  onChange={(event) => setBusinessDraft((current) => ({ ...current, slug: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Business kind</Label>
                <Select
                  value={businessDraft.business_kind}
                  onValueChange={(value: BusinessDraft["business_kind"]) =>
                    setBusinessDraft((current) => ({ ...current, business_kind: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a kind" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutoring">tutoring</SelectItem>
                    <SelectItem value="consulting">consulting</SelectItem>
                    <SelectItem value="other">other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_reserve_percent">Suggested save-for-taxes percent</Label>
                <Input
                  id="business_reserve_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={businessDraft.default_tax_reserve_percent}
                  onChange={(event) => setBusinessDraft((current) => ({ ...current, default_tax_reserve_percent: event.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                <input
                  id="business_is_active"
                  type="checkbox"
                  checked={businessDraft.is_active}
                  onChange={(event) => setBusinessDraft((current) => ({ ...current, is_active: event.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="business_is_active" className="text-sm">
                  Active business
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={businessMutation.isPending}>
                {businessMutation.isPending ? "Saving..." : editingBusiness ? "Save changes" : "Create business"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
