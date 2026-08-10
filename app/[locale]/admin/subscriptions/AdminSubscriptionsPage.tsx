"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  XCircle,
  Loader2,
  AlertCircle,
  CreditCard,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/sonner";

interface Subscription {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  stripe_subscription_id: string;
  status: string;
  plan: string;
  price: number;
  currency: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

const statusColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  trialing: { bg: "bg-blue-100", text: "text-blue-700", label: "Trialing" },
  past_due: { bg: "bg-orange-100", text: "text-orange-700", label: "Past Due" },
  canceled: { bg: "bg-gray-100", text: "text-gray-700", label: "Canceled" },
  incomplete: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "Incomplete",
  },
  incomplete_expired: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Expired",
  },
  unpaid: { bg: "bg-red-100", text: "text-red-700", label: "Unpaid" },
};

export function AdminSubscriptionsPage() {
  const t = useTranslations("admin");
  const subsT = useTranslations("admin.subscriptions");
  const locale = "fr"; // useLocale() would be better but keeping simple
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<keyof Subscription>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("subscriptions")
        .select(
          `
          id,
          user_id,
          stripe_subscription_id,
          status,
          plan,
          price,
          currency,
          billing_cycle,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at,
          user_profiles!user_id (email, full_name)
        `,
          { count: "exact" },
        )
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (search) {
        query = query.or(
          `stripe_subscription_id.ilike.%${search}%,plan.ilike.%${search}%`,
        );
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedSubscriptions: Subscription[] = (data || []).map(
        (sub) => ({
          ...sub,
          user_email: sub.user_profiles?.[0]?.email || null,
          user_name: sub.user_profiles?.[0]?.full_name || null,
        }),
      );

      setSubscriptions(formattedSubscriptions);
      setTotal(count || 0);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      toast({ title: subsT("loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    search,
    statusFilter,
    sortBy,
    sortOrder,
    supabase,
    toast,
    subsT,
  ]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleAction = async (action: string, subscription: Subscription) => {
    setActionLoading(subscription.id);
    try {
      switch (action) {
        case "view":
          setSelectedSubscription(subscription);
          setDialogOpen(true);
          break;
        case "cancel":
          if (confirm(subsT("confirmCancel"))) {
            await supabase
              .from("subscriptions")
              .update({ status: "canceled" })
              .eq("id", subscription.id);
            toast({ title: subsT("cancelSuccess") });
            fetchSubscriptions();
          }
          break;
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      toast({ title: subsT("actionError"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusColors[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: status,
    };
    return (
      <Badge className={`${config.bg} ${config.text}`}>{config.label}</Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const totalPages = Math.ceil(total / pageSize);

  // Calculate MRR
  const mrr = subscriptions
    .filter((s) => s.status === "active" || s.status === "trialing")
    .reduce(
      (sum, s) => sum + (s.billing_cycle === "year" ? s.price / 12 : s.price),
      0,
    );

  const arr = mrr * 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">
            {subsT("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{subsT("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {subsT("totalSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-foreground">
              {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {subsT("activeSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-green-600">
              {subscriptions.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {subsT("trialingSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-blue-600">
              {subscriptions.filter((s) => s.status === "trialing").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {subsT("pastDueSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-orange-600">
              {subscriptions.filter((s) => s.status === "past_due").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {subsT("monthlyRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-primary">
              {formatPrice(mrr, "eur")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {subsT("annualRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-primary">
              {formatPrice(arr, "eur")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="status-filter"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("filter")}
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatus")}</SelectItem>
                  <SelectItem value="active">
                    {subsT("status.active")}
                  </SelectItem>
                  <SelectItem value="trialing">
                    {subsT("status.trialing")}
                  </SelectItem>
                  <SelectItem value="past_due">
                    {subsT("status.pastDue")}
                  </SelectItem>
                  <SelectItem value="canceled">
                    {subsT("status.canceled")}
                  </SelectItem>
                  <SelectItem value="incomplete">
                    {subsT("status.incomplete")}
                  </SelectItem>
                  <SelectItem value="incomplete_expired">
                    {subsT("status.incompleteExpired")}
                  </SelectItem>
                  <SelectItem value="unpaid">
                    {subsT("status.unpaid")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg text-foreground mb-2">
                {subsT("noSubscriptions")}
              </h3>
              <p className="text-muted-foreground">
                {subsT("noSubscriptionsDescription")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{subsT("user")}</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("plan");
                            setSortOrder(
                              sortBy === "plan" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("plan")}
                          {sortBy === "plan" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("billing_cycle");
                            setSortOrder(
                              sortBy === "billing_cycle" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("billingCycle")}
                          {sortBy === "billing_cycle" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("price");
                            setSortOrder(
                              sortBy === "price" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("amount")}
                          {sortBy === "price" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("status");
                            setSortOrder(
                              sortBy === "status" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("status")}
                          {sortBy === "status" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("current_period_end");
                            setSortOrder(
                              sortBy === "current_period_end" &&
                                sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("currentPeriodEnd")}
                          {sortBy === "current_period_end" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("cancel_at_period_end");
                            setSortOrder(
                              sortBy === "cancel_at_period_end" &&
                                sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("cancelAtPeriodEnd")}
                          {sortBy === "cancel_at_period_end" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("created_at");
                            setSortOrder(
                              sortBy === "created_at" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {subsT("createdAt")}
                          {sortBy === "created_at" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-48 text-right">
                        {subsT("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {sub.user_name || sub.user_email || "—"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              #{sub.user_id.slice(0, 8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium capitalize">
                            {sub.plan}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {sub.stripe_subscription_id.slice(0, 20)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {sub.billing_cycle === "year"
                              ? subsT("yearly")
                              : subsT("monthly")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatPrice(sub.price, sub.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          {formatDate(sub.current_period_end)}
                        </TableCell>
                        <TableCell>
                          {sub.cancel_at_period_end ? (
                            <Badge variant="warning">{subsT("yes")}</Badge>
                          ) : (
                            <Badge variant="secondary">{subsT("no")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(sub.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => handleAction("view", sub)}
                                disabled={actionLoading === sub.id}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {subsT("viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(sub.status === "active" ||
                                sub.status === "trialing") && (
                                <DropdownMenuItem
                                  onClick={() => handleAction("cancel", sub)}
                                  disabled={actionLoading === sub.id}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {subsT("cancelSubscription")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t("page")} {page} {t("of")} {totalPages} ({total}{" "}
                    {t("results")})
                  </div>
                  <Pagination>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Subscription Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{subsT("viewDetails")}</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl capitalize">
                    {selectedSubscription.plan}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedSubscription.user_email || "—"}
                  </p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedSubscription.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("subscriptionId")}
                  </p>
                  <p className="font-mono text-sm">
                    {selectedSubscription.stripe_subscription_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("userId")}
                  </p>
                  <p className="font-mono text-sm">
                    {selectedSubscription.user_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("billingCycle")}
                  </p>
                  <p className="capitalize">
                    {selectedSubscription.billing_cycle === "year"
                      ? subsT("yearly")
                      : subsT("monthly")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("amount")}
                  </p>
                  <p>
                    {formatPrice(
                      selectedSubscription.price,
                      selectedSubscription.currency,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("currentPeriodStart")}
                  </p>
                  <p>{formatDate(selectedSubscription.current_period_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("currentPeriodEnd")}
                  </p>
                  <p>{formatDate(selectedSubscription.current_period_end)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("cancelAtPeriodEnd")}
                  </p>
                  <p>
                    {selectedSubscription.cancel_at_period_end
                      ? subsT("yes")
                      : subsT("no")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subsT("createdAt")}
                  </p>
                  <p>{formatDate(selectedSubscription.created_at)}</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t("close")}
                </Button>
                {(selectedSubscription.status === "active" ||
                  selectedSubscription.status === "trialing") && (
                  <Button
                    variant="destructive"
                    onClick={() => handleAction("cancel", selectedSubscription)}
                  >
                    {subsT("cancelSubscription")}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
