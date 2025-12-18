"use client";

import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  selectedCount: number;
  unpaidCount: number;
}

export default function MessageModal({
  isOpen,
  onClose,
  onSend,
  selectedCount,
  unpaidCount,
}: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    try {
      await onSend(message);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Send Message</h3>
                <p className="text-sm text-gray-500">To {selectedCount} recipient{selectedCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Message Preview */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Message Preview</p>
            <div className="text-sm text-gray-700">
              {message || 'Your message will appear here...'}
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A81010] focus:border-transparent resize-none"
              placeholder={`Dear ticket holder,\n\nThank you for purchasing...\n\n- Event Team`}
              maxLength={500}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Max 500 characters</span>
              <span>{message.length}/500</span>
            </div>
          </div>

          {/* Warning for unpaid tickets */}
          {unpaidCount > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Includes {unpaidCount} unpaid ticket(s). Consider filtering by payment status.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="flex-1 px-4 py-2.5 bg-[#A81010] text-white rounded-lg font-medium hover:bg-[#8a0d0d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}