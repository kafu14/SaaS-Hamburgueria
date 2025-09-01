/**
 * Offline Storage Manager - IndexedDB para funcionalidade offline-first
 * Gerencia pedidos, menu e sincronização quando offline
 */

export interface OfflineOrder {
  id: string;
  tenantId: string;
  storeId: string;
  channel: 'dine_in' | 'takeout' | 'delivery';
  tableNumber?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    modifiers: {
      modifierId: string;
      modifierName: string;
      options: {
        optionId: string;
        optionName: string;
        priceDelta: number;
      }[];
    }[];
  }[];
  subtotal: number;
  discount: number;
  serviceFee: number;
  total: number;
  status: 'pending_sync' | 'syncing' | 'synced' | 'error';
  createdAt: Date;
  syncAttempts: number;
}

export interface CachedMenu {
  id: string;
  tenantId: string;
  categories: {
    id: string;
    name: string;
    sortOrder: number;
    products: {
      id: string;
      name: string;
      description: string;
      price: number;
      active: boolean;
      modifiers: {
        id: string;
        name: string;
        required: boolean;
        multiple: boolean;
        options: {
          id: string;
          name: string;
          priceDelta: number;
        }[];
      }[];
    }[];
  }[];
  lastUpdated: Date;
}

class OfflineStorageManager {
  private dbName = 'BurgerSaaS';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para pedidos offline
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('tenantId', 'tenantId', { unique: false });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store para menu cache
        if (!db.objectStoreNames.contains('menu')) {
          const menuStore = db.createObjectStore('menu', { keyPath: 'id' });
          menuStore.createIndex('tenantId', 'tenantId', { unique: false });
        }

        // Store para configurações offline
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Gerenciamento de pedidos offline
  async saveOfflineOrder(order: OfflineOrder): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    return new Promise((resolve, reject) => {
      const request = store.put(order);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineOrders(tenantId: string): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const index = store.index('tenantId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(tenantId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const index = store.index('status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending_sync');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateOrderStatus(orderId: string, status: OfflineOrder['status'], syncAttempts?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(orderId);
      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (order) {
          order.status = status;
          if (syncAttempts !== undefined) {
            order.syncAttempts = syncAttempts;
          }
          const putRequest = store.put(order);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Order not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Gerenciamento de cache do menu
  async cacheMenu(menu: CachedMenu): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['menu'], 'readwrite');
    const store = transaction.objectStore('menu');
    
    return new Promise((resolve, reject) => {
      const request = store.put(menu);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedMenu(tenantId: string): Promise<CachedMenu | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['menu'], 'readonly');
    const store = transaction.objectStore('menu');
    
    return new Promise((resolve, reject) => {
      const request = store.get(tenantId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Configurações
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Limpeza e manutenção
  async clearOldOrders(daysOld: number = 7): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const transaction = this.db.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    const index = store.index('createdAt');
    
    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(cutoffDate);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const order = cursor.value as OfflineOrder;
          if (order.status === 'synced') {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorageManager();