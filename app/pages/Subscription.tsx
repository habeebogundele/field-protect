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
      <div className="container mx-auto px-4 py-6">
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
