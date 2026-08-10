"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Users,
  Building2,
  Loader2,
  AlertCircle,
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

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  member_count: number;
  subscription_status?: string;
  created_at: string;
}

const statusColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  inactive: { bg: "bg-gray-100", text: "text-gray-700", label: "Inactive" },
  suspended: { bg: "bg-red-100", text: "text-red-700", label: "Suspended" },
  canceled: { bg: "bg-gray-100", text: "text-gray-700", label: "Canceled" },
  trialing: { bg: "bg-blue-100", text: "text-blue-700", label: "Trialing" },
  past_due: { bg: "bg-orange-100", text: "text-orange-700", label: "Past Due" },
};

export function AdminOrganizationsPage() {
  const t = useTranslations("admin");
  const orgsT = useTranslations("admin.organizations");
  const locale = useLocale();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<keyof Organization>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("organizations")
        .select(
          `
          id,
          name,
          slug,
          owner_id,
          member_count,
          subscription_status,
          created_at,
          user_profiles!owner_id (email, full_name)
        `,
          { count: "exact" },
        )
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("subscription_status", statusFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedOrgs: Organization[] = (data || []).map((org) => ({
        ...org,
        owner_name: org.user_profiles?.[0]?.full_name || null,
        owner_email: org.user_profiles?.[0]?.email || null,
      }));

      setOrganizations(formattedOrgs);
      setTotal(count || 0);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
      toast({ title: orgsT("loadError"), variant: "destructive" });
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
    orgsT,
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleAction = async (action: string, org: Organization) => {
    setActionLoading(org.id);
    try {
      switch (action) {
        case "view":
          setSelectedOrg(org);
          setDialogOpen(true);
          break;
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      toast({ title: orgsT("actionError"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
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

  const totalPages = Math.ceil(total / pageSize);
  const totalMembers = organizations.reduce(
    (sum, org) => sum + org.member_count,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">
            {orgsT("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{orgsT("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {orgsT("totalOrganizations")}
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
              {orgsT("activeOrganizations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-green-600">
              {
                organizations.filter((o) => o.subscription_status === "active")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {orgsT("totalMembers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-primary">
              {totalMembers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {orgsT("avgMembers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-muted-foreground">
              {total > 0 ? Math.round(totalMembers / total) : 0}
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
                    {orgsT("status.active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {orgsT("status.inactive")}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {orgsT("status.suspended")}
                  </SelectItem>
                  <SelectItem value="canceled">
                    {orgsT("status.canceled")}
                  </SelectItem>
                  <SelectItem value="trialing">
                    {orgsT("status.trialing")}
                  </SelectItem>
                  <SelectItem value="past_due">
                    {orgsT("status.pastDue")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg text-foreground mb-2">
                {orgsT("noOrganizations")}
              </h3>
              <p className="text-muted-foreground">
                {orgsT("noOrganizationsDescription")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{orgsT("avatar")}</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("name");
                            setSortOrder(
                              sortBy === "name" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {orgsT("name")}
                          {sortBy === "name" && (
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
                            setSortBy("slug");
                            setSortOrder(
                              sortBy === "slug" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {orgsT("slug")}
                          {sortBy === "slug" && (
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
                            setSortBy("owner_name");
                            setSortOrder(
                              sortBy === "owner_name" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {orgsT("owner")}
                          {sortBy === "owner_name" && (
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
                            setSortBy("member_count");
                            setSortOrder(
                              sortBy === "member_count" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {orgsT("members")}
                          {sortBy === "member_count" && (
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
                            setSortBy("subscription_status");
                            setSortOrder(
                              sortBy === "subscription_status" &&
                                sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {orgsT("subscription")}
                          {sortBy === "subscription_status" && (
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
                          {orgsT("createdAt")}
                          {sortBy === "created_at" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-48 text-right">
                        {orgsT("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            #{org.id.slice(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm text-muted-foreground">
                            {org.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <Users className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {org.owner_name || org.owner_email || "—"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                #{org.owner_id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{org.member_count}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(org.subscription_status)}
                        </TableCell>
                        <TableCell>{formatDate(org.created_at)}</TableCell>
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
                                onClick={() => handleAction("view", org)}
                                disabled={actionLoading === org.id}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {orgsT("viewDetails")}
                              </DropdownMenuItem>
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

      {/* View Organization Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{orgsT("viewDetails")}</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">
                    {selectedOrg.name}
                  </h3>
                  <p className="text-muted-foreground">@{selectedOrg.slug}</p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedOrg.subscription_status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orgsT("organizationId")}
                  </p>
                  <p className="font-mono text-sm">{selectedOrg.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orgsT("owner")}
                  </p>
                  <p>
                    {selectedOrg.owner_name || selectedOrg.owner_email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orgsT("ownerId")}
                  </p>
                  <p className="font-mono text-sm">{selectedOrg.owner_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orgsT("members")}
                  </p>
                  <p>{selectedOrg.member_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orgsT("subscription")}
                  </p>
                  <p>{getStatusBadge(selectedOrg.subscription_status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {orgsT("createdAt")}
                  </p>
                  <p>{formatDate(selectedOrg.created_at)}</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t("close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
