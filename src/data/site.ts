import { copy, type Lang } from '../lib/i18n';

export const site = {
  name: 'Pablo Ponce García',
  studio: 'ZMA BLK Design',
  location: 'Mendoza, Argentina',
  email: 'zma.blk.design@gmail.com',
  // Formato internacional sin "+": 54 9 + característica + número
  whatsapp: '5492614712481',
  // TODO: cuando exista un CV en inglés, cambiar la ruta de `en`
  cv: { es: '/Pablo-Ponce-Garcia-CV.pdf', en: '/Pablo-Ponce-Garcia-CV.pdf' },
  social: [
    { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/pabloponcegarcia/' },
    { icon: 'behance', label: 'Behance', href: 'https://www.behance.net/BkRoom' },
    { icon: 'substack', label: 'Substack', href: 'https://substack.com/' }, // TODO: tu URL de Substack
  ],
};

export const waLink = (lang: Lang) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(copy[lang].waText)}`;
