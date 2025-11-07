import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Users, Mail, Search, Merge, Trash2, ChevronLeft, ChevronRight, AlertCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  subscriptionStatus: string | null;
  createdAt: string;
  userRole: string | null;
  companyName: string | null;
}

interface EmailConflict {
  email: string;
  users: User[];
  count: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

interface EmailConflictsResponse {
  conflicts: EmailConflict[];
  totalConflicts: number;
  affectedUsers: number;
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceUserId, setSourceUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");

  // Check admin privileges
  if (authLoading) {
    return (
      <div className="container mx-auto p-6" data-testid="admin-loading">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto p-6" data-testid="admin-access-denied">
        <Alert className="border-destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription data-testid="text-access-denied">
            Access denied. Admin privileges required to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch users with search and pagination
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", currentPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Fetch email conflicts
  const { data: conflictsData, isLoading: conflictsLoading, error: conflictsError } = useQuery<EmailConflictsResponse>({
    queryKey: ["/api/admin/email-conflicts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-conflicts", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch email conflicts");
      }
      return response.json();
    },
  });

  // Merge users mutation
  const mergeUsersMutation = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      const response = await apiRequest("POST", "/api/admin/users/merge", {
        sourceUserId: sourceId,
        targetUserId: targetId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Users merged successfully",
        description: "The accounts have been consolidated and data transferred.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-conflicts"] });
      setMergeDialogOpen(false);
      setSourceUserId("");
      setTargetUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "Merge failed",
        description: error.message || "Failed to merge users",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deleted successfully",
        description: "The account has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-conflicts"] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleMergeUsers = () => {
    if (!sourceUserId || !targetUserId) {
      toast({
        title: "Invalid selection",
        description: "Please select both source and target users",
        variant: "destructive",
      });
      return;
    }
    mergeUsersMutation.mutate({ sourceId: sourceUserId, targetId: targetUserId });
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const formatUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return "No name";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50" data-testid="nav-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <i className="fas fa-seedling text-2xl text-primary mr-3" aria-hidden="true"></i>
              <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">FieldShare</h1>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-dashboard">
                Dashboard
              </Link>
              <Link href="/fields" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-fields">
                My Fields
              </Link>
              <Link href="/adjacent-fields" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-adjacent-fields">
                Adjacent Fields
              </Link>
              <Link href="/subscription" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-subscription">
                Subscription
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-profile">
                Profile
              </Link>
              <Link href="/admin" className="text-foreground hover:text-primary transition-colors font-medium border-b-2 border-primary pb-1" data-testid="link-admin">
                Admin
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.location.href = "/api/logout"}
              className="flex items-center space-x-3 bg-muted rounded-full px-4 py-2 hover:bg-muted/80 transition-colors"
              data-testid="button-profile-menu"
            >
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-medium text-sm">
                  {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-foreground font-medium hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 space-y-6" data-testid="admin-dashboard">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground" data-testid="text-admin-subtitle">
              Manage users and resolve email conflicts
            </p>
          </div>
          <Badge variant="secondary" data-testid="badge-admin-status">
            <Shield className="w-4 h-4 mr-1" />
            Admin Access
          </Badge>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {usersData?.pagination?.totalCount || 0}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-email-conflicts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-email-conflicts">
              {conflictsData?.totalConflicts || 0}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-affected-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-affected-users">
              {conflictsData?.affectedUsers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList data-testid="tabs-admin">
          <TabsTrigger value="users" data-testid="tab-users">
            Users
          </TabsTrigger>
          <TabsTrigger value="conflicts" data-testid="tab-conflicts">
            Email Conflicts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card data-testid="card-user-management">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Search, view, and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-user-search"
                  />
                </div>
                <Button 
                  onClick={() => setMergeDialogOpen(true)} 
                  variant="outline"
                  data-testid="button-open-merge"
                >
                  <Merge className="w-4 h-4 mr-2" />
                  Merge Users
                </Button>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="space-y-2" data-testid="users-loading">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : usersError ? (
                <Alert className="border-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="text-users-error">
                    Failed to load users: {usersError.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Table data-testid="table-users">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell data-testid={`text-user-name-${user.id}`}>
                            <div className="flex items-center space-x-2">
                              <span>{formatUserName(user)}</span>
                              {user.isAdmin && (
                                <Badge variant="secondary" data-testid={`badge-admin-${user.id}`}>
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-user-email-${user.id}`}>
                            {user.email}
                          </TableCell>
                          <TableCell data-testid={`text-user-role-${user.id}`}>
                            {user.userRole || "farmer"}
                          </TableCell>
                          <TableCell data-testid={`text-user-status-${user.id}`}>
                            <Badge 
                              variant={user.subscriptionStatus === "active" ? "default" : "secondary"}
                            >
                              {user.subscriptionStatus || "inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-user-created-${user.id}`}>
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={user.isAdmin}
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {usersData?.pagination && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                        Showing page {usersData.pagination.currentPage} of{" "}
                        {usersData.pagination.totalPages} ({usersData.pagination.totalCount} total users)
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!usersData.pagination.hasPreviousPage}
                          data-testid="button-prev-page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!usersData.pagination.hasNextPage}
                          data-testid="button-next-page"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card data-testid="card-email-conflicts">
            <CardHeader>
              <CardTitle>Email Conflicts</CardTitle>
              <CardDescription>
                Resolve duplicate email addresses by merging accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conflictsLoading ? (
                <div className="space-y-2" data-testid="conflicts-loading">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : conflictsError ? (
                <Alert className="border-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="text-conflicts-error">
                    Failed to load email conflicts: {conflictsError.message}
                  </AlertDescription>
                </Alert>
              ) : conflictsData?.conflicts?.length === 0 ? (
                <div className="text-center py-8" data-testid="text-no-conflicts">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No email conflicts</h3>
                  <p className="text-muted-foreground">All user emails are unique.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {conflictsData?.conflicts?.map((conflict, index) => (
                    <div key={conflict.email} className="border rounded-lg p-4" data-testid={`conflict-${index}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium" data-testid={`text-conflict-email-${index}`}>
                            {conflict.email}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {conflict.count} duplicate accounts
                          </p>
                        </div>
                        <Badge variant="destructive" data-testid={`badge-conflict-count-${index}`}>
                          {conflict.count} accounts
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Affected accounts:</h4>
                        {conflict.users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                            data-testid={`conflict-user-${user.id}`}
                          >
                            <div>
                              <span className="font-medium" data-testid={`text-conflict-user-name-${user.id}`}>
                                {formatUserName(user)}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ID: {user.id.slice(0, 8)}...
                              </span>
                              {user.isAdmin && (
                                <Badge variant="secondary" className="ml-2">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground" data-testid={`text-conflict-user-created-${user.id}`}>
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          onClick={() => {
                            setSourceUserId(conflict.users[1]?.id || "");
                            setTargetUserId(conflict.users[0]?.id || "");
                            setMergeDialogOpen(true);
                          }}
                          className="w-full"
                          data-testid={`button-resolve-conflict-${index}`}
                        >
                          <Merge className="w-4 h-4 mr-2" />
                          Resolve Conflict
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Merge Users Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent data-testid="dialog-merge-users">
          <DialogHeader>
            <DialogTitle>Merge Users</DialogTitle>
            <DialogDescription>
              Merge two user accounts by transferring all data from the source account to the target account.
              The source account will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="sourceUser" className="block text-sm font-medium mb-2">
                Source User (will be deleted)
              </label>
              <Input
                id="sourceUser"
                placeholder="Enter source user ID"
                value={sourceUserId}
                onChange={(e) => setSourceUserId(e.target.value)}
                data-testid="input-source-user"
              />
            </div>
            <div>
              <label htmlFor="targetUser" className="block text-sm font-medium mb-2">
                Target User (will keep data)
              </label>
              <Input
                id="targetUser"
                placeholder="Enter target user ID"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                data-testid="input-target-user"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setMergeDialogOpen(false)}
              data-testid="button-cancel-merge"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMergeUsers}
              disabled={mergeUsersMutation.isPending || !sourceUserId || !targetUserId}
              data-testid="button-confirm-merge"
            >
              {mergeUsersMutation.isPending ? "Merging..." : "Merge Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-testid="dialog-delete-user">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user account? This action cannot be undone.
              Only users without critical data can be deleted.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p><strong>Name:</strong> {formatUserName(selectedUser)}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}