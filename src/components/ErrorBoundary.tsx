import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
          <div className="flex flex-col items-center justify-center max-w-md space-y-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Ops! Algo deu errado.
            </h1>
            <p className="text-sm text-muted-foreground">
              Encontramos um erro inesperado. Isso pode ocorrer por problemas de rede, sessão
              expirada ou dados corrompidos.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => {
                  try {
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.href = '/login'
                  } catch (e) {
                    window.location.reload()
                  }
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpar Cache e Recarregar
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 max-w-full overflow-auto rounded-md bg-muted p-4 text-left text-xs">
                <pre className="text-destructive">{this.state.error.message}</pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
