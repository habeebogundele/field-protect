import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
// import { Link } from "wouter";

import Link from "next/link";

export default function AdjacentFields() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Query fields that need permission requests
  const { data: fieldsNeedingPermission, isLoading: fieldsLoading } = useQuery({
    queryKey: ["/api/fields/adjacent-needing-permission"],
    enabled: isAuthenticated,
  });

  // Query pending access requests for this user to approve/deny
  const { data: pendingRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/fields/access-requests/pending"],
    enabled: isAuthenticated,
  });

  // Query user's actual fields for stats
  const { data: userFields } = useQuery({
    queryKey: ["/api/fields"],
    enabled: isAuthenticated,
  });

  // Mutation to request access to a field
  const requestAccessMutation = useMutation({
    mutationFn: async (data: { ownerFieldId: string }) => {
      console.log("🔄 Request Access mutation triggered with data:", data);
      return await apiRequest("POST", "/api/fields/request-access", data);
    },
    onSuccess: () => {
      console.log("✅ Request Access mutation successful");
      toast({
        title: "Access Requested",
        description: "Request sent to field owner. They'll receive a text notification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fields/adjacent-needing-permission"] });
    },
    onError: (error: any) => {
      console.error("❌ Request Access mutation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to request access",
        variant: "destructive",
      });
    },
  });

  // Mutation to approve/deny access requests
  const updateRequestMutation = useMutation({
    mutationFn: async (data: { requestId: string; status: "approved" | "denied" }) => {
      return await apiRequest("PUT", `/api/fields/access-requests/${data.requestId}`, { status: data.status });
    },
    onSuccess: () => {
      toast({
        title: "Request Updated",
        description: "The requester will be notified of your decision.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fields/access-requests/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-adjacent-fields">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const fieldsNeedingPermissionCount = (fieldsNeedingPermission as any[])?.length || 0;
  const pendingRequestsCount = (pendingRequests as any[])?.length || 0;
  // Note: Crop data is not available before permission is granted for privacy protection
  const uniqueCrops = 0; // Privacy protection: crop data hidden until access approved

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
              <Link href="/adjacent-fields" className="text-foreground hover:text-primary transition-colors font-medium border-b-2 border-primary pb-1" data-testid="link-adjacent-fields">
                Adjacent Fields
              </Link>
              <Link href="/subscription" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-subscription">
                Subscription
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-profile">
                Profile
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Mobile menu button - always visible on small screens */}
            <button 
              className="block md:hidden p-2 text-foreground hover:text-primary border border-border rounded-md bg-background"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              <span className="text-lg">
                {isMobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
            
            <button 
              onClick={() => window.location.href = "/login"}
              className="flex items-center space-x-3 bg-muted rounded-full px-4 py-2 hover:bg-muted/80 transition-colors"
              data-testid="button-profile-menu"
            >
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-medium text-sm">JD</span>
              </div>
              <span className="text-foreground font-medium hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border px-6 py-4" data-testid="mobile-navigation">
          <nav className="space-y-4">
            <Link 
              href="/" 
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-tachometer-alt w-5 mr-3" aria-hidden="true"></i>
              Dashboard
            </Link>
            <Link 
              href="/fields" 
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-fields"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-map w-5 mr-3" aria-hidden="true"></i>
              My Fields
            </Link>
            <Link 
              href="/adjacent-fields" 
              className="flex items-center px-3 py-2 text-primary bg-primary/10 rounded-md font-medium"
              data-testid="mobile-link-adjacent-fields"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-users w-5 mr-3" aria-hidden="true"></i>
              Adjacent Fields
            </Link>
            <a 
              href="/subscription" 
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-subscription"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-credit-card w-5 mr-3" aria-hidden="true"></i>
              Subscription
            </a>
            <a 
              href="/profile" 
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-profile"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-user w-5 mr-3" aria-hidden="true"></i>
              Profile
            </a>
          </nav>
        </div>
      )}

      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-adjacent-fields-title">
            Adjacent Fields
          </h2>
          <p className="text-muted-foreground" data-testid="text-adjacent-fields-description">
            Request access to view detailed crop information from neighboring fields for informed spraying decisions
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border" data-testid="card-stat-adjacent-fields">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adjacent Fields</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-adjacent-count">
                    {fieldsNeedingPermissionCount}
                  </p>
                </div>
                <div className="h-12 w-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-secondary text-xl" aria-hidden="true"></i>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Available to request</p>
            </CardContent>
          </Card>

          <Card className="border border-border" data-testid="card-stat-crop-types">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Privacy Protected</p>
                  <p className="text-2xl font-bold text-foreground"><i className="fas fa-shield-alt"></i></p>
                </div>
                <div className="h-12 w-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shield-alt text-chart-1 text-xl" aria-hidden="true"></i>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Crop data protected until approved</p>
            </CardContent>
          </Card>

          <Card className="border border-border" data-testid="card-stat-recent-changes">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Changes</p>
                  <p className="text-2xl font-bold text-foreground">{pendingRequestsCount}</p>
                </div>
                <div className="h-12 w-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-chart-2 text-xl" aria-hidden="true"></i>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting your response</p>
            </CardContent>
          </Card>
        </div>

        {/* Fields Available to Request Access */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-fields-to-request">
            Adjacent Fields Available to Request Access ({fieldsNeedingPermissionCount})
          </h3>
          {fieldsLoading ? (
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-muted h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : fieldsNeedingPermissionCount === 0 ? (
            <Card className="border border-border">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  🎉 No adjacent fields need permission requests. You're all set!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {((fieldsNeedingPermission as any[]) || []).map((field: any) => (
                <Card key={field.id} className="border border-border" data-testid={`card-adjacent-field-${field.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-field-name-${field.id}`}>
                        Adjacent Field
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs" data-testid={`badge-distance-${field.id}`}>
                        {field.distance}m
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-field-owner-${field.id}`}>
                      {field.user.firstName} {field.user.lastName}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Privacy Protection Notice */}
                      <div className="bg-muted/50 rounded-lg p-3 border border-border" data-testid={`privacy-notice-${field.id}`}>
                        <div className="flex items-start space-x-2">
                          <i className="fas fa-shield-alt text-muted-foreground mt-0.5" aria-hidden="true"></i>
                          <div>
                            <p className="text-sm font-medium text-foreground">Privacy Protected</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Crop details, acreage, and farming data are protected until access is approved
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Available Information */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Available Information
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Owner:</span>
                          <span className="text-sm font-medium text-foreground" data-testid={`text-owner-display-${field.id}`}>
                            {field.user.firstName} {field.user.lastName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Distance:</span>
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-distance-display-${field.id}`}>
                            {field.distance}m away
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <Button
                        onClick={() => requestAccessMutation.mutate({ ownerFieldId: field.id })}
                        disabled={requestAccessMutation.isPending}
                        className="w-full"
                        data-testid={`button-request-access-${field.id}`}
                      >
                        {requestAccessMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                            Requesting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane mr-2" aria-hidden="true"></i>
                            Request Access
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pending Access Requests to Approve/Deny */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-pending-requests">
            Pending Access Requests ({pendingRequestsCount})
          </h3>
          {requestsLoading ? (
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-muted h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : pendingRequestsCount === 0 ? (
            <Card className="border border-border">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  📋 No pending access requests to review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {((pendingRequests as any[]) || []).map((request: any) => (
                <Card key={request.id} className="border border-border bg-blue-50/50 dark:bg-blue-950/20" data-testid={`card-pending-request-${request.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" data-testid={`text-request-field-name-${request.id}`}>
                        {request.ownerField.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300" data-testid={`badge-pending-${request.id}`}>
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-requester-${request.id}`}>
                      Request from: {request.viewerUser.firstName} {request.viewerUser.lastName}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Crop:</span>
                        <Badge 
                          className="bg-primary/10 text-primary border-primary/20"
                          data-testid={`badge-request-crop-${request.id}`}
                        >
                          <i className="fas fa-seedling mr-1" aria-hidden="true"></i>
                          {request.ownerField.crop}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Acres:</span>
                        <span className="text-sm font-medium text-foreground" data-testid={`text-request-acres-${request.id}`}>
                          {request.ownerField.acres}
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => updateRequestMutation.mutate({ requestId: request.id, status: "approved" })}
                          disabled={updateRequestMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          data-testid={`button-approve-${request.id}`}
                        >
                          {updateRequestMutation.isPending ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                          ) : (
                            <>
                              <i className="fas fa-check mr-2" aria-hidden="true"></i>
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => updateRequestMutation.mutate({ requestId: request.id, status: "denied" })}
                          disabled={updateRequestMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                          data-testid={`button-deny-${request.id}`}
                        >
                          {updateRequestMutation.isPending ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                          ) : (
                            <>
                              <i className="fas fa-times mr-2" aria-hidden="true"></i>
                              Deny
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Alert Information */}
        <Card className="border border-border bg-gradient-to-r from-chart-4/5 to-chart-4/10" data-testid="card-spray-alert">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-chart-4" aria-hidden="true"></i>
              <span>Spray Compatibility Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-4">
              Before applying herbicides or pesticides, verify chemical compatibility with adjacent crops to prevent damage.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-primary mt-0.5" aria-hidden="true"></i>
                <span><strong>Corn fields:</strong> Compatible with most broadleaf herbicides</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-exclamation-circle text-chart-4 mt-0.5" aria-hidden="true"></i>
                <span><strong>Soybean fields:</strong> Sensitive to 2,4-D and dicamba drift</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-chart-2 mt-0.5" aria-hidden="true"></i>
                <span><strong>Wheat fields:</strong> Check growth stage before applying herbicides</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
