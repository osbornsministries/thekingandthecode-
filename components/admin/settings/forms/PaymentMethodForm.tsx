'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/lib/actions/setting/admin-actions';
import { Save, X, Trash2, Upload } from 'lucide-react';

interface PaymentMethodFormProps {
  method?: PaymentMethod;
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

const COLOR_CLASSES = [
  { value: 'border-red-500 text-red-600', label: 'Red' },
  { value: 'border-blue-500 text-blue-600', label: 'Blue' },
  { value: 'border-green-500 text-green-600', label: 'Green' },
  { value: 'border-purple-500 text-purple-600', label: 'Purple' },
  { value: 'border-yellow-500 text-yellow-600', label: 'Yellow' },
  { value: 'border-orange-500 text-orange-600', label: 'Orange' },
  { value: 'border-pink-500 text-pink-600', label: 'Pink' },
  { value: 'border-indigo-500 text-indigo-600', label: 'Indigo' },
];

export default function PaymentMethodForm({ method, onSubmit, onDelete, onCancel }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState({
    id: method?.id || '',
    name: method?.name || '',
    imageUrl: method?.imageUrl || '',
    colorClass: method?.colorClass || 'border-blue-500 text-blue-600',
    isActive: method?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(method?.imageUrl || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate required fields
    if (!formData.id.trim()) {
      setError('Payment method ID is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.name.trim()) {
      setError('Payment method name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.imageUrl.trim()) {
      setError('Image URL is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await onSubmit(formData);
      if (!result.success) {
        setError(result.error || 'Failed to save payment method');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setPreviewImage(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a storage service
      // For now, we'll just use a placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        // For demo, we'll use a placeholder. In production, upload to S3/Cloudinary
        setFormData({ ...formData, imageUrl: `/images/payment/${file.name}` });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method ID *
            <span className="text-gray-500 text-xs ml-2">
              Unique identifier (e.g., mpesa, tigopesa)
            </span>
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
            className="w-full p-3 border border-gray-300 rounded-lg font-mono"
            placeholder="mpesa, tigopesa, airtel"
            required
            disabled={!!method} // Disable editing ID if updating
          />
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Vodacom M-Pesa"
            required
          />
        </div>

        {/* Color Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Theme
          </label>
          <select
            value={formData.colorClass}
            onChange={(e) => setFormData({ ...formData, colorClass: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            {COLOR_CLASSES.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
          {formData.colorClass && (
            <div className="mt-2">
              <div className={`inline-flex items-center px-3 py-1 border rounded-lg ${formData.colorClass}`}>
                <span className="text-sm font-medium">Preview</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-center">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded h-5 w-5"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method Image *
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 h-full flex flex-col items-center justify-center min-h-[200px]">
                {previewImage ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-w-full max-h-48 object-contain"
                      onError={() => setPreviewImage('/images/placeholder.svg')}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Upload className="w-12 h-12 mx-auto mb-3" />
                    <p>Image preview will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, SVG (MAX. 2MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/images/mpesa.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended size: 100x100 pixels
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}

        {method && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(method.id)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : method ? 'Update Payment Method' : 'Create Payment Method'}
        </button>
      </div>
    </form>
  );
}