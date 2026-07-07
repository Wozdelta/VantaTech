import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Sun, Palette, Settings2 } from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (file: File, preview: string) => void;
  onRevert?: () => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const flip = { horizontal: flipH, vertical: flipV };
      const filters = { saturation, brightness, contrast };
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip, filters);
      const previewUrl = URL.createObjectURL(croppedFile);
      onCropComplete(croppedFile, previewUrl);
    } catch (e) {
      console.error(e);
      alert('Erro ao cortar imagem');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50/90 dark:bg-black/90 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 sm:rounded-[32px] sm:shadow-2xl sm:border sm:border-gray-200 dark:sm:border-gray-800 w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl mx-auto overflow-hidden flex flex-col">
        
        {/* Header (Top Bar) */}
        <div className="flex justify-between items-center p-4 sm:p-6 shrink-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-vanta-blue tracking-widest uppercase mb-0.5">Editor</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Ajustar Imagem</span>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isProcessing} 
            className="flex items-center gap-2 text-white font-bold px-4 py-2 rounded-full bg-vanta-blue hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
          >
            {isProcessing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Salvar'}
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 w-full bg-gray-50 dark:bg-black/50 min-h-[40vh]">
          <div style={{ width: '100%', height: '100%', transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1} // Square aspect ratio
              onCropChange={setCrop}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              style={{
                containerStyle: { background: 'transparent' },
                mediaStyle: { filter: `saturate(${saturation}%) brightness(${brightness}%) contrast(${contrast}%)` },
                cropAreaStyle: { border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 0 0 9999em rgba(0,0,0,0.6)' }
              }}
            />
          </div>
        </div>

        {/* Controls Panel (Bottom Sheet style on mobile) */}
        <div className="bg-white dark:bg-gray-900 flex flex-col shrink-0 border-t border-gray-100 dark:border-gray-800 rounded-t-[24px] sm:rounded-none">
          
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
             <button
                onClick={() => {
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                  setSaturation(100);
                  setBrightness(100);
                  setContrast(100);
                  setFlipH(false);
                  setFlipV(false);
                }}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Resetar Tudo
              </button>
              
              {/* Flip Options */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setFlipH(!flipH)} 
                  className={`p-2.5 rounded-full transition-all ${flipH ? 'bg-vanta-blue/10 text-vanta-blue' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-2"/><path d="M12 14v-2"/><path d="M12 8V6"/><path d="M12 2v2"/><path d="M17 19l4-7-4-7"/><path d="M7 19l-4-7 4-7"/></svg>
                </button>
                <button 
                  onClick={() => setFlipV(!flipV)} 
                  className={`p-2.5 rounded-full transition-all ${flipV ? 'bg-vanta-blue/10 text-vanta-blue' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-90"><path d="M12 20v-2"/><path d="M12 14v-2"/><path d="M12 8V6"/><path d="M12 2v2"/><path d="M17 19l4-7-4-7"/><path d="M7 19l-4-7 4-7"/></svg>
                </button>
              </div>
          </div>

          <div className="px-6 pb-8 pt-2 overflow-y-auto max-h-[40vh] sm:max-h-none custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
              
              {/* Zoom Control */}
              <div className="flex items-center gap-4 group">
                <ZoomOut className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
                <input type="range" value={zoom} min={1} max={3} step={0.01} onChange={(e) => setZoom(Number(e.target.value))} 
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 dark:[&::-webkit-slider-thumb]:border-gray-500 hover:[&::-webkit-slider-thumb]:bg-vanta-blue hover:[&::-webkit-slider-thumb]:border-vanta-blue [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                <ZoomIn className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
              </div>

              {/* Rotation Control */}
              <div className="flex items-center gap-4 group">
                <RotateCw className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
                <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} 
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 dark:[&::-webkit-slider-thumb]:border-gray-500 hover:[&::-webkit-slider-thumb]:bg-vanta-blue hover:[&::-webkit-slider-thumb]:border-vanta-blue [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium w-7 text-right font-mono">{rotation}°</span>
              </div>

              {/* Saturation */}
              <div className="flex items-center gap-4 group">
                <Palette className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
                <input type="range" value={saturation} min={0} max={200} step={1} onChange={(e) => setSaturation(Number(e.target.value))} 
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 dark:[&::-webkit-slider-thumb]:border-gray-500 hover:[&::-webkit-slider-thumb]:bg-vanta-blue hover:[&::-webkit-slider-thumb]:border-vanta-blue [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium w-7 text-right font-mono">{saturation}%</span>
              </div>

              {/* Brightness */}
              <div className="flex items-center gap-4 group">
                <Sun className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
                <input type="range" value={brightness} min={0} max={200} step={1} onChange={(e) => setBrightness(Number(e.target.value))} 
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 dark:[&::-webkit-slider-thumb]:border-gray-500 hover:[&::-webkit-slider-thumb]:bg-vanta-blue hover:[&::-webkit-slider-thumb]:border-vanta-blue [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium w-7 text-right font-mono">{brightness}%</span>
              </div>

              {/* Contrast */}
              <div className="flex items-center gap-4 group">
                <Settings2 className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
                <input type="range" value={contrast} min={0} max={200} step={1} onChange={(e) => setContrast(Number(e.target.value))} 
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 dark:[&::-webkit-slider-thumb]:border-gray-500 hover:[&::-webkit-slider-thumb]:bg-vanta-blue hover:[&::-webkit-slider-thumb]:border-vanta-blue [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium w-7 text-right font-mono">{contrast}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
