"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    address: "",
    zipcode: "",
    phoneNumber: "",
    adminCode: "", // Secret code for admin registration
    agreedToTerms: false,
    agreedToPrivacy: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.adminCode) {
      setError("Admin authorization code is required");
      return;
    }

    // Legal compliance check
    if (!formData.agreedToTerms || !formData.agreedToPrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      // Create admin account
      const response = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address || undefined,
          zipcode: formData.zipcode || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          adminCode: formData.adminCode,
          agreedToTerms: formData.agreedToTerms,
          agreedToPrivacyPolicy: formData.agreedToPrivacy,
          agreedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to create admin account");
      }

      // Auto sign in after successful signup
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        setError("Account created but failed to sign in. Please try logging in.");
        router.push("/admin/login");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 to-primary/5 p-4 py-12">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-shield-alt text-4xl text-destructive" aria-hidden="true"></i>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Registration</CardTitle>
          <CardDescription className="text-center">
            Restricted access - Requires authorization code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-yellow-500 text-yellow-800 bg-yellow-50">
              <i className="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i>
              <AlertDescription className="text-sm">
                <strong>Notice:</strong> Admin accounts have elevated privileges. Only authorized personnel should register here.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fieldshare.app"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, State"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">ZIP Code (Optional)</Label>
                <Input
                  id="zipcode"
                  type="text"
                  placeholder="55401"
                  value={formData.zipcode}
                  onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Authorization Code *</Label>
              <PasswordInput
                id="adminCode"
                placeholder="Enter authorization code"
                required
                value={formData.adminCode}
                onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Contact your system administrator for this code
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            {/* Legal Compliance */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, agreedToTerms: checked as boolean })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="agreedToTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                  </label>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreedToPrivacy"
                  checked={formData.agreedToPrivacy}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, agreedToPrivacy: checked as boolean })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="agreedToPrivacy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" variant="destructive" disabled={loading}>
              {loading ? "Creating admin account..." : "Create Admin Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an admin account?{" "}
              <Link href="/admin/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/signup" className="hover:underline">
                ← Register as farmer or service provider
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
