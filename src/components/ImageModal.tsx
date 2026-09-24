import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageSrc, onClose }) => {
  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-3 py-2 text-white border-b border-slate-800 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <ZoomIn className="w-3.5 h-3.5" />
            ภาพแนบ / สลิป / แชทลูกค้า
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 flex items-center justify-center">
          <img
            src={imageSrc}
            alt="Customer attachment"
            className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
