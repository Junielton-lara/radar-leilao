import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'admin@lancex.app',
      password: 'ChangeMeAdmin123!',
    },
  });

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no login');
    }
  });

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      data-testid="login-page"
    >
      <div className="card-soft w-full max-w-md animate-fade-up p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-bold tracking-tight">
            Lance<span className="text-brand">X</span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Radar Inteligente de Leilões
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-text-dim">
            by +Gestor
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={onSubmit}
          data-testid="login-form"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              E-mail
            </label>
            <Input
              type="email"
              autoComplete="username"
              data-testid="login-email"
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Senha
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              data-testid="login-password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-danger">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-danger" data-testid="login-error">
              {error}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={isSubmitting}
            data-testid="login-submit"
          >
            {isSubmitting ? 'Entrando...' : 'Acessar Radar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
