import React from "react";

interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const AdminCard: React.FC<AdminCardProps> = ({ className, ...rest }) => {
  const base =
    "rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft-card backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90";
  const cls = className ? `${base} ${className}` : base;
  return <div className={cls} {...rest} />;
};

export default AdminCard;
