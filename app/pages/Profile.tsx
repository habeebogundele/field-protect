import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { updateUserProfileSchema, type User, type UpdateUserProfile } from "@shared/models";
// import { Link } from "wouter";

import Link from "next/link";

export default function Profile() {
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

  // Query user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });

  // Form setup with Zod validation
  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user, form]);

  // Mutation to update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      return await apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-profile">
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
              <Link href="/profile" className="text-foreground hover:text-primary transition-colors font-medium border-b-2 border-primary pb-1" data-testid="link-profile">
                Profile
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:bg-muted transition-colors"
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
                <span className="text-primary-foreground font-medium text-sm">
                  {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
                </span>
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
              className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              data-testid="mobile-link-subscription"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-credit-card w-5 mr-3" aria-hidden="true"></i>
              Subscription
            </Link>
            <Link 
              href="/profile" 
              className="flex items-center px-3 py-2 text-primary bg-primary/10 rounded-md font-medium"
              data-testid="mobile-link-profile"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="fas fa-user w-5 mr-3" aria-hidden="true"></i>
              Profile
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="text-profile-title">
                <i className="fas fa-user-circle mr-3 text-primary" aria-hidden="true"></i>
                Profile Information
              </CardTitle>
              <p className="text-muted-foreground">
                Update your personal information and contact details for SMS notifications.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            type="tel" 
                            placeholder="+1 (555) 123-4567"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          Used for SMS notifications about field access requests and spray alerts.
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mailing Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            value={field.value || ""}
                            placeholder="123 Farm Road, Rural County, State 12345"
                            rows={3}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2" aria-hidden="true"></i>
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}