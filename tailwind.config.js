/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'ds-bg':             '#0b0b18',
        'ds-surface':        '#12122a',
        'ds-surface-2':      '#1a1a38',
        'ds-border':         '#2a2a55',
        'ds-border-subtle':  '#1e1e44',
        // Text
        'ds-text':           '#e0e0f0',
        'ds-text-muted':     '#8888bb',
        'ds-text-dim':       '#4a4a88',
        // Accent (indigo/violet)
        'ds-accent':         '#6060dd',
        'ds-accent-btn':     '#3030aa',
        'ds-accent-btn-text':'#c8c8ff',
        'ds-accent-subtle':  '#1e1e44',
        // Semantic
        'ds-success':        '#40aa60',
        'ds-success-bg':     '#0f2a1a',
        'ds-error':          '#cc4466',
        'ds-error-bg':       '#2a1020',
        'ds-warning':        '#cc9933',
        'ds-warning-bg':     '#2a2010',
      },
    },
  },
  plugins: [],
};
