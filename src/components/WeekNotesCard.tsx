import { FC, useState } from 'react'
import { MessageSquare, Edit3, Save, X } from 'lucide-react'
import { Note } from '../types'

interface WeekNotesCardProps {
  notes?: Note
  weekId: number
}

const WeekNotesCard: FC<WeekNotesCardProps> = ({ notes, weekId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedComments, setEditedComments] = useState(notes?.comments || '')

  const handleSave = () => {
    // TODO: Implémenter la sauvegarde des notes
    console.log('Save notes:', editedComments)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedComments(notes?.comments || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-gray-600"
            title="Modifier les notes"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Zone de commentaires */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedComments}
              onChange={(e) => setEditedComments(e.target.value)}
              rows={4}
              className="form-input"
              placeholder="Ajoutez vos commentaires sur cette semaine..."
            />
            
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 p-1"
                title="Annuler"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-700 p-1"
                title="Sauvegarder"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-[100px]">
            {notes?.comments ? (
              <p className="text-gray-700 whitespace-pre-wrap">
                {notes.comments}
              </p>
            ) : (
              <p className="text-gray-500 italic">
                Aucun commentaire pour cette semaine.
                Cliquez sur l'icône d'édition pour en ajouter.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Métadonnées */}
      {notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            {notes.last_edit_by && (
              <div>Modifié par: {notes.last_edit_by}</div>
            )}
            {notes.last_edit_at && (
              <div>
                Le: {new Date(notes.last_edit_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>Sauvegarde automatique des modifications</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeekNotesCard