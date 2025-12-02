import React from 'react';
import Link from 'next/link';

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl text-foreground mb-4">Power Tiers</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Choose your assembly capacity. All plans include 14-day trial access.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="relative p-8 rounded-2xl bg-linear-to-b from-card to-background border-2 border-primary/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl mb-2 text-foreground">Starter</h3>
              <div className="mb-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl text-foreground">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <p className="text-muted-foreground">Perfect for individual sellers just getting started</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">50 video cards per month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">HD quality exports</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Basic templates</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Email support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Watermark included</span>
              </li>
            </ul>
            <Link href="/auth/register" className="w-full py-3 rounded-lg transition-all bg-primary text-white hover:shadow-lg hover:shadow-primary/50 border border-primary/20 block text-center font-semibold">Start Free Trial</Link>
          </div>
          <div className="relative p-8 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/50 scale-105 border border-primary/50">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-primary rounded-full text-sm flex items-center gap-1 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
              PREMIUM
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl mb-2 text-white">Professional</h3>
              <div className="mb-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl text-white">$79</span>
                  <span className="text-white/80">/month</span>
                </div>
              </div>
              <p className="text-white/80">For growing businesses and power sellers</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">500 video cards per month</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">4K quality exports</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">Premium templates</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">No watermark</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">Custom branding</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">Bulk upload</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-white" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-white">API access</span>
              </li>
            </ul>
            <Link href="/auth/register" className="w-full py-3 rounded-lg transition-all bg-white text-primary hover:shadow-lg hover:shadow-white/20 block text-center font-semibold">Start Free Trial</Link>
          </div>
          <div className="relative p-8 rounded-2xl bg-linear-to-b from-card to-background border-2 border-primary/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl mb-2 text-foreground">Enterprise</h3>
              <div className="mb-2">
                <div className="text-4xl text-foreground">Custom</div>
              </div>
              <p className="text-muted-foreground">For large teams and agencies</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Unlimited video cards</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">4K quality exports</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">All templates</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Dedicated support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">White-label option</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Custom integrations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">Team collaboration</span>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span className="text-card-foreground">SLA guarantee</span>
              </li>
            </ul>
            <Link href="/contact" className="w-full py-3 rounded-lg transition-all bg-primary text-white hover:shadow-lg hover:shadow-primary/50 border border-primary/20 block text-center font-semibold">Contact Sales</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
