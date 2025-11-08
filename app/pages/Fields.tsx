import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FieldForm from "@/components/FieldForm";
import FieldTable from "@/components/FieldTable";
// import { Link } from "wouter";

import Link from "next/link";

export default function Fields() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ["/api/fields"],
    enabled: isAuthenticated,
  });

  const syncJohnDeereMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/integrations/john-deere/sync");
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "John Deere fields have been synchronized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync John Deere fields",
        variant: "destructive",
      });
    },
  });

  const syncLeafMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/integrations/leaf-agriculture/sync");
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Leaf Agriculture fields have been synchronized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fields"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Leaf Agriculture fields",
        variant: "destructive",
      });
    },
  });

  if (isLoading || fieldsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-fields">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-fields-title">
            My Fields
          </h2>
          <p className="text-muted-foreground" data-testid="text-fields-description">
            Manage your field boundaries, crops, and integration settings
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border" data-testid="card-add-field">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-plus-circle text-primary" aria-hidden="true"></i>
                <span>Add New Field</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manually add field boundaries and crop information
              </p>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-add-field">
                    <i className="fas fa-plus mr-2" aria-hidden="true"></i>
                    Add Field
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Field</DialogTitle>
                  </DialogHeader>
                  <div className="pr-2">
                    <FieldForm 
                      onSuccess={() => setIsAddDialogOpen(false)} 
                      onCancel={() => setIsAddDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border border-border" data-testid="card-john-deere-sync">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-tractor text-chart-1" aria-hidden="true"></i>
                <span>John Deere Sync</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Import field boundaries from Operations Center
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => syncJohnDeereMutation.mutate()}
                disabled={syncJohnDeereMutation.isPending}
                data-testid="button-sync-john-deere"
              >
                {syncJohnDeereMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync mr-2" aria-hidden="true"></i>
                    Sync Fields
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border" data-testid="card-leaf-agriculture-sync">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-leaf text-chart-3" aria-hidden="true"></i>
                <span>Leaf Agriculture</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Import from 120+ agricultural platforms
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => syncLeafMutation.mutate()}
                disabled={syncLeafMutation.isPending}
                data-testid="button-sync-leaf"
              >
                {syncLeafMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync mr-2" aria-hidden="true"></i>
                    Sync Fields
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Fields Table */}
        <FieldTable showActions={true} />
      </div>
    </div>
  );
}
