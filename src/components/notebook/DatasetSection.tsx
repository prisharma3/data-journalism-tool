'use client';

import { useState, useCallback } from 'react';
import { Upload, Database, FileText, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { Dataset } from '@/types';

interface DatasetSectionProps {
  projectId: string;
  isActive: boolean;
}

export function DatasetSection({ projectId, isActive }: DatasetSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { datasets, addDataset, removeDataset } = useProjectStore();
  const currentDataset = datasets.find(d => d.projectId === projectId);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setIsUploading(true);

    try {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      
      // Sample first few rows for preview
      const sampleData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Create dataset object
      const newDataset: Dataset = {
        id: `dataset-${Date.now()}`,
        projectId,
        fileName: file.name,
        fileSize: file.size,
        columns: headers,
        rowCount: lines.length - 1, // Exclude header
        filePath: `/uploads/${file.name}`, // In real app, this would be Cloud Storage URL
        aiSummary: `Dataset contains ${lines.length - 1} rows and ${headers.length} columns. Columns include: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}.`,
        uploadedAt: new Date().toISOString(),
      };

      // Add to store
      addDataset(newDataset);

      // TODO: In real implementation, upload to Google Cloud Storage
      console.log('Dataset uploaded:', newDataset);
      console.log('Sample data:', sampleData);

    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing file. Please check the file format.');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, addDataset]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle delete dataset
  const handleDeleteDataset = () => {
    if (currentDataset && confirm('Are you sure you want to delete this dataset?')) {
      removeDataset(currentDataset.id);
    }
  };

  return (
    <Card 
      className={`
        transition-all duration-200 border-l-4 border-l-gray-400
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{ backgroundColor: '#FAFAFA' }}
    >
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-gray-600" />
          <span>Dataset</span>
          {currentDataset && (
            <Badge variant="secondary" className="ml-auto">
              {currentDataset.rowCount.toLocaleString()} rows
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Upload your dataset to begin analysis (CSV, Excel files supported)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!currentDataset ? (
          // Upload Area
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-900">
                {isUploading ? 'Uploading...' : 'Upload Dataset'}
              </div>
              <div className="text-sm text-gray-500">
                Drag and drop your file here, or click to browse
              </div>
              <div className="text-xs text-gray-400">
                Supports CSV, Excel (.xlsx, .xls) files
              </div>
            </div>
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            
            <Button
              className="mt-4"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Processing...' : 'Choose File'}
            </Button>
          </div>
        ) : (
          // Dataset Info
          <div className="space-y-4">
            {/* Dataset Summary */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900">{currentDataset.fileName}</div>
                  <div className="text-sm text-gray-500">
                    {(currentDataset.fileSize / 1024).toFixed(1)} KB • 
                    Uploaded {new Date(currentDataset.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {showPreview ? 'Hide' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteDataset}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-blue-50 p-3 rounded border-l-4 border-l-blue-400">
                <div className="text-sm font-medium text-blue-900 mb-1">AI Summary</div>
                <div className="text-sm text-blue-800">{currentDataset.aiSummary}</div>
              </div>
            </div>

            {/* Column Info */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Columns ({currentDataset.columns.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {currentDataset.columns.map((column, index) => (
                  <div 
                    key={index}
                    className="text-xs bg-gray-100 px-2 py-1 rounded truncate"
                    title={column}
                  >
                    {column}
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            {showPreview && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Data Preview</h4>
                <div className="text-sm text-gray-600 mb-2">
                  First 5 rows of your dataset:
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {currentDataset.columns.slice(0, 6).map((column, index) => (
                          <th key={index} className="px-2 py-1 text-left font-medium text-gray-900 border">
                            {column}
                          </th>
                        ))}
                        {currentDataset.columns.length > 6 && (
                          <th className="px-2 py-1 text-left font-medium text-gray-500 border">
                            +{currentDataset.columns.length - 6} more...
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sample data would be displayed here */}
                      <tr>
                        <td colSpan={Math.min(currentDataset.columns.length, 7)} className="px-2 py-4 text-center text-gray-500 border">
                          Data preview will be implemented with real file parsing
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}