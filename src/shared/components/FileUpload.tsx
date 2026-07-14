// ============================================================
// FileUpload — 文件拖拽上传组件
// 支持 .xlsx/.xls/.csv 预览
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '../../lib/cn';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  loading?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  previewData?: Array<Record<string, unknown>> | null;
  previewLoading?: boolean;
}

export function FileUpload({
  accept = '.xlsx,.xls,.csv',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  onFileSelect,
  onFileRemove,
  loading = false,
  label = '点击或拖拽文件到此处上传',
  hint,
  className,
  previewData,
  previewLoading,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (accept && !accept.split(',').some((a) => a.trim().endsWith(ext || ''))) {
      setError(`不支持的文件格式，请上传 ${accept} 文件`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect, maxSize, accept],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    onFileRemove?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          dragOver
            ? 'border-gray-900 bg-gray-50'
            : selectedFile
              ? 'border-emerald-200 bg-emerald-50/30'
              : 'border-gray-200 bg-white hover:border-gray-300',
          !loading && 'cursor-pointer',
          loading && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />

        {loading || previewLoading ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <p className="mt-2 text-sm text-gray-500">处理中...</p>
          </>
        ) : selectedFile ? (
          <>
            <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              移除文件
            </button>
          </>
        ) : (
          <>
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* 预览表格 */}
      {previewData && previewData.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {Object.keys(previewData[0]).map((key) => (
                    <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-1.5 text-gray-700">
                        {String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 10 && (
            <p className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
              显示前 10 行，共 {previewData.length} 行
            </p>
          )}
        </div>
      )}
    </div>
  );
}
