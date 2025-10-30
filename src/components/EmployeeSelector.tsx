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
    <div className="flex items-center space-x-2">
      <User className="h-4 w-4 text-gray-500" />
      <select
        value={selectedEmployeeId || ''}
        onChange={(e) => {
          const id = e.target.value ? parseInt(e.target.value) : undefined
          if (id) setSelectedEmployee(id)
        }}
        className="form-select min-w-[200px]"
      >
        <option value="">Sélectionner un employé</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.fullname}
          </option>
        ))}
      </select>
      
      {selectedEmployee && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {selectedEmployee.slug}
        </span>
      )}
    </div>
  )
}

export default EmployeeSelector