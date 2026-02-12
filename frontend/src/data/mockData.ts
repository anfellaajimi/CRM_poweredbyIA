export const mockClients = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    status: 'Active',
    createdAt: '2024-01-15',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    name: 'TechStart Inc',
    email: 'hello@techstart.io',
    phone: '+1 (555) 234-5678',
    company: 'TechStart Inc',
    status: 'Active',
    createdAt: '2024-02-20',
    avatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    name: 'Global Solutions',
    email: 'info@globalsolutions.com',
    phone: '+1 (555) 345-6789',
    company: 'Global Solutions',
    status: 'Inactive',
    createdAt: '2024-03-10',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop'
  },
  {
    id: '4',
    name: 'Digital Agency Pro',
    email: 'team@digitalagency.com',
    phone: '+1 (555) 456-7890',
    company: 'Digital Agency Pro',
    status: 'Active',
    createdAt: '2024-04-05',
    avatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop'
  }
];

export const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    clientId: '1',
    clientName: 'Acme Corporation',
    status: 'In Progress',
    priority: 'High',
    budget: 50000,
    spent: 30000,
    progress: 60,
    startDate: '2024-01-15',
    deadline: '2024-06-30',
    assignedTeam: ['John Doe', 'Jane Smith'],
    description: 'Complete redesign of corporate website with modern UI/UX'
  },
  {
    id: '2',
    name: 'Mobile App Development',
    clientId: '2',
    clientName: 'TechStart Inc',
    status: 'Planning',
    priority: 'Medium',
    budget: 80000,
    spent: 5000,
    progress: 10,
    startDate: '2024-03-01',
    deadline: '2024-12-31',
    assignedTeam: ['Mike Johnson'],
    description: 'Native iOS and Android app development'
  },
  {
    id: '3',
    name: 'E-commerce Platform',
    clientId: '4',
    clientName: 'Digital Agency Pro',
    status: 'Completed',
    priority: 'High',
    budget: 120000,
    spent: 115000,
    progress: 100,
    startDate: '2023-09-01',
    deadline: '2024-03-31',
    assignedTeam: ['Sarah Connor', 'Tom Hardy'],
    description: 'Full-featured e-commerce platform with payment integration'
  },
  {
    id: '4',
    name: 'CRM Integration',
    clientId: '1',
    clientName: 'Acme Corporation',
    status: 'On Hold',
    priority: 'Low',
    budget: 25000,
    spent: 0,
    progress: 0,
    startDate: '2024-05-01',
    deadline: '2024-08-31',
    assignedTeam: [],
    description: 'Integration with existing CRM system'
  }
];

export const mockDevis = [
  {
    id: 'DEV-2024-001',
    clientId: '1',
    clientName: 'Acme Corporation',
    title: 'Website Redesign Quote',
    amount: 50000,
    status: 'Accepted',
    createdAt: '2024-01-10',
    validUntil: '2024-02-10',
    items: [
      { description: 'UI/UX Design', quantity: 1, unitPrice: 15000 },
      { description: 'Frontend Development', quantity: 1, unitPrice: 20000 },
      { description: 'Backend Development', quantity: 1, unitPrice: 15000 }
    ]
  },
  {
    id: 'DEV-2024-002',
    clientId: '2',
    clientName: 'TechStart Inc',
    title: 'Mobile App Development Quote',
    amount: 80000,
    status: 'Sent',
    createdAt: '2024-02-15',
    validUntil: '2024-03-15',
    items: [
      { description: 'iOS Development', quantity: 1, unitPrice: 40000 },
      { description: 'Android Development', quantity: 1, unitPrice: 40000 }
    ]
  },
  {
    id: 'DEV-2024-003',
    clientId: '3',
    clientName: 'Global Solutions',
    title: 'Consulting Services',
    amount: 15000,
    status: 'Draft',
    createdAt: '2024-03-01',
    validUntil: '2024-04-01',
    items: [
      { description: 'Technical Consulting', quantity: 10, unitPrice: 1500 }
    ]
  },
  {
    id: 'DEV-2024-004',
    clientId: '4',
    clientName: 'Digital Agency Pro',
    title: 'SEO Optimization Package',
    amount: 12000,
    status: 'Rejected',
    createdAt: '2024-03-10',
    validUntil: '2024-04-10',
    items: [
      { description: 'SEO Audit', quantity: 1, unitPrice: 3000 },
      { description: 'On-page Optimization', quantity: 1, unitPrice: 5000 },
      { description: 'Link Building', quantity: 1, unitPrice: 4000 }
    ]
  }
];

