import {
  CorreoConfirmacion,
  EstadoHerramienta,
  ExtensionStatus,
  HerramientaData,
  HerramientaSpecs,
  IncidenciaData,
  IncidentSeverity,
  IncidentStatus,
  LoanStatus,
  PrestamoData,
  RequestStatus,
  ResenaData,
  SolicitudAmpliacionData,
  SolicitudData,
  ToolCategory,
  VecinoData,
} from './types';

/**
 * <<entity>> Usuario (REQ002)
 */
export class Usuario {
  idVecino: number;
  nombre: string;
  email: string;
  contrasena: string;
  direccion: string;
  telefono: string;
  verificado: boolean;
  fechaRegistro: string;

  constructor(data: VecinoData) {
    this.idVecino = data.idVecino;
    this.nombre = data.nombre;
    this.email = data.email;
    this.contrasena = data.contrasena;
    this.direccion = data.direccion;
    this.telefono = data.telefono;
    this.verificado = data.verificado;
    this.fechaRegistro = data.fechaRegistro;
  }

  /**
   * REQ002: validarCredenciales(usuario, contraseña)
   */
  static validarCredenciales(
    usuarios: VecinoData[],
    usuario: string,
    contrasena: string
  ): { valido: boolean; usuario?: VecinoData } {
    const cleanUser = usuario.trim().toLowerCase();
    const cleanPass = contrasena.trim();
    if (!cleanUser || !cleanPass) {
      return { valido: false };
    }
    const found = usuarios.find(
      (u) =>
        (u.email.toLowerCase() === cleanUser || u.nombre.toLowerCase() === cleanUser) &&
        u.contrasena === cleanPass
    );
    return found ? { valido: true, usuario: found } : { valido: false };
  }

  /**
   * REQ002: actualizarDatos(datosUsuario)
   */
  actualizarDatos(datosUsuario: {
    nombre?: string;
    direccion?: string;
    email?: string;
    telefono?: string;
  }): VecinoData {
    if (datosUsuario.nombre !== undefined) this.nombre = datosUsuario.nombre.trim();
    if (datosUsuario.direccion !== undefined) this.direccion = datosUsuario.direccion.trim();
    if (datosUsuario.email !== undefined) this.email = datosUsuario.email.trim();
    if (datosUsuario.telefono !== undefined) this.telefono = datosUsuario.telefono.trim();
    return this.toData();
  }

  toData(): VecinoData {
    return {
      idVecino: this.idVecino,
      nombre: this.nombre,
      email: this.email,
      contrasena: this.contrasena,
      direccion: this.direccion,
      telefono: this.telefono,
      verificado: this.verificado,
      fechaRegistro: this.fechaRegistro,
    };
  }
}

/**
 * <<entity>> Vecino / NuevoVecino (REQ001)
 */
export class Vecino extends Usuario {
  static crear(datos: {
    nombre: string;
    email: string;
    contrasena: string;
    direccion: string;
    telefono: string;
  }): NuevoVecino {
    return new NuevoVecino({
      idVecino: Date.now(),
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      contrasena: datos.contrasena,
      direccion: datos.direccion.trim(),
      telefono: datos.telefono.trim() || 'Sin teléfono público',
      verificado: true,
      fechaRegistro: new Date().toISOString().split('T')[0],
    });
  }
}

export class NuevoVecino extends Vecino {}

/**
 * <<system>> ServicioCorreo (REQ001)
 */
export class ServicioCorreo {
  static enviarCorreoConfirmacion(email: string, nombreVecino?: string): CorreoConfirmacion {
    return {
      destinatario: email.trim(),
      asunto: 'Bienvenido a PrestaHerramienta · Cuenta vecinal confirmada',
      cuerpo: `Hola${nombreVecino ? ` ${nombreVecino}` : ''}, tu cuenta en Residencial Los Olivos ha sido validada correctamente.`,
      fechaEnvio: new Date().toISOString(),
      confirmacionEnviada: true,
    };
  }
}

/**
 * <<entity>> Herramienta (REQ002, REQ003, REQ005, REQ006, REQ007)
 */
export class Herramienta {
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

  constructor(data: HerramientaData) {
    this.idHerramienta = data.idHerramienta;
    this.idPropietario = data.idPropietario;
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.foto = data.foto;
    this.condiciones = data.condiciones;
    this.disponibilidad = data.disponibilidad;
    this.precio = data.precio;
    this.fianza = data.fianza;
    this.estado = data.estado;
    this.tipo = data.tipo;
    this.specs = data.specs;
    this.fechaPublicacion = data.fechaPublicacion;
  }

