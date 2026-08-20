"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  // Use ref to track password reset mode to prevent redirects
  const passwordResetModeRef = useRef(false);
  
  // Check for password reset token synchronously on mount
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(() => {
    if (typeof window !== "undefined") {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      const detected = type === "recovery";
      passwordResetModeRef.current = detected;
      return detected;
    }
    return false;
  });
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") {
      setIsSignUp(true);
    }

    // FIRST: Check for password reset token in URL hash - this must happen IMMEDIATELY
    let passwordResetDetected = false;
    
    if (typeof window !== "undefined") {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken) {
        // User came from password reset email - set mode immediately
        passwordResetDetected = true;
        passwordResetModeRef.current = true;
        setIsPasswordResetMode(true);
        setCheckingAuth(false);
        // Clear the hash from URL but keep the page
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    // If password reset detected, skip auth check entirely
    if (passwordResetDetected) {
      // Set up auth listener but don't check auth
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        // Never redirect if in password reset mode
        if (passwordResetModeRef.current) {
          return;
        }
      });
      return () => subscription.unsubscribe();
    }

    // Check if user is already logged in (but NOT if we're in password reset mode)
    const checkAuth = async () => {
      // Double check password reset mode using ref
      if (passwordResetModeRef.current) {
        setCheckingAuth(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Only redirect if user exists AND we're not in password reset mode
      if (user && !passwordResetModeRef.current) {
        router.push("/dashboard");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Check URL hash again in case token was processed
      if (typeof window !== "undefined") {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get("type");
        if (type === "recovery") {
          passwordResetModeRef.current = true;
          setIsPasswordResetMode(true);
          setCheckingAuth(false);
          window.history.replaceState(null, "", window.location.pathname);
          return; // Don't redirect
        }
      }

      // If password recovery event, enable password reset mode and prevent redirect
      if (event === "PASSWORD_RECOVERY") {
        passwordResetModeRef.current = true;
        setIsPasswordResetMode(true);
        setCheckingAuth(false);
        return; // Don't redirect
      }

      // CRITICAL: Never redirect if in password reset mode (check ref for latest value)
      if (passwordResetModeRef.current || isPasswordResetMode) {
        return;
      }

      // Allow normal login redirects - only block if in password reset mode
      if (event === "SIGNED_IN" && session?.user) {
        router.push("/dashboard");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // After signup, show success message
        setSuccess("Account created! Please check your email to verify your account.");
      } else {
        // Make sure password reset mode is cleared before login
        passwordResetModeRef.current = false;
        setIsPasswordResetMode(false);
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Redirect to dashboard on successful login
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth`
          : `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccess("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess("Password updated successfully! Signing you out...");
      
      // Sign out after password update
      await supabase.auth.signOut();
      
      // Clear password reset mode and redirect to login
      setTimeout(() => {
        passwordResetModeRef.current = false;
        setIsPasswordResetMode(false);
        setNewPassword("");
        setConfirmPassword("");
        router.push("/auth");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
      setLoading(false);
    }
  };

  if (checkingAuth && !isPasswordResetMode) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-white">Checking authentication…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {/* Centered Logo */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-500/40">
            <span className="text-2xl font-semibold tracking-tight text-sky-300">
              K
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Kuvlo</h1>
          <p className="mt-2 text-sm text-white/80">
            {isPasswordResetMode
              ? "Set your new password"
              : showResetPassword
              ? "Reset your password"
              : isSignUp
              ? "Create your account"
              : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-300/50 bg-red-500/20 p-3 text-sm text-white">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-300/50 bg-green-500/20 p-3 text-sm text-white">
            {success}
          </div>
        )}

        {isPasswordResetMode ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-white"
              >
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 pr-10 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur"
                  placeholder="Enter new password (min. 6 characters)"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                >
                  {showNewPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-white"
              >
                Confirm New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 pr-10 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur"
                  placeholder="Confirm new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-white"
              >
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  passwordResetModeRef.current = false;
                  setIsPasswordResetMode(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm text-blue-300 hover:text-blue-200"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 pr-10 text-sm text-white placeholder:text-white/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 backdrop-blur"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                ? "Sign Up"
                : "Sign In"}
            </button>
          </form>
        )}

        {!showResetPassword && !isPasswordResetMode && (
          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={() => {
                setShowResetPassword(true);
                setError(null);
                setSuccess(null);
              }}
              className="block w-full text-sm text-blue-300 hover:text-blue-200"
            >
              Forgot your password?
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="block w-full text-sm text-blue-300 hover:text-blue-200"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
