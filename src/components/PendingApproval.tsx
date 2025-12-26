import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface PendingApprovalProps {
  status: 'pending' | 'rejected';
}

export function PendingApproval({ status }: PendingApprovalProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-border/50">
        <CardContent className="pt-8 pb-6 text-center">
          {status === 'pending' ? (
            <>
              <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Aguardando Aprovação</h1>
              <p className="text-muted-foreground mb-6">
                Sua conta foi criada com sucesso! Um administrador precisa aprovar seu acesso antes de você poder usar o sistema.
              </p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
              <p className="text-muted-foreground mb-6">
                Infelizmente seu acesso foi negado. Entre em contato com o administrador para mais informações.
              </p>
            </>
          )}
          <Button variant="outline" onClick={signOut} className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
