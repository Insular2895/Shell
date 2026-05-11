/**
 * product.config.ts
 *
 * UNIQUE FICHIER DE BRANDING PAR PRODUIT.
 * Le Shell lit ce fichier pour tout : landing, méta SEO, pricing, theme.
 *
 * Pour cloner un produit : duplique le repo, change ce fichier.
 */

export type ProductConfig = {
  id: string;                  // kebab-case, doit matcher engine/manifest.yaml
  name: string;                // affiché partout
  domain: string;              // ex: "playlistbrief.com"
  description: string;         // meta description SEO

  theme: {
    primaryColor: string;      // hex, ex: "#FF0033"
    primaryColorHover?: string;
    logo: string;              // chemin public, ex: "/logo.svg"
    favicon?: string;
    heroImage?: string;
    tutorialVideo?: string;    // url MP4 ou YouTube embed
  };

  landing: {
    heroTitle: string;
    heroSubtitle: string;
    ctaPrimary: string;        // ex: "Essayer gratuitement"
    ctaSecondary?: string;     // ex: "Voir la démo"
    features: Array<{
      title: string;
      description: string;
      icon?: string;           // nom d'icône lucide-react
    }>;
    socialProof?: {
      logos?: string[];
      testimonials?: Array<{ quote: string; author: string; role?: string }>;
    };
  };

  pricing: {
    freeRuns: number;          // runs gratuits avant paywall
    plans: Array<{
      id: 'free' | 'starter' | 'pro' | 'enterprise';
      name: string;
      price: string;           // affichage, ex: "9 €/mois"
      stripePriceId?: string;  // null pour le free
      runsPerMonth: number | 'unlimited';
      features: string[];
      cta: string;
    }>;
  };

  legal: {
    companyName: string;
    address?: string;
    contactEmail: string;
    privacyUrl?: string;
    termsUrl?: string;
  };
};

// ============================================================================
// EXEMPLE : PlaylistBrief (résumé de playlists YouTube)
// Remplace par les valeurs de ton produit.
// ============================================================================

export const productConfig: ProductConfig = {
  id: 'playlistbrief',
  name: 'PlaylistBrief',
  domain: 'playlistbrief.com',
  description:
    'Résumez une playlist YouTube complète en quelques minutes. Synthèse structurée, idées clés, export Markdown.',

  theme: {
    primaryColor: '#FF0033',
    primaryColorHover: '#E60029',
    logo: '/logo.svg',
    favicon: '/favicon.ico',
    heroImage: '/hero.png',
    tutorialVideo: '/demo.mp4',
  },

  landing: {
    heroTitle: 'Résumez une playlist YouTube en quelques minutes',
    heroSubtitle:
      'Collez une URL, obtenez un résumé structuré, actionnable et exportable.',
    ctaPrimary: 'Essayer gratuitement',
    ctaSecondary: 'Voir la démo',
    features: [
      {
        title: 'Résumé vidéo par vidéo',
        description: 'Chaque vidéo de la playlist est résumée individuellement.',
        icon: 'FileText',
      },
      {
        title: 'Synthèse globale',
        description: 'Une vue d\'ensemble qui relie toutes les idées.',
        icon: 'Brain',
      },
      {
        title: 'Idées clés extraites',
        description: 'Les concepts importants ressortis automatiquement.',
        icon: 'Sparkles',
      },
      {
        title: 'Export PDF / Markdown',
        description: 'Exporte le résumé pour le relire ou le partager.',
        icon: 'Download',
      },
    ],
  },

  pricing: {
    freeRuns: 1,
    plans: [
      {
        id: 'free',
        name: 'Découverte',
        price: '0 €',
        runsPerMonth: 1,
        features: ['1 playlist par mois', 'Jusqu\'à 10 vidéos', 'Export Markdown'],
        cta: 'Commencer',
      },
      {
        id: 'starter',
        name: 'Starter',
        price: '9 €/mois',
        stripePriceId: 'price_REPLACE_ME_STARTER',
        runsPerMonth: 20,
        features: [
          '20 playlists par mois',
          'Jusqu\'à 50 vidéos par playlist',
          'Export PDF + Markdown',
          'Email support',
        ],
        cta: 'Choisir Starter',
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '29 €/mois',
        stripePriceId: 'price_REPLACE_ME_PRO',
        runsPerMonth: 'unlimited',
        features: [
          'Playlists illimitées',
          'Jusqu\'à 200 vidéos par playlist',
          'Export PDF + Markdown + JSON',
          'Priorité dans la file d\'attente',
          'Support prioritaire',
        ],
        cta: 'Choisir Pro',
      },
    ],
  },

  legal: {
    companyName: 'Insular Studio',
    contactEmail: 'support@playlistbrief.com',
    privacyUrl: '/privacy',
    termsUrl: '/terms',
  },
};

export default productConfig;
