import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((s) => ({ ...s, showDetails: !s.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">Ocorreu um erro</h1>
              <p className="text-muted-foreground">
                Algo inesperado aconteceu ao carregar esta página.
              </p>

              {this.state.error && (
                <div className="space-y-2">
                  <Button variant="outline" onClick={this.toggleDetails} className="w-full">
                    {this.state.showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                  </Button>
                  {this.state.showDetails && (
                    <div className="bg-muted p-3 rounded-lg text-left">
                      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                        {this.state.error.message}
                        {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={this.handleReload} className="gap-2 w-full">
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
