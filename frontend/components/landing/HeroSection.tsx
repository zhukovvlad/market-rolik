import React from 'react';
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-black via-purple-950/20 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-yellow-400" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
              <span className="text-sm text-purple-300">Powered by Kling AI &amp; Remotion</span>
            </div>
            <h1 className="text-5xl lg:text-6xl text-white mb-6">Transform Photos into <span className="bg-linear-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent animate-pulse">Sales</span></h1>
            <p className="text-xl text-gray-400 mb-8">Digital Alchemy for marketplace sellers. We turn static images into rich video content using generative AI and precise code engineering.</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-purple-500 to-fuchsia-500 text-white rounded-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all border border-purple-400/20">
                Start Free Trial
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-lg border-2 border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-5 h-5" aria-hidden="true">
                  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
                </svg>
                Watch Demo
              </Link>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl text-transparent bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text mb-1">3x</div>
                <div className="text-sm text-gray-500">Higher Conversion</div>
              </div>
              <div className="w-px h-12 bg-purple-500/20"></div>
              <div>
                <div className="text-3xl text-transparent bg-linear-to-r from-yellow-400 to-lime-400 bg-clip-text mb-1">5 min</div>
                <div className="text-sm text-gray-500">Creation Time</div>
              </div>
              <div className="w-px h-12 bg-purple-500/20"></div>
              <div>
                <div className="text-3xl text-transparent bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text mb-1">50+</div>
                <div className="text-sm text-gray-500">Marketplaces</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20">
              <img src="https://images.unsplash.com/photo-1753161021323-3687a18aab50?crop=entropy&amp;cs=tinysrgb&amp;fit=max&amp;fm=jpg&amp;ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZyUyMHByb2R1Y3QlMjB2aWRlb3xlbnwxfHx8fDE3NjQzMjk5OTl8MA&amp;ixlib=rb-4.1.0&amp;q=80&amp;w=1080&amp;utm_source=figma&amp;utm_medium=referral" alt="AI Video Card Creation" className="w-full h-auto" />
              <div className="absolute inset-0 bg-linear-to-t from-purple-900/60 to-transparent"></div>
              <div className="absolute inset-0 bg-linear-to-tr from-purple-500/20 via-transparent to-fuchsia-500/20"></div>
            </div>
            <div className="absolute -top-4 -right-4 bg-black/90 border border-green-500/50 rounded-xl shadow-lg shadow-green-500/20 p-4 animate-bounce backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">AI Processing</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-black/90 border border-purple-500/50 rounded-xl shadow-lg shadow-purple-500/20 p-4 backdrop-blur-sm">
              <div className="text-sm text-purple-300">Video Ready!</div>
              <div className="flex items-center gap-1 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden="true">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
                <span className="text-xs text-yellow-400">ASSEMBLED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
