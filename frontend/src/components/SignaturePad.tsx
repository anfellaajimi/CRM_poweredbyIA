import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Check, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  title: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 200;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setIsEmpty(false);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas && !isEmpty) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/30 rounded-lg">
            <Pencil className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold tracking-tight">{title}</h3>
        </div>
        <button onClick={onCancel} className="text-indigo-100 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-widest">Signez dans le cadre ci-dessous :</p>
        
        <div className="relative border-2 border-dashed border-indigo-100 rounded-xl bg-indigo-50/20 h-[200px] cursor-crosshair overflow-hidden group">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 w-full h-full"
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
               <div className="text-center">
                  <Pencil className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-indigo-400 italic font-serif">Votre signature ici</p>
               </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
          >
            <Eraser className="w-4 h-4" />
            Effacer
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              disabled={isEmpty}
              onClick={save}
              className={cn(
                "flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95",
                isEmpty 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              <Check className="w-4 h-4" />
              Confirmer la signature
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
           En signant ce document, vous acceptez les termes et conditions du contrat. <br/>
           Cette signature électronique a la même valeur légale qu'une signature manuscrite.
        </p>
      </div>
    </div>
  );
};
