import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-slate-50 pt-16 pb-20 lg:pt-32 lg:pb-28">
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
            </div>

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-8">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-Powered Video Generation</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
                    Видео-обложки для <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Wildberries & Ozon
                    </span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
                    Превратите обычные фото товаров в захватывающие видео-обложки за 1 минуту.
                    Повысьте CTR карточки до 30% с помощью искусственного интеллекта.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                        <Link href="/create">
                            Попробовать бесплатно
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">
                        <Link href="#how-it-works">
                            Как это работает?
                        </Link>
                    </Button>
                </div>

                <div className="mt-12 text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Без регистрации карты
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        10 бесплатных генераций
                    </span>
                </div>
            </div>
        </section>
    );
}
