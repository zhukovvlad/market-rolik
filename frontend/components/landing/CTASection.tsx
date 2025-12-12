import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-primary/30">
          <div className="absolute inset-0">
            <Image src="https://images.unsplash.com/photo-1682579401399-f65e193d6389?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY29tbWVyY2UlMjBzZWxsZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY0MzI5OTk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Get Started" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-linear-to-r from-background/95 via-muted/90 to-background/95"></div>
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-primary/20"></div>
          </div>
          <div className="relative px-8 py-16 sm:px-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 border border-yellow-400/30 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-primary" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
              <span className="text-sm text-primary">ACCELERATE YOUR SALES</span>
            </div>
            <h2 className="text-4xl lg:text-5xl text-foreground mb-6 max-w-3xl mx-auto">Ready to Assemble Your Success?</h2>
            <p className="text-xl text-card-foreground mb-8 max-w-2xl mx-auto">Start your 14-day trial. Experience the power of digital alchemy. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg hover:shadow-2xl hover:shadow-primary/50 transition-all border border-primary/20 font-semibold">
                Start Free Trial
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-foreground rounded-lg border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all">Schedule Demo</Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">✓ No credit card required  ✓ 14-day access  ✓ Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
