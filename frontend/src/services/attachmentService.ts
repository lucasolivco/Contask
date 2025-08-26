// frontend/src/services/attachmentService.ts - CORRIGIDO
import api from './api'

export interface Attachment {
  id: string
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  createdAt: string
  taskId: string
  uploadedById: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
}

// ✅ BUSCAR ANEXOS
export const getTaskAttachments = async (taskId: string): Promise<{ attachments: Attachment[] }> => {
  try {
    console.log('🔍 Buscando anexos para tarefa:', taskId)
    const response = await api.get(`/api/tasks/${taskId}/attachments`) // ✅ /api/tasks
    console.log('✅ Anexos recebidos:', response.data.attachments.length)
    return response.data
  } catch (error) {
    console.error('❌ Erro ao buscar anexos:', error)
    throw error
  }
}

// ✅ UPLOAD DE ANEXOS
export const uploadAttachments = async (taskId: string, files: File[]): Promise<{ attachments: Attachment[]; message: string }> => {
  try {
    console.log('📎 Fazendo upload de', files.length, 'arquivo(s) para tarefa:', taskId)
    
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await api.post(`/api/tasks/${taskId}/attachments`, formData, { // ✅ /api/tasks
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('✅ Upload concluído:', response.data.attachments.length, 'arquivo(s)')
    return response.data
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error)
    throw error
  }
}

// ✅ DOWNLOAD DE ANEXO
export const downloadAttachment = async (attachmentId: string, fileName: string): Promise<void> => {
  try {
    console.log('📥 Fazendo download do anexo:', attachmentId)
    
    const response = await api.get(`/api/tasks/attachments/${attachmentId}/download`, { // ✅ /api/tasks
      responseType: 'blob'
    })

    // Criar link para download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    console.log('✅ Download concluído:', fileName)
  } catch (error) {
    console.error('❌ Erro ao fazer download:', error)
    throw error
  }
}