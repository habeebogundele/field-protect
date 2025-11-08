'use client';

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCards from "@/components/StatsCards";
import FieldMap from "@/components/FieldMap";
import ActivityFeed from "@/components/ActivityFeed";
import FieldTable from "@/components/FieldTable";
import APIIntegrationStatus from "@/components/APIIntegrationStatus";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-dashboard">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <main>
          {/* Dashboard Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
              Field Dashboard
            </h2>
            <p className="text-muted-foreground" data-testid="text-dashboard-description">
              Monitor your fields and adjacent crop information for informed spraying decisions
            </p>
          </div>

          {/* Interactive Map - Top Priority for Spraying */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Interactive Map */}
            <div className="lg:col-span-2">
              <FieldMap />
            </div>

            {/* Recent Activity & Adjacent Fields */}
            <div className="space-y-6">
              <ActivityFeed />
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Field Management Table */}
          <FieldTable />

          {/* API Integration Status */}
          <APIIntegrationStatus />
        </main>
      </div>
    </div>
  );
}
