import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, Github, Send, Globe, Share2 } from 'lucide-react';

/* ─── Quatratech Q Logo SVG ─── */
const QLogoSVG = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
    <path
      d="M54 8 L17 30 L17 74 L54 96 L85 78 L85 44"
      stroke="#7c3aed" strokeWidth="14"
      strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
    <path d="M72 82 L91 101" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

/* ─── Animated Network Canvas Background ─── */
const NetworkCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 1.2,
    }));

    let animId: number;
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 160) {
            ctx.strokeStyle = `rgba(96,165,250,${(1 - d / 160) * 0.22})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(96,165,250,0.6)';
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      opacity: 0.55, pointerEvents: 'none',
    }} />
  );
};

/* ─── Main Login Component ─── */
export const Login: React.FC = () => {

  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [sesouvenir, setSeSouvenir] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [voirMdp, setVoirMdp]       = useState(false);
  const [champActif, setChampActif] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState('');
  const { login, handleOAuthSuccess } = useAuthStore();
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleOAuthSuccess(token)
        .then(() => {
          toast.success('Connexion réussie !');
          navigate('/');
        })
        .catch(() => {
          toast.error("Échec de l'authentification sociale.");
        });
    }
  }, [searchParams, handleOAuthSuccess, navigate]);

  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  const handleGithubLogin = () => {
    authAPI.githubLogin();
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletter) return;
    setChargement(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Merci de vous être inscrit à notre newsletter !');
      setNewsletter('');
      setChargement(false);
    }, 1000);
  };

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

  const inputStyle = (id: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px 10px 36px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${champActif === id ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 6, color: 'white', fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 9, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)', marginBottom: 5,
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: 11, top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
  };

  const footerLinks = {
    Produit: [
      { label: 'Log In', path: '/login' },
      { label: 'Intelligence Artificielle', path: '/ai-monitoring' }
    ],
    Entreprise: [
      { label: 'Contact', path: '/support' },
      { label: 'Privacy Policy', path: '#' }
    ],
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', width: '100%', background: '#060d1e', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'auto' }}>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 56,
        background: 'rgba(6,13,30,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <QLogoSVG size={26} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Quatratech</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Log In'].map((item, i) => (
            <span key={item} style={{
              color: i === 0 ? '#60a5fa' : 'rgba(255,255,255,0.55)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              borderBottom: i === 0 ? '1.5px solid #60a5fa' : 'none',
              paddingBottom: i === 0 ? 2 : 0,
            }}>{item}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/espace-client" style={{
            padding: '7px 20px', borderRadius: 6,
            background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            color: 'white', fontWeight: 600, fontSize: 13,
            textDecoration: 'none', display: 'inline-block',
          }}>Espace client</Link>
        </div>
      </nav>

      {/* ══════════ MAIN SECTION ══════════ */}
      <div style={{
        flex: 1, position: 'relative',
        display: 'flex', alignItems: 'center',
        padding: '48px 60px', overflow: 'hidden', minHeight: '70vh',
      }}>
        <NetworkCanvas />

        {/* Dark gradient overlay left side */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, rgba(6,13,30,0.85) 45%, rgba(6,13,30,0.3) 100%)',
          pointerEvents: 'none',
        }} />

        {/* ── Hero Text (left) ── */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1, paddingRight: 40, maxWidth: '50%' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              border: '1px solid rgba(96,165,250,0.3)',
              background: 'rgba(96,165,250,0.07)', marginBottom: 22,
            }}
          >
            <span style={{ color: '#60a5fa', fontSize: 10 }}>✦</span>
            <span style={{ fontSize: 10, color: '#93c5fd', fontWeight: 600, letterSpacing: '0.08em' }}>
              POWERED BY ARTIFICIAL INTELLIGENCE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(30px,3.4vw,50px)', fontWeight: 900, color: 'white', lineHeight: 1.12, margin: '0 0 4px' }}
          >
            Gérez votre business
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            style={{
              fontSize: 'clamp(30px,3.4vw,50px)', fontWeight: 900, lineHeight: 1.12,
              background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: '0 0 18px',
            }}
          >
            en toute simplicité
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            style={{ color: 'rgba(255,255,255,0.48)', fontSize: 14, lineHeight: 1.75, maxWidth: 370, marginBottom: 36 }}
          >
            La plateforme tout-en-un pour gérer vos clients, factures,
            contrats et projets avec l'<span style={{ color: '#60a5fa' }}>intelligence artificielle</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}
          >
            {[{ icon: '🔒', text: 'SECURE CLOUD' }, { icon: '✅', text: 'GDPR READY' }, { icon: '📈', text: '99.9% UPTIME' }].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Form Card (right) ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative', zIndex: 2,
            width: 'min(390px,90vw)',
            background: 'rgba(7,13,33,0.90)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '28px 26px 22px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, margin: '0 0 4px' }}>Connexion</h2>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: '0 0 20px' }}>
            Prêt à propulser votre entreprise vers l'avant ?
          </p>

          <form onSubmit={handleSoumettre} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



            {/* NOM COMPLET */}
            <div>
              <label style={labelStyle}>Nom Complet</label>
              <div style={{ position: 'relative' }}>
                <User size={13} style={iconStyle} />
                <input type="text" placeholder="Jean Dupont" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onFocus={() => setChampActif('fullname')} onBlur={() => setChampActif(null)}
                  style={inputStyle('fullname')} />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label style={labelStyle}>Email Professionnel</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={iconStyle} />
                <input type="email" placeholder="contact@entreprise.fr" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setChampActif('email')} onBlur={() => setChampActif(null)}
                  required style={inputStyle('email')} />
              </div>
            </div>

            {/* MOT DE PASSE */}
            <div>
              <label style={labelStyle}>Mot De Passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={iconStyle} />
                <input type={voirMdp ? 'text' : 'password'} placeholder="••••••••••••" value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  onFocus={() => setChampActif('mdp')} onBlur={() => setChampActif(null)}
                  required style={{ ...inputStyle('mdp'), paddingRight: 40 }} />
                <button type="button" onClick={() => setVoirMdp(!voirMdp)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                }}>
                  {voirMdp ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <div onClick={() => setSeSouvenir(!sesouvenir)} style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${sesouvenir ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                  background: sesouvenir ? '#3b82f6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <AnimatePresence>
                    {sesouvenir && (
                      <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', userSelect: 'none' }}>Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={chargement}
              whileHover={{ scale: chargement ? 1 : 1.02 }}
              whileTap={{ scale: chargement ? 1 : 0.97 }}
              style={{
                width: '100%', padding: '12px', borderRadius: 7,
                border: 'none', cursor: chargement ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                color: 'white', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 18px rgba(59,130,246,0.4)',
                opacity: chargement ? 0.7 : 1, marginTop: 4,
              }}
            >
              {chargement ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  Connexion...
                </>
              ) : 'Connexion'}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.07em' }}>OU CONTINUER AVEC</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[
              {
                label: 'Google',
                onClick: handleGoogleLogin,
                icon: (
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                ),
              },
              { label: 'GitHub', onClick: handleGithubLogin, icon: <Github size={15} /> },
            ].map(({ label, icon, onClick }) => (
              <button key={label} type="button" onClick={onClick} style={{
                flex: 1, padding: '10px', borderRadius: 7,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                {icon} {label}
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 16 }}>
            Déjà un compte ?{' '}
            <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{
        background: 'rgba(3,8,18,0.98)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 60px 0',
        position: 'relative', zIndex: 5,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1.3fr', gap: 40, paddingBottom: 32 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <QLogoSVG size={22} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Quatratech</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12, lineHeight: 1.75, maxWidth: 210 }}>
              Solutions intelligentes pour la gestion d'entreprise moderne. Maximisez votre
              productivité avec <span style={{ color: '#60a5fa' }}>Quatratech</span>.
            </p>
          </div>

          {/* Produit */}
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Produit</p>
            {footerLinks.Produit.map(l => (
              <Link key={l.label} to={l.path} style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginBottom: 10, cursor: 'pointer', display: 'block', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Entreprise */}
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Entreprise</p>
            {footerLinks.Entreprise.map(l => (
              <Link key={l.label} to={l.path} style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginBottom: 10, cursor: 'pointer', display: 'block', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Restez informé</p>
            <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: 6 }}>
              <input
                type="email" placeholder="Email" value={newsletter}
                onChange={e => setNewsletter(e.target.value)}
                required
                style={{
                  flex: 1, padding: '9px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: 'white', fontSize: 12, outline: 'none',
                }}
              />
              <button type="submit" disabled={chargement} style={{
                width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                border: 'none', cursor: chargement ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: chargement ? 0.7 : 1,
              }}>
                {chargement ? (
                   <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                   style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                ) : (
                  <Send size={14} color="white" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>
            © 2024 Quatratech Solutions. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {[<Globe size={14} />, <User size={14} />, <Share2 size={14} />].map((icon, i) => (
              <div key={i} style={{ color: 'rgba(255,255,255,0.28)', cursor: 'pointer' }}>{icon}</div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
