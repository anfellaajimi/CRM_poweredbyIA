import React, { useState } from 'react';
import { UIAppSettings } from '../../services/api';
import { Bot, Key, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  settings: UIAppSettings;
  onChange: (field: keyof UIAppSettings, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const IASettings: React.FC<Props> = ({ settings, onChange, onSave, isLoading }) => {
  const [showKey, setShowKey] = useState(false);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
          Intelligence Artificielle
        </h2>
        <p className="text-muted-foreground text-sm">Configurez l'intégration IA utilisée pour les analyses de projets et les recommandations CRM.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <Bot className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Intégration API</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Les fonctionnalités d'analyse IA nécessitent une clé API valide. Les appels sont effectués directement depuis le backend pour garantir la sécurité de votre clé.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fournisseur IA</label>
          <select
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-card"
            value={settings.aiProvider || 'openai'}
            onChange={(e) => onChange('aiProvider', e.target.value)}
          >
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="google">Google (Gemini)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Modèle</label>
          <input
            type="text"
            placeholder="ex: gpt-4-turbo-preview, claude-3-opus-20240229..."
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            value={settings.aiModel || ''}
            onChange={(e) => onChange('aiModel', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex justify-between">
            <span>Clé API Secrète</span>
            <button 
              type="button" 
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              {showKey ? 'Masquer' : 'Afficher'}
            </button>
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              className="w-full pl-9 pr-3 border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              value={settings.aiApiKey || ''}
              onChange={(e) => onChange('aiApiKey', e.target.value)}
            />
          </div>
          {settings.aiApiKey ? (
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Clé configurée
            </p>
          ) : (
            <p className="text-xs text-amber-600 mt-2 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> Aucune clé configurée, l'IA est désactivée.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border mt-8">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer la configuration IA'}
        </button>
      </div>
    </div>
  );
};
