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
import { queryClient } from "@/lib/queryClient";

export default function LoginPage() {
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // CRITICAL: Admins must use /admin/login, not this regular login page
      if (data.user?.isAdmin) {
        setError("Admin accounts must use the Admin Portal. Please login at /admin/login");
        // Log them out since they used wrong portal
        await fetch("/api/auth/logout", { method: "POST" });
        return;
      }

      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Invalidate the auth-user query cache to force a fresh fetch
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      
      // Refetch user data to ensure fresh data is available
      await queryClient.refetchQueries({ queryKey: ["auth-user"] });

      // Redirect regular users to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      setError("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-seedling text-4xl text-primary mr-3"></i>
            <CardTitle className="text-3xl font-bold">FieldShare</CardTitle>
          </div>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                Create account
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/admin/login" className="text-destructive hover:underline">
                Admin? Login here →
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
