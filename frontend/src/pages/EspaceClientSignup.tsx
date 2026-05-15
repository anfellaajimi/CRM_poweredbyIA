import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

/* ─── Quatratech Q Logo ─── */
const QLogoSVG = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
    <path
      d="M54 8 L17 30 L17 74 L54 96 L85 78 L85 44"
      stroke="#1a237e" strokeWidth="14"
      strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
    <path d="M72 82 L91 101" stroke="#1a237e" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

export const EspaceClientSignup: React.FC = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [emailActif, setEmailActif] = useState(false);
  const [nomActif, setNomActif] = useState(false);
  const [mdpActif, setMdpActif] = useState(false);
  
  const { signupClient } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    try {
      await signupClient(nom, email, password);
      toast.success('Votre compte a été créé avec succès !');
      navigate('/client-portal');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Une erreur est survenue lors de l'inscription.";
      toast.error(errorMsg);
    } finally {
      setChargement(false);
    }
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
        padding: '20px 32px',
        borderBottom: '1px solid #e8eaf0',
        display: 'flex', alignItems: 'center',
      }}>
        <Link to="/espace-client" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <QLogoSVG size={38} />
          <span style={{
            color: '#1a237e', fontWeight: 800, fontSize: 22,
            letterSpacing: '-0.01em',
          }}>
            Quatratech
          </span>
        </Link>
      </header>

      {/* ── Main Form ── */}
      <main style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 20px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ width: '100%', maxWidth: 600 }}
        >
          {/* Badge Invitation */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', background: '#e8eaf6', borderRadius: 100,
            color: '#1a237e', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: 24
          }}>
            <CheckCircle2 size={16} />
            Accès réservé aux clients Quatratech
          </div>

          {/* Title */}
          <h1 style={{
            color: '#1a237e', fontWeight: 800, fontSize: 32,
            margin: '0 0 12px',
            letterSpacing: '-0.02em'
          }}>
            Créez votre compte portail
          </h1>

          <p style={{ color: '#546e7a', fontSize: 16, margin: '0 0 32px', lineHeight: 1.6 }}>
            Utilisez l'adresse email associée à votre dossier client pour activer votre accès.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Nom complet */}
            <div>
              <label style={{
                display: 'block', color: '#1a237e',
                fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Nom complet *
              </label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                onFocus={() => setNomActif(true)}
                onBlur={() => setNomActif(false)}
                placeholder="Ex: Jean Dupont"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px',
                  border: `2px solid ${nomActif ? '#1565c0' : '#cfd8dc'}`,
                  borderRadius: 4, fontSize: 15, outline: 'none',
                  color: '#1a237e', background: '#fff',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', color: '#1a237e',
                fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Adresse email professionnelle *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailActif(true)}
                onBlur={() => setEmailActif(false)}
                placeholder="votre@email.com"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px',
                  border: `2px solid ${emailActif ? '#1565c0' : '#cfd8dc'}`,
                  borderRadius: 4, fontSize: 15, outline: 'none',
                  color: '#1a237e', background: '#fff',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', color: '#1a237e',
                fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Définir un mot de passe *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={voirMdp ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setMdpActif(true)}
                  onBlur={() => setMdpActif(false)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 48px 14px 16px',
                    border: `2px solid ${mdpActif ? '#1565c0' : '#cfd8dc'}`,
                    borderRadius: 4, fontSize: 15, outline: 'none',
                    color: '#1a237e', background: '#fff',
                    transition: 'border-color 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setVoirMdp(!voirMdp)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#1565c0', display: 'flex', alignItems: 'center',
                  }}
                >
                  {voirMdp ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              padding: '16px', background: '#fff9c4', borderRadius: 8,
              border: '1px solid #fff176', display: 'flex', gap: 12
            }}>
              <AlertCircle size={20} style={{ color: '#fbc02d', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13, color: '#5d4037', lineHeight: 1.5 }}>
                L'inscription est réservée aux clients enregistrés. Si votre email n'est pas reconnu, veuillez contacter votre gestionnaire de compte Quatratech.
              </p>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={chargement}
              whileHover={{ scale: chargement ? 1 : 1.01 }}
              whileTap={{ scale: chargement ? 1 : 0.99 }}
              style={{
                width: '100%', padding: '16px',
                background: '#1a237e',
                border: 'none', borderRadius: 4,
                color: 'white', fontWeight: 800, fontSize: 16,
                cursor: chargement ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: chargement ? 0.75 : 1,
                transition: 'opacity 0.2s',
                letterSpacing: '0.02em',
                marginTop: 8
              }}
            >
              {chargement ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 18, height: 18,
                      border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                    }}
                  />
                  Activation en cours...
                </>
              ) : 'Activer mon espace'}
            </motion.button>

          </form>

          {/* Login link */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <span style={{ color: '#546e7a', fontSize: 14 }}>Vous avez déjà un compte ? </span>
            <Link
              to="/espace-client"
              style={{ color: '#1565c0', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
            >
              Connectez-vous ici
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
