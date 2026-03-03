import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Briefcase, DollarSign, FileText, AlertTriangle, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { motion } from 'motion/react';
import { dashboardAPI } from '../services/api';

const BG      = '#f4f6fb';
const CARD    = '#ffffff';
const BORDER  = '#e2e8f0';
const MUTED   = '#94a3b8';
const TEXT    = '#1e293b';
const SUBTEXT = '#64748b';
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
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || TEXT, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && String(p.dataKey).toLowerCase().includes('rev')
            ? `${p.value.toLocaleString()} DT` : p.value}
        </p>
      ))}
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
}> = ({ libelle, valeur, sousTitre, icone: Icone, couleur, jaugeValeur, jaugeMax, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35 }}
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

const CarteSombre: React.FC<{ titre?: string; children: React.ReactNode; style?: React.CSSProperties; delay?: number }> = ({
  titre, children, style, delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', ...style }}
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

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardAPI.overview,
  });

  if (isLoading || !data) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const kpis = [
    { libelle: 'Total clients', valeur: String(data.kpis.totalClients), sousTitre: 'Clients enregistrés', icone: Users, couleur: C_RED, jaugeValeur: data.kpis.totalClients, jaugeMax: 50 },
    { libelle: 'Projets actifs', valeur: String(data.kpis.activeProjects), sousTitre: 'En cours de réalisation', icone: Briefcase, couleur: C_GREEN, jaugeValeur: data.kpis.activeProjects, jaugeMax: 20 },
    { libelle: 'Revenus ce mois', valeur: `${Number(data.kpis.monthlyRevenue).toLocaleString()} DT`, sousTitre: "Chiffre d'affaires mensuel", icone: DollarSign, couleur: C_YELLOW, jaugeValeur: data.kpis.monthlyRevenue, jaugeMax: 5000 },
    { libelle: 'Factures en attente', valeur: String(data.kpis.pendingInvoices), sousTitre: 'En attente de règlement', icone: FileText, couleur: C_PINK, jaugeValeur: data.kpis.pendingInvoices, jaugeMax: 20 },
  ];

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '28px 30px', fontFamily: "'Nunito', 'DM Sans', system-ui, sans-serif" }}>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 26 }}>
        <h1 style={{ color: TEXT, fontSize: 22, fontWeight: 700, margin: 0 }}>Tableau de bord</h1>
        <p style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>Données en temps réel depuis le serveur.</p>
      </motion.div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
        {kpis.map((k, i) => <CarteKPI key={k.libelle} {...k} index={i} />)}
      </div>

      {/* 3 graphiques côte à côte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginBottom: 24 }}>
        <CarteSombre titre="Aperçu des revenus" delay={0.3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
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
        </CarteSombre>

        <CarteSombre titre="Statistiques" delay={0.36}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<InfobulleSombre />} cursor={{ fill: '#ffffff06' }} />
              <Bar dataKey="revenue" fill={C_BLUE} radius={[4, 4, 0, 0]} name="Valeur" />
            </BarChart>
          </ResponsiveContainer>
        </CarteSombre>

        <CarteSombre titre="Évolution de la clientèle" delay={0.42}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.clientGrowthData}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<InfobulleSombre />} />
              <Legend wrapperStyle={{ color: SUBTEXT, fontSize: 11 }} />
              <defs>
                <linearGradient id="grad-ligne" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C_GREEN} /><stop offset="100%" stopColor={C_BLUE} />
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="clients" stroke="url(#grad-ligne)" strokeWidth={2.5}
                dot={{ fill: C_GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: C_BLUE }} name="Clients" />
            </LineChart>
          </ResponsiveContainer>
        </CarteSombre>
      </div>

      {/* Camembert + Courbe revenus */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
        <CarteSombre titre="Répartition des statuts des projets" delay={0.48}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: BORDER, strokeWidth: 1 }}>
                {data.projectStatusData.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<InfobulleSombre />} />
              <Legend wrapperStyle={{ color: SUBTEXT, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CarteSombre>

        <CarteSombre titre="Revenus totaux" delay={0.54}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.revenueData}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<InfobulleSombre />} />
              <Legend wrapperStyle={{ color: SUBTEXT, fontSize: 11 }} />
              <defs>
                <linearGradient id="grad-rev" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C_GREEN} /><stop offset="100%" stopColor={C_BLUE} />
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="revenue" stroke="url(#grad-rev)" strokeWidth={2.5}
                dot={{ fill: C_GREEN, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Revenus" />
            </LineChart>
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

      {/* Supervision IA */}
      <CarteSombre titre="Supervision IA" delay={0.66}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <LigneSupervision libelle="Opérationnel" valeur={data.monitoring.healthy}  couleur={C_GREEN}  fond={`${C_GREEN}12`}  badgeLabel="OK" />
          <LigneSupervision libelle="Avertissement" valeur={data.monitoring.warning}  couleur={C_YELLOW} fond={`${C_YELLOW}12`} badgeLabel="Attention" />
          <LigneSupervision libelle="Critique"      valeur={data.monitoring.critical} couleur={C_RED}    fond={`${C_RED}12`}    badgeLabel="Critique" />
        </div>
      </CarteSombre>
    </div>
  );
};