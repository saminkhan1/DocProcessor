import React, { useState } from 'react';
import { RFQUpload } from '@/components/RFQUpload';
import { ParsingPreview } from '@/components/ParsingPreview';
import { SKUMatching } from '@/components/SKUMatching';
import { ProgressSteps } from '@/components/ProgressSteps';
import { CatalogUpload } from '@/components/CatalogUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Zap, Shield, Clock, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, convertToRFQLineItems, convertFromMatchingResult } from '@/lib/api';
import type { CatalogStatus } from '@/types/api';

const steps = [
  { id: 1, title: 'Upload', description: 'Upload RFQ files' },
  { id: 2, title: 'Parse', description: 'Extract line items' },
  { id: 3, title: 'Match', description: 'Review SKU matches' },
  { id: 4, title: 'Export', description: 'Download results' }
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [parsedData, setParsedData] = useState<any>(null);
  const [matchedData, setMatchedData] = useState<any>(null);
  const [mode, setMode] = useState<'upload' | 'pending'>('upload');
  const [pendingRFQs, setPendingRFQs] = useState<any[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('none');
  const [isMatching, setIsMatching] = useState(false);
  const { toast } = useToast();

  const handleFileProcessed = (data: any) => {
    setParsedData(data);
    setCurrentStep(2);
    
    // Automatically trigger SKU matching after parsing
    handleSKUMatching(data);
  };

  const handleSKUMatching = async (data: any) => {
    if (!data.rfq_id || !data.lineItems) {
      toast({
        title: "Matching failed",
        description: "Missing required data for SKU matching",
        variant: "destructive",
      });
      return;
    }

    setIsMatching(true);
    
    try {
      // Convert frontend line items to backend format
      const rfqLineItems = convertToRFQLineItems(data.lineItems, data.rfq_id);
      
      // Real API call to match SKUs - backend expects RFQOutput format
      const response = await apiClient.matchSKUs({
        line_items: rfqLineItems,
      });
      
      if (response.status === 'completed' && response.enriched_data) {
        // Convert backend response to frontend format
        const matchedData = convertFromMatchingResult(response);
        setMatchedData(matchedData);
        
        toast({
          title: "SKU matching completed",
          description: `Found matches for ${response.enriched_data.line_items.length} items`,
        });
      } else {
        throw new Error(response.message || 'SKU matching failed');
      }
    } catch (error) {
      console.error('SKU matching error:', error);
      toast({
        title: "SKU matching failed",
        description: error instanceof Error ? error.message : "There was an error matching SKUs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleContinueToMatching = () => {
    setCurrentStep(3);
  };

  const handleExport = () => {
    setCurrentStep(4);
    toast({
      title: "Export successful",
      description: "RFQ data has been exported to CSV format",
    });
    
    // Reset to allow new uploads
    setTimeout(() => {
      setCurrentStep(1);
      setParsedData(null);
      setMatchedData(null);
    }, 2000);
  };

  const handleReparse = () => {
    toast({
      title: "Re-parsing file",
      description: "Attempting to extract data with different settings",
    });
  };

  const startOver = () => {
    setCurrentStep(1);
    setParsedData(null);
    setMatchedData(null);
    setMode('upload');
  };

  const handleCatalogUploaded = (success: boolean) => {
    if (success) {
      setCatalogStatus('success');
    } else if (catalogStatus === 'none' || catalogStatus === 'success') {
      setCatalogStatus('uploading');
    } else {
      setCatalogStatus('error');
    }
  };

  // Simulate API-received RFQs
  React.useEffect(() => {
    const mockPendingRFQs = [
      {
        id: '1',
        fileName: 'ACME_Construction_RFQ_2025.pdf',
        receivedAt: new Date().toISOString(),
        source: 'email',
        lineItems: [
          { id: 1, description: '2" PVC Pipe, Schedule 40', quantity: 100, unit: 'ft' },
          { id: 2, description: '90° PVC Elbow, 2"', quantity: 12, unit: 'pcs' },
          { id: 3, description: 'PVC Coupling, 2"', quantity: 8, unit: 'pcs' }
        ]
      },
      {
        id: '2',
        fileName: 'Metro_HVAC_Quote_Request.xlsx',
        receivedAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'email',
        lineItems: [
          { id: 1, description: 'HVAC Duct, 12" x 8"', quantity: 50, unit: 'ft' },
          { id: 2, description: 'Damper, Manual Volume', quantity: 4, unit: 'pcs' }
        ]
      }
    ];
    setPendingRFQs(mockPendingRFQs);
  }, []);

  const handleSelectPendingRFQ = (rfq: any) => {
    // Add a synthetic rfq_id for pending RFQs
    const rfqWithId = {
      ...rfq,
      rfq_id: rfq.id || `pending-${rfq.fileName}-${Date.now()}`,
    };
    
    setParsedData(rfqWithId);
    setCurrentStep(2);
    
    // Trigger real SKU matching for pending RFQ
    handleSKUMatching(rfqWithId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-enterprise-blue to-enterprise-blue-light bg-clip-text text-transparent">
            RFQ Automation Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform RFQ processing from hours to minutes with AI-powered line item extraction and SKU matching
          </p>
        </div>

        {/* Catalog Setup */}
        <div className="mb-8">
          <CatalogUpload 
            catalogStatus={catalogStatus}
            onCatalogUploaded={handleCatalogUploaded}
            onResetCatalog={() => setCatalogStatus('none')}
          />
        </div>

        {/* Catalog requirement notice */}
        {catalogStatus !== 'success' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-status-warning/10 text-status-warning rounded-lg">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">
                Upload your product catalog first to enable RFQ processing
              </span>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        {currentStep === 1 && !parsedData && catalogStatus === 'success' && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-border bg-background p-1">
              <Button
                variant={mode === 'upload' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('upload')}
                className="px-6"
              >
                Upload RFQ
              </Button>
              <Button
                variant={mode === 'pending' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('pending')}
                className="px-6"
                disabled={true}
              >
                Review Pending ({pendingRFQs.length})
              </Button>
            </div>
          </div>
        )}

        {/* Features Banner */}
        {currentStep === 1 && !parsedData && mode === 'upload' && catalogStatus === 'success' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-status-info/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-status-info" />
              </div>
              <h3 className="font-semibold mb-2">5x Faster Processing</h3>
              <p className="text-sm text-muted-foreground">
                Process 50-line RFQs in under 5 minutes instead of hours
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-confidence-high/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-confidence-high" />
              </div>
              <h3 className="font-semibold mb-2">80%+ Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                High confidence SKU matching with transparent scoring
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-status-warning/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-status-warning" />
              </div>
              <h3 className="font-semibold mb-2">Instant Export</h3>
              <p className="text-sm text-muted-foreground">
                One-click CSV export ready for your ERP system
              </p>
            </Card>
          </div>
        )}

        {/* Progress Steps */}
        {catalogStatus === 'success' && (
          <ProgressSteps currentStep={currentStep} steps={steps} />
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {currentStep === 1 && mode === 'upload' && catalogStatus === 'success' && (
            <RFQUpload onFileProcessed={handleFileProcessed} />
          )}

          {currentStep === 1 && mode === 'pending' && catalogStatus === 'success' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pending RFQs from API</h2>
              <div className="space-y-4">
                {pendingRFQs.map((rfq) => (
                  <div key={rfq.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div>
                      <h3 className="font-medium">{rfq.fileName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Received {new Date(rfq.receivedAt).toLocaleDateString()} • {rfq.lineItems.length} items • From {rfq.source}
                      </p>
                    </div>
                    <Button onClick={() => handleSelectPendingRFQ(rfq)}>
                      Review & Match
                    </Button>
                  </div>
                ))}
                {pendingRFQs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending RFQs from API
                  </div>
                )}
              </div>
            </Card>
          )}

          {currentStep === 2 && parsedData && (
            <>
              <ParsingPreview
                fileName={parsedData.fileName}
                lineItems={parsedData.lineItems}
                onContinue={handleContinueToMatching}
                onReparse={handleReparse}
              />
              
              {/* SKU Matching Loading State */}
              {isMatching && (
                <Card className="p-6 mt-6">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Matching SKUs with catalog...</span>
                  </div>
                </Card>
              )}
            </>
          )}

          {currentStep === 3 && matchedData && (
            <SKUMatching
              fileName={matchedData.fileName}
              matchedItems={matchedData.matchedItems}
              onExport={handleExport}
              rfqId={parsedData?.rfq_id}
            />
          )}

          {currentStep === 4 && (
            <Card className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-status-success" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Export Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Your enriched RFQ data has been successfully exported and is ready for use.
              </p>
              <Button onClick={startOver} size="lg">
                Process Another RFQ
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;