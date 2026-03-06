// src/pages/AdminWarehouseValuationPage.tsx
import React, { useEffect, useState } from "react";
import {
  listWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type Warehouse,
} from "@/api/masters/warehouses.api";
import {
  getWarehouseValuation,
} from "@/api/inventory/valuation.api";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash, Loader2 } from "lucide-react";


/**
 * Simple modal form component (create / edit)
 * The modal header includes company logo at public/logo_minalgems.png
 */
function WarehouseModal({
  open,
  initial,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  initial?: Partial<Warehouse> | null;
  onClose: () => void;
  onSave: (payload: {
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    is_default?: boolean;
  }) => Promise<void>;
  saving: boolean;
}) {
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [isDefault, setIsDefault] = useState(Boolean(initial?.is_default));

  useEffect(() => {
    if (open) {
      setCode(initial?.code || "");
      setName(initial?.name || "");
      setAddress(initial?.address || "");
      setPhone(initial?.phone || "");
      setIsDefault(Boolean(initial?.is_default));
      // trap focus / scrolling handled by page-level styles (fixed overlay)
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      {/* panel */}
      <div className="relative z-[10000] mt-16 w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-slate-900">
        {/* Header with logo */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <img
            src="/logo_minalgems.png"
            alt="Minal Gems"
            className="h-10 w-auto"
            onError={(e) => {
              // fallback: do nothing if missing
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1">
            <div className="font-semibold text-slate-900 dark:text-slate-50">
              {initial?.id ? "Edit Warehouse" : "New Warehouse"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Add or update warehouse details
            </div>
          </div>

          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-300"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>

        {/* body */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!code.trim() || !name.trim()) {
              toast.error("Code and name are required");
              return;
            }
            await onSave({
              code: code.trim().toUpperCase(),
              name: name.trim(),
              address: address.trim() || null,
              phone: phone.trim() || null,
              is_default: isDefault,
            });
          }}
          className="space-y-3 p-4 text-sm"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Code (unique)
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. WH-MUM-01"
              disabled={saving}
              aria-label="Warehouse code"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Name
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              disabled={saving}
              aria-label="Warehouse name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Address
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              value={address || ""}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              disabled={saving}
              aria-label="Warehouse address"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Phone
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              value={phone || ""}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              disabled={saving}
              aria-label="Warehouse phone"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_default"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="is_default" className="text-xs text-slate-700 dark:text-slate-300">
              Make this warehouse default
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : initial?.id ? (
                "Update warehouse"
              ) : (
                "Create warehouse"
              )}
            </button>

            <button
              type="button"
              onClick={() => !saving && onClose()}
              className="text-xs text-slate-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Main page
 */
export default function AdminWarehouseValuationPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [packets, setPackets] = useState<any[]>([]);
  const [loadingVal, setLoadingVal] = useState(false);
  const [loadingWh, setLoadingWh] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<Partial<Warehouse> | null>(null);
  const [saving, setSaving] = useState(false);


 async function reloadWarehouses(selectFirst = false) {
    setLoadingWh(true);
    try {
      const res = await listWarehouses();

      // ✅ FIX: normalize backend response shape
      const list =
        (res?.ok && Array.isArray(res.data) && res.data) ||
        (res?.ok && Array.isArray(res.warehouses) && res.warehouses) ||
        (Array.isArray(res) ? res : []);

      setWarehouses(list);

      if (
        selectFirst &&
        list.length &&
        (!selected || !list.find((w: any) => w.id === selected))
      ) {
        setSelected(list[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load warehouses");
    } finally {
      setLoadingWh(false);
    }
  }
   useEffect(() => {
    reloadWarehouses(true);
  }, []);

  useEffect(() => {
    async function loadValuation() {
      if (!selected) {
        setPackets([]);
        return;
      }
      setLoadingVal(true);
      try {
        const r = await getWarehouseValuation(selected);
        if (r?.ok && Array.isArray(r.packets)) setPackets(r.packets);
        else if (Array.isArray(r)) setPackets(r);
        else setPackets([]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load valuation");
        setPackets([]);
      } finally {
        setLoadingVal(false);
      }
    }
    loadValuation();
  }, [selected]);

  const total = packets.reduce(
    (s, p) =>
      s +
      Number(p.carats_in_stock || 0) *
        Number(p.weighted_cost || 0),
    0
  );


  async function handleCreate(payload: any) {
    setSaving(true);
    try {
      const res = await createWarehouse(payload);
      if (res?.ok) {
        toast.success("Created warehouse");
        setModalOpen(false);
        setModalInitial(null);
        await reloadWarehouses(true);
      } else {
        toast.error(res?.error || "Failed to create");
        console.debug(res);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create warehouse");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number, payload: any) {
    setSaving(true);
    try {
      const res = await updateWarehouse(id, payload);
      if (res?.ok) {
        toast.success("Updated warehouse");
        setModalOpen(false);
        setModalInitial(null);
        await reloadWarehouses(false);
      } else {
        toast.error(res?.error || "Failed to update");
        console.debug(res);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to update warehouse");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this warehouse? This is a soft-delete. Proceed?")) return;
    try {
      const res = await deleteWarehouse(id);
      if (res?.ok) {
        toast.success("Deleted");
        // if deleted warehouse was selected, clear selection
        if (selected === id) setSelected(null);
        await reloadWarehouses(true);
      } else {
        toast.error(res?.error || "Failed to delete");
        console.debug(res);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete warehouse");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Warehouse Valuation</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModalInitial(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            <Plus className="h-4 w-4" />
            New Warehouse
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* left: warehouses list (CRUD table) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Warehouses</h2>
            <div className="text-xs text-slate-500">
              {loadingWh ? "Loading…" : `${warehouses.length}`}
            </div>
          </div>

          <div className="overflow-auto rounded-lg border bg-white p-2 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr
                    key={w.id}
                    className={`border-t ${
                      selected === w.id ? "bg-sky-50 dark:bg-slate-800" : ""
                    }`}
                  >
                    <td
                      className="px-2 py-2 cursor-pointer"
                      onClick={() => setSelected(w.id)}
                      title={w.address || ""}
                    >
                      <div className="font-medium text-sm">{w.name}</div>
                      <div className="text-xs text-slate-500">{w.address}</div>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-600">{w.code}</td>
                    <td className="px-2 py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="p-1 rounded hover:bg-slate-100"
                          title="Edit"
                          onClick={() => {
                            setModalInitial(w);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 text-slate-600" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-rose-50"
                          title="Delete"
                          onClick={() => handleDelete(w.id)}
                        >
                          <Trash className="h-4 w-4 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {warehouses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-sm text-slate-500">
                      No warehouses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* right: valuation panel */}
        <div className="p-4 bg-white border rounded-lg dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Selected</div>
              <div className="text-lg font-semibold">
                {warehouses.find((w) => w.id === selected)?.name || "—"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Total packets</div>
              <div className="text-xl font-bold">{packets.length}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">Valuation</div>
            <div className="text-2xl font-bold">₹{Number(total).toFixed(2)}</div>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Packet</th>
                  <th className="p-2 text-right">Carats</th>
                  <th className="p-2 text-right">Weighted Cost</th>
                  <th className="p-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {loadingVal && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-sm text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading valuation…
                      </div>
                    </td>
                  </tr>
                )}

                {!loadingVal && packets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-sm text-slate-500">
                      No packets in this warehouse.
                    </td>
                  </tr>
                )}

                {!loadingVal &&
                  packets.map((p) => (
                    <tr key={p.packet_id} className="border-t">
                      <td className="p-2">{p.packet_code}</td>
                      <td className="p-2 text-right">{p.carats_in_stock}</td>
                      <td className="p-2 text-right">₹{Number(p.weighted_cost || 0).toFixed(2)}</td>
                      <td className="p-2 text-right">
                        ₹{(Number(p.carats_in_stock || 0) * Number(p.weighted_cost || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* modal */}
      <WarehouseModal
        open={modalOpen}
        initial={modalInitial}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setModalInitial(null);
          }
        }}
        onSave={async (payload) => {
          if (modalInitial?.id) {
            await handleUpdate(modalInitial.id as number, payload);
          } else {
            await handleCreate(payload);
          }
        }}
        saving={saving}
      />
    </div>
  );
}
