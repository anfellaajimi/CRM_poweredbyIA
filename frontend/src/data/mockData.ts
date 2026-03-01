export const  mockClients  = [
  {
    id: '1',
    type: 'Moral', // ✅ ajoute ça
    nom: 'Acme Corporation',
    email: 'contact@acme.com',
    téléphone: '+1 (555) 123-4567',
    entreprise: 'Acme Corporation',
    statut: 'Actif',
    crééLe: '2024-01-15',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    type: 'Moral',
    nom: 'TechStart Inc',
    email: 'hello@techstart.io',
    téléphone: '+1 (555) 234-5678',
    entreprise: 'TechStart Inc',
    statut: 'Actif',
    crééLe: '2024-02-20',
    avatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    type: 'Moral',
    nom: 'Global Solutions',
    email: 'info@globalsolutions.com',
    téléphone: '+1 (555) 345-6789',
    entreprise: 'Global Solutions',
    statut: 'Inactif',
    crééLe: '2024-03-10',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop'
  },
  {
    id: '4',
    type: 'Moral',
    nom: 'Digital Agency Pro',
    email: 'team@digitalagency.com',
    téléphone: '+1 (555) 456-7890',
    entreprise: 'Digital Agency Pro',
    statut: 'Actif',
    crééLe: '2024-04-05',
    avatar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop'
  }
];

export const mockProjects = [
  {
    id: '1',
    nom: 'Refonte du Site Web',
    clientId: '1',
    nomClient: 'Acme Corporation',
    statut: 'En cours',
    priorité: 'Haute',
    budget: 50000,
    dépensé: 30000,
    progression: 60,
    dateDébut: '2024-01-15',
    dateLimite: '2024-06-30',
    équipeAssignée: ['John Doe', 'Jane Smith'],
    description: 'Refonte complète du site web de l\'entreprise avec une interface moderne'
  },
  {
    id: '2',
    nom: 'Développement Application Mobile',
    clientId: '2',
    nomClient: 'TechStart Inc',
    statut: 'Planification',
    priorité: 'Moyenne',
    budget: 80000,
    dépensé: 5000,
    progression: 10,
    dateDébut: '2024-03-01',
    dateLimite: '2024-12-31',
    équipeAssignée: ['Mike Johnson'],
    description: 'Développement d\'une application mobile native iOS et Android'
  },
  {
    id: '3',
    nom: 'Plateforme E-commerce',
    clientId: '4',
    nomClient: 'Digital Agency Pro',
    statut: 'Terminé',
    priorité: 'Haute',
    budget: 120000,
    dépensé: 115000,
    progression: 100,
    dateDébut: '2023-09-01',
    dateLimite: '2024-03-31',
    équipeAssignée: ['Sarah Connor', 'Tom Hardy'],
    description: 'Plateforme e-commerce complète avec intégration de paiement'
  },
  {
    id: '4',
    nom: 'Intégration CRM',
    clientId: '1',
    nomClient: 'Acme Corporation',
    statut: 'En attente',
    priorité: 'Basse',
    budget: 25000,
    dépensé: 0,
    progression: 0,
    dateDébut: '2024-05-01',
    dateLimite: '2024-08-31',
    équipeAssignée: [],
    description: 'Intégration avec le système CRM existant'
  }
];

export const mockDevis = [
  {
    id: 'DEV-2024-001',
    clientId: '1',
    nomClient: 'Acme Corporation',
    titre: 'Devis Refonte du Site Web',
    montant: 50000,
    statut: 'Accepté',
    crééLe: '2024-01-10',
    valideJusquà: '2024-02-10',
    articles: [
      { description: 'Design UI/UX', quantité: 1, prixUnitaire: 15000 },
      { description: 'Développement Frontend', quantité: 1, prixUnitaire: 20000 },
      { description: 'Développement Backend', quantité: 1, prixUnitaire: 15000 }
    ]
  },
  {
    id: 'DEV-2024-002',
    clientId: '2',
    nomClient: 'TechStart Inc',
    titre: 'Devis Développement Application Mobile',
    montant: 80000,
    statut: 'Envoyé',
    crééLe: '2024-02-15',
    valideJusquà: '2024-03-15',
    articles: [
      { description: 'Développement iOS', quantité: 1, prixUnitaire: 40000 },
      { description: 'Développement Android', quantité: 1, prixUnitaire: 40000 }
    ]
  },
  {
    id: 'DEV-2024-003',
    clientId: '3',
    nomClient: 'Global Solutions',
    titre: 'Services de Conseil',
    montant: 15000,
    statut: 'Brouillon',
    crééLe: '2024-03-01',
    valideJusquà: '2024-04-01',
    articles: [
      { description: 'Conseil Technique', quantité: 10, prixUnitaire: 1500 }
    ]
  },
  {
    id: 'DEV-2024-004',
    clientId: '4',
    nomClient: 'Digital Agency Pro',
    titre: 'Pack Optimisation SEO',
    montant: 12000,
    statut: 'Rejeté',
    crééLe: '2024-03-10',
    valideJusquà: '2024-04-10',
    articles: [
      { description: 'Audit SEO', quantité: 1, prixUnitaire: 3000 },
      { description: 'Optimisation On-page', quantité: 1, prixUnitaire: 5000 },
      { description: 'Netlinking', quantité: 1, prixUnitaire: 4000 }
    ]
  }
];


