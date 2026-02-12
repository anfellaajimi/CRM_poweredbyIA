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
  (error) => {
    return Promise.reject(error);
  }
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

export const authAPI = {
  login: (email: string, motDePasse: string) => api.post('/auth/login', { email, motDePasse }),
  register: (payload: { nom: string; email: string; motDePasse: string; role: string }) =>
    api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
};

export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const projectsAPI = {
  getAll: () => api.get('/projets'),
  getById: (id: string) => api.get(`/projets/${id}`),
  create: (data: any) => api.post('/projets', data),
  update: (id: string, data: any) => api.put(`/projets/${id}`, data),
  delete: (id: string) => api.delete(`/projets/${id}`),
};

export const devisAPI = {
  getAll: () => api.get('/devis'),
  getById: (id: string) => api.get(`/devis/${id}`),
  create: (data: any) => api.post('/devis', data),
  update: (id: string, data: any) => api.put(`/devis/${id}`, data),
  delete: (id: string) => api.delete(`/devis/${id}`),
};

export const facturesAPI = {
  getAll: () => api.get('/factures'),
  getById: (id: string) => api.get(`/factures/${id}`),
  create: (data: any) => api.post('/factures', data),
  update: (id: string, data: any) => api.put(`/factures/${id}`, data),
  delete: (id: string) => api.delete(`/factures/${id}`),
};

export const contratsAPI = {
  getAll: () => api.get('/contrats'),
  getById: (id: string) => api.get(`/contrats/${id}`),
  create: (data: any) => api.post('/contrats', data),
  update: (id: string, data: any) => api.put(`/contrats/${id}`, data),
  delete: (id: string) => api.delete(`/contrats/${id}`),
};
