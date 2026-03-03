import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { clientsAPI, UIClient } from '../services/api';

const initialClient: Partial<UIClient> = {
  type: 'Physique', name: '', prenom: '', email: '', phone: '',
  company: '', dateNaissance: '', cin: '', raisonSociale: '',
  matriculeFiscale: '', secteurActivite: '', status: 'actif', devise: 'TND'
};

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'actif', label: 'Actif' },
  { key: 'inactif', label: 'Inactif' },
];


const PAGE_SIZE = 10;

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toLowerCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    actif: { bg: '#d1fae5', color: '#059669', label: 'Actif' },
    inactif: { bg: '#fee2e2', color: '#dc2626', label: 'Inactif' },
  };
  const c = cfg[s] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: 12, fontWeight: 600,
      padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap'
    }}>
      {c.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span style={{
    background: type === 'Moral' ? '#ede9fe' : '#e0f2fe',
    color: type === 'Moral' ? '#7c3aed' : '#0284c7',
    fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20
  }}>
    {type}
  </span>
);

const Inp: React.FC<{
  label?: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean;
}> = ({ label, value, onChange, type = 'text', required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}{required && ' *'}</label>}
    <input type={type} value={value} required={required} onChange={e => onChange(e.target.value)}
      style={{
        border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px',
        fontSize: 14, color: '#111827', outline: 'none', background: '#fff'
      }}
      onFocus={e => (e.target.style.borderColor = '#7c3aed')}
      onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
  </div>
);

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<UIClient>>(initialClient);
  const [page, setPage] = useState(1);

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: clientsAPI.getAll });

  const createMutation = useMutation({
    mutationFn: clientsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client ajouté');
      setIsAddModalOpen(false);
      setNewClient(initialClient);
    },
    onError: () => toast.error("Impossible d'ajouter le client"),
  });

  const filtered = useMemo(() => clients.filter(c => {
    const s = searchTerm.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s);
    const matchTab = activeTab === 'all' || (c.status || '').toLowerCase() === activeTab;
    return matchSearch && matchTab;
  }), [clients, searchTerm, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all: clients.length,
    actif: clients.filter(c => (c.status || '').toLowerCase() === 'actif').length,
    inactif: clients.filter(c => (c.status || '').toLowerCase() === 'inactif').length,
  }), [clients]);

  const handleAddClient = () => {
    const type = newClient.type || 'Physique';
    const fullName = type === 'Physique'
      ? `${newClient.name || ''} ${newClient.prenom || ''}`.trim()
      : newClient.raisonSociale || '';
    createMutation.mutate({
      ...newClient, name: fullName,
      company: type === 'Moral' ? newClient.raisonSociale : fullName,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      status: 'actif',
    });
  };

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
        <span style={{ cursor: 'pointer', color: '#7c3aed' }} onClick={() => navigate('/')}>Accueil</span>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 500 }}>Clients</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Clients</h1>
        <button onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 2px 8px #7c3aed44'
          }}>
          <Plus size={16} /> Ajouter Client
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px #0000000a' }}>

        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '14px 4px', marginRight: 24,
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
                  fontWeight: active ? 600 : 400, color: active ? '#7c3aed' : '#64748b',
                  borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent'
                }}>
                {tab.label}
                <span style={{
                  background: active ? '#ede9fe' : '#f1f5f9',
                  color: active ? '#7c3aed' : '#94a3b8',
                  fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20
                }}>
                  {counts[tab.key as keyof typeof counts]}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative', width: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Rechercher clients..." value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              style={{
                width: '100%', border: '1px solid #e2e8f0', borderRadius: 8,
                padding: '8px 12px 8px 36px', fontSize: 14, color: '#374151',
                outline: 'none', background: '#f8fafc', boxSizing: 'border-box'
              }} />
          </div>
          {filtered.length > 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} résultats
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Client', 'Type', 'Email', 'Téléphone', 'Statut', 'Créé le', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 20px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Aucun client trouvé.</td></tr>
              ) : paginated.map(client => (
                <tr key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: '#fff', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={client.avatar || ''} alt={client.name}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ede9fe' }} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{client.name}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{client.company}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}><TypeBadge type={client.type || 'Physique'} /></td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{client.email}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{client.phone}</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={client.status || ''} /></td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{client.createdAt}</td>
                  <td style={{ padding: '14px 20px' }} onClick={e => e.stopPropagation()}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} sur {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{
                width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff',
                cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', opacity: page === 1 ? 0.4 : 1
              }}>
              <ChevronLeft size={15} color="#374151" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0',
                  cursor: 'pointer', fontSize: 13, fontWeight: page === i + 1 ? 700 : 400,
                  background: page === i + 1 ? '#7c3aed' : '#fff',
                  color: page === i + 1 ? '#fff' : '#374151'
                }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{
                width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff',
                cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1
              }}>
              <ChevronRight size={15} color="#374151" />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un Client">
        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={e => { e.preventDefault(); handleAddClient(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['Physique', 'Moral'] as const).map(t => (
              <button key={t} type="button" onClick={() => setNewClient({ ...newClient, type: t })}
                style={{
                  padding: 10, borderRadius: 8, border: `2px solid ${newClient.type === t ? '#7c3aed' : '#e5e7eb'}`,
                  background: newClient.type === t ? '#f5f3ff' : '#fff',
                  color: newClient.type === t ? '#7c3aed' : '#374151',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Inp label="Email" type="email" value={newClient.email || ''} onChange={v => setNewClient({ ...newClient, email: v })} required />
            <Inp label="Téléphone" value={newClient.phone || ''} onChange={v => setNewClient({ ...newClient, phone: v })} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Devise *</label>
            <select value={newClient.devise || 'TND'} onChange={e => setNewClient({ ...newClient, devise: e.target.value })}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', outline: 'none', background: '#fff' }}>
              <option value="TND">Dinar Tunisien (DT)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>
          {newClient.type === 'Physique' ? (<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Inp label="Nom" value={newClient.name || ''} onChange={v => setNewClient({ ...newClient, name: v })} required />
              <Inp label="Prénom" value={newClient.prenom || ''} onChange={v => setNewClient({ ...newClient, prenom: v })} required />
            </div>
            <Inp label="Date de naissance" type="date" value={newClient.dateNaissance || ''} onChange={v => setNewClient({ ...newClient, dateNaissance: v })} required />
            <Inp label="CIN" value={newClient.cin || ''} onChange={v => setNewClient({ ...newClient, cin: v })} required />
          </>) : (<>
            <Inp label="Raison Sociale" value={newClient.raisonSociale || ''} onChange={v => setNewClient({ ...newClient, raisonSociale: v })} required />
            <Inp label="Matricule Fiscale" value={newClient.matriculeFiscale || ''} onChange={v => setNewClient({ ...newClient, matriculeFiscale: v })} />
            <Inp label="Secteur d'activité" value={newClient.secteurActivite || ''} onChange={v => setNewClient({ ...newClient, secteurActivite: v })} />
          </>)}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)}
              style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#fff', color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer'
              }}>
              Annuler
            </button>
            <button type="submit" disabled={createMutation.isPending}
              style={{
                padding: '9px 18px', borderRadius: 8, border: 'none', background: '#7c3aed',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: createMutation.isPending ? 0.7 : 1
              }}>
              {createMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};