import { UploadCloud, Settings, Download } from "lucide-react";

const steps = [
    {
        id: 1,
        title: "Загрузите фото",
        description: "Просто перетащите фотографию вашего товара. Мы поддерживаем JPG и PNG.",
        icon: UploadCloud,
    },
    {
        id: 2,
        title: "Выберите стиль",
        description: "Укажите настроение видео и музыку. AI сам подберет анимацию.",
        icon: Settings,
    },
    {
        id: 3,
        title: "Скачайте видео",
        description: "Через минуту ваше видео готово. Скачайте и загрузите на маркетплейс.",
        icon: Download,
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-background text-foreground relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Как это работает?</h2>
                    <p className="text-muted-foreground text-lg">Три простых шага к идеальной видео-обложке</p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Connector Line (Desktop only) */}
                    <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-border z-0"></div>

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="w-24 h-24 rounded-full bg-card border-4 border-background flex items-center justify-center mb-6 shadow-lg group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-shadow duration-300">
                                <step.icon className="w-10 h-10 text-primary" />
                            </div>
                            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4 border border-primary/20">
                                ШАГ {step.id}
                            </div>
                            <h3 className="text-xl font-bold mb-3 font-heading">{step.title}</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-xs text-sm">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
