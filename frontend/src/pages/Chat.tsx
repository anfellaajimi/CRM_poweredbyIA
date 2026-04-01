import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Send,
  Mic,
  Phone,
  Video,
  MoreVertical,
  Trash2,
  CheckCheck,
  Check,
  Circle,
  Edit,
  Filter,
  Smile,
  Paperclip,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Modal } from '../components/ui/Modal';
import { chatAPI, UIContact, UIChatMessage } from '../services/api';
import { useAuthStore } from '../store/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (isoStr: string | null) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (isoStr: string | null) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return fmtTime(isoStr);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: 'Administrateur',
    manager: 'Manager',
    developpeur: 'Développeur',
    developer: 'Développeur',
    auditor: 'Auditeur',
  };
  return map[role.toLowerCase()] ?? role;
};

const avatarUrl = (nom: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(nom)}&background=random&size=64`;

const resolveMediaUrl = (maybePath: string) => {
  if (!maybePath) return maybePath;
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  try {
    const base = new URL(apiBase);
    const path = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;
    return `${base.protocol}//${base.host}${path}`;
  } catch {
    return maybePath;
  }
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const MessageStatus: React.FC<{ lu: boolean }> = ({ lu }) =>
  lu ? (
    <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
  ) : (
    <Check className="w-3.5 h-3.5 text-muted-foreground" />
  );

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const sizeClass = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }[size];
  return (
    <img
      src={avatarUrl(name)}
      alt={name}
      className={cn(sizeClass, 'rounded-full object-cover ring-2 ring-border flex-shrink-0')}
    />
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const me = useAuthStore(s => s.user);
  const myUserID = me?.id ? Number(me.id) : null;
  const [contacts, setContacts] = useState<UIContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<UIContact | null>(null);
  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCallModal, setShowCallModal] = useState<{ type: 'audio' | 'video'; name: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const stopMediaTracks = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    for (const t of stream.getTracks()) t.stop();
    mediaStreamRef.current = null;
  }, []);

  const resetRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      // Cancel: stop without producing a blob.
      try {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    setRecordingTime(0);
    setRecordedAudio(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    setSendingAudio(false);
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    stopMediaTracks();
  }, [recordedAudioUrl, stopMediaTracks]);

  const startRecording = useCallback(async () => {
    if (!selectedContact) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Votre navigateur ne supporte pas l'enregistrement audio.");
      return;
    }

    if (recordedAudio || recordedAudioUrl) resetRecording();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
      const mimeType =
        preferredTypes.find(t => (window as any).MediaRecorder?.isTypeSupported?.(t)) ?? undefined;

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blobType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: blobType });
        setRecordedAudio(blob);
        setRecordedAudioUrl(URL.createObjectURL(blob));
        stopMediaTracks();
      };

      setIsRecording(true);
      recorder.start(200);
    } catch {
      setError('Accès micro refusé ou indisponible.');
      resetRecording();
    }
  }, [recordedAudio, recordedAudioUrl, resetRecording, selectedContact, stopMediaTracks]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    try {
      recorder.stop();
    } catch {
      // ignore
    } finally {
      setIsRecording(false);
    }
  }, []);

  const sendAudio = useCallback(async () => {
    if (!selectedContact || !recordedAudio || sendingAudio) return;
    setSendingAudio(true);
    try {
      const msg = await chatAPI.sendAudioMessage(selectedContact.userID, recordedAudio, recordingTime);
      setMessages(prev => [...prev, msg]);
      setError(null);
      resetRecording();
    } catch {
      setError('Envoi du message vocal impossible.');
    } finally {
      setSendingAudio(false);
    }
  }, [recordedAudio, recordingTime, resetRecording, selectedContact, sendingAudio]);

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actionsMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!actionsMenuRef.current) return;
      if (!actionsMenuRef.current.contains(e.target as Node)) setActionsMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionsMenuOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [actionsMenuOpen]);

  useEffect(() => {
    setActionsMenuOpen(false);
  }, [selectedContact]);

  // ── Fetch contacts ───────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      const data = await chatAPI.getContacts();
      setContacts(data);
      setError(null);
    } catch {
      setError('Impossible de charger les contacts.');
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Fetch conversation ───────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (contact: UIContact) => {
    setLoadingMessages(true);
    try {
      const data = await chatAPI.getConversation(contact.userID);
      setMessages(data);
      // Update unread in contact list
      setContacts(prev =>
        prev.map(c => (c.userID === contact.userID ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      // silently fail on polling
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Load conversation on contact select ──────────────────────────────────────
  useEffect(() => {
    if (!selectedContact) return;
    fetchMessages(selectedContact);

    // Poll every 5 seconds for new messages
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const data = await chatAPI.getConversation(selectedContact.userID);
        setMessages(data);
      } catch {
        // silent
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedContact, fetchMessages]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Get current logged-in user ID from token ─────────────────────────────────
  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !selectedContact || sending) return;

    setSending(true);
    setMessageInput('');

    try {
      const newMsg = await chatAPI.sendMessage(selectedContact.userID, text);
      setMessages(prev => [...prev, newMsg]);
      // Update last message in contacts list
      setContacts(prev =>
        prev.map(c =>
          c.userID === selectedContact.userID
            ? { ...c, lastMessage: text, lastMessageTime: newMsg.createdAt }
            : c
        )
      );
    } catch {
      setMessageInput(text); // restore on error
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteConversation = async () => {
    if (!selectedContact || deletingConversation) return;

    setDeletingConversation(true);
    try {
      await chatAPI.deleteConversation(selectedContact.userID);
      setMessages([]);
      setContacts(prev =>
        prev.map(c =>
          c.userID === selectedContact.userID
            ? { ...c, lastMessage: null, lastMessageTime: null, unreadCount: 0 }
            : c
        )
      );
      setConfirmDeleteOpen(false);
      setError(null);
    } catch {
      setError('Suppression impossible. Veuillez réessayer.');
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filtered = contacts.filter(
    c =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] p-4 gap-4 relative overflow-hidden">
      {/* ── Call Modal Simulation ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/50 mb-6 shadow-2xl shadow-primary/20">
                <img src={avatarUrl(showCallModal.name)} alt="" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{showCallModal.name}</h2>
              <p className="text-primary animate-pulse font-medium mb-12">
                Appel {showCallModal.type === 'video' ? 'vidéo' : 'audio'} en cours...
              </p>
              
              <div className="flex gap-8">
                <button 
                  onClick={() => setShowCallModal(null)}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/80 transition-colors shadow-lg"
                >
                  <Phone className="w-8 h-8 rotate-[135deg]" />
                </button>
                <button className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Mic className="w-6 h-6" />
                </button>
                {showCallModal.type === 'video' && (
                  <button className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Video className="w-6 h-6" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Voice Overlay Simulation ─────────────────────────────────────── */}
      <AnimatePresence>
        {(isRecording || recordedAudioUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-card border border-border shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 min-w-[300px]"
          >
            {isRecording ? (
              <>
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Enregistrement vocal...</p>
                  <p className="text-xs text-muted-foreground">{fmtDuration(recordingTime)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetRecording()}
                    className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                  >
                    Stop
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Aperçu message vocal</p>
                  <p className="text-xs text-muted-foreground">{fmtDuration(recordingTime)}</p>
                  {recordedAudioUrl && (
                    <audio className="mt-2 w-[240px] max-w-full" controls src={recordedAudioUrl} />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => resetRecording()}
                    disabled={sendingAudio}
                    className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground transition-colors disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={sendAudio}
                    disabled={sendingAudio}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                  >
                    {sendingAudio ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        type="file"
        id="chat-file-input"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0];
          if (!file || !selectedContact) return;
          // Simulate upload
          setSending(true);
          try {
            const newMsg = await chatAPI.sendMessage(
              selectedContact.userID,
              `📎 Fichier envoyé : ${file.name}`
            );
            setMessages(prev => [...prev, newMsg]);
          } finally {
            setSending(false);
          }
        }}
      />

      {/* ── Left panel: contacts ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex-shrink-0 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Messages</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Online count */}
        <div className="px-4 py-2 flex items-center gap-2">
          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
          <span className="text-xs text-muted-foreground">
            {contacts.length} membre{contacts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground text-sm px-4 text-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              Aucun résultat
            </div>
          ) : (
            filtered.map(contact => (
              <button
                key={contact.userID}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors relative',
                  selectedContact?.userID === contact.userID &&
                    'bg-primary/10 border-r-2 border-primary'
                )}
              >
                <Avatar name={contact.nom} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-sm font-semibold truncate',
                        selectedContact?.userID === contact.userID && 'text-primary'
                      )}
                    >
                      {contact.nom}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {fmtDate(contact.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.lastMessage ?? 'Aucun message'}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary/70 mt-0.5 truncate">
                    {roleLabel(contact.role)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Right panel: conversation ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-lg"
      >
        {selectedContact ? (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar name={selectedContact.nom} size="lg" />
                <div>
                  <h3 className="font-semibold">{selectedContact.nom}</h3>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel(selectedContact.role)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCallModal({ type: 'audio', name: selectedContact.nom })}
                  className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-emerald-500 transition-colors"
                  title="Appel audio"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCallModal({ type: 'video', name: selectedContact.nom })}
                  className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-blue-500 transition-colors"
                  title="Appel vidéo"
                >
                  <Video className="w-4 h-4" />
                </button>
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    onClick={() => setActionsMenuOpen(v => !v)}
                    className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Actions"
                    aria-haspopup="menu"
                    aria-expanded={actionsMenuOpen}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {actionsMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                        role="menu"
                      >
                        <button
                          onClick={() => {
                            setActionsMenuOpen(false);
                            navigate(`/users?edit=${selectedContact.userID}`);
                          }}
                          className="w-full px-3 py-2.5 flex items-center gap-2 text-sm hover:bg-accent transition-colors text-left"
                          role="menuitem"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            setActionsMenuOpen(false);
                            setConfirmDeleteOpen(true);
                          }}
                          className="w-full px-3 py-2.5 flex items-center gap-2 text-sm hover:bg-accent transition-colors text-left text-destructive"
                          role="menuitem"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 80%, hsl(var(--primary)/0.04) 0%, transparent 60%)',
              }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Aucun message. Démarrez la conversation !</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isMe = myUserID != null ? msg.expediteurID === myUserID : false;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const isSameSender = prevMsg && prevMsg.expediteurID === msg.expediteurID;
                    const senderName = isMe ? 'Moi' : selectedContact.nom;

                    // Date grouping logic
                    const currDate = new Date(msg.createdAt).toLocaleDateString();
                    const prevDate = prevMsg ? new Date(prevMsg.createdAt).toLocaleDateString() : null;
                    const showDateHeader = currDate !== prevDate;
                    const dateLabel = fmtDate(msg.createdAt);

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateHeader && (
                          <div className="flex justify-center my-6">
                            <span className="px-3 py-1 rounded-full bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border border-border">
                              {dateLabel}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'flex flex-col',
                            isMe ? 'items-end' : 'items-start',
                            isSameSender ? 'mt-1' : 'mt-4'
                          )}
                        >
                          {/* Sender Name (only if different sender) */}
                          {!isSameSender && (
                            <span className="text-[10px] font-bold text-muted-foreground mb-1 px-1 opacity-70">
                              {senderName} • {fmtTime(msg.createdAt)}
                            </span>
                          )}

                          <div className={cn('flex group', isMe ? 'flex-row-reverse' : 'flex-row')}>
                            {!isMe && (
                              <div className="w-8 mr-2 flex-shrink-0">
                                {!isSameSender && (
                                  <img
                                    src={avatarUrl(selectedContact.nom)}
                                    alt={selectedContact.nom}
                                    className="w-8 h-8 rounded-full object-cover border border-border shadow-sm"
                                  />
                                )}
                              </div>
                            )}
                            <div
                              className={cn(
                                'max-w-[85%] flex flex-col',
                                isMe ? 'items-end' : 'items-start'
                              )}
                            >
                              <div
                                className={cn(
                                  'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm relative group transition-all hover:shadow-md',
                                  isMe
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-card border border-border text-foreground rounded-tl-none',
                                  isSameSender && (isMe ? 'rounded-tr-2xl' : 'rounded-tl-2xl')
                                )}
                              >
                                {msg.type === 'audio' && msg.mediaUrl ? (
                                  <audio
                                    controls
                                    preload="metadata"
                                    className="w-[260px] max-w-full"
                                    src={resolveMediaUrl(msg.mediaUrl)}
                                  />
                                ) : (
                                  msg.contenu
                                )}
                              </div>
                            </div>
                            {isMe && (
                              <div className="ml-2 mt-auto pb-1">
                                <MessageStatus lu={msg.lu} />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-border relative">
              {/* Simple Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-20 left-4 bg-card border border-border rounded-2xl p-3 shadow-2xl z-50 grid grid-cols-6 gap-2"
                  >
                    {['😊', '😂', '🔥', '👍', '❤️', '👋', '🙌', '✨', '🚀', '✅', '❌', '🤔'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessageInput(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2 bg-muted/50 rounded-2xl border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    'p-1.5 transition-colors flex-shrink-0',
                    showEmojiPicker ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById('chat-file-input')?.click()}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById('chat-file-input')?.click()}
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <textarea
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message... (Entrée pour envoyer)"
                  rows={1}
                  className="flex-1 bg-transparent resize-none text-sm focus:outline-none py-1 max-h-32 placeholder:text-muted-foreground"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={() => {
                    if (!selectedContact) return;
                    if (isRecording) stopRecording();
                    else startRecording();
                  }}
                  className={cn(
                     "p-1.5 transition-colors flex-shrink-0",
                     isRecording ? "text-destructive" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sending}
                  className={cn(
                    'p-2 rounded-xl transition-all flex-shrink-0',
                    messageInput.trim() && !sending
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-primary/30'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1.5">
                Appuyez sur Entrée pour envoyer · Shift+Entrée pour la ligne suivante
              </p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-primary/40" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Vos messages</p>
              <p className="text-sm mt-1">
                Sélectionnez un contact pour démarrer une conversation
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => {
          if (deletingConversation) return;
          setConfirmDeleteOpen(false);
        }}
        title="Supprimer"
        size="sm"
      >
        <p className="text-sm text-muted-foreground">
          Supprimer la conversation avec{' '}
          <span className="font-semibold text-foreground">{selectedContact?.nom}</span> ?
          <br />
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={deletingConversation}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-accent transition-colors text-sm disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmDeleteConversation}
            disabled={deletingConversation}
            className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-semibold disabled:opacity-60"
          >
            {deletingConversation ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