export const mockFactures = [
  {
    id: 'INV-2024-001',
    clientId: '1',
    clientName: 'Acme Corporation',
    projectId: '1',
    projectName: 'Website Redesign',
    amount: 25000,
    status: 'Paid',
    issuedAt: '2024-02-01',
    dueAt: '2024-03-01',
    paidAt: '2024-02-28',
    items: [
      { description: 'Phase 1 - Design', quantity: 1, unitPrice: 25000 }
    ]
  },
  {
    id: 'INV-2024-002',
    clientId: '4',
    clientName: 'Digital Agency Pro',
    projectId: '3',
    projectName: 'E-commerce Platform',
    amount: 115000,
    status: 'Paid',
    issuedAt: '2024-03-15',
    dueAt: '2024-04-15',
    paidAt: '2024-04-10',
    items: [
      { description: 'Full Project Completion', quantity: 1, unitPrice: 115000 }
    ]
  },
  {
    id: 'INV-2024-003',
    clientId: '1',
    clientName: 'Acme Corporation',
    projectId: '1',
    projectName: 'Website Redesign',
    amount: 20000,
    status: 'Unpaid',
    issuedAt: '2024-04-01',
    dueAt: '2024-05-01',
    items: [
      { description: 'Phase 2 - Development', quantity: 1, unitPrice: 20000 }
    ]
  },
  {
    id: 'INV-2024-004',
    clientId: '2',
    clientName: 'TechStart Inc',
    projectId: '2',
    projectName: 'Mobile App Development',
    amount: 10000,
    status: 'Overdue',
    issuedAt: '2024-03-01',
    dueAt: '2024-04-01',
    items: [
      { description: 'Initial Payment', quantity: 1, unitPrice: 10000 }
    ]
  }
];

export const mockContrats = [
  {
    id: 'CON-2024-001',
    clientId: '1',
    clientName: 'Acme Corporation',
    title: 'Web Development Services Agreement',
    type: 'Service Agreement',
    status: 'Active',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    value: 150000,
    renewalDate: '2024-11-30',
    needsRenewal: false
  },
  {
    id: 'CON-2024-002',
    clientId: '2',
    clientName: 'TechStart Inc',
    title: 'Mobile App Development Contract',
    type: 'Project Contract',
    status: 'Active',
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    value: 80000,
    renewalDate: '2024-11-30',
    needsRenewal: false
  },
  {
    id: 'CON-2023-015',
    clientId: '4',
    clientName: 'Digital Agency Pro',
    title: 'E-commerce Platform Development',
    type: 'Project Contract',
    status: 'Completed',
    startDate: '2023-09-01',
    endDate: '2024-03-31',
    value: 120000,
    renewalDate: null,
    needsRenewal: false
  },
  {
    id: 'CON-2023-008',
    clientId: '3',
    clientName: 'Global Solutions',
    title: 'Annual Maintenance Contract',
    type: 'Maintenance',
    status: 'Expiring',
    startDate: '2023-05-01',
    endDate: '2024-04-30',
    value: 24000,
    renewalDate: '2024-03-30',
    needsRenewal: true
  }
];

export const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@crmaipro.com',
    role: 'Admin',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    joinedAt: '2023-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@crmaipro.com',
    role: 'Manager',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    joinedAt: '2023-02-20'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@crmaipro.com',
    role: 'Developer',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    joinedAt: '2023-03-10'
  },
  {
    id: '4',
    name: 'Sarah Connor',
    email: 'sarah@crmaipro.com',
    role: 'Developer',
    status: 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    joinedAt: '2023-04-05'
  }
];

