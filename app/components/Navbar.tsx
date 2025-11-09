"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUser, FaSignOutAlt, FaCog, FaShieldAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-seedling text-2xl text-primary"></i>
              <span className="text-xl font-bold">FieldShare</span>
            </div>
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </nav>
    );
  }

  // Hide navbar on auth pages (including admin auth pages)
  const hideNavbar = pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/admin/login" || pathname === "/admin/signup";
  
  if (hideNavbar) return null;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    return "U";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <i className="fas fa-seedling text-2xl text-primary"></i>
            <span className="text-xl font-bold">FieldShare</span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <>
                {/* Main Navigation Links */}
                <div className="hidden md:flex items-center space-x-1">
                  {/* Admin users see ONLY admin navigation */}
                  {user.isAdmin ? (
                    <Link href="/admin">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className={pathname.startsWith("/admin") ? "border-b-2 border-primary rounded-b-none" : ""}
                      >
                        <FaShieldAlt className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  ) : (
                    /* Regular users see regular navigation */
                    <>
                      <Link href="/dashboard">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={pathname === "/dashboard" ? "border-b-2 border-primary rounded-b-none" : ""}
                        >
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/fields">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={pathname === "/fields" ? "border-b-2 border-primary rounded-b-none" : ""}
                        >
                          My Fields
                        </Button>
                      </Link>
                      <Link href="/adjacent-fields">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={pathname === "/adjacent-fields" ? "border-b-2 border-primary rounded-b-none" : ""}
                        >
                          Adjacent Fields
                        </Button>
                      </Link>
                      <Link href="/subscription">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={pathname === "/subscription" ? "border-b-2 border-primary rounded-b-none" : ""}
                        >
                          Subscription
                        </Button>
                      </Link>
                      <Link href="/profile">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={pathname === "/profile" ? "border-b-2 border-primary rounded-b-none" : ""}
                        >
                          Profile
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.isAdmin && (
                          <p className="text-xs text-destructive font-semibold flex items-center gap-1">
                            <FaShieldAlt className="h-3 w-3" />
                            Admin
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Regular users only - admins don't need these links */}
                    {!user.isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer">
                            <FaUser className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/subscription" className="cursor-pointer">
                            <FaCog className="mr-2 h-4 w-4" />
                            Subscription
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
