import { FC } from 'react'
import { User } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'

const EmployeeSelector: FC = () => {
  const { 
    employees, 
    selectedEmployeeId, 
    setSelectedEmployee 
  } = usePlanningStore()

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
        <select
          value={selectedEmployeeId || ''}
          onChange={(e) => {
            const id = e.target.value ? parseInt(e.target.value) : undefined
            if (id) setSelectedEmployee(id)
          }}
          className="form-select text-sm sm:text-base min-w-0 flex-1 sm:min-w-[200px] sm:flex-none"
        >
          <option value="">
            <span className="hidden sm:inline">Sélectionner un employé</span>
            <span className="sm:hidden">Employé</span>
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.fullname}
            </option>
          ))}
        </select>
      </div>
      
      {selectedEmployee && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded self-start sm:self-auto">
          {selectedEmployee.slug}
        </span>
      )}
    </div>
  )
}

export default EmployeeSelector