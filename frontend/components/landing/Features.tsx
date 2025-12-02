import React from 'react';

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading text-foreground mb-4">The Assembler's Toolkit</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Professional-grade features that transform raw materials into conversion gold.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles w-6 h-6 text-primary-foreground" aria-hidden="true">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Generative AI Power</h3>
            <p className="text-muted-foreground">Kling &amp; Hailuo neural networks transform static images into dynamic video content with professional motion.</p>
          </div>
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-6 h-6 text-primary-foreground" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Lightning Fast Assembly</h3>
            <p className="text-muted-foreground">Remotion-powered video generation in under 5 minutes. Precision code meets AI creativity.</p>
          </div>
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-6 h-6 text-primary-foreground" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Multi-Marketplace Ready</h3>
            <p className="text-muted-foreground">Optimized for Amazon, Wildberries, Ozon, and 50+ other platforms with format-specific exports.</p>
          </div>
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up w-6 h-6 text-primary-foreground" aria-hidden="true">
                <path d="M16 7h6v6"></path>
                <path d="m22 7-8.5 8.5-5-5L2 17"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">3x Conversion Boost</h3>
            <p className="text-muted-foreground">Rich video content dramatically outperforms static images in click-through and conversion rates.</p>
          </div>
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palette w-6 h-6 text-primary-foreground" aria-hidden="true">
                <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"></path>
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Professional Templates</h3>
            <p className="text-muted-foreground">Curated library of premium templates designed for maximum marketplace impact.</p>
          </div>
          <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-6 h-6 text-primary-foreground" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Brand Control</h3>
            <p className="text-muted-foreground">Full customization of colors, fonts, and branding. Your identity, our technology.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
