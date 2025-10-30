import { FC, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, User, UserCheck, UserX } from 'lucide-react'
import { Employee } from '../types'
import { employeeService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import EmployeeFormModal from './EmployeeFormModal'
import LoadingSpinner from './LoadingSpinner'

const EmployeeManagement: FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const { canAccess } = useAuthStore()
  const queryClient = useQueryClient()

  // Vérifier les permissions
  if (!canAccess('employee-management')) {
    return (
      <div className="text-center py-12">
        <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Accès non autorisé
        </h3>
        <p className="text-gray-500">
          Vous n'avez pas les permissions pour gérer les employés.
        </p>
      </div>
    )
  }

  // Charger les employés
  const { data: employees, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeeService.getAll
  })

  // Mutation pour supprimer un employé
  const deleteMutation = useMutation({
    mutationFn: employeeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsFormModalOpen(true)
  }

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${employee.fullname} ?`)) {
      try {
        await deleteMutation.mutateAsync(employee.id)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleCreateNew = () => {
    setEditingEmployee(null)
    setIsFormModalOpen(true)
  }

  const handleModalClose = () => {
    setIsFormModalOpen(false)
    setEditingEmployee(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement des employés</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Gestion des Employés
            </h2>
            <p className="text-sm text-gray-500">
              Créer, modifier et gérer les comptes employés
            </p>
          </div>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel employé</span>
        </button>
      </div>

      {/* Liste des employés */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Employés ({employees?.length || 0})
          </h3>
        </div>

        {employees && employees.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <div key={employee.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      employee.active ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {employee.active ? (
                        <UserCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <UserX className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {employee.fullname}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span>ID: {employee.id}</span>
                        <span>•</span>
                        <span>Slug: {employee.slug}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          employee.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {employee.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifier l'employé"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(employee)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Supprimer l'employé"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun employé
            </h3>
            <p className="text-gray-500 mb-4">
              Commencez par créer votre premier employé.
            </p>
            <button
              onClick={handleCreateNew}
              className="btn-primary"
            >
              Créer un employé
            </button>
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={handleModalClose}
        employee={editingEmployee}
      />
    </div>
  )
}

export default EmployeeManagement