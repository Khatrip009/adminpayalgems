import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import {
  listWarehouses,
  type Warehouse,
} from "@/api/masters/warehouses.api";

/* =====================================================
   TYPES
===================================================== */

type WarehouseContextType = {
  warehouses: Warehouse[];
  warehouseId: number | null;
  setWarehouseId: (id: number | null) => void;
  loading: boolean;
  reloadWarehouses: () => Promise<void>;
};

/* =====================================================
   CONTEXT
===================================================== */

const WarehouseContext =
  createContext<WarehouseContextType | undefined>(undefined);

/* =====================================================
   PROVIDER
===================================================== */

export function WarehouseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /* =====================================================
     LOAD WAREHOUSES (GLOBAL, SAFE)
  ===================================================== */
  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);

      const res = await listWarehouses();

      /**
       * apiFetch may return:
       *  - direct array
       *  - { rows }
       *  - { data }
       */
      const rows: Warehouse[] =
        (res as any)?.rows ??
        (res as any)?.data ??
        (Array.isArray(res) ? res : []);

      setWarehouses(rows);

      /* ---------------------------------------------
         AUTO-SELECT DEFAULT WAREHOUSE
         Priority:
         1) is_default === true
         2) first warehouse
      --------------------------------------------- */
      if (rows.length && warehouseId == null) {
        const defaultWh =
          rows.find(w => w.is_default) ?? rows[0];
        setWarehouseId(defaultWh.id);
      }
    } catch (err) {
      console.error("Warehouse load failed:", err);
      toast.error("Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  /* =====================================================
     INITIAL LOAD (ONCE)
  ===================================================== */
  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */
  const value: WarehouseContextType = {
    warehouses,
    warehouseId,
    setWarehouseId,
    loading,
    reloadWarehouses: loadWarehouses,
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
}

/* =====================================================
   HOOK
===================================================== */

export function useWarehouse(): WarehouseContextType {
  const ctx = useContext(WarehouseContext);
  if (!ctx) {
    throw new Error(
      "useWarehouse must be used within WarehouseProvider"
    );
  }
  return ctx;
}
