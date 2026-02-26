import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import { signInSchema, signUpSchema } from '@/lib/validation';
import { logAuditEvent } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleForgotPassword = async () => {
    const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
    if (!email) {
      toast({ title: 'Informe seu email', description: 'Preencha o campo de email antes.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignInErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setSignInErrors(errors);
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(validation.data.email, validation.data.password);

    if (error) {
      await logAuditEvent({ action: 'login_failed', newData: { email: validation.data.email } });
      toast({
        title: 'Erro ao entrar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      await logAuditEvent({ action: 'login_success' });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignUpErrors({});

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validation = signUpSchema.safeParse({ fullName, email, password });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setSignUpErrors(errors);
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(validation.data.email, validation.data.password, validation.data.fullName);

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      await logAuditEvent({ action: 'signup', newData: { email: validation.data.email } });
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode fazer login.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — Orange gradient matching institutional site hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-cubo-gradient items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative watermark like institutional site */}
        <span className="absolute -top-10 -left-10 text-[18rem] font-serif italic font-bold text-white/[0.08] select-none pointer-events-none leading-none">
          Cubo
        </span>
        <span className="absolute -bottom-20 -right-10 text-[14rem] font-serif italic font-bold text-white/[0.06] select-none pointer-events-none leading-none">
          Cubo
        </span>
        
        {/* Decorative cross elements like institutional site */}
        <div className="absolute top-32 right-24 text-white/10 text-6xl font-light select-none">+</div>
        <div className="absolute bottom-40 left-20 text-white/10 text-4xl font-light select-none">+</div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-white font-serif text-6xl leading-tight mb-6">
            Transforme sua clínica em uma <em className="italic">máquina de vendas</em>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            IA no WhatsApp, tráfego pago que converte e social media no piloto automático.
          </p>
          <div className="flex items-center gap-6 mt-8 text-white/60 text-sm">
            <span>+200 clínicas atendidas</span>
            <span>•</span>
            <span>Resultados em 30 dias</span>
          </div>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-bold tracking-tight">CUBO</span>
          </div>

          <div>
            <h2 className="text-3xl font-serif font-semibold tracking-tight">Bem-vindo</h2>
            <p className="text-muted-foreground mt-2">
              Entre ou crie sua conta para continuar.
            </p>
          </div>

          <Card className="border-border/50 shadow-card">
            <Tabs defaultValue="login" className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar Conta</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        className={`h-12 ${signInErrors.email ? 'border-destructive' : ''}`}
                      />
                      {signInErrors.email && (
                        <p className="text-sm text-destructive">{signInErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className={`h-12 ${signInErrors.password ? 'border-destructive' : ''}`}
                      />
                      {signInErrors.password && (
                        <p className="text-sm text-destructive">{signInErrors.password}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                    >
                      Esqueceu sua senha?
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome completo</Label>
                      <Input
                        id="register-name"
                        name="fullName"
                        type="text"
                        placeholder="Seu nome"
                        required
                        className={`h-12 ${signUpErrors.fullName ? 'border-destructive' : ''}`}
                      />
                      {signUpErrors.fullName && (
                        <p className="text-sm text-destructive">{signUpErrors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        className={`h-12 ${signUpErrors.email ? 'border-destructive' : ''}`}
                      />
                      {signUpErrors.email && (
                        <p className="text-sm text-destructive">{signUpErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        minLength={8}
                        required
                        className={`h-12 ${signUpErrors.password ? 'border-destructive' : ''}`}
                      />
                      {signUpErrors.password && (
                        <p className="text-sm text-destructive">{signUpErrors.password}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, com maiúscula, minúscula e número
                      </p>
                    </div>
                    <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Criar Conta
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
