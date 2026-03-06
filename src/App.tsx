// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

/* =========================
   PUBLIC
========================= */
import LoginPage from "./pages/auth/LoginPage";
import ReturnRequestPage from "./pages/sales/returns/ReturnRequestPage";
import ReturnConfirmationPage from "./pages/sales/returns/ReturnConfirmationPage";
import AccountReturnsPage from "./pages/production/finance/returns/AccountReturnsPage";

/* =========================
   DASHBOARD
========================= */
import DashboardHome from "./pages/dashboard/DashboardHome";

/* =========================
   CRM / REPORTS
========================= */
import AdminAnalyticsOverviewPage from "./pages/AdminAnalyticsOverviewPage";
import LeadsPage from "./pages/LeadsPage";
import NotificationsAdminPage from "./pages/system/notifications/NotificationsAdminPage";

/* =========================
   SYSTEM USERS
========================= */
import AdminUsersPage from "./pages/system/users/AdminUsersPage";
import AdminProfilePage from "./pages/system/profile/AdminProfilePage";
import AdminSecurityLogsPage from "./pages/system/security/AdminSecurityLogsPage";
import AdminSecurityAlertsPage from "./pages/system/security/AdminSecurityAlertsPage";

/* =========================
   MASTERS
========================= */
import CategoriesPage from "./pages/masters/categories/CategoriesPage";
import ProductsPage from "./pages/masters/products/ProductsPage";
import ProductDetailPage from "./pages/masters/products/ProductDetailPage";
import AdminSuppliersPage from "./pages/masters/suppliers/AdminSuppliersPage";
import AdminCustomersPage from "./pages/AdminCustomersPage";
import AdminCraftsmanPage from "./pages/AdminCraftsmanPage";

/* =========================
   PROCUREMENT
========================= */
import PurchaseOrdersPage from "./pages/procurement/purchase-orders/PurchaseOrdersPage";
import PurchaseOrderCreatePage from "./pages/procurement/purchase-orders/PurchaseOrderCreatePage";
import PurchaseOrderDetailPage from "./pages/procurement/purchase-orders/PurchaseOrderDetailPage";

import GRNListPage from "./pages/procurement/grn/GRNListPage";
import GRNCreatePage from "./pages/procurement/grn/GRNCreatePage";
import GRNDetailPage from "./pages/procurement/grn/GRNDetailPage";

import AdminSupplierInvoicesPage from "./pages/procurement/supplier-invoices/AdminSupplierInvoicesPage";
import AdminInvoiceDetailPage from "./pages/procurement/supplier-invoices/AdminInvoiceDetailPage";
import AdminSupplierPaymentsPage from "./pages/procurement/supplier-payments/AdminSupplierPaymentsPage";
import AdminSupplierLedgerPage from "./pages/procurement/supplier-ledger/AdminSupplierLedgerPage";

/* =========================
   INVENTORY
========================= */
import AdminDiamondPacketsPage from "./pages/inventory/packets/AdminDiamondPacketsPage";
import AdminPacketDetailPage from "./pages/inventory/packets/AdminPacketDetailPage";
import PacketCreatePage from "./pages/inventory/packets/PacketCreatePage";
import PacketSplitPage from "./pages/inventory/packets/PacketSplitPage";
import PacketMergePage from "./pages/inventory/packets/PacketMergePage";
import PacketLabelsPage from "./pages/inventory/packets/PacketLabelsPage";

import AdminStockMovementsPage from "./pages/inventory/movements/AdminStockMovementsPage";
import AdminWarehouseValuationPage from "./pages/inventory/valuation/AdminWarehouseValuationPage";

/* =========================
   PRODUCTION
========================= */
import AdminWorkOrdersPage from "./pages/production/work-orders/AdminWorkOrdersPage";
import AdminWorkOrderCreatePage from "./pages/production/work-orders/AdminWorkOrderCreatePage";
import AdminWorkOrderDetailPage from "./pages/production/work-orders/AdminWorkOrderDetailPage";
import AdminWorkOrderReceivePage from "./pages/production/work-orders/AdminWorkOrderReceivePage";
import AdminWorkOrderClosePage from "./pages/production/work-orders/AdminWorkOrderClosePage";

/* =========================
   FINANCE
========================= */
import AdminPaymentsPage from "./pages/production/finance/payments/AdminPaymentsPage";
import AdminPaymentDetailPage from "./pages/production/finance/payments/AdminPaymentDetailPage";
import AdminReturnsPage from "./pages/production/finance/returns/AdminReturnsPage";
import AdminReturnDetailPage from "./pages/production/finance/returns/AdminReturnDetailPage";
import AdminSettlementPage from "./pages/production/finance/settlement/AdminSettlementPage";
import AdminTaxRulesPage from "./pages/production/finance/tax/AdminTaxRulesPage";

