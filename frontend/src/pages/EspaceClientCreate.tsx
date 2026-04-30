import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, User, Mail, Lock, ChevronLeft, CheckCircle } from 'lucide-react';

/* ─── Quatratech Q Logo ─── */
const QLogoSVG = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
    <path d="M54 8 L17 30 L17 74 L54 96 L85 78 L85 44"
      stroke="#1a237e" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M72 82 L91 101" stroke="#1a237e" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

/* ─── Password strength ─── */
const PasswordStrength = ({ pwd }: { pwd: string }) => {
  if (!pwd) return null;
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pwd)).length;
  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : '#e0e4f0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
};

const ROLES = ['Developer', 'Manager', 'Admin', 'Commercial', 'Comptable'];

export const EspaceClientCreate: React.FC = () => {
  const [prenom, setPrenom]         = useState('');
  const [nom, setNom]               = useState('');
  const [email, setEmail]           = useState('');
  const [role, setRole]             = useState('Developer');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [voirMdp, setVoirMdp]       = useState(false);
  const [voirConfirm, setVoirConfirm] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const mdpOk      = motDePasse && confirm && motDePasse === confirm;
  const mdpErreur  = motDePasse && confirm && motDePasse !== confirm;
  const isValid    = prenom && nom && email && motDePasse.length >= 6 && mdpOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setChargement(true);
    try {
      await register(`${prenom} ${nom}`, email, motDePasse, role);
      toast.success('Compte créé avec succès ! Bienvenue sur Quatratech.');
      navigate('/');
    } catch {
      toast.error("Échec de la création du compte. L'email est peut-être déjà utilisé.");
    } finally {
      setChargement(false);
    }
  };

  const inputStyle = (field: string, hasError = false): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '13px 16px 13px 40px',
    background: '#fff',
    border: `1.5px solid ${hasError ? '#ef4444' : focusField === field ? '#1565c0' : '#b0bec5'}`,
    borderRadius: 4, fontSize: 14, outline: 'none',
    color: '#1a237e', transition: 'border-color 0.2s',
  });

  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: 12, top: '50%',
    transform: 'translateY(-50%)', color: '#90a4ae', pointerEvents: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#1a237e',
    fontWeight: 700, fontSize: 13, marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* ── Header ── */}
      <header style={{
        padding: '18px 32px',
        borderBottom: '1px solid #e8eaf0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/espace-client" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <QLogoSVG size={34} />
          <span style={{ color: '#1a237e', fontWeight: 800, fontSize: 21 }}>Quatratech</span>
        </Link>
        <Link to="/espace-client/register" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          color: '#1565c0', textDecoration: 'none', fontSize: 13, fontWeight: 600,
        }}>
          <ChevronLeft size={16} /> Retour
        </Link>
      </header>

      {/* ── Main ── */}
      <main style={{
        flex: 1, display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: '50px 20px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 600 }}
        >
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#22c55e', fontSize: 12, fontWeight: 700,
            }}>
              <CheckCircle size={16} />
              <span>Paramètres</span>
            </div>
            <div style={{ width: 32, height: 1.5, background: '#1565c0' }} />
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#1a237e', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
            }}>2</div>
            <span style={{ fontSize: 12, color: '#1565c0', fontWeight: 700 }}>Votre compte</span>
          </div>

          {/* Title */}
          <h1 style={{
            color: '#1a237e', fontWeight: 800,
            fontSize: 'clamp(20px, 2.8vw, 28px)',
            margin: '0 0 8px',
          }}>
            Créez votre compte
          </h1>
          <p style={{ color: '#546e7a', fontSize: 13, margin: '0 0 32px' }}>
            Déjà un compte ?{' '}
            <Link to="/espace-client" style={{ color: '#1565c0', fontWeight: 700, textDecoration: 'none' }}>
              Connectez-vous
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Prénom + Nom */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={iconStyle} />
                  <input type="text" placeholder="Jean" value={prenom}
                    onChange={e => setPrenom(e.target.value)}
                    onFocus={() => setFocusField('prenom')} onBlur={() => setFocusField(null)}
                    required style={inputStyle('prenom')} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={iconStyle} />
                  <input type="text" placeholder="Dupont" value={nom}
                    onChange={e => setNom(e.target.value)}
                    onFocus={() => setFocusField('nom')} onBlur={() => setFocusField(null)}
                    required style={inputStyle('nom')} />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Adresse e-mail *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={iconStyle} />
                <input type="email" placeholder="jean.dupont@exemple.fr" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)}
                  required style={inputStyle('email')} />
              </div>
            </div>

            {/* Rôle */}
            <div>
              <label style={labelStyle}>Rôle</label>
              <div style={{ position: 'relative' }}>
                <select value={role} onChange={e => setRole(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '13px 40px 13px 16px',
                    background: '#f0f0f0', border: '1px solid #d0d4dc',
                    borderRadius: 4, fontSize: 14, color: '#1a237e',
                    outline: 'none', cursor: 'pointer', appearance: 'none',
                  }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none', color: '#546e7a',
                }}>▼</div>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label style={labelStyle}>Mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={iconStyle} />
                <input type={voirMdp ? 'text' : 'password'} placeholder="Minimum 6 caractères"
                  value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
                  onFocus={() => setFocusField('mdp')} onBlur={() => setFocusField(null)}
                  required style={{ ...inputStyle('mdp'), paddingRight: 44 }} />
                <button type="button" onClick={() => setVoirMdp(!voirMdp)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#546e7a',
                }}>
                  {voirMdp ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <PasswordStrength pwd={motDePasse} />
            </div>

            {/* Confirmer */}
            <div>
              <label style={labelStyle}>Confirmer le mot de passe *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={iconStyle} />
                <input type={voirConfirm ? 'text' : 'password'} placeholder="Répétez le mot de passe"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocusField('confirm')} onBlur={() => setFocusField(null)}
                  required style={{ ...inputStyle('confirm', !!mdpErreur), paddingRight: 44 }} />
                <button type="button" onClick={() => setVoirConfirm(!voirConfirm)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#546e7a',
                }}>
                  {voirConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <AnimatePresence>
                {mdpOk && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} /> Les mots de passe correspondent
                  </motion.p>
                )}
                {mdpErreur && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 5 }}>
                    ✕ Les mots de passe ne correspondent pas
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Valider */}
            <motion.button
              type="submit"
              disabled={!isValid || chargement}
              whileHover={isValid && !chargement ? { scale: 1.01 } : {}}
              whileTap={isValid && !chargement ? { scale: 0.99 } : {}}
              style={{
                width: '100%', padding: '15px',
                background: isValid && !chargement ? '#1a237e' : '#d0d4dc',
                border: 'none', borderRadius: 4,
                color: isValid && !chargement ? 'white' : '#90a4ae',
                fontWeight: 700, fontSize: 15,
                cursor: isValid && !chargement ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.25s, color 0.25s',
                marginTop: 6,
              }}
            >
              {chargement ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  Création du compte...
                </>
              ) : 'Créer mon compte'}
            </motion.button>

            {/* Legal */}
            <p style={{ fontSize: 11, color: '#90a4ae', textAlign: 'center', lineHeight: 1.6 }}>
              En créant un compte, vous acceptez les{' '}
              <span style={{ color: '#1565c0', cursor: 'pointer' }}>Conditions d'utilisation</span>
              {' '}et la{' '}
              <span style={{ color: '#1565c0', cursor: 'pointer' }}>Politique de confidentialité</span>
              {' '}de Quatratech.
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
};
