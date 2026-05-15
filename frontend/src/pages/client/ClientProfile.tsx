import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Building2, 
  Camera,
  Save,
  Shield,
  Key
} from 'lucide-react';
import { clientPortalAPI } from '../../services/api';
import { toast } from 'sonner';

export const ClientProfile: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['client-profile'], queryFn: clientPortalAPI.getProfile });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    tel: '',
    adresse: '',
    entreprise: '',
    raisonSociale: ''
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        nom: profile.user.name || '',
        email: profile.user.email || '',
        tel: profile.client?.tel || '',
        adresse: profile.client?.adresse || '',
        entreprise: profile.client?.entreprise || '',
        raisonSociale: profile.client?.raisonSociale || ''
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => clientPortalAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      toast.success('Profil mis à jour avec succès');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mon Profil</h2>
        <p className="text-gray-500 font-medium mt-1">Gérez vos informations personnelles et les paramètres de votre compte.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-indigo-600 to-purple-600" />
            
            <div className="relative mt-4 mb-6">
              <div className="w-24 h-24 rounded-3xl bg-white p-1 mx-auto shadow-xl">
                <div className="w-full h-full rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden relative">
                  {profile?.user?.avatar ? (
                    <img src={profile.user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-indigo-600" />
                  )}
                  <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera size={20} />
                  </button>
                </div>
              </div>
            </div>

            <h3 className="font-black text-xl text-gray-900">{profile?.user?.name}</h3>
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">Client Privilégié</p>
            
            <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
               <button 
                 onClick={() => {
                   if (isEditing) {
                     // Reset form data on cancel
                     if (profile) {
                       setFormData({
                         nom: profile.user.name || '',
                         email: profile.user.email || '',
                         tel: profile.client?.tel || '',
                         adresse: profile.client?.adresse || '',
                         entreprise: profile.client?.entreprise || '',
                         raisonSociale: profile.client?.raisonSociale || ''
                       });
                     }
                   }
                   setIsEditing(!isEditing);
                 }}
                 className="w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
               >
                 {isEditing ? 'Annuler' : 'Modifier le profil'}
               </button>
               <button className="w-full py-4 bg-white border border-gray-100 text-indigo-600 rounded-2xl font-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                 <Key size={18} />
                 Sécurité
               </button>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-[40px] p-8 text-white">
            <div className="flex items-center gap-3 mb-4 text-indigo-300">
              <Shield size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Confidentialité</span>
            </div>
            <p className="text-sm font-medium leading-relaxed opacity-80">
              Vos données sont protégées par notre système de chiffrement de bout en bout conforme au RGPD.
            </p>
          </div>
        </div>

        {/* Form Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     disabled={!isEditing}
                     name="nom"
                     type="text" 
                     value={formData.nom}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 disabled:opacity-60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900" 
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email professionnel</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     disabled={!isEditing}
                     name="email"
                     type="email" 
                     value={formData.email}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 disabled:opacity-60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900" 
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     disabled={!isEditing}
                     name="tel"
                     type="text" 
                     value={formData.tel}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 disabled:opacity-60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900" 
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Entreprise</label>
                <div className="relative">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                     disabled={!isEditing}
                     name="entreprise"
                     type="text" 
                     value={formData.entreprise}
                     onChange={handleChange}
                     className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 disabled:opacity-60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900" 
                   />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Adresse</label>
              <div className="relative">
                 <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                 <textarea 
                   disabled={!isEditing}
                   name="adresse"
                   value={formData.adresse}
                   onChange={handleChange}
                   rows={3}
                   className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 disabled:opacity-60 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 resize-none" 
                 />
              </div>
            </div>

            {isEditing && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