/* =========================
   SALES
========================= */
import AdminOrdersPage from "./pages/sales/orders/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/sales/orders/AdminOrderDetailPage";
import AdminPromoCodesPage from "./pages/sales/promos/AdminPromoCodesPage";
import Sales from "./pages/sales/Sales";


/* =========================
   LOGISTICS
========================= */
import ExportsPage from "./pages/logistics/exports/ExportsPage";
import ExportHistoryPage from "./pages/logistics/exports/ExportHistoryPage";
import AdminShippingMethodsPage from "./pages/logistics/shipping/AdminShippingMethodsPage";
import AdminShippingRulesPage from "./pages/logistics/shipping/AdminShippingRulesPage";

/* =========================
   MISC
========================= */
import PrintCenterPage from "./pages/misc/PrintCenterPage";
import NotFoundPage from "./pages/misc/NotFoundPage";

/* ===================================================== */

const App: React.FC = () => {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/return/request" element={<ReturnRequestPage />} />
      <Route path="/return/confirmation" element={<ReturnConfirmationPage />} />
      <Route path="/account/returns" element={<AccountReturnsPage />} />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />

        {/* Reports / CRM */}
        <Route path="analytics" element={<AdminAnalyticsOverviewPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="notifications" element={<NotificationsAdminPage />} />

        {/* Masters */}
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="suppliers" element={<AdminSuppliersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="craftsmen" element={<AdminCraftsmanPage />} />

        {/* Procurement */}
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="purchase-orders/create" element={<PurchaseOrderCreatePage />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />

        <Route path="grn" element={<GRNListPage />} />
        <Route path="grn/create" element={<GRNCreatePage />} />
        <Route path="grn/:id" element={<GRNDetailPage />} />

        <Route path="supplier-invoices/:id" element={<AdminInvoiceDetailPage />} />
        <Route path="suppliers/:id/invoices" element={<AdminSupplierInvoicesPage />} />
        <Route path="suppliers/:id/payments" element={<AdminSupplierPaymentsPage />} />
        <Route path="suppliers/:id/ledger" element={<AdminSupplierLedgerPage />} />

        {/* Inventory */}
        <Route path="inventory/packets" element={<AdminDiamondPacketsPage />} />
        <Route path="inventory/packets/create" element={<PacketCreatePage />} />
        <Route path="inventory/packets/:id" element={<AdminPacketDetailPage />} />
        <Route path="inventory/packets/:id/split" element={<PacketSplitPage />} />
        <Route path="inventory/packets/:id/merge" element={<PacketMergePage />} />
        <Route path="inventory/labels" element={<PacketLabelsPage />} />
        <Route path="inventory/movements" element={<AdminStockMovementsPage />} />
        <Route path="inventory/valuation" element={<AdminWarehouseValuationPage />} />

        {/* Production */}
        <Route path="work-orders" element={<AdminWorkOrdersPage />} />
        <Route path="work-orders/create" element={<AdminWorkOrderCreatePage />} />
        <Route path="work-orders/:id" element={<AdminWorkOrderDetailPage />} />
        <Route path="work-orders/:id/receive" element={<AdminWorkOrderReceivePage />} />
        <Route path="work-orders/:id/close" element={<AdminWorkOrderClosePage />} />

        {/* Finance */}
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="payments/:id" element={<AdminPaymentDetailPage />} />
        <Route path="returns" element={<AdminReturnsPage />} />
        <Route path="returns/:id" element={<AdminReturnDetailPage />} />
        <Route path="settlements" element={<AdminSettlementPage />} />
        <Route path="settings/tax-rules" element={<AdminTaxRulesPage />} />

        {/* Sales */}
        <Route path="orders" element={<AdminOrdersPage />} />
         <Route path="orders/:id" element={<AdminOrderDetailPage />} />
         <Route path="sales/items" element={<Sales />} /> {/* ✅ NEW */}
         <Route path="promos" element={<AdminPromoCodesPage />} />


        {/* Logistics */}
        <Route path="exports" element={<ExportsPage />} />
        <Route path="exports/history" element={<ExportHistoryPage />} />
        <Route path="settings/shipping-methods" element={<AdminShippingMethodsPage />} />
        <Route path="settings/shipping-rules" element={<AdminShippingRulesPage />} />

        {/* System */}
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="security/logins" element={<AdminSecurityLogsPage />} />
        <Route path="security/alerts" element={<AdminSecurityAlertsPage />} />

        {/* Misc */}
        <Route path="print" element={<PrintCenterPage />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
