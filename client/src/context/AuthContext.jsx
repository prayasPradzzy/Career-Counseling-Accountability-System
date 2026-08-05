"use client";

import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Automatically fetch current user on application load via GET /auth/me
  const {
    data: userData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const res = await authService.getCurrentUser();
        // Backend returns: { statusCode, data: { user }, message }
        return res?.data?.user || res?.user || null;
      } catch (err) {
        if (err.response?.status === 401 || err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 15, // 15 mins stale time for user session
    retry: false,
  });

  const user = userData || null;
  const isAuthenticated = !!user;

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (data) => authService.signup(data),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (res) => {
      const loggedInUser = res?.data?.user || res?.user;
      if (loggedInUser) {
        queryClient.setQueryData(["currentUser"], loggedInUser);
      } else {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      queryClient.setQueryData(["currentUser"], null);
      queryClient.clear();
      router.push(ROUTES.LOGIN);
    },
  });

  const value = {
    user,
    isAuthenticated,
    isLoading: isLoading || (isFetching && !userData),
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    refetchUser: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