export const mockFactures = [
  {
    id: 'INV-2024-001',
    clientId: '1',
    nomClient: 'Acme Corporation',
    projetId: '1',
    nomProjet: 'Refonte du Site Web',
    montant: 25000,
    statut: 'Payée',
    émiseLe: '2024-02-01',
    dueLe: '2024-03-01',
    payéeLe: '2024-02-28',
    articles: [
      { description: 'Phase 1 - Design', quantité: 1, prixUnitaire: 25000 }
    ]
  },
  {
    id: 'INV-2024-002',
    clientId: '4',
    nomClient: 'Digital Agency Pro',
    projetId: '3',
    nomProjet: 'Plateforme E-commerce',
    montant: 115000,
    statut: 'Payée',
    émiseLe: '2024-03-15',
    dueLe: '2024-04-15',
    payéeLe: '2024-04-10',
    articles: [
      { description: 'Projet complet terminé', quantité: 1, prixUnitaire: 115000 }
    ]
  },
  {
    id: 'INV-2024-003',
    clientId: '1',
    nomClient: 'Acme Corporation',
    projetId: '1',
    nomProjet: 'Refonte du Site Web',
    montant: 20000,
    statut: 'Impayée',
    émiseLe: '2024-04-01',
    dueLe: '2024-05-01',
    articles: [
      { description: 'Phase 2 - Développement', quantité: 1, prixUnitaire: 20000 }
    ]
  },
  {
    id: 'INV-2024-004',
    clientId: '2',
    nomClient: 'TechStart Inc',
    projetId: '2',
    nomProjet: 'Développement Application Mobile',
    montant: 10000,
    statut: 'En retard',
    émiseLe: '2024-03-01',
    dueLe: '2024-04-01',
    articles: [
      { description: 'Paiement initial', quantité: 1, prixUnitaire: 10000 }
    ]
  }
];

export const mockContrats = [
  {
    id: 'CON-2024-001',
    clientId: '1',
    clientName: 'Acme Corporation',
    titre: 'Contrat de services de développement web ',
    type: 'Contrat de services',
    status: 'Actif',
    dateDébut: '2024-01-15',
    dateFin: '2024-12-31',
    value: 150000,
    dateRenouvellement: '2024-11-30',
    needsRenewal: false
  },
  {
    id: 'CON-2024-002',
    clientId: '2',
    clientName: 'TechStart Inc',
    titre: 'Contrat Développement Application Mobile',
    type: 'Project Contract',
    status: 'Actif',
    dateDébut: '2024-03-01',
    dateFin: '2024-12-31',
    value: 80000,
    dateRenouvellement: '2024-11-30',
    needsRenewal: false
  },
  {
    id: 'CON-2023-015',
    clientId: '4',
    clientName: 'Digital Agency Pro',
    titre: 'Développement Plateforme E-commerce',
    type: 'Contrat de projet',
    status: 'Terminé',
    dateDébut: '2023-09-01',
    dateFin: '2024-03-31',
    value: 120000,
    dateRenouvellement: null,
    needsRenewal: false
  },
  {
    id: 'CON-2023-008',
    clientId: '3',
    clientName: 'Global Solutions',
    titre: 'Contrat Maintenance Annuelle',
    type: 'Maintenance',
    status: 'Expirant',
    dateDébut: '2023-05-01',
    dateFin: '2024-04-30',
    value: 24000,
    dateRenouvellement: '2024-03-30',
    needsRenewal: true
  }
];

export const mockUsers = [
  {
    id: '1',
    name: 'Mohamed aziz jouni',
    email: 'medazizjouni@crmaipro.com',
    role: 'Admin',
    status: 'Actif',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    rejointLe: '2023-01-15'
  },
  {
    id: '2',
    name: 'Khalil ibrahim',
    email: 'khalil@crmaipro.com',
    role: 'Manager',
    status: 'Actif',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rejointLe: '2023-02-20'
  },
  {
    id: '3',
    name: 'Ahmed ben amor',
    email: 'ahmed@crmaipro.com',
    role: 'Developer',
    status: 'Actif',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rejointLe: '2023-03-10'
  },
   {
    id: '4',
    name: 'Sarra rouissi',
    email: 'sarra@crmaipro.com',
    role: 'Developer',
    status: 'Actif',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rejointLe: '2023-03-10'
  },
  {
    id: '5',
    name: 'imen hammadi',
    email: 'imen@crmaipro.com',
    role: 'Developer',
    status: 'Inactif',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rejointLe: '2023-04-05'
  }
];

