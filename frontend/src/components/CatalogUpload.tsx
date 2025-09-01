import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import type { CatalogStatus } from '@/types/api';



interface CatalogUploadProps {
  onCatalogUploaded: (success: boolean) => void;
  catalogStatus: CatalogStatus;
  onResetCatalog?: () => void;
}

export const CatalogUpload: React.FC<CatalogUploadProps> = ({ 
  onCatalogUploaded, 
  catalogStatus,
  onResetCatalog
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file containing your product catalog",
        variant: "destructive",
      });
      return;
    }

    onCatalogUploaded(false); // Set to uploading state
    
    try {
      // Real API call to upload catalog
      const response = await apiClient.uploadCatalog(file);
      
      if (response.status === 'success') {
        toast({
          title: "Catalog uploaded successfully",
          description: `${file.name} has been processed and indexed for SKU matching`,
        });
        onCatalogUploaded(true);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Catalog upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your catalog. Please try again.",
        variant: "destructive",
      });
      onCatalogUploaded(false);
    }
  }, [onCatalogUploaded, toast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: catalogStatus === 'uploading'
  });

  const getStatusIcon = () => {
    switch (catalogStatus) {
      case 'uploading':
        return <Loader2 className="w-6 h-6 animate-spin text-status-info" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-status-success" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-status-error" />;
      default:
        return <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (catalogStatus) {
      case 'uploading':
        return 'Processing catalog...';
      case 'success':
        return 'Catalog ready for SKU matching';
      case 'error':
        return 'Catalog upload failed';
      default:
        return 'Upload product catalog (CSV)';
    }
  };

  const getStatusBadge = () => {
    switch (catalogStatus) {
      case 'uploading':
        return <Badge variant="secondary">Processing</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-status-success text-status-success-foreground">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Required</Badge>;
    }
  };

  if (catalogStatus === 'success' as const) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-status-success" />
            <div>
              <h3 className="font-semibold">Catalog Ready</h3>
              <p className="text-sm text-muted-foreground">
                Your product catalog is indexed and ready for SKU matching
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="default" className="bg-status-success text-status-success-foreground">
              Active
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onResetCatalog}
            >
              Change Catalog
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold">Product Catalog Setup</h3>
            <p className="text-sm text-muted-foreground">
              {getStatusText()}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {catalogStatus !== 'success' as CatalogStatus && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
            ${catalogStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              {catalogStatus === 'uploading' ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium mb-2">
                {catalogStatus === 'uploading' 
                  ? 'Processing your catalog...' 
                  : 'Upload Product Catalog'
                }
              </p>
              {catalogStatus !== 'uploading' && (
                <>
                  <p className="text-muted-foreground mb-2">
                    Drop your CSV catalog file here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Required columns: SKU, Name, Description, Price
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {catalogStatus === 'error' && (
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={() => onCatalogUploaded(false)} 
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}
    </Card>
  );
};