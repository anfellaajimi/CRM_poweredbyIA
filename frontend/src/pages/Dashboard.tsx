import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Users, Briefcase, DollarSign, FileText, AlertTriangle, TrendingUp,
  Zap, Loader2, CheckCircle2, Sparkles, X, ExternalLink, LayoutDashboard, Download
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { dashboardAPI, rappelsAPI, clientsAPI, projectsAPI, facturesAPI, aiMonitoringAPI } from '../services/api';
import { useSidebarStore } from '../store/sidebarStore';
import { useNotificationStore } from '../store/notificationStore';
import { toast } from 'sonner';

type CategoryType = 'clients' | 'projects' | 'revenue' | 'invoices' | 'monitoring';

const BG      = 'var(--background)';
const CARD    = 'var(--card)';
const BORDER  = 'var(--border)';
const MUTED   = 'var(--muted-foreground)';
const TEXT    = 'var(--foreground)';
const SUBTEXT = 'var(--muted-foreground)';
const C_RED    = '#ff5c75';
const C_GREEN  = '#28d094';
const C_BLUE   = '#00b5e2';
const C_YELLOW = '#ffc107';
const C_PURPLE = '#926dde';
const C_PINK   = '#f77eb9';
const CHART_COLORS = [C_PURPLE, C_BLUE, C_GREEN, C_YELLOW, C_RED, C_PINK];

const InfobulleSombre = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1d2e', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px' }}>
      <p style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => {
        const textColor = p.color && typeof p.color === 'string' && !p.color.startsWith('url') ? p.color : C_BLUE;
        return (
          <p key={i} style={{ color: textColor, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && String(p.dataKey).toLowerCase().includes('rev')
              ? `${p.value.toLocaleString()} DT` : p.value}
          </p>
        );
      })}
    </div>
  );
};

const JaugeCirculaire: React.FC<{ valeur: number; max: number; couleur: string; taille?: number }> = ({
  valeur, max, couleur, taille = 72,
}) => {
  const pct = Math.min(valeur / max, 1);
  const r = (taille - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={taille} height={taille} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke={`${couleur}22`} strokeWidth={5} />
      <circle cx={taille / 2} cy={taille / 2} r={r} fill="none" stroke={couleur} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
};

const CarteKPI: React.FC<{
  libelle: string; valeur: string; sousTitre: string;
  icone: React.ElementType; couleur: string;
  jaugeValeur: number; jaugeMax: number; index: number;
  onClick?: () => void;
}> = ({ libelle, valeur, sousTitre, icone: Icone, couleur, jaugeValeur, jaugeMax, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)', cursor: onClick ? 'pointer' : 'default' }}
    whileTap={{ scale: 0.98 }}
    transition={{ delay: index * 0.07, duration: 0.35 }}
    onClick={onClick}
    style={{
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 18,
      position: 'relative', overflow: 'hidden',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: couleur, borderRadius: '10px 10px 0 0' }} />
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <JaugeCirculaire valeur={jaugeValeur} max={jaugeMax} couleur={couleur} />
      <div style={{ position: 'absolute' }}><Icone size={20} color={couleur} /></div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ color: MUTED, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{libelle}</p>
      <p style={{ color: TEXT, fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>{valeur}</p>
      <p style={{ color: SUBTEXT, fontSize: 11 }}>{sousTitre}</p>
    </div>
  </motion.div>
);

const CarteSombre: React.FC<{ titre?: string; children: React.ReactNode; style?: React.CSSProperties; delay?: number; onClick?: () => void }> = ({
  titre, children, style, delay = 0, onClick
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { y: -4, boxShadow: '0 12px 20px -10px rgba(0,0,0,0.08)', cursor: 'pointer' } : {}}
    transition={{ delay, duration: 0.35 }}
    onClick={onClick}
    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', position: 'relative', ...style }}
  >
    {titre && (
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{titre}</span>
      </div>
    )}
    <div style={{ padding: 20 }}>{children}</div>
  </motion.div>
);

const LigneActivite: React.FC<{ message: string; horodatage: string; index: number }> = ({ message, horodatage, index }) => {
  const couleurs = [C_PURPLE, C_BLUE, C_GREEN, C_PINK, C_YELLOW];
  const c = couleurs[index % couleurs.length];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14, borderBottom: `1px solid ${BORDER}`, marginBottom: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${c}20`, border: `1px solid ${c}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <TrendingUp size={14} color={c} />
      </div>
      <div>
        <p style={{ color: SUBTEXT, fontSize: 13, lineHeight: 1.45, marginBottom: 3 }}>{message}</p>
        <p style={{ color: MUTED, fontSize: 11 }}>{horodatage}</p>
      </div>
    </div>
  );
};

const LigneRappel: React.FC<{ title: string; dateLimite: string; priorite: string }> = ({ title, dateLimite, priorite }) => {
  const estHaute = String(priorite).toLowerCase().includes('eleve') || String(priorite).toLowerCase() === 'haute';
  const couleur = estHaute ? C_RED : C_YELLOW;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14, borderBottom: `1px solid ${BORDER}`, marginBottom: 14 }}>
      <AlertTriangle size={16} color={couleur} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ color: SUBTEXT, fontSize: 13, fontWeight: 500 }}>{title}</p>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${couleur}20`, color: couleur, border: `1px solid ${couleur}40`, whiteSpace: 'nowrap' }}>
            {priorite}
          </span>
        </div>
        <p style={{ color: MUTED, fontSize: 11, marginTop: 3 }}>{dateLimite}</p>
      </div>
    </div>
  );
};

const LigneSupervision: React.FC<{ libelle: string; valeur: number; couleur: string; fond: string; badgeLabel: string }> = ({
  libelle, valeur, couleur, fond, badgeLabel,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: fond, borderRadius: 8, border: `1px solid ${couleur}30`, marginBottom: 10 }}>
    <p style={{ color: TEXT, fontSize: 13, fontWeight: 500 }}>{libelle} : {valeur}</p>
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${couleur}25`, color: couleur, border: `1px solid ${couleur}50` }}>
      {badgeLabel}
    </span>
  </div>
);

