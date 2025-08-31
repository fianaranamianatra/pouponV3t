/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Breakpoints personnalisés pour l'application
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        // Breakpoints pour les orientations
        'portrait': {'raw': '(orientation: portrait)'},
        'landscape': {'raw': '(orientation: landscape)'},
        // Breakpoints pour les appareils tactiles
        'touch': {'raw': '(hover: none) and (pointer: coarse)'},
        'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        // Tailles spécifiques pour mobile
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      minHeight: {
        'touch': '44px', // Taille minimale recommandée pour les éléments tactiles
      },
      minWidth: {
        'touch': '44px',
      },
      maxWidth: {
        'mobile': '100vw',
        'tablet': '768px',
        'desktop': '1024px',
      },
      zIndex: {
        'modal': '50',
        'sidebar': '30',
        'header': '20',
        'overlay': '40',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    // Plugin personnalisé pour les utilitaires responsive
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.scroll-smooth-mobile': {
          '@media (max-width: 768px)': {
            'scroll-behavior': 'smooth',
            '-webkit-overflow-scrolling': 'touch',
          },
        },
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.mobile-container': {
          '@media (max-width: 767px)': {
            'padding-left': '1rem',
            'padding-right': '1rem',
            'margin-left': '0',
            'margin-right': '0',
            'max-width': '100%',
          },
        },
        '.mobile-full-width': {
          '@media (max-width: 767px)': {
            'width': '100%',
            'margin-left': '0',
            'margin-right': '0',
          },
        },
        '.mobile-text-center': {
          '@media (max-width: 767px)': {
            'text-align': 'center',
          },
        },
        '.mobile-flex-col': {
          '@media (max-width: 767px)': {
            'flex-direction': 'column',
          },
        },
        '.mobile-gap-2': {
          '@media (max-width: 767px)': {
            'gap': '0.5rem',
          },
        },
        '.mobile-gap-3': {
          '@media (max-width: 767px)': {
            'gap': '0.75rem',
          },
        },
        '.mobile-gap-4': {
          '@media (max-width: 767px)': {
            'gap': '1rem',
          },
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};
