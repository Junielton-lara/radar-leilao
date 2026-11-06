import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FormActionBar({
  onCancel,
  onSave,
  cancelLabel = 'Cancelar',
  saveLabel = 'Salvar',
  loading,
  disabled,
  className,
}: {
  onCancel?: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-3 mt-6 border-t border-border/80 bg-bg-elevated/95 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-0',
        'mb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:mb-0',
        className,
      )}
    >
      <div className="flex gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        ) : null}
        {onSave ? (
          <Button
            type="button"
            className="h-11 flex-1"
            onClick={onSave}
            disabled={disabled || loading}
          >
            {loading ? 'Salvando…' : saveLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
