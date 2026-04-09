"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  X,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useFinancialSummary,
} from "@/hooks/useExpenses";
import { expenseMarketplaceValues, expensePaymentTypeValues } from "@/lib/api/schemas";
import type { Expense, ExpenseMarketplace, ExpensePaymentType } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  tokopedia: "Tokopedia",
  shopee: "Shopee",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiket: "Tiket.com",
  grab: "Grab",
  agoda: "Agoda",
  lalamove: "Lalamove",
  other: "Other",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  dp_50: "DP 50%",
  completed: "Completed",
};

// ─── Expense form (create / edit) ─────────────────────────────────────────────

type ExpenseFormValues = {
  expenseDate: string;
  marketplace: string;
  storeName: string;
  itemName: string;
  quantity: number;
  finalPrice: number;
  paymentType: string;
  notes: string;
};

function emptyForm(): ExpenseFormValues {
  return {
    expenseDate: today(),
    marketplace: "other",
    storeName: "",
    itemName: "",
    quantity: 1,
    finalPrice: 0,
    paymentType: "completed",
    notes: "",
  };
}

function expenseToForm(e: Expense): ExpenseFormValues {
  return {
    expenseDate: e.expenseDate.slice(0, 10),
    marketplace: e.marketplace,
    storeName: e.storeName ?? "",
    itemName: e.itemName,
    quantity: e.quantity,
    finalPrice: e.finalPrice,
    paymentType: e.paymentType,
    notes: e.notes ?? "",
  };
}

interface ExpenseFormProps {
  values: ExpenseFormValues;
  onChange: (values: ExpenseFormValues) => void;
}

