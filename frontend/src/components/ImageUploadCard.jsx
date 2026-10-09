import React, { useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Calendar, FileText } from 'lucide-react';

export default function ImageUploadCard({
  title,
  subtitle,
  badgeColor = "cyan",
  file,
  previewUrl,
  onFileSelect,
  onClear,
  id
}) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${badgeColor === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'}`} />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        {file && (
          <button
            onClick={onClear}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Remove image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Drag/Drop & Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        className={`flex-1 min-h-[220px] rounded-lg border-2 border-dashed transition-all relative flex flex-col items-center justify-center p-3 text-center ${previewUrl
            ? 'border-slate-700/80 bg-slate-950/40'
            : 'border-slate-700/60 hover:border-cyan-500/50 bg-slate-950/30 hover:bg-slate-950/50 cursor-pointer'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept="image/png,image/jpeg,image/tiff,image/tif,image/webp,image/bmp"
          onChange={handleChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center group">
            <div className="relative max-h-52 w-full flex items-center justify-center overflow-hidden rounded-md bg-black/40">
              <img
                src={previewUrl}
                alt={title}
                className="max-h-52 max-w-full object-contain rounded shadow"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer text-white"
              >
                <UploadCloud className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-xs font-medium">Click to replace image</span>
              </div>
            </div>

            {/* File info footer */}
            <div className="mt-2.5 w-full flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
              <span className="truncate max-w-[160px]" title={file?.name}>
                {file?.name || 'preloaded.png'}
              </span>
              <span>{file?.size ? formatFileSize(file.size) : 'Ready'}</span>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-slate-800/80 rounded-full text-slate-400 group-hover:text-cyan-400 transition-colors">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-200">
                <span className="text-cyan-400 underline decoration-cyan-500/50 underline-offset-2">Click to browse</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-500">
                PNG, JPG, TIFF, GeoTIFF, BMP (up to 25MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
