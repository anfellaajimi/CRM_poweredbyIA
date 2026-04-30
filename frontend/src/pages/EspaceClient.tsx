import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

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

export const EspaceClient: React.FC = () => {
  const [email, setEmail]           = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [sesouvenir, setSeSouvenir] = useState(false);
  const [voirMdp, setVoirMdp]       = useState(false);
  const [chargement, setChargement] = useState(false);
  const [emailActif, setEmailActif] = useState(false);
  const [mdpActif, setMdpActif]     = useState(false);
  const { login } = useAuthStore();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
          {/* Title */}
          <h1 style={{
            color: '#1a237e', fontWeight: 800, fontSize: 28,
            margin: '0 0 16px',
          }}>
            Connectez-vous
          </h1>

          {/* Register link */}
          <p style={{ color: '#546e7a', fontSize: 14, margin: '0 0 32px' }}>
            Vous n'avez pas de compte ?{' '}
            <Link to="/espace-client/register" style={{ color: '#1565c0', fontWeight: 700, textDecoration: 'none' }}>
              Créer un compte
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Email */}
            <div>
              <label style={{
                display: 'block', color: '#1a237e',
                fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Email ou identifiant *
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailActif(true)}
                onBlur={() => setEmailActif(false)}
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
              {/* Remember checkbox */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: 10, cursor: 'pointer',
              }}>
                <div
                  onClick={() => setSeSouvenir(!sesouvenir)}
                  style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${sesouvenir ? '#1565c0' : '#90a4ae'}`,
                    background: sesouvenir ? '#1565c0' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}
                >
                  <AnimatePresence>
                    {sesouvenir && (
                      <motion.svg
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        width="10" height="10" viewBox="0 0 10 10" fill="none"
                      >
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <span style={{ fontSize: 13, color: '#546e7a', userSelect: 'none' }}>
                  Se souvenir de ce compte
                </span>
              </label>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', color: '#1a237e',
                fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Mot de passe *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={voirMdp ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  onFocus={() => setMdpActif(true)}
                  onBlur={() => setMdpActif(false)}
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
                  Connexion...
                </>
              ) : 'Se connecter'}
            </motion.button>

          </form>

          {/* Forgot password */}
          <div style={{ marginTop: 24 }}>
            <Link
              to="/forgot-password"
              style={{ color: '#1565c0', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
