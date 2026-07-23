'use client'

import { Trophy } from 'lucide-react'

interface SorteoRow {
  regulares: number[];
  superbalota: number;
}

interface PanelSorteosProps {
  data: SorteoRow[];
  onChange: (data: SorteoRow[]) => void;
  maxRegular: number;
  showSuperbalota: boolean;
}

export default function PanelSorteos({ data, onChange, maxRegular, showSuperbalota }: PanelSorteosProps) {
  const safeData = data ?? [];

  const handleRegularChange = (fila: number, col: number, value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num)) return;
    const newData = safeData.map((row: any, i: number) => {
      if (i !== fila) return row ?? { regulares: [0, 0, 0, 0, 0], superbalota: 0 };
      const newRegs = (row?.regulares ?? []).map((cell: any, j: number) => (j === col ? num : cell));
      return { ...(row ?? {}), regulares: newRegs };
    });
    onChange?.(newData);
  };

  const handleSuperbalotaChange = (fila: number, value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num)) return;
    const newData = safeData.map((row: any, i: number) => {
      if (i !== fila) return row ?? { regulares: [0, 0, 0, 0, 0], superbalota: 0 };
      return { ...(row ?? {}), superbalota: num };
    });
    onChange?.(newData);
  };

  const getRegCellStyle = (value: number) => {
    if (value < 1 || value > maxRegular) return 'border-border bg-background';
    return 'border-amber-400/40 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold';
  };

  const getSbCellStyle = (value: number) => {
    if (value < 1 || value > 16) return 'border-border bg-background';
    return 'border-red-400/40 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-semibold';
  };

  return (
    <div className="rounded-xl p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-md)', background: 'hsl(var(--card))' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight text-card-foreground">Últimos 5 Sorteos</h2>
          <p className="text-xs text-muted-foreground">
            5 números (1-{maxRegular}) {showSuperbalota ? '+ Superbalota (1-16)' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
        <span className="w-5 shrink-0" />
        {[1, 2, 3, 4, 5].map((n: number) => (
          <span key={n} className="w-12 sm:w-14 text-center text-[10px] font-mono text-muted-foreground">N{n}</span>
        ))}
        {showSuperbalota && (
          <>
            <span className="w-1 shrink-0" />
            <span className="w-12 sm:w-14 text-center text-[10px] font-mono text-red-500">SB</span>
          </>
        )}
      </div>

      <div className="space-y-2">
        {safeData.map((sorteo: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">S{i + 1}</span>
            {(sorteo?.regulares ?? [0, 0, 0, 0, 0]).map((val: number, j: number) => (
              <input
                key={j}
                type="number"
                min={1}
                max={maxRegular}
                value={val || ''}
                onChange={(e: any) => handleRegularChange(i, j, e?.target?.value ?? '')}
                placeholder="--"
                className={`w-12 sm:w-14 h-10 text-center text-sm font-mono rounded-lg border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500 ${getRegCellStyle(val)} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            ))}

            {showSuperbalota && (
              <>
                <div className="w-px h-8 bg-border mx-0.5" />
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={sorteo?.superbalota || ''}
                  onChange={(e: any) => handleSuperbalotaChange(i, e?.target?.value ?? '')}
                  placeholder="--"
                  className={`w-12 sm:w-14 h-10 text-center text-sm font-mono rounded-lg border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-500 ${getSbCellStyle(sorteo?.superbalota ?? 0)} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
