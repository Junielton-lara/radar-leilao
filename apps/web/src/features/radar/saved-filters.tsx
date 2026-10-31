import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, apiRequest } from '@/lib/api';
import {
  EMPTY_RADAR_FILTERS,
  type RadarFiltersState,
} from './filter-types';

const LOCAL_KEY = 'lancex_saved_filters_local';

export interface SavedFilter {
  id: string;
  name: string;
  filters: RadarFiltersState;
  source: 'api' | 'local';
}

function readLocal(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedFilter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: SavedFilter[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

async function fetchSavedFilters(): Promise<{
  items: SavedFilter[];
  mode: 'api' | 'local';
}> {
  try {
    const data = await apiRequest<
      Array<{ id: string; name: string; filters: RadarFiltersState }>
    >('/saved-filters');
    return {
      items: data.map((item) => ({ ...item, source: 'api' as const })),
      mode: 'api',
    };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
      return { items: readLocal(), mode: 'local' };
    }
    return { items: readLocal(), mode: 'local' };
  }
}

export function SavedFiltersPanel({
  current,
  onApply,
}: {
  current: RadarFiltersState;
  onApply: (filters: RadarFiltersState) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const query = useQuery({
    queryKey: ['saved-filters'],
    queryFn: fetchSavedFilters,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim() || `Filtro ${new Date().toLocaleDateString('pt-BR')}`,
        filters: current,
      };
      if (query.data?.mode === 'api') {
        try {
          await apiRequest('/saved-filters', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          return;
        } catch (err) {
          if (
            !(err instanceof ApiError) ||
            (err.status !== 404 && err.status !== 501)
          ) {
            throw err;
          }
        }
      }
      const next: SavedFilter = {
        id: crypto.randomUUID(),
        name: payload.name,
        filters: payload.filters,
        source: 'local',
      };
      writeLocal([next, ...readLocal()]);
    },
    onSuccess: () => {
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: SavedFilter) => {
      if (item.source === 'api') {
        try {
          await apiRequest(`/saved-filters/${item.id}`, { method: 'DELETE' });
          return;
        } catch (err) {
          if (
            !(err instanceof ApiError) ||
            (err.status !== 404 && err.status !== 501)
          ) {
            throw err;
          }
        }
      }
      writeLocal(readLocal().filter((f) => f.id !== item.id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
    },
  });

  const items = query.data?.items ?? [];
  const mode = query.data?.mode ?? 'local';

  return (
    <div className="space-y-3" data-testid="saved-filters">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Bookmark className="h-3.5 w-3.5 text-brand" />
          Filtros salvos
        </div>
        <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-text-dim">
          {mode === 'local' ? 'local' : 'API'}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          className="h-9"
          placeholder="Nome do filtro"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="saved-filter-name"
        />
        <Button
          size="sm"
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          data-testid="saved-filter-save"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
          Salvar
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-text-dim">
          Nenhum filtro salvo. Persistência local até o endpoint existir.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-border-subtle px-2 py-1.5"
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-xs font-medium hover:text-brand"
                onClick={() =>
                  onApply({ ...EMPTY_RADAR_FILTERS, ...item.filters })
                }
              >
                {item.name}
              </button>
              <span className="text-[9px] uppercase text-text-dim">
                {item.source}
              </span>
              <button
                type="button"
                className="rounded-lg p-1 text-text-dim hover:bg-white/5 hover:text-danger"
                aria-label={`Remover ${item.name}`}
                onClick={() => deleteMutation.mutate(item)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
