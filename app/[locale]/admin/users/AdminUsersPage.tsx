"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Shield,
  Trash2,
  Loader2,
  AlertCircle,
  UserPlus,
  Building2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  organization_id?: string;
  organization_name?: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  subscription_plan?: string;
}

const statusColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  inactive: { bg: "bg-gray-100", text: "text-gray-700", label: "Inactive" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
  suspended: { bg: "bg-red-100", text: "text-red-700", label: "Suspended" },
  canceled: { bg: "bg-gray-100", text: "text-gray-700", label: "Canceled" },
  trialing: { bg: "bg-blue-100", text: "text-blue-700", label: "Trialing" },
  past_due: { bg: "bg-orange-100", text: "text-orange-700", label: "Past Due" },
};

const roleColors: Record<string, { bg: string; text: string; label: string }> =
  {
    owner: { bg: "bg-purple-100", text: "text-purple-700", label: "Owner" },
    admin: { bg: "bg-blue-100", text: "text-blue-700", label: "Admin" },
    member: { bg: "bg-green-100", text: "text-green-700", label: "Member" },
    viewer: { bg: "bg-gray-100", text: "text-gray-700", label: "Viewer" },
    user: { bg: "bg-gray-100", text: "text-gray-700", label: "User" },
    premium: { bg: "bg-amber-100", text: "text-amber-700", label: "Premium" },
  };

const subscriptionColors: Record<
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

