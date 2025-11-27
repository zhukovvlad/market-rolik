import { Cpu, Zap, Gem, Code } from "lucide-react";

const features = [
    {
        icon: Cpu,
        title: "Генеративная мощь",
        description: "Объединяем Kling и Hailuo для создания реалистичной динамики.",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20"
    },
    {
        icon: Code,
        title: "Инженерная точность",
        description: "Программный код Remotion гарантирует идеальный монтаж каждый раз.",
        color: "text-secondary",
        bg: "bg-secondary/10",
        border: "border-secondary/20"
    },
    {
        icon: Gem,
        title: "Премиальное качество",
        description: "Ваш контент будет выглядеть дорого. Мы превращаем пиксели в золото.",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20"
    },
    {
        icon: Zap,
        title: "Мгновенная скорость",
        description: "От загрузки фото до готового видео — всего 60 секунд.",
        color: "text-secondary",
        bg: "bg-secondary/10",
        border: "border-secondary/20"
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading">
                        ДНК <span className="text-primary">AviAI</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Мы демократизируем создание Rich-контента. Наш "Сборщик" трансформирует статику в динамику, используя передовые нейросети.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group p-6 rounded-2xl border ${feature.border} bg-card hover:bg-card/80 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300`}
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
