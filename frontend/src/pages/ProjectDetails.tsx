import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { ArrowLeft, Upload } from 'lucide-react';
import { mockProjects } from '../data/mockData';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find(p => p.id === id);

  if (!project) {
    return <div>Project not found</div>;
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{project.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={
                  project.status === 'Completed' ? 'success' :
                  project.status === 'In Progress' ? 'info' : 'warning'
                }>
                  {project.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge variant={
                  project.priority === 'High' ? 'danger' :
                  project.priority === 'Medium' ? 'warning' : 'info'
                }>
                  {project.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{project.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline & Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{project.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{project.deadline}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">${project.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="font-medium">${project.spent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'team',
      label: 'Team',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.assignedTeam.map((member, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-medium">{member[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{member}</p>
                    <p className="text-sm text-muted-foreground">Team Member</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'cahier',
      label: 'Cahier de Charge',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Project Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-medium mb-2">Version 1.0</h4>
                <p className="text-sm text-muted-foreground mb-4">Created on {project.startDate}</p>
                <div className="prose prose-sm max-w-none">
                  <p>Project specifications and requirements will be detailed here...</p>
                </div>
              </div>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Version
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'files',
      label: 'Files',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Project Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Drag and drop files here or click to browse</p>
              <Button variant="outline">Upload Files</Button>
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.clientName}</p>
        </div>
        <Button>Edit Project</Button>
      </div>

      <Tabs tabs={tabs} defaultTab="overview" />
    </div>
  );
};
