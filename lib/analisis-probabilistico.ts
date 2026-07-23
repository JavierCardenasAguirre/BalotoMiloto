export interface ResultadoAnalisis {
  recomendaciones: number[][];
  superbalotas: number[];
  numerosNoSalieron: number[];
  superbalotasNoSalieron: number[];
  numerosInvertidos: number[];
  frecuenciaRegulares: Record<number, number>;
  frecuenciaSuperbalota: Record<number, number>;
}

function invertirNumero(n: number): number | null {
  const str = n.toString().padStart(2, '0');
  const invertido = parseInt(str.split('').reverse().join(''), 10);
  if (invertido === n) return null;
  if (invertido < 1 || invertido > 43) return null;
  return invertido;
}

export function analizarBaloto(
  pronosticos: number[][],
  sorteos: { regulares: number[]; superbalota: number }[]
): ResultadoAnalisis {
  const safePronosticos = pronosticos ?? [];
  const safeSorteos = sorteos ?? [];

  // Recopilar todos los números que salieron en sorteos
  const numerosQueHanSalido = new Set<number>();
  const superbalotasQueHanSalido = new Set<number>();
  const frecuenciaRegulares: Record<number, number> = {};
  const frecuenciaSuperbalota: Record<number, number> = {};

  // Inicializar frecuencias
  for (let i = 1; i <= 43; i++) frecuenciaRegulares[i] = 0;
  for (let i = 1; i <= 16; i++) frecuenciaSuperbalota[i] = 0;

  for (const sorteo of safeSorteos) {
    const regs = sorteo?.regulares ?? [];
    for (const num of regs) {
      if (num >= 1 && num <= 43) {
        numerosQueHanSalido.add(num);
        frecuenciaRegulares[num] = (frecuenciaRegulares[num] ?? 0) + 1;
      }
    }
    const sb = sorteo?.superbalota;
    if (sb && sb >= 1 && sb <= 16) {
      superbalotasQueHanSalido.add(sb);
      frecuenciaSuperbalota[sb] = (frecuenciaSuperbalota[sb] ?? 0) + 1;
    }
  }

  // Números que NO han salido (1-43)
  const numerosNoSalieron: number[] = [];
  for (let i = 1; i <= 43; i++) {
    if (!numerosQueHanSalido.has(i)) {
      numerosNoSalieron.push(i);
    }
  }

  // Superbalotas que NO han salido (1-16)
  const superbalotasNoSalieron: number[] = [];
  for (let i = 1; i <= 16; i++) {
    if (!superbalotasQueHanSalido.has(i)) {
      superbalotasNoSalieron.push(i);
    }
  }

  // Números invertidos: si salió X pero su invertido no salió, el invertido es probabilístico
  const numerosInvertidos: number[] = [];
  for (const num of Array.from(numerosQueHanSalido)) {
    const invertido = invertirNumero(num);
    if (invertido !== null && !numerosQueHanSalido.has(invertido)) {
      numerosInvertidos.push(invertido);
    }
  }

  // Recopilar pronósticos válidos del usuario
  const numerosPronostico = new Set<number>();
  for (const fila of safePronosticos) {
    for (const num of (fila ?? [])) {
      if (num >= 1 && num <= 43) {
        numerosPronostico.add(num);
      }
    }
  }

  // Priorizar: números del pronóstico que no han salido + invertidos
  const candidatosPrioritarios: number[] = [];
  for (const num of Array.from(numerosPronostico)) {
    if (!numerosQueHanSalido.has(num)) {
      candidatosPrioritarios.push(num);
    }
  }

  // Construir pool de candidatos con prioridad:
  // 1. Números del pronóstico que no salieron
  // 2. Números invertidos de los que sí salieron
  // 3. Resto de números que no salieron
  const poolOrdenado: number[] = [];
  const yaUsados = new Set<number>();

  // Agregar candidatos prioritarios
  for (const n of candidatosPrioritarios) {
    if (!yaUsados.has(n)) {
      poolOrdenado.push(n);
      yaUsados.add(n);
    }
  }

  // Agregar invertidos
  for (const n of numerosInvertidos) {
    if (!yaUsados.has(n)) {
      poolOrdenado.push(n);
      yaUsados.add(n);
    }
  }

  // Agregar resto de no salidos
  for (const n of numerosNoSalieron) {
    if (!yaUsados.has(n)) {
      poolOrdenado.push(n);
      yaUsados.add(n);
    }
  }

  // Generar 2 filas de 5 números regulares
  const recomendaciones: number[][] = [];
  for (let fila = 0; fila < 2; fila++) {
    const inicio = fila * 5;
    const nums = poolOrdenado.slice(inicio, inicio + 5);
    // Si no hay suficientes, completar con números de menor frecuencia
    if (nums.length < 5) {
      const ordenadosPorFrecuencia = Object.entries(frecuenciaRegulares)
        .map(([k, v]) => ({ num: parseInt(k), freq: v }))
        .filter((x: any) => !yaUsados.has(x?.num))
        .sort((a: any, b: any) => (a?.freq ?? 0) - (b?.freq ?? 0));
      for (const item of ordenadosPorFrecuencia) {
        if (nums.length >= 5) break;
        nums.push(item?.num);
        yaUsados.add(item?.num);
      }
    }
    recomendaciones.push(nums.sort((a: number, b: number) => a - b));
  }

  // Superbalotas recomendadas: las que no salieron, o las de menor frecuencia
  const superbalotas: number[] = [];
  if (superbalotasNoSalieron.length >= 2) {
    superbalotas.push(superbalotasNoSalieron[0] ?? 1, superbalotasNoSalieron[1] ?? 2);
  } else if (superbalotasNoSalieron.length === 1) {
    superbalotas.push(superbalotasNoSalieron[0] ?? 1);
    // Buscar la de menor frecuencia que no esté ya
    const menosFrecuente = Object.entries(frecuenciaSuperbalota)
      .map(([k, v]) => ({ num: parseInt(k), freq: v }))
      .filter((x: any) => x?.num !== superbalotasNoSalieron[0])
      .sort((a: any, b: any) => (a?.freq ?? 0) - (b?.freq ?? 0));
    superbalotas.push(menosFrecuente?.[0]?.num ?? 1);
  } else {
    const ordenadas = Object.entries(frecuenciaSuperbalota)
      .map(([k, v]) => ({ num: parseInt(k), freq: v }))
      .sort((a: any, b: any) => (a?.freq ?? 0) - (b?.freq ?? 0));
    superbalotas.push(ordenadas?.[0]?.num ?? 1, ordenadas?.[1]?.num ?? 2);
  }

  return {
    recomendaciones,
    superbalotas,
    numerosNoSalieron,
    superbalotasNoSalieron,
    numerosInvertidos,
    frecuenciaRegulares,
    frecuenciaSuperbalota,
  };
}
