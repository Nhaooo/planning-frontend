import { FC, useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'loading' | 'success' | 'error'
  message: string
  details?: any
}

const ApiDiagnostic: FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

  const addResult = (test: string, status: 'loading' | 'success' | 'error', message: string, details?: any) => {
    setResults(prev => {
      const filtered = prev.filter(r => r.test !== test)
      return [...filtered, { test, status, message, details }]
    })
  }

  const testApiConnection = async () => {
    console.log('🔍 Début diagnostic API')
    
    // Test 1: Configuration
    addResult('config', 'loading', 'Vérification configuration...')
    addResult('config', 'success', `URL API: ${API_BASE_URL}`, {
      url: API_BASE_URL,
      env: (import.meta as any).env,
      hostname: window.location.hostname
    })

    // Test 2: Health Check
    addResult('health', 'loading', 'Test health check...')
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      
      if (response.ok) {
        addResult('health', 'success', `Health check OK (${response.status})`, data)
      } else {
        addResult('health', 'error', `Health check failed (${response.status})`, data)
      }
    } catch (error: any) {
      addResult('health', 'error', `Health check error: ${error.message}`, error)
    }

    // Test 3: Employés
    addResult('employees', 'loading', 'Test endpoint employés...')
    try {
      const response = await fetch(`${API_BASE_URL}/employees`)
      
      if (response.ok) {
        const data = await response.json()
        addResult('employees', 'success', `Employés OK (${data.length} trouvés)`, data)
      } else {
        const errorText = await response.text()
        addResult('employees', 'error', `Employés failed (${response.status})`, errorText)
      }
    } catch (error: any) {
      addResult('employees', 'error', `Employés error: ${error.message}`, error)
    }

    // Test 4: Auth avec différents PINs
    addResult('auth', 'loading', 'Test authentification...')
    
    const pinsToTest = ['1234', '0000', 'admin', '1111']
    let authSuccess = false
    
    for (const pin of pinsToTest) {
      if (authSuccess) break
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        })
        
        if (response.ok) {
          const data = await response.json()
          addResult('auth', 'success', `Auth OK avec PIN "${pin}" (token reçu)`, { 
            pin, 
            hasToken: !!data.access_token,
            userType: data.user_type,
            userName: data.user_name
          })
          authSuccess = true
        } else {
          console.log(`PIN "${pin}" failed:`, response.status)
        }
      } catch (error: any) {
        console.log(`PIN "${pin}" error:`, error.message)
      }
    }
    
    if (!authSuccess) {
      addResult('auth', 'error', `Aucun PIN ne fonctionne. Testés: ${pinsToTest.join(', ')}`, {
        testedPins: pinsToTest,
        suggestion: 'Vérifiez la variable ADMIN_PIN sur Render'
      })
    }
  }

  useEffect(() => {
    if (isVisible) {
      testApiConnection()
    }
  }, [isVisible])

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading': return <Loader className="h-4 w-4 animate-spin text-blue-500" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading': return 'border-blue-200 bg-blue-50'
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Diagnostic API"
        >
          <AlertCircle className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">🔍 Diagnostic API</h2>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.test}
                className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium capitalize">{result.test}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">Détails</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={testApiConnection}
              className="btn-primary"
            >
              🔄 Relancer les tests
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="btn-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiDiagnostic