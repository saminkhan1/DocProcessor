import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Download, Edit, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient, convertToEnrichedRFQ, downloadBlob } from '@/lib/api';
import type { MatchedItem } from '@/types/api';



interface SKUMatchingProps {
  fileName: string;
  matchedItems: MatchedItem[];
  onExport: () => void;
  rfqId?: string;
}

export const SKUMatching: React.FC<SKUMatchingProps> = ({
  fileName,
  matchedItems: initialItems,
  onExport,
  rfqId
}) => {
  const [items, setItems] = useState<MatchedItem[]>(initialItems);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge className="bg-confidence-high/10 text-confidence-high border-confidence-high/20">
          High ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge className="bg-confidence-medium/10 text-confidence-medium border-confidence-medium/20">
          Medium ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-confidence-low/10 text-confidence-low border-confidence-low/20">
          Low ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'high') return item.confidence >= 0.8;
    if (filter === 'medium') return item.confidence >= 0.5 && item.confidence < 0.8;
    if (filter === 'low') return item.confidence < 0.5;
    return true;
  });

  const approveAll = (threshold: number) => {
    const approvedCount = items.filter(item => item.confidence >= threshold).length;
    toast({
      title: "Bulk approval completed",
      description: `${approvedCount} matches approved automatically`,
    });
  };

  const updateItem = (id: number, updates: Partial<MatchedItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    setEditingId(null);
  };

  const handleExport = async () => {
    if (!rfqId) {
      toast({
        title: "Export failed",
        description: "Missing RFQ ID for export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Convert frontend matched items to backend enriched RFQ format
      const enrichedRFQ = convertToEnrichedRFQ(items, rfqId);
      
      // Real API call to export CSV
      const csvBlob = await apiClient.exportCSV(enrichedRFQ);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const csvFileName = `rfq_export_${fileName.replace(/\.[^/.]+$/, '')}_${timestamp}.csv`;
      
      // Download the CSV file
      downloadBlob(csvBlob, csvFileName);
      
      toast({
        title: "Export successful",
        description: `Downloaded ${csvFileName}`,
      });
      
      // Call the parent's onExport callback
      onExport();
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error exporting the CSV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const stats = {
    total: items.length,
    high: items.filter(i => i.confidence >= 0.8).length,
    medium: items.filter(i => i.confidence >= 0.5 && i.confidence < 0.8).length,
    low: items.filter(i => i.confidence < 0.5).length
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">SKU Matching Review</h2>
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium">{fileName}</span> • {stats.total} items
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <div className="text-confidence-high">{stats.high} high confidence</div>
              <div className="text-confidence-medium">{stats.medium} medium confidence</div>
              <div className="text-confidence-low">{stats.low} low confidence</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="high">High Confidence</SelectItem>
                  <SelectItem value="medium">Medium Confidence</SelectItem>
                  <SelectItem value="low">Low Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => approveAll(0.8)}
            >
              Approve All High Confidence
            </Button>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="flex items-center space-x-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Original Description</TableHead>
                <TableHead>Suggested SKU</TableHead>
                <TableHead>Standard Name</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-24">Price</TableHead>
                <TableHead className="w-32">Confidence</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate pr-2" title={item.originalDescription}>
                      {item.originalDescription}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        defaultValue={item.suggestedSKU}
                        className="h-8"
                        onBlur={(e) => updateItem(item.id, { suggestedSKU: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateItem(item.id, { suggestedSKU: e.currentTarget.value });
                          }
                        }}
                      />
                    ) : (
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {item.suggestedSKU}
                      </code>
                    )}
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate pr-2" title={item.suggestedName}>
                      {item.suggestedName}
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>
                    {item.price ? `$${item.price.toFixed(2)}` : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getConfidenceBadge(item.confidence)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {item.confidence >= 0.8 && (
                        <Check className="w-4 h-4 text-confidence-high" />
                      )}
                      {item.confidence < 0.5 && (
                        <AlertTriangle className="w-4 h-4 text-confidence-low" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {stats.low > 0 && (
          <div className="mt-4 p-4 bg-status-warning/10 border border-status-warning/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5" />
              <div>
                <h4 className="font-medium text-status-warning">Low Confidence Matches</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.low} items have low confidence matches. Review these carefully before exporting.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};