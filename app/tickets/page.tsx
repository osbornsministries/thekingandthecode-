import { getTicketConfiguration } from '@/lib/actions/config-actions';
import TicketForm from '@/components/frontend/tickets/TicketForm';
import Navbar from '@/components/frontend/header/navbar';
import TicketPageClient from '@/components/frontend/tickets/TicketPageClient';

export const dynamic = 'force-dynamic';

export default async function TicketPage() {
  const result = await getTicketConfiguration();
  
  // Handle errors gracefully
  if (!result.success) {
    console.error('Failed to load configuration:', result.error);
    // You can return a fallback UI here or empty arrays
  }
  
  // Use result.config instead of data
  const { prices, methods, days, sessions } = result.config || {
    prices: [],
    methods: [],
    days: [],
    sessions: []
  };

  return (
    <TicketPageClient>
      <Navbar />
      
      {/* Spacing for Navbar */}
      <div className="pt-24 w-full flex flex-col items-center">
        
        {/* Top Label */}
        <p className="title-reveal invisible text-xl md:text-3xl tracking-[0.4em] uppercase font-[FelixTilting] mb-8 text-gray-800 drop-shadow-sm text-center">
          Merry Christmas
        </p>

        {/* Content Grid */}
        <div className="w-full max-w-7xl px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT: Big Text */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            <h1 className="title-reveal invisible font-[FelixTilting] italic text-6xl md:text-8xl lg:text-[110px] leading-[0.85] text-black drop-shadow-lg">
              GET YOUR<br />
              <span className="text-[#A81010]">TICKET</span>
            </h1>
            <p className="title-reveal invisible mt-6 text-gray-700 font-serif text-lg max-w-md">
              Join us for a magical moment of joy, music, and celebration. Secure your spot now.
            </p>
          </div>

          {/* RIGHT: Dynamic Form */}
          <div className="form-reveal invisible w-full">
            <TicketForm 
              dbPrices={prices} 
              dbMethods={methods} 
              dbDays={days}        
              dbSessions={sessions}  
            />
          </div>
          
        </div>
      </div>
    </TicketPageClient>
  );
}