export const mockReminders = [
  {
    id: '1',
    title: 'Follow up with Acme Corporation',
    description: 'Discuss Phase 3 requirements',
    dueDate: '2024-05-15',
    priority: 'High',
    status: 'Pending',
    relatedTo: 'Client',
    relatedId: '1'
  },
  {
    id: '2',
    title: 'Send invoice to TechStart Inc',
    description: 'Monthly maintenance invoice',
    dueDate: '2024-05-20',
    priority: 'Medium',
    status: 'Pending',
    relatedTo: 'Invoice',
    relatedId: 'INV-2024-005'
  },
  {
    id: '3',
    title: 'Contract renewal discussion',
    description: 'Discuss contract renewal with Global Solutions',
    dueDate: '2024-05-10',
    priority: 'High',
    status: 'Completed',
    relatedTo: 'Contract',
    relatedId: 'CON-2023-008'
  },
  {
    id: '4',
    title: 'Project deadline approaching',
    description: 'Website Redesign final delivery',
    dueDate: '2024-06-30',
    priority: 'Medium',
    status: 'Pending',
    relatedTo: 'Project',
    relatedId: '1'
  }
];

export const mockAIServices = [
  {
    id: '1',
    name: 'API Gateway',
    status: 'Healthy',
    lastCheck: '2024-05-12 14:30:00',
    uptime: 99.9,
    responseTime: 45,
    endpoint: 'https://api.crmaipro.com'
  },
  {
    id: '2',
    name: 'Email Service',
    status: 'Healthy',
    lastCheck: '2024-05-12 14:29:00',
    uptime: 99.8,
    responseTime: 120,
    endpoint: 'https://mail.crmaipro.com'
  },
  {
    id: '3',
    name: 'Payment Gateway',
    status: 'Warning',
    lastCheck: '2024-05-12 14:25:00',
    uptime: 98.5,
    responseTime: 350,
    endpoint: 'https://payments.crmaipro.com'
  },
  {
    id: '4',
    name: 'Analytics Engine',
    status: 'Healthy',
    lastCheck: '2024-05-12 14:30:00',
    uptime: 99.95,
    responseTime: 80,
    endpoint: 'https://analytics.crmaipro.com'
  },
  {
    id: '5',
    name: 'Storage Service',
    status: 'Critical',
    lastCheck: '2024-05-12 14:15:00',
    uptime: 95.2,
    responseTime: 850,
    endpoint: 'https://storage.crmaipro.com'
  }
];

export const mockActivities = [
  {
    id: '1',
    type: 'client_created',
    description: 'New client "Acme Corporation" added',
    user: 'John Doe',
    timestamp: '2024-05-12 10:30:00',
    icon: 'UserPlus'
  },
  {
    id: '2',
    type: 'invoice_paid',
    description: 'Invoice INV-2024-002 marked as paid',
    user: 'Jane Smith',
    timestamp: '2024-05-12 09:15:00',
    icon: 'DollarSign'
  },
  {
    id: '3',
    type: 'project_updated',
    description: 'Project "Website Redesign" progress updated to 60%',
    user: 'Mike Johnson',
    timestamp: '2024-05-11 16:45:00',
    icon: 'Briefcase'
  },
  {
    id: '4',
    type: 'devis_sent',
    description: 'Quote DEV-2024-002 sent to TechStart Inc',
    user: 'John Doe',
    timestamp: '2024-05-11 14:20:00',
    icon: 'FileText'
  },
  {
    id: '5',
    type: 'contract_signed',
    description: 'Contract CON-2024-002 signed by client',
    user: 'System',
    timestamp: '2024-05-10 11:00:00',
    icon: 'FileCheck'
  }
];

export const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 55000 },
  { month: 'Jun', revenue: 67000 }
];

export const projectStatusData = [
  { name: 'In Progress', value: 45 },
  { name: 'Planning', value: 20 },
  { name: 'Completed', value: 30 },
  { name: 'On Hold', value: 5 }
];

export const clientGrowthData = [
  { month: 'Jan', clients: 12 },
  { month: 'Feb', clients: 15 },
  { month: 'Mar', clients: 18 },
  { month: 'Apr', clients: 22 },
  { month: 'May', clients: 28 },
  { month: 'Jun', clients: 35 }
];
