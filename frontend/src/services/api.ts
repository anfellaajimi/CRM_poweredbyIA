import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export type UIClient = {
  id: string;
  type: 'Physique' | 'Moral';
  name: string;
  prenom?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  createdAt: string;
  avatar?: string;
  cin?: string;
  dateNaissance?: string;
  raisonSociale?: string;
  matriculeFiscale?: string;
  secteurActivite?: string;
};

export type UIProject = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: string;
  priority: string;
  budget: number;
  spent: number;
  progress: number;
  startDate?: string;
  deadline?: string;
  description?: string;
  assignedTeam: string[];
};

const toUIClient = (item: any): UIClient => ({
  id: String(item.id),
  type: (item.typeClient || '').toLowerCase() === 'physique' ? 'Physique' : 'Moral',
  name: item.nom || '',
  prenom: item.prenom || '',
  email: item.email || '',
  phone: item.tel || '',
  company: item.entreprise || item.raisonSociale || item.nom || '',
  status: item.status || 'actif',
  createdAt: item.dateCreation ? String(item.dateCreation).slice(0, 10) : '',
  avatar: item.avatarUrl || '',
  cin: item.cin || '',
  dateNaissance: item.dateNaissance || '',
  raisonSociale: item.raisonSociale || '',
  matriculeFiscale: item.matriculeFiscale || '',
  secteurActivite: item.secteurActivite || '',
});

const toClientPayload = (client: Partial<UIClient>) => ({
  typeClient: client.type === 'Physique' ? 'physique' : 'moral',
  nom: client.name,
  prenom: client.prenom || null,
  email: client.email || null,
  tel: client.phone || null,
  adresse: null,
  dateNaissance: client.dateNaissance || null,
  cin: client.cin || null,
  raisonSociale: client.raisonSociale || null,
  matriculeFiscale: client.matriculeFiscale || null,
  secteurActivite: client.secteurActivite || null,
  entreprise: client.company || null,
  avatarUrl: client.avatar || null,
  status: client.status?.toLowerCase() || 'actif',
});

const toUIProject = (item: any): UIProject => ({
  id: String(item.id),
  name: item.nomProjet || '',
  clientId: String(item.clientID),
  clientName: item.clientNom || '',
  status: item.status || 'en_cours',
  priority: item.priorite || 'moyenne',
  budget: Number(item.budget || 0),
  spent: Number(item.depense || 0),
  progress: Number(item.progression || 0),
  startDate: item.dateDebut || '',
  deadline: item.dateFin || '',
  description: item.description || '',
  assignedTeam: item.assignedUsers || [],
});

const toProjectPayload = (project: Partial<UIProject>) => ({
  clientID: Number(project.clientId),
  nomProjet: project.name,
  description: project.description || null,
  status: project.status || 'en_cours',
  priorite: project.priority || 'moyenne',
  budget: project.budget ?? 0,
  depense: project.spent ?? 0,
  progression: project.progress ?? 0,
  dateDebut: project.startDate || null,
  dateFin: project.deadline || null,
});

export const authAPI = {
  login: (email: string, motDePasse: string) => api.post('/auth/login', { email, motDePasse }),
  register: (payload: { nom: string; email: string; motDePasse: string; role: string }) =>
    api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
};

