import React from 'react';
import { UIAppSettings } from '../../services/api';

interface Props {
  settings: UIAppSettings;
  onChange: (field: keyof UIAppSettings, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const DocumentSettings: React.FC<Props> = ({ settings, onChange, onSave, isLoading }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Devis & Factures</h2>
        <p className="text-muted-foreground text-sm">Configurez l'apparence et les paramètres par défaut de vos documents financiers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Logo de l'entreprise (URL)</label>
          <input
            type="text"
            placeholder="https://..."
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.logoUrl || ''}
            onChange={(e) => onChange('logoUrl', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Sera affiché en haut à gauche des documents.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cachet / Signature (URL)</label>
          <input
            type="text"
            placeholder="https://..."
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.stampUrl || ''}
            onChange={(e) => onChange('stampUrl', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Sera affiché en bas à droite des documents.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">TVA par défaut (%)</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.defaultTaxRate || 19}
            onChange={(e) => onChange('defaultTaxRate', parseFloat(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Validité des devis par défaut (jours)</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.defaultValidityDays || 30}
            onChange={(e) => onChange('defaultValidityDays', parseInt(e.target.value, 10))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notes et conditions par défaut (Pied de page)</label>
          <textarea
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
            placeholder="Conditions de paiement, coordonnées bancaires..."
            value={settings.documentNotes || ''}
            onChange={(e) => onChange('documentNotes', e.target.value)}
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
