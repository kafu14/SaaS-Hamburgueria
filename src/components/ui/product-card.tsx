import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  active: boolean;
  modifiers?: {
    id: string;
    name: string;
    required: boolean;
    options: {
      id: string;
      name: string;
      priceDelta: number;
    }[];
  }[];
}

interface ProductCardProps {
  product: ProductData;
  onAdd?: (product: ProductData) => void;
  onRemove?: (productId: string) => void;
  quantity?: number;
  variant?: 'grid' | 'list' | 'compact';
  disabled?: boolean;
  className?: string;
}

export function ProductCard({ 
  product, 
  onAdd, 
  onRemove, 
  quantity = 0,
  variant = 'grid',
  disabled = false,
  className 
}: ProductCardProps) {
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAdd && !disabled) {
      onAdd(product);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove && quantity > 0) {
      onRemove(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card className={cn(
      "group relative transition-all duration-300 hover:shadow-medium cursor-pointer",
      variant === 'grid' && "aspect-[4/3]",
      variant === 'list' && "flex-row",
      disabled && "opacity-50 cursor-not-allowed",
      !product.active && "grayscale opacity-60",
      quantity > 0 && "ring-2 ring-primary shadow-soft",
      className
    )}>
      <CardContent className={cn(
        "p-4 h-full",
        variant === 'list' && "flex items-center gap-4"
      )}>
        {/* Imagem do produto */}
        {product.image && variant !== 'compact' && (
          <div className={cn(
            "relative overflow-hidden rounded-lg bg-gradient-primary",
            variant === 'grid' && "aspect-video mb-3",
            variant === 'list' && "w-20 h-20 flex-shrink-0"
          )}>
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {!product.active && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive">Indisponível</Badge>
              </div>
            )}
          </div>
        )}

        <div className={cn(
          "flex-1",
          variant === 'grid' && "space-y-2"
        )}>
          {/* Header com nome e preço */}
          <div className={cn(
            variant === 'list' && "flex items-start justify-between w-full"
          )}>
            <div className={cn(variant === 'list' && "flex-1 mr-4")}>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {product.name}
              </h3>
              
              {variant !== 'compact' && product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                
                {product.modifiers && product.modifiers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Personalizável
                  </Badge>
                )}
              </div>
            </div>

            <div className={cn(
              "flex flex-col items-end gap-2",
              variant === 'grid' && "flex-row items-center justify-between mt-3"
            )}>
              <span className="font-bold text-lg text-primary">
                {formatPrice(product.price)}
              </span>

              {/* Controles de quantidade */}
              <div className="flex items-center gap-2">
                {quantity > 0 && onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleRemove}
                    disabled={disabled}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}

                {quantity > 0 && (
                  <Badge className="bg-primary text-primary-foreground min-w-[2rem] text-center">
                    {quantity}
                  </Badge>
                )}

                {onAdd && (
                  <Button
                    variant={quantity > 0 ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      quantity > 0 && "bg-gradient-primary hover:bg-gradient-primary/90"
                    )}
                    onClick={handleAdd}
                    disabled={disabled || !product.active}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de pedido ativo */}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 h-3 w-3 bg-primary rounded-full animate-glow" />
        )}
      </CardContent>
    </Card>
  );
}