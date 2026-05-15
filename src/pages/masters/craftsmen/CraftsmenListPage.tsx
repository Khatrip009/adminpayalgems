// src/pages/craftmen/CraftsmenListPage.tsx
import React, { useEffect, useState } from "react";
import {
  listCraftsmen,
  exportCraftsmenCSV,
  importCraftsmenCSV,
  deleteCraftsman,
} from "@/api/masters/craftsmen.api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function CraftsmenListPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [isInhouse, setIsInhouse] = useState<"all" | "true" | "false">("all");
  const [order, setOrder] = useState("code");
  const [direction, setDirection] = useState("asc");
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listCraftsmen({
        q,
        is_inhouse: isInhouse === "all" ? undefined : isInhouse === "true",
        limit,
        offset,
        order,
        direction,
      });
      if (res.ok) {
        setRows(res.craftsmen);
        setTotal(res.total);
      } else {
        toast.error("Failed to load craftsmen.");
      }
    } catch (err: any) {
      console.error("Load craftsmen error:", err);
      toast.error(err?.message || "Failed to load craftsmen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [q, isInhouse, order, direction, limit, offset]);

  const downloadCSV = async () => {
    try {
      const blob = await exportCraftsmenCSV({ q, order, direction });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `craftsmen_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported.");
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Failed to export CSV.");
    }
  };

  const uploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      await importCraftsmenCSV(file);
      toast.success("Import completed.");
      loadData();
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err?.message || "Failed to import CSV.");
    } finally {
      e.target.value = "";
    }
  };

  // ---------- SOFT DELETE ----------
  const handleDelete = async (craftsman: any) => {
    if (!window.confirm(`Soft‑delete "${craftsman.name}"? They will be hidden from the list.`)) return;

    setDeleting(craftsman.id);
    try {
      const res = await deleteCraftsman(craftsman.id);
      if (res.ok) {
        toast.success(`${craftsman.name} has been deleted.`);
        loadData();
      } else {
        toast.error(res.error || "Failed to delete craftsman.");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.data?.message || err?.message || "Failed to delete craftsman.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Craftsmen</h1>
        <div className="flex items-center gap-2">
          <Button onClick={downloadCSV} variant="outline">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>

          <Button variant="outline" asChild>
            <label className="flex items-center cursor-pointer">
              <Upload className="w-4 h-4 mr-1" />
              Import
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={uploadCSV}
              />
            </label>
          </Button>

          <Button onClick={() => navigate("/craftsmen/new")}>
            <Plus className="w-4 h-4 mr-1" />
            Add Craftsman
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4">
        <Input
          placeholder="Search by code or name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <Select value={isInhouse} onValueChange={setIsInhouse}>
          <SelectTrigger>In-house?</SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">In-house</SelectItem>
            <SelectItem value="false">Outsource</SelectItem>
          </SelectContent>
        </Select>

        <Select value={order} onValueChange={setOrder}>
          <SelectTrigger>Order By</SelectTrigger>
          <SelectContent>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created_at">Created</SelectItem>
          </SelectContent>
        </Select>

        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger>Direction</SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">ASC</SelectItem>
            <SelectItem value="desc">DESC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">In-house</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <Loader2 className="animate-spin inline-block mr-2" size={16} />
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No craftsmen found.
                </td>
              </tr>
            ) : (
              rows.map((c: any) => (
                <tr
                  key={c.id}
                  className={`border-b hover:bg-gray-50 cursor-pointer ${
                    c.deleted_at ? "opacity-60 line-through" : ""
                  }`}
                  onClick={() => {
                    if (!c.deleted_at) navigate(`/craftsmen/${c.id}`);
                  }}
                >
                  <td className="p-2">{c.code || "-"}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.is_inhouse
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {c.is_inhouse ? "In-house" : "Outsource"}
                    </span>
                  </td>
                  <td className="p-2">{c.contact?.phone || "-"}</td>
                  <td className="p-2">
                    {c.deleted_at ? (
                      <span className="text-red-600 text-xs font-medium">Deleted</span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">Active</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {!c.deleted_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleting === c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting === c.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          Showing {rows.length > 0 ? offset + 1 : 0}–{offset + rows.length} of{" "}
          {total}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>

          <Button
            variant="outline"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}