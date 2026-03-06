// src/pages/AdminAnalyticsOverviewPage.tsx

import React, { useEffect, useState } from "react";
import {
  Users,
  Eye,
  UserPlus,
  Activity,
  Star,
  MessageCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getVisitorSummary,
  getAdminReviewStats,
  getPublicReviewStats,
  type VisitorMetrics,
  type AdminReviewStats,
  type PublicReviewStats,
} from "@/api/system/analytics.api";

interface AnalyticsState {
  visitors: VisitorMetrics | null;
  adminReviews: AdminReviewStats | null;
  publicReviews: PublicReviewStats | null;
}

const AdminAnalyticsOverviewPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsState>({
    visitors: null,
    adminReviews: null,
    publicReviews: null,
  });
  const [loading, setLoading] = useState(false);

  const formatNumber = (n: number | null | undefined) =>
    typeof n === "number" ? n.toLocaleString() : "—";

  const formatRating = (n: number | null | undefined) =>
    typeof n === "number" ? n.toFixed(1) : "—";

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [visitorRes, adminReviewRes, publicReviewRes] = await Promise.all([
        getVisitorSummary(),
        getAdminReviewStats(),
        getPublicReviewStats(),
      ]);

      if (!visitorRes.ok) throw new Error("Failed to load visitor summary");
      if (!adminReviewRes.ok) throw new Error("Failed to load review stats");
      if (!publicReviewRes.ok) throw new Error("Failed to load public ratings");

      setData({
        visitors: visitorRes.metrics,
        adminReviews: adminReviewRes.stats,
        publicReviews: publicReviewRes.stats,
      });
    } catch (err) {
      console.error("[AdminAnalyticsOverview] loadAnalytics error", err);
      toast.error("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const { visitors, adminReviews, publicReviews } = data;

  return (
    <div className="relative">
      <AdminPageHeader
        title="Analytics & Insights"
        subtitle="High-level metrics for visitors, page views, and customer reviews."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Analytics" },
        ]}
        actions={
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-8">
        {/* INFO BANNER */}
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-slate-800 dark:border-sky-700/70 dark:bg-sky-900/20 dark:text-slate-100 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 text-sky-500" />
            <div>
              <div className="font-semibold">What you&apos;re seeing</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>
                  <b>Visitor metrics</b> are powered by{" "}
                  <code className="rounded bg-slate-900/5 px-1 dark:bg-slate-900/40">
                    visitors
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-slate-900/5 px-1 dark:bg-slate-900/40">
                    visitor_daily_summary
                  </code>{" "}
                  tables.
                </li>
                <li>
                  <b>Review metrics</b> use your{" "}
                  <code className="rounded bg-slate-900/5 px-1 dark:bg-slate-900/40">
                    reviews
                  </code>{" "}
                  & <code className="rounded bg-slate-900/5 px-1 dark:bg-slate-900/40">
                    review_aggregates
                  </code>{" "}
                  data.
                </li>
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <Activity size={14} className="text-emerald-500" />
            <span>
              Data updates in real-time as visitors are tracked and reviews are
              submitted.
            </span>
          </div>
        </div>

        {/* VISITOR METRICS GRID */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Visitor & Traffic Overview
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Total Visitors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total Visitors
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  <Users size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {visitors ? formatNumber(visitors.total_visitors) : "—"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Unique visitors identified so far.
              </p>
            </div>

            {/* Visitors Today */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Visitors Today
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <UserPlus size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {visitors ? formatNumber(visitors.visitors_today) : "—"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Number of distinct visitors seen since midnight.
              </p>
            </div>

            {/* Page Views Today */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Page Views Today
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                  <Eye size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {visitors ? formatNumber(visitors.page_views_today) : "—"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Total page impressions recorded for today.
              </p>
            </div>

            {/* New Visitors Today */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  New Visitors Today
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {visitors ? formatNumber(visitors.new_visitors_today) : "—"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                First-time visitors whose very first session started today.
              </p>
            </div>
          </div>
        </section>

        {/* REVIEWS METRICS GRID */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Reviews & Social Proof
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Global rating (public stats) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Global Rating (Public)
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-200">
                  <Star size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {formatRating(publicReviews?.avg_rating)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  / 5.0
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Based on{" "}
                <b>{formatNumber(publicReviews?.total_reviews)}</b> published
                reviews shown publicly on the site.
              </p>
            </div>

            {/* Admin review stats (total vs published) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Review Moderation
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  <MessageCircle size={16} />
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Total Reviews
                  </div>
                  <div className="text-base font-semibold">
                    {formatNumber(adminReviews?.total_reviews)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Published
                  </div>
                  <div className="text-base font-semibold">
                    {formatNumber(adminReviews?.published_reviews)}
                  </div>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Keep unpublished reviews for internal feedback or moderation
                queue.
              </p>
            </div>

            {/* Admin rating avg (from admin stats) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Average Rating (All Reviews)
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <Star size={16} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {formatRating(adminReviews?.avg_rating)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  / 5.0
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Includes all stored reviews (published + unpublished) for an
                internal quality view.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminAnalyticsOverviewPage;
