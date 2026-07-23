'use client'

import { Sparkles, TrendingUp, ArrowRight, Hash } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ResultadoAnalisis } from '@/lib/analisis-probabilistico'

interface PanelResultadosProps {
  resultado: ResultadoAnalisis | null;
}

export default function PanelResultados({ resultado }: PanelResultadosProps) {
  if (!resultado) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ boxShadow: 'var(--shadow-md)', background: 'hsl(var(--card))' }}>
        <div className="p-3 rounded-full bg-muted inline-flex mb-3">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">Ingresa los datos en los paneles y presiona <strong>"Analizar"</strong> para obtener recomendaciones.</p>
      </div>
    );
  }

  const { juego, recomendaciones, superbalotas, numerosNoSalieron, numerosInvertidos, superbalotasNoSalieron } = resultado ?? {};
  const safeRecs = recomendaciones ?? [];
  const safeSb = superbalotas ?? [];
  const safeNoSalieron = numerosNoSalieron ?? [];
  const safeInvertidos = numerosInvertidos ?? [];
  const safeSbNoSalieron = superbalotasNoSalieron ?? [];
  const esBaloto = juego === 'baloto';

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl p-5 sm:p-6"
        style={{ boxShadow: 'var(--shadow-lg)', background: 'hsl(var(--card))' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-display font-bold tracking-tight text-card-foreground">Recomendaciones por bloques verticales</h2>
        </div>

        <div className="space-y-4">
          {safeRecs.map((fila: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="text-xs font-mono text-muted-foreground w-16 shrink-0 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> Jugada {i + 1}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(fila ?? []).map((num: number, j: number) => (
                  <motion.div
                    key={j}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.15 + j * 0.05 }}
                    className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-mono font-bold"
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                  >
                    {num?.toString?.()?.padStart?.(2, '0') ?? '00'}
                  </motion.div>
                ))}

                {esBaloto && (
                  <>
                    <div className="w-px h-8 bg-border mx-1" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.15 }}
                      className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-mono font-bold"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      {safeSb?.[i]?.toString?.()?.padStart?.(2, '0') ?? '00'}
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl p-5 sm:p-6"
        style={{ boxShadow: 'var(--shadow-md)', background: 'hsl(var(--card))' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <Hash className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-display font-bold tracking-tight text-card-foreground">Estadísticas del Análisis</h2>
        </div>

        <div className={`grid grid-cols-1 ${esBaloto ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
          <div className="rounded-lg p-4 bg-muted/50">
            <p className="text-2xl font-mono font-bold text-primary">{safeNoSalieron?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Números regulares sin salir</p>
          </div>
          <div className="rounded-lg p-4 bg-muted/50">
            <p className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">{safeInvertidos?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Números invertidos detectados</p>
          </div>
          {esBaloto && (
            <div className="rounded-lg p-4 bg-muted/50">
              <p className="text-2xl font-mono font-bold text-red-500">{safeSbNoSalieron?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Superbalotas sin salir</p>
            </div>
          )}
        </div>

        {safeInvertidos.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Números invertidos probabilísticos:</p>
            <p className="text-sm font-mono text-amber-600 dark:text-amber-400">
              {safeInvertidos.map((n: number) => n?.toString?.()?.padStart?.(2, '0') ?? '00').join(', ')}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
