import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LayoutGrid, List } from 'lucide-react';
import { mockProjects } from '../data/mockData';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  const projectsByStatus = {
    'Planning': mockProjects.filter(p => p.status === 'Planning'),
    'In Progress': mockProjects.filter(p => p.status === 'In Progress'),
    'Completed': mockProjects.filter(p => p.status === 'Completed'),
    'On Hold': mockProjects.filter(p => p.status === 'On Hold')
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage and track your projects</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border border-border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''} rounded-l-lg`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : ''} rounded-r-lg`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button>Add Project</Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/projects/${project.id}`)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.clientName}</p>
                  </div>
                  <Badge variant={
                    project.status === 'Completed' ? 'success' :
                    project.status === 'In Progress' ? 'info' :
                    project.status === 'On Hold' ? 'danger' : 'warning'
                  }>
                    {project.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-medium">${project.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{project.deadline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(projectsByStatus).map(([status, projects]) => (
            <div key={status}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{status}</h3>
                <Badge>{projects.length}</Badge>
              </div>
              <div className="space-y-3">
                {projects.map((project) => (
                  <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/projects/${project.id}`)}>
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">{project.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{project.clientName}</p>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant={project.priority === 'High' ? 'danger' : project.priority === 'Medium' ? 'warning' : 'info'}>
                          {project.priority}
                        </Badge>
                        <span className="text-muted-foreground">{project.progress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
