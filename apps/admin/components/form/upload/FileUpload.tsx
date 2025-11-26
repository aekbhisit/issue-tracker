"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import TextInput from "@/components/form/inputs/TextInput";
import { getTempUploadEndpoint } from "@/lib/upload";
import { getImageUrl, getUploadConfig, validateFile as validateUploadFile, validateRequiredFile } from "@/lib/utils/image.utils";

export interface BannerMedia {
  src: string;
  alt?: string;
}

// Array format: [src, alt]
type FileUploadValue = string | BannerMedia | [string, string] | null;

interface FileUploadProps {
  value?: FileUploadValue;
  onChange: (value: [string, string] | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  accept?: string;
  uploadType?: 'image' | 'video' | 'document';
  // New props for file management
  onFileChange?: (file: File | null, tempPath: string | null) => void;
  onRemove?: () => void;
  existingFile?: string; // For edit mode - existing file path
  isEditMode?: boolean;
  altValue?: string;
  onAltChange?: (value: string) => void;
  altLabel?: string;
  altPlaceholder?: string;
  altHelperText?: string;
  altRequired?: boolean;
  altError?: string;
  altName?: string;
}

export default function FileUpload({
  value,
  onChange,
  label,
  required = false,
  error,
  helperText,
  className = "",
  accept,
  uploadType = 'image',
  onFileChange,
  onRemove,
  existingFile,
  isEditMode = false,
  altValue,
  onAltChange,
  altLabel,
  altPlaceholder,
  altHelperText,
  altRequired = false,
  altError,
  altName,
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileReaderPreview, setFileReaderPreview] = useState<string>(""); // Preview from FileReader when uploading new file
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [tempPath, setTempPath] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalAlt, setInternalAlt] = useState<string>(altValue ?? "");

  // Helper function to detect if value is array format
  const isArrayFormat = (val: FileUploadValue | undefined): val is [string, string] => {
    return Array.isArray(val) && val.length === 2;
  };

  // Helper function to detect if value is object format
  const isObjectFormat = (val: FileUploadValue | undefined): val is BannerMedia => {
    return val !== null && val !== undefined && typeof val === 'object' && !Array.isArray(val) && 'src' in val;
  };

  // Helper function to extract src from value (array, object, or string)
  const getSrcFromValue = (val: FileUploadValue | undefined): string => {
    if (!val) return '';
    if (isArrayFormat(val)) return val[0] || '';
    if (isObjectFormat(val)) return val.src || '';
    return typeof val === 'string' ? val : '';
  };

  // Helper function to extract alt from value (array, object, or string)
  const getAltFromValue = (val: FileUploadValue | undefined): string => {
    if (!val) return '';
    if (isArrayFormat(val)) return val[1] || '';
    if (isObjectFormat(val)) return val.alt || '';
    return '';
  };

  // Get current src and alt values
  // Use tempPath if available (for newly uploaded files), otherwise use value or existingFile
  const srcFromValue = getSrcFromValue(value);
  const currentSrc = tempPath || srcFromValue || existingFile || '';
  const currentAlt = getAltFromValue(value) || altValue || internalAlt;

  const altInputValue = currentAlt;
  // Always show alt input for images
  const shouldRenderAltInput = true; //uploadType === 'image';

  React.useEffect(() => {
    const altFromValue = getAltFromValue(value);
    setInternalAlt(altFromValue || altValue || "");
  }, [value, altValue]);

  // Get upload configuration from utility
  const config = useMemo(() => getUploadConfig(uploadType, accept), [uploadType, accept]);

  // Validation function
  const validateFile = (file: File | null): string => {
    if (required) {
      const requiredError = validateRequiredFile(file, currentSrc || existingFile, label);
      if (requiredError) return requiredError;
    }
    return "";
  };

  // Update validation error when dependencies change
  React.useEffect(() => {
    const error = validateFile(currentFile);
    setValidationError(error);
  }, [currentFile, value, existingFile, required, label]);

  // Calculate preview URL from value/existingFile or FileReader
  const previewUrl = useMemo(() => {
    // If we have FileReader preview (newly uploaded file), use it
    if (fileReaderPreview) {
      return fileReaderPreview;
    }

    // Otherwise, use value or existingFile or currentSrc
    const src = getSrcFromValue(value) || existingFile || currentSrc || '';
    if (!src) return '';

    // For video and document, use getImageUrl to convert path to URL
    // For image, also use getImageUrl
    const url = getImageUrl(src);
    // If getImageUrl returns null or empty, use src directly
    return url || src;
  }, [fileReaderPreview, value, existingFile, currentSrc]);

  // Function to get file data for form submission
  const getFileDataForSubmission = () => {
    return {
      file: currentFile,
      tempPath: tempPath,
      existingFile: existingFile,
      hasFile: !!(currentFile || existingFile),
      isNewFile: !!currentFile,
      isExistingFile: !!existingFile && !currentFile,
      validationError: validationError
    };
  };

