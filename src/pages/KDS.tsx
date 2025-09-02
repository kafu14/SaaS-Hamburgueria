import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OrderCard, OrderData } from '@/components/ui/order-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/* --- Compat status: aceita 'served' (antigo) e 'delivered' (Supabase) --- */
type AnyStatus = OrderData['status'] | 'delivered' | 'served';
const normalizeStatus = (s: AnyStatus): Exclude<AnyStatus, 'served'> =>
  s === 'served' ? 'delivered' : (s as Exclude<AnyStatus, 'served'>);

const isDelivered = (s: AnyStatus) => s === 'delivered' || s === 'served';
/* ----------------------------------------------------------------------- */

const KDS = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [stats, setStats] = useState({
    avgPrepTime: 12,
    ordersInQueue: 0,
    completedToday: 0,
    alertCount: 0,
  });

  // Estações da cozinha
  const stations = [
    { id: 'all', name: 'Todas Estações', emoji: '👨‍🍳' },
    { id: 'grill', name: 'Chapa', emoji: '🍳' },
    { id: 'fryer', name: 'Fritadeira', emoji: '🍟' },
    { id: 'assembly', name: 'Montagem', emoji: '🥪' },
    { id: 'drinks', name: 'Bebidas', emoji: '🥤' },
  ];

  // Mock data - Em produção viria do WebSocket do Supabase
  const mockOrders: OrderData[] = [
    {
      id: '1',
      orderNumber: '001',
      channel: 'dine_in',
      status: 'new',
      tableNumber: '12',
      items: [
        {
          id: '1',
          productName: 'X-Burger Clássico',
          quantity: 2,
          notes: 'Bem passado, sem cebola',
          modifiers: [{ name: 'Ponto da Carne', options: ['Bem Passado'] }],
        },
        { id: '2', productName: 'Batata Frita', quantity: 1 },
      ],
      total: 65.7,
      createdAt: new Date(Date.now() - 5 * 60000),
      estimatedTime: 15,
    },
    {
      id: '2',
      orderNumber: '002',
      channel: 'delivery',
      status: 'preparing',
      customer: { name: 'João Silva', phone: '(11) 99999-9999', address: 'Rua das Flores, 123' },
      items: [
        {
          id: '1',
          productName: 'Smash Bacon',
          quantity: 1,
          notes: 'Ao ponto',
          modifiers: [{ name: 'Ponto da Carne', options: ['Ao Ponto'] }],
        },
        { id: '2', productName: 'Coca-Cola', quantity: 2 },
      ],
      total: 45.8,
      createdAt: new Date(Date.now() - 12 * 60000),
      estimatedTime: 20,
    },
    {
      id: '3',
      orderNumber: '003',
      channel: 'takeout',
      status: 'ready',
      customer: { name: 'Maria Santos', phone: '(11) 88888-8888' },
      items: [
        { id: '1', productName: 'X-Burger Clássico', quantity: 1 },
        { id: '2', productName: 'Batata Frita', quantity: 1 },
        { id: '3', productName: 'Refrigerante', quantity: 1 },
      ],
      total: 38.4,
      createdAt: new Date(Date.now() - 18 * 60000),
      estimatedTime: 10,
    },
  ];

  // monta mock inicial + simula websocket
  useEffect(() => {
    setOrders(mockOrders);

    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const newOrder: OrderData = {
          id: `order_${Date.now()}`,
          orderNumber: String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0'),
          channel: (['dine_in', 'takeout', 'delivery'] as const)[Math.floor(Math.random() * 3)] as any,
          status: 'new',
          tableNumber: Math.random() > 0.5 ? String(Math.floor(Math.random() * 20) + 1) : undefined,
          items: [
            {
              id: '1',
              productName: 'X-Burger Clássico',
              quantity: Math.floor(Math.random() * 3) + 1,
              notes: Math.random() > 0.5 ? 'Bem passado' : undefined,
            },
          ],
          total: Math.random() * 50 + 20,
          createdAt: new Date(),
        };

        setOrders((prev) => [newOrder, ...prev]);

        if (soundEnabled) {
          toast.success(`Novo pedido #${newOrder.orderNumber}`, { duration: 3000 });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // recalcula stats sempre que orders mudar
  useEffect(() => {
    const now = Date.now();
    const inQueue = orders.filter((o) => o.status === 'new' || o.status === 'preparing').length;
    const completed = orders.filter((o) => isDelivered(o.status as AnyStatus)).length;
    const alerts = orders.filter((o) => now - o.createdAt.getTime() > 15 * 60000 && !isDelivered(o.status as AnyStatus)).length;

    setStats((s) => ({
      ...s,
      ordersInQueue: inQueue,
      completedToday: completed,
      alertCount: alerts,
    }));
  }, [orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderData['status'] | 'delivered' | 'served') => {
    const normalized = normalizeStatus(newStatus);
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: normalized as any } : order)));

    const order = orders.find((o) => o.id === orderId);
    if (order) {
      toast.success(`Pedido #${order.orderNumber} atualizado para ${getStatusLabel(normalized)}`);
    }
  };

  const getStatusLabel = (status: AnyStatus) => {
    const s = normalizeStatus(status);
    const labels: Record<ReturnType<typeof normalizeStatus>, string> = {
      new: 'Novo',
      preparing: 'Em Preparo',
      ready: 'Pronto',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[s];
  };

  const filterOrdersByStation = (list: OrderData[]) => {
    if (selectedStation === 'all') return list;

    // Heurística simples por nome
    return list.filter((order) => {
      const hasGrillItems = order.items.some(
        (item) => item.productName.toLowerCase().includes('burger') || item.productName.toLowerCase().includes('x-'),
      );
      const hasFryerItems = order.items.some(
        (item) => item.productName.toLowerCase().includes('batata') || item.productName.toLowerCase().includes('frita'),
      );
      const hasDrinkItems = order.items.some(
        (item) => item.productName.toLowerCase().includes('coca') || item.productName.toLowerCase().includes('refri'),
      );

      switch (selectedStation) {
        case 'grill':
          return hasGrillItems;
        case 'fryer':
          return hasFryerItems;
        case 'drinks':
          return hasDrinkItems;
        case 'assembly':
          return hasGrillItems || hasFryerItems;
        default:
          return true;
      }
    });
  };

  const ordersByStatus = useMemo(
    () => ({
      new: filterOrdersByStation(orders.filter((o) => o.status === 'new')),
      preparing: filterOrdersByStation(orders.filter((o) => o.status === 'preparing')),
      ready: filterOrdersByStation(orders.filter((o) => o.status === 'ready')),
    }),
    [orders, selectedStation],
  );

  const urgentOrders = useMemo(
    () => orders.filter((o) => Date.now() - o.createdAt.getTime() > 15 * 60000 && !isDelivered(o.status as AnyStatus)),
    [orders],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">🔥 Kitchen Display System</h1>

            {urgentOrders.length > 0 && (
              <Badge variant="destructive" className="gap-1 animate-glow">
                <AlertTriangle className="h-3 w-3" />
                {urgentOrders.length} Urgente{urgentOrders.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Stats rápidas */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{stats.ordersInQueue}</div>
                <div className="text-muted-foreground">Na Fila</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{stats.avgPrepTime}min</div>
                <div className="text-muted-foreground">Tempo Médio</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{stats.completedToday}</div>
                <div className="text-muted-foreground">Hoje</div>
              </div>
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSoundEnabled((v) => !v)}>
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Stub de refresh: em produção, refetch das ordens do Supabase
                  setOrders((prev) => [...prev]);
                  toast.info('Atualizado');
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros de estação */}
        <div className="px-6 pb-4">
          <Tabs value={selectedStation} onValueChange={setSelectedStation}>
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              {stations.map((station) => (
                <TabsTrigger key={station.id} value={station.id} className="gap-1">
                  <span>{station.emoji}</span>
                  {station.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Grid de pedidos por status */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Novos Pedidos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">🆕 Novos</h2>
              <Badge className="bg-status-new text-white">{ordersByStatus.new.length}</Badge>
            </div>

            <div className="space-y-4 overflow-y-auto h-full">
              {ordersByStatus.new.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  variant="kds"
                  className="animate-pulse-soft"
                />
              ))}

              {ordersByStatus.new.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <div>✅ Nenhum pedido novo</div>
                  <div className="text-sm mt-2">Ótimo trabalho!</div>
                </Card>
              )}
            </div>
          </div>

          {/* Em Preparo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">🔥 Em Preparo</h2>
              <Badge className="bg-status-preparing text-white">{ordersByStatus.preparing.length}</Badge>
            </div>

            <div className="space-y-4 overflow-y-auto h-full">
              {ordersByStatus.preparing.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  variant="kds"
                  className="animate-glow"
                />
              ))}

              {ordersByStatus.preparing.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <div>🍳 Nenhum pedido em preparo</div>
                  <div className="text-sm mt-2">Aceite novos pedidos</div>
                </Card>
              )}
            </div>
          </div>

          {/* Prontos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">✅ Prontos</h2>
              <Badge className="bg-status-ready text-white">{ordersByStatus.ready.length}</Badge>
            </div>

            <div className="space-y-4 overflow-y-auto h-full">
              {ordersByStatus.ready.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  variant="kds"
                  className="animate-bounce-soft"
                />
              ))}

              {ordersByStatus.ready.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <div>📦 Nenhum pedido pronto</div>
                  <div className="text-sm mt-2">Continue cozinhando</div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas urgentes (overlay) */}
      {useMemo(
        () => urgentOrders.length > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <Card className="bg-destructive text-destructive-foreground shadow-strong animate-glow">
              <CardContent className="p-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">
                  {urgentOrders.length} pedido{urgentOrders.length > 1 ? 's' : ''} há mais de 15 minutos!
                </span>
              </CardContent>
            </Card>
          </div>
        ),
        [/* memo de overlay */],
      )}
    </div>
  );
};

export default KDS;
