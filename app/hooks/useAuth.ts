"use client";

import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  zipcode?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  userRole: string;
  subscriptionStatus: string;
  subscriptionType?: string;
  createdAt: string;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<AuthUser>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    refetch,
  };
}