function ExpenseForm({ values, onChange }: ExpenseFormProps) {
  function set<K extends keyof ExpenseFormValues>(key: K, val: ExpenseFormValues[K]) {
    onChange({ ...values, [key]: val });
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={values.expenseDate}
            onChange={(e) => set("expenseDate", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Marketplace</label>
          <Select
            value={values.marketplace}
            onValueChange={(v) => set("marketplace", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseMarketplaceValues.map((m) => (
                <SelectItem key={m} value={m}>
                  {MARKETPLACE_LABELS[m] ?? m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Store Name <span className="text-muted-foreground">(optional)</span></label>
        <Input
          placeholder="e.g. Toko Bunga Indah"
          value={values.storeName}
          onChange={(e) => set("storeName", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Item Name</label>
        <Input
          placeholder="e.g. Rose flower box"
          value={values.itemName}
          onChange={(e) => set("itemName", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Quantity</label>
          <Input
            type="number"
            min={1}
            value={values.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Total Price (Rp)</label>
          <Input
            type="number"
            min={0}
            step={1000}
            value={values.finalPrice}
            onChange={(e) => set("finalPrice", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Payment Status</label>
        <Select
          value={values.paymentType}
          onValueChange={(v) => set("paymentType", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {expensePaymentTypeValues.map((pt) => (
              <SelectItem key={pt} value={pt}>
                {PAYMENT_LABELS[pt] ?? pt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Notes <span className="text-muted-foreground">(optional)</span></label>
        <Textarea
          rows={2}
          placeholder="Any additional notes…"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCards({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError } = useFinancialSummary(from, to);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-[#6A4636]" />
            Income
          </CardDescription>
          <CardTitle className="text-2xl text-[#6A4636]">
            {formatRupiah(data.totalIncome)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {data.orderCount} confirmed orders
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Expenses
          </CardDescription>
          <CardTitle className="text-2xl text-red-700">
            {formatRupiah(data.totalExpenses)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {data.expenseCount} expense entries
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-forest" />
            Net Profit
          </CardDescription>
          <CardTitle
            className={`text-2xl ${
              data.netProfit >= 0 ? "text-forest" : "text-red-700"
            }`}
          >
            {formatRupiah(data.netProfit)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {data.netProfit >= 0 ? "Profitable period" : "Loss period"}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function AdminFinancialClient() {
  // ── Date range filter (default: current month) ──
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      marketplace: marketplaceFilter !== "all" ? marketplaceFilter : undefined,
      payment_type: paymentFilter !== "all" ? paymentFilter : undefined,
    }),
    [dateFrom, dateTo, marketplaceFilter, paymentFilter, page]
  );

  const { expenses, total, isLoading, isError, error } = useExpenses(params);

  // ── Dialogs ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

  const [formValues, setFormValues] = useState<ReturnType<typeof emptyForm>>(emptyForm);

  function openCreate() {
    setFormValues(emptyForm());
    setCreateOpen(true);
  }

  function openEdit(e: Expense) {
    setFormValues(expenseToForm(e));
    setEditExpense(e);
  }

  // ── Mutations ──
  const createMut = useCreateExpense();
  const updateMut = useUpdateExpense();
  const deleteMut = useDeleteExpense();

  async function handleCreate() {
    await createMut.mutateAsync({
      expenseDate: formValues.expenseDate,
      marketplace: formValues.marketplace,
      storeName: formValues.storeName || null,
      itemName: formValues.itemName,
      quantity: formValues.quantity,
      finalPrice: formValues.finalPrice,
      paymentType: formValues.paymentType,
      notes: formValues.notes || null,
    });
    setCreateOpen(false);
  }

  async function handleUpdate() {
    if (!editExpense) return;
    await updateMut.mutateAsync({
      id: editExpense.id,
      body: {
        expenseDate: formValues.expenseDate,
        marketplace: formValues.marketplace,
        storeName: formValues.storeName || null,
        itemName: formValues.itemName,
        quantity: formValues.quantity,
        finalPrice: formValues.finalPrice,
        paymentType: formValues.paymentType,
        notes: formValues.notes || null,
      },
    });
    setEditExpense(null);
  }

  async function handleDelete() {
    if (!deleteExpense) return;
    await deleteMut.mutateAsync(deleteExpense.id);
    setDeleteExpense(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Report download ───────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

  async function handleDownload(format: "pdf" | "excel") {
    if (!dateFrom || !dateTo) return;
    setDownloading(format);
    try {
      const url = `/api/admin/financial-report?from=${dateFrom}&to=${dateTo}&format=${format}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Download failed" }));
        alert(body.message ?? "Download failed");
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `financial-report-${dateFrom}-${dateTo}.${format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reporting"
        description="Track expenses and compare them against order income."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("pdf")}
              disabled={!!downloading || !dateFrom || !dateTo}
              className="gap-1.5 text-xs"
            >
              {downloading === "pdf" ? (
                <Download className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              PDF Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("excel")}
              disabled={!!downloading || !dateFrom || !dateTo}
              className="gap-1.5 text-xs"
            >
              {downloading === "excel" ? (
                <Download className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Excel Report
            </Button>
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        }
      />

      {/* Date range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Date Range & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">From</label>
              <Input
                type="date"
                className="w-40"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">To</label>
              <Input
                type="date"
                className="w-40"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Marketplace</label>
              <Select value={marketplaceFilter} onValueChange={(v) => { setMarketplaceFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {expenseMarketplaceValues.map((m) => (
                    <SelectItem key={m} value={m}>{MARKETPLACE_LABELS[m] ?? m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Payment</label>
              <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(0); }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {expensePaymentTypeValues.map((pt) => (
                    <SelectItem key={pt} value={pt}>{PAYMENT_LABELS[pt] ?? pt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(marketplaceFilter !== "all" || paymentFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setMarketplaceFilter("all"); setPaymentFilter("all"); setPage(0); }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial summary */}
      {dateFrom && dateTo && <SummaryCards from={dateFrom} to={dateTo} />}

      {/* Expense table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Expense Records</CardTitle>
          {total > 0 && (
            <CardDescription>{total} entries</CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 text-destructive p-6">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">
                {(error as Error)?.message ?? "Failed to load expenses"}
              </span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No expense records found.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Add First Expense
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price/Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(expense.expenseDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {MARKETPLACE_LABELS[expense.marketplace] ?? expense.marketplace}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {expense.storeName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate">
                      {expense.itemName}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {expense.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatRupiah(expense.pricePerUnit)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">
                      {formatRupiah(expense.finalPrice)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          expense.paymentType === "completed"
                            ? "bg-[#6A4636]/5 border-[#6A4636]/25 text-[#6A4636]"
                            : expense.paymentType === "dp_50"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {PAYMENT_LABELS[expense.paymentType] ?? expense.paymentType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(expense)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteExpense(expense)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-muted-foreground">
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create dialog ─────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new purchase or cost entry.</DialogDescription>
          </DialogHeader>
          <ExpenseForm values={formValues} onChange={setFormValues} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={
                createMut.isPending ||
                !formValues.itemName.trim() ||
                formValues.quantity < 1 ||
                formValues.finalPrice < 0
              }
            >
              {createMut.isPending ? "Saving…" : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ───────────────────────────────────── */}
      <Dialog open={Boolean(editExpense)} onOpenChange={(o) => { if (!o) setEditExpense(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm values={formValues} onChange={setFormValues} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────── */}
      <Dialog open={Boolean(deleteExpense)} onOpenChange={(o) => { if (!o) setDeleteExpense(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteExpense?.itemName}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
