/**
 * Sync Manager - Gerencia sincronização bidirecional
 * Sincroniza pedidos offline e mantém dados atualizados
 */

import { OfflineOrder, offlineStorage } from './offline-storage';
import { supabase } from './supabase';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOrders: number;
  isSyncing: boolean;
  errors: string[];
}

class SyncManager {
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private syncInterval: number | null = null;
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Monitor de conectividade
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.startPeriodicSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
      this.stopPeriodicSync();
    });

    // Iniciar sync se estiver online
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }

  onStatusChange(callback: (status: SyncStatus) => void) {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) this.statusCallbacks.splice(index, 1);
    };
  }

  private async notifyStatusChange() {
    const status = await this.getStatus();
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingOrders = (await offlineStorage.getPendingSyncOrders()).length;
    const lastSync = await offlineStorage.getSetting('lastSync');

    return {
      isOnline: this.isOnline,
      lastSync: lastSync ? new Date(lastSync) : null,
      pendingOrders,
      isSyncing: this.isSyncing,
      errors: [],
    };
  }

  private startPeriodicSync() {
    if (this.syncInterval) return;

    // Sync imediato
    this.syncPendingOrders();

    // Sync a cada 30 segundos
    this.syncInterval = window.setInterval(() => {
      this.syncPendingOrders();
    }, 30_000);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingOrders(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    this.notifyStatusChange();

    try {
      // Garante IndexedDB aberto antes de usar
      await offlineStorage.init();

      const pendingOrders = await offlineStorage.getPendingSyncOrders();

      for (const order of pendingOrders) {
        await this.syncOrder(order);
      }

      await offlineStorage.setSetting('lastSync', new Date().toISOString());
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  private async syncOrder(order: OfflineOrder): Promise<void> {
    try {
      await offlineStorage.updateOrderStatus(
        order.id,
        'syncing',
        (order.syncAttempts ?? 0) + 1
      );

      // Converter para formato da API
      const apiOrder = {
        tenant_id: order.tenantId,
        store_id: order.storeId,
        channel: order.channel,
        table_number: order.tableNumber,
        customer: order.customer,
        items: order.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price_cents: Math.round(item.unitPrice * 100),
          notes: item.notes,
          modifiers: item.modifiers.map((mod) => ({
            modifier_id: mod.modifierId,
            options: mod.options.map((opt) => ({
              option_id: opt.optionId,
              price_delta_cents: Math.round(opt.priceDelta * 100),
            })),
          })),
        })),
        subtotal_cents: Math.round(order.subtotal * 100),
        discount_cents: Math.round(order.discount * 100),
        service_fee_cents: Math.round(order.serviceFee * 100),
        total_cents: Math.round(order.total * 100),
      };

      const { error } = await supabase.from('orders').insert(apiOrder);
      if (error) throw error;

      await offlineStorage.updateOrderStatus(order.id, 'synced');
      console.log(`Pedido ${order.id} sincronizado com sucesso`);
    } catch (error) {
      console.error(`Erro ao sincronizar pedido ${order.id}:`, error);

      const maxAttempts = 3;
      const attempts = order.syncAttempts ?? 0;

      if (attempts >= maxAttempts) {
        await offlineStorage.updateOrderStatus(order.id, 'error', attempts);
      } else {
        await offlineStorage.updateOrderStatus(order.id, 'pending_sync', attempts);
      }
    }
  }

  async forceSync(): Promise<void> {
    if (!this.isOnline) throw new Error('Não é possível sincronizar offline');
    await this.syncPendingOrders();
  }

  // Sync do menu (download)
  async syncMenu(tenantId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select(
          `
          *,
          products (
            *,
            modifiers (
              *,
              modifier_options (*)
            )
          )
        `
        )
        .eq('tenant_id', tenantId)
        .order('sort_order');

      if (error) throw error;

      const menu = {
        id: tenantId,
        tenantId,
        categories: categories || [],
        lastUpdated: new Date(),
      };

      await offlineStorage.cacheMenu(menu);
    } catch (error) {
      console.error('Erro ao sincronizar menu:', error);
    }
  }

  // Limpeza de dados antigos
  async cleanup(): Promise<void> {
    await offlineStorage.clearOldOrders(7);
  }
}

export const syncManager = new SyncManager();
