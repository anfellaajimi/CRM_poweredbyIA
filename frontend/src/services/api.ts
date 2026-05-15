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
    // Let the browser set multipart boundaries automatically.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const headers: any = config.headers;
      if (headers?.delete) headers.delete('Content-Type');
      else if (headers) delete headers['Content-Type'];
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

export const downloadPDF = async (url: string, filename: string, viewOnly = false) => {
  const { data } = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([data], { type: 'application/pdf' });
  const blobUrl = window.URL.createObjectURL(blob);

  if (viewOnly) {
    window.open(blobUrl, '_blank');
  } else {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Clean up the URL after a small delay to ensure the browser has time to start the action
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
};

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
  devise?: string;
  scoring?: string;
  adresse?: string;
  formattedId: string;
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
  isPinned?: boolean;
  startDate?: string;
  deadline?: string;
  description?: string;
  assignedTeam: string[];
  devise?: string;
  scoring?: string;
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
  devise: item.devise || 'TND',
  adresse: item.adresse || '',
  formattedId: item.formatted_id || `CL${String(item.id).padStart(3, '0')}`,
});

const toClientPayload = (client: Partial<UIClient>) => ({
  typeClient: client.type === 'Physique' ? 'physique' : 'moral',
  nom: client.name,
  prenom: client.prenom || null,
  email: client.email || null,
  tel: client.phone || null,
  dateNaissance: client.dateNaissance || null,
  cin: client.cin || null,
  raisonSociale: client.raisonSociale || null,
  matriculeFiscale: client.matriculeFiscale || null,
  secteurActivite: client.secteurActivite || null,
  adresse: client.adresse || null,
  entreprise: client.company || null,
  avatarUrl: client.avatar || null,
  status: client.status?.toLowerCase() || 'actif',
  devise: client.devise || 'TND',
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
  isPinned: Boolean(item.isPinned),
  startDate: item.dateDebut || '',
  deadline: item.dateFin || '',
  description: item.description || '',
  assignedTeam: item.assignedUsers || [],
  devise: item.clientDevise || 'TND',
  scoring: item.scoring || 'Moyen',
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
  isPinned: project.isPinned ?? false,
  dateDebut: project.startDate || null,
  dateFin: project.deadline || null,
  scoring: project.scoring || 'Moyen',
});

export const clientAuthAPI = {
  login: (email: string, password: string) => api.post('/client-auth/login', { email, password }),
  signup: (payload: { nom: string; email: string; password: string }) => api.post('/client-auth/signup', payload),
};

