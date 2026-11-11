export type Avistamiento = {
  id: string;
  perroId: string;
  entrenadorId: string | null;
  nombrePerro: string;
  apodo: string;
  fotoUrl: string;
  latitud: number;
  longitud: number;
  creadoEn: string;
};
