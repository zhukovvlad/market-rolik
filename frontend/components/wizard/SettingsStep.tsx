import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Smartphone, Monitor } from "lucide-react";
import { ProjectSettings } from "@/types/project";

interface SettingsStepProps {
    imageUrl: string;
    onGenerate: (settings: Required<Pick<ProjectSettings, 'prompt' | 'aspectRatio'>>) => void;
    isGenerating: boolean;
}

export default function SettingsStep({ imageUrl, onGenerate, isGenerating }: SettingsStepProps) {
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState("9:16");
    const [imageError, setImageError] = useState(false);

    // Reset error state when imageUrl changes
    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const handleGenerate = () => {
        onGenerate({ prompt, aspectRatio });
    };

    return (
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Preview */}
            <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold font-heading">Превью</h3>
                <div className={`relative rounded-xl overflow-hidden border border-border bg-black/50 shadow-2xl transition-all duration-500 ${aspectRatio === "9:16" ? "aspect-9/16 max-w-xs mx-auto" : "aspect-3/4 max-w-sm mx-auto"}`}>
                    <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-80" 
                        onLoad={() => setImageError(false)}
                        onError={() => setImageError(true)}
                    />
                    {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground">Failed to load image</span>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-white/50 text-sm font-medium backdrop-blur-sm px-3 py-1 rounded-full bg-black/30">
                            {aspectRatio} Preview
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Settings */}
            <div className="flex flex-col gap-8 bg-card p-6 rounded-2xl border border-border">
                <div className="space-y-4">
                    <h3 className="text-xl font-bold font-heading">Настройки видео</h3>

                    <div className="space-y-3">
                        <Label className="text-base">Формат видео</Label>
                        <RadioGroup value={aspectRatio} onValueChange={setAspectRatio} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="9:16" id="r1" className="peer sr-only" />
                                <Label
                                    htmlFor="r1"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                >
                                    <Smartphone className="mb-3 h-6 w-6" />
                                    <span className="font-semibold">Stories (9:16)</span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="3:4" id="r2" className="peer sr-only" />
                                <Label
                                    htmlFor="r2"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                >
                                    <Monitor className="mb-3 h-6 w-6" />
                                    <span className="font-semibold">Post (3:4)</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="prompt" className="text-base">Сценарий анимации (Промпт)</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Опишите, что должно происходить в видео (например: 'Медленное вращение, искры, неоновый свет')"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[120px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Оставьте пустым, чтобы AI сам придумал сценарий.
                        </p>
                    </div>
                </div>

                <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full text-lg h-14 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-shadow"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Создаем магию...
                        </>
                    ) : (
                        "Создать проект 🚀"
                    )}
                </Button>
            </div>
        </div>
    );
}
