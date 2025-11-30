import { Composition } from 'remotion';
import { MyComposition } from './Composition';
import './index.css'; // Подключаем Tailwind, который создал установщик

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyComposition}
        durationInFrames={240} // 8 секунд (при 30 fps)
        fps={30}
        width={1080}
        height={1920} // 9:16 (Базовый вертикальный)
      />
    </>
  );
};