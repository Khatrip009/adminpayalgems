import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Download } from "lucide-react";

interface Breadcrumb {
  label: string;
  path?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  right?: React.ReactNode;
}

const AdminPageHeaderComponent: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  right,
}) => {
  const content = actions || right;

  const isPdfButton = (child: any) => {
    if (!React.isValidElement(child)) return false;

    const className = child.props.className || "";
    const hasDownloadIcon =
      Array.isArray(child.props.children) &&
      child.props.children.some((c: any) => c?.type === Download);

    const classIncludesPdf = className.toLowerCase().includes("pdf");

    return hasDownloadIcon || classIncludesPdf;
  };

  const enhancePdfButton = (child: any) =>
    React.cloneElement(child, {
      className:
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold " +
        "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 " +
        "hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-[0.97] disabled:opacity-60",
    });

  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl px-6 py-5 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
              {breadcrumbs.map((bc, idx) => (
                <div key={idx} className="flex items-center">
                  {bc.path ? (
                    <Link
                      to={bc.path}
                      className="hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                      {bc.label}
                    </Link>
                  ) : (
                    <span>{bc.label}</span>
                  )}

                  {idx < breadcrumbs.length - 1 && (
                    <ChevronRight className="mx-1 h-3 w-3" />
                  )}
                </div>
              ))}
            </nav>
          )}

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {content && (
          <div className="flex items-center gap-3">
            {React.Children.map(content, (child: any) => {
              if (!React.isValidElement(child)) return child;
              return isPdfButton(child) ? enhancePdfButton(child) : child;
            })}
          </div>
        )}
      </div>
    </header>
  );
};

// ⭐️ Named export
export const AdminPageHeader = AdminPageHeaderComponent;

// ⭐️ Default export (makes imports always work)
export default AdminPageHeaderComponent;
