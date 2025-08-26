// frontend/src/services/notificationService.ts - CORRIGIR
import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  // ✅ LISTAR NOTIFICAÇÕES
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/api/notifications'); // ✅ /api/notifications
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  },

  // ✅ MARCAR COMO LIDA
  async markAsRead(id: string): Promise<void> {
    try {
      await api.put(`/api/notifications/${id}/read`); // ✅ /api/notifications
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  },

  // ✅ MARCAR TODAS COMO LIDAS
  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/api/notifications/mark-all-read'); // ✅ /api/notifications
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }
};