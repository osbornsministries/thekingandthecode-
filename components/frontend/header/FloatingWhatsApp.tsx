'use client';

import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsApp() {
   const phoneNumber = '255659687569'; // replace with your WhatsApp number
  const message = 'Hello, I need support';

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition hover:bg-green-600"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </a>
  );
}
