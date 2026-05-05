import React from 'react';
import { Palette } from 'lucide-react';
import { UIAppSettings } from '../../services/api';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  settings: UIAppSettings;
  onChange: (field: keyof UIAppSettings, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

const PRESET_COLORS = ['#6366f1', '#2563eb', '#0891b2', '#059669', '#ea580c', '#dc2626'];

export const AppearanceSettings: React.FC<Props> = ({ settings, onChange, onSave, isLoading }) => {
  const { setTheme } = useThemeStore();

  const applyPreview = (theme: 'light' | 'dark', primaryColor: string) => {
    setTheme(theme);
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--ring', primaryColor);
    document.documentElement.style.setProperty('--chart-1', primaryColor);
  };

  const currentTheme = settings.appearanceTheme || 'light';
  const currentPrimary = settings.appearancePrimaryColor || '#6366f1';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-primary" />
          Apparence
        </h2>
        <p className="text-muted-foreground text-sm">Personnalisez les couleurs et le theme de l'interface.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select
            className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card"
            value={currentTheme}
            onChange={(e) => {
              const nextTheme = e.target.value as 'light' | 'dark';
              onChange('appearanceTheme', nextTheme);
              applyPreview(nextTheme, currentPrimary);
            }}
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Couleur principale</label>
          <input
            type="color"
            className="h-10 w-full border border-border rounded-lg p-1 bg-card"
            value={currentPrimary}
            onChange={(e) => {
              onChange('appearancePrimaryColor', e.target.value);
              applyPreview(currentTheme, e.target.value);
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Palettes rapides</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="w-8 h-8 rounded-full border border-border"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange('appearancePrimaryColor', color);
                applyPreview(currentTheme, color);
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : "Enregistrer l'apparence"}
        </button>
      </div>
    </div>
  );
};
