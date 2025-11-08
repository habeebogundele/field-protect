"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { updateUserProfileSchema, type User, type UpdateUserProfile } from "@shared/models";
import Link from "next/link";

export default function Profile() {
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

  const isBusinessAccount = user?.accountType === "coop" || user?.accountType === "private_applicator";

  // Form setup with Zod validation
  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      zipcode: "",
      businessName: "",
      businessLicense: "",
      businessAddress: "",
      businessZipcode: "",
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
        zipcode: user.zipcode || "",
        businessName: user.businessName || "",
        businessLicense: user.businessLicense || "",
        businessAddress: user.businessAddress || "",
        businessZipcode: user.businessZipcode || "",
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

  const getAccountTypeDisplay = (accountType?: string) => {
    switch (accountType) {
      case "farmer":
        return { label: "Farmer", variant: "default" as const };
      case "coop":
        return { label: "Cooperative (COOP)", variant: "secondary" as const };
      case "private_applicator":
        return { label: "Private Applicator", variant: "secondary" as const };
      case "admin":
        return { label: "Administrator", variant: "destructive" as const };
      default:
        return { label: "Unknown", variant: "outline" as const };
    }
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

  const accountTypeDisplay = getAccountTypeDisplay(user?.accountType);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Account Type Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center" data-testid="text-profile-title">
                    <i className="fas fa-id-card mr-3 text-primary" aria-hidden="true"></i>
                    Account Type
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Your account classification determines your access and features
                  </CardDescription>
                </div>
                <Badge variant={accountTypeDisplay.variant} className="text-sm">
                  {accountTypeDisplay.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                {user?.accountType === "farmer" && (
                  <>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Manage your own fields and crop information
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      View adjacent field crops to plan spray applications
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Grant access to COOPs and service providers
                    </p>
                  </>
                )}
                {user?.accountType === "coop" && (
                  <>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Access authorized farmer fields for service provision
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Coordinate spraying operations with member farmers
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      View adjacent field information for spray planning
                    </p>
                  </>
                )}
                {user?.accountType === "private_applicator" && (
                  <>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Access client farmer fields with permission
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Plan custom application services
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-primary mr-2 mt-0.5" aria-hidden="true"></i>
                      Coordinate with adjacent field owners
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Information (for COOPs and Private Applicators) */}
          {isBusinessAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-building mr-3 text-primary" aria-hidden="true"></i>
                  Business Information
                </CardTitle>
                <CardDescription>
                  Your business details for service provision and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {user?.accountType === "coop" ? "Cooperative Name" : "Business Name"} *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="e.g., MN-PEST-12345" />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-muted-foreground">
                            Pesticide applicator license number (if applicable)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              value={field.value || ""}
                              placeholder="456 Business Pkwy, City, State"
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessZipcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business ZIP Code *</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="55401" maxLength={10} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save mr-2" aria-hidden="true"></i>
                            Save Business Info
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-user-circle mr-3 text-primary" aria-hidden="true"></i>
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your contact details and location for map centering
              </CardDescription>
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
                        <FormLabel>Phone Number *</FormLabel>
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
                          Used for SMS notifications about field access requests and spray alerts
                        </p>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              value={field.value || ""}
                              placeholder="123 Main Street, City, State"
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              value={field.value || ""}
                              placeholder="55401"
                              maxLength={10}
                              data-testid="input-zipcode"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-muted-foreground">
                            Map centers here on login
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

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
