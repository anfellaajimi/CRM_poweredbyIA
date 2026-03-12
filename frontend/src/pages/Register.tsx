import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles,
  CheckCircle, Shield, Zap, Users, TrendingUp, BarChart3, Globe, ChevronDown
} from 'lucide-react';

const FeatureItem = ({ text, delay }: { text: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-3"
  >
    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
      <CheckCircle className="w-3 h-3 text-purple-400" />
    </div>
    <span className="text-white/60 text-sm">{text}</span>
  </motion.div>
);

const StatCard = ({ icon: Icon, value, label, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3"
  >
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-white font-bold text-lg leading-none">{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  </motion.div>
);

/* Barre de force du mot de passe */
const ForceMdp = ({ mdp }: { mdp: string }) => {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(mdp)).length;
  const configs = [
    { label: '', color: 'bg-gray-600' },
    { label: 'Faible', color: 'bg-red-500' },
    { label: 'Moyen', color: 'bg-yellow-500' },
    { label: 'Bon', color: 'bg-blue-500' },
    { label: 'Fort', color: 'bg-emerald-500' },
  ];
  const cfg = configs[score];
  if (!mdp) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? cfg.color : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${cfg.color.replace('bg-','text-')}`}>{cfg.label}</p>
    </div>
  );
};

export const Register: React.FC = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(false);
  const [voirMdp, setVoirMdp] = useState(false);
  const [voirConfirm, setVoirConfirm] = useState(false);
  const [champActif, setChampActif] = useState<string | null>(null);
  const [etape, setEtape] = useState(1); // étape 1 ou 2
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const mdpCorrespondent = motDePasse && confirmation && motDePasse === confirmation;
  const mdpDifferents = motDePasse && confirmation && motDePasse !== confirmation;

  const passerEtape2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email) { toast.error('Remplissez tous les champs'); return; }
    setEtape(2);
  };

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motDePasse !== confirmation) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setChargement(true);
    try {
      await register(nom, email, motDePasse, role);
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch {
      toast.error("Échec de l'inscription. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  };

  const inputClass = (id: string) =>
    `w-full py-3 bg-white/[0.06] border rounded-xl text-white placeholder-white/20 text-sm focus:outline-none transition-all duration-200 ${
      champActif === id ? 'border-purple-500/50' : 'border-white/[0.08]'
    }`;

  const glowClass = (id: string) =>
    `absolute -inset-[1px] rounded-xl blur-sm transition-opacity duration-300 bg-gradient-to-r from-purple-500/60 to-indigo-500/60 ${
      champActif === id ? 'opacity-100' : 'opacity-0'
    }`;

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[#080612]">

      {/* ═══ PANNEAU GAUCHE ═══ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Fonds animés */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d0a2e] to-[#080612]" />
        <motion.div animate={{ scale:[1,1.15,1], opacity:[0.4,0.7,0.4] }} transition={{ duration:7, repeat:Infinity, ease:'easeInOut' }}
          className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-700/25 blur-[100px] pointer-events-none" />
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:9, repeat:Infinity, ease:'easeInOut', delay:2 }}
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[90px] pointer-events-none" />
        <motion.div animate={{ x:[0,30,0], y:[0,-20,0], opacity:[0.2,0.4,0.2] }} transition={{ duration:11, repeat:Infinity, ease:'easeInOut', delay:1 }}
          className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-pink-600/15 blur-[70px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize:'28px 28px' }} />

        {/* Lignes animées */}
        {[...Array(4)].map((_,i) => (
          <motion.div key={i} className="absolute h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent w-full"
            style={{ top:`${20+i*20}%` }}
            animate={{ opacity:[0,0.5,0], x:['-100%','100%'] }}
            transition={{ duration:8+i*2, repeat:Infinity, ease:'linear', delay:i*2 }} />
        ))}

        {/* Particules */}
        {[...Array(12)].map((_,i) => (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width:`${2+(i%3)}px`, height:`${2+(i%3)}px`, left:`${5+i*8}%`, top:`${10+(i%5)*18}%`,
              background: i%3===0?'rgba(167,139,250,0.6)':i%3===1?'rgba(99,102,241,0.5)':'rgba(236,72,153,0.4)' }}
            animate={{ y:[-15,15,-15], opacity:[0.2,0.8,0.2] }}
            transition={{ duration:3+(i%4), repeat:Infinity, ease:'easeInOut', delay:i*0.4 }} />
        ))}

        {/* Logo */}
        <div className="relative z-10">
          <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6 }}
            className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white font-black text-sm">AI</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">CRM</span>
              <span className="text-purple-400 font-bold text-lg tracking-tight"> AI Pro</span>
            </div>
            <div className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              <span className="text-purple-300 text-[10px] font-semibold uppercase tracking-widest">Beta</span>
            </div>
          </motion.div>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.7 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 text-xs font-semibold">Rejoignez 12,000+ professionnels</span>
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6">
              Démarrez
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">gratuitement</span>
              <span className="block">dès aujourd'hui</span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed max-w-md mb-8">
              Créez votre compte en 2 minutes et accédez à toutes les fonctionnalités pour gérer votre business intelligemment.
            </p>
            <div className="space-y-3">
              {[
                'Accès immédiat sans carte bancaire',
                'Tableau de bord avec IA intégrée',
                'Gestion clients, factures et contrats',
                'Support prioritaire 24h/7j',
              ].map((f,i) => <FeatureItem key={i} text={f} delay={0.4+i*0.1} />)}
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="relative z-10">
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
            className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">
            Déjà adoptés par
          </motion.p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users}      value="12,400+" label="Entreprises actives"  color="bg-purple-500/40" delay={0.9} />
            <StatCard icon={TrendingUp} value="98.7%"   label="Taux de satisfaction" color="bg-indigo-500/40" delay={1.0} />
            <StatCard icon={Globe}      value="47 pays"  label="Couverture mondiale"  color="bg-pink-500/40"   delay={1.1} />
            <StatCard icon={BarChart3}  value="€2.4B+"  label="Transactions gérées"  color="bg-violet-500/40" delay={1.2} />
          </div>

          {/* Avatars */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.3 }}
            className="flex items-center gap-3 mt-5">
            <div className="flex -space-x-2">
              {['#7c3aed','#4f46e5','#db2777','#0891b2','#059669'].map((c,i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080612] flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor:c }}>
                  {['A','B','C','D','E'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_,i) => (
                  <svg key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-0.5">+1,200 avis 5 étoiles</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ PANNEAU DROIT — FORMULAIRE ═══ */}
      <div className="flex-1 lg:w-[45%] xl:w-[40%] flex items-center justify-center relative bg-[#09071a] px-6 py-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#09071a] to-[#0d0a2e]" />
        <motion.div animate={{ opacity:[0.1,0.2,0.1] }} transition={{ duration:5, repeat:Infinity }}
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-[60px] pointer-events-none" />
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />

        <motion.div
          initial={{ opacity:0, x:40 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">AI</span>
            </div>
            <span className="text-white font-bold text-base">CRM <span className="text-purple-400">AI Pro</span></span>
          </div>

          {/* En-tête */}
          <div className="mb-6">
            <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.2 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25 mb-5 relative">
              <span className="text-white font-black text-lg">AI</span>
              <motion.div animate={{ scale:[1,1.3,1], opacity:[0.6,1,0.6] }} transition={{ duration:2, repeat:Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </motion.div>
            <motion.h2 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
              className="text-2xl font-black text-white mb-1">
              Créer un compte ✨
            </motion.h2>
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
              className="text-white/40 text-sm">
              Rejoignez <span className="text-purple-400">CRM AI Pro</span> aujourd'hui
            </motion.p>
          </div>

          {/* Indicateur d'étape */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
            className="flex items-center gap-2 mb-6">
            {[1,2].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  etape >= n ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/10 text-white/30'
                }`}>{etape > n ? '✓' : n}</div>
                {n < 2 && <div className={`h-px w-8 transition-all duration-500 ${etape > 1 ? 'bg-purple-500' : 'bg-white/10'}`} />}
              </div>
            ))}
            <span className="ml-1 text-[11px] text-white/30">{etape === 1 ? 'Informations' : 'Sécurité'}</span>
          </motion.div>

          {/* ── ÉTAPE 1 ── */}
          <AnimatePresence mode="wait">
            {etape === 1 && (
              <motion.form key="etape1"
                initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                transition={{ duration:0.3 }}
                onSubmit={passerEtape2}
                className="space-y-4"
              >
                {/* Nom */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Nom complet *</label>
                  <div className={`relative transition-transform duration-200 ${champActif==='nom'?'scale-[1.01]':''}`}>
                    <div className={glowClass('nom')} />
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                      <input type="text" placeholder="Mohamed Aziz Jouini" value={nom}
                        onChange={e=>setNom(e.target.value)}
                        onFocus={()=>setChampActif('nom')} onBlur={()=>setChampActif(null)}
                        required className={`${inputClass('nom')} pl-10 pr-4`} />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Adresse Email *</label>
                  <div className={`relative transition-transform duration-200 ${champActif==='email'?'scale-[1.01]':''}`}>
                    <div className={glowClass('email')} />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                      <input type="email" placeholder="votre@email.com" value={email}
                        onChange={e=>setEmail(e.target.value)}
                        onFocus={()=>setChampActif('email')} onBlur={()=>setChampActif(null)}
                        required className={`${inputClass('email')} pl-10 pr-4`} />
                    </div>
                  </div>
                </div>

                {/* Rôle */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Rôle</label>
                  <div className={`relative transition-transform duration-200 ${champActif==='role'?'scale-[1.01]':''}`}>
                    <div className={glowClass('role')} />
                    <div className="relative flex items-center">
                      <Shield className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                      <select value={role} onChange={e=>setRole(e.target.value)}
                        onFocus={()=>setChampActif('role')} onBlur={()=>setChampActif(null)}
                        className={`${inputClass('role')} pl-10 pr-10 appearance-none cursor-pointer`}>
                        <option value="Admin" className="bg-gray-900">Admin</option>
                        <option value="Manager" className="bg-gray-900">Manager</option>
                        <option value="Developer" className="bg-gray-900">Developer</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 w-4 h-4 text-white/30 pointer-events-none z-10" />
                    </div>
                  </div>
                </div>

                {/* Bouton suivant */}
                <motion.button type="submit" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  className="relative w-full py-3 rounded-xl font-bold text-sm text-white overflow-hidden group mt-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 group-hover:from-purple-500 group-hover:via-indigo-500 group-hover:to-purple-600 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    Continuer
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </motion.form>
            )}

            {/* ── ÉTAPE 2 ── */}
            {etape === 2 && (
              <motion.form key="etape2"
                initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                transition={{ duration:0.3 }}
                onSubmit={handleSoumettre}
                className="space-y-4"
              >
                {/* Récap étape 1 */}
                <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl border border-white/[0.07] mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[12px] font-semibold truncate">{nom}</p>
                    <p className="text-white/40 text-[10px] truncate">{email}</p>
                  </div>
                  <button type="button" onClick={()=>setEtape(1)} className="text-[10px] text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                    Modifier
                  </button>
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Mot de passe *</label>
                  <div className={`relative transition-transform duration-200 ${champActif==='mdp'?'scale-[1.01]':''}`}>
                    <div className={glowClass('mdp')} />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                      <input type={voirMdp?'text':'password'} placeholder="••••••••••" value={motDePasse}
                        onChange={e=>setMotDePasse(e.target.value)}
                        onFocus={()=>setChampActif('mdp')} onBlur={()=>setChampActif(null)}
                        required className={`${inputClass('mdp')} pl-10 pr-11`} />
                      <button type="button" onClick={()=>setVoirMdp(!voirMdp)}
                        className="absolute right-3.5 text-white/25 hover:text-white/50 transition-colors z-10">
                        {voirMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <ForceMdp mdp={motDePasse} />
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Confirmer le mot de passe *</label>
                  <div className={`relative transition-transform duration-200 ${champActif==='confirm'?'scale-[1.01]':''}`}>
                    <div className={`absolute -inset-[1px] rounded-xl blur-sm transition-opacity duration-300 ${
                      champActif==='confirm' ? 'opacity-100' : 'opacity-0'
                    } ${mdpDifferents ? 'bg-gradient-to-r from-red-500/60 to-red-400/60' : 'bg-gradient-to-r from-purple-500/60 to-indigo-500/60'}`} />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                      <input type={voirConfirm?'text':'password'} placeholder="••••••••••" value={confirmation}
                        onChange={e=>setConfirmation(e.target.value)}
                        onFocus={()=>setChampActif('confirm')} onBlur={()=>setChampActif(null)}
                        required className={`${inputClass('confirm')} pl-10 pr-11 ${mdpDifferents?'border-red-500/40':mdpCorrespondent?'border-emerald-500/40':''}`} />
                      <button type="button" onClick={()=>setVoirConfirm(!voirConfirm)}
                        className="absolute right-3.5 text-white/25 hover:text-white/50 transition-colors z-10">
                        {voirConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {mdpCorrespondent && (
                      <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Les mots de passe correspondent
                      </motion.p>
                    )}
                    {mdpDifferents && (
                      <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="text-[10px] text-red-400 font-semibold mt-1">
                        ✕ Les mots de passe ne correspondent pas
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bouton créer */}
                <motion.button type="submit" disabled={chargement || !!mdpDifferents}
                  whileHover={{ scale: chargement?1:1.02 }} whileTap={{ scale: chargement?1:0.97 }}
                  className="relative w-full py-3 rounded-xl font-bold text-sm text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed group mt-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 group-hover:from-purple-500 group-hover:via-indigo-500 group-hover:to-purple-600 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    {chargement ? (
                      <>
                        <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        Création du compte...
                      </>
                    ) : (
                      <>Créer mon compte <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </span>
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-white/25 text-xs">déjà membre ?</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Lien connexion */}
          <Link to="/login" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white/80 text-sm font-medium transition-all duration-200">
            Se connecter à mon compte
          </Link>

          {/* Mentions */}
          <p className="text-center text-[10px] text-white/15 mt-5 leading-relaxed">
            En créant un compte, vous acceptez nos{' '}
            <span className="underline cursor-pointer hover:text-white/30 transition-colors">Conditions d'utilisation</span>
            {' '}et notre{' '}
            <span className="underline cursor-pointer hover:text-white/30 transition-colors">Politique de confidentialité</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};