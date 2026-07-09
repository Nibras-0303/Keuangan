import * as Icons from 'lucide-react';

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

export function getAccountIcon(iconName: string) {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.Wallet;
}

export function getAccountColorClasses(color: string): {
  bg: string;
  text: string;
  border: string;
  gradient: string;
} {
  switch (color) {
    case 'emerald':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        gradient: 'from-emerald-500 to-teal-600'
      };
    case 'blue':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        gradient: 'from-blue-500 to-sky-600'
      };
    case 'teal':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        gradient: 'from-teal-500 to-cyan-600'
      };
    case 'purple':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        gradient: 'from-purple-500 to-indigo-600'
      };
    case 'pink':
      return {
        bg: 'bg-pink-50',
        text: 'text-pink-700',
        border: 'border-pink-200',
        gradient: 'from-rose-400 to-pink-600'
      };
    case 'orange':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        gradient: 'from-orange-500 to-amber-600'
      };
    default:
      return {
        bg: 'bg-stone-50',
        text: 'text-stone-700',
        border: 'border-stone-200',
        gradient: 'from-stone-500 to-stone-600'
      };
  }
}

export const TRANSACTION_CATEGORIES = [
  'Makanan',
  'Jajan',
  'Transportasi',
  'Hiburan',
  'Utilitas',
  'Kesehatan',
  'Pendidikan',
  'Hadiah/Pasangan',
  'Lainnya'
];

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'Makanan':
      return 'bg-amber-100 text-amber-800';
    case 'Jajan':
      return 'bg-blue-100 text-blue-800';
    case 'Transportasi':
      return 'bg-cyan-100 text-cyan-800';
    case 'Hiburan':
      return 'bg-pink-100 text-pink-800';
    case 'Utilitas':
      return 'bg-orange-100 text-orange-800';
    case 'Kesehatan':
      return 'bg-emerald-100 text-emerald-800';
    case 'Hadiah/Pasangan':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-stone-100 text-stone-800';
  }
}
