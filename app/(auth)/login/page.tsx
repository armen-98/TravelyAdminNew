"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, MapPin, ShieldAlert } from "lucide-react";
import axios, { AxiosError } from "axios";
import type { ApiSignInResponse } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginForm) => {
    setIsLoading(true);
    setApiError(null);

    // ── Step 1: Call NestJS API directly ─────────────────────────────────────
    let apiData: ApiSignInResponse;
    try {
      const { data } = await axios.post<ApiSignInResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sign-in`,
        { email: formData.email, password: formData.password }
      );
      apiData = data;
    } catch (err) {
      const error = err as AxiosError<{ message: string | string[] }>;
      const raw = error.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw[0]
        : raw ?? "Unable to connect to the server. Please try again.";
      setApiError(message);
      toast.error(message);
      setIsLoading(false);
      return;
    }

    // ── Step 2: Role gate ─────────────────────────────────────────────────────
    const role = apiData.user?.role?.name ?? "user";
    if (!["admin", "super-admin", "moderator"].includes(role)) {
      const message = "Access denied. Admin or Moderator privileges required.";
      setApiError(message);
      toast.error(message);
      setIsLoading(false);
      return;
    }

    // ── Step 3: Hand pre-verified data to next-auth to create the session ─────
    const result = await signIn("credentials", {
      id: String(apiData.user.id),
      email: apiData.user.email,
      name: apiData.user.fullName,
      role,
      accessToken: apiData.token,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      // Should not happen since we already validated, but guard anyway
      const message = "Session could not be created. Please try again.";
      setApiError(message);
      toast.error(message);
      return;
    }

    toast.success(`Welcome back, ${apiData.user.fullName}!`);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Travely Admin</h1>
          <p className="text-slate-400 mt-2">Sign in to your admin dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* API error banner */}
            {apiError && (
              <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3">
                <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{apiError}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                placeholder="admin@travely.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Super Admin, Admin, and Moderator access only
          </p>
        </div>
      </div>
    </div>
  );
}
