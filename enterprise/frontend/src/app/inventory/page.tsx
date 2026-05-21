"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Printer,
  Truck,
  Receipt,
  PlusSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

import api from "@/lib/api";
import { toast } from "sonner";
import { CreateInventoryDialog } from "@/components/inventory/CreateInventoryDialog";
import { EditInventoryDialog } from "@/components/inventory/EditInventoryDialog";
import { ViewInventoryDialog } from "@/components/inventory/ViewInventoryDialog";
import { DeleteInventoryDialog } from "@/components/inventory/DeleteInventoryDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export default function InventoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchLock = React.useRef(false);

  const fetchInventory = async () => {
    if (fetchLock.current) return;
    try {
      setLoading(true);
      fetchLock.current = true;
      const { data } = await api.get("/inventory");
      if (data.success) {
        setInventoryList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory records", error);
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventoryList.filter(item => 
    item.inventoryId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lrNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cargoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (filteredInventory.length === 0) {
      toast.info("No records to export");
      return;
    }
    const headers = ["Inventory ID", "LR No", "Cargo Name", "Sender Name", "Receiver Name", "Origin", "Destination", "Packages", "Weight", "Rate", "Total Freight", "Payment Mode", "Incoming Status", "Date"];
    const csvRows = filteredInventory.map(item => [
      item.inventoryId,
      item.lrNo,
      `"${item.cargoName || ''}"`,
      `"${item.senderName || ''}"`,
      `"${item.receiverName || ''}"`,
      item.origin,
      item.destination,
      item.packages,
      item.weight,
      item.rate,
      item.totalFreight,
      item.paymentMode,
      item.incomingStatus,
      new Date(item.createdAt).toLocaleDateString()
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
            <p className="text-muted-foreground">Manage inventory and cargo records</p>
          </div>
          <div id="cash-memo-action-bar" className="flex flex-wrap items-center gap-3 justify-end">
            <Button
              size="sm"
              onClick={() => router.push("/challan")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-blue-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Challan
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/cash-memo")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-blue-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" /> Cash Memo
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/entry")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-violet-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <PlusSquare className="h-4 w-4" /> Entry
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="border-border/50 hover:bg-secondary">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <CreateInventoryDialog onCreated={fetchInventory} />
          </div>
        </div>

        <Card className="border-border/50 bg-secondary/20 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by ID, LR No, Cargo, Sender or Destination..." 
                  className="pl-10 bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="sm" className="hover:bg-background/40">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[110px]">Inventory ID</TableHead>
                  <TableHead className="w-[100px]">LR No</TableHead>
                  <TableHead>Cargo Name</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-center">Packages</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>Incoming Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && inventoryList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                      Loading inventory records...
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                      No inventory records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item: any) => (
                    <TableRow key={item._id} className="border-border/50 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono font-bold text-primary">{item.inventoryId}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{item.lrNo}</TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate" title={item.cargoName}>
                        {item.cargoName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium max-w-[120px] truncate" title={item.senderName}>{item.senderName}</span>
                          <span className="text-[10px] text-muted-foreground">{item.origin}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.destination}</TableCell>
                      <TableCell className="text-center font-mono">{item.packages}</TableCell>
                      <TableCell className="text-right font-mono">{item.weight} kg</TableCell>
                      <TableCell className="text-xs">{item.incomingStatus || "N/A"}</TableCell>
                      <TableCell className="text-xs font-medium">{item.challanStatus}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/20"
                            onClick={() => { setSelectedItem(item); setViewOpen(true); }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
                                <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-semibold">Record Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => { setSelectedItem(item); setViewOpen(true); }}
                              >
                                <Eye className="h-4 w-4 mr-2 text-primary" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => { setSelectedItem(item); setEditOpen(true); }}
                              >
                                <Edit className="h-4 w-4 mr-2 text-yellow-500" /> Edit Record
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-semibold">Dispatch / Challan</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => router.push("/challan")}
                                className="font-medium text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 hover:bg-emerald-500/10"
                              >
                                <Truck className="h-4 w-4 mr-2" /> Open Challan
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => { setSelectedItem(item); setDeleteOpen(true); }}
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal Dialogs */}
        <ViewInventoryDialog 
          open={viewOpen} 
          onOpenChange={setViewOpen} 
          item={selectedItem} 
        />
        <EditInventoryDialog 
          open={editOpen} 
          onOpenChange={setEditOpen} 
          item={selectedItem} 
          onUpdated={() => { setSelectedItem(null); fetchInventory(); }} 
        />
        <DeleteInventoryDialog 
          open={deleteOpen} 
          onOpenChange={setDeleteOpen} 
          item={selectedItem} 
          onDeleted={() => { setSelectedItem(null); fetchInventory(); }} 
        />
      </div>
    </DashboardLayout>
  );
}
