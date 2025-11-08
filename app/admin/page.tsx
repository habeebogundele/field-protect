"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/models";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth();

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && currentUser?.isAdmin === true,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to access the admin panel",
        variant: "destructive",
      });
      router.push("/admin/login");
      return;
    }

    if (!authLoading && isAuthenticated && currentUser && !currentUser.isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive",
      });
      router.push("/dashboard");
      return;
    }
  }, [authLoading, isAuthenticated, currentUser, router, toast]);

  if (authLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser?.isAdmin) {
    return null;
  }

  const stats = {
    totalUsers: users?.length || 0,
    farmers: users?.filter(u => u.accountType === 'farmer').length || 0,
    coops: users?.filter(u => u.accountType === 'coop').length || 0,
    privateApplicators: users?.filter(u => u.accountType === 'private_applicator').length || 0,
    admins: users?.filter(u => u.accountType === 'admin' || u.isAdmin).length || 0,
    activeSubscriptions: users?.filter(u => u.subscriptionStatus === 'active').length || 0,
  };

  const getAccountTypeBadge = (accountType?: string) => {
    switch (accountType) {
      case "farmer":
        return <Badge variant="default">Farmer</Badge>;
      case "coop":
        return <Badge variant="secondary">COOP</Badge>;
      case "private_applicator":
        return <Badge variant="secondary">Private Applicator</Badge>;
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "past_due":
        return <Badge variant="destructive">Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <i className="fas fa-shield-alt text-3xl text-destructive mr-3" aria-hidden="true"></i>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Platform management and user administration
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-4xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Registered accounts on the platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Farmers</CardDescription>
              <CardTitle className="text-4xl">{stats.farmers}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Field owners and operators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Service Providers</CardDescription>
              <CardTitle className="text-4xl">{stats.coops + stats.privateApplicators}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                COOPs ({stats.coops}) + Applicators ({stats.privateApplicators})
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Subscriptions</CardDescription>
              <CardTitle className="text-4xl">{stats.activeSubscriptions}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Paying customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Administrators</CardDescription>
              <CardTitle className="text-4xl">{stats.admins}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform administrators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Subscription Rate</CardDescription>
              <CardTitle className="text-4xl">
                {stats.totalUsers > 0 ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100) : 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Active / Total users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage all registered users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 font-semibold text-sm border-b pb-2">
                <div className="col-span-3">Name / Email</div>
                <div className="col-span-2">Account Type</div>
                <div className="col-span-2">Subscription</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-3">Actions</div>
              </div>

              {/* User Rows */}
              {users && users.length > 0 ? (
                users.map((user) => (
                  <div key={user._id?.toString()} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0">
                    <div className="col-span-3">
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                        {user.isAdmin && <i className="fas fa-shield-alt text-destructive ml-2" aria-hidden="true"></i>}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.businessName && (
                        <div className="text-xs text-muted-foreground italic">{user.businessName}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      {getAccountTypeBadge(user.accountType)}
                    </div>
                    <div className="col-span-2">
                      {getSubscriptionBadge(user.subscriptionStatus)}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="col-span-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${user._id}`)}>
                        <i className="fas fa-eye mr-1" aria-hidden="true"></i>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        toast({
                          title: "Feature Coming Soon",
                          description: "User editing functionality will be available in a future update",
                        });
                      }}>
                        <i className="fas fa-edit mr-1" aria-hidden="true"></i>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
