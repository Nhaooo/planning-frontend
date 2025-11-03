import { CategoryCode, CategoryLegend, CategoryRepartition } from '../types'

/**
 * Légende par défaut des catégories
 */
export const DEFAULT_CATEGORY_LEGEND: CategoryLegend = {
  a: { label: 'Administratif/gestion', color: '#49B675' },
  p: { label: 'Prestation/événement', color: '#40E0D0' },
  e: { label: 'École d\'escalade', color: '#A280FF' },
  c: { label: 'Groupes compétition', color: '#FF007F' },
  o: { label: 'Ouverture', color: '#FF2D2D' },
  l: { label: 'Loisir', color: '#FFD166' },
  m: { label: 'Mise en place / Rangement', color: '#FF9B54' },
  s: { label: 'Santé Adulte/Enfant', color: '#FF8C42' },
}

/**
 * Obtient la classe CSS pour une catégorie
 */
export const getCategoryClass = (category: CategoryCode): string => {
  return `category-${category}`
}

/**
 * Obtient la couleur d'une catégorie
 */
export const getCategoryColor = (
  category: CategoryCode, 
  legend: CategoryLegend = DEFAULT_CATEGORY_LEGEND
): string => {
  return legend[category]?.color || '#6B7280'
}

/**
 * Obtient le libellé d'une catégorie
 */
export const getCategoryLabel = (
  category: CategoryCode, 
  legend: CategoryLegend = DEFAULT_CATEGORY_LEGEND
): string => {
  return legend[category]?.label || category.toUpperCase()
}

/**
 * Vérifie si un code de catégorie est valide
 */
export const isValidCategory = (category: string): category is CategoryCode => {
  return ['a', 'p', 'e', 'c', 'o', 'l', 'm', 's'].includes(category)
}

/**
 * Obtient toutes les catégories disponibles
 */
export const getAllCategories = (legend: CategoryLegend = DEFAULT_CATEGORY_LEGEND) => {
  return Object.entries(legend).map(([code, info]) => ({
    code: code as CategoryCode,
    label: info.label,
    color: info.color
  }))
}

/**
 * Calcule les pourcentages de répartition
 */
export const calculateRepartitionPercentages = (
  repartition: CategoryRepartition
): CategoryRepartition => {
  const total = Object.values(repartition).reduce((sum, value) => sum + value, 0)
  
  if (total === 0) {
    return { a: 0, p: 0, e: 0, c: 0, o: 0, l: 0, m: 0, s: 0 }
  }
  
  return {
    a: (repartition.a / total) * 100,
    p: (repartition.p / total) * 100,
    e: (repartition.e / total) * 100,
    c: (repartition.c / total) * 100,
    o: (repartition.o / total) * 100,
    l: (repartition.l / total) * 100,
    m: (repartition.m / total) * 100,
    s: (repartition.s / total) * 100,
  }
}

/**
 * Formate un nombre d'heures avec l'unité
 */
export const formatHours = (hours: number): string => {
  if (hours === 0) return '0h'
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes}min`
  }
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) return `${wholeHours}h`
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}`
}

/**
 * Obtient les catégories triées par importance/fréquence
 */
export const getSortedCategories = (
  repartition: CategoryRepartition,
  legend: CategoryLegend = DEFAULT_CATEGORY_LEGEND
) => {
  return Object.entries(repartition)
    .map(([code, hours]) => ({
      code: code as CategoryCode,
      hours,
      label: legend[code]?.label || code,
      color: legend[code]?.color || '#6B7280'
    }))
    .sort((a, b) => b.hours - a.hours)
    .filter(item => item.hours > 0)
}

/**
 * Génère une couleur de contraste pour le texte
 */
export const getContrastColor = (backgroundColor: string): string => {
  // Convertir la couleur hex en RGB
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculer la luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Retourner noir ou blanc selon la luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * Génère un style CSS pour une catégorie
 */
export const getCategoryStyle = (
  category: CategoryCode,
  legend: CategoryLegend = DEFAULT_CATEGORY_LEGEND
): React.CSSProperties => {
  const backgroundColor = getCategoryColor(category, legend)
  const textColor = getContrastColor(backgroundColor)
  
  return {
    backgroundColor: backgroundColor + '20', // 20% d'opacité pour le fond
    borderLeftColor: backgroundColor,
    color: textColor,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid' as const
  }
}