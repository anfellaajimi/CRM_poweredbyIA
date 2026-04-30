import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ChevronDown, HelpCircle, ChevronRight } from 'lucide-react';

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

const PAYS = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Tunisie',
  'Algérie', 'Sénégal', 'Côte d\'Ivoire', 'Luxembourg', 'Allemagne',
  'Espagne', 'Italie', 'Pays-Bas', 'Portugal',
];

const DEVISES = ['EUR – Euro', 'USD – Dollar américain', 'GBP – Livre sterling', 'MAD – Dirham marocain', 'TND – Dinar tunisien', 'CAD – Dollar canadien'];

const LANGUES = ['Français', 'English', 'Deutsch', 'Español', 'Italiano', 'Português'];

export const EspaceClientRegister: React.FC = () => {
  const [pays, setPays]       = useState('');
  const [devise, setDevise]   = useState('');
  const [langue, setLangue]   = useState('');
  const [langueMenu, setLangueMenu] = useState(false);
  const navigate = useNavigate();

  const isValid = pays.trim() !== '' && devise !== '' && langue !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    toast.success('Paramètres enregistrés !');
    navigate('/register');
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '14px 40px 14px 16px',
    background: '#f0f0f0',
    border: '1px solid #d0d4dc',
    borderRadius: 4, fontSize: 15,
    color: devise || langue ? '#1a237e' : '#546e7a',
    outline: 'none', cursor: 'pointer',
    appearance: 'none' as any,
    WebkitAppearance: 'none' as any,
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
        {/* Logo */}
        <Link to="/espace-client" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <QLogoSVG size={36} />
          <span style={{ color: '#1a237e', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>
            Quatratech
          </span>
        </Link>

        {/* Language selector */}
        <div
          style={{ position: 'relative' }}
          onMouseLeave={() => setLangueMenu(false)}
        >
          <button
            type="button"
            onClick={() => setLangueMenu(!langueMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#1565c0', fontWeight: 600, fontSize: 14,
            }}
          >
            <ChevronDown size={16} />
            {langue || 'Français'}
          </button>
          {langueMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute', top: '100%', right: 0,
                background: '#fff', borderRadius: 6,
                border: '1px solid #e0e4f0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 50, minWidth: 160, overflow: 'hidden',
                marginTop: 6,
              }}
            >
              {LANGUES.map(l => (
                <div
                  key={l}
                  onClick={() => { setLangue(l); setLangueMenu(false); }}
                  style={{
                    padding: '10px 16px', fontSize: 14, cursor: 'pointer',
                    color: langue === l ? '#1565c0' : '#1a237e',
                    fontWeight: langue === l ? 700 : 400,
                    background: langue === l ? '#e8f0fe' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (langue !== l) (e.currentTarget as HTMLDivElement).style.background = '#f5f7ff'; }}
                  onMouseLeave={e => { if (langue !== l) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  {l}
                </div>
              ))}
            </motion.div>
          )}
        </div>
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
            color: '#1a237e', fontWeight: 800,
            fontSize: 'clamp(22px, 3vw, 30px)',
            lineHeight: 1.25, margin: '0 0 16px',
          }}>
            Choisissez les paramètres du compte
          </h1>

          {/* Already have an account */}
          <p style={{ color: '#546e7a', fontSize: 14, margin: '0 0 36px' }}>
            Vous avez déjà un compte ?{' '}
            <Link to="/espace-client" style={{ color: '#1565c0', fontWeight: 700, textDecoration: 'none' }}>
              Connectez-vous
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Pays de résidence fiscale */}
            <div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: '#1a237e', fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Pays de résidence fiscale *
                <span title="Le pays où vous êtes résident fiscal détermine les règles de facturation applicables.">
                  <HelpCircle size={15} color="#546e7a" style={{ cursor: 'help' }} />
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  list="pays-list"
                  placeholder=""
                  value={pays}
                  onChange={e => setPays(e.target.value)}
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 16px',
                    background: '#ffffff',
                    border: '1px solid #b0bec5',
                    borderRadius: 4, fontSize: 15, outline: 'none',
                    color: '#1a237e',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1565c0')}
                  onBlur={e => (e.target.style.borderColor = '#b0bec5')}
                />
                <datalist id="pays-list">
                  {PAYS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
            </div>

            {/* Devise */}
            <div>
              <label style={{
                display: 'block',
                color: '#1a237e', fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Devise *
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={devise}
                  onChange={e => setDevise(e.target.value)}
                  required
                  style={selectStyle}
                >
                  <option value="" disabled hidden></option>
                  {DEVISES.map(d => (
                    <option key={d} value={d} style={{ color: '#1a237e' }}>{d}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', color: '#546e7a', pointerEvents: 'none',
                }} />
              </div>
            </div>

            {/* Site web (langue) */}
            <div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: '#1a237e', fontWeight: 700, fontSize: 14, marginBottom: 8,
              }}>
                Site web (langue) *
                <span title="Sélectionnez la langue dans laquelle vous souhaitez accéder à votre espace client.">
                  <HelpCircle size={15} color="#546e7a" style={{ cursor: 'help' }} />
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={langue}
                  onChange={e => setLangue(e.target.value)}
                  required
                  style={{ ...selectStyle, color: langue ? '#1a237e' : '#546e7a' }}
                >
                  <option value="" disabled hidden></option>
                  {LANGUES.map(l => (
                    <option key={l} value={l} style={{ color: '#1a237e' }}>{l}</option>
                  ))}
                </select>
                <ChevronDown size={16} style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', color: '#546e7a', pointerEvents: 'none',
                }} />
              </div>
            </div>

            {/* Valider button */}
            <motion.button
              type="submit"
              whileHover={isValid ? { scale: 1.01 } : {}}
              whileTap={isValid ? { scale: 0.99 } : {}}
              style={{
                width: '100%', padding: '15px',
                background: isValid ? '#1a237e' : '#d0d4dc',
                border: 'none', borderRadius: 4,
                color: isValid ? 'white' : '#90a4ae',
                fontWeight: 700, fontSize: 15,
                cursor: isValid ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.25s, color 0.25s',
                letterSpacing: '0.01em',
              }}
            >
              Valider
              {isValid && <ChevronRight size={18} />}
            </motion.button>

          </form>
        </motion.div>
      </main>
    </div>
  );
};
