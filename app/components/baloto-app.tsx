'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Zap, RotateCcw, Info } from 'lucide-react'
import PanelPronosticos from './panel-pronosticos'
import PanelSorteos from './panel-sorteos'
import PanelResultados from './panel-resultados'
import { analizarProbabilistico, type ResultadoAnalisis, type TipoJuego } from '@/lib/analisis-probabilistico'
import { toast } from 'sonner'

const INITIAL_PRONOSTICOS = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0));
const INITIAL_SORTEOS = Array.from({ length: 5 }, () => ({
  regulares: Array.from({ length: 5 }, () => 0),
  superbalota: 0,
}));

const JUEGO_CONFIG: Record<TipoJuego, { nombre: string; maxRegular: number; usaSuperbalota: boolean }> = {
  miloto: { nombre: 'MiLoto', maxRegular: 39, usaSuperbalota: false },
  baloto: { nombre: 'Baloto', maxRegular: 43, usaSuperbalota: true },
};

export default function BalotoApp() {
  const [juego, setJuego] = useState<TipoJuego>('baloto');
  const [pronosticos, setPronosticos] = useState<number[][]>(INITIAL_PRONOSTICOS);
  const [sorteos, setSorteos] = useState<{ regulares: number[]; superbalota: number }[]>(INITIAL_SORTEOS);
  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const config = useMemo(() => JUEGO_CONFIG[juego], [juego]);

  const validarDatos = useCallback((): boolean => {
    const sorteosConDatos = (sorteos ?? []).filter((s: any) => {
      const regs = s?.regulares ?? [];
      if (regs.some((n: number) => n >= 1 && n <= config.maxRegular)) return true;
      if (config.usaSuperbalota && s?.superbalota >= 1 && s?.superbalota <= 16) return true;
      return false;
    });

    if (sorteosConDatos.length === 0) {
      toast.error('Ingresa al menos un sorteo con datos válidos');
      return false;
    }

    for (let i = 0; i < (sorteos?.length ?? 0); i++) {
      const s = sorteos?.[i];
      const regs = s?.regulares ?? [];
      for (let j = 0; j < regs.length; j++) {
        const n = regs[j] ?? 0;
        if (n !== 0 && (n < 1 || n > config.maxRegular)) {
          toast.error(`Sorteo ${i + 1}, número ${j + 1}: debe estar entre 1 y ${config.maxRegular}`);
          return false;
        }
      }
      if (config.usaSuperbalota) {
        const sb = s?.superbalota ?? 0;
        if (sb !== 0 && (sb < 1 || sb > 16)) {
          toast.error(`Sorteo ${i + 1}: la Superbalota debe estar entre 1 y 16`);
          return false;
        }
      }
    }

    for (let i = 0; i < (pronosticos?.length ?? 0); i++) {
      const fila = pronosticos?.[i] ?? [];
      for (let j = 0; j < fila.length; j++) {
        const n = fila[j] ?? 0;
        if (n !== 0 && (n < 1 || n > config.maxRegular)) {
          toast.error(`Pronóstico fila ${i + 1}, columna ${j + 1}: debe estar entre 1 y ${config.maxRegular}`);
          return false;
        }
      }
    }

    return true;
  }, [sorteos, pronosticos, config]);

  const handleAnalizar = useCallback(() => {
    if (!validarDatos()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const res = analizarProbabilistico(pronosticos ?? [], sorteos ?? [], juego);
        setResultado(res);
        toast.success('Análisis completado');
      } catch (err: any) {
        console.error('Error en análisis:', err);
        toast.error('Error al analizar los datos');
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);
  }, [pronosticos, sorteos, juego, validarDatos]);

  const handleLimpiar = useCallback(() => {
    setPronosticos(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0)));
    setSorteos(Array.from({ length: 5 }, () => ({
      regulares: Array.from({ length: 5 }, () => 0),
      superbalota: 0,
    })));
    setResultado(null);
    toast.info('Datos limpiados');
  }, []);

  const handleCambiarJuego = useCallback((nuevoJuego: TipoJuego) => {
    setJuego(nuevoJuego);
    setResultado(null);
    toast.info(`Modo ${JUEGO_CONFIG[nuevoJuego].nombre} activado`);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl font-display font-bold tracking-tight text-foreground">
              {config.nombre} <span className="text-primary">Analyzer</span>
            </h1>
          </div>
          <button
            onClick={handleLimpiar}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors duration-150"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-6 sm:py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10"
        >
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">
            Análisis por <strong>5 bloques verticales</strong> comparando pronósticos vs últimos sorteos.
            Modo actual: <strong>{config.nombre}</strong> ({config.maxRegular} números
            {config.usaSuperbalota ? ' + Superbalota' : ''}).
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{ boxShadow: 'var(--shadow-sm)', background: 'hsl(var(--card))' }}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Tipo de juego</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(JUEGO_CONFIG) as TipoJuego[]).map((key) => {
              const activo = juego === key;
              return (
                <button
                  key={key}
                  onClick={() => handleCambiarJuego(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activo
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {JUEGO_CONFIG[key].nombre}
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <PanelPronosticos
              data={pronosticos}
              onChange={setPronosticos}
              maxRegular={config.maxRegular}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <PanelSorteos
              data={sorteos}
              onChange={setSorteos}
              maxRegular={config.maxRegular}
              showSuperbalota={config.usaSuperbalota}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <button
            onClick={handleAnalizar}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-base hover:opacity-90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analizar
              </>
            )}
          </button>
        </motion.div>

        <PanelResultados resultado={resultado} />
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-[1200px] mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            {config.nombre} Analyzer — Herramienta de análisis probabilístico local. No garantiza resultados.
          </p>
        </div>
      </footer>
    </div>
  );
}
