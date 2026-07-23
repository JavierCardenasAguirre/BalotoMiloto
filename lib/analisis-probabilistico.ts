export type TipoJuego = 'miloto' | 'baloto';

export interface SorteoInput {
  regulares: number[];
  superbalota?: number;
}

export interface ResultadoAnalisis {
  juego: TipoJuego;
  recomendaciones: number[][];
  superbalotas: number[];
  numerosNoSalieron: number[];
  superbalotasNoSalieron: number[];
  numerosInvertidos: number[];
  frecuenciaRegulares: Record<number, number>;
  frecuenciaSuperbalota: Record<number, number>;
}

const CONFIG_JUEGO: Record<TipoJuego, { maxRegular: number; usaSuperbalota: boolean }> = {
  miloto: { maxRegular: 39, usaSuperbalota: false },
  baloto: { maxRegular: 43, usaSuperbalota: true },
};

function invertirNumero(n: number, maxRegular: number): number | null {
  const str = n.toString().padStart(2, '0');
  const invertido = parseInt(str.split('').reverse().join(''), 10);
  if (invertido === n) return null;
  if (invertido < 1 || invertido > maxRegular) return null;
  return invertido;
}

function matrizRegularesDesdeSorteos(sorteos: SorteoInput[]): number[][] {
  return (sorteos ?? []).map((s) => s?.regulares ?? [0, 0, 0, 0, 0]);
}

function obtenerBloquesVerticales(matriz: number[][]): number[][] {
  const filas = 5;
  const cols = 5;
  const bloques: number[][] = [];

  for (let c = 0; c < cols; c++) {
    const bloque: number[] = [];
    for (let f = 0; f < filas; f++) {
      bloque.push(matriz?.[f]?.[c] ?? 0);
    }
    bloques.push(bloque);
  }

  return bloques;
}

function uniqueValidInOrder(values: number[], min: number, max: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const n of values ?? []) {
    if (n < min || n > max) continue;
    if (seen.has(n)) continue;
    out.push(n);
    seen.add(n);
  }
  return out;
}

function pickDistinct(candidates: number[], used: Set<number>, avoid: Set<number> = new Set()): number | null {
  for (const n of candidates ?? []) {
    if (!used.has(n) && !avoid.has(n)) {
      used.add(n);
      return n;
    }
  }
  return null;
}

