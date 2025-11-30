import React from 'react';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-gray-900 via-black to-black relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl text-white mb-4">Proven Results</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">Marketplace sellers worldwide trust The Assembler for their rich content needs.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-linear-to-b from-gray-900 to-black p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-quote absolute top-6 right-6 w-8 h-8 text-purple-500/20" aria-hidden="true">
              <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
              <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
            </svg>
            <div className="flex items-center gap-4 mb-6">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&amp;h=150&amp;fit=crop" alt="Sarah Johnson" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30" />
              <div>
                <div className="text-white mb-1">Sarah Johnson</div>
                <div className="text-sm text-gray-400">Amazon Seller</div>
              </div>
            </div>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden="true">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                </svg>
              ))}
            </div>
            <p className="text-gray-300 leading-relaxed">VideoCard AI has transformed my product listings. My conversion rate increased by 250% in just two weeks. The AI does an amazing job understanding my products.</p>
          </div>
          <div className="bg-linear-to-b from-gray-900 to-black p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-quote absolute top-6 right-6 w-8 h-8 text-purple-500/20" aria-hidden="true">
              <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
              <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
            </svg>
            <div className="flex items-center gap-4 mb-6">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&amp;h=150&amp;fit=crop" alt="Michael Chen" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30" />
              <div>
                <div className="text-white mb-1">Michael Chen</div>
                <div className="text-sm text-gray-400">eBay Power Seller</div>
              </div>
            </div>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden="true">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                </svg>
              ))}
            </div>
            <p className="text-gray-300 leading-relaxed">I was skeptical at first, but this tool pays for itself many times over. The time I save alone is worth it, not to mention the boost in sales.</p>
          </div>
          <div className="bg-linear-to-b from-gray-900 to-black p-8 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-quote absolute top-6 right-6 w-8 h-8 text-purple-500/20" aria-hidden="true">
              <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
              <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
            </svg>
            <div className="flex items-center gap-4 mb-6">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&amp;h=150&amp;fit=crop" alt="Emma Rodriguez" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30" />
              <div>
                <div className="text-white mb-1">Emma Rodriguez</div>
                <div className="text-sm text-gray-400">Etsy Shop Owner</div>
              </div>
            </div>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden="true">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                </svg>
              ))}
            </div>
            <p className="text-gray-300 leading-relaxed">As a small business owner, I don't have time for video editing. VideoCard AI makes it so easy to create professional videos that match my brand perfectly.</p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-gray-900 to-black border border-purple-500/30 rounded-full">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&amp;h=40&amp;fit=crop" alt="User" className="w-8 h-8 rounded-full border-2 border-purple-500" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&amp;h=40&amp;fit=crop" alt="User" className="w-8 h-8 rounded-full border-2 border-purple-500" />
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&amp;h=40&amp;fit=crop" alt="User" className="w-8 h-8 rounded-full border-2 border-purple-500" />
            </div>
            <span className="text-gray-300">Join 10,000+ happy sellers</span>
          </div>
        </div>
      </div>
    </section>
  );
}
