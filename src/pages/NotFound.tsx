import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Usuário tentou acessar uma rota inexistente:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full shadow-xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold text-destructive">
            404
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            Ops! Página não encontrada
          </p>
          <Button asChild variant="default" size="lg">
            <Link to="/">Voltar para a Página Inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
