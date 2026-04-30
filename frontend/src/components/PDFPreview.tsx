import React from 'react';
import { cn } from '../utils/cn';

interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

interface PDFPreviewProps {
  type: 'DEVIS' | 'FACTURE';
  number: string;
  date: string;
  clientName: string;
  clientTVA?: string;
  items: Item[];
  amount: number;
  devise?: string;
  taxRate?: number;
  fiscalStamp?: number;
  validUntil?: string; // For Devis
  dueAt?: string;      // For Facture
}

const COLOR_DARK_BLUE = 'text-[#1e3a8a]';
const COLOR_LIGHT_BLUE = 'text-[#3b82f6]';
const BG_LIGHT_BLUE = 'bg-[#f0f7ff]';
const BORDER_BLUE = 'border-[#3b82f6]';

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  type,
  number,
  date,
  clientName,
  clientTVA,
  items,
  amount,
  devise = 'DT',
  validUntil,
  dueAt,
  taxRate = 19,
  fiscalStamp = 1.0,
}) => {
  const tva = amount * (taxRate / 100);
  const ttc = amount + tva + fiscalStamp;

  return (
    <div className="bg-white shadow-2xl mx-auto p-10 max-w-[800px] font-sans border border-gray-100 rounded-sm relative text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          {/* Logo Q */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-8 h-8">
               {/* Diamond */}
               <div className="absolute inset-0 bg-gray-500 rotate-45 transform origin-center"></div>
               {/* Cutout */}
               <div className="absolute inset-[30%] bg-white rotate-45 transform origin-center"></div>
               {/* Q Tail */}
               <div className="absolute bottom-[-2px] right-[-2px] w-3 h-1.5 bg-gray-500 rotate-[135deg]"></div>
            </div>
            <span className="text-2xl font-semibold text-gray-500 tracking-tight">QuetraTech</span>
          </div>
          
          <div className="space-y-0.5 text-[13px] text-gray-700">
            <p className="font-bold">Ste Quetratech</p>
            <p><span className="font-bold">Code TVA:</span> 1694357R</p>
            <p><span className="font-bold">Email:</span> contact@quetratech.com</p>
            <p><span className="font-bold">Tel:</span> +21623564077</p>
          </div>
        </div>

        <div className="text-right text-[13px] space-y-0.5 mt-8">
          <p><span className="font-bold">Client:</span> {clientName || '---'}</p>
          <p><span className="font-bold">Code TVA:</span> {clientTVA || '---'}</p>
          <p><span className="font-bold">Date:</span> {date}</p>
          <p><span className="font-bold">{type === 'FACTURE' ? 'Facture num:' : 'Devis num:'}</span> {number}</p>
        </div>
      </div>

      {/* Items Sections */}
      <div className="mb-10 min-h-[400px]">
        <div className="mb-6">
          <div className={cn("flex justify-between items-center px-4 py-1 border-l-4 border-b", BORDER_BLUE, BG_LIGHT_BLUE)}>
            <span className={cn("font-bold", COLOR_DARK_BLUE)}># Description des Prestations</span>
            <span className={cn("font-bold", COLOR_DARK_BLUE)}>{type === 'FACTURE' ? 'Total HT' : 'Total'}</span>
          </div>
          
          {items.map((item, idx) => (
            <div key={idx} className="flex border-b border-gray-100 min-h-[40px]">
               <div className="flex-1 p-4 text-[13px]">
                  <p className="font-medium text-gray-800">{item.description}</p>
                  <p className="text-gray-400 text-[11px] mt-1">
                    Quantité: {item.quantity} · Prix unitaire: {item.unitPrice.toLocaleString('fr-FR')} {devise}
                  </p>
               </div>
               <div className="w-32 bg-gray-50 p-4 flex items-center justify-end font-bold text-[13px]">
                  {(item.quantity * item.unitPrice).toLocaleString('fr-FR')} {devise === 'DT' ? '' : devise}
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer & Totals */}
      <div className="flex justify-between items-start mt-auto pt-10 border-t-2 border-blue-50">
        <div className="space-y-6 flex-1">
           <div className="text-[13px] text-gray-700">
              <p className="font-bold mb-2">Conditions de paiement</p>
              <p>IBAN : TN59 04502040007862933473</p>
              <p>BIC : BSTUTNTT</p>
              <p>BANQUE : ATTIJARI BANK TUNISIE</p>
           </div>
           
           <div className={cn("inline-flex items-center gap-10 px-4 py-1 border", BORDER_BLUE, BG_LIGHT_BLUE, "rounded")}>
              <span className={cn("font-bold text-[12px]", COLOR_DARK_BLUE)}>Timbre</span>
              <span className="font-bold text-[12px]">{fiscalStamp.toLocaleString('fr-FR', { minimumFractionDigits: 3 })} {devise}</span>
           </div>
        </div>

        {/* Circular Stamp */}
        <div className="mx-auto flex items-center justify-center opacity-80">
           <div className="w-32 h-32 rounded-full border-2 border-blue-600 flex flex-col items-center justify-center relative rotate-[-15deg]">
              <span className="text-[9px] font-bold text-blue-600 uppercase mb-1">QUETRATECH</span>
              <div className="relative w-6 h-6 mb-1">
                 <div className="absolute inset-0 bg-blue-600 rotate-45 transform origin-center"></div>
                 <div className="absolute inset-[30%] bg-white rotate-45 transform origin-center"></div>
              </div>
              <p className="text-[6px] text-blue-600 text-center leading-tight">
                 MF: 1694357/R<br/>
                 MAHDIA, TUNISIE
              </p>
           </div>
        </div>

        {/* Totals Table */}
        <div className="w-64 border border-blue-100 overflow-hidden rounded">
           <div className="flex justify-between p-2 border-b border-blue-50 text-[13px]">
              <span className="text-gray-500">Total HT</span>
              <span className="font-bold">{amount.toLocaleString('fr-FR')} {devise}</span>
           </div>
           <div className="flex justify-between p-2 border-b border-blue-50 text-[13px]">
              <span className="text-gray-500">TVA</span>
              <span className="font-bold">{taxRate} %</span>
           </div>
           <div className={cn("flex justify-between p-2 text-[13px]", BG_LIGHT_BLUE)}>
              <span className={cn("font-bold", COLOR_DARK_BLUE)}>Total TTC</span>
              <span className={cn("font-bold", COLOR_DARK_BLUE)}>{ttc.toLocaleString('fr-FR')} {devise}</span>
           </div>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-gray-100 flex justify-between items-center opacity-60">
        <p className="text-[10px] text-gray-500">
           Ste Quetratech - Code TVA:1694357R - email: contact@quetratech.com - tel: +21623564077
        </p>
        <div className="flex items-center gap-1">
           <div className="relative w-3 h-3">
              <div className="absolute inset-0 bg-gray-400 rotate-45"></div>
              <div className="absolute inset-[30%] bg-white rotate-45"></div>
           </div>
           <span className="text-[10px] font-medium text-gray-500">QuetraTech</span>
        </div>
      </div>
    </div>
  );
};
