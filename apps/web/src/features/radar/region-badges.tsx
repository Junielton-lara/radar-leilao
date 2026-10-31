import { REGION_COLORS } from './category-meta';

const REGION_POS: Record<string, string> = {
  Norte: 'left-[22%] top-[14%]',
  Nordeste: 'left-[52%] top-[20%]',
  'Centro-Oeste': 'left-[36%] top-[40%]',
  Sudeste: 'left-[58%] top-[48%]',
  Sul: 'left-[42%] top-[68%]',
};

export function RegionBadges({
  regions,
}: {
  regions: Array<{ region: string; count: number }>;
}) {
  if (!regions.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
      {regions.map((r) => {
        const color = REGION_COLORS[r.region] ?? '#64748B';
        return (
          <div
            key={r.region}
            className={`absolute max-w-[140px] rounded-xl border border-white/80 px-2.5 py-1.5 text-center shadow-md ${REGION_POS[r.region] ?? 'left-1/2 top-1/2'}`}
            style={{ background: `${color}33`, color: '#1e293b' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide">
              {r.region}
            </div>
            <div className="text-xs font-extrabold">{r.count} leilões</div>
          </div>
        );
      })}
    </div>
  );
}
