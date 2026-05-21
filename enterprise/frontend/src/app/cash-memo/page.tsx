"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Download, Save, Plus, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const initialForm = {
  drNo: "DR-001",
  grNo: "",
  date: today(),
  receivedOn: "",
  from: "",
  consignee: "",
  through: "",
  freight: "",
  freightPaise: "",
  labour: "",
  labourPaise: "",
  stationery: "",
  stationeryPaise: "",
  commission: "",
  commissionPaise: "",
  aoc: "",
  aocPaise: "",
};

type AmountField = "freight" | "labour" | "stationery" | "commission" | "aoc";
const amountFields: { key: AmountField; label: string }[] = [
  { key: "freight", label: "Freight" },
  { key: "labour", label: "Labour" },
  { key: "stationery", label: "Stationery" },
  { key: "commission", label: "Commission" },
  { key: "aoc", label: "A.O.C." },
];

export default function CashMemoPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalRs = amountFields.reduce((sum, f) => sum + (parseFloat(form[f.key] as string) || 0), 0);
  const totalWhole = Math.floor(totalRs);
  const totalPaise = Math.round((totalRs - totalWhole) * 100);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.drNo.trim()) { toast.error("D.R. No. is required"); return; }
    if (!form.date) { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      await api.post("/cash-memo", {
        ...form,
        freight: parseFloat(form.freight) || 0,
        freightPaise: parseFloat(form.freightPaise) || 0,
        labour: parseFloat(form.labour) || 0,
        labourPaise: parseFloat(form.labourPaise) || 0,
        stationery: parseFloat(form.stationery) || 0,
        stationeryPaise: parseFloat(form.stationeryPaise) || 0,
        commission: parseFloat(form.commission) || 0,
        commissionPaise: parseFloat(form.commissionPaise) || 0,
        aoc: parseFloat(form.aoc) || 0,
        aocPaise: parseFloat(form.aocPaise) || 0,
        totalAmount: totalRs,
      });
      toast.success("Cash memo saved successfully!");
      setForm({ ...initialForm, date: today() });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save cash memo");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    const btn = document.getElementById("cash-memo-action-bar");
    if (btn) btn.style.display = "none";
    const afterPrint = () => {
      if (btn) btn.style.display = "flex";
      window.removeEventListener("afterprint", afterPrint);
    };
    window.addEventListener("afterprint", afterPrint);
    setTimeout(() => window.print(), 80);
  };

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          @page { size: A5; margin: 8mm; }
          body > * { display: none !important; }
          #cash-memo-printable { display: block !important; }
          #cash-memo-action-bar { display: none !important; }
          .sidebar-layout, nav, header, footer { display: none !important; }
          #cash-memo-printable .receipt {
            box-shadow: none !important;
            border: 2px solid #111 !important;
            background: #fff !important;
            max-width: 100% !important;
          }
          #cash-memo-printable .receipt-inner { border-color: #555 !important; }
          #cash-memo-printable .memo-title,
          #cash-memo-printable .company-name,
          #cash-memo-printable .serial-number { color: #111 !important; text-shadow: none !important; }
          #cash-memo-printable .field-label,
          #cash-memo-printable .lbl,
          #cash-memo-printable .total-lbl,
          #cash-memo-printable .phones,
          #cash-memo-printable .dr-block { color: #1a4a8a !important; }
          #cash-memo-printable input { background: transparent !important; color: #111 !important; border-color: #555 !important; }
          #cash-memo-printable .total-row td { background: #fff8e1 !important; }
        }
      `}</style>

      <div className="space-y-6 px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cash Memo</h2>
            <p className="text-muted-foreground">Manage and generate transport cash memo</p>
          </div>

          {/* Action bar */}
          <div id="cash-memo-action-bar" className="flex flex-wrap items-center gap-3 justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 transition-all"
            >
              {saving ? <><Save className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save</>}
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 transition-all"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              className="h-9 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold flex items-center gap-2 transition-all"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Receipt card container */}
        <div className="flex justify-center w-full">
          <div id="cash-memo-printable" ref={receiptRef} className="receipt w-full max-w-[1100px] rounded-xl border border-slate-800 bg-[#0b1220] shadow-xl font-mono mb-8">
            <div className="receipt-inner border border-slate-700 m-2 p-6 rounded-lg relative overflow-hidden">

              {/* Top strip */}
              <div className="flex items-start justify-between border-b border-slate-700 pb-3 mb-4 gap-2">
                <div className="text-sm font-bold text-[#2388ff] whitespace-nowrap">
                  D.R.&nbsp;No.&nbsp;
                  <input
                    value={form.drNo}
                    onChange={(e) => set("drNo", e.target.value)}
                    maxLength={10}
                    className="w-24 border-0 border-b-2 border-[#2388ff] bg-transparent text-white font-bold text-center text-sm outline-none"
                  />
                </div>
                <div className="flex-1 text-center leading-tight">
                  <div className="text-2xl font-black text-rose-500 tracking-widest uppercase">
                    CASH MEMO
                  </div>
                </div>
                <div className="text-right text-xs font-bold text-[#2388ff] leading-relaxed">
                  96809-92567<br />86196-06627
                </div>
              </div>

              {/* Company header */}
              <div className="text-center mb-2">
                <div className="company-name text-lg font-black uppercase tracking-wide text-[#2388ff]">
                  Sant Kanwar Ram Transport Corp. (BHL)
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  123-124, Transport Nagar, BHILWARA – 311001 (Raj.)
                </div>
              </div>
              <hr className="border-slate-700 my-4" />

              {/* Body */}
              <div className="flex gap-0 items-start">

                {/* Left: Form fields */}
                <div className="flex-1 pr-6 space-y-4">
                  <div className="grid grid-cols-2 gap-x-6">
                    <div className="flex items-end gap-2">
                      <span className="text-sm font-bold text-[#2388ff] whitespace-nowrap min-w-[70px]">G.R. No.</span>
                      <input value={form.grNo} onChange={(e) => set("grNo", e.target.value)} placeholder="GR-4521" className="flex-1 border-0 border-b border-blue-800 bg-transparent text-sm text-white outline-none px-1 py-1 min-w-0 placeholder:text-slate-500 placeholder:italic" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-sm font-bold text-[#2388ff] whitespace-nowrap min-w-[30px]">Dt.</span>
                      <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="flex-1 border-0 border-b border-blue-800 bg-transparent text-sm text-white outline-none px-1 py-1 min-w-0" style={{ colorScheme: "dark" }} />
                    </div>
                  </div>
                  {[
                    { key: "receivedOn", label: "Received on", placeholder: "Truck / Vehicle No." },
                    { key: "from", label: "From", placeholder: "Origin city / station" },
                    { key: "consignee", label: "Consignee", placeholder: "Recipient name & address" },
                    { key: "through", label: "Through", placeholder: "Via / Agent name" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="flex items-end gap-2">
                      <span className="text-sm font-bold text-[#2388ff] whitespace-nowrap min-w-[90px]">{label}</span>
                      <input
                        value={(form as any)[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 border-0 border-b border-blue-800 bg-transparent text-sm text-white outline-none px-1 py-1 min-w-0 placeholder:text-slate-500 placeholder:italic"
                      />
                    </div>
                  ))}
                </div>

                {/* Right: Amount table */}
                <div className="flex-shrink-0 w-[240px]">
                  <table className="w-full border-collapse text-sm" style={{ tableLayout: "fixed" }}>
                    <caption className="text-xs font-bold text-center text-white border border-slate-700 border-b-0 bg-slate-800 py-1.5 px-2">Amount</caption>
                    <thead>
                      <tr>
                        <th className="border border-slate-700 bg-slate-800 text-[#2388ff] font-extrabold text-left text-xs px-2 py-1.5 w-[48%]">Head</th>
                        <th className="border border-slate-700 bg-slate-800 text-[#2388ff] font-extrabold text-center text-xs px-2 py-1.5 w-[30%]">Rs.</th>
                        <th className="border border-slate-700 bg-slate-800 text-[#2388ff] font-extrabold text-center text-xs px-2 py-1.5 w-[22%]">P.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amountFields.map(({ key, label }) => (
                        <tr key={key}>
                          <td className="lbl border border-slate-700 px-2 py-1 font-semibold text-slate-300 text-left">{label}</td>
                          <td className="border border-slate-700 px-1 py-1 bg-slate-900/50">
                            <input
                              type="number"
                              min="0"
                              value={(form as any)[key]}
                              onChange={(e) => set(key, e.target.value)}
                              placeholder="0"
                              className="w-full border-0 bg-transparent text-right text-sm text-white outline-none placeholder:text-slate-600"
                            />
                          </td>
                          <td className="border border-slate-700 px-1 py-1 bg-slate-900/50">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={(form as any)[`${key}Paise`]}
                              onChange={(e) => set(`${key}Paise`, e.target.value)}
                              placeholder="00"
                              className="w-full border-0 bg-transparent text-right text-sm text-white outline-none placeholder:text-slate-600"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td className="total-lbl border border-slate-700 px-2 py-1.5 bg-slate-800 font-black text-white">Total</td>
                        <td className="border border-slate-700 px-2 py-1.5 bg-slate-800 text-right font-black text-[#2388ff]">{totalWhole}</td>
                        <td className="border border-slate-700 px-2 py-1.5 bg-slate-800 text-right font-black text-[#2388ff]">{String(totalPaise).padStart(2, "0")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex justify-end items-end mt-8 pt-4 border-t border-blue-900/50">
                <div className="text-sm font-bold text-slate-400 text-center">
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="block border-t border-slate-600 mt-6 pt-1">D. Clerk</span>
                </div>
              </div>

              {/* Watermark */}
              <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden" aria-hidden>
                <span className="text-[52px] font-black tracking-[6px] uppercase select-none" style={{ color: "rgba(0,180,255,.04)" }}>Transport</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
