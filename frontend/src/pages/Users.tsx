import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Power, Trash2, Search, ChevronDown, Users as UsersIcon, Activity } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../store/authStore';
import { usersAPI, UIUser } from '../services/api';

const obtenirCouleurRole = (role: string) => {
  if (role === 'Admin') return 'bg-red-100 text-red-700 border-red-200';
  if (role === 'Manager') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-blue-100 text-blue-600 border-blue-200';
};

const obtenirInitiales = (nom: string) => {
  const mots = nom?.trim().split(' ');
  if (!mots?.length) return '?';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
};

const obtenirCouleurAvatar = (nom: string) => {
  const couleurs = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500',
    'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < (nom?.length || 0); i++) hash += nom.charCodeAt(i);
  return couleurs[hash % couleurs.length];
};

export const Users: React.FC = () => {
  const { user: utilisateurCourant } = useAuthStore();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [modalModifierOuvert, setModalModifierOuvert] = useState(false);
  const [modalCreerOuvert, setModalCreerOuvert] = useState(false);
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<UIUser | null>(null);
  const [motDePasse, setMotDePasse] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState('Tous');
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [nouvelUtilisateur, setNouvelUtilisateur] = useState({
    name: '', email: '', telephone: '', dateNaissance: '', role: 'Developer' as UIUser['role'],
    status: 'Actif' as UIUser['status'], password: '',
  });

  const { data: utilisateurs = [] } = useQuery({ queryKey: ['users'], queryFn: usersAPI.getAll });

  useEffect(() => {
    if (!editId) return;

    const u = utilisateurs.find(x => String(x.id) === String(editId));
    if (!u) return;

    setUtilisateurSelectionne({ ...u });
    setModalModifierOuvert(true);
    setSearchParams(prev => {
      prev.delete('edit');
      return prev;
    }, { replace: true });
  }, [editId, setSearchParams, utilisateurs]);

  const mutationCreer = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
      setModalCreerOuvert(false);
      setNouvelUtilisateur({ name: '', email: '', telephone: '', dateNaissance: '', role: 'Developer', status: 'Actif', password: '' });
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationModifier = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => usersAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur mis à jour');
      setModalModifierOuvert(false);
      setUtilisateurSelectionne(null);
      setMotDePasse('');
    },
    onError: (err: any) => toast.error(`Erreur: ${err?.response?.data?.message ?? err?.message}`),
  });

  const mutationSupprimer = useMutation({
    mutationFn: (id: string) => usersAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Suppression impossible'),
  });

  const basculerStatut = (user: UIUser) => {
    const prochainStatut: UIUser['status'] = user.status === 'Actif' ? 'Inactif' : 'Actif';
    mutationModifier.mutate({ id: user.id, payload: { status: prochainStatut } });
  };

  const sauvegarderUtilisateur = () => {
    if (!utilisateurSelectionne) return;
    const payload: any = {
      name: utilisateurSelectionne.name,
      email: utilisateurSelectionne.email,
      telephone: utilisateurSelectionne.telephone,
      dateNaissance: utilisateurSelectionne.dateNaissance,
      role: utilisateurSelectionne.role,
      status: utilisateurSelectionne.status,
    };
    if (motDePasse.trim()) payload.password = motDePasse;
    mutationModifier.mutate({ id: utilisateurSelectionne.id, payload });
  };

  const confirmerSuppression = (user: UIUser) => {
    if (window.confirm(`Supprimer l'utilisateur "${user.name}" ?`)) {
      mutationSupprimer.mutate(user.id);
    }
  };

  const premierId = useMemo(() => {
    if (!utilisateurs.length) return null;
    return utilisateurs.reduce((minId, u) => (Number(u.id) < Number(minId) ? u.id : minId), utilisateurs[0].id);
  }, [utilisateurs]);

  const utilisateursTries = useMemo(() => [...utilisateurs].sort((a, b) => Number(b.id) - Number(a.id)), [utilisateurs]);

  const utilisateursFiltres = useMemo(() => {
    return utilisateursTries.filter((u) => {
      const correspondRecherche =
        !recherche ||
        u.name?.toLowerCase().includes(recherche.toLowerCase()) ||
        u.email?.toLowerCase().includes(recherche.toLowerCase());
      const correspondRole = filtreRole === 'Tous' || u.role === filtreRole;
      const correspondStatut = filtreStatut === 'Tous' || u.status === filtreStatut;
      return correspondRecherche && correspondRole && correspondStatut;
    });
  }, [utilisateursTries, recherche, filtreRole, filtreStatut]);

  const stats = useMemo(() => {
    const totalMembres = utilisateurs.length;
    const actifs = utilisateurs.filter((u) => u.status === 'Actif').length;
    return { totalMembres, actifs };
  }, [utilisateurs]);

  if (utilisateurCourant?.role !== 'Admin') {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Accès refusé</h3>
          <p className="text-gray-500">Seul un administrateur peut gérer les utilisateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérer les membres et permissions</p>
        </div>
        <button
          onClick={() => setModalCreerOuvert(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Membres</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalMembres}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Sessions Actives</p>
          <p className="text-3xl font-bold text-green-600">{stats.actifs}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Rechercher un utilisateur..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              value={filtreRole}
              onChange={(e) => setFiltreRole(e.target.value)}
            >
              <option value="Tous">Tous les rôles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Developer">Developer</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <p className="ml-auto text-xs text-gray-400">{utilisateursFiltres.length} utilisateur(s)</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 font-medium border-b border-gray-100">
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3">Dernière activité</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateursFiltres.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucun utilisateur trouvé</td></tr>
              )}
              {utilisateursFiltres.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${obtenirCouleurAvatar(user.name)}`}>
                          {obtenirInitiales(user.name)}
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${obtenirCouleurRole(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${user.status === 'Actif' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.joinedAt}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      <span>Récemment</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Modifier */}
                      <button
                        onClick={() => { setUtilisateurSelectionne(user); setModalModifierOuvert(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors border border-gray-200"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {/* Activer/Désactiver */}
                      <button
                        onClick={() => basculerStatut(user)}
                        disabled={mutationModifier.isPending}
                        className={`p-1.5 rounded-lg transition-colors border disabled:opacity-50 ${user.status === 'Actif'
                          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'
                          }`}
                        title={user.status === 'Actif' ? 'Désactiver' : 'Activer'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      {/* Supprimer */}
                      <button
                        onClick={() => confirmerSuppression(user)}
                        disabled={user.id === premierId || mutationSupprimer.isPending}
                        className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white border border-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title={user.id === premierId ? 'Le premier utilisateur ne peut pas être supprimé' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Créer */}
      <Modal isOpen={modalCreerOuvert} onClose={() => setModalCreerOuvert(false)} title="Ajouter un utilisateur">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutationCreer.mutate(nouvelUtilisateur); }}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Nom *</label>
            <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.name} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email *</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.email} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Téléphone </label>
              <input type="tel" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.telephone || ''} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, telephone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Date de naissance </label>
              <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.dateNaissance || ''} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, dateNaissance: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Mot de passe *</label>
            <input type="password" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.password} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, password: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Rôle</label>
              <select className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.role} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, role: e.target.value as UIUser['role'] })}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Developer">Developer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Statut</label>
              <select className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={nouvelUtilisateur.status} onChange={(e) => setNouvelUtilisateur({ ...nouvelUtilisateur, status: e.target.value as UIUser['status'] })}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalCreerOuvert(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" disabled={mutationCreer.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {mutationCreer.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={modalModifierOuvert} onClose={() => setModalModifierOuvert(false)} title="Modifier l'utilisateur">
        {utilisateurSelectionne && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); sauvegarderUtilisateur(); }}>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Nom *</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={utilisateurSelectionne.name} onChange={(e) => setUtilisateurSelectionne({ ...utilisateurSelectionne, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Email *</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={utilisateurSelectionne.email} onChange={(e) => setUtilisateurSelectionne({ ...utilisateurSelectionne, email: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Téléphone </label>
                <input type="tel" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={utilisateurSelectionne.telephone || ''} onChange={(e) => setUtilisateurSelectionne({ ...utilisateurSelectionne, telephone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Date de naissance </label>
                <input type="date" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={utilisateurSelectionne.dateNaissance || ''} onChange={(e) => setUtilisateurSelectionne({ ...utilisateurSelectionne, dateNaissance: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Nouveau mot de passe </label>
              <input type="password" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Rôle</label>
                <select className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={utilisateurSelectionne.role} onChange={(e) => setUtilisateurSelectionne({ ...utilisateurSelectionne, role: e.target.value as UIUser['role'] })}>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Statut</label>
                <select className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={utilisateurSelectionne.status} onChange={(e) => setUtilisateurSelectionne({ ...utilisateurSelectionne, status: e.target.value as UIUser['status'] })}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setModalModifierOuvert(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={mutationModifier.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {mutationModifier.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
