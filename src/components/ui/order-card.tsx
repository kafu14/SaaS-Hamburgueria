import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  notes?: string;
  modifiers?: {
    name: string;
    options: string[];
  }[];
}

export interface OrderData {
  id: string;
  orderNumber: string;
  channel: 'dine_in' | 'takeout' | 'delivery';
  status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
  tableNumber?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: Date;
  estimatedTime?: number; // em minutos
}

interface OrderCardProps {
  order: OrderData;
  onStatusChange?: (orderId: string, status: OrderData['status']) => void;
  onViewDetails?: (order: OrderData) => void;
  variant?: 'pos' | 'kds' | 'compact';
  className?: string;
}

const getChannelIcon = (channel: OrderData['channel']) => {
  switch (channel) {
    case 'dine_in':
      return '🍽️';
    case 'takeout':
      return '🥡';
    case 'delivery':
      return '🚚';
    default:
      return '📋';
  }
};

const getChannelLabel = (channel: OrderData['channel']) => {
  switch (channel) {
    case 'dine_in':
      return 'Balcão';
    case 'takeout':
      return 'Retirada';
    case 'delivery':
      return 'Delivery';
    default:
      return 'Pedido';
  }
};

const getTimeElapsed = (createdAt: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60);
  
  if (diff < 1) return 'Agora mesmo';
  if (diff === 1) return '1 minuto';
  if (diff < 60) return `${diff} minutos`;
  
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

export function OrderCard({ 
  order, 
  onStatusChange, 
  onViewDetails, 
  variant = 'pos',
  className 
}: OrderCardProps) {
  const timeElapsed = getTimeElapsed(order.createdAt);
  const isUrgent = new Date().getTime() - order.createdAt.getTime() > 15 * 60 * 1000; // 15+ minutos

  const nextStatus = {
    new: 'preparing',
    preparing: 'ready',
    ready: 'served',
    served: 'served',
    cancelled: 'cancelled'
  } as const;

  const statusLabels = {
    new: 'Aceitar Pedido',
    preparing: 'Marcar Pronto',
    ready: 'Entregar',
    served: 'Entregue',
    cancelled: 'Cancelado'
  };

  return (
    <Card className={cn(
      "relative transition-all duration-300",
      variant === 'kds' && "min-h-[300px] shadow-medium hover:shadow-strong",
      variant === 'compact' && "max-w-sm",
      isUrgent && order.status !== 'served' && "ring-2 ring-danger animate-glow",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getChannelIcon(order.channel)}</span>
            <div>
              <h3 className="font-bold text-lg">#{order.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {getChannelLabel(order.channel)}
                {order.tableNumber && ` - Mesa ${order.tableNumber}`}
              </p>
            </div>
          </div>
          <StatusBadge 
            variant={order.status} 
            size={variant === 'kds' ? 'lg' : 'default'}
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className={cn(isUrgent && "text-danger font-semibold")}>
              {timeElapsed}
            </span>
          </div>
          
          {order.customer?.name && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{order.customer.name}</span>
            </div>
          )}
          
          {order.customer?.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>{order.customer.phone}</span>
            </div>
          )}
        </div>

        {order.customer?.address && (
          <div className="flex items-start gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{order.customer.address}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {order.items.map((item, index) => (
          <div key={index} className="border-l-4 border-l-primary pl-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.quantity}x
                  </Badge>
                  <span className="font-medium">{item.productName}</span>
                </div>
                
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    "{item.notes}"
                  </p>
                )}
                
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {item.modifiers.map((modifier, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium">{modifier.name}:</span>{' '}
                        {modifier.options.join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      {variant !== 'compact' && (
        <CardFooter className="pt-3 flex justify-between items-center">
          <div className="text-lg font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(order.total)}
          </div>

          <div className="flex gap-2">
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(order)}
              >
                Detalhes
              </Button>
            )}
            
            {onStatusChange && order.status !== 'served' && order.status !== 'cancelled' && (
              <Button 
                variant={order.status === 'ready' ? 'default' : 'secondary'}
                size="sm"
                className={cn(
                  order.status === 'ready' && "bg-gradient-success"
                )}
                onClick={() => onStatusChange(order.id, nextStatus[order.status])}
              >
                {statusLabels[order.status]}
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}