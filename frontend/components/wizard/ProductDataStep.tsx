import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Sparkles, X, Image as ImageIcon, Loader2, Pencil, Smartphone, Monitor, Square, RectangleVertical } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { API_URL } from "@/lib/utils";
import { ProductData } from "@/types/product";
import { ASPECT_RATIOS, AspectRatio } from "@/types/project";

interface ProductDataStepProps {
    onNext: (data: { imageUrl: string; productData: ProductData; scenePrompt?: string; aspectRatio: AspectRatio }) => void;
    projectTitle: string;
    setProjectTitle: (title: string) => void;
    isEditingTitle: boolean;
    setIsEditingTitle: (editing: boolean) => void;
    initialImageUrl?: string | null;
    initialProductData?: ProductData | null;
}

const ASPECT_RATIO_CONFIG: Record<AspectRatio, { label: string; Icon: React.ElementType }> = {
    "9:16": { label: "Stories (9:16)", Icon: Smartphone },
    "16:9": { label: "Landscape (16:9)", Icon: Monitor },
    "1:1": { label: "Square (1:1)", Icon: Square },
    "3:4": { label: "Post (3:4)", Icon: RectangleVertical },
};

export default function ProductDataStep({ onNext, projectTitle, setProjectTitle, isEditingTitle, setIsEditingTitle, initialImageUrl, initialProductData }: ProductDataStepProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialImageUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [aiScenePrompt, setAiScenePrompt] = useState<string | undefined>(undefined); // Сохраняем scenePrompt от AI
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

    const [productData, setProductData] = useState<ProductData>(
        initialProductData || {
            title: "",
            description: "",
            usps: ["", "", ""],
        }
    );

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            processFile(selectedFile);
        }
    };

    const processFile = (selectedFile: File) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));

        // Auto-fill title from filename
        const filename = selectedFile.name.split('.').slice(0, -1).join('.');
        // Capitalize first letter and replace hyphens/underscores with spaces
        const formattedTitle = filename.charAt(0).toUpperCase() + filename.slice(1).replace(/[-_]/g, ' ');
        setProductData(prev => ({ ...prev, title: formattedTitle }));
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const droppedFile = files[0];
            if (droppedFile.type.startsWith('image/')) {
                processFile(droppedFile);
            } else {
                toast.error("Пожалуйста, загрузите файл изображения");
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post('/projects/upload', formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 30000, // 30 second timeout for image uploads
            });

            setUploadedUrl(res.data.url);
            toast.success("Фото загружено!");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Ошибка загрузки фото");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMagicFill = async () => {
        if (!uploadedUrl) {
            toast.error("Сначала загрузите фото (кнопка UPLOAD)");
            return;
        }

        setIsAnalyzing(true);
        try {
            const payload: { imageUrl: string; uspCount?: number } = { imageUrl: uploadedUrl };
            const filledUspsCount = productData.usps.filter(usp => usp.trim().length > 0).length;
            if (filledUspsCount > 0) {
                payload.uspCount = filledUspsCount;
            }
            
            const res = await api.post('/ai/analyze-image', payload);

            // Validate response structure
            const { title, description, usps, scenePrompt } = res.data;
            setProductData({
                title: title || "",
                description: description || "",
                usps: Array.isArray(usps) ? usps.slice(0, 7) : ["", "", ""],
            });
            
            // Сохраняем scenePrompt от AI
            if (scenePrompt) {
                setAiScenePrompt(scenePrompt);
            }
            
            // Auto-fill project title: "Проект - Product Name"
            if (title) {
                setProjectTitle(`Проект - ${title}`);
            }
            
            toast.success("Данные заполнены магией AI! ✨");
        } catch (error) {
            console.error("AI analysis failed", error);
            toast.error("Не удалось проанализировать изображение");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUspChange = (index: number, value: string) => {
        const newUsps = [...productData.usps];
        newUsps[index] = value;
        setProductData({ ...productData, usps: newUsps });
    };

    const handleAddUsp = () => {
        if (productData.usps.length < 7) {
            setProductData({ ...productData, usps: [...productData.usps, ""] });
        }
    };

    const handleRemoveUsp = (index: number) => {
        const newUsps = productData.usps.filter((_, i) => i !== index);
        setProductData({ ...productData, usps: newUsps });
    };

    const handleNext = () => {
        if (!uploadedUrl) {
            toast.error("Пожалуйста, загрузите изображение");
            return;
        }
        if (!productData.title) {
            toast.error("Введите название товара");
            return;
        }

        onNext({ imageUrl: uploadedUrl, productData, scenePrompt: aiScenePrompt, aspectRatio });
    };

    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Image Upload */}
            <div className="flex flex-col gap-6">
                {/* Project Title Section */}
                <div className="mb-2">
                    {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingTitle(false);
                                }}
                                autoFocus
                                className="text-2xl font-bold border-primary"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                            <h2 className="text-2xl font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4">
                                {projectTitle}
                            </h2>
                            <Pencil className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-heading">Добавьте фотографии товара</h2>
                    <p className="text-muted-foreground text-sm">
                        (одно изображение будет основным, остальные - опциональны)
                    </p>
                </div>

                <div className="space-y-3">
                    <Label className="text-base">Формат обложки</Label>
                    <RadioGroup
                        value={aspectRatio}
                        onValueChange={(v) => {
                            if ((ASPECT_RATIOS as readonly string[]).includes(v)) {
                                setAspectRatio(v as AspectRatio);
                            }
                        }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {ASPECT_RATIOS.map((ratio) => {
                            const { label, Icon } = ASPECT_RATIO_CONFIG[ratio];
                            const safeId = `cover-r-${ratio.replace(':', '-')}`;
                            return (
                                <div key={ratio}>
                                    <RadioGroupItem value={ratio} id={safeId} className="peer sr-only" />
                                    <Label
                                        htmlFor={safeId}
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                    >
                                        <Icon className="mb-3 h-6 w-6" />
                                        <span className="font-semibold text-xs">{label}</span>
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                        Этот формат используется для генерации фона и всего дальнейшего пайплайна.
                    </p>
                </div>

                <div 
                    className={`relative aspect-4/3 bg-muted/30 border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center group transition-colors ${
                        isDragging 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {previewUrl ? (
                        <>
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    if (previewUrl) {
                                        URL.revokeObjectURL(previewUrl);
                                    }
                                    setFile(null);
                                    setPreviewUrl(null);
                                    setUploadedUrl(null);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-lg mb-1">Перетащите фото сюда</p>
                            <p className="text-sm text-muted-foreground">или нажмите для выбора</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>

                {/* Thumbnails (Placeholder for future multi-upload) */}
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-4/3 bg-muted/30 border border-border rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto px-8 font-bold"
                        disabled={!file || !!uploadedUrl || isUploading}
                        onClick={handleUpload}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
                            </>
                        ) : uploadedUrl ? (
                            "Загружено ✓"
                        ) : (
                            <>
                                UPLOAD <Upload className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Right Column: Form Data */}
            <div className="flex flex-col gap-6 bg-card p-6 rounded-2xl border border-border">
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        className="bg-linear-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-500 hover:text-cyan-400 hover:border-cyan-500/50"
                        onClick={handleMagicFill}
                        disabled={!uploadedUrl || isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Анализируем...
                            </>
                        ) : (
                            <>
                                Заполнить автоматически <Sparkles className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-base font-semibold">Наименование товара*</Label>
                        <Input
                            id="title"
                            placeholder="Введите название товара"
                            value={productData.title}
                            onChange={(e) => setProductData({ ...productData, title: e.target.value })}
                            className="h-12 text-lg"
                        />
                        <p className="text-xs text-muted-foreground">
                            Может быть сгенерировано автоматически на основе изображения
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-base font-semibold">Описание товара (опционально)</Label>
                        <Textarea
                            id="description"
                            placeholder="Опишите свой товар"
                            value={productData.description}
                            onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                            className="min-h-[120px] resize-none text-base"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Преимущества товара (УТП)*</Label>
                            <span className="text-xs text-muted-foreground">{productData.usps.length}/7</span>
                        </div>
                        <div className="space-y-3">
                            {productData.usps.map((usp, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-muted-foreground font-mono w-4">{index + 1}.</span>
                                    <Input
                                        placeholder={`Уникальное торговое предложение ${index + 1}`}
                                        value={usp}
                                        onChange={(e) => handleUspChange(index, e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveUsp(index)}
                                        className="shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {productData.usps.length < 7 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddUsp}
                                className="w-full"
                            >
                                + Добавить УТП
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-6 flex justify-end">
                    <Button size="lg" onClick={handleNext} className="px-8 text-lg">
                        NEXT »
                    </Button>
                </div>
            </div>
        </div>
    );
}
