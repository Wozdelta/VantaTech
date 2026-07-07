import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Sun, Palette, Settings2 } from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (file: File, preview: string) => void;
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

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recortar Imagem</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[50vh] bg-gray-50 dark:bg-black/50">
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
                mediaStyle: { filter: `saturate(${saturation}%) brightness(${brightness}%) contrast(${contrast}%)` }
              }}
            />
          </div>
        </div>

        {/* Minimalist Controls Panel */}
        <div className="bg-white dark:bg-gray-900 flex flex-col">
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* Zoom Control */}
            <div className="flex items-center gap-4 group">
              <ZoomOut className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
              <input type="range" value={zoom} min={1} max={3} step={0.01} onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-vanta-blue [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
              <ZoomIn className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
            </div>

            {/* Rotation Control */}
            <div className="flex items-center gap-4 group">
              <RotateCw className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
              <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-vanta-blue [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
              <span className="text-[11px] text-gray-400 font-medium w-6 text-right font-mono">{rotation}°</span>
            </div>

            {/* Saturation */}
            <div className="flex items-center gap-4 group">
              <Palette className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
              <input type="range" value={saturation} min={0} max={200} step={1} onChange={(e) => setSaturation(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-vanta-blue [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
              <span className="text-[11px] text-gray-400 font-medium w-6 text-right font-mono">{saturation}%</span>
            </div>

            {/* Brightness */}
            <div className="flex items-center gap-4 group">
              <Sun className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
              <input type="range" value={brightness} min={0} max={200} step={1} onChange={(e) => setBrightness(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-vanta-blue [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
              <span className="text-[11px] text-gray-400 font-medium w-6 text-right font-mono">{brightness}%</span>
            </div>

            {/* Contrast */}
            <div className="flex items-center gap-4 group">
              <Settings2 className="w-4 h-4 text-gray-400 group-hover:text-vanta-blue transition-colors shrink-0" />
              <input type="range" value={contrast} min={0} max={200} step={1} onChange={(e) => setContrast(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-vanta-blue [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-all" />
              <span className="text-[11px] text-gray-400 font-medium w-6 text-right font-mono">{contrast}%</span>
            </div>
            
            {/* Flip Options */}
            <div className="flex items-center gap-3 justify-end pr-2">
              <button 
                onClick={() => setFlipH(!flipH)} 
                title="Espelhar Horizontalmente"
                className={`p-2 rounded-full transition-all ${flipH ? 'bg-vanta-blue/10 text-vanta-blue' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-2"/><path d="M12 14v-2"/><path d="M12 8V6"/><path d="M12 2v2"/><path d="M17 19l4-7-4-7"/><path d="M7 19l-4-7 4-7"/></svg>
              </button>
              <button 
                onClick={() => setFlipV(!flipV)} 
                title="Espelhar Verticalmente"
                className={`p-2 rounded-full transition-all ${flipV ? 'bg-vanta-blue/10 text-vanta-blue' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90"><path d="M12 20v-2"/><path d="M12 14v-2"/><path d="M12 8V6"/><path d="M12 2v2"/><path d="M17 19l4-7-4-7"/><path d="M7 19l-4-7 4-7"/></svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
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
              className="text-xs font-bold text-gray-500 hover:text-vanta-blue transition-colors"
            >
              Resetar Ajustes
            </button>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-vanta-blue hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isProcessing ? 'Cortando...' : 'Cortar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
