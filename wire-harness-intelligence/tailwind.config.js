/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Deep-space background layers ──────────────────────
        canvas:  '#0A0E1A',
        surface: {
          DEFAULT: '#141B2D',
          active:  '#1A2332',
          inset:   '#0D1420',
          overlay: '#1E293B',
          highest: '#253047',
        },

        // ── Slate scale (kept for compatibility) ──────────────
        slate: {
          950: '#020617',
          900: '#0f172a',
          850: '#131c2e',
          800: '#1e293b',
          750: '#253047',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
        },

        // ── Primary action ────────────────────────────────────
        brand: {
          DEFAULT: '#3B9EFF',
          light:   '#6BBDFF',
          dark:    '#1A7FE8',
          muted:   'rgba(59,158,255,0.10)',
          glow:    'rgba(59,158,255,0.25)',
        },

        // ── Status colors ────────────────────────────────────
        status: {
          success:        '#00E5A0',
          'success-muted':'rgba(0,229,160,0.10)',
          warning:        '#FFB020',
          'warning-muted':'rgba(255,176,32,0.10)',
          error:          '#FF4757',
          'error-muted':  'rgba(255,71,87,0.10)',
          info:           '#3B9EFF',
        },

        // ── Data highlight ────────────────────────────────────
        accent: {
          DEFAULT: '#A78BFA',
          light:   '#C4B5FD',
          dark:    '#7C3AED',
          muted:   'rgba(167,139,250,0.10)',
        },

        // ── Component color coding ────────────────────────────
        wire: {
          electrical: '#3B9EFF',
          power:      '#00E5A0',
          ground:     '#A07850',
          switches:   '#A78BFA',
          connectors: '#FFB020',
          sensors:    '#FF6B9D',
          lights:     '#FCD34D',
          fuses:      '#FF4757',
          generic:    '#64748B',
        },
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },

      fontSize: {
        'hero':    ['2rem',      { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.03em' }],
        'display': ['1.125rem',  { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.02em' }],
        'section': ['0.6875rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.12em'  }],
        'body':    ['0.8125rem', { lineHeight: '1.6', fontWeight: '400'                           }],
        'label':   ['0.6875rem', { lineHeight: '1.4', fontWeight: '500'                           }],
        'metric':  ['1rem',      { lineHeight: '1',   fontWeight: '600', letterSpacing: '-0.01em' }],
        'micro':   ['0.625rem',  { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em'  }],
        'data':    ['0.8125rem', { lineHeight: '1',   fontWeight: '600', letterSpacing: '-0.01em' }],
      },

      boxShadow: {
        'elevation-1':  '0 1px 2px 0 rgb(0 0 0 / 0.3)',
        'elevation-2':  '0 2px 8px 0 rgb(0 0 0 / 0.35), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
        'elevation-3':  '0 8px 24px -2px rgb(0 0 0 / 0.4), 0 2px 8px -2px rgb(0 0 0 / 0.25)',
        'panel':        '0 0 0 1px rgb(26 35 50 / 0.8), 0 8px 32px -4px rgb(0 0 0 / 0.5)',
        'glow-blue':    '0 0 20px rgba(59,158,255,0.30), 0 0 40px rgba(59,158,255,0.15)',
        'glow-blue-sm': '0 0 8px rgba(59,158,255,0.35)',
        'glow-green':   '0 0 20px rgba(0,229,160,0.25)',
        'glow-red':     '0 0 16px rgba(255,71,87,0.30)',
        'glow-purple':  '0 0 16px rgba(167,139,250,0.25)',
        'card-hover':   '0 4px 16px -2px rgb(0 0 0 / 0.4), 0 0 0 1px rgb(59 158 255 / 0.15)',
        'brand-sm':     '0 0 0 1px rgb(59 158 255 / 0.3), 0 2px 8px -2px rgb(59 158 255 / 0.35)',
        'brand-glow':   '0 4px 24px -2px rgb(59 158 255 / 0.45)',
      },

      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-up':    'slideUp 0.25s ease-out',
        'slide-in-r':  'slideInRight 0.25s ease-out',
        'pulse-soft':  'pulseSoft 2.5s ease-in-out infinite',
        'pulse-live':  'pulseLive 1.8s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s linear infinite',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
        'count-in':    'countIn 0.6s ease-out',
        'spin-slow':   'spin 3s linear infinite',
        'shake':       'shake 0.4s ease-in-out',
        'bounce-in':   'bounceIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      },

      keyframes: {
        fadeIn:      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:     { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight:{ '0%': { opacity: '0', transform: 'translateX(12px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft:   { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        pulseLive:   { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.6', transform: 'scale(0.92)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glowPulse:   { '0%, 100%': { boxShadow: '0 0 8px rgba(59,158,255,0.3)' }, '50%': { boxShadow: '0 0 20px rgba(59,158,255,0.6)' } },
        countIn:     { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shake:       { '0%, 100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-6px)' }, '40%': { transform: 'translateX(6px)' }, '60%': { transform: 'translateX(-4px)' }, '80%': { transform: 'translateX(4px)' } },
        bounceIn:    { '0%': { opacity: '0', transform: 'scale(0.85)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },

      backgroundImage: {
        'grid-dot':   'radial-gradient(rgba(59,158,255,0.12) 1px, transparent 1px)',
        'grid-line':  'linear-gradient(rgba(26,35,50,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(26,35,50,0.8) 1px, transparent 1px)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(59,158,255,0.08) 50%, transparent 100%)',
        'gradient-brand':   'linear-gradient(135deg, #3B9EFF 0%, #A78BFA 100%)',
        'gradient-success': 'linear-gradient(90deg, #00E5A0 0%, #3B9EFF 100%)',
        'gradient-warn':    'linear-gradient(90deg, #FFB020 0%, #FF6B9D 100%)',
        'gradient-error':   'linear-gradient(90deg, #FF4757 0%, #FF8A80 100%)',
        'gradient-canvas':  'radial-gradient(ellipse at 60% 0%, rgba(59,158,255,0.06) 0%, transparent 60%)',
      },

      transitionDuration: {
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
};
