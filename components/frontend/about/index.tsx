import React from 'react';

const AboutSection = () => {
  return (
    // Change 1: Removed py-12 to allow it to fill space, added h-full
    <section className="w-full h-full flex items-center justify-center p-4 md:p-6 lg:p-0">
      
      {/* Main Card Container - set to w-full and h-full */}
      <div className="relative w-full h-full mx-auto">
        
        {/* The Card */}
        {/* Change 2: Added h-full and flex column to ensure it stretches vertically */}
        {/* Change 3: Added '2xl:p-20' for extra padding on large screens */}
        <div className="relative h-full flex flex-col justify-center bg-white/95 border border-white/50 rounded-[40px] p-8 md:p-14 2xl:p-20 shadow-xl overflow-hidden min-h-[500px]">
          
          {/* --- 1. Background Watermark --- */}
          <div 
            className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none bg-[url('https://img.freepik.com/free-vector/nativity-scene-silhouette-design_23-2147959082.jpg')] bg-cover bg-center grayscale"
          ></div>

          {/* --- 2. Text Content --- */}
          {/* Change 4: justify-center helps fill vertical space evenly if needed */}
          <div className="relative z-10 flex flex-col gap-6 md:gap-8 2xl:gap-12 text-left h-full justify-center">
            
            {/* Paragraphs with Responsive Text Sizes */}
            {/* Added '2xl:text-3xl' and '3xl:text-4xl' for large screens */}
            <p className="text-xl md:text-2xl 2xl:text-3xl 3xl:text-4xl text-gray-900 font-sans leading-relaxed">
              The King & The Code is a stage play production by Pastor Tony Osborn Ministries featuring a collage of artistic displays such as live music, spoken word, dance numbers, theatrical drama and so much more. The King & The Code - Christmas Edition 2025 creates an immersive and engaging Christmas experience for you and your whole family. 

            </p>

            <p className="text-xl md:text-2xl 2xl:text-3xl 3xl:text-4xl text-gray-900 font-sans leading-relaxed">
           At the core of this production is a clear and powerful mission to preach the gospel to the nations. The King & The Code marks the beginning of a new ministry expression with our very first stage play created to draw people into a transformative encounter with the message of  Jesus Christ. 
            </p>

            <p className="text-xl md:text-2xl 2xl:text-3xl 3xl:text-4xl text-gray-900 font-sans leading-relaxed font-semibold text-red-800">
             We believe God is positioning it to become one of Tanzania’s most impactful soul-winning experiences.
            </p>
             <p className="text-xl md:text-2xl 2xl:text-3xl 3xl:text-4xl text-gray-900 font-sans leading-relaxed font-semibold text-red-800">
             ...but wait, there's more!
            </p>

            <p className="text-xl md:text-2xl 2xl:text-3xl 3xl:text-4xl text-gray-900 font-sans leading-relaxed">
          The set for The King & The Code: Christmas Edition 2025 offers more than just theatre. Come spend the day with your family at a Christmas Wonderland full of children's games, yummy food and exclusive holiday merch. There's something here for the entire family.
            </p>

            
            <p className="text-xl md:text-2xl 2xl:text-3xl 3xl:text-4xl text-gray-900 font-sans leading-relaxed font-bold">
             
              Don't miss The King & The Code!
            </p>

          </div>

          {/* --- 3. Bottom Right Decorations (Star & Dots) --- */}
          <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
            <div className="relative w-24 h-24 2xl:w-32 2xl:h-32">
              
              {/* Hand-drawn Star (SVG) */}
              <svg 
                viewBox="0 0 100 100" 
                className="w-20 h-20 2xl:w-28 2xl:h-28 absolute bottom-2 right-4 text-[#C5A059] -rotate-12 opacity-80"
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M50 5 L63 35 L95 35 L70 55 L80 85 L50 70 L20 85 L30 55 L5 35 L37 35 Z" />
              </svg>

              {/* Red Dots */}
              <div className="absolute bottom-0 right-0 w-3 h-3 2xl:w-4 2xl:h-4 bg-[#8a1f1f] rounded-full opacity-80"></div>
              <div className="absolute bottom-4 -right-2 w-2 h-2 2xl:w-3 2xl:h-3 bg-[#8a1f1f] rounded-full opacity-60"></div>
              <div className="absolute -bottom-2 right-6 w-2 h-2 2xl:w-3 2xl:h-3 bg-[#8a1f1f] rounded-full opacity-70"></div>
            
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default AboutSection;