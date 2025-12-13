import Image from "next/image";

interface Props {
  methods: any[]; // DB array
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function StepPayment({ methods, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-serif font-bold text-center mb-6">Payment Method</h3>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`p-4 rounded-xl border-2 transition-all font-bold flex flex-col items-center justify-center gap-2 h-24 ${
              selectedId === m.id 
                ? `${m.colorClass} bg-white shadow-md scale-105` 
                : 'border-gray-300 text-gray-500 hover:border-gray-400 bg-white/40'
            }`}
          >
            {/*  */}
            <div className="relative w-full h-8">
               <Image 
                 src={m.imageUrl} 
                 alt={m.name} 
                 fill 
                 className="object-contain" 
                 sizes="(max-width: 768px) 100vw, 33vw"
               />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}