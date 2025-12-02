import React from 'react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-background via-muted to-background relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl text-foreground mb-4">The Assembly Process</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Four steps from static to sales. Technology that works while you scale.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="relative">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-10 h-10 text-primary-foreground" aria-hidden="true">
                    <path d="M12 3v12"></path>
                    <path d="m17 8-5-5-5 5"></path>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center text-sm text-primary shadow-md">01</div>
              </div>
              <h3 className="text-xl text-foreground mb-3">Upload Raw Material</h3>
              <p className="text-muted-foreground">Feed the Assembler your product images and descriptions. Bulk processing supported.</p>
            </div>
            <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-linear-to-r from-purple-500/50 to-transparent"></div>
          </div>
          <div className="relative">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles w-10 h-10 text-primary-foreground" aria-hidden="true">
                    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                    <path d="m14 7 3 3"></path>
                    <path d="M5 6v4"></path>
                    <path d="M19 14v4"></path>
                    <path d="M10 2v2"></path>
                    <path d="M7 8H3"></path>
                    <path d="M21 16h-4"></path>
                    <path d="M11 3H9"></path>
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center text-sm text-primary shadow-md">02</div>
              </div>
              <h3 className="text-xl text-foreground mb-3">AI Transformation</h3>
              <p className="text-muted-foreground">Neural networks analyze and generate dynamic video content. The digital alchemy begins.</p>
            </div>
            <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-linear-to-r from-purple-500/50 to-transparent"></div>
          </div>
          <div className="relative">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-10 h-10 text-primary-foreground" aria-hidden="true">
                    <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center text-sm text-primary shadow-md">03</div>
              </div>
              <h3 className="text-xl text-foreground mb-3">Precision Tuning</h3>
              <p className="text-muted-foreground">Review, adjust, and customize. Full control over the final output.</p>
            </div>
            <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-linear-to-r from-purple-500/50 to-transparent"></div>
          </div>
          <div className="relative">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download w-10 h-10 text-primary-foreground" aria-hidden="true">
                    <path d="M12 15V3"></path>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <path d="m7 10 5 5 5-5"></path>
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-primary rounded-full flex items-center justify-center text-sm text-primary shadow-md">04</div>
              </div>
              <h3 className="text-xl text-foreground mb-3">Deploy to Market</h3>
              <p className="text-muted-foreground">Export in marketplace-optimized formats. Upload and watch conversions rise.</p>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-lg hover:shadow-xl hover:shadow-primary/50 transition-all border border-primary/20 font-semibold">Start Assembling Now</button>
        </div>
      </div>
    </section>
  );
}