export const clientsAPI = {
  getAll: async (): Promise<UIClient[]> => {
    const { data } = await api.get('/clients');
    return data.map(toUIClient);
  },
  getById: async (id: string): Promise<UIClient> => {
    const { data } = await api.get(`/clients/${id}`);
    return toUIClient(data);
  },
  create: async (client: Partial<UIClient>): Promise<UIClient> => {
    const { data } = await api.post('/clients', toClientPayload(client));
    return toUIClient(data);
  },
  update: async (id: string, client: Partial<UIClient>): Promise<UIClient> => {
    const { data } = await api.put(`/clients/${id}`, toClientPayload(client));
    return toUIClient(data);
  },
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const projectsAPI = {
  getAll: async (): Promise<UIProject[]> => {
    const { data } = await api.get('/projets');
    return data.map(toUIProject);
  },
  getById: async (id: string): Promise<UIProject> => {
    const { data } = await api.get(`/projets/${id}`);
    return toUIProject(data);
  },
  create: async (project: Partial<UIProject>): Promise<UIProject> => {
    const { data } = await api.post('/projets', toProjectPayload(project));
    return toUIProject(data);
  },
  update: async (id: string, project: Partial<UIProject>): Promise<UIProject> => {
    const { data } = await api.put(`/projets/${id}`, toProjectPayload(project));
    return toUIProject(data);
  },
  delete: (id: string) => api.delete(`/projets/${id}`),
};

export const projectTeamAPI = {
  get: async (projectId: string) => (await api.get(`/projets/${projectId}/team`)).data,
  add: async (projectId: string, userId: number) => (await api.post(`/projets/${projectId}/team/${userId}`)).data,
  remove: async (projectId: string, userId: number) => (await api.delete(`/projets/${projectId}/team/${userId}`)).data,
};

export const projectNotesAPI = {
  get: async (projectId: string) => (await api.get(`/projets/${projectId}/notes`)).data,
  create: async (projectId: string, contenu: string) => (await api.post(`/projets/${projectId}/notes`, { contenu })).data,
  delete: async (projectId: string, noteId: number) => api.delete(`/projets/${projectId}/notes/${noteId}`),
};

export const projectFilesAPI = {
  get: async (projectId: string) => (await api.get(`/projets/${projectId}/files`)).data,
  upload: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (
      await api.post(`/projets/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },
  delete: async (projectId: string, fileId: number) => api.delete(`/projets/${projectId}/files/${fileId}`),
  downloadUrl: (projectId: string, fileId: number) => `${api.defaults.baseURL}/projets/${projectId}/files/${fileId}/download`,
};

export const projectCahierAPI = {
  get: async (projectId: string) => (await api.get(`/projets/${projectId}/cahier`)).data,
  upsert: async (projectId: string, payload: any) => (await api.put(`/projets/${projectId}/cahier`, payload)).data,
};

export type UIRappel = {
  id: number;
  clientID: number;
  titre: string;
  typeRappel?: string;
  description?: string;
  dateLimite?: string;
  statut: string;
  priorite: string;
  createdAt?: string;
};

export type UICahier = {
  cahierID: number;
  projetID: number;
  objet: string;
  description?: string;
  dateCreation?: string;
  dateValidation?: string;
  fileUrl?: string;
  version: string;
  objectif?: string;
  perimetre?: string;
  fonctionnalites?: string;
  contraintes?: string;
  delais?: string;
  budgetTexte?: string;
};

const toUIRappel = (item: any): UIRappel => ({
  id: Number(item.id),
  clientID: Number(item.clientID),
  titre: item.titre || 'Rappel',
  typeRappel: item.typeRappel || '',
  description: item.message || '',
  dateLimite: item.dateRappel ? new Date(new Date(item.dateRappel).getTime() - new Date(item.dateRappel).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
  statut: item.statut || 'en_attente',
  priorite: item.priorite || 'moyenne',
  createdAt: item.createdAt ? String(item.createdAt).slice(0, 10) : '',
});

const toRappelPayload = (item: Partial<UIRappel>) => ({
  clientID: Number(item.clientID),
  titre: item.titre || 'Rappel',
  typeRappel: item.typeRappel || null,
  dateRappel: item.dateLimite ? new Date(item.dateLimite).toISOString() : null,
  message: item.description || null,
  statut: item.statut || 'en_attente',
  priorite: item.priorite || 'moyenne',
});

const toUICahier = (item: any): UICahier => ({
  cahierID: Number(item.cahierID),
  projetID: Number(item.projetID),
  objet: item.objet || '',
  description: item.description || '',
  dateCreation: item.dateCreation ? String(item.dateCreation).slice(0, 10) : '',
  dateValidation: item.dateValidation ? String(item.dateValidation).slice(0, 10) : '',
  fileUrl: item.fileUrl || '',
  version: item.version || '1.0',
  objectif: item.objectif || '',
  perimetre: item.perimetre || '',
  fonctionnalites: item.fonctionnalites || '',
  contraintes: item.contraintes || '',
  delais: item.delais || '',
  budgetTexte: item.budgetTexte || '',
});

const toCahierPayload = (item: Partial<UICahier>) => ({
  projetID: Number(item.projetID),
  objet: item.objet || '',
  description: item.description || null,
  dateCreation: item.dateCreation ? new Date(item.dateCreation).toISOString() : undefined,
  dateValidation: item.dateValidation ? new Date(item.dateValidation).toISOString() : null,
  fileUrl: item.fileUrl || null,
  version: item.version || '1.0',
  objectif: item.objectif || null,
  perimetre: item.perimetre || null,
  fonctionnalites: item.fonctionnalites || null,
  contraintes: item.contraintes || null,
  delais: item.delais || null,
  budgetTexte: item.budgetTexte || null,
});

export const rappelsAPI = {
  getAll: async (): Promise<UIRappel[]> => {
    const { data } = await api.get('/rappels');
    return data.map(toUIRappel);
  },
  getById: async (id: number): Promise<UIRappel> => {
    const { data } = await api.get(`/rappels/${id}`);
    return toUIRappel(data);
  },
  create: async (payload: Partial<UIRappel>): Promise<UIRappel> => {
    const { data } = await api.post('/rappels', toRappelPayload(payload));
    return toUIRappel(data);
  },
  update: async (id: number, payload: Partial<UIRappel>): Promise<UIRappel> => {
    const { data } = await api.put(`/rappels/${id}`, toRappelPayload(payload));
    return toUIRappel(data);
  },
  delete: (id: number) => api.delete(`/rappels/${id}`),
};

export const cahierAPI = {
  getAll: async (): Promise<UICahier[]> => {
    const { data } = await api.get('/cahier-de-charge');
    return data.map(toUICahier);
  },
  getById: async (id: number): Promise<UICahier> => {
    const { data } = await api.get(`/cahier-de-charge/${id}`);
    return toUICahier(data);
  },
  create: async (payload: Partial<UICahier>): Promise<UICahier> => {
    const { data } = await api.post('/cahier-de-charge', toCahierPayload(payload));
    return toUICahier(data);
  },
  update: async (id: number, payload: Partial<UICahier>): Promise<UICahier> => {
    const { data } = await api.put(`/cahier-de-charge/${id}`, toCahierPayload(payload));
    return toUICahier(data);
  },
  delete: (id: number) => api.delete(`/cahier-de-charge/${id}`),
};

export type UIService = {
  id: number;
  projetID: number;
  nom: string;
  type?: string;
  statut: string;
  url?: string;
};

export type UIMonitoring = {
  monitoringID: number;
  serviceID: number;
  serviceName: string;
  endpoint: string;
  status: string;
  uptime: number;
  responseTime: number;
  lastCheck: string;
  checks: string;
  alerts: string;
};

const toUIService = (item: any): UIService => ({
  id: Number(item.id),
  projetID: Number(item.projetID),
  nom: item.nom || `Service ${item.id}`,
  type: item.type || '',
  statut: item.statut || 'actif',
  url: item.url || '',
});

const toUIMonitoring = (item: any, serviceById: Map<number, UIService>): UIMonitoring => {
  const service = serviceById.get(Number(item.serviceID));
  return {
    monitoringID: Number(item.monitoringID),
    serviceID: Number(item.serviceID),
    serviceName: service?.nom || `Service ${item.serviceID}`,
    endpoint: service?.url || '',
    status: item.status || 'unknown',
    uptime: Number(item.uptime || 0),
    responseTime: Number(item.responseTime || 0),
    lastCheck: item.lastCheck ? String(item.lastCheck) : '',
    checks: item.checks || '',
    alerts: item.alerts || '',
  };
};

const toMonitoringPayload = (item: Partial<UIMonitoring>) => ({
  serviceID: Number(item.serviceID),
  status: item.status || 'unknown',
  uptime: Number(item.uptime ?? 0),
  responseTime: item.responseTime == null ? null : Number(item.responseTime),
  lastCheck: item.lastCheck ? new Date(item.lastCheck).toISOString() : new Date().toISOString(),
  checks: item.checks || null,
  alerts: item.alerts || null,
});

export const servicesAPI = {
  getAll: async (): Promise<UIService[]> => {
    const { data } = await api.get('/services');
    return data.map(toUIService);
  },
};

export const aiMonitoringAPI = {
  getAll: async (): Promise<UIMonitoring[]> => {
    const [{ data: monitoringRows }, { data: serviceRows }] = await Promise.all([
      api.get('/ai-monitoring'),
      api.get('/services'),
    ]);
    const services = (serviceRows || []).map(toUIService);
    const serviceById = new Map<number, UIService>(services.map((s: UIService) => [s.id, s]));
    return (monitoringRows || []).map((row: any) => toUIMonitoring(row, serviceById));
  },
  create: async (payload: Partial<UIMonitoring>): Promise<UIMonitoring> => {
    const { data: created } = await api.post('/ai-monitoring', toMonitoringPayload(payload));
    const { data: serviceRows } = await api.get('/services');
    const services = (serviceRows || []).map(toUIService);
    const serviceById = new Map<number, UIService>(services.map((s: UIService) => [s.id, s]));
    return toUIMonitoring(created, serviceById);
  },
  update: async (id: number, payload: Partial<UIMonitoring>): Promise<UIMonitoring> => {
    const { data: updated } = await api.put(`/ai-monitoring/${id}`, toMonitoringPayload(payload));
    const { data: serviceRows } = await api.get('/services');
    const services = (serviceRows || []).map(toUIService);
    const serviceById = new Map<number, UIService>(services.map((s: UIService) => [s.id, s]));
    return toUIMonitoring(updated, serviceById);
  },
  delete: (id: number) => api.delete(`/ai-monitoring/${id}`),
};

export const dashboardAPI = {
  overview: async () => (await api.get('/dashboard/overview')).data,
};

export type UIUser = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Developer';
  status: 'Actif' | 'Inactif';
  joinedAt: string;
  avatar: string;
};

export type UIItem = {
  itemID?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
};

export type UIDevis = {
  id: string;
  numericId: number;
  clientId: string;
  clientName: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  validUntil?: string;
  notes?: string;
  items: UIItem[];
};

export type UIFacture = {
  id: string;
  numericId: number;
  clientId: string;
  clientName: string;
  amount: number;
  status: string;
  issuedAt: string;
  dueAt?: string;
  paidAt?: string;
  taxRate: number;
  items: UIItem[];
};

export type UIContrat = {
  id: string;
  numericId: number;
  clientId: string;
  clientName: string;
  titre: string;
  type: string;
  dateDebut?: string;
  dateFin?: string;
  value: number;
  status: string;
  needsRenewal: boolean;
  dateRenouvellement?: string;
  objet?: string;
  obligations?: string;
  responsabilites?: string;
  conditions?: string;
};

const roleToUi = (role: string): UIUser['role'] => {
  const normalized = role.toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'manager') return 'Manager';
  return 'Developer';
};

const roleToApi = (role: UIUser['role']) => {
  if (role === 'Admin') return 'admin';
  if (role === 'Manager') return 'manager';
  return 'developpeur';
};

const statusToApi = (status: string) => (status.toLowerCase() === 'actif' ? true : false);
const statusToUi = (actif: boolean) => (actif ? 'Actif' : 'Inactif');

const normalizeItem = (item: any): UIItem => ({
  itemID: item.itemID,
  description: item.description || '',
  quantity: Number(item.quantity || 0),
  unitPrice: Number(item.unitPrice || 0),
  lineTotal: Number(item.lineTotal || Number(item.quantity || 0) * Number(item.unitPrice || 0)),
});

const toUIDevis = (item: any): UIDevis => ({
  id: `DEV-${new Date(String(item.dateDevis || new Date())).getFullYear()}-${String(item.devisID).padStart(4, '0')}`,
  numericId: item.devisID,
  clientId: String(item.clientID),
  clientName: item.clientNom || '',
  title: item.notes || `Devis ${item.devisID}`,
  amount: Number(item.totalAmount || 0),
  status: item.status || 'draft',
  createdAt: String(item.dateDevis || '').slice(0, 10),
  validUntil: item.validUntil ? String(item.validUntil).slice(0, 10) : '',
  notes: item.notes || '',
  items: (item.items || []).map(normalizeItem),
});

const toDevisPayload = (item: Partial<UIDevis>) => ({
  clientID: Number(item.clientId),
  projetID: null,
  dateDevis: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
  validUntil: item.validUntil ? new Date(item.validUntil).toISOString() : undefined,
  totalAmount: Number(item.amount || 0),
  status: item.status || 'draft',
  notes: item.notes || item.title || null,
  projetIDs: [],
  items: (item.items || []).map((it) => ({
    description: it.description,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
  })),
});

const toUIFacture = (item: any): UIFacture => ({
  id: `INV-${new Date(String(item.dateFacture || new Date())).getFullYear()}-${String(item.factureID).padStart(4, '0')}`,
  numericId: item.factureID,
  clientId: String(item.clientID),
  clientName: item.clientNom || '',
  amount: Number(item.amountTTC || 0),
  status: item.status || 'en_attente',
  issuedAt: String(item.dateFacture || '').slice(0, 10),
  dueAt: item.dueDate ? String(item.dueDate).slice(0, 10) : '',
  paidAt: item.paymentDate ? String(item.paymentDate).slice(0, 10) : '',
  taxRate: Number(item.taxRate || 0),
  items: (item.items || []).map(normalizeItem),
});

const toFacturePayload = (item: Partial<UIFacture>) => ({
  clientID: Number(item.clientId),
  devisID: null,
  dateFacture: item.issuedAt ? new Date(item.issuedAt).toISOString() : undefined,
  dueDate: item.dueAt ? new Date(item.dueAt).toISOString() : undefined,
  amountHT: Number(item.amount || 0),
  amountTTC: Number(item.amount || 0),
  status: item.status || 'en_attente',
  taxRate: Number(item.taxRate ?? 19),
  paymentDate: item.paidAt ? new Date(item.paidAt).toISOString() : undefined,
  projetIDs: [],
  items: (item.items || []).map((it) => ({
    description: it.description,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
  })),
});

const toUIContrat = (item: any): UIContrat => ({
  id: `CON-${new Date(String(item.dateDebut || new Date())).getFullYear()}-${String(item.contratID).padStart(4, '0')}`,
  numericId: item.contratID,
  clientId: String(item.clientID),
  clientName: item.clientNom || '',
  titre: item.titre || item.typeContrat,
  type: item.typeContrat || '',
  dateDebut: item.dateDebut || '',
  dateFin: item.dateFin || '',
  value: Number(item.montant || 0),
  status: item.status || 'actif',
  needsRenewal: Boolean(item.needsRenewal),
  dateRenouvellement: item.dateRenouvellement || '',
  objet: item.objet || '',
  obligations: item.obligations || '',
  responsabilites: item.responsabilites || '',
  conditions: item.conditions || '',
});

const toContratPayload = (item: Partial<UIContrat>) => ({
  clientID: Number(item.clientId),
  projetID: null,
  titre: item.titre || null,
  objet: item.objet || null,
  obligations: item.obligations || null,
  responsabilites: item.responsabilites || null,
  dateDebut: item.dateDebut || null,
  dateFin: item.dateFin || null,
  dateRenouvellement: item.dateRenouvellement || null,
  needsRenewal: Boolean(item.needsRenewal),
  typeContrat: item.type || 'Contrat de services',
  montant: Number(item.value || 0),
  conditions: item.conditions || null,
  status: item.status || 'actif',
});

export const usersAPI = {
  getAll: async (): Promise<UIUser[]> => {
    const { data } = await api.get('/utilisateurs');
    return data.map((u: any) => ({
      id: String(u.userID),
      name: u.nom,
      email: u.email,
      role: roleToUi(u.role),
      status: statusToUi(Boolean(u.actif)),
      joinedAt: String(u.dateCreation || '').slice(0, 10),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nom)}&background=random`,
    }));
  },
  create: async (payload: { name: string; email: string; role: UIUser['role']; status: UIUser['status']; password: string }) => {
    const { data } = await api.post('/utilisateurs', {
      nom: payload.name,
      email: payload.email,
      role: roleToApi(payload.role),
      actif: statusToApi(payload.status),
      motDePasse: payload.password,
    });
    return data;
  },
  update: async (id: string, payload: { name?: string; email?: string; role?: UIUser['role']; status?: UIUser['status']; password?: string }) => {
    const body: any = {};
    if (payload.name !== undefined) body.nom = payload.name;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.role !== undefined) body.role = roleToApi(payload.role);
    if (payload.status !== undefined) body.actif = statusToApi(payload.status);
    if (payload.password !== undefined) body.motDePasse = payload.password;
    const { data } = await api.put(`/utilisateurs/${id}`, body);
    return data;
  },
  delete: (id: string) => api.delete(`/utilisateurs/${id}`),
};

