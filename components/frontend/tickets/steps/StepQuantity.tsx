// components/ticket/steps/StepQuantity.tsx
interface StepQuantityProps {
  ticketName: string;
  unitPrice: number;
  quantity: number;
  update: (quantity: number) => void;
  total: number;
  maxQuantity: number;
  isExceedingLimit: boolean;
}

export default function StepQuantity({
  ticketName,
  unitPrice,
  quantity,
  update,
  total,
  maxQuantity,
  isExceedingLimit
}: StepQuantityProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">How many tickets?</h2>
      <p className="text-gray-600 mb-6">Select quantity for {ticketName} tickets</p>
      
      {/* Quantity selector with max limit */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={() => update(Math.max(1, quantity - 1))}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
          disabled={quantity <= 1}
        >
          –
        </button>
        
        <div className="text-center">
          <div className="text-4xl font-bold mb-1">{quantity}</div>
          <div className="text-sm text-gray-500">
            Max: <span className="font-semibold">{maxQuantity}</span> available
          </div>
        </div>
        
        <button
          onClick={() => update(quantity + 1)}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
          disabled={quantity >= maxQuantity || isExceedingLimit}
        >
          +
        </button>
      </div>
      
      {/* Price breakdown */}
      <div className="bg-white/60 rounded-xl p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span>{ticketName} × {quantity}</span>
          <span>TZS{unitPrice.toLocaleString()}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>TZS{total.toLocaleString()}</span>
        </div>
      </div>
      
      {isExceedingLimit && (
        <div className="text-red-600 text-sm text-center">
          Maximum {maxQuantity} tickets available
        </div>
      )}
    </div>
  );
}