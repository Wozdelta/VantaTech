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

        {/* Controls */}
        <div className="p-6 bg-white dark:bg-gray-900 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Zoom Control */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zoom</span>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-vanta-blue" />
                <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rotação</span>
              <div className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-vanta-blue" />
                <span className="text-xs text-gray-500 font-medium w-6 text-right">{rotation}°</span>
              </div>
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saturação</span>
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="range" value={saturation} min={0} max={200} step={1} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-vanta-blue" />
                <span className="text-xs text-gray-500 font-medium w-6 text-right">{saturation}%</span>
              </div>
            </div>

            {/* Brightness */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brilho</span>
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="range" value={brightness} min={0} max={200} step={1} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-vanta-blue" />
                <span className="text-xs text-gray-500 font-medium w-6 text-right">{brightness}%</span>
              </div>
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contraste</span>
              <div className="flex items-center gap-3">
                <Settings2 className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="range" value={contrast} min={0} max={200} step={1} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-vanta-blue" />
                <span className="text-xs text-gray-500 font-medium w-6 text-right">{contrast}%</span>
              </div>
            </div>
            
            {/* Flip Options */}
            <div className="flex flex-col gap-2 justify-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inverter (Espelhar)</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setFlipH(!flipH)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${flipH ? 'bg-vanta-blue text-white border-vanta-blue' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}>Horizontal</button>
                <button onClick={() => setFlipV(!flipV)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${flipV ? 'bg-vanta-blue text-white border-vanta-blue' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}>Vertical</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
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
  );
}
