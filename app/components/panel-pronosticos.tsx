'use client'

import { Dices } from 'lucide-react'

interface PanelPronosticosProps {
  data: number[][];
  onChange: (data: number[][]) => void;
}

export default function PanelPronosticos({ data, onChange }: PanelPronosticosProps) {
  const safeData = data ?? [];

  const handleChange = (fila: number, col: number, value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num)) return;
    const newData = safeData.map((row: any, i: number) =>
      i === fila ? (row ?? []).map((cell: any, j: number) => (j === col ? num : cell)) : (row ?? [])
    );
    onChange?.(newData);
  };

  const getCellStyle = (value: number) => {
    if (value < 1 || value > 43) return 'border-border bg-background';
    return 'border-primary/30 bg-primary/5 text-primary font-semibold';
  };

  return (
    <div className="rounded-xl p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-md)', background: 'hsl(var(--card))' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Dices className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight text-card-foreground">Pronósticos</h2>
          <p className="text-xs text-muted-foreground">5 filas × 5 números (1-43)</p>
        </div>
      </div>
      <div className="space-y-2">
        {safeData.map((fila: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">F{i + 1}</span>
            {(fila ?? []).map((val: number, j: number) => (
              <input
                key={j}
                type="number"
                min={1}
                max={43}
                value={val || ''}
                onChange={(e: any) => handleChange(i, j, e?.target?.value ?? '')}
                placeholder="--"
                className={`w-12 sm:w-14 h-10 text-center text-sm font-mono rounded-lg border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ${getCellStyle(val)} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
