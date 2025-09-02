import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OrderCard, OrderData } from '@/components/ui/order-card';
import { ProductCard, ProductData } from '@/components/ui/product-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { offlineStorage } from '@/lib/offline-storage';
import { useEffect, useMemo, useState } from 'react';

import {
  Calculator,
  Percent,
  Search,
  ShoppingCart,
  Trash2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  product: ProductData;
  quantity: number;
  notes?: string;
  modifiers?: {
    modifierId: string;
    modifierName: string;
    options: {
      optionId: string;
      optionName: string;
      priceDelta: number;
    }[];
  }[];
}

const POS = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderChannel, setOrderChannel] = useState<'dine_in' | 'takeout' | 'delivery'>('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState<number>(0); // %
  const [serviceFee] = useState(10); // Taxa de serviço 10% (só para dine_in)
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);

  // Mock data - Em produção viria do Supabase
  const mockCategories = [
    { id: 'all', name: 'Todos', sortOrder: 0 },
    { id: 'burgers', name: '🍔 Hamburgers', sortOrder: 1 },
    { id: 'sides', name: '🍟 Acompanhamentos', sortOrder: 2 },
    { id: 'drinks', name: '🥤 Bebidas', sortOrder: 3 },
    { id: 'desserts', name: '🍨 Sobremesas', sortOrder: 4 }
  ];

  const mockProducts: ProductData[] = [
    {
      id: '1',
      name: 'X-Burger Clássico',
      description: 'Pão brioche, hambúrguer 150g, queijo, alface, tomate, maionese especial',
      price: 24.90,
      category: 'burgers',
      active: true,
      modifiers: [{
        id: 'meat-point',
        name: 'Ponto da Carne',
        required: true,
        options: [
          { id: 'rare', name: 'Mal Passado', priceDelta: 0 },
          { id: 'medium', name: 'Ao Ponto', priceDelta: 0 },
          { id: 'well', name: 'Bem Passado', priceDelta: 0 }
        ]
      }]
    },
    {
      id: '2',
      name: 'Smash Bacon',
      description: 'Duplo smash beef, bacon crocante, queijo cheddar, cebola caramelizada',
      price: 32.90,
      category: 'burgers',
      active: true,
      modifiers: [{
        id: 'meat-point',
        name: 'Ponto da Carne',
        required: true,
        options: [
          { id: 'rare', name: 'Mal Passado', priceDelta: 0 },
          { id: 'medium', name: 'Ao Ponto', priceDelta: 0 },
          { id: 'well', name: 'Bem Passado', priceDelta: 0 }
        ]
      }]
    },
    {
      id: '3',
      name: 'Batata Frita Gourmet',
      description: 'Batatas rústicas com tempero especial e molho bacon',
      price: 15.90,
      category: 'sides',
      active: true
    },
    {
      id: '4',
      name: 'Coca-Cola 350ml',
      description: 'Refrigerante gelado',
      price: 6.50,
      category: 'drinks',
      active: true
    }
  ];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: ProductData) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find(item => item.product.id === productId);

    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.product.id !== productId));
    }
  };

  const clearCart = () => {
    setCart([]);
    setTableNumber('');
    setCustomerName('');
    setDiscount(0);
  };

  const getProductQuantity = (productId: string) => {
    return cart.find(item => item.product.id === productId)?.quantity || 0;
  };

  // Desconto: saneamento (aceita vírgula, limita 0–100)
  const handleDiscountChange = (v: string) => {
    const normalized = v.replace(',', '.').trim();
    const n = Number(normalized);
    if (Number.isNaN(n)) return setDiscount(0);
    setDiscount(Math.max(0, Math.min(100, n)));
  };

  // Totais derivados com memo
  const totals = useMemo(() => {
    const baseSubtotal = cart.reduce((sum, item) => {
      // Futuro: somar modifiers (priceDelta * quantity)
      return sum + (item.product.price * item.quantity);
    }, 0);

    const discountAmount = baseSubtotal * (discount / 100);
    const serviceFeeAmount = orderChannel === 'dine_in' ? baseSubtotal * (serviceFee / 100) : 0;
    const total = Math.max(0, baseSubtotal - discountAmount + serviceFeeAmount);

    return {
      subtotal: baseSubtotal,
      discountAmount,
      serviceFeeAmount,
      total
    };
  }, [cart, discount, orderChannel, serviceFee]);

  const { subtotal, discountAmount, serviceFeeAmount, total } = totals;

  const canCheckout =
    cart.length > 0 &&
    (orderChannel !== 'dine_in' || !!tableNumber.trim()) &&
    total > 0;

  const processOrder = async () => {
    if (cart.length === 0) return toast.error('Adicione itens ao pedido');
    if (orderChannel === 'dine_in' && !tableNumber.trim()) return toast.error('Informe o número da mesa');

    try {
      const orderData = {
        id: `order_${Date.now()}`,
        tenantId: 'demo_tenant',
        storeId: 'demo_store',
        channel: orderChannel,
        tableNumber: orderChannel === 'dine_in' ? tableNumber.trim() : undefined,
        customer: customerName.trim() ? { name: customerName.trim() } : undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          notes: item.notes,
          modifiers: item.modifiers || []
        })),
        subtotal,
        discount: discountAmount,
        serviceFee: serviceFeeAmount,
        total,
        status: 'pending_sync' as const,
        createdAt: new Date(),
        syncAttempts: 0
      };

      if (isOnline) {
        // TODO: enviar pro Supabase aqui
        toast.success('Pedido processado com sucesso!');
      } else {
        await offlineStorage.saveOfflineOrder(orderData);
        toast.success('Pedido salvo offline. Será sincronizado quando conectar.');
      }

      // Card visual do pedido feito
      const newOrder: OrderData = {
        id: orderData.id,
        orderNumber: String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0'),
        channel: orderChannel,
        status: 'new',
        tableNumber: orderData.tableNumber,
        customer: orderData.customer,
        items: cart.map(item => ({
          id: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          notes: item.notes
        })),
        total,
        createdAt: new Date()
      };

      setCurrentOrder(newOrder);
      clearCart();

      // some o card após alguns segundos
      setTimeout(() => setCurrentOrder(null), 6000);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar pedido');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PDV - Burger SaaS
            </h1>
            <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Canal de venda */}
            <Tabs value={orderChannel} onValueChange={(v) => setOrderChannel(v as any)}>
              <TabsList>
                <TabsTrigger value="dine_in">🍽️ Balcão</TabsTrigger>
                <TabsTrigger value="takeout">🥡 Retirada</TabsTrigger>
                <TabsTrigger value="delivery">🚚 Delivery</TabsTrigger>
              </TabsList>
            </Tabs>

            {cart.length > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Produtos */}
        <div className="flex-1 flex flex-col">
          {/* Filtros */}
          <div className="p-4 border-b bg-card">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                {mockCategories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de produtos */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                  quantity={getProductQuantity(product.id)}
                  variant="grid"
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="w-96 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedido Atual
            </h2>
          </div>

          {/* Detalhes do pedido */}
          <div className="p-4 space-y-4 border-b">
            {orderChannel === 'dine_in' && (
              <div>
                <label className="text-sm font-medium">Mesa</label>
                <Input
                  placeholder="Número da mesa"
                  inputMode="numeric"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Cliente (Opcional)</label>
              <Input
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>

          {/* Itens do carrinho */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para começar</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map(item => (
                  <Card key={item.product.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          -
                        </Button>

                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => addToCart(item.product)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Totais e finalização */}
          {cart.length > 0 && (
            <div className="p-4 border-t space-y-4">
              {/* Desconto */}
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                <Input
                  inputMode="decimal"
                  placeholder="Desconto %"
                  value={String(discount)}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Resumo financeiro */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto ({discount}%):</span>
                    <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)}</span>
                  </div>
                )}

                {serviceFeeAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de serviço ({serviceFee}%):</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(serviceFeeAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>

                <Button
                  onClick={processOrder}
                  className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90"
                  disabled={!canCheckout}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card flutuante do último pedido */}
      {currentOrder && (
        <div className="fixed bottom-4 right-4 max-w-md">
          <OrderCard
            order={currentOrder}
            variant="compact"
            className="shadow-strong animate-bounce-soft"
          />
        </div>
      )}
    </div>
  );
};

export default POS;
