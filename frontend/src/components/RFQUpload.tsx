import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient, convertFromProcessingStatus } from '@/lib/api';
import type { UploadedFile } from '@/types/api';



interface RFQUploadProps {
  onFileProcessed: (fileData: any) => void;
}

export const RFQUpload: React.FC<RFQUploadProps> = ({ onFileProcessed }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file with real API calls
    newFiles.forEach(async (uploadFile) => {
      try {
        // Update progress to show uploading
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: 30 }
              : f
          )
        );

        // Real API call to upload and parse RFQ
        const response = await apiClient.uploadRFQ(uploadFile.file);
        
        if (response.status === 'completed' && response.line_items) {
          // Update progress to show success
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );
          
          toast({
            title: "File uploaded and parsed successfully",
            description: `${uploadFile.file.name} has been processed`,
          });

          // Convert backend response to frontend format
          const parsedData = convertFromProcessingStatus(response);
          onFileProcessed({
            ...parsedData,
            rfq_id: `RFQ-${Date.now()}`, // Generate RFQ ID since backend doesn't return one
          });
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error) {
        console.error('RFQ upload error:', error);
        
        // Update file status to error
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', progress: 0 }
              : f
          )
        );
        
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : `Failed to process ${uploadFile.file.name}`,
          variant: "destructive",
        });
      }
    });
  }, [onFileProcessed, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card 
        {...getRootProps()} 
        className={`
          p-8 border-2 border-dashed cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          {isDragActive ? (
            <div>
              <h3 className="text-lg font-semibold text-primary">Drop your RFQ files here</h3>
              <p className="text-sm text-muted-foreground">Release to upload</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold">Upload RFQ Files</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop PDF, Excel, or CSV files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, XLSX, XLS, CSV
              </p>
            </div>
          )}
          <Button variant="outline" size="sm">
            Choose Files
          </Button>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Uploaded Files</h4>
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-status-success" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};