  /**
   * REQ002: crear()
   */
  static crear(idPropietario: number, defaultFoto = ''): Herramienta {
    return new Herramienta({
      idHerramienta: Date.now(),
      idPropietario,
      titulo: '',
      descripcion: '',
      foto: defaultFoto,
      condiciones: 'Devolver limpia, revisada y con todos sus accesorios.',
      disponibilidad: '',
      precio: 0,
      fianza: 0,
      estado: 'pausada',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Genérica',
        modelo: 'Estándar',
        potenciaOCapacidad: 'Uso doméstico',
        peso: '2,0 kg',
        valorReposicion: 100,
      },
      fechaPublicacion: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * REQ002: establecerDatosYFoto(datos, foto)
   */
  establecerDatosYFoto(
    datos: {
      titulo: string;
      descripcion: string;
      tipo: ToolCategory;
      condiciones: string;
      disponibilidad: string;
      specs?: Partial<HerramientaSpecs>;
    },
    foto: string
  ): boolean {
    this.titulo = datos.titulo.trim();
    this.descripcion = datos.descripcion.trim();
    this.tipo = datos.tipo;
    this.condiciones = datos.condiciones.trim();
    this.disponibilidad = datos.disponibilidad.trim();
    if (foto.trim()) {
      this.foto = foto.trim();
    }
    if (datos.specs) {
      this.specs = {
        ...this.specs,
        ...datos.specs,
      };
    }
    return true;
  }

  /**
   * REQ002: publicar() -> transiciona el estado de la herramienta a 'disponible'
   */
  publicar(): EstadoHerramienta {
    this.estado = 'disponible';
    this.fechaPublicacion = new Date().toISOString().split('T')[0];
    return this.estado;
  }

  /**
   * REQ002: establecerPrecio(precio, fianza?)
   */
  establecerPrecio(precio: number, fianza?: number): boolean {
    this.precio = Number(precio);
    if (typeof fianza === 'number' && !Number.isNaN(fianza)) {
      this.fianza = Number(fianza);
    }
    return true;
  }

  /**
   * REQ005 / REQ007: cambiarEstado(nuevoEstado) — ej. 'disponible' | 'presentada' | 'pausada'
   */
  cambiarEstado(nuevoEstado: EstadoHerramienta): EstadoHerramienta {
    this.estado = nuevoEstado;
    return this.estado;
  }

  /**
   * REQ003: obtenerDatos()
   */
  obtenerDatos(): HerramientaData {
    return this.toData();
  }

  /**
   * REQ003: cumpleCriterio(criterio, tipo, ...)
   */
  cumpleCriterio(filtros: {
    criterio?: string;
    tipo?: '' | ToolCategory;
    estado?: '' | 'disponible' | 'presentada';
    precio?: '' | 'gratis' | 'hasta3' | 'mas3';
    sinFianza?: boolean;
    portal?: '' | 'Portal 1' | 'Portal 2' | 'Portal 3';
    propietarioNombre?: string;
    propietarioDireccion?: string;
    soloFavoritos?: boolean;
    favoritosIds?: number[];
  }): boolean {
    if (this.estado === 'pausada') return false;

    const q = (filtros.criterio || '').trim().toLowerCase();
    const matchesText =
      !q ||
      this.titulo.toLowerCase().includes(q) ||
      this.descripcion.toLowerCase().includes(q) ||
      this.specs.marca.toLowerCase().includes(q) ||
      this.specs.modelo.toLowerCase().includes(q) ||
      (filtros.propietarioNombre?.toLowerCase().includes(q) ?? false);

    const matchesTipo = !filtros.tipo || this.tipo === filtros.tipo;
    const matchesEstado = !filtros.estado || this.estado === filtros.estado;

    const matchesPrecio =
      !filtros.precio ||
      (filtros.precio === 'gratis' && this.precio === 0) ||
      (filtros.precio === 'hasta3' && this.precio > 0 && this.precio <= 3) ||
      (filtros.precio === 'mas3' && this.precio > 3);

    const matchesFianza = !filtros.sinFianza || this.fianza === 0;
    const matchesPortal =
      !filtros.portal || (filtros.propietarioDireccion?.includes(filtros.portal) ?? false);
    const matchesFav =
      !filtros.soloFavoritos || (filtros.favoritosIds?.includes(this.idHerramienta) ?? false);

    return (
      matchesText &&
      matchesTipo &&
      matchesEstado &&
      matchesPrecio &&
      matchesFianza &&
      matchesPortal &&
      matchesFav
    );
  }

  /**
   * REQ003: obtenerDetalle()
   */
  obtenerDetalle(): HerramientaData {
    return this.toData();
  }

  /**
   * REQ006: comprobar(fecha) — comprueba si no existe solape con préstamos activos para ampliar plazo
   */
  comprobar(
    nuevaFechaFin: string,
    prestamoActual: PrestamoData,
    prestamos: PrestamoData[]
  ): { disponible: boolean; motivo?: string } {
    if (!nuevaFechaFin || nuevaFechaFin <= prestamoActual.fechaFin) {
      return {
        disponible: false,
        motivo: 'La nueva fecha de devolución debe ser posterior a la actual.',
      };
    }
    const solapa = prestamos.some(
      (p) =>
        p.idPrestamo !== prestamoActual.idPrestamo &&
        p.idHerramienta === this.idHerramienta &&
        p.estado !== 'Finalizado' &&
        p.fechaInicio <= nuevaFechaFin &&
        p.fechaFin >= prestamoActual.fechaInicio
    );
    if (solapa) {
      return {
        disponible: false,
        motivo: 'Existe otra reserva programada para la herramienta en esa fecha.',
      };
    }
    return { disponible: true };
  }

  toData(): HerramientaData {
    return {
      idHerramienta: this.idHerramienta,
      idPropietario: this.idPropietario,
      titulo: this.titulo,
      descripcion: this.descripcion,
      foto: this.foto,
      condiciones: this.condiciones,
      disponibilidad: this.disponibilidad,
      precio: this.precio,
      fianza: this.fianza,
      estado: this.estado,
      tipo: this.tipo,
      specs: this.specs,
      fechaPublicacion: this.fechaPublicacion,
    };
  }
}

/**
 * <<entity>> Solicitud (REQ005)
 */
export class Solicitud {
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

  constructor(data: SolicitudData) {
    this.idSolicitud = data.idSolicitud;
    this.idHerramienta = data.idHerramienta;
    this.idVecinoSolicitante = data.idVecinoSolicitante;
    this.fechaSolicitud = data.fechaSolicitud;
    this.fechaInicio = data.fechaInicio;
    this.fechaFin = data.fechaFin;
    this.franjaRecogida = data.franjaRecogida;
    this.mensaje = data.mensaje;
    this.estado = data.estado;
    this.motivoRechazo = data.motivoRechazo;
    this.datosEntrega = data.datosEntrega;
  }

  /**
   * REQ005: obtenerPendientes()
   */
  static obtenerPendientes(
    solicitudes: SolicitudData[],
    herramientas: HerramientaData[],
    idPropietario: number
  ): SolicitudData[] {
    const misIds = herramientas
      .filter((h) => h.idPropietario === idPropietario)
      .map((h) => h.idHerramienta);
    return solicitudes.filter((s) => misIds.includes(s.idHerramienta) && s.estado === 'Pendiente');
  }

  /**
   * REQ005: rechazarSolicitud(motivo)
   */
  rechazarSolicitud(motivo: string): SolicitudData {
    this.estado = 'Rechazada';
    this.motivoRechazo = motivo.trim() || 'No disponible en esas fechas';
    return this.toData();
  }

  /**
   * REQ005: aceptar(datos)
   */
  aceptar(datosEntrega?: string): SolicitudData {
    this.estado = 'Aceptada';
    if (datosEntrega?.trim()) {
      this.datosEntrega = datosEntrega.trim();
    }
    return this.toData();
  }

  toData(): SolicitudData {
    return {
      idSolicitud: this.idSolicitud,
      idHerramienta: this.idHerramienta,
      idVecinoSolicitante: this.idVecinoSolicitante,
      fechaSolicitud: this.fechaSolicitud,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      franjaRecogida: this.franjaRecogida,
      mensaje: this.mensaje,
      estado: this.estado,
      motivoRechazo: this.motivoRechazo,
      datosEntrega: this.datosEntrega,
    };
  }
}

/**
 * <<entity>> Prestamo (REQ004, REQ008)
 */
export class Prestamo {
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

  constructor(data: PrestamoData) {
    this.idPrestamo = data.idPrestamo;
    this.idSolicitud = data.idSolicitud;
    this.idHerramienta = data.idHerramienta;
    this.idPrestatario = data.idPrestatario;
    this.fechaInicio = data.fechaInicio;
    this.fechaFin = data.fechaFin;
    this.franjaRecogida = data.franjaRecogida;
    this.estado = data.estado;
    this.observaciones = data.observaciones;
    this.costeTotal = data.costeTotal;
    this.fianzaRetenida = data.fianzaRetenida;
    this.codigoEntrega = data.codigoEntrega;
    this.datosEntrega = data.datosEntrega;
    this.notificadoDevolucion = data.notificadoDevolucion;
    this.fechaDevolucionReal = data.fechaDevolucionReal;
  }

  /**
   * REQ004: comprobar(fecha)
   */
  static comprobar(
    herramienta: HerramientaData,
    prestamos: PrestamoData[],
    fechaInicio: string,
    fechaFin: string
  ): { disponible: boolean; motivo?: string } {
    if (herramienta.estado !== 'disponible') {
      return {
        disponible: false,
        motivo: 'La herramienta se encuentra presentada actualmente en otro préstamo.',
      };
    }
    if (!fechaInicio || !fechaFin || fechaFin < fechaInicio) {
      return {
        disponible: false,
        motivo: 'La fecha de devolución debe ser igual o posterior a la de recogida.',
      };
    }
    const overlap = prestamos.some(
      (p) =>
        p.idHerramienta === herramienta.idHerramienta &&
        p.estado !== 'Finalizado' &&
        p.fechaInicio <= fechaFin &&
        p.fechaFin >= fechaInicio
    );
    if (overlap) {
      return {
        disponible: false,
        motivo: 'Las fechas seleccionadas coinciden con una reserva activa.',
      };
    }
    return { disponible: true };
  }

  /**
   * REQ008: cargarPrestamosRecibidos() — préstamos donde el vecino actúa como cliente/prestatario
   */
  static cargarPrestamosRecibidos(prestamos: PrestamoData[], idVecino: number): PrestamoData[] {
    return prestamos.filter((p) => p.idPrestatario === idVecino);
  }

  /**
   * REQ008: cargarPrestamosRealizados() — préstamos donde el vecino actúa como propietario
   */
  static cargarPrestamosRealizados(
    prestamos: PrestamoData[],
    herramientas: HerramientaData[],
    idVecino: number
  ): PrestamoData[] {
    const misHerramientas = herramientas
      .filter((h) => h.idPropietario === idVecino)
      .map((h) => h.idHerramienta);
    return prestamos.filter((p) => misHerramientas.includes(p.idHerramienta));
  }

  /**
   * REQ008: buscarPrestamos()
   */
  static buscarPrestamos(
    lista: PrestamoData[],
    herramientas: HerramientaData[],
    vecinos: VecinoData[],
    idVecino: number,
    criterios: { texto?: string; rol?: 'todos' | 'recibidos' | 'realizados'; estado?: '' | LoanStatus }
  ): PrestamoData[] {
    const q = (criterios.texto || '').trim().toLowerCase();
    return lista.filter((p) => {
      const tool = herramientas.find((h) => h.idHerramienta === p.idHerramienta);
      const isRecibido = p.idPrestatario === idVecino;
      const isRealizado = tool?.idPropietario === idVecino;

      if (criterios.rol === 'recibidos' && !isRecibido) return false;
      if (criterios.rol === 'realizados' && !isRealizado) return false;
      if (criterios.estado && p.estado !== criterios.estado) return false;

      if (!q) return true;
      const counterpartId = isRecibido ? tool?.idPropietario : p.idPrestatario;
      const counterpart = vecinos.find((v) => v.idVecino === counterpartId);
      return (
        p.codigoEntrega.toLowerCase().includes(q) ||
        (tool?.titulo.toLowerCase().includes(q) ?? false) ||
        (counterpart?.nombre.toLowerCase().includes(q) ?? false) ||
        p.observaciones.toLowerCase().includes(q)
      );
    });
  }

  /**
   * REQ008: consultarDetalle()
   */
  consultarDetalle(): PrestamoData {
    return {
      idPrestamo: this.idPrestamo,
      idSolicitud: this.idSolicitud,
      idHerramienta: this.idHerramienta,
      idPrestatario: this.idPrestatario,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      franjaRecogida: this.franjaRecogida,
      estado: this.estado,
      observaciones: this.observaciones,
      costeTotal: this.costeTotal,
      fianzaRetenida: this.fianzaRetenida,
      codigoEntrega: this.codigoEntrega,
      datosEntrega: this.datosEntrega,
      notificadoDevolucion: this.notificadoDevolucion,
      fechaDevolucionReal: this.fechaDevolucionReal,
    };
  }
}

/**
 * <<entity>> SolicitudDeAmpliación (REQ006)
 */
export class SolicitudDeAmpliacion {
  idAmpliacion: number;
  idPrestamo: number;
  nuevaFechaFin: string;
  motivo: string;
  estado: ExtensionStatus;
  fechaCreacion: string;

  constructor(data: SolicitudAmpliacionData) {
    this.idAmpliacion = data.idAmpliacion;
    this.idPrestamo = data.idPrestamo;
    this.nuevaFechaFin = data.nuevaFechaFin;
    this.motivo = data.motivo;
    this.estado = data.estado;
    this.fechaCreacion = data.fechaCreacion;
  }

  /**
   * REQ006: guardarMotivo(motivo)
   */
  guardarMotivo(motivo: string): SolicitudAmpliacionData {
    this.motivo = motivo.trim();
    return this.toData();
  }

  /**
   * REQ006: confirmarAmpliación()
   */
  confirmarAmpliacion(): SolicitudAmpliacionData {
    this.estado = 'Autorizada';
    return this.toData();
  }

  confirmarAmpliación(): SolicitudAmpliacionData {
    return this.confirmarAmpliacion();
  }

  toData(): SolicitudAmpliacionData {
    return {
      idAmpliacion: this.idAmpliacion,
      idPrestamo: this.idPrestamo,
      nuevaFechaFin: this.nuevaFechaFin,
      motivo: this.motivo,
      estado: this.estado,
      fechaCreacion: this.fechaCreacion,
    };
  }
}

export { SolicitudDeAmpliacion as SolicitudDeAmpliación };

/**
 * <<entity>> Incidencia (REQ007)
 */
export class Incidencia {
  idIncidencia: number;
  idPrestamo: number;
  idHerramienta: number;
  idReportante: number;
  gravedad: IncidentSeverity;
  descripcion: string;
  fecha: string;
  estado: IncidentStatus;
  resolucion: string;

  constructor(data: IncidenciaData) {
    this.idIncidencia = data.idIncidencia;
    this.idPrestamo = data.idPrestamo;
    this.idHerramienta = data.idHerramienta;
    this.idReportante = data.idReportante;
    this.gravedad = data.gravedad;
    this.descripcion = data.descripcion;
    this.fecha = data.fecha;
    this.estado = data.estado;
    this.resolucion = data.resolucion;
  }

  /**
   * REQ007: CrearIncidencia()
   */
  static CrearIncidencia(datos: {
    idPrestamo: number;
    idHerramienta: number;
    idReportante: number;
    gravedad: IncidentSeverity;
    descripcion: string;
  }): IncidenciaData {
    return new Incidencia({
      idIncidencia: Date.now(),
      idPrestamo: datos.idPrestamo,
      idHerramienta: datos.idHerramienta,
      idReportante: datos.idReportante,
      gravedad: datos.gravedad,
      descripcion: datos.descripcion.trim(),
      fecha: new Date().toISOString().split('T')[0],
      estado: 'Abierta',
      resolucion: '',
    });
  }
}

/**
 * <<entity>> Reseña (REQ007)
 */
export class Resena {
  idResena: number;
  idPrestamo: number;
  idHerramienta: number;
  autor: string;
  idAutor: number;
  puntuacion: number;
  comentario: string;
  fecha: string;

  constructor(data: ResenaData) {
    this.idResena = data.idResena;
    this.idPrestamo = data.idPrestamo;
    this.idHerramienta = data.idHerramienta;
    this.autor = data.autor;
    this.idAutor = data.idAutor;
    this.puntuacion = data.puntuacion;
    this.comentario = data.comentario;
    this.fecha = data.fecha;
  }

  /**
   * REQ007: CrearReseña()
   */
  static CrearReseña(datos: {
    idPrestamo: number;
    idHerramienta: number;
    autor: string;
    idAutor: number;
    puntuacion: number;
    comentario: string;
  }): ResenaData {
    return new Resena({
      idResena: Date.now() + 1,
      idPrestamo: datos.idPrestamo,
      idHerramienta: datos.idHerramienta,
      autor: datos.autor,
      idAutor: datos.idAutor,
      puntuacion: Math.min(5, Math.max(1, datos.puntuacion)),
      comentario: datos.comentario.trim(),
      fecha: new Date().toISOString().split('T')[0],
    });
  }

  static CrearResena(datos: {
    idPrestamo: number;
    idHerramienta: number;
    autor: string;
    idAutor: number;
    puntuacion: number;
    comentario: string;
  }): ResenaData {
    return Resena.CrearReseña(datos);
  }
}

export { Resena as Reseña };
