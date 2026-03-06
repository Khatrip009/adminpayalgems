import type React from "react";
import {
  LayoutDashboard,
  Database,
  Store,
  Users,
  Gem,
  Package,
  Shuffle,
  FileText,
  ClipboardList,
  Hammer,
  ShoppingBag,
  CreditCard,
  Receipt,
  Truck,
  Globe2,
  BarChart3,
  Tag,
  Settings,
  User,
  Lock,
  Clock,
  ShieldAlert,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  /* =========================
     DASHBOARD
  ========================= */
  {
    title: "Dashboard",
    items: [
      { label: "Overview", path: "/admin", icon: LayoutDashboard },
    ],
  },

  /* =========================
     MASTERS
  ========================= */
  {
    title: "Masters",
    items: [
      { label: "Categories", path: "/admin/categories", icon: Database },
      { label: "Products", path: "/admin/products", icon: Package },
      { label: "Warehouses", path: "/admin/inventory/warehouses", icon: Store },
      { label: "Craftsmen", path: "/admin/craftsmen", icon: Users },
      { label: "Suppliers", path: "/admin/suppliers", icon: Store },
      { label: "Customers", path: "/admin/customers", icon: Users },
    ],
  },

  /* =========================
     PROCUREMENT
  ========================= */
  {
    title: "Procurement",
    items: [
      { label: "Purchase Orders", path: "/admin/purchase-orders", icon: FileText },
      { label: "Goods Receipt (GRN)", path: "/admin/grn", icon: Receipt },
      { label: "Supplier Invoices", path: "/admin/supplier-invoices", icon: FileText },
      { label: "Supplier Payments", path: "/admin/supplier-payments", icon: CreditCard },
      { label: "Supplier Ledger", path: "/admin/supplier-ledger", icon: ClipboardList },
    ],
  },

  /* =========================
     INVENTORY
  ========================= */
  {
    title: "Inventory",
    items: [
      { label: "Diamond Packets", path: "/admin/inventory/packets", icon: Gem },
      { label: "Stock Movements", path: "/admin/inventory/movements", icon: Shuffle },
      { label: "Inventory Valuation", path: "/admin/inventory/valuation", icon: BarChart3 },
    ],
  },

  /* =========================
     PRODUCTION
  ========================= */
  {
    title: "Production",
    items: [
      { label: "Work Orders", path: "/admin/work-orders", icon: Hammer },
      { label: "Create Work Order", path: "/admin/work-orders/create", icon: FileText },
    ],
  },

 /* =========================
   SALES
========================= */
{
  title: "Sales",
  items: [
    { label: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { label: "Sales Items", path: "/admin/sales/items", icon: Receipt }, // ✅ NEW
    { label: "Invoices", path: "/admin/invoices", icon: FileText },
    { label: "Payments", path: "/admin/payments", icon: CreditCard },
    { label: "Returns", path: "/admin/returns", icon: Receipt },
    { label: "Settlements", path: "/admin/settlements", icon: ClipboardList },
  ],
},


  /* =========================
     LOGISTICS & EXPORTS
  ========================= */
  {
    title: "Logistics & Exports",
    items: [
      { label: "Shipping Methods", path: "/admin/settings/shipping-methods", icon: Truck },
      { label: "Shipping Rules", path: "/admin/settings/shipping-rules", icon: Truck },
      { label: "Exports", path: "/admin/exports", icon: Globe2 },
      { label: "Export History", path: "/admin/exports/history", icon: FileText },
    ],
  },

  /* =========================
     CRM & MARKETING
  ========================= */
  {
    title: "CRM & Marketing",
    items: [
      { label: "Leads", path: "/admin/leads", icon: Users },
      { label: "Notifications", path: "/admin/notifications", icon: ClipboardList },
      { label: "Promo Codes", path: "/admin/promos", icon: Tag },
    ],
  },

  /* =========================
     REPORTS
  ========================= */
  {
    title: "Reports",
    items: [
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    ],
  },

  /* =========================
     SYSTEM & ACCOUNT
  ========================= */
  {
    title: "System",
    items: [
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Tax Rules", path: "/admin/settings/tax-rules", icon: Settings },
      { label: "My Profile", path: "/admin/profile", icon: User },
      { label: "Change Password", path: "/admin/security/change-password", icon: Lock },
      { label: "Login Activity", path: "/admin/security/logins", icon: Clock },
      { label: "Security Alerts", path: "/admin/security/alerts", icon: ShieldAlert },
    ],
  },
];
