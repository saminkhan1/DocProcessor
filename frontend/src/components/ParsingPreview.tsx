import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  notes?: string;
  confidence?: number;
  issues?: string[];
}

interface ParsingPreviewProps {
  fileName: string;
  lineItems: LineItem[];
  onContinue: () => void;
  onReparse: () => void;
}

export const ParsingPreview: React.FC<ParsingPreviewProps> = ({
  fileName,
  lineItems,
  onContinue,
  onReparse
}) => {
  const issueCount = lineItems.filter(item => item.issues && item.issues.length > 0).length;
  const successCount = lineItems.length - issueCount;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Parsing Results</h2>
            <p className="text-sm text-muted-foreground">
              Extracted from: <span className="font-medium">{fileName}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-status-success" />
              <span className="text-sm font-medium">{successCount} items</span>
            </div>
            {issueCount > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-status-warning" />
                <span className="text-sm font-medium">{issueCount} with issues</span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-20">Unit</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id} className={item.issues?.length ? "bg-status-warning/5" : ""}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate pr-2" title={item.description}>
                      {item.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.quantity || (
                      <span className="text-status-warning">Missing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.unit || (
                      <span className="text-status-warning">Missing</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="truncate pr-2" title={item.notes}>
                      {item.notes || (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.issues && item.issues.length > 0 ? (
                      <Badge variant="outline" className="text-status-warning border-status-warning">
                        Issues
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-status-success border-status-success">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {issueCount > 0 && (
          <div className="mt-4 p-4 bg-status-warning/10 border border-status-warning/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5" />
              <div>
                <h4 className="font-medium text-status-warning">Parsing Issues Detected</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Some line items are missing quantity or unit information. 
                  You can continue and fix these in the next step, or reparse the file.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onReparse}>
            Re-parse File
          </Button>
          <Button onClick={onContinue} className="flex items-center space-x-2">
            <span>Continue to SKU Matching</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};