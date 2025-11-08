"use client";

import { useSession } from "next-auth/react";

interface AuthUser {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
  isAdmin: boolean;
  userRole: string;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    isAdmin: session.user.isAdmin,
    userRole: session.user.userRole,
  } : null;

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!session,
  };
}
