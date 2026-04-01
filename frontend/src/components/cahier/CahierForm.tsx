import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import type { UICahier } from '../../services/api';

type SimpleProject = { id: string | number; name: string };

export function CahierForm({
  valeurs,
  setValeurs,
  projets = [],
  showProjectSelect = true,
  lockedProjectName,
  onSoumettre,
  onAnnuler,
  chargement,
  btnLabel,
  cancelLabel = 'Annuler',
}: {
  valeurs: Partial<UICahier>;
  setValeurs: (v: Partial<UICahier>) => void;
  projets?: SimpleProject[];
  showProjectSelect?: boolean;
  lockedProjectName?: string;
  onSoumettre: () => void;
  onAnnuler?: () => void;
  chargement: boolean;
  btnLabel: string;
  cancelLabel?: string;
}) {
  const modules = useMemo(() => {
    const imageHandler = function (this: any) {
      const quill = this?.quill;
      if (!quill) return;

      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl !== 'string') return;
          const range = quill.getSelection(true);
          const insertAt = range ? range.index : quill.getLength();
          quill.insertEmbed(insertAt, 'image', dataUrl, 'user');
          quill.setSelection(insertAt + 1, 0, 'silent');
        };
        reader.readAsDataURL(file);
      };
    };

    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    };
  }, []);

  const formats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'code-block',
      'color',
      'background',
      'list',
      'bullet',
      'indent',
      'link',
      'image',
    ],
    []
  );

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSoumettre(); }}>
      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Projet *</label>
            {showProjectSelect ? (
              <select
                className="w-full border border-gray-200 rounded-lg p-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={valeurs.projetID || 0}
                onChange={(e) => setValeurs({ ...valeurs, projetID: Number(e.target.value) })}
                required
              >
                <option value={0}>Sélectionner un projet</option>
                {projets.map((p) => (
                  <option key={String(p.id)} value={Number(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-sm text-gray-700">
                {lockedProjectName || '—'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Objet *</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={valeurs.objet || ''}
              onChange={(e) => setValeurs({ ...valeurs, objet: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Version</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={valeurs.version || ''}
              onChange={(e) => setValeurs({ ...valeurs, version: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date de validation</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={valeurs.dateValidation || ''}
              onChange={(e) => setValeurs({ ...valeurs, dateValidation: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Fichier (URL)</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={valeurs.fileUrl || ''}
              onChange={(e) => setValeurs({ ...valeurs, fileUrl: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Délais</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={valeurs.delais || ''}
              onChange={(e) => setValeurs({ ...valeurs, delais: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Budget</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={valeurs.budgetTexte || ''}
              onChange={(e) => setValeurs({ ...valeurs, budgetTexte: e.target.value })}
            />
          </div>
        </div>

        {[
          { champ: 'description', label: 'Description' },
          { champ: 'objectif', label: 'Objectif' },
          { champ: 'perimetre', label: 'Périmètre' },
          { champ: 'fonctionnalites', label: 'Fonctionnalités' },
          { champ: 'contraintes', label: 'Contraintes' },
          { champ: 'userStories', label: 'User Stories' },
          { champ: 'reglesMetier', label: 'Règles Métier' },
          { champ: 'documentsReference', label: 'Documents de Référence' },
        ].map(({ champ, label }) => (
          <div key={champ}>
            <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
            <div className="bg-white rounded-lg">
              <ReactQuill
                theme="snow"
                value={(valeurs as any)[champ] || ''}
                onChange={(content) => setValeurs({ ...valeurs, [champ]: content })}
                modules={modules}
                formats={formats}
                className="h-40 mb-12"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        {onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={chargement}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {chargement ? 'Enregistrement...' : btnLabel}
        </button>
      </div>
    </form>
  );
}

