"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { loginAction, signupAction } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const [mode, setMode] = useState(initialMode);
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Signup State
  const [signupState, signupDispatch, isSignupPending] = useActionState(
    signupAction,
    null,
  );
  // Login State
  const [loginState, loginDispatch, isLoginPending] = useActionState(
    loginAction,
    null,
  );

  const isLoading = isSignupPending || isLoginPending || isAuthenticating;

  useEffect(() => {
    if (signupState?.success) {
      const email = signupState.email;
      const password = signupState.password;
      if (email && password) {
        setIsAuthenticating(true);
        setAuthError(null);
        signIn("credentials", {
          email,
          password,
          redirect: false,
        }).then((result) => {
          if (result?.ok) {
            router.push("/");
          } else {
            setIsAuthenticating(false);
            setAuthError(
              result?.error || "Authentication failed. Please try again.",
            );
          }
        });
      }
    }
  }, [signupState, router]);

  useEffect(() => {
    if (loginState?.success) {
      const email = loginState.email;
      const password = loginState.password;
      if (email && password) {
        setIsAuthenticating(true);
        setAuthError(null);
        signIn("credentials", {
          email,
          password,
          redirect: false,
        }).then((result) => {
          if (result?.ok) {
            router.push("/");
          } else {
            setIsAuthenticating(false);
            const error = result?.error;
            if (error) {
              // NextAuth adds "Error: " prefix to thrown errors
              const message = error.replace(/^Error:\s*/, "");
              setAuthError(message);
            } else {
              setAuthError("Authentication failed. Please try again.");
            }
          }
        });
      }
    }
  }, [loginState, router]);

  const currentState = mode === "signup" ? signupState : loginState;
  const currentDispatch = mode === "signup" ? signupDispatch : loginDispatch;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Error Messages */}
      <AnimatePresence mode="wait">
        {authError && (
          <motion.div
            key="auth-error"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex items-start gap-3 p-4 bg-white/40 backdrop-blur-md border border-red-500/10 rounded-xl shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-500/60 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700/70">{authError}</p>
          </motion.div>
        )}
        {!authError &&
          currentState &&
          !currentState.success &&
          "error" in currentState &&
          currentState.error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex items-start gap-3 p-4 bg-white/40 backdrop-blur-md border border-red-500/10 rounded-xl shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-500/60 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700/70">
                {currentState.error}
              </p>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Form */}
      <motion.form variants={itemVariants} action={currentDispatch}>
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Name Field (Signup Only) */}
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="space-y-2"
                >
                  <label className="text-[11px] font-bold text-text-700 uppercase tracking-wider ml-1">
                    Full Name
                  </label>
                  <motion.div
                    whileFocus={{ scale: 1.01 }}
                    className="relative group"
                  >
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-600 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      name="name"
                      defaultValue={(signupState as any)?.name}
                      className="w-full h-14 bg-secondary-100 border border-text-900/10 rounded-xl px-5 pl-12 font-medium text-text-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all placeholder:text-text-500"
                      placeholder="John Doe"
                    />
                  </motion.div>
                  {currentState?.errors?.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold text-red-500 ml-1"
                    >
                      {currentState.errors.name[0]}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[11px] font-bold text-text-700 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                className="relative group"
              >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-600 group-focus-within:text-primary-600 transition-colors" />
                <input
                  name="email"
                  type="email"
                  defaultValue={
                    (signupState as any)?.email || (loginState as any)?.email
                  }
                  className="w-full h-14 bg-secondary-100 border border-text-900/10 rounded-xl px-5 pl-12 font-medium text-text-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all placeholder:text-text-500"
                  placeholder="john@example.com"
                />
              </motion.div>
              {currentState?.errors?.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-red-500 ml-1"
                >
                  {currentState.errors.email[0]}
                </motion.p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-text-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === "login" && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="#"
                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot?
                  </motion.a>
                )}
              </div>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                className="relative group"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-600 group-focus-within:text-primary-600 transition-colors" />
                <input
                  name="password"
                  type="password"
                  className="w-full h-14 bg-secondary-100 border border-text-900/10 rounded-xl px-5 pl-12 font-medium text-text-900 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition-all placeholder:text-text-500"
                  placeholder="••••••••"
                />
              </motion.div>
              {currentState?.errors?.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-primary-600 ml-1"
                >
                  {currentState.errors.password[0]}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-linear-to-r from-primary-600 to-primary-700 hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-xl active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="animate-spin w-5 h-5" />
                  {isAuthenticating ? (
                    <span>Signing in...</span>
                  ) : (
                    <span>
                      {mode === "login"
                        ? "Signing in..."
                        : "Creating account..."}
                    </span>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  {mode === "login" ? "Sign In" : "Create Account"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* OR Divider */}
          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-text-900/10" />
            <span className="text-[10px] font-bold text-text-400 uppercase tracking-widest whitespace-nowrap">
              or continue with
            </span>
            <div className="flex-1 h-px bg-text-900/10" />
          </div>

          {/* Google Sign In */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={isLoading}
            className="w-full h-14 bg-white border border-text-900/10 hover:bg-secondary-100 text-text-900 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </motion.button>

          {/* Mode Toggle */}
          <motion.div
            variants={itemVariants}
            className="text-center pt-4 border-t border-text-900/10"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() =>
                router.push(mode === "login" ? "/signup" : "/login")
              }
              className="text-xs font-semibold text-text-600"
            >
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <span className="text-primary-600 hover:text-primary-700 transition-colors">
                    Sign Up
                  </span>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <span className="text-primary-600 hover:text-primary-700 transition-colors">
                    Sign In
                  </span>
                </p>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.form>
    </motion.div>
  );
}