  const handleFileSelect = async (file: File) => {
    // Clear previous validation error
    setValidationError("");

    // Validate file using utility
    const validationError = validateUploadFile(file, config);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for temp upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      // Upload to temp endpoint
      const response = await fetch(getTempUploadEndpoint(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Update state first
      setCurrentFile(file);
      setTempPath(result.tempPath);

      // Set preview URL for immediate display using FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewResult = e.target?.result as string;
        setFileReaderPreview(previewResult);
      };
      reader.readAsDataURL(file);

      // Notify parent component - always use array format [src, alt] for all upload types
      onChange([result.tempPath, internalAlt]);
      onFileChange?.(file, result.tempPath);

      setIsUploading(false);
    } catch (err) {
      console.error('Upload error:', err);

      // Fallback to mock upload if API is not available
      console.log('API not available, using mock upload');
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFileReaderPreview(result);
        // Mock path: @temp/filename
        const mockPath = `@temp/${Date.now()}_${file.name}`;

        // Update state
        setCurrentFile(file);
        setTempPath(mockPath);

        // Notify parent component - always use array format [src, alt] for all upload types
        onChange([mockPath, internalAlt]);
        onFileChange?.(file, mockPath);

        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    // Clear all state
    setCurrentFile(null);
    setTempPath(null);
    setFileReaderPreview('');
    setValidationError('');
    if (uploadType === 'image') {
      setInternalAlt('');
      onAltChange?.('');
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent component - always use array format [src, alt] for all upload types
    onChange(null);
    onFileChange?.(null, null);
    onRemove?.();
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!currentSrc && !previewUrl && !existingFile ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500'
            }
            ${error ? 'border-red-500' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-brand-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">กำลังอัปโหลดไปยัง temp...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {uploadType === 'image' && (
                <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {uploadType === 'video' && (
                <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {uploadType === 'document' && (
                <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span className="text-brand-500 font-medium">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                รองรับ: {config.supportedFormats} (ขนาดไม่เกิน {Math.round(config.maxSize / (1024 * 1024))}MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
            {uploadType === 'image' && previewUrl ? (
              <Image
                src={previewUrl}
                alt={currentAlt || "Preview"}
                fill
                className="object-contain"
                unoptimized
              />
            ) : uploadType === 'video' && (previewUrl || currentSrc || existingFile) ? (
              <video
                src={previewUrl || currentSrc || existingFile || ''}
                controls
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Video preview error:', e);
                  // Fallback: try using currentSrc or existingFile directly if previewUrl fails
                  const fallbackSrc = currentSrc || existingFile;
                  if (fallbackSrc && (e.target as HTMLVideoElement).src !== fallbackSrc) {
                    (e.target as HTMLVideoElement).src = fallbackSrc;
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4">
                {uploadType === 'image' && (
                  <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {uploadType === 'video' && (
                  <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {uploadType === 'document' && (
                  <>
                    <svg className="h-16 w-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {currentFile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center break-words px-2">
                        {currentFile.name}
                      </p>
                    )}
                    {(currentSrc || existingFile) && !currentFile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center break-words px-2">
                        {(currentSrc || existingFile || '').split('/').pop() || 'ไฟล์เอกสาร'}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleClick}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`เปลี่ยน${uploadType === 'image' ? 'รูป' : uploadType === 'video' ? 'วิดีโอ' : 'เอกสาร'}`}
            >
              <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors"
              title={`ลบ${uploadType === 'image' ? 'รูป' : uploadType === 'video' ? 'วิดีโอ' : 'เอกสาร'}`}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {(error || validationError) && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error || validationError}</p>
      )}
      {helperText && !error && !validationError && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {currentSrc && (
        <input
          type="hidden"
          value={currentSrc}
        />
      )}
      {/* Only show alt input for image type */}
      {shouldRenderAltInput ? (
        <div className="mt-4">
          <TextInput
            value={altInputValue}
            onChange={(newAlt) => {
              setInternalAlt(newAlt);
              onAltChange?.(newAlt);

              // Always use array format [src, alt]
              const currentSrcValue = currentSrc || '';
              onChange([currentSrcValue, newAlt]);
            }}
            label={altLabel ?? t("common.label.altText")}
            placeholder={altPlaceholder ?? t("common.placeholder.altText")}
            helperText={altHelperText}
            required={altRequired}
            error={altError}
            name={altName}
            id={altName}
          />
        </div>
      ) : (
        // Hidden input for alt when not image type (to maintain array format [src, alt])
        <input
          type="hidden"
          value={currentAlt || ''}
        />
      )}
    </div>
  );
}

