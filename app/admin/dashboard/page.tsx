import React from 'react';

const ComingSoonPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      {/* Container for the main content, centered on the screen */}
      <div className="text-center text-white p-8 max-w-lg w-full bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        
        {/* Main Heading */}
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4 tracking-tight">
          Launching Soon
        </h1>
        
        {/* Subtitle / Descriptive Text */}
        <p className="text-xl text-gray-300 mb-8 font-light">
          We are working hard to bring you something amazing. Follow us for updates!
        </p>

        {/* Optional: Simple Loader/Spinner */}
        <div className="flex justify-center items-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-teal-400"></div>
          <span className="ml-4 text-gray-400">Preparation in progress...</span>
        </div>
        
        {/* Contact/Social Links Placeholder (Example) */}
        <div className="mt-8">
          <a
            href="#"
            className="text-teal-400 hover:text-teal-300 transition duration-300 mx-3 font-medium"
          >
            Twitter
          </a>
          <a
            href="#"
            className="text-teal-400 hover:text-teal-300 transition duration-300 mx-3 font-medium"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;