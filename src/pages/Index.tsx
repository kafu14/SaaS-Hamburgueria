import heroImage from '@/assets/hero-burger.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { syncManager } from '@/lib/sync-manager';
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Clock,
  DollarSign,
  Settings,
  ShoppingCart,
  Store,
  Target,
  TrendingUp,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


const Index = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    pendingOrders: 0,
    lastSync: null as Date | null,
    isSyncing: false
  });

  // Stats mockadas - em produção viria do Supabase
  const mockStats = {
    ordersToday: 127,
    revenueToday: 3456.78,
    avgTicket: 27.20,
    avgPrepTime: 12,
    activeOrders: 8,
    urgentOrders: 2
  };

  const mockRecentOrders = [
    { id: '1', number: '145', status: 'preparing', time: '5 min', total: 45.90 },
    { id: '2', number: '144', status: 'ready', time: '12 min', total: 32.50 },
    { id: '3', number: '143', status: 'served', time: '15 min', total: 28.70 },
    { id: '4', number: '142', status: 'new', time: '2 min', total: 52.40 }
  ];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor sync status
    const unsubscribe = syncManager.onStatusChange((status) => {
      setSyncStatus({
        pendingOrders: status.pendingOrders,
        lastSync: status.lastSync,
        isSyncing: status.isSyncing
      });
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  🍔 Burger SaaS
                </h1>
                <p className="text-muted-foreground">Sistema completo para hamburguerias</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>

              {syncStatus.pendingOrders > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {syncStatus.pendingOrders} pendente{syncStatus.pendingOrders > 1 ? 's' : ''}
                </Badge>
              )}

              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Hamburger gourmet" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-bold text-white mb-6">
              Gerencie sua hamburgueria 
              <span className="block text-primary-glow">com inteligência</span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              PDV offline-first, KDS em tempo real, gestão completa multi-tenant. 
              Tudo que você precisa para fazer sua hamburgueria crescer.
            </p>
            
            <div className="flex gap-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-medium">
                <Link to="/pos">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Abrir PDV
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/kds">
                  <ChefHat className="h-5 w-5 mr-2" />
                  Cozinha (KDS)
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2">Dashboard em Tempo Real</h3>
          <p className="text-muted-foreground">Acompanhe o desempenho da sua hamburgueria</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pedidos Hoje */}
          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.ordersToday}</div>
              <p className="text-xs text-success">+12% em relação a ontem</p>
            </CardContent>
          </Card>

          {/* Faturamento */}
          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockStats.revenueToday)}</div>
              <p className="text-xs text-success">+8% em relação a ontem</p>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockStats.avgTicket)}</div>
              <p className="text-xs text-success">+3% em relação a ontem</p>
            </CardContent>
          </Card>

          {/* Tempo Médio */}
          <Card className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Preparo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.avgPrepTime}min</div>
              <p className="text-xs text-muted-foreground">+2min em relação a ontem</p>
            </CardContent>
          </Card>
        </div>

        {/* Status da Operação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pedidos Ativos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Pedidos em Andamento ({mockStats.activeOrders})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentOrders.slice(0, 4).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">#{order.number}</span>
                      <StatusBadge variant={order.status as any} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{order.time}</span>
                      <span className="font-semibold">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
                
                <Button asChild variant="outline" className="w-full">
                  <Link to="/kds">
                    Ver todos no KDS <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acesso Rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Acesso Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start bg-gradient-primary hover:bg-gradient-primary/90" size="lg">
                <Link to="/pos">
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Ponto de Venda (PDV)</div>
                    <div className="text-sm opacity-90">Abrir mesa, registrar pedidos</div>
                  </div>
                </Link>
              </Button>

              <Button asChild className="w-full justify-start bg-gradient-secondary hover:bg-gradient-secondary/90" size="lg">
                <Link to="/kds">
                  <ChefHat className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-secondary-foreground">Kitchen Display (KDS)</div>
                    <div className="text-sm opacity-90 text-secondary-foreground">Gerenciar preparo dos pedidos</div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <BarChart3 className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Relatórios</div>
                  <div className="text-sm text-muted-foreground">Em breve</div>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Gestão de Usuários</div>
                  <div className="text-sm text-muted-foreground">Em breve</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Status de Sincronização */}
      {(syncStatus.pendingOrders > 0 || syncStatus.isSyncing) && (
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {syncStatus.isSyncing ? (
                  <span>Sincronizando dados...</span>
                ) : (
                  <>
                    <span>{syncStatus.pendingOrders} pedido{syncStatus.pendingOrders > 1 ? 's' : ''} aguardando sincronização</span>
                    {syncStatus.lastSync && (
                      <span className="text-muted-foreground">
                        • Última sync: {formatTime(syncStatus.lastSync)}
                      </span>
                    )}
                  </>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => syncManager.forceSync()}
                disabled={!isOnline || syncStatus.isSyncing}
              >
                Sincronizar Agora
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">
              <strong className="text-foreground">Burger SaaS</strong> - Sistema completo para hamburguerias
            </p>
            <p className="text-sm">
              Multi-tenant • Offline-first • Tempo real • Desenvolvido para escalar
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
