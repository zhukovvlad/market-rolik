import { AbsoluteFill } from 'remotion';

export const MyComposition = () => {
  return (
    <AbsoluteFill className="bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-8xl">🎬</div>
        <h1 className="text-6xl font-bold text-slate-900">
          Aviai <span className="text-indigo-600">Engine</span>
        </h1>
        <p className="text-2xl text-slate-500 font-medium">
          Ready to render
        </p>
      </div>
    </AbsoluteFill>
  );
};