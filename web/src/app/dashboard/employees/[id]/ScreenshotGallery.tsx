"use client";

import { useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import { createPortal } from "react-dom";

export default function ScreenshotGallery({ screenshots }: { screenshots: any[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" /> Recent Screenshots
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {screenshots.map(shot => (
            <div 
              key={shot.id} 
              className="relative aspect-video rounded-md overflow-hidden bg-black/50 border border-white/10 group cursor-pointer"
              onClick={() => setSelectedImage(shot.s3Url)}
            >
              <img src={shot.s3Url} alt="Screen capture" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">Click to enlarge</span>
              </div>
            </div>
          ))}
        </div>
        {screenshots.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-white/10 rounded-lg mt-2">
            No screenshots available.
          </div>
        )}
      </div>

      {mounted && selectedImage && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative w-full max-w-5xl flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Enlarged screen capture" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10 bg-black" 
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