export const authAPI = {
  login: (email: string, motDePasse: string) => api.post('/auth/login', { email, motDePasse }),
  register: (payload: { nom: string; email: string; motDePasse: string; role: string }) =>
    api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  updateMe: (payload: { nom: string; email: string; avatar?: string }) => api.put('/auth/me', payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', payload),
  googleLogin: () => { window.location.href = `${api.defaults.baseURL}/auth/google`; },
  githubLogin: () => { window.location.href = `${api.defaults.baseURL}/auth/github`; },
};

export const clientsAPI = {
  getAll: async (q?: string, id?: string): Promise<UIClient[]> => {
    const { data } = await api.get('/clients', { params: { q, client_id: id } });
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

export type UIProjetMilestone = {
  id: number;
  projetID: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: 'open' | 'done' | string;
  completedAt?: string | null;
  createdAt?: string;
};

const toUIMilestone = (item: any): UIProjetMilestone => ({
  id: Number(item.id),
  projetID: Number(item.projetID),
  title: item.title || '',
  description: item.description ?? null,
  dueDate: item.dueDate ? String(item.dueDate) : null,
  status: item.status || 'open',
  completedAt: item.completedAt ? String(item.completedAt) : null,
  createdAt: item.createdAt ? String(item.createdAt) : '',
});

const toMilestonePayload = (item: Partial<UIProjetMilestone>) => ({
  title: item.title,
  description: item.description ?? null,
  dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
  status: item.status ?? undefined,
  completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : undefined,
});

export const milestonesAPI = {
  list: async (projectId: string): Promise<UIProjetMilestone[]> => {
    const { data } = await api.get(`/projets/${projectId}/milestones`);
    return data.map(toUIMilestone);
  },
  create: async (projectId: string, payload: Partial<UIProjetMilestone>): Promise<UIProjetMilestone> => {
    const { data } = await api.post(`/projets/${projectId}/milestones`, toMilestonePayload(payload));
    return toUIMilestone(data);
  },
  update: async (projectId: string, milestoneId: number, payload: Partial<UIProjetMilestone>): Promise<UIProjetMilestone> => {
    const { data } = await api.put(`/projets/${projectId}/milestones/${milestoneId}`, toMilestonePayload(payload));
    return toUIMilestone(data);
  },
  delete: (projectId: string, milestoneId: number) => api.delete(`/projets/${projectId}/milestones/${milestoneId}`),
};

export type UIRappel = {
  id: number;
  clientID: number;
  projetID?: number;
  devisID?: number;
  factureID?: number;
  milestoneID?: number;
  titre: string;
  typeRappel?: string;
  description?: string;
  dateLimite?: string;
  statut: string;
  priorite: string;
  createdAt?: string;
  systemKey?: string | null;
  emailSentAt?: string | null;
  emailLastError?: string | null;
};

export type UIAppSettings = {
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyVatNumber?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyReference?: string;

  logoUrl?: string;
  stampUrl?: string;
  defaultTaxRate?: number;
  defaultValidityDays?: number;
  documentNotes?: string;

  aiProvider?: string;
  aiApiKey?: string;
  aiModel?: string;

  notificationsEnabled?: boolean;
  notificationsEmailEnabled?: boolean;
  notificationsPushEnabled?: boolean;
  notificationsDailyDigestEnabled?: boolean;
  notificationsEmailRecipients?: string;

  appearanceTheme?: 'light' | 'dark';
  appearancePrimaryColor?: string;

  subscriptionPlan?: string;
  subscriptionStatus?: string;
  paymentMethodLast4?: string;
  paymentMethodExpiry?: string;
};

const toUIAppSettings = (item: any): UIAppSettings => ({
  companyName: item.company_name || '',
  companyAddress: item.company_address || '',
  companyTaxId: item.company_tax_id || '',
  companyVatNumber: item.company_vat_number || '',
  companyPhone: item.company_phone || '',
  companyEmail: item.company_email || '',
  companyReference: item.company_reference || '',

  logoUrl: item.logo_url || '',
  stampUrl: item.stamp_url || '',
  defaultTaxRate: item.default_tax_rate ?? 19.0,
  defaultValidityDays: item.default_validity_days ?? 30,
  documentNotes: item.document_notes || '',

  aiProvider: item.ai_provider || 'openai',
  aiApiKey: item.ai_api_key || '',
  aiModel: item.ai_model || 'gpt-4',

  notificationsEnabled: item.notifications_enabled ?? true,
  notificationsEmailEnabled: item.notifications_email_enabled ?? false,
  notificationsPushEnabled: item.notifications_push_enabled ?? true,
  notificationsDailyDigestEnabled: item.notifications_daily_digest_enabled ?? false,
  notificationsEmailRecipients: item.notifications_email_recipients || '',

  appearanceTheme: item.appearance_theme === 'dark' ? 'dark' : 'light',
  appearancePrimaryColor: item.appearance_primary_color || '#6366f1',

  subscriptionPlan: item.subscription_plan || 'Enterprise AI',
  subscriptionStatus: item.subscription_status || 'Actif',
  paymentMethodLast4: item.payment_method_last4 || '4242',
  paymentMethodExpiry: item.payment_method_expiry || '12/2027',
});

const toAppSettingsPayload = (item: Partial<UIAppSettings>) => ({
  company_name: item.companyName,
  company_address: item.companyAddress,
  company_tax_id: item.companyTaxId,
  company_vat_number: item.companyVatNumber,
  company_phone: item.companyPhone,
  company_email: item.companyEmail,
  company_reference: item.companyReference,

  logo_url: item.logoUrl,
  stamp_url: item.stampUrl,
  default_tax_rate: item.defaultTaxRate,
  default_validity_days: item.defaultValidityDays,
  document_notes: item.documentNotes,

  ai_provider: item.aiProvider,
  ai_api_key: item.aiApiKey,
  ai_model: item.aiModel,

  notifications_enabled: item.notificationsEnabled,
  notifications_email_enabled: item.notificationsEmailEnabled,
  notifications_push_enabled: item.notificationsPushEnabled,
  notifications_daily_digest_enabled: item.notificationsDailyDigestEnabled,
  notifications_email_recipients: item.notificationsEmailRecipients,

  appearance_theme: item.appearanceTheme,
  appearance_primary_color: item.appearancePrimaryColor,

  subscription_plan: item.subscriptionPlan,
  subscription_status: item.subscriptionStatus,
  payment_method_last4: item.paymentMethodLast4,
  payment_method_expiry: item.paymentMethodExpiry,
});

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
  userStories?: string;
  reglesMetier?: string;
  documentsReference?: string;
};

const toUIRappel = (item: any): UIRappel => ({
  id: Number(item.id),
  clientID: Number(item.clientID),
  projetID: item.projetID != null ? Number(item.projetID) : undefined,
  devisID: item.devisID != null ? Number(item.devisID) : undefined,
  factureID: item.factureID != null ? Number(item.factureID) : undefined,
  milestoneID: item.milestoneID != null ? Number(item.milestoneID) : undefined,
  titre: item.titre || 'Rappel',
  typeRappel: item.typeRappel || '',
  description: item.message || '',
  dateLimite: item.dateRappel ? new Date(new Date(item.dateRappel).getTime() - new Date(item.dateRappel).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
  statut: item.statut || 'en_attente',
  priorite: item.priorite || 'moyenne',
  createdAt: item.createdAt ? String(item.createdAt).slice(0, 10) : '',
  systemKey: item.systemKey ?? null,
  emailSentAt: item.emailSentAt ? String(item.emailSentAt) : null,
  emailLastError: item.emailLastError ?? null,
});

const toRappelPayload = (item: Partial<UIRappel>) => ({
  clientID: item.clientID != null ? Number(item.clientID) : undefined,
  projetID: item.projetID != null ? Number(item.projetID) : undefined,
  devisID: item.devisID != null ? Number(item.devisID) : undefined,
  factureID: item.factureID != null ? Number(item.factureID) : undefined,
  milestoneID: item.milestoneID != null ? Number(item.milestoneID) : undefined,
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
  userStories: item.userStories || '',
  reglesMetier: item.reglesMetier || '',
  documentsReference: item.documentsReference || '',
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
  userStories: item.userStories || null,
  reglesMetier: item.reglesMetier || null,
  documentsReference: item.documentsReference || null,
});

export const rappelsAPI = {
  getAll: async (filters?: { projetID?: number | string; clientID?: number | string; statut?: string; source?: 'system' | 'manual' }): Promise<UIRappel[]> => {
    const params: any = {};
    if (filters?.projetID != null) params.projetID = filters.projetID;
    if (filters?.clientID != null) params.clientID = filters.clientID;
    if (filters?.statut) params.statut = filters.statut;
    if (filters?.source) params.source = filters.source;
    const { data } = await api.get('/rappels', { params });
    return data.map(toUIRappel);
  },
  generate: () => api.post('/rappels/generate'),
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
  exportPDF: async (id: number) => {
    const response = await api.get(`/cahier-de-charge/${id}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cahier_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
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

export type UIAIAgentAlert = {
  id: number;
  projectId?: number;
  title: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
};

export type UIAIAgentAction = {
  id: number;
  action: string;
  message: string;
  entityId?: number;
  createdAt: string;
};

export type UIAIAgentSummary = {
  warning: number;
  critical: number;
  total: number;
};

export type UIMonitoringDiagnostics = {
  totalServices: number;
  servicesWithUrl: number;
  monitoringRows: number;
  servicesWithoutMonitoring: number;
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
  runAgent: async () => (await api.post('/ai-monitoring/agent/run')).data,
  getAgentActivity: async (): Promise<{ alerts: UIAIAgentAlert[]; actions: UIAIAgentAction[]; summary: UIAIAgentSummary }> =>
    (await api.get('/ai-monitoring/agent/activity')).data,
  getAgentHistory: async (): Promise<{ history: UIAIAgentAlert[] }> =>
    (await api.get('/ai-monitoring/agent/alerts/history')).data,
  getDiagnostics: async (): Promise<UIMonitoringDiagnostics> =>
    (await api.get('/ai-monitoring/diagnostics')).data,
  resolveAlert: async (id: number) => api.put(`/ai-monitoring/agent/alerts/${id}/resolve`),
  getAgentStats: async (): Promise<{ time: string; count: number }[]> =>
    (await api.get('/ai-monitoring/agent/stats')).data,
  // Health Checks
  runHealthChecks: async () => (await api.post('/ai-monitoring/health/run')).data,
  getCurrentHealth: async (): Promise<UIServiceCheck[]> => (await api.get('/ai-monitoring/health/current')).data,
  getHealthStats: async (hours = 24): Promise<Record<string, number>> => (await api.get('/ai-monitoring/health/stats', { params: { hours } })).data,
  getIncidents: async (): Promise<UIIncident[]> => (await api.get('/ai-monitoring/health/incidents')).data,
};

export const aiPredictionsAPI = {
  getRevenue: async () => (await api.get('/predictions/revenue')).data,
  getProjects: async () => (await api.get('/predictions/projects')).data,
  getRisks: async () => (await api.get('/predictions/risks')).data,
  getPerformance: async () => (await api.get('/predictions/performance')).data,
  recalculate: async () => (await api.post('/predictions/recalculate')).data,
  getRecommendations: async () => (await api.get('/predictions/smart-recommendations')).data,
  getDevInsights: async () => (await api.get('/predictions/dev-insights')).data,
  getBudgetIntelligence: async () => (await api.get('/predictions/budget-intelligence')).data,
  chat: async (message: string) => (await api.post('/predictions/chat', { message })).data,
  getResourceOptimization: async () => (await api.get('/predictions/resource-optimization')).data,
};

export type UIServiceCheck = {
  id: string;
  service_name: string;
  status: string;
  response_time_ms: number | null;
  checked_at: string;
  error_message: string | null;
};

export type UIIncident = {
  id: string;
  service_name: string;
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
};

export const dashboardAPI = {
  overview: async () => (await api.get('/dashboard/overview')).data,
};

export type UIUser = {
  id: string;
  name: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  role: 'Admin' | 'Manager' | 'Developer' | 'Client';
  status: 'Actif' | 'Inactif';
  joinedAt: string;
  avatar: string;
  cnssId?: string;
};

export type UIUserContract = {
  id: number;
  userID: number;
  frontId: string;
  name: string;
  type: string;
  description?: string;
  status: 'active' | 'inactive';
  pdfUrl: string;
  pdfPublicId: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string | null;
  archivedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type UIDeclarationCNSS = {
  id: number;
  userID: number;
  frontId: string;
  name: string;
  description?: string;
  declarationDate: string;
  pdfUrl: string;
  pdfPublicId: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
};

export type UIUserContractsGrouped = {
  active: UIUserContract | null;
  history: UIUserContract[];
  all: UIUserContract[];
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
  devise?: string;
  taxRate?: number;
  fiscalStamp?: number;
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
  items: UIItem[];
  devise?: string;
  taxRate?: number;
  fiscalStamp?: number;
  devisId?: string;
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
  devise?: string;
  isSignedByClient: boolean;
  isSignedByProvider: boolean;
  signatureClient?: string;
  signatureProvider?: string;
};

const roleToUi = (role: string): UIUser['role'] => {
  const normalized = role.toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'manager') return 'Manager';
  if (normalized === 'client') return 'Client';
  return 'Developer';
};

const roleToApi = (role: UIUser['role']) => {
  if (role === 'Admin') return 'admin';
  if (role === 'Manager') return 'manager';
  if (role === 'Client') return 'client';
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
  devise: item.clientDevise || 'TND',
  taxRate: Number(item.taxRate || 19),
  fiscalStamp: Number(item.fiscalStamp || 1.0),
});

const toDevisPayload = (item: Partial<UIDevis>) => ({
  clientID: Number(item.clientId),
  projetID: null,
  dateDevis: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
  validUntil: item.validUntil ? new Date(item.validUntil).toISOString() : undefined,
  totalAmount: Number(item.amount || 0),
  status: item.status || 'draft',
  notes: item.notes || item.title || null,
  taxRate: Number(item.taxRate ?? 19),
  fiscalStamp: Number(item.fiscalStamp ?? 1.0),
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
  fiscalStamp: Number(item.fiscalStamp || 1.0),
  items: (item.items || []).map(normalizeItem),
  devise: item.clientDevise || 'TND',
});

const toFacturePayload = (item: Partial<UIFacture>) => ({
  clientID: Number(item.clientId),
  devisID: item.devisId ? Number(item.devisId) : null,
  dateFacture: item.issuedAt ? new Date(item.issuedAt).toISOString() : undefined,
  dueDate: item.dueAt ? new Date(item.dueAt).toISOString() : undefined,
  amountHT: Number(item.amount || 0),
  amountTTC: Number(item.amount || 0),
  status: item.status || 'en_attente',
  taxRate: Number(item.taxRate ?? 19),
  fiscalStamp: Number(item.fiscalStamp ?? 1.0),
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
  devise: item.clientDevise || 'TND',
  isSignedByClient: Boolean(item.isSignedByClient),
  isSignedByProvider: Boolean(item.isSignedByProvider),
  signatureClient: item.signatureClient || '',
  signatureProvider: item.signatureProvider || '',
});

const toUIUserContract = (item: any): UIUserContract => ({
  id: Number(item.id),
  userID: Number(item.userID),
  frontId: item.frontId || '',
  name: item.name || '',
  type: item.type || '',
  description: item.description || '',
  status: (item.status || 'inactive') as 'active' | 'inactive',
  pdfUrl: item.pdfUrl || '',
  pdfPublicId: item.pdfPublicId || '',
  mimeType: item.mimeType || 'application/pdf',
  fileSize: Number(item.fileSize || 0),
  createdAt: item.createdAt ? String(item.createdAt) : '',
  updatedAt: item.updatedAt ? String(item.updatedAt) : '',
  activatedAt: item.activatedAt ? String(item.activatedAt) : null,
  archivedAt: item.archivedAt ? String(item.archivedAt) : null,
  startDate: item.startDate ? String(item.startDate) : null,
  endDate: item.endDate ? String(item.endDate) : null,
});

const toUIDeclCNSS = (item: any): UIDeclarationCNSS => ({
  id: Number(item.id),
  userID: Number(item.userID),
  frontId: item.frontId || '',
  name: item.name || '',
  description: item.description || '',
  declarationDate: item.declarationDate ? String(item.declarationDate) : '',
  pdfUrl: item.pdfUrl || '',
  pdfPublicId: item.pdfPublicId || '',
  mimeType: item.mimeType || 'application/pdf',
  fileSize: Number(item.fileSize || 0),
  createdAt: item.createdAt ? String(item.createdAt) : '',
  updatedAt: item.updatedAt ? String(item.updatedAt) : '',
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
  isSignedByClient: Boolean(item.isSignedByClient),
  signatureClient: item.signatureClient || null,
  isSignedByProvider: Boolean(item.isSignedByProvider),
  signatureProvider: item.signatureProvider || null,
});

export const usersAPI = {
  getAll: async (): Promise<UIUser[]> => {
    const { data } = await api.get('/utilisateurs');
    return data.map((u: any) => ({
      id: String(u.userID),
      name: u.nom,
      email: u.email,
      telephone: u.tel || '',
      dateNaissance: u.dateNaissance || '',
      role: roleToUi(u.role),
      status: statusToUi(Boolean(u.actif)),
      joinedAt: String(u.dateCreation || '').slice(0, 10),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nom)}&background=random`,
      cnssId: u.cnssId || '',
    }));
  },
  getById: async (id: string): Promise<UIUser> => {
    const { data } = await api.get(`/utilisateurs/${id}`);
    return {
      id: String(data.userID),
      name: data.nom,
      email: data.email,
      telephone: data.tel || '',
      dateNaissance: data.dateNaissance || '',
      role: roleToUi(data.role),
      status: statusToUi(Boolean(data.actif)),
      joinedAt: String(data.dateCreation || '').slice(0, 10),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nom)}&background=random`,
      cnssId: data.cnssId || '',
    };
  },
  create: async (payload: { name: string; email: string; telephone?: string; dateNaissance?: string; role: UIUser['role']; status: UIUser['status']; password: string; cnssId?: string }) => {
    const { data } = await api.post('/utilisateurs', {
      nom: payload.name,
      email: payload.email,
      tel: payload.telephone || null,
      dateNaissance: payload.dateNaissance || null,
      role: roleToApi(payload.role),
      actif: statusToApi(payload.status),
      motDePasse: payload.password,
      cnssId: payload.cnssId || null,
    });
    return data;
  },
  update: async (id: string, payload: { name?: string; email?: string; telephone?: string; dateNaissance?: string; role?: UIUser['role']; status?: UIUser['status']; password?: string; cnssId?: string }) => {
    const body: any = {};
    if (payload.name !== undefined) body.nom = payload.name;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.telephone !== undefined) body.tel = payload.telephone || null;
    if (payload.dateNaissance !== undefined) body.dateNaissance = payload.dateNaissance || null;
    if (payload.role !== undefined) body.role = roleToApi(payload.role);
    if (payload.status !== undefined) body.actif = statusToApi(payload.status);
    if (payload.password !== undefined) body.motDePasse = payload.password;
    if (payload.cnssId !== undefined) body.cnssId = payload.cnssId || null;
    const { data } = await api.put(`/utilisateurs/${id}`, body);
    return data;
  },
  delete: (id: string) => api.delete(`/utilisateurs/${id}`),
};

export const userContractsAPI = {
  list: async (userId: string): Promise<UIUserContractsGrouped> => {
    const { data } = await api.get(`/utilisateurs/${userId}/contracts`);
    return {
      active: data.active ? toUIUserContract(data.active) : null,
      history: (data.history || []).map(toUIUserContract),
      all: (data.all || []).map(toUIUserContract),
    };
  },
  getById: async (userId: string, contractId: number): Promise<UIUserContract> => {
    const { data } = await api.get(`/utilisateurs/${userId}/contracts/${contractId}`);
    return toUIUserContract(data);
  },
  create: async (
    userId: string,
    payload: {
      frontId: string;
      name: string;
      type: string;
      description?: string;
      status: 'active' | 'inactive';
      startDate?: string;
      endDate?: string;
      file: File;
    }
  ): Promise<UIUserContract> => {
    const formData = new FormData();
    formData.append('frontId', payload.frontId);
    formData.append('name', payload.name);
    formData.append('type', payload.type);
    if (payload.description) formData.append('description', payload.description);
    formData.append('status', payload.status);
    if (payload.startDate) formData.append('startDate', payload.startDate);
    if (payload.endDate) formData.append('endDate', payload.endDate);
    formData.append('file', payload.file);
    const { data } = await api.post(`/utilisateurs/${userId}/contracts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toUIUserContract(data);
  },
  update: async (
    userId: string,
    contractId: number,
    payload: {
      frontId?: string;
      name?: string;
      type?: string;
      description?: string;
      status?: 'active' | 'inactive';
      startDate?: string;
      endDate?: string;
      file?: File;
    }
  ): Promise<UIUserContract> => {
    const formData = new FormData();
    if (payload.frontId !== undefined) formData.append('frontId', payload.frontId);
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.type !== undefined) formData.append('type', payload.type);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.status !== undefined) formData.append('status', payload.status);
    if (payload.startDate !== undefined) formData.append('startDate', payload.startDate || '');
    if (payload.endDate !== undefined) formData.append('endDate', payload.endDate || '');
    if (payload.file) formData.append('file', payload.file);
    const { data } = await api.put(`/utilisateurs/${userId}/contracts/${contractId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toUIUserContract(data);
  },
  delete: async (userId: string, contractId: number) => {
    await api.delete(`/utilisateurs/${userId}/contracts/${contractId}`);
  },
};

export const declarationCNSSAPI = {
  list: async (userId: string): Promise<UIDeclarationCNSS[]> => {
    const { data } = await api.get(`/utilisateurs/${userId}/cnss-declarations`);
    return (data.all || []).map(toUIDeclCNSS);
  },
  create: async (
    userId: string,
    payload: {
      frontId: string;
      name: string;
      description?: string;
      declarationDate: string;
      file: File;
    }
  ): Promise<UIDeclarationCNSS> => {
    const formData = new FormData();
    formData.append('frontId', payload.frontId);
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    formData.append('declarationDate', payload.declarationDate);
    formData.append('file', payload.file);
    const { data } = await api.post(`/utilisateurs/${userId}/cnss-declarations`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return toUIDeclCNSS(data);
  },
  delete: async (userId: string, declId: number) => {
    await api.delete(`/utilisateurs/${userId}/cnss-declarations/${declId}`);
  },
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
  exportPDF: (id: number, filename: string, viewOnly = false) =>
    downloadPDF(`/devis/${id}/pdf`, filename, viewOnly),
};

export const activityAPI = {
  getRecent: async (params?: { limit?: number; offset?: number }) => {
    const { data } = await api.get('/activity', { params });
    return data;
  },
};

export const settingsAPI = {
  get: async (): Promise<UIAppSettings> => {
    const { data } = await api.get('/settings/');
    return toUIAppSettings(data);
  },
  update: async (payload: Partial<UIAppSettings>): Promise<UIAppSettings> => {
    const { data } = await api.put('/settings/', toAppSettingsPayload(payload));
    return toUIAppSettings(data);
  },
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/settings/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
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
  exportPDF: (id: number, filename: string, viewOnly = false) =>
    downloadPDF(`/factures/${id}/pdf`, filename, viewOnly),
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
  exportPDF: (id: number, filename: string, viewOnly = false) =>
    downloadPDF(`/contrats/${id}/pdf`, filename, viewOnly),
};

export type UIChatMessage = {
  id: number;
  expediteurID: number;
  destinataireID: number;
  contenu: string;
  type?: 'text' | 'audio';
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  mediaDurationSec?: number | null;
  lu: boolean;
  createdAt: string;
};

export type UIContact = {
  userID: number;
  nom: string;
  role: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
};

export const chatAPI = {
  getContacts: async (): Promise<UIContact[]> => {
    const { data } = await api.get('/messages/contacts');
    return data;
  },
  getConversation: async (userId: number): Promise<UIChatMessage[]> => {
    const { data } = await api.get(`/messages/conversation/${userId}`);
    return data;
  },
  deleteConversation: async (userId: number): Promise<void> => {
    await api.delete(`/messages/conversation/${userId}`);
  },
  sendMessage: async (destinataireID: number, contenu: string): Promise<UIChatMessage> => {
    const { data } = await api.post('/messages', { destinataireID, contenu });
    return data;
  },
  sendAudioMessage: async (
    destinataireID: number,
    audio: Blob,
    durationSec?: number
  ): Promise<UIChatMessage> => {
    const form = new FormData();
    form.append('destinataireID', String(destinataireID));
    form.append('file', audio, 'voice.webm');
    if (durationSec != null) form.append('durationSec', String(durationSec));
    const { data } = await api.post('/messages/audio', form);
    return data;
  },
  markRead: async (messageId: number): Promise<void> => {
    await api.put(`/messages/${messageId}/read`);
  },
};

export const clientPortalAPI = {
  getProfile: async () => (await api.get('/client-portal/me')).data,
  updateProfile: async (payload: any) => (await api.put('/client-portal/me', payload)).data,
  getProjects: async () => (await api.get('/client-portal/projects')).data,
  getProjectDetails: async (id: number) => (await api.get(`/client-portal/projects/${id}`)).data,
  getDevis: async () => (await api.get('/client-portal/documents/devis')).data,
  getFactures: async () => (await api.get('/client-portal/documents/factures')).data,
  getContracts: async () => (await api.get('/client-portal/documents/contracts')).data,
  exportDevisPDF: (id: number, filename: string, viewOnly = false) =>
    downloadPDF(`/devis/${id}/pdf`, filename, viewOnly),
  exportFacturePDF: (id: number, filename: string, viewOnly = false) =>
    downloadPDF(`/factures/${id}/pdf`, filename, viewOnly),
  exportContractPDF: (id: number, filename: string, viewOnly = false) =>
    downloadPDF(`/contrats/${id}/pdf`, filename, viewOnly),
};
