import { Check } from 'lucide-react';

interface Props {
  prices: any[]; // DB Record array
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function StepSelection({ prices, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-serif font-bold text-center mb-6">Choose Your Experience</h3>
      <div className="grid gap-4">
        {prices.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`relative p-4 rounded-xl border-2 flex justify-between items-center transition-all duration-300 ${
              selectedId === p.id 
                ? 'border-[#A81010] bg-[#A81010]/5 shadow-lg scale-[1.02]' 
                : 'border-gray-300 hover:border-gray-400 bg-white/50'
            }`}
          >
            <div className="text-left">
              <p className="font-bold text-lg text-gray-800">{p.name}</p>
              {/* <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">{p.type}</p> */}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-serif text-xl text-gray-900">
                TZS {parseFloat(p.price).toLocaleString()}
              </span>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                selectedId === p.id ? 'bg-[#A81010] border-[#A81010]' : 'border-gray-400'
              }`}>
                {selectedId === p.id && <Check size={14} className="text-white" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}