import React, { useEffect, useState } from "react";
import {
  listCraftsmen,
  exportCraftsmenCSV,
  importCraftsmenCSV,
} from "@/api/masters/craftsmen.api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Download, Upload, Plus } from "lucide-react";

export default function CraftsmenListPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [isInhouse, setIsInhouse] = useState<"all" | "true" | "false">("all");
  const [order, setOrder] = useState("code");
  const [direction, setDirection] = useState("asc");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const loadData = async () => {
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
    }
  };

  useEffect(() => {
    loadData();
  }, [q, isInhouse, order, direction, limit, offset]);

  const downloadCSV = async () => {
    const blob = await exportCraftsmenCSV({ q, order, direction });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `craftsmen_${Date.now()}.csv`;
    a.click();
  };

  const uploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await importCraftsmenCSV(file);
    loadData();
  };

  return (
    <div className="p-6 space-y-6">
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
              <input type="file" className="hidden" onChange={uploadCSV} />
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
              <th className="p-2 text-left">Updated</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c: any) => (
              <tr
                key={c.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/craftsmen/${c.id}`)}
              >
                <td className="p-2">{c.code || "-"}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.is_inhouse ? "Yes" : "No"}</td>
                <td className="p-2">{c.contact?.phone || "-"}</td>
                <td className="p-2">{new Date(c.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div>Total: {total}</div>

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
