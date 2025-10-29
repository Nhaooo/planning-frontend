/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs des catégories de planning
        category: {
          a: '#49B675', // Administratif/gestion
          p: '#40E0D0', // Prestation/événement
          e: '#A280FF', // École d'escalade
          c: '#FF007F', // Groupes compétition
          o: '#FF2D2D', // Ouverture
          l: '#FFD166', // Loisir
          m: '#FF9B54', // Mise en place / Rangement
          s: '#FF8C42', // Santé Adulte/Enfant
        },
      },
      spacing: {
        '15': '3.75rem', // Pour les créneaux de 15 minutes
      },
      gridTemplateColumns: {
        '8': 'repeat(8, minmax(0, 1fr))', // 1 colonne heure + 7 jours
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}