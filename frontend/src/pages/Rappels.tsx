import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Plus, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { mockReminders } from '../data/mockData';
import { toast } from 'sonner';

export const Rappels: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const handleMarkAsDone = (id: string) => {
    toast.success('Reminder marked as completed!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rappels (Reminders)</h1>
          <p className="text-muted-foreground">Manage your tasks and reminders</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex border border-border rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''} rounded-l-lg`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : ''} rounded-r-lg`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Pending</h2>
            <div className="space-y-4">
              {mockReminders.filter(r => r.status === 'Pending').map((reminder) => (
                <Card key={reminder.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{reminder.title}</h3>
                          <Badge variant={
                            reminder.priority === 'High' ? 'danger' :
                            reminder.priority === 'Medium' ? 'warning' : 'info'
                          }>
                            {reminder.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{reminder.dueDate}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsDone(reminder.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Done
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Completed</h2>
            <div className="space-y-4">
              {mockReminders.filter(r => r.status === 'Completed').map((reminder) => (
                <Card key={reminder.id} className="opacity-60">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold line-through">{reminder.title}</h3>
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-3 border-t border-border">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{reminder.dueDate}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <div className="p-6">
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
              <p className="text-muted-foreground mb-6">
                Calendar view would be integrated here with a calendar library
              </p>
              <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm p-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square border border-border rounded-lg p-2 text-sm hover:bg-accent cursor-pointer"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
