"use client";

import { Check, MessageSquare, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  uniquePhoneCount: number;
  paidCount: number;
  onSendMessage: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  uniquePhoneCount,
  paidCount,
  onSendMessage,
  onClearSelection,
}: BulkActionsBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-4 min-w-[320px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#A81010] rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {selectedCount} ticket{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{uniquePhoneCount} unique phone{uniquePhoneCount !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{paidCount} paid</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onSendMessage}
              className="flex items-center gap-2 px-3 py-2 bg-[#A81010] text-white rounded-lg text-sm font-medium hover:bg-[#8a0d0d] transition-colors"
            >
              <MessageSquare size={14} />
              Send Message
            </button>
            <button
              onClick={onClearSelection}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}