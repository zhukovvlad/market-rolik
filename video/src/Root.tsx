import { Composition } from 'remotion';
import { MyComposition, myCompSchema } from './Composition';
import './index.css';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WbClassic" // ID шаблона (запомним его!)
        component={MyComposition}
        durationInFrames={240} // 8 сек
        fps={30}
        width={1080}
        height={1920} // 9:16
        
        // 👇 Валидация типов
        schema={myCompSchema}
        
        // 👇 ТЕСТОВЫЕ ДАННЫЕ (то, что ты увидишь сейчас в браузере)
        defaultProps={{
          title: "Супер Часы",
          mainImage: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000",
          usps: ["Сапфировое стекло", "Натуральная кожа", "Гарантия 5 лет"],
          primaryColor: "#4f46e5", // Цвет Индиго
        }}
      />
    </>
  );
};