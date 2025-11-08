import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SubscriptionCard from "@/components/SubscriptionCard";
// import { Link } from "wouter";

import Link from "next/link";

export default function Subscription() {
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

  const { data: user } = useQuery<{
    subscriptionStatus?: 'active' | 'inactive';
    subscriptionType?: 'monthly' | 'yearly';
    [key: string]: any;
  }>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-subscription">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const monthlyFeatures = [
    "Up to 10 fields",
    "Adjacent field visibility",
    "Basic John Deere integration",
    "Email notifications",
    "Mobile app access",
  ];

  const yearlyFeatures = [
    "Unlimited fields",
    "Adjacent field visibility", 
    "Full John Deere integration",
    "Climate FieldView integration",
    "Leaf Agriculture integration",
    "Real-time notifications",
    "Mobile app access",
    "Priority support",
    "Advanced analytics",
    "Export capabilities",
  ];

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
              <Link href="/subscription" className="text-foreground hover:text-primary transition-colors font-medium border-b-2 border-primary pb-1" data-testid="link-subscription">
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
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-adjacent-fields"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-users w-5 mr-3" aria-hidden="true"></i>
              Adjacent Fields
            </Link>
            <Link 
              href="/subscription" 
              className="flex items-center px-3 py-2 text-primary bg-primary/10 rounded-md font-medium"
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

      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-subscription-title">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-subscription-description">
            Select the perfect plan for your farming operation. All plans include secure field management and neighbor connectivity.
          </p>
        </div>

        {/* Current Subscription Status */}
        {user?.subscriptionStatus === 'active' && (
          <Card className="mb-8 border-primary bg-primary/5" data-testid="card-current-subscription">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-check-circle text-primary" aria-hidden="true"></i>
                <span>Current Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground" data-testid="text-current-plan">
                    {user.subscriptionType === 'monthly' ? 'Monthly Pro' : 'Annual Pro'} Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge className="bg-primary text-primary-foreground">Active</Badge>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    ${user.subscriptionType === 'monthly' ? '29' : '299'}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{user.subscriptionType === 'monthly' ? 'month' : 'year'}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">Next billing: March 15, 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <SubscriptionCard
            planType="monthly"
            title="Monthly Pro"
            price="29"
            features={monthlyFeatures}
          />
          
          <SubscriptionCard
            planType="yearly"
            title="Annual Pro"
            price="299"
            features={yearlyFeatures}
            recommended={true}
          />
        </div>

        {/* Feature Comparison */}
        <Card className="max-w-4xl mx-auto" data-testid="card-feature-comparison">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Monthly Pro</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Annual Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">Number of Fields</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">Up to 10</td>
                    <td className="py-3 px-4 text-center text-primary">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">Adjacent Field Visibility</td>
                    <td className="py-3 px-4 text-center text-primary">
                      <i className="fas fa-check" aria-hidden="true"></i>
                    </td>
                    <td className="py-3 px-4 text-center text-primary">
                      <i className="fas fa-check" aria-hidden="true"></i>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">John Deere Integration</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">Basic</td>
                    <td className="py-3 px-4 text-center text-primary">Full Access</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">Climate FieldView Integration</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </td>
                    <td className="py-3 px-4 text-center text-primary">
                      <i className="fas fa-check" aria-hidden="true"></i>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">Leaf Agriculture API</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </td>
                    <td className="py-3 px-4 text-center text-primary">
                      <i className="fas fa-check" aria-hidden="true"></i>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">Advanced Analytics</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </td>
                    <td className="py-3 px-4 text-center text-primary">
                      <i className="fas fa-check" aria-hidden="true"></i>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-foreground">Priority Support</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </td>
                    <td className="py-3 px-4 text-center text-primary">
                      <i className="fas fa-check" aria-hidden="true"></i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-faq-1">
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated on your next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-faq-2">
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards through Stripe and PayPal for your convenience.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-faq-3">
              <CardHeader>
                <CardTitle className="text-lg">Is my field data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. Your field data is encrypted and only shared with adjacent farmers for crop compatibility purposes.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-faq-4">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
