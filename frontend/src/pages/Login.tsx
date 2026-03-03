import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, CheckCircle, TrendingUp, Users, Shield, Zap, BarChart3, Globe } from 'lucide-react';

const StatCard = ({ icon: Icon, valeur, label, couleur, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3"
  >
    <div className={`w-10 h-10 rounded-xl ${couleur} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-white font-bold text-lg leading-none">{valeur}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  </motion.div>
);

const FeatureItem = ({ texte, delay }: { texte: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-3"
  >
    <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
      <CheckCircle className="w-3 h-3 text-purple-400" />
    </div>
    <span className="text-white/60 text-sm">{texte}</span>
  </motion.div>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [sesouvenir, setSeSouvenir] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [voirMdp, setVoirMdp] = useState(false);
  const [champActif, setChampActif] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    try {
      await login(email, motDePasse);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch {
      toast.error('Email ou mot de passe incorrect.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[#080612]">

      {/* ═══════════ PANNEAU GAUCHE ═══════════ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Fond dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0d0a2e] to-[#080612]" />

        {/* Orbes lumineux */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-700/25 blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[90px] pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-pink-600/15 blur-[70px] pointer-events-none"
        />

        {/* Grille de points */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Lignes décoratives */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent w-full"
              style={{ top: `${20 + i * 20}%` }}
              animate={{ opacity: [0, 0.5, 0], x: ['-100%', '100%'] }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 2 }}
            />
          ))}
        </div>

        {/* Particules flottantes */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${5 + i * 8}%`,
              top: `${10 + (i % 5) * 18}%`,
              background: i % 3 === 0 ? 'rgba(167,139,250,0.6)' : i % 3 === 1 ? 'rgba(99,102,241,0.5)' : 'rgba(236,72,153,0.4)',
            }}
            animate={{ y: [-15, 15, -15], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}

        {/* Contenu gauche */}
        <div className="relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
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

        {/* Titre central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 text-xs font-semibold">Plateforme CRM intelligente</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6">
              Gérez votre
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                business en
              </span>
              <span className="block">toute simplicité</span>
            </h1>

            <p className="text-white/50 text-lg leading-relaxed max-w-md mb-8">
              La plateforme tout-en-un pour gérer vos clients, factures, contrats et projets avec l'intelligence artificielle.
            </p>

            <div className="space-y-3">
              {[
                'Tableau de bord avec analyses en temps réel',
                'Gestion avancée des clients et prospects',
                'Facturation automatisée et suivi des paiements',
                'IA intégrée pour optimiser vos ventes',
              ].map((f, i) => (
                <FeatureItem key={i} texte={f} delay={0.4 + i * 0.1} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats en bas */}
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium"
          >
            Ils nous font confiance
          </motion.p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} valeur="12,400+" label="Entreprises actives" couleur="bg-purple-500/40" delay={0.9} />
            <StatCard icon={TrendingUp} valeur="98.7%" label="Taux de satisfaction" couleur="bg-indigo-500/40" delay={1.0} />
            <StatCard icon={Globe} valeur="47 pays" label="Couverture mondiale" couleur="bg-pink-500/40" delay={1.1} />
            <StatCard icon={BarChart3} valeur="€2.4B+" label="Transactions gérées" couleur="bg-violet-500/40" delay={1.2} />
          </div>

          {/* Avatars clients */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="flex items-center gap-3 mt-5"
          >
            <div className="flex -space-x-2">
              {['#7c3aed','#4f46e5','#db2777','#0891b2','#059669'].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#080612] flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: c }}
                >
                  {['A','B','C','D','E'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-0.5">+1,200 avis 5 étoiles</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════ PANNEAU DROIT — FORMULAIRE ═══════════ */}
      <div className="flex-1 lg:w-[45%] xl:w-[40%] flex items-center justify-center relative bg-[#09071a] px-6 py-12">

        {/* Fond subtil */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#09071a] to-[#0d0a2e]" />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-[60px] pointer-events-none"
        />

        {/* Ligne séparatrice verticale */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-sm"
        >

          {/* En-tête formulaire */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25 mb-6 relative"
            >
              <span className="text-white font-black text-lg">AI</span>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"
              >
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black text-white mb-1"
            >
              Bon retour 👋
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-white/40 text-sm"
            >
              Connectez-vous à votre espace <span className="text-purple-400">CRM AI Pro</span>
            </motion.p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSoumettre} className="space-y-4">

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Adresse Email
              </label>
              <div className={`relative transition-transform duration-200 ${champActif === 'email' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-xl blur-sm transition-opacity duration-300 ${champActif === 'email' ? 'opacity-100 bg-gradient-to-r from-purple-500/60 to-indigo-500/60' : 'opacity-0'}`} />
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setChampActif('email')}
                    onBlur={() => setChampActif(null)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-purple-500/40 transition-colors duration-200"
                  />
                </div>
              </div>
            </motion.div>

            {/* Mot de passe */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Oublié ?
                </Link>
              </div>
              <div className={`relative transition-transform duration-200 ${champActif === 'mdp' ? 'scale-[1.01]' : ''}`}>
                <div className={`absolute -inset-[1px] rounded-xl blur-sm transition-opacity duration-300 ${champActif === 'mdp' ? 'opacity-100 bg-gradient-to-r from-purple-500/60 to-indigo-500/60' : 'opacity-0'}`} />
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-white/30 z-10 pointer-events-none" />
                  <input
                    type={voirMdp ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    onFocus={() => setChampActif('mdp')}
                    onBlur={() => setChampActif(null)}
                    required
                    className="w-full pl-10 pr-11 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-purple-500/40 transition-colors duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setVoirMdp(!voirMdp)}
                    className="absolute right-3.5 text-white/25 hover:text-white/50 transition-colors z-10"
                  >
                    {voirMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Se souvenir */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2"
            >
              <div
                onClick={() => setSeSouvenir(!sesouvenir)}
                className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-all duration-200 flex-shrink-0 ${sesouvenir ? 'bg-purple-500 border-purple-500' : 'border-white/20 bg-white/5'}`}
              >
                <AnimatePresence>
                  {sesouvenir && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-2.5 h-2.5 text-white"
                      viewBox="0 0 10 10" fill="none"
                    >
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </div>
              <span
                className="text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors select-none"
                onClick={() => setSeSouvenir(!sesouvenir)}
              >
                Se souvenir de moi pendant 30 jours
              </span>
            </motion.div>

            {/* Bouton connexion */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <motion.button
                type="submit"
                disabled={chargement}
                whileHover={{ scale: chargement ? 1 : 1.02 }}
                whileTap={{ scale: chargement ? 1 : 0.97 }}
                className="relative w-full py-3 rounded-xl font-bold text-sm text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 transition-all duration-500 group-hover:from-purple-500 group-hover:via-indigo-500 group-hover:to-purple-600" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                />
                <span className="relative flex items-center justify-center gap-2">
                  {chargement ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          {/* Séparateur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 my-5"
          >
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-white/25 text-xs">ou</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </motion.div>

          {/* Bouton SSO / démo */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            type="button"
            onClick={() => { setEmail('admin@gmail.com'); setMotDePasse('password'); }}
            className="w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white/80 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Connexion démo (Admin)
          </motion.button>

          {/* Inscription */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-white/30 mt-6"
          >
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Créer un compte gratuit
            </Link>
          </motion.p>

          {/* Mentions légales */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="text-center text-[10px] text-white/15 mt-4 leading-relaxed"
          >
            En vous connectant, vous acceptez nos{' '}
            <span className="underline cursor-pointer hover:text-white/30 transition-colors">Conditions d'utilisation</span>
            {' '}et notre{' '}
            <span className="underline cursor-pointer hover:text-white/30 transition-colors">Politique de confidentialité</span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};