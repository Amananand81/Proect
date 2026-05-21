"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Plus, Printer } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

function formatConsignmentNumber(index: number) {
  return `SKRT${String(index).padStart(6, '0')}`;
}

const initialContactForm = {
  gst: '',
  name: '',
  phoneNumber: '',
  state: '',
  building: '',
  place: '',
  city: ''
};

export function CreateShipmentDialog({ 
  onShipmentCreated,
  shipmentData,
  isEdit = false,
  open: externalOpen,
  onOpenChange: setExternalOpen
}: { 
  onShipmentCreated: () => void;
  shipmentData?: any;
  isEdit?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactType, setContactType] = useState<'consignor' | 'consignee'>('consignor');
  const [loading, setLoading] = useState(false);
  const [savingPrint, setSavingPrint] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [formData, setFormData] = useState({
    consignmentNumber: formatConsignmentNumber(1),
    toBranch: '',
    consignorId: '',
    consigneeId: '',
    bookedAt: new Date().toISOString().slice(0, 10),
    ewayParta: '',
    invoiceNumber: '',
    invoiceValue: '',
    description: '',
    quantity: '',
    packageType: '',
    privateNumber: '',
    actualWeight: '',
    chargedWeight: '',
    rateType: '',
    rate: '',
    paymentMode: '',
    hamali: '',
    stationaryCharge: '',
    miscellaneousCharge: '',
    vehicleNumber: '',
    outgoingStatus: 'Pending',
    totalFreight: 0,
    totalPayable: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedConsignor = useMemo(
    () => contacts.find((item) => item._id === formData.consignorId),
    [contacts, formData.consignorId]
  );
  const selectedConsignee = useMemo(
    () => contacts.find((item) => item._id === formData.consigneeId),
    [contacts, formData.consigneeId]
  );

  const numericValue = (value: string | number) => {
    if (typeof value === 'number') return value;
    const sanitized = String(value).replace(/[^0-9.-]+/g, '');
    const parsed = Number(sanitized);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const totalFreight = useMemo(
    () => numericValue(formData.chargedWeight) * numericValue(formData.rate),
    [formData.chargedWeight, formData.rate]
  );

  const totalPayable = useMemo(
    () =>
      totalFreight +
      numericValue(formData.hamali) +
      numericValue(formData.stationaryCharge) +
      numericValue(formData.miscellaneousCharge),
    [totalFreight, formData.hamali, formData.stationaryCharge, formData.miscellaneousCharge]
  );

  const consignorOptions = useMemo(
    () => contacts.filter((item) => item.type === 'consignor'),
    [contacts]
  );

  const consigneeOptions = useMemo(
    () => contacts.filter((item) => item.type === 'consignee'),
    [contacts]
  );

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/contacts');
      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error('Failed to load contacts', error);
    }
  };

  const loadNextConsignmentNumber = async () => {
    try {
      const { data } = await api.get('/shipments/next-number');
      if (data.success) {
        setFormData((prev) => ({ ...prev, consignmentNumber: data.data.consignmentNumber }));
      }
    } catch (error) {
      console.error('Failed to fetch next consignment number', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadContacts();
      if (!isEdit) {
        resetForm();
        loadNextConsignmentNumber();
      } else if (shipmentData) {
        setFormData({
          consignmentNumber: shipmentData.consignmentNumber || '',
          toBranch: shipmentData.toBranch || '',
          consignorId: shipmentData.consignor?._id || '', 
          consigneeId: shipmentData.consignee?._id || '',
          bookedAt: shipmentData.bookedAt ? new Date(shipmentData.bookedAt).toISOString().slice(0, 10) : '',
          ewayParta: shipmentData.ewayParta || '',
          invoiceNumber: shipmentData.invoiceNumber || '',
          invoiceValue: String(shipmentData.invoiceValue || ''),
          description: shipmentData.description || '',
          quantity: String(shipmentData.quantity || ''),
          packageType: shipmentData.packageType || '',
          privateNumber: shipmentData.privateNumber || '',
          actualWeight: String(shipmentData.actualWeight || ''),
          chargedWeight: String(shipmentData.chargedWeight || ''),
          rateType: shipmentData.rateType || '',
          rate: String(shipmentData.rate || ''),
          paymentMode: shipmentData.paymentMode || '',
          hamali: String(shipmentData.hamali || ''),
          stationaryCharge: String(shipmentData.stationaryCharge || ''),
          miscellaneousCharge: String(shipmentData.miscellaneousCharge || ''),
          vehicleNumber: shipmentData.vehicleNumber || '',
          outgoingStatus: shipmentData.outgoingStatus || 'Pending',
          totalFreight: shipmentData.totalFreight || 0,
          totalPayable: shipmentData.totalPayable || 0
        });
      }
      setErrors({});
    }
  }, [open, isEdit, shipmentData]);

  // Sync calculated totals to formData whenever inputs change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalFreight: totalFreight,
      totalPayable: totalPayable
    }));
  }, [totalFreight, totalPayable]);

  const resetForm = () => {
    setFormData({
      consignmentNumber: formatConsignmentNumber(1),
      toBranch: '',
      consignorId: '',
      consigneeId: '',
      bookedAt: new Date().toISOString().slice(0, 10),
      ewayParta: '',
      invoiceNumber: '',
      invoiceValue: '',
      description: '',
      quantity: '',
      packageType: '',
      privateNumber: '',
      actualWeight: '',
      chargedWeight: '',
      rateType: '',
      rate: '',
      paymentMode: '',
      hamali: '',
      stationaryCharge: '',
      miscellaneousCharge: '',
      vehicleNumber: '',
      outgoingStatus: 'Pending',
      totalFreight: 0,
      totalPayable: 0
    });
    setErrors({});
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.toBranch.trim()) nextErrors.toBranch = 'To Branch is required.';
    if (!formData.consignorId) nextErrors.consignorId = 'Consignor is required.';
    if (!formData.consigneeId) nextErrors.consigneeId = 'Consignee is required.';
    if (!formData.invoiceValue || numericValue(formData.invoiceValue) <= 0) nextErrors.invoiceValue = 'Invoice Value is required.';
    if (!formData.description.trim()) nextErrors.description = 'Description is required.';
    if (!formData.quantity || numericValue(formData.quantity) <= 0) nextErrors.quantity = 'Quantity is required.';
    if (!formData.packageType.trim()) nextErrors.packageType = 'Package Type is required.';
    if (!formData.privateNumber.trim()) nextErrors.privateNumber = 'Private Number is required.';
    if (!formData.actualWeight || numericValue(formData.actualWeight) <= 0) nextErrors.actualWeight = 'Actual Weight is required.';
    if (!formData.chargedWeight || numericValue(formData.chargedWeight) <= 0) nextErrors.chargedWeight = 'Charged Weight is required.';
    if (!formData.rateType.trim()) nextErrors.rateType = 'Rate Type is required.';
    if (!formData.rate || numericValue(formData.rate) <= 0) nextErrors.rate = 'Rate is required.';
    if (!formData.paymentMode.trim()) nextErrors.paymentMode = 'Payment Mode is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildShipmentPayload = () => ({
    consignmentNumber: formData.consignmentNumber,
    toBranch: formData.toBranch,
    consignor: selectedConsignor || {
      gst: '',
      name: '',
      phoneNumber: '',
      state: '',
      building: '',
      place: '',
      city: ''
    },
    consignee: selectedConsignee || {
      gst: '',
      name: '',
      phoneNumber: '',
      state: '',
      building: '',
      place: '',
      city: ''
    },
    bookedAt: formData.bookedAt,
    ewayParta: formData.ewayParta,
    invoiceNumber: formData.invoiceNumber,
    invoiceValue: numericValue(formData.invoiceValue),
    description: formData.description,
    quantity: numericValue(formData.quantity),
    packageType: formData.packageType,
    privateNumber: formData.privateNumber,
    actualWeight: numericValue(formData.actualWeight),
    chargedWeight: numericValue(formData.chargedWeight),
    rateType: formData.rateType,
    rate: numericValue(formData.rate),
    paymentMode: formData.paymentMode,
    hamali: numericValue(formData.hamali),
    stationaryCharge: numericValue(formData.stationaryCharge),
    miscellaneousCharge: numericValue(formData.miscellaneousCharge),
    totalFreight: Number(formData.totalFreight || 0),
    totalPayable: Number(formData.totalPayable || 0),
    status: 'Booked',
    vehicleNumber: formData.vehicleNumber,
    outgoingStatus: formData.outgoingStatus
  });

  const submitShipment = async (printAfterSave = false) => {
    if (!validate()) return;
    
    const payload = buildShipmentPayload();
    console.log('Submitting shipment payload:', payload);

    setLoading(true);
    try {
      if (isEdit && shipmentData?._id) {
        await api.put(`/shipments/${shipmentData._id}`, payload);
        toast.success('Shipment updated successfully!');
      } else {
        await api.post('/shipments', buildShipmentPayload());
        toast.success('Shipment created successfully!');
      }
      setOpen(false);
      onShipmentCreated();
      if (!isEdit) resetForm();
      if (printAfterSave) {
        setTimeout(() => window.print(), 250);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
      setSavingPrint(false);
    }
  };

  const createContact = async () => {
    const nextErrors: Record<string, string> = {};
    if (!contactForm.gst.trim()) nextErrors.gst = 'GST is required.';
    if (!contactForm.name.trim()) nextErrors.name = 'Name is required.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    try {
      const payload = {
        type: contactType,
        ...contactForm
      };
      const { data } = await api.post('/contacts', payload);
      if (data.success) {
        setContacts((prev) => [...prev, data.data]);
        setFormData((prev) => ({
          ...prev,
          [`${contactType}Id`]: data.data._id
        }));
        setContactDialogOpen(false);
        setContactForm(initialContactForm);
        toast.success(`${contactType === 'consignor' ? 'Consignor' : 'Consignee'} created successfully!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save contact');
    }
  };

  const renderError = (field: string) => {
    return errors[field] ? <p className="text-sm text-destructive mt-1">{errors[field]}</p> : null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> New Shipment
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[90vw] max-w-[1400px] min-w-[1000px] h-[85vh] p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-start justify-between gap-3 border-b border-border/50 px-8 py-6">
          <div>
            <DialogTitle className="text-3xl font-bold text-foreground">
              {isEdit ? 'Edit Shipment' : 'Create New Shipment'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {!isEdit ? (
                <>Next possible consignment number: <span className="font-semibold text-primary text-base">{formData.consignmentNumber}</span></>
              ) : (
                <>Updating consignment: <span className="font-semibold text-primary text-base">{formData.consignmentNumber}</span></>
              )}
            </DialogDescription>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6" onSubmit={(e) => { e.preventDefault(); submitShipment(false); }}>
            {/* Row 1: To Branch, Vehicle Number, Consignor, Consignee */}
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">To Branch *</Label>
              <Input
                value={formData.toBranch}
                onChange={(e) => setFormData({ ...formData, toBranch: e.target.value })}
                placeholder="To Branch"
                className="h-11 w-full rounded-lg"
              />
              {renderError('toBranch')}
            </div>

            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Vehicle Number</Label>
              <Input
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="e.g. RJ-27-GA-1234"
                className="h-11 w-full rounded-lg"
              />
            </div>

            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Consignor *</Label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Select
                    value={formData.consignorId}
                    onValueChange={(value) => setFormData({ ...formData, consignorId: value })}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg">
                      <SelectValue placeholder="GST / Name" />
                    </SelectTrigger>
                    <SelectContent>
                      {consignorOptions.map((contact) => (
                        <SelectItem key={contact._id} value={contact._id}>
                          {contact.gst} - {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button"
                  onClick={() => { setContactType('consignor'); setContactDialogOpen(true); }} 
                  className="w-[90px] h-11 flex-shrink-0 rounded-lg bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> New
                </Button>
              </div>
              {selectedConsignor ? (
                <p className="text-xs text-muted-foreground">{selectedConsignor.name} · {selectedConsignor.gst}</p>
              ) : null}
              {renderError('consignorId')}
            </div>

            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Consignee *</Label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Select
                    value={formData.consigneeId}
                    onValueChange={(value) => setFormData({ ...formData, consigneeId: value })}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg">
                      <SelectValue placeholder="GST / Name" />
                    </SelectTrigger>
                    <SelectContent>
                      {consigneeOptions.map((contact) => (
                        <SelectItem key={contact._id} value={contact._id}>
                          {contact.gst} - {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button"
                  onClick={() => { setContactType('consignee'); setContactDialogOpen(true); }} 
                  className="w-[90px] h-11 flex-shrink-0 rounded-lg bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> New
                </Button>
              </div>
              {selectedConsignee ? (
                <p className="text-xs text-muted-foreground">{selectedConsignee.name} · {selectedConsignee.gst}</p>
              ) : null}
              {renderError('consigneeId')}
            </div>

            {/* Row 2: Booked At, Eway Parta, Invoice Number, Invoice Value */}
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Booked At</Label>
              <Input
                type="date"
                value={formData.bookedAt}
                onChange={(e) => setFormData({ ...formData, bookedAt: e.target.value })}
                className="h-11 w-full rounded-lg"
              />
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Eway Parta</Label>
              <Input
                value={formData.ewayParta}
                onChange={(e) => setFormData({ ...formData, ewayParta: e.target.value })}
                placeholder="Optional"
                className="h-11 w-full rounded-lg"
              />
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Invoice Number</Label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="Optional"
                className="h-11 w-full rounded-lg"
              />
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Invoice Value *</Label>
              <Input
                type="number"
                value={formData.invoiceValue}
                onChange={(e) => setFormData({ ...formData, invoiceValue: e.target.value })}
                placeholder="Invoice Value"
                className="h-11 w-full rounded-lg"
              />
              {renderError('invoiceValue')}
            </div>

            {/* Row 3: Description, Quantity, Package Type, Private Number */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <Label className="text-sm font-semibold">Description *</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter shipment description"
                className="h-11 w-full rounded-lg"
              />
              {renderError('description')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Quantity *</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Quantity"
                className="h-11 w-full rounded-lg"
              />
              {renderError('quantity')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Package Type *</Label>
              <Select
                value={formData.packageType}
                onValueChange={(value) => setFormData({ ...formData, packageType: value })}
              >
                <SelectTrigger className="h-11 w-full rounded-lg">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Bale">Bale</SelectItem>
                  <SelectItem value="Bag">Bag</SelectItem>
                  <SelectItem value="Case">Case</SelectItem>
                  <SelectItem value="Bundle">Bundle</SelectItem>
                  <SelectItem value="Loose">Loose</SelectItem>
                </SelectContent>
              </Select>
              {renderError('packageType')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Private Number *</Label>
              <Input
                value={formData.privateNumber}
                onChange={(e) => setFormData({ ...formData, privateNumber: e.target.value })}
                placeholder="Private Number"
                className="h-11 w-full rounded-lg"
              />
              {renderError('privateNumber')}
            </div>

            {/* Row 4: Actual Weight, Charged Weight, Rate Type, Rate */}
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Actual Weight *</Label>
              <Input
                type="number"
                value={formData.actualWeight}
                onChange={(e) => setFormData({ ...formData, actualWeight: e.target.value })}
                placeholder="Actual Weight"
                className="h-11 w-full rounded-lg"
              />
              {renderError('actualWeight')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Charged Weight *</Label>
              <Input
                type="number"
                value={formData.chargedWeight}
                onChange={(e) => setFormData({ ...formData, chargedWeight: e.target.value })}
                placeholder="Charged Weight"
                className="h-11 w-full rounded-lg"
              />
              {renderError('chargedWeight')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Rate Type *</Label>
              <Select
                value={formData.rateType}
                onValueChange={(value) => setFormData({ ...formData, rateType: value })}
              >
                <SelectTrigger className="h-11 w-full rounded-lg">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Per Kg">Per Kg</SelectItem>
                  <SelectItem value="Per Pkg">Per Pkg</SelectItem>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
              {renderError('rateType')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Rate *</Label>
              <Input
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="Rate"
                className="h-11 w-full rounded-lg"
              />
              {renderError('rate')}
            </div>

            {/* Row 5: Payment Mode, Hamali, Stationary Charge, Miscellaneous Charge */}
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Payment Mode *</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
              >
                <SelectTrigger className="h-11 w-full rounded-lg">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ToPay">To Pay</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="TBB">TBB</SelectItem>
                </SelectContent>
              </Select>
              {renderError('paymentMode')}
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Hamali</Label>
              <Input
                type="number"
                value={formData.hamali}
                onChange={(e) => setFormData({ ...formData, hamali: e.target.value })}
                placeholder="Optional"
                className="h-11 w-full rounded-lg"
              />
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Stationary Charge</Label>
              <Input
                type="number"
                value={formData.stationaryCharge}
                onChange={(e) => setFormData({ ...formData, stationaryCharge: e.target.value })}
                placeholder="Optional"
                className="h-11 w-full rounded-lg"
              />
            </div>
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Miscellaneous Charge</Label>
              <Input
                type="number"
                value={formData.miscellaneousCharge}
                onChange={(e) => setFormData({ ...formData, miscellaneousCharge: e.target.value })}
                placeholder="Optional"
                className="h-11 w-full rounded-lg"
              />
            </div>

            {/* Outgoing Status */}
            <div className="col-span-1 space-y-3">
              <Label className="text-sm font-semibold">Outgoing Status</Label>
              <Select
                value={formData.outgoingStatus}
                onValueChange={(value) => setFormData({ ...formData, outgoingStatus: value })}
              >
                <SelectTrigger className="h-11 w-full rounded-lg">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Loaded">Loaded</SelectItem>
                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Arrived at Branch">Arrived at Branch</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 6: Total Freight and Total Payable */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <Label className="text-sm font-semibold">Total Freight</Label>
              <div className="h-11 flex items-center px-4 rounded-lg bg-primary/10 text-primary font-semibold border border-primary/20">
                ₹{totalFreight.toLocaleString()}
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-3">
              <Label className="text-sm font-semibold">Total Payable</Label>
              <div className="h-11 flex items-center px-4 rounded-lg bg-primary/10 text-primary font-semibold border border-primary/20">
                ₹{totalPayable.toLocaleString()}
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-4 border-t border-border/50 px-8 py-5 bg-background">
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 rounded-lg font-medium text-muted-foreground hover:bg-accent">
            Cancel
          </Button>
          <Button onClick={() => submitShipment(false)} disabled={loading} className="h-11 px-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all active:scale-95">
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={() => { setSavingPrint(true); submitShipment(true); }} disabled={loading || savingPrint} className="h-11 px-8 rounded-lg bg-secondary hover:bg-secondary/90 text-foreground font-semibold shadow-sm transition-all active:scale-95">
            <Printer className="w-4 h-4 mr-2" /> Save and Print
          </Button>
        </div>
      </DialogContent>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="w-[90vw] max-w-[800px] bg-background border border-border shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-border/50 px-6 py-6">
            <DialogTitle className="text-2xl font-bold">New {contactType === 'consignor' ? 'Consignor' : 'Consignee'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Add new contact details and then select it in the form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">GST *</Label>
                <Input
                  value={contactForm.gst}
                  onChange={(e) => setContactForm({ ...contactForm, gst: e.target.value })}
                  placeholder="GST Number"
                  className="h-11 rounded-lg"
                />
                {renderError('gst')}
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Name *</Label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Name"
                  className="h-11 rounded-lg"
                />
                {renderError('name')}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Phone Number</Label>
                <Input
                  value={contactForm.phoneNumber}
                  onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                  placeholder="Phone Number"
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">State</Label>
                <Input
                  value={contactForm.state}
                  onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                  placeholder="State"
                  className="h-11 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Building</Label>
                <Input
                  value={contactForm.building}
                  onChange={(e) => setContactForm({ ...contactForm, building: e.target.value })}
                  placeholder="Building"
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Place</Label>
                <Input
                  value={contactForm.place}
                  onChange={(e) => setContactForm({ ...contactForm, place: e.target.value })}
                  placeholder="Place"
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">City</Label>
                <Input
                  value={contactForm.city}
                  onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                  placeholder="City"
                  className="h-11 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-8 py-5 border-t border-border/50 bg-background">
            <Button variant="ghost" onClick={() => setContactDialogOpen(false)} className="h-11 px-6 rounded-lg font-medium text-muted-foreground hover:bg-accent">Cancel</Button>
            <Button onClick={createContact} className="h-11 px-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all active:scale-95">
              Add Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
