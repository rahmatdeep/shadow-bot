"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMailLine,
  RiLockLine,
  RiUserLine,
  RiLoader4Line,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
} from "react-icons/ri";
import { loginAction, signupAction } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState(initialMode);

  // Sync mode with route changes for smooth internal transitions
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [signupState, signupDispatch, isSignupPending] = useActionState(
    signupAction,
    undefined,
  );
  const [loginState, loginDispatch, isLoginPending] = useActionState(
    loginAction,
    undefined,
  );

  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [passwordKey, setPasswordKey] = useState(0);

  const currentState = mode === "signup" ? signupState : loginState;
  const currentDispatch = mode === "signup" ? signupDispatch : loginDispatch;
  const isLoading = isSignupPending || isLoginPending || isAuthenticating;

  useEffect(() => {
    // If signup is successful, we can auto-login using the credentials returned from signupAction
    const successData = signupState?.success
      ? signupState
      : loginState?.success
        ? loginState
        : null;

    if (successData?.success && successData?.email && successData?.password) {
      setIsAuthenticating(true);
      setAuthError("");

      signIn("credentials", {
        email: successData.email,
        password: successData.password,
        redirect: false,
      }).then((result) => {
        if (result?.error) {
          // Use the real error from the backend if available
          setAuthError(result.error);
          setIsAuthenticating(false);
          setPasswordKey((prev) => prev + 1); // Reset password field
          if (signupState?.success) setMode("login");
        } else {
          router.push("/");
          router.refresh();
        }
      });
    }

    if ((signupState as any)?.error) {
      setAuthError((signupState as any).error);
      setPasswordKey((prev) => prev + 1); // Reset password field
    }
  }, [signupState, loginState, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Error Display */}
      <AnimatePresence mode="wait">
        {authError && (
          <motion.div
            key="auth-error"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex items-start gap-3 p-4 bg-red-50/80 backdrop-blur-md border border-red-200/50 rounded-xl shadow-sm"
          >
            <RiErrorWarningLine className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600">{authError}</p>
          </motion.div>
        )}

        {signupState?.success && (
          <motion.div
            key="signup-success"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex items-start gap-3 p-4 bg-green-50/80 backdrop-blur-md border border-green-200/50 rounded-xl shadow-sm"
          >
            <RiCheckboxCircleLine className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-700">
              Account created! Sign in below.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form layout variants={itemVariants} action={currentDispatch}>
        <motion.div layout className="space-y-5">
          {/* Name Field (signup only) */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                layout
                initial={{ height: 0, opacity: 0, scale: 0.9 }}
                animate={{ height: "auto", opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-text-500 uppercase tracking-wider ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <RiUserLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400 group-focus-within:text-text-700 transition-colors" />
                    <input
                      name="name"
                      type="text"
                      defaultValue={signupState?.name || ""}
                      className="w-full h-12 bg-secondary-200 border border-text-200/60 rounded-xl px-5 pl-12 font-medium text-text-900 outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-text-400"
                      placeholder="John Doe"
                    />
                  </div>
                  {currentState?.errors?.name && (
                    <p className="text-xs text-red-500 font-medium ml-1">
                      {currentState.errors.name.join(", ")}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <motion.div
            layout
            layoutId="email-field"
            variants={itemVariants}
            className="space-y-2"
          >
            <label className="text-[11px] font-semibold text-text-500 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative group">
              <RiMailLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400 group-focus-within:text-text-700 transition-colors" />
              <input
                name="email"
                type="email"
                defaultValue={
                  (mode === "login" ? loginState?.email : signupState?.email) ||
                  ""
                }
                className="w-full h-12 bg-secondary-200 border border-text-200/60 rounded-xl px-5 pl-12 font-medium text-text-900 outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-text-400"
                placeholder="john@example.com"
              />
            </div>
            {currentState?.errors?.email && (
              <p className="text-xs text-red-500 font-medium ml-1">
                {currentState.errors.email.join(", ")}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            layout
            layoutId="password-field"
            variants={itemVariants}
            className="space-y-2"
          >
            <label className="text-[11px] font-semibold text-text-500 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <RiLockLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400 group-focus-within:text-text-700 transition-colors" />
              <input
                key={passwordKey}
                name="password"
                type="password"
                className="w-full h-12 bg-secondary-200 border border-text-200/60 rounded-xl px-5 pl-12 font-medium text-text-900 outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-text-400"
                placeholder="••••••••"
              />
            </div>
            {currentState?.errors?.password && (
              <div className="space-y-1 ml-1">
                {currentState.errors.password.map(
                  (err: string, idx: number) => (
                    <p key={idx} className="text-xs text-red-500 font-medium">
                      {err}
                    </p>
                  ),
                )}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          layout
          layoutId="submit-button"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="group relative overflow-hidden w-full h-12 bg-text-900 text-white rounded-full font-semibold transition-all shadow-[0_0_30px_-5px_rgba(102,102,255,0.4)] hover:shadow-[0_0_50px_-5px_rgba(102,102,255,0.6)] mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Shimmer sweep overlay */}
          <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
                animation: "shimmer-slide 3s ease-in-out infinite",
              }}
            />
          </span>
          {/* Accent underline glow */}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-linear-to-r from-transparent via-accent-400/60 to-transparent" />

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 flex items-center gap-2"
              >
                <RiLoader4Line className="w-4 h-4 animate-spin" />
                {isAuthenticating ? "Signing in..." : "Processing..."}
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 flex items-center gap-2"
              >
                {mode === "signup" ? "Create Account" : "Sign In"}
                <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-text-200/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white/80 text-xs font-medium text-text-400">
              or
            </span>
          </div>
        </div>

        {/* Google Sign In */}
        <motion.div
          layout
          layoutId="google-button"
          variants={itemVariants}
          className="btn-animated-border group"
        >
          {/* Spinning gradient border */}
          <div className="spin-gradient" />
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={isLoading}
            className="relative z-10 w-full h-12 bg-white/90 backdrop-blur-xl rounded-full font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-text-800 hover:bg-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          layout
          layoutId="mode-toggle"
          variants={itemVariants}
          className="text-center mt-6"
        >
          <p className="text-sm text-text-500">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                const newMode = mode === "login" ? "signup" : "login";
                setMode(newMode);
                setAuthError("");
                router.push(newMode === "login" ? "/login" : "/signup");
              }}
              className="font-semibold text-text-900 hover:text-accent-600 transition-colors underline underline-offset-2 decoration-text-300 hover:decoration-accent-500"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
