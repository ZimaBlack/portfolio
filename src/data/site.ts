import { copy, type Lang } from '../lib/i18n';
import editable from './editable.json';

// Editable desde el panel (npm run panel): src/data/editable.json → "Datos del sitio".
const a = editable.ajustes;
export const site = {
  name: a.name,
  studio: a.studio,
  location: a.location,
  email: a.email,
  // Formato internacional sin "+": 54 9 + característica + número
  whatsapp: a.whatsapp.replace(/\D/g, ''),
  cv: { es: a.cvEs, en: a.cvEn },
  social: a.social,
};

export const waLink = (lang: Lang) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(copy[lang].waText)}`;
