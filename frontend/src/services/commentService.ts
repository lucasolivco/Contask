import api from './api'

export interface Comment {
  id: string
  message: string
  createdAt: string
  updatedAt: string
  taskId: string
  authorId: string
  author: {
    id: string
    name: string
    email: string
    role: string
  }
}

// Buscar comentários de uma tarefa
export const getTaskComments = async (taskId: string): Promise<{ comments: Comment[] }> => {
  try {
    console.log('🔍 Buscando comentários para tarefa:', taskId)
    const response = await api.get(`/tasks/${taskId}/comments`)
    console.log('✅ Comentários recebidos:', response.data.comments.length)
    return response.data
  } catch (error) {
    console.error('❌ Erro ao buscar comentários:', error)
    throw error
  }
}

// Criar novo comentário
export const createComment = async (taskId: string, message: string): Promise<{ comment: Comment; message: string }> => {
  try {
    console.log('💬 Criando comentário na tarefa:', taskId)
    const response = await api.post(`/tasks/${taskId}/comments`, { message })
    console.log('✅ Comentário criado:', response.data.comment.id)
    return response.data
  } catch (error) {
    console.error('❌ Erro ao criar comentário:', error)
    throw error
  }
}