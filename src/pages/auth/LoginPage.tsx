// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const { login } = useAuth(); // ✅ use the hook, no direct AuthContext

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fromPath = location.state?.from || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      // our AuthContext.login throws on failure
      await login(email, password);

      toast.success("Welcome back!");
      navigate(fromPath, { replace: true });
    } catch (err: any) {
      console.error("Login error", err);
      const msg =
        err?.message || "Invalid email or password. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF7FB] via-[#FFF9F2] to-[#FFEFFC] flex items-center justify-center px-4 py-8 font-body">
      <div className="w-full max-w-5xl rounded-3xl bg-white/80 shadow-2xl shadow-pink-100/70 overflow-hidden border border-pink-50 backdrop-blur-sm">
        <div className="grid md:grid-cols-2 min-h-[460px]">
          {/* LEFT PANEL — IMAGE */}
          <motion.div
            className="hidden md:flex items-center justify-center relative overflow-hidden"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            style={{
              backgroundImage: `url('/images/products/product04.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* RIGHT PANEL — LOGIN FORM */}
          <div className="flex flex-col justify-center px-6 py-8 md:px-10">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center gap-3 md:justify-start">
              <img
                src="/minal_gems_logo.svg"
                alt="Minal Gems"
                className="h-20 w-auto drop-shadow-sm"
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-pink-500">
                  Minal Gems
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Jewellery for all occasions
                </p>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Login with your registered email and password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 mt-7">
              {/* EMAIL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-full border border-pink-100 bg-white/80 py-3 pl-11 pr-3 text-base text-slate-800 shadow-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full rounded-full border border-pink-100 bg-white/80 py-3 pl-11 pr-11 text-base text-slate-800 shadow-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {errorMsg && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-100">
                  {errorMsg}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-base font-semibold text-white shadow-md hover:from-pink-600 hover:to-rose-600 disabled:opacity-70"
              >
                {submitting ? (
                  <span className="text-sm">Signing you in...</span>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* For admin-only dashboard you can remove this if you don’t want public register */}
            <p className="mt-5 text-center text-sm text-slate-500">
              Don&apos;t have an account yet?{" "}
              <Link
                to="/register"
                className="font-semibold text-pink-500 hover:text-pink-600"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Move this later to global CSS if you want */}
      <style>{`
        .font-body {
          font-family: ui-sans-serif, system-ui, -apple-system, "Inter", Arial;
        }

        input[type="text"],
        input[type="password"],
        input[type="email"] {
          transition: box-shadow 0.18s ease, transform 0.12s ease;
        }

        input:focus {
          box-shadow: 0 8px 20px rgba(232, 121, 149, 0.12);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
