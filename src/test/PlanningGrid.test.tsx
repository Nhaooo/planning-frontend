import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import PlanningGrid from '../components/PlanningGrid'

// Mock du store
vi.mock('../store/planningStore', () => ({
  usePlanningStore: () => ({
    selectedEmployeeId: null,
    selectedWeekKind: 'current',
    selectedVacationPeriod: undefined,
    selectedWeekStart: '2024-01-01',
    currentWeek: undefined,
    setCurrentWeek: vi.fn()
  })
}))

// Mock des services API
vi.mock('../services/api', () => ({
  weekService: {
    getWeeks: vi.fn().mockResolvedValue([])
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        {children}
      </DndProvider>
    </QueryClientProvider>
  )
}

describe('PlanningGrid', () => {
  it('should show message when no employee is selected', () => {
    render(
      <TestWrapper>
        <PlanningGrid />
      </TestWrapper>
    )

    expect(screen.getByText('Sélectionnez un employé pour afficher le planning')).toBeInTheDocument()
  })
})