import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminAnkiImportPage.css'

function getHumanStatus(status) {
  if (status === 'VALID') return 'Válida'
  if (status === 'INVALID') return 'Inválida'
  if (status === 'WARNING') return 'Con advertencias'
  return status
}

function AdminAnkiImportPage() {
  const { request } = useAuth()
  const [fileContent, setFileContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [confirmData, setConfirmData] = useState(null)
  const [error, setError] = useState('')

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    setPreviewData(null)
    setConfirmData(null)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      setFileContent(e.target.result)
    }
    reader.onerror = () => {
      setError('Error al leer el archivo. Intenta de nuevo.')
    }
    reader.readAsText(file)
  }

  const handlePreview = async () => {
    if (!fileContent) {
      setError('Selecciona un archivo primero.')
      return
    }

    setIsProcessing(true)
    setError('')
    setConfirmData(null)

    try {
      const payload = await request('/api/admin/content/import/anki/preview', {
        method: 'POST',
        body: JSON.stringify({ format: 'tsv', content: fileContent }),
      })
      setPreviewData(payload)
    } catch (err) {
      setError(err.message || 'Ocurrió un error al previsualizar la importación.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    // Note: The user requested to NOT test the confirm logic against DB without permission,
    // but the button must exist and execute the request correctly.
    setIsProcessing(true)
    setError('')

    try {
      const payload = await request('/api/admin/content/import/anki/confirm', {
        method: 'POST',
        body: JSON.stringify({ format: 'tsv', content: fileContent }),
      })
      setConfirmData(payload)
      setPreviewData(null)
    } catch (err) {
      setError(err.message || 'Ocurrió un error al confirmar la importación.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="admin-import-page">
      <header className="admin-import-header">
        <h1>Importar Flashcards (Anki TSV)</h1>
        <p>Archivo TSV o texto tabulado exportado desde Anki.</p>
      </header>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {!confirmData ? (
        <section className="admin-import-card">
          <div className="admin-import-file-area">
            <label>Seleccionar archivo (.tsv, .txt)</label>
            <input
              type="file"
              accept=".tsv,.txt"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {previewData ? (
            <div className="admin-import-stats">
              <div className="admin-stat-card">
                <span>Filas Totales</span>
                <strong>{previewData.stats.totalRows}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Válidas</span>
                <strong>{previewData.stats.validRows}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Inválidas</span>
                <strong>{previewData.stats.invalidRows}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Con Warnings</span>
                <strong>{previewData.stats.warningRows}</strong>
              </div>
            </div>
          ) : null}

          <div className="admin-import-actions">
            <button
              type="button"
              className="outline-pill-button"
              onClick={handlePreview}
              disabled={!fileContent || isProcessing}
            >
              {isProcessing && !previewData ? 'Procesando...' : 'Previsualizar importación'}
            </button>
            {previewData && previewData.stats.validRows > 0 ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? 'Confirmando...' : 'Confirmar importación'}
              </button>
            ) : null}
          </div>

          {previewData && previewData.items?.length > 0 ? (
            <div className="admin-preview-list">
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Vista previa (Primeras filas detectadas)</h3>
              {previewData.items.slice(0, 10).map((item) => (
                <div key={item.rowIndex} className={`admin-preview-item ${item.status === 'INVALID' ? 'admin-preview-item--invalid' : ''}`}>
                  <header>
                    <strong>Fila {item.rowIndex}</strong>
                    <span className={`admin-preview-status ${item.status === 'INVALID' ? 'admin-preview-status--invalid' : ''}`}>
                      {getHumanStatus(item.status)}
                    </span>
                  </header>
                  {item.question?.prompt ? (
                    <p>{item.question.prompt}</p>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: 'var(--color-text-soft)' }}>Sin pregunta detectada</p>
                  )}
                  {item.errors?.length > 0 ? (
                    <ul className="admin-preview-errors">
                      {item.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              {previewData.items.length > 10 ? (
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-soft)' }}>
                  Y {previewData.items.length - 10} filas más...
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="admin-import-card">
          <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>Importación completada</h2>
          <div className="admin-import-stats">
            <div className="admin-stat-card">
              <span>Nuevas Creadas</span>
              <strong>{confirmData.stats?.createdRows || 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Omitidas</span>
              <strong>{confirmData.stats?.skippedRows || 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span>Inválidas</span>
              <strong>{confirmData.stats?.invalidRows || 0}</strong>
            </div>
          </div>
          <div className="admin-import-actions">
            <button
              type="button"
              className="outline-pill-button"
              onClick={() => {
                setConfirmData(null)
                setFileContent('')
              }}
            >
              Importar otro archivo
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default AdminAnkiImportPage
