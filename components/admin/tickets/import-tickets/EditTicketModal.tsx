// components/admin/tickets/import-tickets/EditTicketModal.tsx
'use client';

import { useState } from 'react';
import { ImportTicketData } from '@/lib/actions/ticket/ticket-importer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ImportTicketData;
  originalData: any;
  rowNumber: number;
  onSave: (editedTicket: ImportTicketData) => void;
}

export default function EditTicketModal({
  isOpen,
  onClose,
  ticket,
  originalData,
  rowNumber,
  onSave,
}: EditTicketModalProps) {
  const [editedTicket, setEditedTicket] = useState(ticket);

  const handleSave = () => {
    onSave(editedTicket);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge>Row {rowNumber}</Badge>
            Edit Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={editedTicket.fullName}
                onChange={(e) => setEditedTicket({ ...editedTicket, fullName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={editedTicket.phone}
                onChange={(e) => setEditedTicket({ ...editedTicket, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticketType">Ticket Type</Label>
              <Select
                value={editedTicket.ticketType}
                onValueChange={(value: 'ADULT' | 'STUDENT' | 'CHILD') =>
                  setEditedTicket({ ...editedTicket, ticketType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADULT">Adult</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayId">Day</Label>
              <Select
                value={editedTicket.dayId.toString()}
                onValueChange={(value) =>
                  setEditedTicket({ ...editedTicket, dayId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                  <SelectItem value="3">Day 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionId">Session</Label>
              <Select
                value={editedTicket.sessionId.toString()}
                onValueChange={(value) =>
                  setEditedTicket({ ...editedTicket, sessionId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Night</SelectItem>
                  <SelectItem value="2">Afternoon</SelectItem>
                  <SelectItem value="3">Evening</SelectItem>
                  <SelectItem value="4">Morning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={editedTicket.quantity}
                onChange={(e) => setEditedTicket({ ...editedTicket, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                value={editedTicket.totalAmount}
                onChange={(e) => setEditedTicket({ ...editedTicket, totalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={editedTicket.paymentStatus}
                onValueChange={(value) =>
                  setEditedTicket({ 
                    ...editedTicket, 
                    paymentStatus: value as any,
                    isPaid: value === 'PAID'
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {editedTicket.ticketType === 'STUDENT' && (
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={editedTicket.institution || ''}
                onChange={(e) => setEditedTicket({ ...editedTicket, institution: e.target.value })}
                placeholder="University/College name"
              />
            </div>
          )}

          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Original Data (Row {rowNumber})</h4>
            <pre className="text-xs font-mono overflow-auto max-h-32">
              {JSON.stringify(originalData, null, 2)}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}