"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  FileText,
  FileCheck2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadService, UploadResult } from "@/services/upload.service";

export interface DocumentUploaderProps {
  value?: string | null;
  fileName?: string | null;
  onChange: (result: { url: string; fileName: string; fileType: string; fileSize?: number }) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  compact?: boolean;
  required?: boolean;
  accept?: string;
}

export function DocumentUploader({
  value,
  fileName,
  onChange,
  onRemove,
  label = "Government ID Proof Document (Scan / PDF / Photo)",
  description = "Attach original Aadhaar, Passport, Voter ID or Driving License from your PC",
  compact = false,
  required = false,
  accept = "image/jpeg,image/png,image/webp,image/jpg,application/pdf",
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>(fileName || "");
  const [currentFileSize, setCurrentFileSize] = useState<string>("");

  const isImage = value?.startsWith("data:image/") || value?.match(/\.(jpeg|jpg|png|webp|gif)(\?.*)?$/i);
  const isPdf = value?.startsWith("data:application/pdf") || value?.match(/\.pdf(\?.*)?$/i);

  const handleFileProcess = async (file: File) => {
    // Validate file size (15MB limit)
    const MAX_SIZE_MB = 15;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File size exceeds ${MAX_SIZE_MB}MB limit. Please select a smaller file.`);
      return;
    }

    // Format file size
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setCurrentFileSize(sizeStr);
    setCurrentFileName(file.name);

    try {
      setIsUploading(true);
      const res: UploadResult = await uploadService.uploadDocument(file);
      onChange({
        url: res.url,
        fileName: res.fileName,
        fileType: res.fileType,
        fileSize: res.fileSize,
      });

      toast.success(`Document attached successfully: ${res.fileName} (${sizeStr})`);
    } catch (err: any) {
      console.error("Document upload error:", err);
      toast.error(err.message || "Failed to process document file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClear = () => {
    setCurrentFileName("");
    setCurrentFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    } else {
      onChange({ url: "", fileName: "", fileType: "" });
    }
    toast.info("Document removed");
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Label & Hint */}
      {!compact && (
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#59283A] flex items-center gap-1.5">
            <span>{label}</span>
            {required && <span className="text-[#B54C44]">*</span>}
          </label>
          <span className="text-[10px] text-[#8E7079]">{description}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 1: DOCUMENT ATTACHED                                                */}
      {/* ========================================================================= */}
      {value && !isUploading ? (
        <div className="p-3 bg-white rounded-xl border border-[#E8DDD8] shadow-sm flex items-center justify-between gap-3 transition-all hover:border-[#C4A06A]">
          {/* Left: Thumbnail Preview or Icon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E8DDD8] bg-[#F5F0EA] flex items-center justify-center flex-shrink-0 relative group">
              {isImage ? (
                <>
                  <Image
                    src={value}
                    alt={currentFileName || "ID Proof"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="absolute inset-0 bg-[#59283A]/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    title="Zoom Preview"
                  >
                    <Eye className="w-4 h-4 text-[#C4A06A]" />
                  </button>
                </>
              ) : isPdf ? (
                <div className="flex flex-col items-center justify-center text-[#B54C44]">
                  <FileText className="w-5 h-5" />
                  <span className="text-[8px] font-bold uppercase mt-0.5 font-mono">PDF</span>
                </div>
              ) : (
                <FileCheck2 className="w-6 h-6 text-[#32765B]" />
              )}
            </div>

            {/* Center File Info */}
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#59283A] truncate max-w-[220px] sm:max-w-xs">
                  {currentFileName || "Government ID Document"}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30 font-bold px-1.5 py-0 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Attached
                </Badge>
              </div>

              <div className="text-[10px] text-[#82747A] flex items-center gap-2 mt-0.5">
                {currentFileSize && <span>{currentFileSize}</span>}
                <span>• Ready to save to guest profile</span>
                {value.startsWith("http") && (
                  <span className="text-[#32765B] font-semibold">• Cloud Stored</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isImage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="h-7 text-xs border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA] px-2.5"
                title="View Full Preview"
              >
                <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] px-2.5"
              title="Change or select different document"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
              <span className="hidden sm:inline">Change</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0 text-[#8E7079] hover:text-[#B54C44] hover:bg-[#F8E8E5]"
              title="Remove Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : isUploading ? (
        /* ========================================================================= */
        /* STATE 2: UPLOADING / PROCESSING STATE                                     */
        /* ========================================================================= */
        <div className="p-4 bg-white rounded-xl border border-[#C4A06A] flex items-center justify-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-[#C4A06A]" />
          <span className="text-xs font-semibold text-[#59283A]">
            Processing and optimizing document from your computer...
          </span>
        </div>
      ) : (
        /* ========================================================================= */
        /* STATE 3: EMPTY DROPZONE STATE (Click to Browse PC File Manager)           */
        /* ========================================================================= */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all select-none ${
            isDragging
              ? "border-[#59283A] bg-[#59283A]/5 scale-[0.99]"
              : "border-[#C4A06A]/50 bg-[#F5F0EA]/40 hover:bg-[#F5F0EA]/80 hover:border-[#59283A]"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-[#E8DDD8] flex items-center justify-center text-[#C4A06A] flex-shrink-0">
              <Upload className="w-4 h-4" />
            </div>

            <div className="text-center sm:text-left">
              <div className="text-xs font-bold text-[#59283A]">
                Click to browse document from your PC / File Manager
              </div>
              <div className="text-[10px] text-[#82747A] mt-0.5">
                Drag &amp; drop files here • JPG, PNG, WEBP, or PDF up to 15MB
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-1 sm:mt-0 sm:ml-auto h-7 text-xs bg-white border-[#C4A06A] text-[#59283A] hover:bg-[#59283A] hover:text-white transition-colors"
            >
              <Upload className="w-3 h-3 mr-1 text-[#C4A06A]" />
              Browse PC
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK INLINE IMAGE PREVIEW MODAL                                          */}
      {/* ========================================================================= */}
      {previewOpen && value && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8DDD8] pb-2">
              <span className="font-serif font-bold text-[#59283A] text-sm">
                Document Preview: {currentFileName || "Government ID"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(false)}
                className="h-7 text-xs"
              >
                Close
              </Button>
            </div>
            <div className="relative w-full h-[60vh] max-h-[500px] rounded-lg overflow-hidden bg-black/5">
              <Image
                src={value}
                alt={currentFileName || "Document Preview"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
