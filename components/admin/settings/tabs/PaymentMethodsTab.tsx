'use client';

import { useState, useEffect } from 'react';
import { 
  getPaymentMethods, 
  createPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod, 
  PaymentMethod 
} from  '@/lib/actions/setting/admin-actions';
import PaymentMethodForm from '../forms/PaymentMethodForm';
import { Plus, Edit, Trash2, CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function PaymentMethodsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      console.error('Failed to load payment methods:', err);
      setError('Failed to load payment methods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setError(null);
    const result = await createPaymentMethod(data);
    if (result.success) {
      setShowCreateForm(false);
      await loadPaymentMethods();
    } else {
      setError(result.error || 'Failed to create payment method');
    }
    return result;
  };

  const handleUpdate = async (id: string, data: any) => {
    setError(null);
    const result = await updatePaymentMethod(id, data);
    if (result.success) {
      setEditingId(null);
      await loadPaymentMethods();
    } else {
      setError(result.error || 'Failed to update payment method');
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      const result = await deletePaymentMethod(id);
      if (result.success) {
        await loadPaymentMethods();
      } else {
        setError(result.error || 'Failed to delete payment method');
      }
      return result;
    }
    return { success: false, error: 'Cancelled' };
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    const result = await updatePaymentMethod(method.id, {
      isActive: !method.isActive
    });
    if (result.success) {
      await loadPaymentMethods();
    } else {
      setError(result.error || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A81010]"></div>
        <p className="mt-4 text-gray-600">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#A81010]" />
            Payment Methods
          </h2>
          <p className="text-gray-600 mt-1">
            Manage payment gateways and mobile money options for ticket purchases
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPaymentMethods}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Cancel' : 'Add Payment Method'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Payment Method</h3>
          <PaymentMethodForm 
            onSubmit={handleCreate} 
            onCancel={() => setShowCreateForm(false)} 
          />
        </div>
      )}

      {/* Empty State */}
      {paymentMethods.length === 0 && !showCreateForm ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
          <p className="text-gray-600 mb-6">Add your first payment method to enable ticket purchases</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add First Payment Method
          </button>
        </div>
      ) : (
        /* Payment Methods Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paymentMethods.map((method) => (
            <div 
              key={method.id} 
              className={`bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                method.isActive ? 'border-gray-200' : 'border-gray-300 opacity-75'
              }`}
            >
              {editingId === method.id ? (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Payment Method</h3>
                  <PaymentMethodForm
                    method={method}
                    onSubmit={(data) => handleUpdate(method.id, data)}
                    onDelete={() => handleDelete(method.id)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${method.colorClass}`}>
                          {method.imageUrl ? (
                            <img
                              src={method.imageUrl}
                              alt={method.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder.svg';
                              }}
                            />
                          ) : (
                            <CreditCard className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-500">ID: {method.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(method)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            method.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {method.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>

                    {/* Color Preview */}
                    {method.colorClass && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Color Theme</p>
                        <code className={`px-3 py-2 rounded text-xs border ${method.colorClass}`}>
                          {method.colorClass}
                        </code>
                      </div>
                    )}

                    {/* Status Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {method.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-700">Available for payments</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">Hidden from users</span>
                          </>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(method.id)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Indicator Bar */}
                  <div className={`h-1 ${
                    method.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tips & Guidelines */}
      {paymentMethods.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method Guidelines
          </h4>
          <ul className="text-blue-700 text-sm space-y-2">
            <li>• Use descriptive names that users will recognize (e.g., "Vodacom M-Pesa" not just "M-Pesa")</li>
            <li>• Upload high-quality logos with transparent backgrounds (100x100px recommended)</li>
            <li>• Set inactive payment methods when services are temporarily unavailable</li>
            <li>• ID should be lowercase with no spaces (e.g., "airtel_money")</li>
            <li>• Ensure color themes match your brand and provide good contrast</li>
          </ul>
        </div>
      )}
    </div>
  );
}