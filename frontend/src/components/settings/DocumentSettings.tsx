import React, { useRef, useState } from 'react';
import { UIAppSettings, settingsAPI } from '../../services/api';
import { Upload, ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  settings: UIAppSettings;
  onChange: (field: keyof UIAppSettings, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

const ImageUploadField: React.FC<{
  label: string;
  subLabel: string;
  value?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}> = ({ label, subLabel, value, onUpload, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    try {
      setIsUploading(true);
      const url = await settingsAPI.uploadImage(file);
      onUpload(url);
      toast.success('Image mise à jour');
    } catch (err) {
      toast.error('Échec de l\'envoi de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-start gap-4">
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            relative w-32 h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden
            ${value ? 'border-primary/20 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : value ? (
            <>
              <img src={value} alt={label} className="w-full h-full object-contain p-2" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Cliquer pour uploader</span>
            </>
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{subLabel}</p>
          {value && (
            <button 
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline"
            >
              <X className="w-3 h-3" />
              Supprimer l'image
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
      </div>
    </div>
  );
};

export const DocumentSettings: React.FC<Props> = ({ settings, onChange, onSave, isLoading }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-1">Devis & Factures</h2>
        <p className="text-muted-foreground text-sm">Configurez l'apparence et les paramètres par défaut de vos documents financiers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageUploadField 
          label="Logo de l'entreprise"
          subLabel="Sera affiché en haut à gauche des documents. Format recommandé: PNG transparent."
          value={settings.logoUrl}
          onUpload={(url) => onChange('logoUrl', url)}
          onRemove={() => onChange('logoUrl', '')}
        />

        <ImageUploadField 
          label="Cachet / Signature"
          subLabel="Sera affiché en bas à droite des documents. Sera utilisé pour valider vos contrats."
          value={settings.stampUrl}
          onUpload={(url) => onChange('stampUrl', url)}
          onRemove={() => onChange('stampUrl', '')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium">TVA par défaut (%)</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.defaultTaxRate || 19}
            onChange={(e) => onChange('defaultTaxRate', parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Validité des devis par défaut (jours)</label>
          <input
            type="number"
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={settings.defaultValidityDays || 30}
            onChange={(e) => onChange('defaultValidityDays', parseInt(e.target.value, 10))}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="block text-sm font-medium">Notes et conditions par défaut (Pied de page)</label>
          <textarea
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none"
            placeholder="Conditions de paiement, coordonnées bancaires..."
            value={settings.documentNotes || ''}
            onChange={(e) => onChange('documentNotes', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-border">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};