const AIScanOverlay: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(26, 29, 46, 0.85)',
      backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24
    }}
  >
    <div style={{ position: 'relative' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ width: 120, height: 120, borderRadius: '50%', border: `2px dashed ${C_BLUE}60` }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} color={C_BLUE} className="animate-spin" />
      </div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ position: 'absolute', inset: -20, background: `radial-gradient(circle, ${C_BLUE}30 0%, transparent 70%)`, borderRadius: '50%' }}
      />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Exécution IA en cours...</h2>
      <p style={{ color: MUTED, fontSize: 14 }}>Analyse des données et génération des automatisations</p>
    </div>
    <motion.div
      initial={{ width: 0 }} animate={{ width: 300 }}
      style={{ height: 4, background: '#ffffff10', borderRadius: 2, overflow: 'hidden' }}
    >
      <motion.div
        animate={{ x: [-300, 300] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 100, height: '100%', background: C_BLUE, boxShadow: `0 0 15px ${C_BLUE}` }}
      />
    </motion.div>
  </motion.div>
);
const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div style={{ marginBottom: 4 }}>
    <p style={{ color: MUTED, fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
    <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: 0 }}>{value || '—'}</p>
  </div>
);

const CategoryDetailOverlay: React.FC<{ category: CategoryType; onClose: () => void; dashboardData: any }> = ({ category, onClose, dashboardData }) => {
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const navigate = useNavigate();
  
  const { data: clients } = useQuery({ queryKey: ['clients-all'], queryFn: () => clientsAPI.getAll(), enabled: category === 'clients' || category === 'monitoring' });
  const { data: projects } = useQuery({ queryKey: ['projects-all'], queryFn: projectsAPI.getAll, enabled: category === 'projects' || category === 'monitoring' });
  const { data: invoices } = useQuery({ queryKey: ['invoices-all'], queryFn: facturesAPI.getAll, enabled: category === 'invoices' || category === 'revenue' || category === 'monitoring' });
  const { data: monitoring } = useQuery({ queryKey: ['monitoring-all'], queryFn: aiMonitoringAPI.getAll, enabled: category === 'monitoring' });
  const { data: agentActivity } = useQuery({ queryKey: ['agent-activity'], queryFn: aiMonitoringAPI.getAgentActivity, enabled: category === 'monitoring' });

  const getCategoryTheme = () => {
    switch (category) {
      case 'clients': return { title: 'Détails Clients', icon: Users, color: C_RED };
      case 'projects': return { title: 'Détails Projets', icon: Briefcase, color: C_GREEN };
      case 'revenue': return { title: 'Analyse des Revenus', icon: DollarSign, color: C_YELLOW };
      case 'invoices': return { title: 'Suivi des Factures', icon: FileText, color: C_PINK };
      case 'monitoring': return { title: 'Supervision Système', icon: Zap, color: C_BLUE };
    }
  };

  const theme = getCategoryTheme();
  
  const relatedActivities = dashboardData.activities.filter((a: any) => {
    const msg = a.message.toLowerCase();
    if (category === 'clients') return msg.includes('client');
    if (category === 'projects') return msg.includes('projet') || msg.includes('jalon');
    if (category === 'invoices') return msg.includes('facture');
    if (category === 'revenue') return msg.includes('facture') || msg.includes('revenu');
    return true;
  });

  const relatedReminders = dashboardData.reminders.filter((r: any) => {
    const titre = r.title.toLowerCase();
    if (category === 'clients') return titre.includes('client');
    if (category === 'projects') return titre.includes('projet') || titre.includes('jalon');
    if (category === 'invoices') return titre.includes('facture');
    if (category === 'revenue') return titre.includes('facture');
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      style={{
        position: 'fixed', inset: 0, background: BG, zIndex: 11000,
        padding: '40px 60px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 32
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `${theme.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <theme.icon size={32} color={theme.color} />
          </div>
          <h2 style={{ color: TEXT, fontSize: 32, fontWeight: 800, margin: 0 }}>{theme.title}</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED }}
        >
          <X size={24} />
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1.5fr 1.5fr' : '2fr 1fr', gap: 32, flex: 1 }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ color: TEXT, fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 18, background: theme.color, borderRadius: 2 }} />
            Données du travail
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: MUTED, fontSize: 12, textTransform: 'uppercase' }}>Détail / Entité</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: MUTED, fontSize: 12, textTransform: 'uppercase' }}>Statut</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: MUTED, fontSize: 12, textTransform: 'uppercase' }}>Valeur / Info</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {category === 'clients' && clients?.map((c: any) => (
                  <motion.tr 
                    key={c.id} 
                    whileHover={{ background: '#fafbfc' }}
                    onClick={() => setSelectedItem(c)}
                    style={{ borderBottom: `1px solid ${BG}`, cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <td style={{ padding: '16px', color: TEXT, fontWeight: 600 }}>{c.name} {c.prenom}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, background: `${C_GREEN}15`, color: C_GREEN, fontWeight: 700 }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '16px', color: SUBTEXT, fontSize: 14 }}>{c.email}</td>
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/clients/${c.id}`); }}
                        style={{ background: 'none', border: 'none', color: C_BLUE, cursor: 'pointer', padding: 4 }}
                        title="Ouvrir la fiche complète"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {category === 'projects' && projects?.map((p: any) => (
                  <motion.tr 
                    key={p.id} 
                    whileHover={{ background: '#fafbfc' }}
                    onClick={() => setSelectedItem(p)}
                    style={{ borderBottom: `1px solid ${BG}`, cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <td style={{ padding: '16px', color: TEXT, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, background: `${C_BLUE}15`, color: C_BLUE, fontWeight: 700 }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '16px', color: SUBTEXT, fontSize: 14 }}>{p.progress}% terminé</td>
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/projects/${p.id}`); }}
                        style={{ background: 'none', border: 'none', color: C_BLUE, cursor: 'pointer', padding: 4 }}
                        title="Ouvrir la fiche complète"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {(category === 'invoices' || category === 'revenue') && invoices?.map((inv: any) => (
                  <motion.tr 
                    key={inv.id} 
                    whileHover={{ background: '#fafbfc' }}
                    onClick={() => setSelectedItem(inv)}
                    style={{ borderBottom: `1px solid ${BG}`, cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <td style={{ padding: '16px', color: TEXT, fontWeight: 600 }}>{inv.id}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, background: `${C_YELLOW}15`, color: C_YELLOW, fontWeight: 700 }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '16px', color: TEXT, fontWeight: 700 }}>{inv.amount.toLocaleString()} {inv.devise}</td>
                    <td style={{ padding: '16px' }}></td>
                  </motion.tr>
                ))}
                {category === 'monitoring' && (
                  <>
                    {monitoring?.map((m: any) => (
                      <tr key={m.monitoringID} style={{ borderBottom: `1px solid ${BG}` }}>
                        <td style={{ padding: '16px', color: TEXT, fontWeight: 600 }}>{m.serviceName}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, background: m.status === 'healthy' ? `${C_GREEN}15` : `${C_RED}15`, color: m.status === 'healthy' ? C_GREEN : C_RED, fontWeight: 700 }}>{m.status}</span>
                        </td>
                        <td style={{ padding: '16px', color: SUBTEXT, fontSize: 14 }}>{m.responseTime}ms de réponse</td>
                        <td style={{ padding: '16px' }}></td>
                      </tr>
                    ))}
                    {agentActivity?.alerts?.map((a: any) => (
                      <motion.tr 
                        key={`alert-${a.id}`} 
                        whileHover={{ background: '#fafbfc' }}
                        onClick={() => setSelectedItem({ ...a, _type: 'ai_alert' })}
                        style={{ borderBottom: `1px solid ${BG}`, cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <td style={{ padding: '16px', color: TEXT, fontWeight: 600 }}>{a.title}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            padding: '4px 12px', borderRadius: 20, fontSize: 11, 
                            background: (a.priority || '').toLowerCase() === 'elevee' ? `${C_RED}15` : `${C_YELLOW}15`, 
                            color: (a.priority || '').toLowerCase() === 'elevee' ? C_RED : C_YELLOW, 
                            fontWeight: 700 
                          }}>
                            {a.priority || 'Normale'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: SUBTEXT, fontSize: 14 }}>{a.message}</td>
                        <td style={{ padding: '16px' }}>
                          {a.projectId && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/projects/${a.projectId}`); }}
                              style={{ background: 'none', border: 'none', color: C_BLUE, cursor: 'pointer', padding: 4 }}
                              title="Ouvrir le projet lié"
                            >
                              <ExternalLink size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ background: '#fff', border: `1px solid ${theme.color}40`, borderRadius: 24, padding: 32, boxShadow: `0 10px 40px ${theme.color}10`, position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                  <h3 style={{ color: TEXT, fontSize: 20, fontWeight: 800, margin: 0 }}>Informations complètes</h3>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    style={{ border: 'none', background: `${C_RED}15`, color: C_RED, padding: 8, borderRadius: 8, cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {category === 'clients' && (
                    <>
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px', background: `${theme.color}08`, borderRadius: 12 }}>
                        <Users size={20} color={theme.color} />
                        <div>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>{selectedItem.name} {selectedItem.prenom}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: theme.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {selectedItem.type === 'Moral' ? '🏢 Personne Morale' : '👤 Personne Physique'}
                          </p>
                        </div>
                      </div>

                      {/* Common Fields */}
                      <DetailItem label="Email" value={selectedItem.email} />
                      <DetailItem label="Téléphone" value={selectedItem.phone} />
                      <DetailItem label="Adresse" value={selectedItem.adresse} />
                      <DetailItem label="Statut" value={selectedItem.status} />

                      {/* Type-Specific Fields */}
                      <div style={{ gridColumn: 'span 2', height: 1, background: BORDER, margin: '8px 0' }} />
                      
                      {selectedItem.type === 'Physique' ? (
                        <>
                          <DetailItem label="CIN" value={selectedItem.cin} />
                          <DetailItem label="Date de Naissance" value={selectedItem.dateNaissance} />
                        </>
                      ) : (
                        <>
                          <DetailItem label="Entreprise" value={selectedItem.company} />
                          <DetailItem label="Raison Sociale" value={selectedItem.raisonSociale} />
                          <DetailItem label="Matricule Fiscale" value={selectedItem.matriculeFiscale} />
                          <DetailItem label="Secteur" value={selectedItem.secteurActivite} />
                        </>
                      )}

                      <div style={{ gridColumn: 'span 2', height: 1, background: BORDER, margin: '8px 0' }} />
                      <DetailItem label="Devise" value={selectedItem.devise} />
                      <DetailItem label="Client depuis le" value={selectedItem.createdAt} />

                      <div style={{ gridColumn: 'span 2', paddingTop: 16 }}>
                        <button 
                          onClick={() => {
                            onClose();
                            navigate(`/clients/${selectedItem.id}`);
                          }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: `linear-gradient(135deg, ${C_PURPLE}, ${C_BLUE})`, color: '#fff',
                            border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(146, 109, 222, 0.2)'
                          }}
                        >
                          <ExternalLink size={16} />
                          Voir les détails complets
                        </button>
                      </div>
                    </>
                  )}
                  {category === 'projects' && (
                    <>
                      <DetailItem label="Nom du Projet" value={selectedItem.name} />
                      <DetailItem label="Client ID" value={selectedItem.clientId} />
                      <DetailItem label="Budget" value={`${Number(selectedItem.budget).toLocaleString()} ${selectedItem.devise || 'TND'}`} />
                      <DetailItem label="Dépenses" value={`${Number(selectedItem.spent).toLocaleString()} ${selectedItem.devise || 'TND'}`} />
                      <DetailItem label="Date Début" value={selectedItem.startDate} />
                      <DetailItem label="Date Fin" value={selectedItem.deadline} />
                      <DetailItem label="Progrès" value={`${selectedItem.progress}%`} />
                      <DetailItem label="Statut" value={selectedItem.status} />

                      <div style={{ gridColumn: 'span 2', paddingTop: 16 }}>
                        <button 
                          onClick={() => {
                            onClose();
                            navigate(`/projects/${selectedItem.id}`);
                          }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: `linear-gradient(135deg, ${C_GREEN}, ${C_BLUE})`, color: '#fff',
                            border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(40, 208, 148, 0.2)'
                          }}
                        >
                          <ExternalLink size={16} />
                          Voir les détails complets
                        </button>
                      </div>
                    </>
                  )}
                  {(category === 'invoices' || category === 'revenue') && (
                    <>
                      <DetailItem label="ID Facture" value={selectedItem.id} />
                      <DetailItem label="Client ID" value={selectedItem.clientId} />
                      <DetailItem label="Montant TTC" value={`${Number(selectedItem.amount).toLocaleString()} ${selectedItem.devise}`} />
                      <DetailItem label="Date Émission" value={selectedItem.issuedAt} />
                      <DetailItem label="Échéance" value={selectedItem.dueAt} />
                      <DetailItem label="Date Paiement" value={selectedItem.paidAt} />
                      <DetailItem label="Statut" value={selectedItem.status} />

                      <div style={{ gridColumn: 'span 2', paddingTop: 16 }}>
                        <button 
                          onClick={() => {
                            facturesAPI.exportPDF(selectedItem.id, `Facture_${selectedItem.id}.pdf`);
                          }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: `linear-gradient(135deg, ${C_BLUE}, ${C_PURPLE})`, color: '#fff',
                            border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(146, 109, 222, 0.2)'
                          }}
                        >
                          <FileText size={16} />
                          Télécharger la Facture (PDF)
                        </button>
                      </div>
                    </>
                  )}
                  {selectedItem._type === 'ai_alert' && (
                    <>
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px', background: `${C_BLUE}08`, borderRadius: 12 }}>
                        <Sparkles size={20} color={C_BLUE} />
                        <div>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>{selectedItem.title}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C_BLUE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alerte IA Système</p>
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <DetailItem label="Message" value={selectedItem.message} />
                      </div>
                      <DetailItem label="Priorité" value={selectedItem.priority} />
                      <DetailItem label="Détectée le" value={new Date(selectedItem.createdAt).toLocaleString()} />
                      <DetailItem label="Statut" value={selectedItem.status} />
                      
                      {/* Related Entity Details */}
                      {(() => {
                        if (selectedItem.factureId) {
                          const f = invoices?.find((i: any) => i.id === selectedItem.factureId);
                          if (f) return (
                            <div style={{ gridColumn: 'span 2', marginTop: 12, padding: 16, background: '#f8faff', borderRadius: 16, border: `1px solid ${C_BLUE}20` }}>
                              <p style={{ fontSize: 12, fontWeight: 800, color: C_BLUE, textTransform: 'uppercase', marginBottom: 12 }}>Détails de la Facture liée</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <DetailItem label="ID Facture" value={f.id} />
                                <DetailItem label="Montant" value={`${f.amount.toLocaleString()} ${f.devise}`} />
                                <DetailItem label="Échéance" value={f.dueAt} />
                                <DetailItem label="Statut" value={f.status} />
                              </div>
                            </div>
                          );
                        }
                        if (selectedItem.projectId) {
                          const p = projects?.find((i: any) => i.id === selectedItem.projectId);
                          if (p) return (
                            <div style={{ gridColumn: 'span 2', marginTop: 12, padding: 16, background: '#f8faff', borderRadius: 16, border: `1px solid ${C_GREEN}20` }}>
                              <p style={{ fontSize: 12, fontWeight: 800, color: C_GREEN, textTransform: 'uppercase', marginBottom: 12 }}>Détails du Projet lié</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <DetailItem label="Nom" value={p.name} />
                                <DetailItem label="Progrès" value={`${p.progress}%`} />
                                <DetailItem label="Budget" value={`${p.budget.toLocaleString()} ${p.devise}`} />
                                <DetailItem label="Deadline" value={p.deadline} />
                              </div>
                            </div>
                          );
                        }
                        if (selectedItem.clientId) {
                          const c = clients?.find((i: any) => i.id === selectedItem.clientId);
                          if (c) return (
                            <div style={{ gridColumn: 'span 2', marginTop: 12, padding: 16, background: '#f8faff', borderRadius: 16, border: `1px solid ${C_RED}20` }}>
                              <p style={{ fontSize: 12, fontWeight: 800, color: C_RED, textTransform: 'uppercase', marginBottom: 12 }}>Détails du Client lié</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <DetailItem label="Nom" value={`${c.name} ${c.prenom}`} />
                                <DetailItem label="Email" value={c.email} />
                                <DetailItem label="Tel" value={c.phone} />
                                <DetailItem label="Ville" value={c.ville} />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, paddingTop: 16 }}>
                        <button 
                          onClick={() => {
                            if (selectedItem.factureId) {
                               facturesAPI.exportPDF(selectedItem.factureId, `Facture_${selectedItem.factureId}.pdf`);
                            } else {
                               toast.info("Téléchargement du rapport d'analyse en cours...");
                            }
                          }}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: `linear-gradient(135deg, ${C_BLUE}, ${C_PURPLE})`, color: '#fff',
                            border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(146, 109, 222, 0.2)'
                          }}
                        >
                          <Download size={16} />
                          Télécharger
                        </button>
                        
                        {(selectedItem.projectId || selectedItem.clientId) && (
                          <button 
                            onClick={() => {
                              onClose();
                              if (selectedItem.projectId) navigate(`/projects/${selectedItem.projectId}`);
                              else if (selectedItem.clientId) navigate(`/clients/${selectedItem.clientId}`);
                            }}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              background: '#fff', color: TEXT,
                              border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            <ExternalLink size={16} />
                            Voir Fiche
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div style={{ background: '#1a1d2e', borderRadius: 24, padding: 28, color: '#fff', boxShadow: '0 10px 30px rgba(26,29,46,0.2)' }}>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={18} color={C_BLUE} /> Les Actions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {relatedActivities.length > 0 ? relatedActivities.slice(0, 5).map((a: any, i: number) => (
                      <div key={i} style={{ borderLeft: `2px solid ${C_BLUE}40`, paddingLeft: 16 }}>
                        <p style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>{a.message}</p>
                        <p style={{ fontSize: 11, color: MUTED }}>{a.timestamp}</p>
                      </div>
                    )) : <p style={{ color: MUTED, fontSize: 13 }}>Aucune action récente.</p>}
                  </div>
                </div>
                <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 24, padding: 28 }}>
                  <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Rappels programmés</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {relatedReminders.length > 0 ? relatedReminders.map((r: any) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: BG, borderRadius: 12 }}>
                        <AlertTriangle size={14} color={r.priorite === 'elevee' ? C_RED : C_YELLOW} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                          <p style={{ fontSize: 11, color: SUBTEXT }}>{r.dateLimite}</p>
                        </div>
                      </div>
                    )) : <p style={{ color: MUTED, fontSize: 13 }}>Aucun rappel immédiat.</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};



const ExpandedChartOverlay: React.FC<{ title: string; data: any; onClose: () => void }> = ({ title, data, onClose }) => {
  const renderChart = () => {
    switch (title) {
      case 'Aperçu des revenus':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={data.revenueData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: TEXT, fontSize: 13 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: TEXT, fontSize: 13 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <Tooltip content={<InfobulleSombre />} cursor={{ fill: '#ffffff06' }} />
              <defs>
                <linearGradient id="grad-barre-exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_PURPLE} /><stop offset="100%" stopColor={C_BLUE} />
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="url(#grad-barre-exp)" radius={[8, 8, 0, 0]} name="Revenus" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'Statistiques':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={data.revenueData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: TEXT, fontSize: 13 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: TEXT, fontSize: 13 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <Tooltip content={<InfobulleSombre />} cursor={{ fill: '#ffffff06' }} />
              <Bar dataKey="revenue" fill={C_BLUE} radius={[8, 8, 0, 0]} name="Valeur" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'Évolution de la clientèle':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={data.clientGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: TEXT, fontSize: 13 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: TEXT, fontSize: 13 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <Tooltip content={<InfobulleSombre />} />
              <Legend wrapperStyle={{ color: TEXT, fontSize: 13, paddingTop: 20 }} />
              <defs>
                <linearGradient id="grad-ligne-exp" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C_GREEN} /><stop offset="100%" stopColor={C_BLUE} />
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="clients" stroke="url(#grad-ligne-exp)" strokeWidth={4}
                dot={{ fill: C_GREEN, r: 5, strokeWidth: 0 }} activeDot={{ r: 8, fill: C_BLUE }} name="Clients" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'Répartition des statuts des projets':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie 
                data={data.projectStatusData} 
                cx="50%" cy="50%" 
                innerRadius={100} outerRadius={180}
                paddingAngle={5} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: BORDER, strokeWidth: 1 }}
              >
                {data.projectStatusData.map((_: any, i: number) => (
                   <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<InfobulleSombre />} />
              <Legend wrapperStyle={{ color: TEXT, fontSize: 13, paddingTop: 20 }} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed', inset: 0, background: BG, zIndex: 12000,
        padding: '60px 80px', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h2 style={{ color: TEXT, fontSize: 32, fontWeight: 800, margin: 0 }}>{title}</h2>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED }}
        >
          <X size={24} />
        </motion.button>
      </div>
      <div style={{ flex: 1, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 24, padding: 40, boxShadow: '0 15px 40px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {renderChart()}
      </div>
    </motion.div>
  );
};


export const Dashboard: React.FC = () => {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = React.useState<CategoryType | null>(null);
  const [expandedChart, setExpandedChart] = React.useState<string | null>(null);
  const { isFullScreen, setFullScreen } = useSidebarStore();
  const { addMultipleNotifications } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardAPI.overview,
  });

  const runExecution = useMutation({
    mutationFn: rappelsAPI.generate,
    onSuccess: (res) => {
      const allLogs = [
        ...(res.data.generated?.logs || []),
        ...(res.data.emails?.logs || [])
      ];

      const newNotifs = allLogs.map((log: string) => {
        let type: 'error' | 'warning' | 'success' | 'info' = 'info';
        if (log.toLowerCase().includes('erreur') || log.toLowerCase().includes('échec')) type = 'error';
        else if (log.toLowerCase().includes('alerte')) type = 'warning';
        else if (log.toLowerCase().includes('créé') || log.toLowerCase().includes('envoyé')) type = 'success';
        
        return { type, message: log };
      });

      if (newNotifs.length > 0) {
        addMultipleNotifications(newNotifs);
      } else {
        addMultipleNotifications([{ type: 'info', message: 'Exécution terminée. Aucune nouvelle action.' }]);
      }

      qc.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('Exécution automatique terminée. Vérifiez vos notifications.');
    },
    onError: () => {
      toast.error("Erreur lors de l'exécution automatique");
    }
  });

  const handleManualTrigger = () => {
    runExecution.mutate();
  };

  const { data: healthStats = {} } = useQuery({
    queryKey: ['health-stats-dashboard'],
    queryFn: () => aiMonitoringAPI.getHealthStats(24),
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color={MUTED} className="animate-spin" />
        <p style={{ color: MUTED, fontSize: 14, marginLeft: 12 }}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const kpis = [
    { libelle: 'Total clients', valeur: String(data.kpis.totalClients), sousTitre: 'Clients enregistrés', icone: Users, couleur: C_RED, jaugeValeur: data.kpis.totalClients, jaugeMax: 50, category: 'clients' },
    { libelle: 'Projets actifs', valeur: String(data.kpis.activeProjects), sousTitre: 'En cours de réalisation', icone: Briefcase, couleur: C_GREEN, jaugeValeur: data.kpis.activeProjects, jaugeMax: 20, category: 'projects' },
    { libelle: 'Revenus ce mois', valeur: `${Number(data.kpis.monthlyRevenue).toLocaleString()} DT`, sousTitre: "Chiffre d'affaires mensuel", icone: DollarSign, couleur: C_YELLOW, jaugeValeur: data.kpis.monthlyRevenue, jaugeMax: 5000, category: 'revenue' },
    { libelle: 'Factures en attente', valeur: String(data.kpis.pendingInvoices), sousTitre: 'En attente de règlement', icone: FileText, couleur: C_PINK, jaugeValeur: data.kpis.pendingInvoices, jaugeMax: 20, category: 'invoices' },
  ];

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '28px 30px', fontFamily: "'Nunito', 'DM Sans', system-ui, sans-serif", position: 'relative' }}>
      
      <AnimatePresence>
        {runExecution.isPending && <AIScanOverlay />}
        {activeCategory && <CategoryDetailOverlay category={activeCategory} dashboardData={data} onClose={() => setActiveCategory(null)} />}
        {expandedChart && <ExpandedChartOverlay title={expandedChart} data={data} onClose={() => setExpandedChart(null)} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 700, margin: 0 }}>Tableau de bord</h1>
          <p style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>Données en temps réel depuis le serveur.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setFullScreen(!isFullScreen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: isFullScreen ? C_PURPLE : '#fff',
              color: isFullScreen ? '#fff' : TEXT,
              border: `1px solid ${isFullScreen ? C_PURPLE : BORDER}`,
              borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
              boxShadow: isFullScreen ? '0 4px 12px rgba(146, 109, 222, 0.3)' : 'none'
            }}
          >
            <Zap size={16} />
            {isFullScreen ? 'Quitter Plein Écran' : 'Mode Plein Écran'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleManualTrigger}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: `linear-gradient(135deg, ${C_PURPLE}, ${C_BLUE})`,
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(146, 109, 222, 0.3)'
            }}
          >
            <Sparkles size={16} />
            Exécution IA
          </motion.button>
        </div>
      </motion.div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <CarteKPI key={k.libelle} {...k} index={i} onClick={() => setActiveCategory(k.category as CategoryType)} />
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 24 }}>
        <CarteSombre titre="Aperçu des revenus" delay={0.4} onClick={() => setExpandedChart('Aperçu des revenus')}>
          <div style={{ padding: '0 10px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.revenueData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<InfobulleSombre />} cursor={{ fill: '#ffffff06' }} />
                <defs>
                  <linearGradient id="grad-barre" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_PURPLE} /><stop offset="100%" stopColor={C_BLUE} />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#grad-barre)" radius={[4, 4, 0, 0]} name="Revenus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CarteSombre>

        <CarteSombre titre="Évolution de la clientèle" delay={0.45} onClick={() => setExpandedChart('Évolution de la clientèle')}>
          <div style={{ padding: '0 10px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.clientGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<InfobulleSombre />} />
                <Legend wrapperStyle={{ color: SUBTEXT, fontSize: 11 }} />
                <Line type="monotone" dataKey="clients" stroke={C_GREEN} strokeWidth={2.5}
                  dot={{ fill: C_GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Clients" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CarteSombre>

        <CarteSombre titre="Répartition des projets" delay={0.5} onClick={() => setExpandedChart('Répartition des statuts des projets')}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={data.projectStatusData} 
                cx="50%" cy="50%" 
                innerRadius={45} outerRadius={65} 
                paddingAngle={4} dataKey="value"
              >
                {data.projectStatusData.map((_: any, i: number) => (
                   <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<InfobulleSombre />} />
              <Legend wrapperStyle={{ color: SUBTEXT, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CarteSombre>
      </div>

      {/* Activité + Échéances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        <CarteSombre titre="Activité récente" delay={0.58}>
          {data.activities.length === 0
            ? <p style={{ color: MUTED, fontSize: 13 }}>Aucune activité récente.</p>
            : data.activities.map((a: any, i: number) => (
                <LigneActivite key={a.id} message={a.message} horodatage={a.timestamp} index={i} />
              ))}
        </CarteSombre>

        <CarteSombre titre="Échéances à venir" delay={0.62}>
          {data.reminders.length === 0
            ? <p style={{ color: MUTED, fontSize: 13 }}>Aucune échéance prévue.</p>
            : data.reminders.map((r: any, i: number) => (
                <LigneRappel key={r.id} title={r.title} dateLimite={r.dateLimite} priorite={r.priorite} />
              ))}
        </CarteSombre>
      </div>

      {/* Disponibilité des Services */}
      <div style={{ gridColumn: 'span 12' }}>
        <CarteSombre titre="Disponibilité des Services (24h)" delay={0.62} onClick={() => navigate('/ai-monitoring')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {['Frontend', 'Backend', 'Agent IA', 'Database'].map((svc) => {
              const uptime = (healthStats && typeof healthStats === 'object') ? healthStats[svc] : undefined;
              const hasData = uptime !== undefined;
              return (
                <div key={svc} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>{svc}</p>
                  <div style={{ fontSize: 18, fontWeight: 700, color: !hasData ? MUTED : uptime > 99 ? C_GREEN : C_YELLOW }}>
                    {hasData ? `${uptime}%` : '--%'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: !hasData ? MUTED : uptime > 99 ? C_GREEN : C_YELLOW, boxShadow: hasData ? `0 0 10px ${uptime > 99 ? C_GREEN : C_YELLOW}` : 'none' }} />
                    <span style={{ fontSize: 9, fontWeight: 600 }}>{hasData ? 'ACTIF' : 'SCAN...'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CarteSombre>
      </div>

      {/* Supervision IA */}
      <CarteSombre titre="Supervision IA" delay={0.66} onClick={() => setActiveCategory('monitoring')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <LigneSupervision libelle="Opérationnel" valeur={data.monitoring.healthy}  couleur={C_GREEN}  fond={`${C_GREEN}12`}  badgeLabel="OK" />
          <LigneSupervision libelle="Avertissement" valeur={data.monitoring.warning}  couleur={C_YELLOW} fond={`${C_YELLOW}12`} badgeLabel="Attention" />
          <LigneSupervision libelle="Critique"      valeur={data.monitoring.critical} couleur={C_RED}    fond={`${C_RED}12`}    badgeLabel="Critique" />
        </div>
      </CarteSombre>
    </div>
  );
};