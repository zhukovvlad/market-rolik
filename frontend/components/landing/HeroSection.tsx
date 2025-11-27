import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, ChevronRight } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-background pt-12 pb-20 lg:pt-24 lg:pb-32">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272A_1px,transparent_1px),linear-gradient(to_bottom,#27272A_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Text Content */}
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            <span>Digital Alchemy for E-commerce</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6 font-heading leading-tight">
                            Превращаем фото <br />
                            в <span className="text-primary">золото</span> продаж
                        </h1>

                        <p className="max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed">
                            Мы берем сырую материю (обычные фото) и через сложный технологический процесс трансформируем её в конверсию.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg" variant="default" className="h-14 px-8 text-lg shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                                <Link href="/create">
                                    Попробовать бесплатно
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                            <Button asChild variant="secondary" size="lg" className="h-14 px-8 text-lg">
                                <Link href="#how-it-works">
                                    <Play className="mr-2 w-4 h-4 fill-current" />
                                    Как это работает
                                </Link>
                            </Button>
                        </div>

                        <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground font-mono">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                                System Online
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                v1.0.4 Stable
                            </div>
                        </div>
                    </div>

                    {/* Split Screen Visual */}
                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none aspect-square lg:aspect-4/3 rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
                        <div className="absolute inset-0 flex">
                            {/* Left: Static (B&W) */}
                            <div className="w-1/2 h-full bg-neutral-900 relative overflow-hidden border-r border-primary/50">
                                <div className="absolute inset-0 flex items-center justify-center opacity-50 grayscale">
                                    {/* Placeholder for static image */}
                                    <span className="text-neutral-500 font-mono text-xs">RAW_INPUT.JPG</span>
                                </div>
                                <div className="absolute bottom-4 left-4 font-mono text-xs text-neutral-500">
                                    STATUS: STATIC
                                </div>
                            </div>

                            {/* Right: Dynamic (Color/Video) */}
                            <div className="w-1/2 h-full bg-neutral-800 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Placeholder for video */}
                                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-secondary/20 animate-pulse"></div>
                                    <span className="absolute text-primary font-mono text-xs font-bold">GENERATING...</span>
                                </div>
                                <div className="absolute bottom-4 right-4 font-mono text-xs text-secondary">
                                    STATUS: ACTIVE
                                </div>
                            </div>

                            {/* Center Divider/Slider */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_rgba(139,92,246,0.8)] z-10 flex items-center justify-center -translate-x-1/2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-white">
                                    <ChevronRight className="text-white w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
