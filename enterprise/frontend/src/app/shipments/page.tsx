"use client";

import React, { useState, useCallback } from "react";
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
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit,
  User,
  Search,
  Plus,
  Filter,
  Download,
  Printer
} from "lucide-react";

import { CreateShipmentDialog } from "@/components/shipments/CreateShipmentDialog";
import { ViewShipmentDialog } from "@/components/shipments/ViewShipmentDialog";
import { ViewContactDialog } from "@/components/shipments/ViewContactDialog";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const shipments = [
  { id: "SKRT001001", sender: "Aditya Textiles", receiver: "Rajasthan Fabrics", origin: "Bhilwara", dest: "Ahmedabad", status: "In Transit", date: "2024-05-10" },
  { id: "SKRT001002", sender: "Global Logistics", receiver: "Metro Mart", origin: "Mumbai", dest: "Delhi", status: "Delivered", date: "2024-05-09" },
  { id: "SKRT001003", sender: "Kishore Spinners", receiver: "Cotton World", origin: "Bhilwara", dest: "Surat", status: "Booked", date: "2024-05-12" },
  { id: "SKRT001004", sender: "Prime Garments", receiver: "Fashion Hub", origin: "Jaipur", dest: "Bangalore", status: "In Transit", date: "2024-05-11" },
  { id: "SKRT001005", sender: "Royal Weavers", receiver: "Elite Stores", origin: "Bhilwara", dest: "Indore", status: "Inventory", date: "2024-05-12" },
];

const statusColors: Record<string, string> = {
  "In Transit": "bg-primary/20 text-primary border-primary/30",
  "Delivered": "bg-accent/20 text-accent border-accent/30",
  "Booked": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Inventory": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const outgoingStatusOptions = [
  'Pending', 'Loaded', 'Dispatched', 'In Transit',
  'Arrived at Branch', 'Out for Delivery', 'Delivered'
];

const outgoingStatusColors: Record<string, string> = {
  "Pending": "text-yellow-400",
  "Loaded": "text-orange-400",
  "Dispatched": "text-blue-400",
  "In Transit": "text-cyan-400",
  "Arrived at Branch": "text-indigo-400",
  "Out for Delivery": "text-violet-400",
  "Delivered": "text-green-400",
};

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [shipmentList, setShipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewConsignorOpen, setViewConsignorOpen] = useState(false);
  const [viewConsigneeOpen, setViewConsigneeOpen] = useState(false);

  const fetchLock = React.useRef(false);

  const fetchShipments = async () => {
    if (fetchLock.current) return;
    try {
      setLoading(true);
      fetchLock.current = true;
      const { data } = await api.get("/shipments");
      if (data.success) {
        setShipmentList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  };

  React.useEffect(() => {
    fetchShipments();
  }, []);

  const filteredShipments = shipmentList.filter((s) => {
    const lowerSearch = searchTerm.toLowerCase();
    const idMatch = s.consignmentNumber?.toLowerCase().includes(lowerSearch) || false;
    const consignorMatch = s.consignor?.name?.toLowerCase().includes(lowerSearch) || s.consignor?.gst?.toLowerCase().includes(lowerSearch) || false;
    const consigneeMatch = s.consignee?.name?.toLowerCase().includes(lowerSearch) || s.consignee?.gst?.toLowerCase().includes(lowerSearch) || false;
    const branchMatch = s.toBranch?.toLowerCase().includes(lowerSearch) || false;
    const vehicleMatch = s.vehicleNumber?.toLowerCase().includes(lowerSearch) || false;
    return idMatch || consignorMatch || consigneeMatch || branchMatch || vehicleMatch;
  });

  const handleOutgoingStatusChange = useCallback(async (shipmentId: string, newStatus: string) => {
    try {
      await api.put(`/shipments/${shipmentId}`, { outgoingStatus: newStatus });
      setShipmentList(prev => prev.map(s => s._id === shipmentId ? { ...s, outgoingStatus: newStatus } : s));
      toast.success(`Outgoing status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update outgoing status');
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
            <p className="text-muted-foreground">Manage and track all consignments in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <CreateShipmentDialog onShipmentCreated={fetchShipments} />
          </div>
        </div>

        <Card className="border-border/50 bg-secondary/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by consignment #, consignor, consignee, or branch..."
                  className="pl-10 bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[150px]">Consignment No</TableHead>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Consignor</TableHead>
                  <TableHead>Consignee</TableHead>
                  <TableHead>To Branch</TableHead>
                  <TableHead>Package Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Charged Weight</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Total Freight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outgoing Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(shipmentList.length > 0 ? filteredShipments : shipments).map((shipment: any) => (
                  <TableRow key={shipment._id || shipment.id} className="border-border/50 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-primary">{shipment.consignmentNumber || shipment.shipmentId || shipment.id}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground/90 font-bold">{shipment.vehicleNumber || '-'}</TableCell>
                    <TableCell>{shipment.consignor?.name || shipment.sender?.name || shipment.sender || '-'}</TableCell>
                    <TableCell>{shipment.consignee?.name || shipment.receiver?.name || shipment.receiver || '-'}</TableCell>
                    <TableCell>{shipment.toBranch || shipment.origin || '-'}</TableCell>
                    <TableCell>{shipment.packageType || shipment.dest || '-'}</TableCell>
                    <TableCell>{shipment.quantity ?? '-'}</TableCell>
                    <TableCell>{shipment.chargedWeight ?? '-'}</TableCell>
                    <TableCell>{shipment.paymentMode || '-'}</TableCell>
                    <TableCell>₹{shipment.totalFreight?.toLocaleString() || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("px-2 py-0.5", statusColors[shipment.status] || 'bg-muted text-muted-foreground border-border')}>
                        {shipment.status || 'Booked'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={shipment.outgoingStatus || 'Pending'}
                        onValueChange={(val) => handleOutgoingStatusChange(shipment._id, val)}
                      >
                        <SelectTrigger className={cn("h-8 w-[145px] text-xs font-semibold border-border/50 bg-transparent", outgoingStatusColors[shipment.outgoingStatus] || 'text-yellow-400')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {outgoingStatusOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/20"
                          onClick={() => { setSelectedShipment(shipment); setViewOpen(true); }}
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
                          <DropdownMenuContent align="end" className="w-52 z-[9999]">
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Actions</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setViewOpen(true); }}
                            >
                              <Eye className="h-4 w-4 mr-2 text-primary" /> View Shipment
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setEditOpen(true); }}
                            >
                              <Edit className="h-4 w-4 mr-2 text-yellow-500" /> Edit Shipment
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Contact Info</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setViewConsignorOpen(true); }}
                            >
                              <User className="h-4 w-4 mr-2 text-blue-400" /> View Consignor
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setViewConsigneeOpen(true); }}
                            >
                              <User className="h-4 w-4 mr-2 text-purple-400" /> View Consignee
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <ViewShipmentDialog
          open={viewOpen}
          onOpenChange={setViewOpen}
          shipment={selectedShipment}
        />
        <CreateShipmentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          shipmentData={selectedShipment}
          isEdit={true}
          onShipmentCreated={() => { fetchShipments(); setSelectedShipment(null); }}
        />
        <ViewContactDialog
          open={viewConsignorOpen}
          onOpenChange={setViewConsignorOpen}
          contact={selectedShipment?.consignor}
          title="Consignor Details"
        />
        <ViewContactDialog
          open={viewConsigneeOpen}
          onOpenChange={setViewConsigneeOpen}
          contact={selectedShipment?.consignee}
          title="Consignee Details"
        />
      </div>
    </DashboardLayout>
  );
}