export const mockReminders = [
  {
    id: '1',
    title: 'Relancer Acme Corporation ',
    description: 'Discuter des exigences de la phase 3 du projet de refonte du site web',
    dateLimite: '2024-05-15',
    priorité: 'Élevé',
    status: 'En attente',
    liéÀ: 'Client',
    idLié: '1'
  },
  {
    id: '2',
    title: 'Envoyer la facture à TechStart Inc ',
    description: 'Facture de maintenance mensuelle pour le projet de développement d\'application mobile',
    dateLimite: '2024-05-20',
    priorité: 'Moyen',
    status: 'En attente',
    liéÀ: 'Facture',
    idLié: 'INV-2024-005'
  },
  {
    id: '3',
    title: 'Discussion sur le renouvellement du contrat',
    description: 'Discuter du renouvellement du contrat avec Global Solutions',
    dateLimite: '2024-05-10',
    priorité: 'Élevé',
    status: 'Terminé',
    liéÀ: 'Contrat',
    idLié: 'CON-2023-008'
  },
  {
    id: '4',
    title: 'Échéance imminente du projet',
    description: 'Livraison finale de la refonte du site web ',
    dateLimite: '2024-06-30',
    priorité: 'Moyen',
    status: 'En attente',
    liéÀ: 'Project',
    idLié: '1'
  }
];

export const mockAIServices = [
  {
    id: '1',
    name: 'Passerelle API CRM AI Pro',
    status: 'En bon état',
    dernièreVérification: '2024-05-12 14:30:00',
    disponibilité: 99.9,
    tempsRéponse: 45,
    endpoint: 'https://api.crmaipro.com'
  },
  {
    id: '2',
    name: 'Email Service',
    status: 'En bon état',
    dernièreVérification: '2024-05-12 14:29:00',
    disponibilité: 99.8,
    tempsRéponse: 120,
    endpoint: 'https://Email.crmaipro.com'
  },
  {
    id: '3',
    name: 'Passerelle de paiement ',
    status: 'Avertissement',
    dernièreVérification: '2024-05-12 14:25:00',
    disponibilité: 98.5,
    tempsRéponse: 350,
    endpoint: 'https://paiment.crmaipro.com'
  },
  {
    id: '4',
    name: 'Moteur d’analytiques',
    status: 'En bon état',
    dernièreVérification: '2024-05-12 14:30:00',
    disponibilité: 99.95,
    tempsRéponse: 80,
    endpoint: 'https://analytiques.crmaipro.com'
  },
  {
    id: '5',
    name: 'Service de stockage',
    status: 'Critique',
    dernièreVérification: '2024-05-12 14:15:00',
    disponibilité: 95.2,
    tempsRéponse: 850,
    endpoint: 'https://services.crmaipro.com'
  }
];

export const mockActivities = [
  {
    id: '1',
    type: 'Client créé ',
    description: 'Nouveau client "Acme Corporation" ajouté',
    user: 'Ahmed ben amor',
    timestamp: '2024-05-12 10:30:00',
    icon: 'Nouvel utilisateur' // UserPlus
  },
  {
    id: '2',
    type: 'Facture payée',
    description: 'Facture INV-2024-002 marquée comme payée',
    user: 'Khalil ibrahim',
    timestamp: '2024-05-12 09:15:00',
    icon: 'Signe dollar' // DollarSign
  },
  {
    id: '3',
    type: 'Projet mis à jour',
    description: 'Progression du projet "Refonte du site web" actualisée à 60 %',
    user: 'Imen Hammadi',
    timestamp: '2024-05-11 16:45:00',
    icon: 'Malette '
  },
  {
    id: '4',
    type: 'Devis transmis',
    description: 'Devis DEV-2024-002 envoyé à TechStart Inc',
    user: 'Mohamed aziz jouni',
    timestamp: '2024-05-11 14:20:00',
    icon: 'Texte du fichier' // FileText
  },
  {
    id: '5',
    type: 'Contrat signé',
    description: 'Contrat CON-2024-002 signé par le client',
    user: 'System',
    timestamp: '2024-05-10 11:00:00',
    icon: 'Vérification de fichier'
  }
];

export const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Fev', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Avr', revenue: 61000 },
  { month: 'Mai', revenue: 55000 },
  { month: 'Juin', revenue: 67000 }
];

export const projectStatusData = [
  { name: 'En cours', value: 45 },
  { name: 'Planification', value: 20 },
  { name: 'Complété', value: 30 },
  { name: 'En suspens', value: 5 }
];

export const clientGrowthData = [
  { month: 'Jan', clients: 12 },
  { month: 'Fev', clients: 15 },
  { month: 'Mar', clients: 18 },
  { month: 'Avr', clients: 22 },
  { month: 'Mai', clients: 28 },
  { month: 'Juin', clients: 35 }
];
