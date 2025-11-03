// Couleurs des catégories de créneaux
export const CATEGORY_COLORS = {
  administratif: {
    name: 'Administratif/gestion',
    color: '#49B675',
    bgLight: '#E8F5E8',
    textLight: '#2D5A3D'
  },
  prestation: {
    name: 'Prestation/événement',
    color: '#40E0D0',
    bgLight: '#E0F9F6',
    textLight: '#1A5A54'
  },
  ecole: {
    name: 'École d\'escalade',
    color: '#A280FF',
    bgLight: '#F0EBFF',
    textLight: '#4A2C7A'
  },
  competition: {
    name: 'Groupes compétition',
    color: '#FF007F',
    bgLight: '#FFE0F0',
    textLight: '#7A0040'
  },
  ouverture: {
    name: 'Ouverture',
    color: '#FF2D2D',
    bgLight: '#FFE6E6',
    textLight: '#7A1515'
  },
  loisir: {
    name: 'Loisir',
    color: '#FFD166',
    bgLight: '#FFF8E6',
    textLight: '#7A6B2D'
  },
  mise_en_place: {
    name: 'Mise en place / Rangement',
    color: '#FF9B54',
    bgLight: '#FFF0E6',
    textLight: '#7A4A26'
  },
  sante: {
    name: 'Santé Adulte/Enfant',
    color: '#FF8C42',
    bgLight: '#FFEDE6',
    textLight: '#7A4220'
  }
} as const

export type CategoryCode = keyof typeof CATEGORY_COLORS

// Fonction pour obtenir les couleurs d'une catégorie
export const getCategoryColors = (category: string) => {
  const categoryCode = category.toLowerCase() as CategoryCode
  return CATEGORY_COLORS[categoryCode] || {
    name: 'Autre',
    color: '#6B7280',
    bgLight: '#F3F4F6',
    textLight: '#374151'
  }
}

// Fonction pour obtenir le style inline d'un créneau
export const getSlotStyle = (category: string) => {
  const colors = getCategoryColors(category)
  return {
    backgroundColor: colors.color,
    color: 'white'
  }
}

// Fonction pour obtenir le style de fond d'une cellule avec créneau
export const getCellBackgroundStyle = (category: string) => {
  const colors = getCategoryColors(category)
  return {
    backgroundColor: colors.bgLight
  }
}