import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SquareIcon, BrushIcon, EraserIcon, PaintBucketIcon, PaletteIcon, UndoIcon, RedoIcon, TrashIcon, LassoSelect, Wand2, MaximizeIcon, XIcon as XMarkIcon } from 'lucide-react';

const CurveIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 19c3.5-5 5-14 14-14" />
  </svg>
);

interface CanvasEditorProps {
  imageUrl: string;
  onMaskChange: (maskBase64: string | null) => void;
  onChangeImage: () => void;
}

type Tool = 'rectangle' | 'brush' | 'fill' | 'eraser' | 'lasso' | 'magic-wand';

const ToolButton = ({ icon: Icon, active, onClick, title }: any) => (
  <button 
    onClick={onClick}
    className={`p-2 md:p-3 rounded-xl border transition-colors relative ${active ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-gray-400'}`}
    title={title}
  >
    <Icon className="w-4 h-4 md:w-5 md:h-5" />
    {active && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
  </button>
);

export default function CanvasEditor({ imageUrl, onMaskChange, onChangeImage }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [tool, setTool] = useState<Tool>('rectangle');
  const [color, setColor] = useState('#10b981'); // Emerald 500
  const [brushSize, setBrushSize] = useState(20);
  const [eraserSize, setEraserSize] = useState(40);
  const [wandTolerance, setWandTolerance] = useState(40);
  
  const [showEraserSlider, setShowEraserSlider] = useState(false);
  const [showBrushSlider, setShowBrushSlider] = useState(false);
  const [showWandSlider, setShowWandSlider] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const historyStepRef = useRef(historyStep);
  useEffect(() => {
    historyStepRef.current = historyStep;
  }, [historyStep]);

  const updateMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let isEmpty = true;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        isEmpty = false;
        break;
      }
    }
    
    if (isEmpty) {
      onMaskChange(null);
      return;
    }

    // Create a new canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Fill with black
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw the drawn areas as white
    const drawnData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    
    for (let i = 0; i < drawnData.data.length; i += 4) {
      if (drawnData.data[i + 3] > 0) {
        maskImageData.data[i] = 255;
        maskImageData.data[i + 1] = 255;
        maskImageData.data[i + 2] = 255;
        maskImageData.data[i + 3] = 255;
      }
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);
    onMaskChange(maskCanvas.toDataURL('image/png'));
  }, [onMaskChange]);

  const saveState = useCallback((clearHistory = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      if (clearHistory) return [imageData];
      const newHistory = prev.slice(0, historyStepRef.current + 1);
      newHistory.push(imageData);
      return newHistory;
    });
    setHistoryStep(prev => clearHistory ? 0 : prev + 1);
    updateMask();
  }, [updateMask]);

  // Initialize canvas size to match image
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const updateSize = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) return;
      
      // Only reset if dimensions actually changed
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        // Save initial empty state and clear history
        saveState(true);
      }
    };

    if (img.complete) {
      updateSize();
    } else {
      img.onload = updateSize;
    }
  }, [imageUrl, saveState]);

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      restoreState(history[newStep]);
      updateMask();
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      restoreState(history[newStep]);
      updateMask();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const selectAll = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const restoreState = (imageData: ImageData) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.putImageData(imageData, 0, 0);
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const renderedWidth = canvas.width * scale;
    const renderedHeight = canvas.height * scale;
    
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale
    };
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    setStartPos(pos);
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (tool === 'fill') {
      // Basic fill: just fill the whole canvas for now
      ctx.fillStyle = hexToRgba(color, 0.4);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setIsDrawing(false);
      saveState();
      return;
    }

    if (tool === 'magic-wand') {
      const img = imgRef.current;
      if (!img) return;
      
      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = canvas.width;
      hiddenCanvas.height = canvas.height;
      const hiddenCtx = hiddenCanvas.getContext('2d');
      if (!hiddenCtx) return;
      hiddenCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imgData = hiddenCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      const targetIdx = (Math.floor(pos.y) * canvas.width + Math.floor(pos.x)) * 4;
      const targetR = data[targetIdx];
      const targetG = data[targetIdx + 1];
      const targetB = data[targetIdx + 2];
      
      const rgbaMatch = hexToRgba(color, 0.4).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!rgbaMatch) return;
      const fillR = parseInt(rgbaMatch[1]);
      const fillG = parseInt(rgbaMatch[2]);
      const fillB = parseInt(rgbaMatch[3]);
      const fillA = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) * 255 : 255;
      
      const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const mData = maskData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const diff = Math.sqrt(
          Math.pow(r - targetR, 2) + 
          Math.pow(g - targetG, 2) + 
          Math.pow(b - targetB, 2)
        );
        
        if (diff <= wandTolerance) {
          mData[i] = fillR;
          mData[i + 1] = fillG;
          mData[i + 2] = fillB;
          mData[i + 3] = fillA;
        }
      }
      
      ctx.putImageData(maskData, 0, 0);
      setIsDrawing(false);
      saveState();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    if (tool === 'brush' || tool === 'eraser' || tool === 'lasso') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = tool === 'eraser' ? eraserSize : brushSize;
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : hexToRgba(color, 0.4);
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const pos = getMousePos(e);

    if (tool === 'rectangle') {
      // Restore last saved state to clear previous rectangle preview
      if (historyStep >= 0) {
        ctx.putImageData(history[historyStep], 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = hexToRgba(color, 0.4);
      ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === 'brush' || tool === 'eraser' || tool === 'lasso') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    if (tool === 'lasso') {
      ctx.fillStyle = hexToRgba(color, 0.4);
      ctx.fill();
    }
    
    ctx.closePath();
    ctx.globalCompositeOperation = 'source-over'; // Reset
    saveState();
  };

  return (
    <div className="flex flex-row items-center justify-center gap-2 md:gap-4 w-full select-none">
      {/* Left Icons */}
      <div className="flex flex-col gap-2 order-1 relative">
        <ToolButton icon={SquareIcon} active={tool === 'rectangle'} onClick={() => { setTool('rectangle'); setShowEraserSlider(false); setShowBrushSlider(false); setShowColorPicker(false); }} title="Rectangle Select" />
        
        <div className="relative">
          <ToolButton icon={BrushIcon} active={tool === 'brush'} onClick={() => { setTool('brush'); setShowBrushSlider(!showBrushSlider); setShowEraserSlider(false); setShowColorPicker(false); }} title="Brush" />
          {showBrushSlider && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col gap-2 z-10 w-32">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Brush Size</span>
              <input type="range" min="1" max="25" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          )}
        </div>

        <ToolButton icon={PaintBucketIcon} active={tool === 'fill'} onClick={() => { setTool('fill'); setShowEraserSlider(false); setShowBrushSlider(false); setShowColorPicker(false); }} title="Fill Canvas" />
        
        <div className="relative">
          <ToolButton icon={EraserIcon} active={tool === 'eraser'} onClick={() => { setTool('eraser'); setShowEraserSlider(!showEraserSlider); setShowBrushSlider(false); setShowColorPicker(false); }} title="Eraser" />
          {showEraserSlider && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col gap-2 z-10 w-32">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Eraser Size</span>
              <input type="range" min="1" max="25" value={eraserSize} onChange={(e) => setEraserSize(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          )}
        </div>

        <div className="relative">
          <ToolButton icon={PaletteIcon} active={showColorPicker} onClick={() => { setShowColorPicker(!showColorPicker); setShowEraserSlider(false); setShowBrushSlider(false); }} title="Color" />
          {showColorPicker && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 p-2 rounded-xl border border-gray-700 z-10">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0" />
            </div>
          )}
        </div>
        
        <ToolButton icon={CurveIcon} active={false} onClick={() => {}} title="Curve" />
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-gray-800 shadow-2xl order-2 group touch-none"
      >
        <button 
            onClick={(e) => { e.stopPropagation(); onChangeImage(); }}
            className="absolute top-4 right-4 z-50 p-2 bg-gray-900/80 border border-gray-700 rounded-full hover:bg-gray-800 transition-colors shadow-xl"
            title="Remove Image"
        >
            <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
        <img 
          ref={imgRef}
          src={imageUrl} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          alt="Edit Preview"
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        
      </div>

      {/* Right Icons */}
      <div className="flex flex-col gap-2 order-3">
        <button onClick={undo} disabled={historyStep <= 0} className="p-2 md:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo"><UndoIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /></button>
        <button onClick={redo} disabled={historyStep >= history.length - 1} className="p-2 md:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Redo"><RedoIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /></button>
        <button onClick={clear} disabled={historyStep <= 0} className="p-2 md:p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Clear"><TrashIcon className="w-4 h-4 md:w-5 md:h-5 text-red-400/70 hover:text-red-400" /></button>
      </div>
    </div>
  );
}