export const devisAPI = {
  getAll: async (): Promise<UIDevis[]> => {
    const { data } = await api.get('/devis');
    return data.map(toUIDevis);
  },
  getById: async (id: string): Promise<UIDevis> => {
    const { data } = await api.get(`/devis/${id}`);
    return toUIDevis(data);
  },
  create: async (data: Partial<UIDevis>): Promise<UIDevis> => {
    const { data: res } = await api.post('/devis', toDevisPayload(data));
    return toUIDevis(res);
  },
  update: async (id: string, data: Partial<UIDevis>): Promise<UIDevis> => {
    const { data: res } = await api.put(`/devis/${id}`, toDevisPayload(data));
    return toUIDevis(res);
  },
  delete: (id: string) => api.delete(`/devis/${id}`),
};

export const facturesAPI = {
  getAll: async (): Promise<UIFacture[]> => {
    const { data } = await api.get('/factures');
    return data.map(toUIFacture);
  },
  getById: async (id: string): Promise<UIFacture> => {
    const { data } = await api.get(`/factures/${id}`);
    return toUIFacture(data);
  },
  create: async (data: Partial<UIFacture>): Promise<UIFacture> => {
    const { data: res } = await api.post('/factures', toFacturePayload(data));
    return toUIFacture(res);
  },
  update: async (id: string, data: Partial<UIFacture>): Promise<UIFacture> => {
    const { data: res } = await api.put(`/factures/${id}`, toFacturePayload(data));
    return toUIFacture(res);
  },
  delete: (id: string) => api.delete(`/factures/${id}`),
};

export const contratsAPI = {
  getAll: async (): Promise<UIContrat[]> => {
    const { data } = await api.get('/contrats');
    return data.map(toUIContrat);
  },
  getById: async (id: string): Promise<UIContrat> => {
    const { data } = await api.get(`/contrats/${id}`);
    return toUIContrat(data);
  },
  create: async (data: Partial<UIContrat>): Promise<UIContrat> => {
    const { data: res } = await api.post('/contrats', toContratPayload(data));
    return toUIContrat(res);
  },
  update: async (id: string, data: Partial<UIContrat>): Promise<UIContrat> => {
    const { data: res } = await api.put(`/contrats/${id}`, toContratPayload(data));
    return toUIContrat(res);
  },
  delete: (id: string) => api.delete(`/contrats/${id}`),
};
