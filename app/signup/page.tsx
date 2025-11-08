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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    accountType: "farmer",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    address: "",
    zipcode: "",
    phoneNumber: "",
    // Business fields (for COOPs and private applicators)
    businessName: "",
    businessLicense: "",
    businessAddress: "",
    businessZipcode: "",
    // Legal compliance
    agreedToTerms: false,
    agreedToPrivacy: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isBusinessAccount = formData.accountType === "coop" || formData.accountType === "private_applicator";

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

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(formData.zipcode)) {
      setError("Please enter a valid US ZIP code (e.g., 55401 or 55401-1234)");
      return;
    }

    // Business account validation
    if (isBusinessAccount) {
      if (!formData.businessName) {
        setError("Business name is required for COOPs and service providers");
        return;
      }
      if (!zipRegex.test(formData.businessZipcode)) {
        setError("Please enter a valid business ZIP code");
        return;
      }
    }

    // Legal compliance check
    if (!formData.agreedToTerms) {
      setError("You must agree to the Terms of Service");
      return;
    }

    if (!formData.agreedToPrivacy) {
      setError("You must agree to the Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: formData.accountType,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          zipcode: formData.zipcode,
          phoneNumber: formData.phoneNumber || undefined,
          // Business fields
          businessName: isBusinessAccount ? formData.businessName : undefined,
          businessLicense: isBusinessAccount ? formData.businessLicense : undefined,
          businessAddress: isBusinessAccount ? formData.businessAddress : undefined,
          businessZipcode: isBusinessAccount ? formData.businessZipcode : undefined,
          // Legal compliance
          agreedToTerms: formData.agreedToTerms,
          agreedToPrivacyPolicy: formData.agreedToPrivacy,
          agreedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to create account");
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
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4 py-12">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
          <CardDescription className="text-center">
            Join FieldShare to manage your fields and collaborate with your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="accountType">I am a *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer (I own and manage fields)</SelectItem>
                  <SelectItem value="coop">Cooperative (COOP)</SelectItem>
                  <SelectItem value="private_applicator">Private Applicator / Custom Sprayer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.accountType === "farmer" && "Manage your fields and track adjacent field crops"}
                {formData.accountType === "coop" && "Provide spraying services and access farmer field information"}
                {formData.accountType === "private_applicator" && "Offer custom application services to farmers"}
              </p>
            </div>

            {/* Personal Information */}
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
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Business Information (for COOPs and Private Applicators) */}
            {isBusinessAccount && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">
                        {formData.accountType === "coop" ? "Cooperative Name" : "Business Name"} *
                      </Label>
                      <Input
                        id="businessName"
                        type="text"
                        placeholder={formData.accountType === "coop" ? "ABC Farmers Cooperative" : "Custom Spraying LLC"}
                        required={isBusinessAccount}
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessLicense">License Number (Optional)</Label>
                      <Input
                        id="businessLicense"
                        type="text"
                        placeholder="MN-PEST-12345"
                        value={formData.businessLicense}
                        onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pesticide applicator license number (if applicable)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessAddress">Business Address *</Label>
                      <Input
                        id="businessAddress"
                        type="text"
                        placeholder="456 Business Pkwy, City, State"
                        required={isBusinessAccount}
                        value={formData.businessAddress}
                        onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessZipcode">Business ZIP Code *</Label>
                      <Input
                        id="businessZipcode"
                        type="text"
                        placeholder="55401"
                        required={isBusinessAccount}
                        maxLength={10}
                        value={formData.businessZipcode}
                        onChange={(e) => setFormData({ ...formData, businessZipcode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Personal Address (for all users) */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">
                {isBusinessAccount ? "Primary Contact Information" : "Your Information"}
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">
                    {isBusinessAccount ? "Contact Address" : "Street Address"} *
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main Street, City, State"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your primary address for account verification
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">ZIP Code *</Label>
                    <Input
                      id="zipcode"
                      type="text"
                      placeholder="55401"
                      required
                      maxLength={10}
                      value={formData.zipcode}
                      onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll center the map to your area
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(555) 123-4567"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Security</h3>
              
              <div className="space-y-4">
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
              </div>
            </div>

            {/* Legal Compliance */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-lg font-semibold">Legal Agreement</h3>
              
              <div className="space-y-3">
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
                    <p className="text-xs text-muted-foreground">
                      We respect your privacy and comply with US data protection laws including CCPA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground px-4 mt-2">
              By creating an account, you acknowledge that you have read and understood our data practices.
              Your information will be stored securely and used only for providing FieldShare services.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
