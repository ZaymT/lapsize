export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#07090D',
          900: '#0B0E14',
          850: '#11151E',
          800: '#161B26',
          700: '#222938',
          600: '#323D52',
        },
        telemetry: {
          cyan: '#00F0FF',
          yellow: '#FFDE00',
          amber: '#F59E0B',
          red: '#FF3366',
          green: '#00E676',
          purple: '#B388FF',
          blue: '#2979FF',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(0, 240, 255, 0.4)',
        'amber-glow': '0 0 20px -3px rgba(255, 222, 0, 0.4)',
        'green-glow': '0 0 20px -3px rgba(0, 230, 118, 0.4)',
        'red-glow': '0 0 20px -3px rgba(255, 51, 102, 0.4)',
      }
    },
  },
  plugins: [],
}

