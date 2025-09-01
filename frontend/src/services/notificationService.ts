import api from './api'
import type { Notification, NotificationFilters, NotificationsResponse } from '../types'

export interface UnreadCountResponse {
  unreadCount: number
}

export interface MarkAllAsReadResponse {
  message: string
  updatedCount: number
}

export interface DeleteAllReadResponse {
  message: string
  deletedCount: number
}

export const notificationService = {
  // ✅ LISTAR NOTIFICAÇÕES COM PAGINAÇÃO
  async getNotifications(filters?: NotificationFilters): Promise<NotificationsResponse> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.type && filters.type !== 'all') params.append('type', filters.type)
      if (filters?.read !== undefined && filters.read !== 'all') {
        params.append('read', filters.read.toString())
      }
      if (filters?.search) params.append('search', filters.search)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)

      const queryString = params.toString()
      const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications'
      
      console.log('🔔 notificationService: Buscando notificações:', url)
      
      const response = await api.get(url)
      
      return {
        notifications: Array.isArray(response.data.notifications) ? response.data.notifications : [],
        totalCount: response.data.totalCount || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
        hasNextPage: response.data.hasNextPage || false,
        hasPreviousPage: response.data.hasPreviousPage || false,
        unreadCount: response.data.unreadCount || 0,
        limit: response.data.limit || 10
      }
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error)
      return {
        notifications: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        unreadCount: 0,
        limit: 10
      }
    }
  },

  // ✅ CONTAR NÃO LIDAS
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await api.get('/api/notifications/unread-count')
      return {
        unreadCount: response.data.unreadCount || 0
      }
    } catch (error) {
      console.error('❌ Erro ao buscar contador:', error)
      return { unreadCount: 0 }
    }
  },

  // ✅ MARCAR COMO LIDA
  async markAsRead(id: string): Promise<{ message: string }> {
    try {
      const response = await api.patch(`/api/notifications/${id}/read`)
      console.log(`✅ Notificação ${id} marcada como lida`)
      return response.data
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error)
      throw error
    }
  },

  // ✅ MARCAR COMO NÃO LIDA
  async markAsUnread(id: string): Promise<{ message: string }> {
    try {
      const response = await api.patch(`/api/notifications/${id}/unread`)
      console.log(`✅ Notificação ${id} marcada como não lida`)
      return response.data
    } catch (error) {
      console.error('❌ Erro ao marcar como não lida:', error)
      throw error
    }
  },

  // ✅ MARCAR TODAS COMO LIDAS
  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    try {
      const response = await api.patch('/api/notifications/mark-all-read')
      console.log(`✅ ${response.data.updatedCount} notificações marcadas como lidas`)
      return {
        message: response.data.message || 'Todas as notificações foram marcadas como lidas',
        updatedCount: response.data.updatedCount || 0
      }
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      throw error
    }
  },

  // ✅ DELETAR NOTIFICAÇÃO
  async deleteNotification(id: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/api/notifications/${id}`)
      console.log(`🗑️ Notificação ${id} excluída`)
      return response.data
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error)
      throw error
    }
  },

  // ✅ DELETAR TODAS LIDAS
  async deleteAllRead(): Promise<DeleteAllReadResponse> {
    try {
      const response = await api.delete('/api/notifications/read')
      console.log(`🗑️ ${response.data.deletedCount} notificações lidas excluídas`)
      return {
        message: response.data.message || 'Notificações lidas excluídas',
        deletedCount: response.data.deletedCount || 0
      }
    } catch (error) {
      console.error('❌ Erro ao deletar notificações lidas:', error)
      throw error
    }
  },

  // ✅ ESTATÍSTICAS
  async getStats(): Promise<any> {
    try {
      const response = await api.get('/api/notifications/stats')
      return response.data.stats
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      return null
    }
  }
}

// ✅ EXPORTAR FUNÇÕES INDIVIDUAIS PARA COMPATIBILIDADE
export const getNotifications = notificationService.getNotifications
export const getUnreadCount = notificationService.getUnreadCount
export const markNotificationAsRead = notificationService.markAsRead
export const markNotificationAsUnread = notificationService.markAsUnread
export const markAllNotificationsAsRead = notificationService.markAllAsRead
export const deleteNotification = notificationService.deleteNotification
export const deleteAllReadNotifications = notificationService.deleteAllRead
export const getNotificationStats = notificationService.getStats

export default notificationService