export function AdminUsersPage() {
  const t = useTranslations("admin");
  const usersT = useTranslations("admin.users");
  const locale = useLocale();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<keyof User>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("user_profiles")
        .select(
          `
          id,
          email,
          full_name,
          avatar_url,
          role,
          status,
          created_at,
          last_login_at,
          organization_id,
          stripe_customer_id,
          subscription_status,
          subscription_plan,
          organizations!organization_id (name)
        `,
          { count: "exact" },
        )
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order(sortBy, { ascending: sortOrder === "asc" });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map((user) => ({
        ...user,
        organization_name: user.organizations?.[0]?.name || null,
      }));

      setUsers(formattedUsers);
      setTotal(count || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: usersT("loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    search,
    statusFilter,
    roleFilter,
    sortBy,
    sortOrder,
    supabase,
    toast,
    usersT,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (action: string, user: User) => {
    setActionLoading(user.id);
    try {
      switch (action) {
        case "view":
          setSelectedUser(user);
          setDialogOpen(true);
          break;
        case "edit":
          // Navigate to edit page or open edit dialog
          toast({ title: usersT("editNotImplemented"), variant: "default" });
          break;
        case "suspend":
          await supabase
            .from("user_profiles")
            .update({ status: "suspended" })
            .eq("id", user.id);
          toast({ title: usersT("suspendSuccess") });
          fetchUsers();
          break;
        case "activate":
          await supabase
            .from("user_profiles")
            .update({ status: "active" })
            .eq("id", user.id);
          toast({ title: usersT("activateSuccess") });
          fetchUsers();
          break;
        case "make_admin":
          await supabase
            .from("user_profiles")
            .update({ role: "admin" })
            .eq("id", user.id);
          toast({ title: usersT("makeAdminSuccess") });
          fetchUsers();
          break;
        case "remove_admin":
          await supabase
            .from("user_profiles")
            .update({ role: "user" })
            .eq("id", user.id);
          toast({ title: usersT("removeAdminSuccess") });
          fetchUsers();
          break;
        case "delete":
          if (confirm(usersT("confirmDelete"))) {
            await supabase.auth.admin.deleteUser(user.id);
            toast({ title: usersT("deleteSuccess") });
            fetchUsers();
          }
          break;
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
      toast({ title: usersT("actionError"), variant: "destructive" });
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

  const getRoleBadge = (role: string) => {
    const config = roleColors[role] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: role,
    };
    return (
      <Badge className={`${config.bg} ${config.text}`}>{config.label}</Badge>
    );
  };

  const getSubscriptionBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">—</Badge>;
    const config = subscriptionColors[status] || {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">
            {usersT("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{usersT("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            {usersT("inviteUser")}
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            {usersT("addUser")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {usersT("totalUsers")}
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
              {usersT("activeUsers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-green-600">
              {users.filter((u) => u.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {usersT("newThisMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-primary">
              {
                users.filter((u) => {
                  const created = new Date(u.created_at);
                  const now = new Date();
                  return (
                    created.getMonth() === now.getMonth() &&
                    created.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {usersT("suspendedUsers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display font-bold text-3xl text-red-600">
              {users.filter((u) => u.status === "suspended").length}
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
                    {usersT("status.active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {usersT("status.inactive")}
                  </SelectItem>
                  <SelectItem value="pending">
                    {usersT("status.pending")}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {usersT("status.suspended")}
                  </SelectItem>
                  <SelectItem value="canceled">
                    {usersT("status.canceled")}
                  </SelectItem>
                  <SelectItem value="trialing">
                    {usersT("status.trialing")}
                  </SelectItem>
                  <SelectItem value="past_due">
                    {usersT("status.pastDue")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allRoles")}</SelectItem>
                  <SelectItem value="owner">{usersT("roles.owner")}</SelectItem>
                  <SelectItem value="admin">{usersT("roles.admin")}</SelectItem>
                  <SelectItem value="member">
                    {usersT("roles.member")}
                  </SelectItem>
                  <SelectItem value="viewer">
                    {usersT("roles.viewer")}
                  </SelectItem>
                  <SelectItem value="user">{usersT("roles.user")}</SelectItem>
                  <SelectItem value="premium">
                    {usersT("roles.premium")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg text-foreground mb-2">
                {usersT("noUsers")}
              </h3>
              <p className="text-muted-foreground">
                {usersT("noUsersDescription")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{usersT("avatar")}</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-left font-medium"
                          onClick={() => {
                            setSortBy("full_name");
                            setSortOrder(
                              sortBy === "full_name" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {usersT("name")}
                          {sortBy === "full_name" && (
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
                            setSortBy("email");
                            setSortOrder(
                              sortBy === "email" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {usersT("email")}
                          {sortBy === "email" && (
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
                            setSortBy("role");
                            setSortOrder(
                              sortBy === "role" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {usersT("role")}
                          {sortBy === "role" && (
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
                          {usersT("status")}
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
                            setSortBy("organization_name");
                            setSortOrder(
                              sortBy === "organization_name" &&
                                sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {usersT("organization")}
                          {sortBy === "organization_name" && (
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
                          {usersT("subscription")}
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
                          {usersT("createdAt")}
                          {sortBy === "created_at" && (
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
                            setSortBy("last_login_at");
                            setSortOrder(
                              sortBy === "last_login_at" && sortOrder === "asc"
                                ? "desc"
                                : "asc",
                            );
                          }}
                        >
                          {usersT("lastLogin")}
                          {sortBy === "last_login_at" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-48 text-right">
                        {usersT("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={user.avatar_url || undefined}
                              alt={user.email}
                            />
                            <AvatarFallback>
                              {user.full_name?.charAt(0).toUpperCase() ||
                                user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {user.full_name || "—"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            #{user.id.slice(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{user.email}</div>
                          {user.stripe_customer_id && (
                            <div className="text-sm text-muted-foreground">
                              {usersT("stripeCustomer")}:{" "}
                              {user.stripe_customer_id.slice(0, 20)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {user.organization_name ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{user.organization_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.subscription_plan ? (
                            <div>
                              <div className="font-medium capitalize">
                                {user.subscription_plan}
                              </div>
                              {getSubscriptionBadge(user.subscription_status)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{formatDate(user.last_login_at)}</TableCell>
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
                                onClick={() => handleAction("view", user)}
                                disabled={actionLoading === user.id}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {usersT("view")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction("edit", user)}
                                disabled={actionLoading === user.id}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {usersT("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status !== "suspended" ? (
                                <DropdownMenuItem
                                  onClick={() => handleAction("suspend", user)}
                                  disabled={actionLoading === user.id}
                                  className="text-orange-600"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  {usersT("suspend")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleAction("activate", user)}
                                  disabled={actionLoading === user.id}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {usersT("activate")}
                                </DropdownMenuItem>
                              )}
                              {user.role !== "admin" &&
                              user.role !== "owner" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("make_admin", user)
                                  }
                                  disabled={actionLoading === user.id}
                                  className="text-blue-600"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  {usersT("makeAdmin")}
                                </DropdownMenuItem>
                              ) : user.role === "admin" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction("remove_admin", user)
                                  }
                                  disabled={actionLoading === user.id}
                                  className="text-gray-600"
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  {usersT("removeAdmin")}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleAction("delete", user)}
                                disabled={actionLoading === user.id}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {usersT("delete")}
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
                    {usersT("page")} {page} {usersT("of")} {totalPages} ({total}{" "}
                    {usersT("results")})
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

      {/* View User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{usersT("viewUser")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={selectedUser.avatar_url || undefined}
                    alt={selectedUser.email}
                  />
                  <AvatarFallback className="text-2xl">
                    {selectedUser.full_name?.charAt(0).toUpperCase() ||
                      selectedUser.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display font-bold text-xl">
                    {selectedUser.full_name || "—"}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {usersT("userId")}
                  </p>
                  <p className="font-mono text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {usersT("createdAt")}
                  </p>
                  <p>{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {usersT("lastLogin")}
                  </p>
                  <p>{formatDate(selectedUser.last_login_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {usersT("organization")}
                  </p>
                  <p>{selectedUser.organization_name || "—"}</p>
                </div>
                {selectedUser.stripe_customer_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {usersT("stripeCustomer")}
                    </p>
                    <p className="font-mono text-sm">
                      {selectedUser.stripe_customer_id}
                    </p>
                  </div>
                )}
                {selectedUser.subscription_plan && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {usersT("subscription")}
                    </p>
                    <p className="capitalize">
                      {selectedUser.subscription_plan}
                    </p>
                  </div>
                )}
                {selectedUser.subscription_status && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {usersT("subscriptionStatus")}
                    </p>
                    <p>
                      {getSubscriptionBadge(selectedUser.subscription_status)}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t("close")}
                </Button>
                <Button onClick={() => handleAction("edit", selectedUser)}>
                  {usersT("edit")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
