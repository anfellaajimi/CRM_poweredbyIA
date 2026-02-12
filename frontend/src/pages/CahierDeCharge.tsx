import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Plus, Upload, Download, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const CahierDeCharge: React.FC = () => {
  const [content, setContent] = useState('');

  const versions = [
    { id: 1, version: '1.2', date: '2024-05-10', author: 'John Doe' },
    { id: 2, version: '1.1', date: '2024-04-15', author: 'Jane Smith' },
    { id: 3, version: '1.0', date: '2024-03-01', author: 'John Doe' }
  ];

  const handleSave = () => {
    toast.success('Document saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cahier de Charge</h1>
          <p className="text-muted-foreground">Project specifications and requirements</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Document Editor</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge>v1.2</Badge>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 p-4 rounded-lg border border-input bg-input-background resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                placeholder="Write your project specifications here...

# Project Overview
## Objectives
## Functional Requirements
## Technical Requirements
## Timeline
## Deliverables"
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Last saved: Today at 14:30
                </p>
                <Button onClick={handleSave}>Save Document</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drag and drop files here or click to browse
                </p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Version {version.version}</span>
                      {version.id === 1 && <Badge variant="success">Current</Badge>}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{version.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      By {version.author}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download as Word
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Import Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
