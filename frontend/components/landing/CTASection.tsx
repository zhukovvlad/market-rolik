import React from 'react';

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-purple-500/30">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1682579401399-f65e193d6389?crop=entropy&amp;cs=tinysrgb&amp;fit=max&amp;fm=jpg&amp;ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY29tbWVyY2UlMjBzZWxsZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY0MzI5OTk5fDA&amp;ixlib=rb-4.1.0&amp;q=80&amp;w=1080&amp;utm_source=figma&amp;utm_medium=referral" alt="Get Started" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-black/95 via-purple-900/90 to-black/95"></div>
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 via-transparent to-fuchsia-500/20"></div>
          </div>
          <div className="relative px-8 py-16 sm:px-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 border border-yellow-400/30 backdrop-blur-sm rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-yellow-400" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
              <span className="text-sm text-yellow-400">ACCELERATE YOUR SALES</span>
            </div>
            <h2 className="text-4xl lg:text-5xl text-white mb-6 max-w-3xl mx-auto">Ready to Assemble Your Success?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Start your 14-day trial. Experience the power of digital alchemy. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all border border-purple-400/20">
                Start Free Trial
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white rounded-lg border-2 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10 transition-all">Schedule Demo</button>
            </div>
            <p className="mt-6 text-sm text-gray-400">✓ No credit card required  ✓ 14-day access  ✓ Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
