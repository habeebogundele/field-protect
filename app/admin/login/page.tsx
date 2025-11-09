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

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('🔐 Attempting login...');
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      console.log('✅ Login API successful!');
      console.log('👤 User data:', data.user);
      console.log('👑 isAdmin:', data.user?.isAdmin);
      
      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if cookie was actually set
      console.log('🍪 Checking cookies...');
      const cookies = document.cookie;
      console.log('All cookies:', cookies);
      console.log('Has session cookie:', cookies.includes('session'));
      
      if (!data.user?.isAdmin) {
        console.warn('⚠️ WARNING: User is not admin!');
        setError("This account does not have admin privileges");
        return;
      }
      
      console.log('🚀 Redirecting to /admin...');
      
      // Redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 to-primary/5 p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-shield-alt text-4xl text-destructive" aria-hidden="true"></i>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in to access administrative features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-yellow-500 text-yellow-800 bg-yellow-50">
              <i className="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i>
              <AlertDescription className="text-sm">
                <strong>Admin Access Only:</strong> Unauthorized access attempts are logged.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fieldshare.app"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" variant="destructive" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Need an admin account?{" "}
              <Link href="/admin/signup" className="underline underline-offset-4 hover:text-primary">
                Request access
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="hover:underline">
                ← Regular user login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
