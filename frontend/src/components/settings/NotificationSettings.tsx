import React from 'react';
import { Bell, Mail, Send } from 'lucide-react';
import { UIAppSettings } from '../../services/api';

interface Props {
  settings: UIAppSettings;
  onChange: (field: keyof UIAppSettings, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const NotificationSettings: React.FC<Props> = ({ settings, onChange, onSave, isLoading }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-primary" />
          Notifications
        </h2>
        <p className="text-muted-foreground text-sm">Configurez les alertes, emails et notifications push pour l'equipe.</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        <label className="flex items-start gap-3 p-4 border border-border rounded-lg">
          <input
            type="checkbox"
            className="mt-1"
            checked={settings.notificationsEnabled ?? true}
            onChange={(e) => onChange('notificationsEnabled', e.target.checked)}
          />
          <div>
            <p className="font-medium">Activer les notifications</p>
            <p className="text-sm text-muted-foreground">Permet d'envoyer les alertes dans l'application.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-border rounded-lg">
          <input
            type="checkbox"
            className="mt-1"
            checked={settings.notificationsPushEnabled ?? true}
            onChange={(e) => onChange('notificationsPushEnabled', e.target.checked)}
            disabled={!(settings.notificationsEnabled ?? true)}
          />
          <div>
            <p className="font-medium flex items-center gap-2"><Send className="w-4 h-4" /> Notifications push</p>
            <p className="text-sm text-muted-foreground">Recevoir les alertes importantes en temps reel.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-border rounded-lg">
          <input
            type="checkbox"
            className="mt-1"
            checked={settings.notificationsEmailEnabled ?? false}
            onChange={(e) => onChange('notificationsEmailEnabled', e.target.checked)}
            disabled={!(settings.notificationsEnabled ?? true)}
          />
          <div className="w-full">
            <p className="font-medium flex items-center gap-2"><Mail className="w-4 h-4" /> Alertes email</p>
            <p className="text-sm text-muted-foreground mb-3">Envoyer les notifications critiques par email.</p>
            <input
              type="text"
              placeholder="emails separes par virgule (ex: admin@crm.com, equipe@crm.com)"
              className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={settings.notificationsEmailRecipients || ''}
              onChange={(e) => onChange('notificationsEmailRecipients', e.target.value)}
              disabled={!(settings.notificationsEnabled ?? true) || !(settings.notificationsEmailEnabled ?? false)}
            />
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-border rounded-lg">
          <input
            type="checkbox"
            className="mt-1"
            checked={settings.notificationsDailyDigestEnabled ?? false}
            onChange={(e) => onChange('notificationsDailyDigestEnabled', e.target.checked)}
            disabled={!(settings.notificationsEnabled ?? true)}
          />
          <div>
            <p className="font-medium">Resume quotidien</p>
            <p className="text-sm text-muted-foreground">Recevoir un recapitulatif journalier des alertes et activites.</p>
          </div>
        </label>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer les notifications'}
        </button>
      </div>
    </div>
  );
};
