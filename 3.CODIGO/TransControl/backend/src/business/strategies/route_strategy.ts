// ==========================================
// INTERFAZ STRATEGY
// ==========================================
export interface RouteStrategy {
  calcularRuta(origen: string, destino: string): any;
}

// ==========================================
// ESTRATEGIAS CONCRETAS
// ==========================================

export class RutaMasRapidaStrategy implements RouteStrategy {
  calcularRuta(origen: string, destino: string) {
    console.log(`Calculando la ruta MÁS RÁPIDA de ${origen} a ${destino}`);
    // Simulación de cálculo
    return {
      criterio: 'Rápida',
      tiempoEstimado: '4 horas',
      distancia: '350 km',
      peajes: 3,
      camino: `${origen} -> Autopista Principal -> ${destino}`
    };
  }
}

export class RutaMasSeguraStrategy implements RouteStrategy {
  calcularRuta(origen: string, destino: string) {
    console.log(`Calculando la ruta MÁS SEGURA de ${origen} a ${destino}`);
    // Simulación de cálculo
    return {
      criterio: 'Segura',
      tiempoEstimado: '5.5 horas',
      distancia: '400 km',
      peajes: 5,
      camino: `${origen} -> Vía Troncal Vigilada -> Destacamento Policial -> ${destino}`
    };
  }
}

export class RutaMenorDistanciaStrategy implements RouteStrategy {
  calcularRuta(origen: string, destino: string) {
    console.log(`Calculando la ruta de MENOR DISTANCIA de ${origen} a ${destino}`);
    // Simulación de cálculo
    return {
      criterio: 'Corta',
      tiempoEstimado: '4.5 horas',
      distancia: '280 km',
      peajes: 1,
      camino: `${origen} -> Carretera Secundaria Antigua -> ${destino}`
    };
  }
}

// ==========================================
// CONTEXTO
// ==========================================

export class RutaCalculadora {
  private estrategia: RouteStrategy;

  constructor(estrategia: RouteStrategy) {
    this.estrategia = estrategia;
  }

  setEstrategia(estrategia: RouteStrategy) {
    this.estrategia = estrategia;
  }

  ejecutarCalculo(origen: string, destino: string) {
    return this.estrategia.calcularRuta(origen, destino);
  }
}
