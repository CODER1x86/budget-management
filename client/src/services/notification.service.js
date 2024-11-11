import { apiService } from './api.service.js';
import { showToast } from '../utils/helpers.js';

class NotificationService {
    constructor() {
        this.notifications = [];
        this.websocket = null;
        this.callbacks = new Set();
    }

    async initialize() {
        try {
            await this.connectWebSocket();
            await this.loadNotifications();
        } catch (error) {
            console.error('Error initializing notification service:', error);
        }
    }

    async connectWebSocket() {
        const token = localStorage.getItem('auth_token');
        this.websocket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/notifications?token=${token}`);

        this.websocket.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            this.handleNewNotification(notification);
        };

        this.websocket.onclose = () => {
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        };
    }

    async loadNotifications() {
        try {
            const response = await apiService.request('/notifications');
            this.notifications = response.notifications;
            this.notifySubscribers();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    handleNewNotification(notification) {
        this.notifications.unshift(notification);
        this.notifySubscribers();
        this.showNotificationToast(notification);
    }

    showNotificationToast(notification) {
        showToast(notification.message, notification.type);
    }

    subscribe(callback) {
        this.callbacks.add(callback);
        // Immediately call with current notifications
        callback(this.notifications);
    }

    unsubscribe(callback) {
        this.callbacks.delete(callback);
    }

    notifySubscribers() {
        this.callbacks.forEach(callback => callback(this.notifications));
    }

    async markAsRead(notificationId) {
        try {
            await apiService.request(`/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            
            this.notifications = this.notifications.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, read: true }
                    : notification
            );
            
            this.notifySubscribers();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await apiService.request('/notifications/read-all', {
                method: 'PUT'
            });
            
            this.notifications = this.notifications.map(notification => ({
                ...notification,
                read: true
            }));
            
            this.notifySubscribers();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    async deleteNotification(notificationId) {
        try {
            await apiService.request(`/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            
            this.notifications = this.notifications.filter(
                notification => notification.id !== notificationId
            );
            
            this.notifySubscribers();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    async clearAll() {
        try {
            await apiService.request('/notifications/clear-all', {
                method: 'DELETE'
            });
            
            this.notifications = [];
            this.notifySubscribers();
        } catch (error) {
            console.error('Error clearing all notifications:', error);
        }
    }

    getUnreadCount() {
        return this.notifications.filter(notification => !notification.read).length;
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
        }
    }
}

export const notificationService = new NotificationService();

// Initialize the notification service when the module is imported
notificationService.initialize();
