import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Calendar, Mail, Phone, Trash2, Edit2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { clientsAPI, projectsAPI, UIClient } from '../services/api';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toLowerCase();
  const cfg: Record<string, { bg: string; color: string }> = {
    actif: { bg: '#d1fae5', color: '#059669' },
    inactif: { bg: '#fee2e2', color: '#dc2626' },
  };
  const c = cfg[s] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
      {status}
    </span>
  );
};

const ScoringBadge: React.FC<{ scoring?: string }> = ({ scoring }) => {
  const s = (scoring || 'Moyen').toLowerCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    'hot 🔥': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'hot': { bg: '#fee2e2', color: '#dc2626', label: 'Hot 🔥' },
    'moyen': { bg: '#fef3c7', color: '#d97706', label: 'Moyen' },
    'faible': { bg: '#f3f4f6', color: '#6b7280', label: 'Faible' },
  };
  const c = cfg[s] || cfg['moyen'];
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
      {c.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span style={{
    background: type === 'Moral' ? '#ede9fe' : '#e0f2fe',
    color: type === 'Moral' ? '#7c3aed' : '#0284c7',
    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20
  }}>
    {type}
  </span>
);

const ProjectStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toLowerCase();
  const colors: Record<string, { bg: string; color: string }> = {
    'en cours': { bg: '#dbeafe', color: '#1d4ed8' },
    'terminé': { bg: '#d1fae5', color: '#059669' },
    'en attente': { bg: '#fef3c7', color: '#d97706' },
    'annulé': { bg: '#fee2e2', color: '#dc2626' },
  };
  const c = colors[s] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
      {status}
    </span>
  );
};

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: '#f5f3ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={16} color="#7c3aed" />
    </div>
    <div>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 14, color: '#0f172a', margin: 0, fontWeight: 500, marginTop: 1 }}>{value || '—'}</p>
    </div>
  </div>
);

const Inp: React.FC<{ label?: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }> = ({
  label, value, onChange, type = 'text', required,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}{required && ' *'}</label>}
    <input type={type} value={value} required={required} onChange={e => onChange(e.target.value)}
      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', outline: 'none', background: '#fff' }}
      onFocus={e => (e.target.style.borderColor = '#7c3aed')}
      onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
  </div>
);

const TABS = ['Vue générale', 'Projets'];

export const ClientDetails: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const edit = searchParams.get('edit');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Vue générale');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Partial<UIClient>>({});

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id], queryFn: () => clientsAPI.getById(id), enabled: !!id,
  });

  const { data: allProjects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsAPI.getAll });

  useEffect(() => {
    if (edit !== '1') return;
    if (!client) return;
    setEditClient(client);
    setIsEditModalOpen(true);
    setSearchParams(prev => {
      prev.delete('edit');
      return prev;
    }, { replace: true });
  }, [client, edit, setSearchParams]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UIClient>) => clientsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client modifié');
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé');
      navigate('/clients');
    },
  });

  const clientProjects = useMemo(() => allProjects.filter(p => p.clientId === id), [allProjects, id]);

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>Chargement...</div>;
  if (!client) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>Client non trouvé</div>;

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
        <span style={{ cursor: 'pointer', color: '#7c3aed' }} onClick={() => navigate('/')}>Accueil</span>
        <span>›</span>
        <span style={{ cursor: 'pointer', color: '#7c3aed' }} onClick={() => navigate('/clients')}>Clients</span>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 500 }}>{client.name}</span>
      </div>

      <button onClick={() => navigate('/clients')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: '#374151',
          cursor: 'pointer', marginBottom: 24
        }}>
        <ArrowLeft size={15} /> Retour
      </button>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20, boxShadow: '0 1px 4px #0000000a' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={client.avatar || ''} alt={client.name}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ede9fe' }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>{client.name}</h1>
              <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 10px' }}>{client.company}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge status={client.status || ''} />
                <TypeBadge type={client.type || ''} />
                <ScoringBadge scoring={client.scoring} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditClient(client); setIsEditModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: '#7c3aed', color: '#fff',
                border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>
              <Edit2 size={14} /> Modifier
            </button>
            <button onClick={() => deleteMutation.mutate()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#dc2626',
                border: '1px solid #fee2e2', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer'
              }}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 20,
        background: '#fff', borderRadius: '14px 14px 0 0', border: '1px solid #e2e8f0', padding: '0 24px'
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 4px', marginRight: 24, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? '#7c3aed' : '#64748b',
                borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent'
              }}>
              {tab}
              {tab === 'Projets' && (
                <span style={{
                  marginLeft: 6, background: '#ede9fe', color: '#7c3aed',
                  fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20
                }}>
                  {clientProjects.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'Vue générale' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 1px 4px #0000000a' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Informations de contact</h3>
            <InfoRow icon={Mail} label="Email" value={client.email || ''} />
            <InfoRow icon={Phone} label="Téléphone" value={client.phone || ''} />
            <InfoRow icon={Building2} label="Entreprise" value={client.company || ''} />
            <InfoRow icon={Calendar} label="Client depuis" value={client.createdAt || ''} />
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 1px 4px #0000000a' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 16px' }}>Statistiques</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f5f3ff', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Briefcase size={18} color="#7c3aed" />
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Total Projets</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>{clientProjects.length}</span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '12px 0 0' }}>Contrats, factures et devis non affichés dans cette vue.</p>
          </div>
        </div>
      )}

      {activeTab === 'Projets' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px #0000000a' }}>
          {clientProjects.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Aucun projet pour ce client.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Projet', 'Description', 'Statut'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 20px', textAlign: 'left', fontSize: 12,
                      fontWeight: 600, color: '#64748b', textTransform: 'uppercase',
                      letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientProjects.map(project => (
                  <tr key={project.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{project.name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>{project.description}</td>
                    <td style={{ padding: '14px 20px' }}><ProjectStatusBadge status={project.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le Client">
        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={e => { e.preventDefault(); updateMutation.mutate(editClient); }}>
          <Inp label="Nom complet" value={editClient.name || ''} onChange={v => setEditClient({ ...editClient, name: v })} required />
          <Inp label="Email" type="email" value={editClient.email || ''} onChange={v => setEditClient({ ...editClient, email: v })} />
          <Inp label="Téléphone" value={editClient.phone || ''} onChange={v => setEditClient({ ...editClient, phone: v })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Devise</label>
              <select value={editClient.devise || 'TND'} onChange={e => setEditClient({ ...editClient, devise: e.target.value })}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', outline: 'none', background: '#fff' }}>
                <option value="TND">Dinar Tunisien (DT)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Scoring</label>
              <select value={editClient.scoring || 'Moyen'} onChange={e => setEditClient({ ...editClient, scoring: e.target.value })}
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', outline: 'none', background: '#fff' }}>
                <option value="Hot 🔥">Hot 🔥</option>
                <option value="Moyen">Moyen</option>
                <option value="Faible">Faible</option>
              </select>
            </div>
          </div>
          <Inp label="Entreprise" value={editClient.company || ''} onChange={v => setEditClient({ ...editClient, company: v })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
            <button type="button" onClick={() => setIsEditModalOpen(false)}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="submit" disabled={updateMutation.isPending}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: updateMutation.isPending ? 0.7 : 1 }}>
              {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
