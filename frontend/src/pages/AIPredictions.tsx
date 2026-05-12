import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  Sparkles, BrainCircuit, BarChart3, LineChart as LineChartIcon,
  Users, Briefcase, DollarSign, Calendar, RefreshCw,
  ChevronRight, Info, ShieldCheck,
  Bot, X, Send, Lightbulb, Cpu, Wallet, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { aiPredictionsAPI } from '../services/api';
import { toast } from 'sonner';

const COLORS = {
  primary: '#926dde',
  secondary: '#00b5e2',
  success: '#28d094',
  warning: '#ffc107',
  danger: '#ff5c75',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/10 rounded-lg p-3 shadow-2xl backdrop-blur-md">
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            {p.name.toLowerCase().includes('revenu') ? ' DT' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PredictionCard = ({ title, value, unit, trend, confidence, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 shadow-sm dark:shadow-none"
  >
    <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
        <Icon size={24} style={{ color }} />
      </div>
      <div className="flex flex-col items-end">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          <ShieldCheck size={10} className="text-emerald-500" /> Confiance IA
        </span>
        <span className="text-sm font-bold text-emerald-500">{confidence}%</span>
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-gray-500 dark:text-white/50 text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{value.toLocaleString()}</h3>
        <span className="text-gray-400 dark:text-white/40 text-lg font-bold">{unit}</span>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
        trend > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}>
        {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(trend)}% vs mois préc.
      </span>
      <span className="text-gray-400 dark:text-white/20 text-[10px] font-medium">Prédiction 3 mois</span>
    </div>
  </motion.div>
);

export const AIPredictions: React.FC = () => {
  const { data: revenue, isLoading: loadingRev, refetch: refetchRev } = useQuery({ 
    queryKey: ['ml-revenue'], 
    queryFn: aiPredictionsAPI.getRevenue 
  });
  const { data: projects, isLoading: loadingProj, refetch: refetchProj } = useQuery({ 
    queryKey: ['ml-projects'], 
    queryFn: aiPredictionsAPI.getProjects 
  });
  const { data: risks, isLoading: loadingRisks, refetch: refetchRisks } = useQuery({ 
    queryKey: ['ml-risks'], 
    queryFn: aiPredictionsAPI.getRisks 
  });
  const { data: performance, isLoading: loadingPerf, refetch: refetchPerf } = useQuery({ 
    queryKey: ['ml-performance'], 
    queryFn: aiPredictionsAPI.getPerformance 
  });
  
  const { data: recommendations, refetch: refetchRecs } = useQuery({ 
    queryKey: ['ml-recommendations'], 
    queryFn: aiPredictionsAPI.getRecommendations 
  });

  const { data: budgetInt, refetch: refetchBudget } = useQuery({ 
    queryKey: ['ml-budget'], 
    queryFn: aiPredictionsAPI.getBudgetIntelligence 
  });



  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Bonjour ! Je suis l\'Assistant IA CRM propulsé par Gemini. Je peux analyser vos données et répondre à vos questions (ex: "Quel sera mon CA en juin ?", "Quel développeur est en surcharge ?").' }
  ]);
  const [isChatting, setIsChatting] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleRecalculate = async () => {
    const promise = aiPredictionsAPI.recalculate();
    toast.promise(promise, {
      loading: 'Analyse IA en cours...',
      success: 'Prédictions mises à jour !',
      error: 'Erreur lors du recalcul.'
    });
    await promise;
    refetchRev(); refetchProj(); refetchRisks(); refetchPerf();
    refetchRecs(); refetchBudget();
  };



  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setIsChatting(true);
    try {
      const res = await aiPredictionsAPI.chat(msg);
      setChatMessages(prev => [...prev, { role: 'bot', text: res.reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Désolé, une erreur est survenue lors de la communication avec Gemini.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const revenueChartData = React.useMemo(() => {
    if (!revenue) return [];
    const historical = revenue[0]?.metadata_json?.historical || [];
    const preds = revenue.map((p: any) => ({
      name: p.period,
      actual: null,
      predicted: p.predicted_value
    }));
    
    const hist = historical.map((h: any) => ({
      name: h.month,
      actual: h.value,
      predicted: null
    }));
    
    return [...hist, ...preds];
  }, [revenue]);

  const projectsChartData = React.useMemo(() => {
    if (!projects) return [];
    const historical = projects[0]?.metadata_json?.historical || [];
    const preds = projects.map((p: any) => ({
      name: p.period,
      actual: null,
      predicted: p.predicted_value
    }));
    
    const hist = historical.map((h: any) => ({
      name: h.month,
      actual: h.value,
      predicted: null
    }));
    
    return [...hist, ...preds];
  }, [projects]);

  const totalPredictedRevenue = revenue?.reduce((acc: number, p: any) => acc + p.predicted_value, 0) || 0;
  const totalPredictedProjects = projects?.reduce((acc: number, p: any) => acc + p.predicted_value, 0) || 0;

  /* tick colors for charts — adapt to mode */
  const tickColor = 'var(--chart-tick, #94a3b8)';
  const gridColor = 'rgba(148,163,184,0.15)';

  return (
    <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-[#0f111a] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <BrainCircuit className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-white/40 bg-clip-text text-transparent">
              Prédictions IA
            </h1>
          </div>
          <p className="text-gray-500 dark:text-white/40 font-medium">Analyse prédictive et optimisation business basée sur vos données réelles.</p>
        </div>
        <button
          onClick={handleRecalculate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all font-bold text-sm text-gray-700 dark:text-white shadow-sm dark:shadow-none"
        >
          <RefreshCw size={18} className="text-purple-500 dark:text-purple-400" />
          Recalculer les modèles
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PredictionCard 
          title="CA Prédit (3 mois)" 
          value={Math.round(totalPredictedRevenue)} 
          unit="DT" 
          trend={12.4} 
          confidence={88} 
          icon={DollarSign} 
          color={COLORS.primary}
          delay={0.1}
        />
        <PredictionCard 
          title="Nouveaux Projets" 
          value={totalPredictedProjects} 
          unit="PROJETS" 
          trend={8.2} 
          confidence={82} 
          icon={Briefcase} 
          color={COLORS.secondary}
          delay={0.2}
        />
        <PredictionCard 
          title="Projets à Risque" 
          value={risks?.filter((r: any) => r.risk_level === 'High').length || 0} 
          unit="ALERTES" 
          trend={-15} 
          confidence={94} 
          icon={AlertCircle} 
          color={COLORS.danger}
          delay={0.3}
        />
        <PredictionCard 
          title="Score Performance" 
          value={Math.round(performance?.reduce((acc: number, p: any) => acc + p.score, 0) / (performance?.length || 1))} 
          unit="PTS" 
          trend={4.1} 
          confidence={91} 
          icon={Users} 
          color={COLORS.success}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-500/10">
                <LineChartIcon size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Projection Chiffre d'Affaires</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-white/40">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> Réel</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-300 dark:bg-purple-500/30 border border-purple-400 dark:border-purple-500/50" /> Prédiction</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: tickColor, fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: tickColor, fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke={COLORS.primary} 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                  name="Revenu Réel"
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke={COLORS.primary} 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  fillOpacity={1} 
                  fill="url(#colorPred)" 
                  name="Prédiction IA"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Projects Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-3xl p-8 space-y-6 shadow-sm dark:shadow-none"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10">
                <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tendance Nouveaux Projets</h3>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: tickColor, fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: tickColor, fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="actual" fill={COLORS.secondary} radius={[6, 6, 0, 0]} name="Réel" />
                <Bar dataKey="predicted" fill={COLORS.secondary} opacity={0.4} radius={[6, 6, 0, 0]} name="Prédiction" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risks Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm dark:shadow-none"
        >
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-gray-700 dark:text-white" size={20} />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Analyse des Risques Projets</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white dark:bg-transparent text-orange-500 rounded-full border border-orange-500">
              {risks?.filter((r: any) => r.risk_level === 'High').length} Critique(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 text-left border-b border-gray-100 dark:border-white/5">
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">Projet</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">Score Risque</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">Statut IA</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider">Facteurs de Risque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-transparent">
                {risks?.slice(0, 5).map((r: any) => (
                  <tr key={r.project_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-bold text-gray-900 dark:text-white text-xs">{r.project_name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">ID: {r.project_id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1 w-10 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${r.risk_score}%`, 
                              backgroundColor: r.risk_score > 60 ? COLORS.danger : r.risk_score > 30 ? COLORS.warning : COLORS.success 
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: r.risk_score > 60 ? COLORS.danger : r.risk_score > 30 ? COLORS.warning : COLORS.success }}>
                          {r.risk_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-bold uppercase",
                        r.risk_level === 'High' ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : 
                        r.risk_level === 'Medium' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                        "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {r.risk_level === 'High' ? '🔴 Critique' : r.risk_level === 'Medium' ? '⚠️ Modéré' : '✅ Sain'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        {r.reasons.map((reason: string, i: number) => (
                          <span key={i} className="text-[9px] font-medium text-gray-500 dark:text-white/40 bg-white dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-white/5">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top Performers */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-xl p-6 space-y-6 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-500 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Performance</h3>
          </div>
          <div className="space-y-3">
            {performance?.slice(0, 4).map((p: any, i: number) => (
              <div key={p.user_id} className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-gray-200 transition-all cursor-default shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/20 flex items-center justify-center font-black text-indigo-500 dark:text-white/40 border border-indigo-100 dark:border-white/10 group-hover:scale-105 transition-transform">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-xs">{p.name}</div>
                    <div className="text-[9px] text-gray-400 dark:text-white/30 font-bold uppercase tracking-wider">{p.projects_count} Projets • {p.completed_count} Livrés</div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{Math.round(p.score)}</div>
                  <div className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter mt-0.5">Score IA</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 1. Smart Recommendations */}
      <div className="space-y-6 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center">
            <Lightbulb className="text-yellow-500" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations?.map((rec: any) => (
            <div key={rec.id} className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-xl p-5 shadow-sm hover:border-purple-500/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <span className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold uppercase",
                  rec.priority === 'Urgent' ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" :
                  rec.priority === 'Important' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                )}>
                  {rec.priority === 'Urgent' ? '🔴 Urgent' : rec.priority === 'Important' ? '⚠️ Important' : '💡 Suggestion'}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-purple-500 transition-colors">{rec.title}</h4>
              <p className="text-xs text-gray-500 dark:text-white/50">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">


        {/* 3. Budget Intelligence */}
        <div className="bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-white/5 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-emerald-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Budget Intelligence</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projet</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Prévu vs Consommé</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Dépassement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {budgetInt?.map((b: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3">
                      <div className="font-bold text-xs text-gray-900 dark:text-white">{b.project_name}</div>
                      <div className="text-[9px] text-gray-400 font-medium mt-0.5">ROI Est. {Math.round(b.estimated_roi)}%</div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{b.budget.toLocaleString()} / {b.spent.toLocaleString()} DT</div>
                    </td>
                    <td className="py-3 text-right">
                      {b.overrun_percentage > 15 ? (
                         <span className="inline-block px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded text-xs font-bold text-red-500">+{Math.round(b.overrun_percentage)}% ⚠️</span>
                      ) : b.overrun_percentage > 0 ? (
                         <span className="inline-block px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded text-xs font-bold text-amber-500">+{Math.round(b.overrun_percentage)}%</span>
                      ) : (
                         <span className="inline-block px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded text-xs font-bold text-emerald-500">OK ✅</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {/* 5. Chatbot Gemini IA */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:scale-110 transition-transform relative group"
          >
            <Bot size={32} className="group-hover:animate-pulse" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#0f111a]" />
          </button>
        ) : (
          <div className="w-[380px] sm:w-[420px] bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-[550px] animate-in slide-in-from-bottom-5">
            <div className="p-4 bg-gradient-to-r from-purple-900 to-[#1a1d2e] flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_15px_#d946ef]"><Bot size={20} className="text-white"/></div>
                <div>
                  <h4 className="text-sm font-bold text-white">Assistant IA Prédictif</h4>
                  <p className="text-[10px] text-purple-300 font-medium">Powered by Gemini AI</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#11131e]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-purple-600 text-white rounded-br-sm shadow-md" : "bg-white dark:bg-[#1a1d2e] text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-white/5 shadow-md"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl rounded-bl-sm p-4 border border-gray-100 dark:border-white/5 flex gap-1.5 shadow-md">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 bg-white dark:bg-[#1a1d2e] border-t border-gray-100 dark:border-white/5 space-y-3">
              {chatMessages.length === 1 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {["Quel sera mon CA en juin ?", "Quel projet va échouer ?", "Qui est en surcharge ?"].map(q => (
                    <button 
                      key={q}
                      onClick={() => setChatInput(q)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-gray-100 dark:bg-purple-500/10 text-gray-700 dark:text-purple-300 border border-gray-200 dark:border-purple-500/20 hover:bg-gray-200 dark:hover:bg-purple-500/20 transition-colors font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Posez votre question à l'IA..."
                  className="flex-1 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                  onClick={handleChat}
                  disabled={!chatInput.trim() || isChatting}
                  className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-500 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send size={20} className={chatInput.trim() && !isChatting ? "ml-1" : ""} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
