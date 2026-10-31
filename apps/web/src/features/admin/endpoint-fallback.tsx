import { isEndpointUnavailable, unavailableMessage } from '@/lib/admin-api';

export function EndpointFallback({ error }: { error: unknown }) {
  const unavailable = isEndpointUnavailable(error);
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm font-medium text-text">
        {unavailable
          ? 'endpoint ainda não disponível'
          : 'Não foi possível carregar os dados'}
      </p>
      <p className="mt-2 text-xs text-text-dim">{unavailableMessage(error)}</p>
    </div>
  );
}
