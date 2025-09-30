'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DatasetSectionProps {
  dataset: {
    filename: string;
    data: any;
    summary?: {
      rows: number;
      columns: number;
      columnNames: string[];
      columnTypes: Record<string, string>;
    };
  } | null;
  onDatasetUpload: (filename: string, data: any, summary: any) => void;
  onDatasetRemove: () => void;
}

export default function DatasetSection({
  dataset,
  onDatasetUpload,
  onDatasetRemove,
}: DatasetSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Read file content
      const text = await file.text();
      
      // Parse CSV (we'll use Pyodide's pandas for this)
      const { pyodideService } = await import('@/lib/services/pyodideService');
      
      if (!pyodideService.isReady()) {
        await pyodideService.loadPyodide();
      }

      // Store the CSV content in Pyodide's virtual file system
      await pyodideService.writeFile(file.name, text);
      
      // Parse and get summary using pandas
      const summary = await pyodideService.getDatasetSummary(file.name);
      
      onDatasetUpload(file.name, text, summary);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this dataset?')) {
      onDatasetRemove();
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText size={16} />
          Dataset
        </h3>
      </div>

      {!dataset ? (
        <div className="text-center py-8">
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV or Excel file to begin analysis
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-left">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-blue-600" />
              <div>
                <p className="font-medium text-sm text-gray-900">{dataset.filename}</p>
                {dataset.summary && (
                  <p className="text-xs text-gray-500">
                    {dataset.summary.rows} rows × {dataset.summary.columns} columns
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleRemove}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X size={16} />
            </Button>
          </div>

          {dataset.summary && (
            <div className="p-3 bg-white rounded border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Dataset Summary</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p>• Rows: {dataset.summary.rows}</p>
                <p>• Columns: {dataset.summary.columns}</p>
                <p>• Column Names: {dataset.summary.columnNames.join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}