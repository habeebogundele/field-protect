import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCards from "@/components/StatsCards";
import FieldMap from "@/components/FieldMap";
import ActivityFeed from "@/components/ActivityFeed";
import FieldTable from "@/components/FieldTable";
import APIIntegrationStatus from "@/components/APIIntegrationStatus";
import Link from "next/link";

export default function Dashboard() {
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
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50" data-testid="nav-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <i className="fas fa-seedling text-2xl text-primary mr-3" aria-hidden="true"></i>
              <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">FieldShare</h1>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium border-b-2 border-primary pb-1" data-testid="link-dashboard">
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
            
            <button className="relative p-2 text-muted-foreground hover:text-foreground" data-testid="button-notifications">
              <i className="fas fa-bell text-lg" aria-hidden="true"></i>
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            <button 
              onClick={() => window.location.href = "/api/logout"}
              className="flex items-center space-x-3 bg-muted rounded-full px-4 py-2 hover:bg-muted/80 transition-colors"
              data-testid="button-profile-menu"
            >
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-medium text-sm">JD</span>
              </div>
              <span className="text-foreground font-medium hidden sm:inline">Sign Out</span>
              <i className="fas fa-chevron-down text-muted-foreground" aria-hidden="true"></i>
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
              className="flex items-center px-3 py-2 text-primary bg-primary/10 rounded-md font-medium"
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
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-adjacent-fields"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-users w-5 mr-3" aria-hidden="true"></i>
              Adjacent Fields
            </Link>
            <Link 
              href="/subscription" 
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-subscription"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-credit-card w-5 mr-3" aria-hidden="true"></i>
              Subscription
            </Link>
            <Link 
              href="/profile" 
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-profile"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-user w-5 mr-3" aria-hidden="true"></i>
              Profile
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-card border-r border-border min-h-screen" data-testid="sidebar">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Field Management
              </h3>
              <nav className="space-y-2">
                <a href="/" className="flex items-center px-3 py-2 text-primary bg-primary/10 rounded-md font-medium" data-testid="link-sidebar-dashboard">
                  <i className="fas fa-tachometer-alt w-5 mr-3" aria-hidden="true"></i>
                  Dashboard
                </a>
                <a href="/fields" className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" data-testid="link-sidebar-fields">
                  <i className="fas fa-map w-5 mr-3" aria-hidden="true"></i>
                  My Fields
                </a>
                <a href="/adjacent-fields" className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" data-testid="link-sidebar-adjacent">
                  <i className="fas fa-users w-5 mr-3" aria-hidden="true"></i>
                  Adjacent Fields
                </a>
              </nav>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Integrations
              </h3>
              <nav className="space-y-2">
                <button className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md w-full text-left" data-testid="button-john-deere">
                  <i className="fas fa-tractor w-5 mr-3" aria-hidden="true"></i>
                  John Deere API
                </button>
                <button className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md w-full text-left" data-testid="button-climate-fieldview">
                  <i className="fas fa-cloud w-5 mr-3" aria-hidden="true"></i>
                  Climate FieldView
                </button>
                <button className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md w-full text-left" data-testid="button-leaf-agriculture">
                  <i className="fas fa-leaf w-5 mr-3" aria-hidden="true"></i>
                  Leaf Agriculture
                </button>
              </nav>
            </div>
            
            {/* Subscription Status Card */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-border" data-testid="card-subscription-status">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Pro Plan</span>
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Expires: March 15, 2025</p>
              <button className="text-xs text-primary hover:text-primary/80 font-medium" data-testid="button-manage-subscription">
                Manage Subscription
              </button>
            </div>
          </div>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
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