export function analizarProbabilistico(
  pronosticos: number[][],
  sorteos: SorteoInput[],
  juego: TipoJuego
): ResultadoAnalisis {
  const config = CONFIG_JUEGO[juego];
  const maxRegular = config.maxRegular;

  const safePronosticos = pronosticos ?? [];
  const safeSorteos = sorteos ?? [];

  const frecuenciaRegulares: Record<number, number> = {};
  for (let i = 1; i <= maxRegular; i++) frecuenciaRegulares[i] = 0;

  const frecuenciaSuperbalota: Record<number, number> = {};
  for (let i = 1; i <= 16; i++) frecuenciaSuperbalota[i] = 0;

  const numerosQueHanSalido = new Set<number>();
  const superbalotasQueHanSalido = new Set<number>();

  for (const s of safeSorteos) {
    for (const n of s?.regulares ?? []) {
      if (n >= 1 && n <= maxRegular) {
        numerosQueHanSalido.add(n);
        frecuenciaRegulares[n] = (frecuenciaRegulares[n] ?? 0) + 1;
      }
    }

    if (config.usaSuperbalota) {
      const sb = s?.superbalota ?? 0;
      if (sb >= 1 && sb <= 16) {
        superbalotasQueHanSalido.add(sb);
        frecuenciaSuperbalota[sb] = (frecuenciaSuperbalota[sb] ?? 0) + 1;
      }
    }
  }

  const numerosNoSalieron: number[] = [];
  for (let i = 1; i <= maxRegular; i++) {
    if (!numerosQueHanSalido.has(i)) numerosNoSalieron.push(i);
  }

  const superbalotasNoSalieron: number[] = [];
  if (config.usaSuperbalota) {
    for (let i = 1; i <= 16; i++) {
      if (!superbalotasQueHanSalido.has(i)) superbalotasNoSalieron.push(i);
    }
  }

  const numerosInvertidos: number[] = [];
  for (const n of Array.from(numerosQueHanSalido)) {
    const inv = invertirNumero(n, maxRegular);
    if (inv !== null && !numerosQueHanSalido.has(inv)) {
      numerosInvertidos.push(inv);
    }
  }

  const pronBloques = obtenerBloquesVerticales(safePronosticos);
  const sorteoBloques = obtenerBloquesVerticales(matrizRegularesDesdeSorteos(safeSorteos));

  const poolGeneral = Array.from({ length: maxRegular }, (_, idx) => idx + 1)
    .sort((a, b) => {
      const fa = frecuenciaRegulares[a] ?? 0;
      const fb = frecuenciaRegulares[b] ?? 0;
      if (fa !== fb) return fa - fb;
      return a - b;
    });

  const recomendaciones: number[][] = [[], []];
  const usadosJugada1 = new Set<number>();
  const usadosJugada2 = new Set<number>();

  for (let bloque = 0; bloque < 5; bloque++) {
    const pronVals = uniqueValidInOrder(pronBloques?.[bloque] ?? [], 1, maxRegular);
    const sortVals = new Set(uniqueValidInOrder(sorteoBloques?.[bloque] ?? [], 1, maxRegular));

    // Regla solicitada: candidato = número del pronóstico del bloque que NO ha caído
    // en el bloque equivalente de los últimos 5 sorteos.
    const candidatosBloque = pronVals.filter((n) => !sortVals.has(n));

    // Fallback robusto: completar desde números menos frecuentes que tampoco estén en ese bloque de sorteos.
    const fallbackBloque = poolGeneral.filter((n) => !sortVals.has(n));

    const opcionesBloque = [...candidatosBloque, ...fallbackBloque];

    const c1 = pickDistinct(opcionesBloque, usadosJugada1);
    const c2 = pickDistinct(opcionesBloque, usadosJugada2, new Set(c1 !== null ? [c1] : []));

    recomendaciones[0].push(c1 ?? 0);
    recomendaciones[1].push(c2 ?? 0);
  }

  // Superbalota (solo Baloto): retroceso bloque 5 -> 4 -> 3 -> 2 -> 1
  const superbalotas: number[] = [];
  if (config.usaSuperbalota) {
    const retroceso: number[] = [];
    const seenRetroceso = new Set<number>();

    for (let bloque = 4; bloque >= 0; bloque--) {
      const valsBloque = pronBloques?.[bloque] ?? [];
      for (const n of valsBloque) {
        if (n >= 1 && n <= 16 && !seenRetroceso.has(n)) {
          retroceso.push(n);
          seenRetroceso.add(n);
        }
      }
    }

    // Prioridad 1: números hallados en retroceso que NO hayan salido en SB de los últimos sorteos.
    const prioridadRetroceso = retroceso.filter((n) => !superbalotasQueHanSalido.has(n));

    // Prioridad 2: cualquier SB no salida del 1 al 16.
    const prioridadNoSalidas = superbalotasNoSalieron.filter((n) => !prioridadRetroceso.includes(n));

    // Prioridad 3: menor frecuencia histórica de SB.
    const porFrecuencia = Array.from({ length: 16 }, (_, idx) => idx + 1)
      .filter((n) => !prioridadRetroceso.includes(n) && !prioridadNoSalidas.includes(n))
      .sort((a, b) => {
        const fa = frecuenciaSuperbalota[a] ?? 0;
        const fb = frecuenciaSuperbalota[b] ?? 0;
        if (fa !== fb) return fa - fb;
        return a - b;
      });

    const usadosSB = new Set<number>();
    const sb1 = pickDistinct([...prioridadRetroceso, ...prioridadNoSalidas, ...porFrecuencia], usadosSB);
    const sb2 = pickDistinct([...prioridadRetroceso, ...prioridadNoSalidas, ...porFrecuencia], usadosSB);

    if (sb1 !== null) superbalotas.push(sb1);
    if (sb2 !== null) superbalotas.push(sb2);
  }

  return {
    juego,
    recomendaciones,
    superbalotas,
    numerosNoSalieron,
    superbalotasNoSalieron,
    numerosInvertidos,
    frecuenciaRegulares,
    frecuenciaSuperbalota,
  };
}
