import React from 'react';
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-primary" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
              <span className="text-sm text-primary">Powered by Kling AI &amp; Remotion</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-heading text-foreground mb-6">Transform Photos into <span className="text-primary">Sales</span></h1>
            <p className="text-xl text-muted-foreground mb-8">Digital Alchemy for marketplace sellers. We turn static images into rich video content using generative AI and precise code engineering.</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg hover:opacity-90 transition-all border border-primary/20">
                Start Free Trial
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-background text-foreground rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-5 h-5" aria-hidden="true">
                  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
                </svg>
                Watch Demo
              </Link>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">3x</div>
                <div className="text-sm text-muted-foreground">Higher Conversion</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">5 min</div>
                <div className="text-sm text-muted-foreground">Creation Time</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">50+</div>
                <div className="text-sm text-muted-foreground">Marketplaces</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img src="https://images.unsplash.com/photo-1753161021323-3687a18aab50?crop=entropy&amp;cs=tinysrgb&amp;fit=max&amp;fm=jpg&amp;ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZyUyMHByb2R1Y3QlMjB2aWRlb3xlbnwxfHx8fDE3NjQzMjk5OTl8MA&amp;ixlib=rb-4.1.0&amp;q=80&amp;w=1080&amp;utm_source=figma&amp;utm_medium=referral" alt="AI Video Card Creation" className="w-full h-auto" />
              <div className="absolute inset-0 bg-linear-to-t from-primary/30 to-transparent"></div>
              <div className="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-primary/10"></div>
            </div>
            <div className="absolute -top-4 -right-4 bg-card border border-primary/50 rounded-xl shadow-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-primary">AI Processing</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card border border-primary/50 rounded-xl shadow-lg p-4">
              <div className="text-sm text-primary">Video Ready!</div>
              <div className="flex items-center gap-1 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-primary fill-primary" aria-hidden="true">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
                <span className="text-xs text-primary">ASSEMBLED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
