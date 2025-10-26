/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          cyan: '#00ffff',
          blue: '#0080ff',
          purple: '#8000ff',
          pink: '#ff0080',
          red: '#ff0000',
          orange: '#ff8000',
          yellow: '#ffff00',
          green: '#80ff00',
          lime: '#00ff80',
          teal: '#00ff80',
          indigo: '#8000ff',
          violet: '#8000ff',
          fuchsia: '#ff0080',
          rose: '#ff0080',
          sky: '#00bfff',
          emerald: '#00ff80',
          amber: '#ffbf00',
          slate: '#64748b',
          zinc: '#71717a',
          stone: '#78716c',
          neutral: '#737373',
          gray: '#6b7280',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor" 
          },
          "50%": { 
            boxShadow: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor" 
          },
        },
        "neon-flicker": {
          "0%, 100%": { 
            textShadow: "0 0 4px currentColor, 0 0 8px currentColor, 0 0 12px currentColor" 
          },
          "50%": { 
            textShadow: "0 0 2px currentColor, 0 0 4px currentColor, 0 0 6px currentColor" 
          },
        },
        "scan-lines": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "glitch": {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
        "matrix-rain": {
          "0%": { transform: "translateY(-100vh)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "hologram": {
          "0%": { 
            filter: "hue-rotate(0deg) brightness(1) contrast(1)",
            transform: "rotateY(0deg)" 
          },
          "50%": { 
            filter: "hue-rotate(180deg) brightness(1.2) contrast(1.2)",
            transform: "rotateY(180deg)" 
          },
          "100%": { 
            filter: "hue-rotate(360deg) brightness(1) contrast(1)",
            transform: "rotateY(360deg)" 
          },
        },
        "cyber-pulse": {
          "0%": { 
            boxShadow: "0 0 0 0 rgba(0, 255, 255, 0.7)",
            transform: "scale(1)" 
          },
          "70%": { 
            boxShadow: "0 0 0 10px rgba(0, 255, 255, 0)",
            transform: "scale(1.05)" 
          },
          "100%": { 
            boxShadow: "0 0 0 0 rgba(0, 255, 255, 0)",
            transform: "scale(1)" 
          },
        },
        "data-stream": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        "loading-dots": {
          "0%, 80%, 100%": { 
            transform: "scale(0)",
            opacity: "0.5" 
          },
          "40%": { 
            transform: "scale(1)",
            opacity: "1" 
          },
        },
        "typing": {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        "blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "rotate-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "heartbeat": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "gradient-y": {
          "0%, 100%": { backgroundPosition: "50% 0%" },
          "50%": { backgroundPosition: "50% 100%" },
        },
        "gradient-xy": {
          "0%, 100%": { backgroundPosition: "0% 0%" },
          "25%": { backgroundPosition: "100% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "75%": { backgroundPosition: "0% 100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.5s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.5s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.5s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.5s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "scale-out": "scale-out 0.3s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "neon-flicker": "neon-flicker 2s ease-in-out infinite",
        "scan-lines": "scan-lines 2s linear infinite",
        "glitch": "glitch 0.3s ease-in-out infinite",
        "matrix-rain": "matrix-rain 3s linear infinite",
        "hologram": "hologram 4s ease-in-out infinite",
        "cyber-pulse": "cyber-pulse 2s ease-in-out infinite",
        "data-stream": "data-stream 1.5s linear infinite",
        "loading-dots": "loading-dots 1.4s ease-in-out infinite both",
        "typing": "typing 3s steps(40, end)",
        "blink": "blink 1s infinite",
        "float": "float 3s ease-in-out infinite",
        "rotate-slow": "rotate-slow 20s linear infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "gradient-x": "gradient-x 15s ease infinite",
        "gradient-y": "gradient-y 15s ease infinite",
        "gradient-xy": "gradient-xy 15s ease infinite",
      },
      textShadow: {
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'neon-strong': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        'neon-weak': '0 0 2px currentColor, 0 0 4px currentColor',
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
        'cyber-grid-thick': 'linear-gradient(rgba(0,255,255,0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(0,255,255,0.2) 2px, transparent 2px)',
        'matrix': 'radial-gradient(circle at center, rgba(0,255,0,0.1) 0%, transparent 70%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 40% 80%, hsla(355,100%,93%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,96%,62%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(269,85%,75%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)',
      },
      backgroundSize: {
        'cyber-grid': '20px 20px',
        'cyber-grid-thick': '40px 40px',
        'matrix': '100px 100px',
        'shimmer': '200% 100%',
      },
      boxShadow: {
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
        'neon-strong': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        'neon-weak': '0 0 2px currentColor, 0 0 4px currentColor',
        'cyber': '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)',
        'cyber-strong': '0 0 30px rgba(0, 255, 255, 0.7), inset 0 0 30px rgba(0, 255, 255, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-strong': '0 8px 32px 0 rgba(31, 38, 135, 0.6)',
      },
      borderWidth: {
        '3': '3px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionProperty: {
        'all': 'all',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),

    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: theme('textShadow.neon'),
        },
        '.text-shadow-strong': {
          textShadow: theme('textShadow.neon-strong'),
        },
        '.text-shadow-weak': {
          textShadow: theme('textShadow.neon-weak'),
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.cyber-border': {
          border: '2px solid transparent',
          background: 'linear-gradient(45deg, #00ffff, #0080ff) border-box',
          mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        },
        '.neon-glow': {
          boxShadow: theme('boxShadow.neon'),
        },
        '.neon-glow-strong': {
          boxShadow: theme('boxShadow.neon-strong'),
        },
        '.neon-glow-weak': {
          boxShadow: theme('boxShadow.neon-weak'),
        },
        '.cyber-glow': {
          boxShadow: theme('boxShadow.cyber'),
        },
        '.cyber-glow-strong': {
          boxShadow: theme('boxShadow.cyber-strong'),
        },
        '.glass-glow': {
          boxShadow: theme('boxShadow.glass'),
        },
        '.glass-glow-strong': {
          boxShadow: theme('boxShadow.glass-strong'),
        },
        '.bg-cyber-grid': {
          backgroundImage: theme('backgroundImage.cyber-grid'),
          backgroundSize: theme('backgroundSize.cyber-grid'),
        },
        '.bg-cyber-grid-thick': {
          backgroundImage: theme('backgroundImage.cyber-grid-thick'),
          backgroundSize: theme('backgroundSize.cyber-grid-thick'),
        },
        '.bg-matrix': {
          backgroundImage: theme('backgroundImage.matrix'),
          backgroundSize: theme('backgroundSize.matrix'),
        },
        '.bg-shimmer': {
          backgroundImage: theme('backgroundImage.shimmer'),
          backgroundSize: theme('backgroundSize.shimmer'),
        },
        '.bg-gradient-mesh': {
          backgroundImage: theme('backgroundImage.gradient-mesh'),
        },
        '.animate-shimmer': {
          animation: 'shimmer 2s linear infinite',
        },
        '.animate-gradient-x': {
          animation: 'gradient-x 15s ease infinite',
        },
        '.animate-gradient-y': {
          animation: 'gradient-y 15s ease infinite',
        },
        '.animate-gradient-xy': {
          animation: 'gradient-xy 15s ease infinite',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
