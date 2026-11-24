export type ToolCategory = 'Eléctrica' | 'Manual' | 'Jardinería' | 'Medición' | 'Pintura';

/**
 * Estados de la entidad Herramienta según las máquinas de estados de la Práctica 2
 * y los diagramas de secuencia (REQ002, REQ005, REQ007).
 */
export type EstadoHerramienta = 'disponible' | 'presentada' | 'pausada';
export type ToolStatus = EstadoHerramienta;

export type RequestStatus = 'Pendiente' | 'Aceptada' | 'Rechazada';

export type LoanStatus = 'Activo' | 'PendienteInspeccion' | 'Finalizado';

export type ExtensionStatus = 'Pendiente' | 'Autorizada' | 'Denegada';

export type IncidentSeverity = 'Leve' | 'Moderada' | 'Grave';

export type IncidentStatus = 'Abierta' | 'Resuelta';

export type AppTheme = 'light' | 'dark' | 'system';

export type AppAccent = 'amber' | 'emerald' | 'blue' | 'rose';

export type ActiveView =
  | 'buscar'
  | 'mis-herramientas'
  | 'publicar'
  | 'solicitudes'
  | 'incidencias'
  | 'configuracion';

export interface VecinoData {
  idVecino: number;
  nombre: string;
  email: string;
  contrasena: string;
  direccion: string;
  telefono: string;
  verificado: boolean;
  fechaRegistro: string;
}

export interface HerramientaSpecs {
  marca: string;
  modelo: string;
  potenciaOCapacidad: string;
  peso: string;
  valorReposicion: number;
}

export interface HerramientaData {
  idHerramienta: number;
  idPropietario: number;
  titulo: string;
  descripcion: string;
  foto: string;
  condiciones: string;
  disponibilidad: string;
  precio: number;
  fianza: number;
  estado: EstadoHerramienta;
  tipo: ToolCategory;
  specs: HerramientaSpecs;
  fechaPublicacion: string;
}

export interface SolicitudData {
  idSolicitud: number;
  idHerramienta: number;
  idVecinoSolicitante: number;
  fechaSolicitud: string;
  fechaInicio: string;
  fechaFin: string;
  franjaRecogida: string;
  mensaje: string;
  estado: RequestStatus;
  motivoRechazo: string;
  datosEntrega?: string;
}

export interface PrestamoData {
  idPrestamo: number;
  idSolicitud: number;
  idHerramienta: number;
  idPrestatario: number;
  fechaInicio: string;
  fechaFin: string;
  franjaRecogida: string;
  estado: LoanStatus;
  observaciones: string;
  costeTotal: number;
  fianzaRetenida: number;
  codigoEntrega: string;
  datosEntrega?: string;
  notificadoDevolucion?: boolean;
  fechaDevolucionReal?: string;
}

export interface SolicitudAmpliacionData {
  idAmpliacion: number;
  idPrestamo: number;
  nuevaFechaFin: string;
  motivo: string;
  estado: ExtensionStatus;
  fechaCreacion: string;
}

export interface IncidenciaData {
  idIncidencia: number;
  idPrestamo: number;
  idHerramienta: number;
  idReportante: number;
  gravedad: IncidentSeverity;
  descripcion: string;
  fecha: string;
  estado: IncidentStatus;
  resolucion: string;
}

export interface ResenaData {
  idResena: number;
  idPrestamo: number;
  idHerramienta: number;
  autor: string;
  idAutor: number;
  puntuacion: number;
  comentario: string;
  fecha: string;
}

export interface CorreoConfirmacion {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  fechaEnvio: string;
  confirmacionEnviada: boolean;
}

export interface AppDatabase {
  vecinos: VecinoData[];
  herramientas: HerramientaData[];
  solicitudes: SolicitudData[];
  prestamos: PrestamoData[];
  ampliaciones: SolicitudAmpliacionData[];
  incidencias: IncidenciaData[];
  resenas: ResenaData[];
  favoritos: Record<number, number[]>;
}
