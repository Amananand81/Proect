"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Printer, X, Plus, Trash2, Search, Save, Edit as EditIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type EntryRow = {
  id?: number | string;
  from: string;
  to: string;
  grNo: string;
  consignor: string;
  consignee: string;
  contents: string;
  freight: string;
  challanNo: string;
  drNo: string;
  dod: string;
};

const emptyRow = (id: number): EntryRow => ({
  id, from: "", to: "", grNo: "", consignor: "", consignee: "", contents: "", freight: "", challanNo: "", drNo: "", dod: ""
});

export default function EntryRegisterPage() {
  const [rows, setRows] = useState<EntryRow[]>(
    Array.from({ length: 30 }, (_, i) => emptyRow(i + 1))
  );

  const [pageNo, setPageNo] = useState("");
  const [dateSearch, setDateSearch] = useState("");
  const [registerId, setRegisterId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch from Backend by Date
  useEffect(() => {
    let active = true;
    const fetchEntries = async () => {
      if (!dateSearch) {
        if (active) {
          setRegisterId(null);
          // Only reset to empty rows if we weren't just searching text.
          setRows(Array.from({ length: 30 }, (_, i) => emptyRow(1000 + i)));
        }
        return;
      }
      
      try {
        setLoading(true);
        const res = await api.get(`/entry/date/${dateSearch}`);
        if (res.data.success && res.data.data && active) {
          setRegisterId(res.data.data._id);
          setPageNo(res.data.data.pageNo || "");
          const existingRows = res.data.data.entries || [];
          
          // Ensure at least 30 rows appear in the UI
          const newRows = [...existingRows];
          while (newRows.length < 30) {
            newRows.push(emptyRow(Date.now() + newRows.length));
          }
          setRows(newRows);
        }
      } catch (err: any) {
        if (err.response?.status === 404 && active) {
          // No record exists for this date, provide a clean slate for saving
          setRegisterId(null);
          setRows(Array.from({ length: 30 }, (_, i) => emptyRow(2000 + i)));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEntries();
    return () => { active = false; };
  }, [dateSearch]);

  // Local Text Search Highlighting logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchCount(0);
      return;
    }
    const lowerQ = searchQuery.toLowerCase();
    let count = 0;
    rows.forEach(r => {
      const match = Object.values(r).some(val => 
        String(val).toLowerCase().includes(lowerQ)
      );
      if (match) count++;
    });
    setMatchCount(count);
  }, [searchQuery, rows]);

  const updateRow = (index: number, field: keyof EntryRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, emptyRow(Date.now())]);
  };

  const deleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const deleteLastRow = () => {
    if (rows.length === 0) return;
    setRows(rows.slice(0, -1));
  };

  const clearAll = () => {
    if (confirm("Clear all entries? This will clear the table rows visually.")) {
      setRows(Array.from({ length: 30 }, (_, i) => emptyRow(3000 + i)));
      setRegisterId(null);
      setPageNo("");
      setDateSearch("");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        pageNo,
        dateSearch,
        entries: rows.filter(r => r.grNo || r.from || r.to) // Only save rows that have at least some data if preferred, but user said keep 30. We'll save all rows.
      };
      
      const payloadAll = { pageNo, dateSearch, entries: rows };

      if (registerId) {
        await api.put(`/entry/${registerId}`, payloadAll);
        toast.success("Delivery Register updated successfully.");
      } else {
        const res = await api.post(`/entry`, payloadAll);
        if (res.data.success) {
          setRegisterId(res.data.data._id);
          toast.success("Delivery Register saved successfully.");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save the register.");
    } finally {
      setSaving(false);
    }
  };

  const isMatch = (row: EntryRow) => {
    if (!searchQuery.trim()) return false;
    const lowerQ = searchQuery.toLowerCase();
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(lowerQ)
    );
  };

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          @page { size: A3 landscape; margin: 10mm; }
          body > * { display: none !important; }
          #entry-printable { display: block !important; }
          #entry-action-bar { display: none !important; }
          .sidebar-layout, nav, header, footer { display: none !important; }
          #entry-printable .entry-wrapper {
            box-shadow: none !important;
            border: 2px solid #333 !important;
            background: #fff !important;
            max-width: 100% !important;
            margin: 0 !important;
            color: #000 !important;
            padding: 10px !important;
          }
          #entry-printable .del-btn { display: none !important; }
          #entry-printable .print-hide { display: none !important; }
          #entry-printable input { background: transparent !important; color: #000 !important; border: 0 !important; }
          #entry-printable th { background: #e8ecf0 !important; border-bottom: 2px solid #333 !important; color: #111 !important; border: 1px solid #999; }
          #entry-printable td { border: 1px solid #999 !important; color: #111 !important; }
          #entry-printable .sno-cell { background: #f0f0f0 !important; border-right: 2px solid #333 !important; }
          #entry-printable .text-[#2388ff], #entry-printable .text-rose-500 { color: #000 !important; text-shadow: none !important; }
          #entry-printable .bg-[#0b1220] { background: transparent !important; }
          #entry-printable .highlight { background: transparent !important; }
        }
      `}</style>

      <div className="space-y-6 px-8 py-8 h-full max-w-full">
        {/* Page header & Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Entry</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              Delivery register entry management
              {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            </p>
          </div>

          <div id="entry-action-bar" className="flex flex-wrap items-center gap-2.5">
            <div className="relative mr-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search entries…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-700 w-[180px] xl:w-[220px] text-sm h-9"
              />
              {matchCount > 0 && (
                <span className="absolute right-3 top-2.5 text-xs font-mono text-[#2388ff]">
                  {matchCount} match{matchCount > 1 ? "es" : ""}
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className={`h-9 px-4 rounded-lg font-medium transition-all ${
                registerId 
                  ? "bg-amber-600 hover:bg-amber-500 text-white border border-amber-600" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600"
              }`}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (registerId ? <EditIcon className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />)}
              {registerId ? "Update" : "Save"}
            </Button>

            <Button
              size="sm"
              onClick={addRow}
              className="h-9 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-blue-600 hover:text-white border border-slate-700 font-medium transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Row
            </Button>
            <Button
              size="sm"
              onClick={deleteLastRow}
              className="h-9 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-orange-600 hover:text-white border border-slate-700 font-medium transition-all"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Last
            </Button>
            <Button
              size="sm"
              onClick={clearAll}
              className="h-9 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-red-600 hover:text-white border border-slate-700 font-medium transition-all"
            >
              <X className="h-4 w-4 mr-1.5" /> Clear All
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-semibold transition-all"
            >
              <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
            </Button>
          </div>
        </div>

        {/* Register Sheet */}
        <div id="entry-printable" className="w-full flex justify-center mt-6">
          <div className="entry-wrapper w-full max-w-[1450px] rounded-xl border border-slate-800 bg-[#0b1220] shadow-xl p-8 relative overflow-hidden">
            
            {/* Header Titles */}
            <div className="text-center border-b border-slate-700/60 pb-5 mb-6 relative">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-[#2388ff] drop-shadow-md">
                Sant <span className="text-rose-500">Kanwar Ram</span> Transport Corporation
              </h1>
              <div className="text-xs uppercase tracking-[4px] text-slate-400 mt-2 font-medium">
                Transport Nagar · Bhilwara (Raj.)
              </div>
              <div className="text-sm font-bold uppercase tracking-[4px] text-[#2388ff] mt-4 border-2 border-slate-800 px-6 py-2 inline-block rounded/50 bg-slate-900/50">
                ◈ Delivery Register ◈
              </div>

              {/* Page Number & Date Search */}
              <div className="absolute right-0 bottom-4 text-xs font-mono text-slate-400 flex flex-col md:flex-row items-end md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">NO.</span>
                  <input 
                    type="text" 
                    value={pageNo}
                    onChange={(e) => setPageNo(e.target.value)}
                    placeholder="—"
                    className="w-16 bg-transparent border-0 border-b-2 border-rose-500/50 text-rose-500 font-bold text-center outline-none focus:border-rose-500"
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 pl-3 pr-1 py-1 rounded-md print-hide">
                  <span className="font-bold text-[#2388ff]">DATE SEARCH:</span>
                  <div className="relative flex items-center">
                    <input 
                      type="date"
                      value={dateSearch}
                      onChange={(e) => setDateSearch(e.target.value)}
                      className="bg-transparent text-white outline-none border-0 text-sm font-mono focus:ring-0"
                      style={{ colorScheme: "dark" }}
                    />
                    {dateSearch && (
                      <button 
                        onClick={() => setDateSearch("")} 
                        className="bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-full p-1 ml-1 transition-colors" 
                        title="Clear Date"
                      >
                         <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto border border-slate-700 rounded-md bg-slate-900/40">
              <table className="w-full min-w-[1150px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 border-b-2 border-[#2388ff]/60">
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[4%]">S.No.</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[7%]">From</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[7%]">To</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[8%]">G. R. No.</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[12%]">Consignor</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[12%]">Consignee</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[12%]">Contents</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[6%]">Freight</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[10%] border-x-2 border-x-slate-500 bg-slate-700/40">Challan No.</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[11%]">Delivery Receipt<br/>No.</th>
                    <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[11%]">Date of Delivery</th>
                    <th className="w-8 print-hide"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-slate-800/40 transition-colors group ${isMatch(row) ? 'bg-[#2388ff]/30' : idx % 2 === 0 ? '' : 'bg-slate-900/40'}`}
                    >
                      <td className="border border-slate-700 text-center font-mono text-slate-400 bg-slate-900/50 truncate">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.from} onChange={(e) => updateRow(idx, 'from', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.to} onChange={(e) => updateRow(idx, 'to', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.grNo} onChange={(e) => updateRow(idx, 'grNo', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.consignor} onChange={(e) => updateRow(idx, 'consignor', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.consignee} onChange={(e) => updateRow(idx, 'consignee', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.contents} onChange={(e) => updateRow(idx, 'contents', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.freight} onChange={(e) => updateRow(idx, 'freight', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      {/* NEW CHALLAN NO COLUMN */}
                      <td className="border-y border-y-slate-700 border-x-2 border-x-slate-600 p-0 shadow-inner bg-slate-800/20">
                        <input type="text" value={row.challanNo} onChange={(e) => updateRow(idx, 'challanNo', e.target.value)} className="w-full h-full p-1.5 bg-transparent font-bold text-emerald-400 border-0 outline-none focus:bg-emerald-900/30 text-center" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.drNo} onChange={(e) => updateRow(idx, 'drNo', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                      </td>
                      <td className="border border-slate-700 p-0 relative">
                        <input type="text" value={row.dod} onChange={(e) => updateRow(idx, 'dod', e.target.value)} className="w-full h-full p-1.5 bg-transparent border-0 text-white outline-none focus:bg-[#2388ff]/10" />
                        <button 
                          onClick={() => deleteRow(idx)} 
                          className="del-btn print-hide absolute right-1 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded p-[2px]" 
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
