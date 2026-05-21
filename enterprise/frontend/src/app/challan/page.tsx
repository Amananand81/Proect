"use client";

import React, { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Printer, Download, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type ChallanRow = {
  id: number;
  pkg: string;
  dest: string;
  content: string;
  consignor: string;
  consignee: string;
  total: string;
  wt: string;
};

const emptyRow = (id: number): ChallanRow => ({
  id, pkg: "", dest: "", content: "", consignor: "", consignee: "", total: "", wt: ""
});

export default function ChallanPage() {
  const [date, setDate] = useState(today());
  const [from, setFrom] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [driverName, setDriverName] = useState("");

  const [rows, setRows] = useState<ChallanRow[]>(
    Array.from({ length: 18 }, (_, i) => emptyRow(i + 1))
  );

  const [charges, setCharges] = useState({
    commission: "",
    labour: "",
    gr: "",
    crossing: ""
  });

  const [saving, setSaving] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const updateRow = (index: number, field: keyof ChallanRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, emptyRow(Date.now())]); // Use timestamp as unique id for new rows
  };

  const deleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  // Calculations
  const totalPkg = rows.reduce((sum, r) => sum + (parseFloat(r.pkg) || 0), 0);
  const totalWt = rows.reduce((sum, r) => sum + (parseFloat(r.wt) || 0), 0);
  
  const rowsTotal = rows.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
  const chargeSum = 
    (parseFloat(charges.commission) || 0) + 
    (parseFloat(charges.labour) || 0) + 
    (parseFloat(charges.gr) || 0) + 
    (parseFloat(charges.crossing) || 0);
    
  const grandTotal = rowsTotal + chargeSum;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Temporary mock save until backend is connected
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success("Challan saved successfully!");
    } catch (err) {
      toast.error("Failed to save challan");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    const btn = document.getElementById("challan-action-bar");
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
          @page { size: A4; margin: 10mm; }
          body > * { display: none !important; }
          #challan-printable { display: block !important; }
          #challan-action-bar { display: none !important; }
          .sidebar-layout, nav, header, footer { display: none !important; }
          #challan-printable .challan-wrapper {
            box-shadow: none !important;
            border: 2px solid #111 !important;
            background: #fff !important;
            max-width: 100% !important;
            margin: 0 !important;
            color: #000 !important;
          }
          #challan-printable .add-row-btn, #challan-printable .delete-btn { display: none !important; }
          #challan-printable input { background: transparent !important; color: #000 !important; border-bottom: 1px solid #555 !important; }
          #challan-printable th { background: #f0f0f0 !important; border: 1px solid #555 !important; color: #000 !important; }
          #challan-printable td { border: 1px solid #555 !important; color: #000 !important; }
          #challan-printable .totals-box { border: 2px solid #333 !important; background: transparent !important; }
          #challan-printable .text-[#2388ff], #challan-printable .text-rose-500 { color: #000 !important; }
          #challan-printable .bg-[#0b1220] { background: transparent !important; }
        }
      `}</style>

      <div className="space-y-6 px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Challan</h2>
            <p className="text-muted-foreground">Create and manage transport challans</p>
          </div>

          {/* Action bar */}
          <div id="challan-action-bar" className="flex flex-wrap items-center gap-3 justify-end">
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

        {/* Challan Card */}
        <div className="flex justify-center w-full">
          <div id="challan-printable" ref={receiptRef} className="challan-wrapper w-full max-w-[1100px] rounded-xl border border-slate-800 bg-[#0b1220] shadow-xl font-mono mb-8 p-6 text-sm">
            
            {/* HEADER */}
            <div className="text-center border-b border-blue-900/50 pb-4 mb-4">
              <div className="text-[10px] tracking-widest text-[#2388ff] mb-2 opacity-80 uppercase">
                Subject to PALI Jurisdiction
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="w-16 h-12 border border-[#2388ff]/40 rounded flex items-center justify-center text-[9px] text-[#2388ff]/80 text-center p-1 leading-tight shrink-0 uppercase font-bold">
                  SANT KANWAR<br/>RAM<br/>TRANSPORT
                </div>
                <div className="text-2xl md:text-3xl font-black tracking-wide text-rose-500 uppercase">
                  Sant Kanwar Ram Transport Corp.
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 mt-2 text-xs text-[#2388ff]">
                <span>123-124, Transport Nagar, BHILWARA - 311001 (RAJ.)</span>
                <span className="font-bold">Mob.: 96809-92567, 86196-06627</span>
              </div>
            </div>

            {/* FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">From PALI to</span>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Destination city" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5" style={{ colorScheme: "dark" }} />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Vehicle No.</span>
                <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="RJ XX GA XXXX" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Owner's Name</span>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1 md:col-span-2">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Driver's Name</span>
                <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mb-4 leading-relaxed border-l-2 border-blue-800 pl-3">
              Driver of this vehicle is responsible for goods which is loaded in this truck for safe & sound delivery as per conditions mentioned overleaf.
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto mb-4 border border-slate-700 rounded-md">
              <table className="w-full min-w-[700px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2">G.R. NO.</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[8%]">PKG.</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[15%]">DESTINATION</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[15%]">CONTENT</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[18%]">CONSIGNOR</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[18%]">CONSIGNEE</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[10%]">TOTAL</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[8%]">WT</th>
                    <th className="border border-slate-700 text-[#2388ff] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="border border-slate-700 p-1 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="border border-slate-700 p-0">
                        <input type="number" min="0" value={row.pkg} onChange={(e) => updateRow(idx, 'pkg', e.target.value)} placeholder="0" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.dest} onChange={(e) => updateRow(idx, 'dest', e.target.value)} placeholder="City" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.content} onChange={(e) => updateRow(idx, 'content', e.target.value)} placeholder="Item" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.consignor} onChange={(e) => updateRow(idx, 'consignor', e.target.value)} placeholder="Sender" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.consignee} onChange={(e) => updateRow(idx, 'consignee', e.target.value)} placeholder="Receiver" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0 bg-slate-900/40">
                        <input type="number" step="0.01" value={row.total} onChange={(e) => updateRow(idx, 'total', e.target.value)} placeholder="0.00" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0 bg-slate-900/40">
                        <input type="number" step="0.01" value={row.wt} onChange={(e) => updateRow(idx, 'wt', e.target.value)} placeholder="0.0" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0 text-center">
                        <button onClick={() => deleteRow(idx)} className="delete-btn text-rose-500 hover:text-rose-400 p-1.5" title="Remove">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="add-row-btn w-full block bg-transparent border border-dashed border-blue-900 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 hover:text-blue-300 font-bold p-2 text-xs rounded transition-all mb-6">
              <Plus className="h-3 w-3 inline mr-1" /> Add New Row
            </button>

            {/* CHARGES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 border border-slate-700 bg-slate-900/20 rounded-md p-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">COMMISSION RS. & P.</label>
                <input type="number" step="0.01" value={charges.commission} onChange={(e) => setCharges({...charges, commission: e.target.value})} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">LABOUR CHARGE RS.</label>
                <input type="number" step="0.01" value={charges.labour} onChange={(e) => setCharges({...charges, labour: e.target.value})} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">G.R.</label>
                <input type="number" step="0.01" value={charges.gr} onChange={(e) => setCharges({...charges, gr: e.target.value})} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">CROSSING / COLLECTION RS.</label>
                <input type="number" step="0.01" value={charges.crossing} onChange={(e) => setCharges({...charges, crossing: e.target.value})} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
            </div>

            {/* TOTALS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-2 border-slate-700 bg-slate-800/50 p-4 rounded-md">
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-[#2388ff] tracking-wide">TOTAL PACKAGES</div>
                <div className="text-2xl font-black text-rose-500">{totalPkg}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-[#2388ff] tracking-wide">TOTAL WEIGHT</div>
                <div className="text-2xl font-black text-rose-500">{totalWt.toFixed(1)}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-[#2388ff] tracking-wide">GRAND TOTAL (RS.)</div>
                <div className="text-2xl font-black text-rose-500">{grandTotal.toFixed(2)}</div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="text-center text-xs text-slate-400 mb-4 tracking-wide">
              Quantity & Goods of this memo received in safe and sound condition
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-end border-t border-slate-700 pt-6 mt-2 gap-8">
              <div className="text-xs text-slate-400 leading-relaxed">
                GST No. :<br/>
                <strong className="text-[#2388ff] text-sm tracking-widest">08AIMPG1878N1ZL</strong>
              </div>
              
              <div className="flex flex-col items-end gap-6 text-right w-full sm:w-auto">
                <div className="text-xs font-bold text-[#2388ff]">
                  FOR : Sant Kanwar Ram Transport Corp.
                </div>
                <div className="border-t border-slate-600 pt-1 text-xs text-slate-400 text-center w-48 mx-auto sm:mx-0">
                  Owner or Driver's Signature
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
