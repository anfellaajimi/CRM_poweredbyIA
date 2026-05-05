import React from 'react';
import { UIAppSettings } from '../../services/api';

interface Props {
  settings: UIAppSettings;
  onChange: (field: keyof UIAppSettings, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const GeneralSettings: React.FC<Props> = ({ settings, onChange, onSave, isLoading }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Paramètres Généraux</h2>
        <p className="text-muted-foreground text-sm">Informations de l'entreprise affichées sur vos documents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de l'entreprise</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.companyName || ''}
            onChange={(e) => onChange('companyName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Matricule Fiscal</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.companyTaxId || ''}
            onChange={(e) => onChange('companyTaxId', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Code TVA</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.companyVatNumber || ''}
            onChange={(e) => onChange('companyVatNumber', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Référence (Ex: RC)</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.companyReference || ''}
            onChange={(e) => onChange('companyReference', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input
            type="text"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.companyPhone || ''}
            onChange={(e) => onChange('companyPhone', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.companyEmail || ''}
            onChange={(e) => onChange('companyEmail', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Adresse complète</label>
          <textarea
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
            value={settings.companyAddress || ''}
            onChange={(e) => onChange('companyAddress', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};
