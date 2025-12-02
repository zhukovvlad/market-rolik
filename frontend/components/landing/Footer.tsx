import React from 'react';
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-background text-muted-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Image src="/logo.png" alt="AviAI" width={120} height={40} className="h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">Digital Alchemy for marketplace sellers. Transform static into sales.</p>
            <div className="flex gap-4">
              <a href="https://facebook.com" aria-label="Visit us on Facebook" className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-accent hover:border-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook w-4 h-4" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" aria-label="Visit us on Twitter" className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-accent hover:border-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter w-4 h-4" aria-hidden="true">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://instagram.com" aria-label="Visit us on Instagram" className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-accent hover:border-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram w-4 h-4" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://linkedin.com" aria-label="Visit us on LinkedIn" className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-accent hover:border-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin w-4 h-4" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://youtube.com" aria-label="Visit us on YouTube" className="w-8 h-8 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-accent hover:border-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube w-4 h-4" aria-hidden="true">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                  <path d="m10 15 5-3-5-3z"></path>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-sm hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="text-sm hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Templates</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Press</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Tutorials</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Community</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-sm hover:text-primary transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AviAI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Status</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
