'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { 
  CheckCircle, Clock, MapPin, Share2, Download, 
  Ticket as TicketIcon, User, Users 
} from 'lucide-react';

import Navbar from '@/components/frontend/header/navbar';
import GsapSnowBackground from '@/components/frontend/home/SnowBackground';

interface Attendee {
  name: string;
  type: string;
  isUsed: boolean;
}

interface TicketData {
  id: number;
  ticketCode: string;
  guestName: string;
  guestPhone: string;
  ticketType: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  adultCount: number;
  studentCount: number;
  childCount: number;
  attendees: Attendee[];
}

export default function TicketClient({ ticket }: { ticket: TicketData }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /** STATUS LOGIC */
  const isPaid = ticket.paymentStatus === 'PAID';
  const isUsed = ticket.status === 'ALL_USED';
  const isPartial = ticket.status === 'PARTIALLY_USED';

  const getStatusBadge = () => {
    if (isUsed)
      return { text: 'ALL USED', bg: 'bg-gray-100', border: 'border-gray-400', color: 'text-gray-600' };

    if (isPartial)
      return { text: 'PARTIALLY USED', bg: 'bg-yellow-50', border: 'border-yellow-400', color: 'text-yellow-700' };

    if (isPaid)
      return { text: 'VALID TICKET', bg: 'bg-green-100', border: 'border-green-500', color: 'text-green-700' };

    if (ticket.paymentStatus === 'FAILED')
      return { text: 'PAYMENT FAILED', bg: 'bg-red-100', border: 'border-red-500', color: 'text-red-700' };

    return { text: 'PENDING PAYMENT', bg: 'bg-orange-100', border: 'border-orange-500', color: 'text-orange-700' };
  };

  const badge = getStatusBadge();

  /** GSAP ANIMATION */
  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.to('.bg-overlay', { opacity: 1, duration: 1 });

      tl.fromTo(
        '.ticket-container',
        { y: 100, opacity: 0, rotateX: -10 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1, ease: 'power3.out' }
      );

      tl.from(
        '.ticket-detail',
        { opacity: 0, x: -20, stagger: 0.1, duration: 0.5 },
        '-=0.5'
      );
    },
    { scope: containerRef }
  );

  /** Format Admit Text */
  const getAdmitString = () => {
    const parts: string[] = [];

    if (ticket.adultCount > 0) parts.push(`${ticket.adultCount} Adult${ticket.adultCount > 1 ? 's' : ''}`);
    if (ticket.studentCount > 0) parts.push(`${ticket.studentCount} Student${ticket.studentCount > 1 ? 's' : ''}`);
    if (ticket.childCount > 0) parts.push(`${ticket.childCount} Child${ticket.childCount > 1 ? 'ren' : ''}`);

    return parts.join(', ') || 'General Admission';
  };

  return (
    <main
      ref={containerRef}
      className="min-h-screen relative flex flex-col items-center bg-[#f4f4f4] overflow-hidden pb-10"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[url('/images/background/p.png')] bg-cover bg-center bg-no-repeat opacity-50" />

      <GsapSnowBackground />

      <div className="bg-overlay absolute inset-0 bg-white/60 backdrop-blur-sm opacity-0" />

      <Navbar />

      <div className="relative z-10 w-full max-w-4xl px-4 flex-1 flex flex-col items-center justify-center mt-20 md:mt-10">
        <h1 className="font-serif text-3xl md:text-5xl text-gray-800 mb-8 text-center">
          Your Ticket Space
        </h1>

        {/* Main Ticket */}
        <div className="ticket-container w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Status Badge */}
          <div
            className={`absolute top-6 right-6 px-4 py-1 rounded-full border-2 font-bold tracking-widest text-xs z-20 shadow-sm ${badge.bg} ${badge.border} ${badge.color}`}
          >
            {badge.text}
          </div>

          {/* LEFT SIDE */}
          <div className="flex-1 p-8 md:p-10 relative">
            {/* Perforation line */}
            <div className="absolute right-0 top-0 bottom-0 w-0 border-r-2 border-dashed border-gray-300 hidden md:block" />

            {/* Decorations */}
            <div className="absolute -right-3 top-[-12px] w-6 h-6 bg-[#f4f4f4] rounded-full hidden md:block shadow-inner" />
            <div className="absolute -right-3 bottom-[-12px] w-6 h-6 bg-[#f4f4f4] rounded-full hidden md:block shadow-inner" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center bg-red-50 text-red-800">
                <span className="font-bold text-xl">KC</span>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">EVENT</p>
                <h2 className="font-serif text-xl font-bold text-[#A81010]">The King & The Code</h2>
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">
                  Christmas Edition 2025
                </p>
              </div>
            </div>

            {/* DETAILS */}
            <div className="space-y-6">
              <div className="ticket-detail">
                <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                  <User size={12} /> BOOKED BY
                </p>
                <p className="font-serif text-2xl md:text-3xl text-gray-900 truncate">
                  {ticket.guestName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="ticket-detail">
                  <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                    <TicketIcon size={12} /> TICKET TYPE
                  </p>
                  <p className="font-bold text-[#A81010] uppercase">{ticket.ticketType}</p>
                </div>

                <div className="ticket-detail">
                  <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                    <Users size={12} /> ADMIT
                  </p>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{getAdmitString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="ticket-detail flex gap-3 items-center">
                  <Clock className="text-gray-400 w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">DATE & TIME</p>
                    <p className="font-medium text-gray-800">Dec 25th, 4:00 PM</p>
                  </div>
                </div>

                <div className="ticket-detail flex gap-3 items-center">
                  <MapPin className="text-gray-400 w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">LOCATION</p>
                    <p className="font-medium text-gray-800">Mlimani City Hall</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full md:w-80 bg-gray-50 p-8 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-gray-300 relative">
            <div className="absolute -left-3 top-[-12px] w-6 h-6 bg-[#f4f4f4] rounded-full hidden md:block shadow-inner" />
            <div className="absolute -left-3 bottom-[-12px] w-6 h-6 bg-[#f4f4f4] rounded-full hidden md:block shadow-inner" />

            <p className="text-xs font-bold text-gray-400 tracking-[0.3em] mb-4">
              SCAN AT GATE
            </p>

            {/* QR SECTION */}
            <div
              className={`p-3 bg-white rounded-xl shadow-sm transition-all duration-500 ${
                isUsed ? 'opacity-50 grayscale' : ''
              }`}
            >
              {isPaid ? (
                <QRCodeSVG
                  value={ticket.ticketCode}
                  size={160}
                  level="H"
                  fgColor="#1A1A1A"
                  bgColor="#FFFFFF"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500 p-4 text-center">
                  QR hidden until payment completes
                </div>
              )}
            </div>

            <p className="font-mono text-xs text-gray-500 mt-4 tracking-widest truncate max-w-[200px]">
              ID: {ticket.ticketCode}
            </p>

            <div className="mt-8 w-full text-center">
              {isUsed ? (
                <div className="w-full py-3 bg-gray-200 text-gray-600 text-sm font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                  <CheckCircle size={18} />
                  Fully Used
                </div>
              ) : !isPaid ? (
                <div className="w-full py-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg flex items-center justify-center gap-2 animate-pulse">
                  Payment Pending
                </div>
              ) : (
                <div className="w-full py-3 bg-green-50 text-green-700 text-sm font-bold rounded-lg flex items-center justify-center gap-2 border border-green-200">
                  Ready for Scanning
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-8 flex gap-4">
          {isPaid && (
            <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white shadow-lg text-gray-700 hover:scale-105 transition font-medium text-sm">
              <Download size={18} /> Download Ticket
            </button>
          )}

          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] shadow-lg text-white hover:scale-105 transition font-medium text-sm">
            <Share2 size={18} /> Share on WhatsApp
          </button>
        </div>
      </div>
    </main>
  );
}
