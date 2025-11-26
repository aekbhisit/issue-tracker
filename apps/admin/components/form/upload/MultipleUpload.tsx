"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "@/hooks/useNotification";
import { getTempUploadEndpoint } from "@/lib/upload";
import { getUploadConfig, validateFile as validateUploadFile } from "@/lib/utils/image.utils";
import TextInput from "@/components/form/inputs/TextInput";

interface FileItem {
  id: string;
  path: string;
  preview?: string;
  file?: File;
  isUploading: boolean;
  error?: string;
  alt?: string;
}

interface MultipleUploadProps {
  value?: [string, string][]; // Array of [src, alt]
  onChange: (value: [string, string][]) => void;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  accept?: string;
  uploadType?: 'image' | 'video' | 'document';
  max?: number | string; // จาก config เช่น '6', '8', '10'
  existingFiles?: string[];
  isEditMode?: boolean;
}

export default function MultipleUpload({
  value = [],
  onChange,
  label,
  required = false,
  error,
  helperText,
  className = "",
  accept,
  uploadType = 'image',
  max,
  existingFiles = [],
  isEditMode = false
}: MultipleUploadProps) {
  const { t } = useTranslation();
  const notification = useNotification();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);
  const internalUpdateRef = useRef(false);

  // Get upload configuration from utility
  const config = useMemo(() => getUploadConfig(uploadType, accept), [uploadType, accept]);

  // Parse max limit
  const maxLimit = max ? (typeof max === 'string' ? parseInt(max, 10) : max) : undefined;

  // Helper function to extract src from value (array format [src, alt] or string for backward compatibility)
  const getSrcFromValue = (val: [string, string] | string | undefined): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val[0] || '';
    return typeof val === 'string' ? val : '';
  };

  // Helper function to extract alt from value (array format [src, alt])
  const getAltFromValue = (val: [string, string] | string | undefined): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val[1] || '';
    return '';
  };

  // Initialize files from value (only when value changes externally, not from internal updates)
  useEffect(() => {
    // Don't update if we're currently processing files or if it's an internal update
    if (isProcessingRef.current || internalUpdateRef.current) {
      return;
    }

    // Convert value to array of [src, alt] format
    const valueArray: [string, string][] = value || [];
    const existingArray: [string, string][] = existingFiles.map((path) => [path, '']);
    const allItems = [...existingArray, ...valueArray].filter((item) => item[0]);

    setFiles((prevFiles) => {
      const currentPaths = prevFiles.map((f) => f.path).filter(Boolean);
      const newPaths = allItems.map((item) => item[0]);

      // Check if we have files that are being uploaded or have previews (preserve them)
      const uploadingFiles = prevFiles.filter((f) => f.preview && !f.path && f.isUploading);
      const filesWithDataURLPreviews = prevFiles.filter((f) =>
        f.preview &&
        f.preview.startsWith('data:') &&
        (!f.path || f.path === '')
      );

      // Only update if paths have changed AND we don't have files with previews that need to be preserved
      if (newPaths.length !== currentPaths.length ||
        !newPaths.every((path, idx) => currentPaths[idx] === path)) {

        // If we have files with data URL previews that don't have paths yet, they're being uploaded
        // Don't override them - preserve ALL existing files with previews
        if (filesWithDataURLPreviews.length > 0 || uploadingFiles.length > 0) {
          // Keep ALL existing files with previews (don't override them)
          // Only update files that already have paths to match value
          const mergedFiles: FileItem[] = prevFiles.map((file) => {
            // If file has preview data URL but no path, keep it as is
            if (file.preview && file.preview.startsWith('data:') && (!file.path || file.path === '')) {
              return file;
            }
            // If file has path, check if it should be updated
            if (file.path) {
              const pathExists = newPaths.includes(file.path);
              if (pathExists) {
                // Update alt text if available
                const item = allItems.find((item) => item[0] === file.path);
                if (item) {
                  return { ...file, alt: item[1] || file.alt || '' };
                }
                return file; // Keep existing file with path
              }
            }
            return file;
          });

          // Add new paths that don't exist yet (but don't override existing files with previews)
          allItems.forEach((item) => {
            const [path, alt] = item;
            const exists = mergedFiles.some((f) => f.path === path || (f.preview && f.preview === path));
            if (!exists) {
              mergedFiles.push({
                id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                path,
                alt: alt || '',
                preview: path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') ? path : path,
                isUploading: false,
              });
            }
          });

          return mergedFiles;
        }

        // Normal merge logic when no files are being uploaded
        const mergedFiles: FileItem[] = [];

        // First, add files that are being uploaded (preserve their preview)
        uploadingFiles.forEach((uploadingFile) => {
          mergedFiles.push(uploadingFile);
        });

        // Then, add files from paths
        allItems.forEach((item, index) => {
          const [path, alt] = item;
          // First priority: Check if file already exists in state with this exact path (preserve everything)
          const existingByPath = prevFiles.find((f) => f.path === path && !uploadingFiles.includes(f));
          if (existingByPath) {
            mergedFiles.push({ ...existingByPath, alt: alt || existingByPath.alt || '' });
            return;
          }

          // Second priority: Check if we have a file with data URL preview that should get this path
          const existingByPreview = filesWithDataURLPreviews.find((f) =>
            !uploadingFiles.includes(f) &&
            !mergedFiles.some((mf) => mf.id === f.id)
          );
          if (existingByPreview && path) {
            mergedFiles.push({ ...existingByPreview, path, alt: alt || '', preview: existingByPreview.preview });
            return;
          }

          // Create new file item for path
          const preview = path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')
            ? path
            : path;

          mergedFiles.push({
            id: `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            path,
            alt: alt || '',
            preview,
            isUploading: false,
          });
        });

        return mergedFiles;
      }
      return prevFiles;
    });
  }, [value, existingFiles]);

  // Validate single file using utility
  const validateFile = (file: File): string | null => {
    const error = validateUploadFile(file, config);
    return error ? `${file.name}: ${error}` : null;
  };

  // Check max limit before processing
  const checkMaxLimit = (newFilesCount: number): boolean => {
    if (maxLimit === undefined) return true;
    const currentCount = files.length;
    if (currentCount + newFilesCount > maxLimit) {
      notification.showError({
        message: t("admin.content_category.form.upload.maxLimitExceeded", {
          defaultValue: `จำนวนไฟล์เกินกำหนด (สูงสุด ${maxLimit} ไฟล์)`,
          max: maxLimit,
        }),
      });
      return false;
    }
    return true;
  };

  // Upload single file
  const uploadFile = async (file: File, fileItem: FileItem): Promise<string | null> => {
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
      return result.tempPath;
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback to mock path
      return `@temp/${Date.now()}_${file.name}`;
    }
  };

  // Process files: validate and upload
  const processFiles = async (fileList: File[]) => {
    // Check max limit first
    if (!checkMaxLimit(fileList.length)) {
      return;
    }

    // Set processing flag
    isProcessingRef.current = true;

    // Validate all files first
    const validFiles: File[] = [];
    const invalidFiles: { file: File; error: string }[] = [];

    fileList.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        invalidFiles.push({ file, error });
      } else {
        validFiles.push(file);
      }
    });

    // Create file items for valid files with preview
    const createFileItemWithPreview = (file: File, index: number): Promise<FileItem> => {
      return new Promise((resolve) => {
        // Use performance.now() and index for better uniqueness
        const id = `new-${performance.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        const reader = new FileReader();

        reader.onload = (e) => {
          const preview = e.target?.result as string;
          resolve({
            id,
            path: '',
            preview,
            file,
            isUploading: true,
            alt: '',
          });
        };

        reader.onerror = () => {
          // Fallback if FileReader fails
          resolve({
            id,
            path: '',
            preview: undefined,
            file,
            isUploading: true,
            alt: '',
          });
        };

        reader.readAsDataURL(file);
      });
    };

    // Create all file items with previews
    const newFileItems = await Promise.all(
      validFiles.map((file, index) => createFileItemWithPreview(file, index))
    );

    // Add new file items to state
    setFiles((prev) => [...prev, ...newFileItems]);

    // Upload valid files
    const uploadPromises = newFileItems.map(async (fileItem) => {
      if (!fileItem.file) return null;

      try {
        const tempPath = await uploadFile(fileItem.file, fileItem);
        if (tempPath) {
          // Update file item with path but preserve preview (data URL)
          setFiles((prev) =>
            prev.map((item) =>
              item.id === fileItem.id
                ? { ...item, path: tempPath, isUploading: false, preview: item.preview } // Preserve preview data URL
                : item
            )
          );
          return tempPath;
        }
      } catch (err) {
        // Handle upload error
        setFiles((prev) =>
          prev.map((item) =>
            item.id === fileItem.id
              ? { ...item, isUploading: false, error: 'Upload failed' }
              : item
          )
        );
      }
      return null;
    });

    // Wait for all uploads to complete
    const paths = await Promise.all(uploadPromises);
    const successfulPaths = paths.filter((path): path is string => path !== null);

    // Update parent component with all successful paths
    // Use current files state to get all paths including existing ones
    setFiles((currentFiles) => {
      // Create array of [src, alt] pairs
      const allItems: [string, string][] = currentFiles
        .map((f) => [f.path, f.alt || ''] as [string, string])
        .filter((item) => item[0]); // Filter out empty paths

      // Add newly uploaded paths that might not be in currentFiles yet
      successfulPaths.forEach((path) => {
        const exists = allItems.some((item) => item[0] === path);
        if (!exists) {
          allItems.push([path, '']);
        }
      });

      // Remove duplicates and maintain order
      const uniqueItems: [string, string][] = [];
      const seenPaths = new Set<string>();
      allItems.forEach((item) => {
        if (!seenPaths.has(item[0])) {
          seenPaths.add(item[0]);
          uniqueItems.push(item);
        }
      });

      // Mark as internal update to prevent useEffect from overriding
      internalUpdateRef.current = true;
      onChange(uniqueItems);

      // Reset flag after a longer delay to ensure useEffect doesn't interfere
      setTimeout(() => {
        internalUpdateRef.current = false;
      }, 500);

      return currentFiles;
    });

    // Add invalid files to state to show error messages
    if (invalidFiles.length > 0) {
      const createInvalidFileItem = (file: File, error: string, index: number): Promise<FileItem> => {
        return new Promise((resolve) => {
          const id = `invalid-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
          const reader = new FileReader();

          reader.onload = (e) => {
            const preview = e.target?.result as string;
            resolve({
              id,
              path: '',
              preview,
              file,
              isUploading: false,
              error,
              alt: '',
            });
          };

          reader.onerror = () => {
            resolve({
              id,
              path: '',
              preview: undefined,
              file,
              isUploading: false,
              error,
              alt: '',
            });
          };

          reader.readAsDataURL(file);
        });
      };

      const invalidFileItems = await Promise.all(
        invalidFiles.map(({ file, error }, index) => createInvalidFileItem(file, error, index))
      );

      // Add invalid files to state (they will be shown with error messages)
      setFiles((prev) => [...prev, ...invalidFileItems]);
    }

    // Clear processing flag
    isProcessingRef.current = false;
  };

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    await processFiles(filesArray);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragZoneLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((item) => item.id !== fileId);
      const items: [string, string][] = updated
        .map((item) => [item.path, item.alt || ''] as [string, string])
        .filter((item) => item[0]); // Filter out empty paths
      onChange(items);
      return updated;
    });
  };

  // Sortable handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleItemDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setFiles((prev) => {
      const updated = [...prev];
      const draggedItem = updated[draggedIndex];

      // Remove dragged item
      updated.splice(draggedIndex, 1);

      // Insert at new position
      const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      updated.splice(newIndex, 0, draggedItem);

      // Update parent with new order
      const items: [string, string][] = updated
        .map((item) => [item.path, item.alt || ''] as [string, string])
        .filter((item) => item[0]); // Filter out empty paths
      internalUpdateRef.current = true;
      onChange(items);
      setTimeout(() => {
        internalUpdateRef.current = false;
      }, 100);

      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAltChange = (fileId: string, newAlt: string) => {
    setFiles((prev) => {
      const updated = prev.map((item) =>
        item.id === fileId ? { ...item, alt: newAlt } : item
      );

      // Update parent component with new alt values
      const items: [string, string][] = updated
        .map((item) => [item.path, item.alt || ''] as [string, string])
        .filter((item) => item[0]); // Filter out empty paths

      internalUpdateRef.current = true;
      onChange(items);
      setTimeout(() => {
        internalUpdateRef.current = false;
      }, 100);

      return updated;
    });
  };

  const currentFiles = files.filter((f) => f.path || f.preview);
  const canAddMore = maxLimit === undefined || currentFiles.length < maxLimit;
  const shouldRenderAltInput = uploadType === 'image';

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
        multiple
        className="hidden"
      />

      {/* Grid Gallery */}
      {currentFiles.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-2">
            {currentFiles.map((fileItem, index) => (
              <div
                key={fileItem.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDragLeave={handleItemDragLeave}
                onDrop={(e) => handleItemDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-move transition-transform ${draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${dragOverIndex === index ? 'scale-105 z-10' : ''
                  }`}
              >
                <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${dragOverIndex === index
                    ? 'border-brand-500 border-dashed bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                  }`}>
                  {fileItem.isUploading ? (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="animate-spin h-8 w-8 text-brand-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  ) : uploadType === 'image' && (fileItem.preview || fileItem.path) ? (
                    <img
                      src={fileItem.preview || fileItem.path}
                      alt={fileItem.alt || "Preview"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If preview fails, try to use path as fallback
                        if (fileItem.preview && fileItem.path && fileItem.preview !== fileItem.path) {
                          (e.target as HTMLImageElement).src = fileItem.path;
                        }
                      }}
                    />
                  ) : uploadType === 'video' && fileItem.preview ? (
                    <video
                      src={fileItem.preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {uploadType === 'image' && (
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      {uploadType === 'video' && (
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      {uploadType === 'document' && (
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Drag handle indicator */}
                <div className="absolute top-2 left-2 p-1.5 bg-gray-800/70 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(fileItem.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="ลบ"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Error message */}
                {fileItem.error && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate">
                    {fileItem.error}
                  </p>
                )}

                {/* Order indicator */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-gray-900/70 rounded text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Alt text inputs for images */}
          {shouldRenderAltInput && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentFiles.map((fileItem, index) => (
                <div key={`alt-${fileItem.id}`}>
                  <TextInput
                    value={fileItem.alt || ''}
                    onChange={(newAlt) => handleAltChange(fileItem.id, newAlt)}
                    label={`Alt text (รูปที่ ${index + 1})`}
                    placeholder={t("common.placeholder.altText", { defaultValue: "คำอธิบายรูปภาพ" })}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sortable hint */}
      {currentFiles.length > 1 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          💡 ลากรูปเพื่อเรียงลำดับ
        </p>
      )}

      {/* Drag & Drop Zone */}
      {canAddMore && (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragZoneLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500'
            }
            ${error ? 'border-red-500' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center">
            {uploadType === 'image' && (
              <svg
                className="h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
            {uploadType === 'video' && (
              <svg
                className="h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
            {uploadType === 'document' && (
              <svg
                className="h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="text-brand-500 font-medium">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              รองรับ: {config.supportedFormats} (ขนาดไม่เกิน {Math.round(config.maxSize / (1024 * 1024))}MB)
              {maxLimit && ` • สูงสุด ${maxLimit} ไฟล์`}
            </p>
          </div>
        </div>
      )}

      {/* Max limit reached message */}
      {maxLimit && currentFiles.length >= maxLimit && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          ถึงจำนวนสูงสุดแล้ว ({maxLimit} ไฟล์)
        </p>
      )}

      {/* Global error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

