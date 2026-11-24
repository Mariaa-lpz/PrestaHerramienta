import {
  Herramienta,
  Incidencia,
  NuevoVecino,
  Prestamo,
  Resena,
  ServicioCorreo,
  Solicitud,
  SolicitudDeAmpliacion,
  Usuario,
  Vecino,
} from './entities';
import { calculateDaysInclusive, getInitials, loadDatabase, saveDatabase } from './repository';
import {
  AppDatabase,
  CorreoConfirmacion,
  EstadoHerramienta,
  HerramientaData,
  HerramientaSpecs,
  IncidentSeverity,
  LoanStatus,
  PrestamoData,
  SolicitudAmpliacionData,
  SolicitudData,
  ToolCategory,
  VecinoData,
} from './types';

/**
 * REQ001 — <<control>> ControladorRegistro
 */
export class ControladorRegistro {
  obtenerFormulario() {
    return {
      campos: ['nombre', 'email', 'contrasena', 'direccion', 'telefono'] as const,
      requiereAceptarTerminos: true,
      textoNormas:
        'Acepto las normas de convivencia, devolución puntual y cuidado de herramientas de Residencial Los Olivos.',
    };
  }

  validarDatosRegistro(datos: {
    nombre: string;
    email: string;
    contrasena: string;
    direccion: string;
    telefono: string;
  }): { esValido: boolean; errores: string[] } {
    const errores: string[] = [];
    if (datos.nombre.trim().length < 3) {
      errores.push('El nombre debe tener al menos 3 caracteres.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
      errores.push('Introduce un correo electrónico válido.');
    }
    if (datos.contrasena.length < 4) {
      errores.push('La contraseña debe tener al menos 4 caracteres.');
    }
    if (datos.direccion.trim().length < 3) {
      errores.push('Indica tu portal o vivienda.');
    }
    return { esValido: errores.length === 0, errores };
  }

  registrarVecino(
    db: AppDatabase,
    datos: { nombre: string; email: string; contrasena: string; direccion: string; telefono: string },
    aceptoTerminos: boolean
  ):
    | {
        ok: true;
        db: AppDatabase;
        nuevoVecino: VecinoData;
        correo: CorreoConfirmacion;
      }
    | {
        ok: false;
        mensajeError: string;
      } {
    const { esValido, errores } = this.validarDatosRegistro(datos);

    // alt esValido==true y aceptoTerminos==true
    if (esValido && aceptoTerminos) {
      const duplicado = db.vecinos.some(
        (v) => v.email.toLowerCase() === datos.email.trim().toLowerCase()
      );
      if (duplicado) {
        return {
          ok: false,
          mensajeError: 'Ya existe un vecino registrado con ese correo electrónico.',
        };
      }

      const nuevoVecino: NuevoVecino = Vecino.crear(datos);
      const correo = ServicioCorreo.enviarCorreoConfirmacion(nuevoVecino.email, nuevoVecino.nombre);

      const nextDb: AppDatabase = {
        ...db,
        vecinos: [...db.vecinos, nuevoVecino.toData()],
      };
      saveDatabase(nextDb);

      return {
        ok: true,
        db: nextDb,
        nuevoVecino: nuevoVecino.toData(),
        correo,
      };
    }

    // else -> errorRegistro
    const mensajeError = !aceptoTerminos
      ? 'Debes aceptar las normas de convivencia de la comunidad.'
      : errores[0] || 'Los datos introducidos no son válidos.';
    return {
      ok: false,
      mensajeError,
    };
  }
}

/**
 * REQ002 — <<control>> ControladorPublicarHerramienta
 */
export class ControladorPublicarHerramienta {
  private borradorHerramienta: Herramienta | null = null;

  /**
   * loop usuario o contraseña inválidos -> Usuario.validarCredenciales(usuario, contraseña)
   */
  entrarSistema(
    db: AppDatabase,
    usuario: string,
    contrasena: string
  ): { valido: boolean; usuario?: VecinoData } {
    const res = Usuario.validarCredenciales(db.vecinos, usuario, contrasena);
    if (res.valido && res.usuario) {
      this.borradorHerramienta = Herramienta.crear(res.usuario.idVecino);
    }
    return res;
  }

  /**
   * 1.4: crear()
   */
  iniciarBorrador(idPropietario: number): Herramienta {
    this.borradorHerramienta = Herramienta.crear(idPropietario);
    return this.borradorHerramienta;
  }

  /**
   * 2.1: añadirDatosUsuario(datosUsuario)
   */
  añadirDatosUsuario(
    db: AppDatabase,
    idUsuario: number,
    datosUsuario: { nombre?: string; direccion?: string; telefono?: string }
  ): { registrado: boolean; db: AppDatabase } {
    const found = db.vecinos.find((v) => v.idVecino === idUsuario);
    if (!found) return { registrado: false, db };

    const u = new Usuario(found);
    const updated = u.actualizarDatos(datosUsuario);
    const nextDb: AppDatabase = {
      ...db,
      vecinos: db.vecinos.map((v) => (v.idVecino === idUsuario ? updated : v)),
    };
    saveDatabase(nextDb);
    return { registrado: true, db: nextDb };
  }

  /**
   * 3.1.1: validarDatos(datos, foto)
   */
  validarDatos(
    datos: { titulo: string; descripcion: string; condiciones: string },
    foto: string
  ): { datosValidos: boolean; error?: string } {
    if (datos.titulo.trim().length < 4) {
      return { datosValidos: false, error: 'El nombre de la herramienta debe tener al menos 4 caracteres.' };
    }
    if (datos.descripcion.trim().length < 10) {
      return { datosValidos: false, error: 'La descripción debe tener al menos 10 caracteres.' };
    }
    if (!datos.condiciones.trim()) {
      return { datosValidos: false, error: 'Indica las condiciones de devolución.' };
    }
    if (!foto.trim()) {
      return { datosValidos: false, error: 'Selecciona o sube una fotografía de la herramienta.' };
    }
    return { datosValidos: true };
  }

  /**
   * 3.1: añadirDatosYFoto(datos, foto)
   */
  añadirDatosYFoto(
    datos: {
      titulo: string;
      descripcion: string;
      tipo: ToolCategory;
      condiciones: string;
      disponibilidad: string;
      specs: HerramientaSpecs;
    },
    foto: string
  ): { datosValidos: boolean; error?: string } {
    const check = this.validarDatos(datos, foto);
    if (check.datosValidos && this.borradorHerramienta) {
      this.borradorHerramienta.establecerDatosYFoto(datos, foto);
    }
    return check;
  }

  /**
   * 4.1.1: validarFecha(disponibilidad)
   */
  validarFecha(disponibilidad: string): { fechaValida: boolean; error?: string } {
    if (disponibilidad.trim().length < 4) {
      return {
        fechaValida: false,
        error: 'Indica la franja de disponibilidad o entrega habitual.',
      };
    }
    return { fechaValida: true };
  }

  /**
   * 5.1.1: validarPrecio(precio)
   */
  validarPrecio(precio: number, fianza = 0): { precioValido: boolean; error?: string } {
    if (Number.isNaN(precio) || precio < 0 || precio > 200) {
      return { precioValido: false, error: 'Introduce una tarifa diaria válida entre 0 € y 200 €.' };
    }
    if (Number.isNaN(fianza) || fianza < 0 || fianza > 500) {
      return { precioValido: false, error: 'La fianza reembolsable debe estar entre 0 € y 500 €.' };
    }
    return { precioValido: true };
  }

  /**
   * 5.1: añadirPrecio(precio)
   */
  añadirPrecio(precio: number, fianza = 0): { precioValido: boolean; error?: string } {
    const check = this.validarPrecio(precio, fianza);
    if (check.precioValido && this.borradorHerramienta) {
      this.borradorHerramienta.establecerPrecio(precio, fianza);
    }
    return check;
  }

  /**
   * Ejecuta el flujo completo REQ002: validarDatos -> validarFecha -> validarPrecio -> publicar()
   */
  publicarHerramienta(
    db: AppDatabase,
    idPropietario: number,
    payload: Omit<HerramientaData, 'idHerramienta' | 'idPropietario' | 'estado' | 'fechaPublicacion'>
  ): { db: AppDatabase; herramienta: HerramientaData } {
    const herramienta = this.borradorHerramienta || Herramienta.crear(idPropietario, payload.foto);
    this.borradorHerramienta = herramienta;

    const checkDatos = this.añadirDatosYFoto(payload, payload.foto);
    if (!checkDatos.datosValidos) {
      throw new Error(checkDatos.error);
    }

    const checkFecha = this.validarFecha(payload.disponibilidad);
    if (!checkFecha.fechaValida) {
      throw new Error(checkFecha.error);
    }

    const checkPrecio = this.añadirPrecio(payload.precio, payload.fianza);
    if (!checkPrecio.precioValido) {
      throw new Error(checkPrecio.error);
    }

    // 4.1.4: publicar() -> estado 'disponible'
    herramienta.publicar();
    const data = herramienta.toData();
    this.borradorHerramienta = null;

    const nextDb: AppDatabase = {
      ...db,
      herramientas: [data, ...db.herramientas],
    };
    saveDatabase(nextDb);
    return { db: nextDb, herramienta: data };
  }
}

/**
 * REQ003 — <<control>> ControladorBuscarHerramientas
 */
export class ControladorBuscarHerramientas {
  cargarCatalogo(db: AppDatabase): HerramientaData[] {
    const catalogo: HerramientaData[] = [];
    // loop para cada herramienta -> H.obtenerDatos()
    for (const raw of db.herramientas) {
      const h = new Herramienta(raw);
      if (h.estado !== 'pausada') {
        catalogo.push(h.obtenerDatos());
      }
    }
    return catalogo;
  }

  filtrarHerramientas(
    db: AppDatabase,
    filtros: {
      criterio?: string;
      tipo?: '' | ToolCategory;
      estado?: '' | 'disponible' | 'presentada';
      precio?: '' | 'gratis' | 'hasta3' | 'mas3';
      sinFianza?: boolean;
      portal?: '' | 'Portal 1' | 'Portal 2' | 'Portal 3';
      soloFavoritos?: boolean;
      idUsuario?: number;
      orden?: 'recientes' | 'valoradas' | 'precio-asc' | 'precio-desc';
    }
  ): HerramientaData[] {
    const catalogo = this.cargarCatalogo(db);
    const favIds = filtros.idUsuario ? db.favoritos[filtros.idUsuario] || [] : [];
    const filtradas: HerramientaData[] = [];

    // loop para cada herramienta del catálogo -> H.cumpleCriterio(...)
    for (const raw of catalogo) {
      const h = new Herramienta(raw);
      const owner = db.vecinos.find((v) => v.idVecino === h.idPropietario);
      const cumple = h.cumpleCriterio({
        criterio: filtros.criterio,
        tipo: filtros.tipo,
        estado: filtros.estado,
        precio: filtros.precio,
        sinFianza: filtros.sinFianza,
        portal: filtros.portal,
        propietarioNombre: owner?.nombre,
        propietarioDireccion: owner?.direccion,
        soloFavoritos: filtros.soloFavoritos,
        favoritosIds: favIds,
      });
      if (cumple) {
        filtradas.push(h.obtenerDatos());
      }
    }

    if (filtros.orden === 'precio-asc') {
      return [...filtradas].sort((a, b) => a.precio - b.precio);
    }
    if (filtros.orden === 'precio-desc') {
      return [...filtradas].sort((a, b) => b.precio - a.precio);
    }
    if (filtros.orden === 'valoradas') {
      return [...filtradas].sort((a, b) => {
        const ra = this.obtenerMediaValoracion(db, a.idHerramienta).average;
        const rb = this.obtenerMediaValoracion(db, b.idHerramienta).average;
        return rb - ra;
      });
    }
    return filtradas;
  }

  obtenerDetalle(db: AppDatabase, idHerramienta: number): HerramientaData | null {
    const found = db.herramientas.find((h) => h.idHerramienta === idHerramienta);
    if (!found) return null;
    return new Herramienta(found).obtenerDetalle();
  }

  obtenerMediaValoracion(db: AppDatabase, idHerramienta: number): { average: number; count: number } {
    const list = db.resenas.filter((r) => r.idHerramienta === idHerramienta);
    if (!list.length) return { average: 0, count: 0 };
    const total = list.reduce((acc, item) => acc + item.puntuacion, 0);
    return { average: Number((total / list.length).toFixed(1)), count: list.length };
  }
}

/**
 * REQ004 — <<control>> ControladorSolicitarPrestamo
 */
export class ControladorSolicitarPrestamo {
  private mensajeRegistrado = '';

  solicitarPrestamo(): { iniciado: boolean } {
    this.mensajeRegistrado = '';
    return { iniciado: true };
  }

  /**
   * 2.1: comprobarDisponibilidad(fecha) -> Prestamo.comprobar(fecha)
   */
  comprobarDisponibilidad(
    db: AppDatabase,
    idHerramienta: number,
    fechaInicio: string,
    fechaFin: string
  ): { disponible: boolean; motivo?: string } {
    const tool = db.herramientas.find((h) => h.idHerramienta === idHerramienta);
    if (!tool) {
      return { disponible: false, motivo: 'Herramienta no encontrada.' };
    }
    return Prestamo.comprobar(tool, db.prestamos, fechaInicio, fechaFin);
  }

  /**
   * 3.1 (opt): registrarMensaje(mensaje)
   */
  registrarMensaje(mensaje: string): string {
    this.mensajeRegistrado = mensaje.trim();
    return this.mensajeRegistrado;
  }

  confirmarSolicitud(
    db: AppDatabase,
    payload: {
      idHerramienta: number;
      idVecino: number;
      fechaInicio: string;
      fechaFin: string;
      franjaRecogida: string;
      mensaje: string;
    }
  ): { db: AppDatabase; solicitud: SolicitudData } {
    const tool = db.herramientas.find((h) => h.idHerramienta === payload.idHerramienta);
    if (!tool) throw new Error('Herramienta no encontrada.');
    if (tool.idPropietario === payload.idVecino) {
      throw new Error('No puedes solicitar el préstamo de tu propia herramienta.');
    }

    const disponibilidad = this.comprobarDisponibilidad(
      db,
      payload.idHerramienta,
      payload.fechaInicio,
      payload.fechaFin
    );
    if (!disponibilidad.disponible) {
      throw new Error(disponibilidad.motivo || 'La herramienta no está disponible en esas fechas.');
    }

    const alreadyPending = db.solicitudes.some(
      (s) =>
        s.idHerramienta === payload.idHerramienta &&
        s.idVecinoSolicitante === payload.idVecino &&
        s.estado === 'Pendiente'
    );
    if (alreadyPending) {
      throw new Error('Ya tienes una solicitud pendiente para esta herramienta.');
    }

    const mensaje = this.registrarMensaje(payload.mensaje);

    const solicitud: SolicitudData = {
      idSolicitud: Date.now(),
      idHerramienta: payload.idHerramienta,
      idVecinoSolicitante: payload.idVecino,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaInicio: payload.fechaInicio,
      fechaFin: payload.fechaFin,
      franjaRecogida: payload.franjaRecogida,
      mensaje: mensaje || 'Sin observaciones adicionales.',
      estado: 'Pendiente',
      motivoRechazo: '',
    };

    const nextDb: AppDatabase = {
      ...db,
      solicitudes: [solicitud, ...db.solicitudes],
    };
    saveDatabase(nextDb);
    return { db: nextDb, solicitud };
  }
}

/**
 * REQ005 — <<control>> ControladorGestionarSolicitudes
 */
export class ControladorGestionarSolicitudes {
  consultarSolicitudesPendientes(db: AppDatabase, idPropietario: number): SolicitudData[] {
    return Solicitud.obtenerPendientes(db.solicitudes, db.herramientas, idPropietario);
  }

  rechazarSolicitud(db: AppDatabase, idSolicitud: number, motivo: string): AppDatabase {
    const raw = db.solicitudes.find((s) => s.idSolicitud === idSolicitud);
    if (!raw) throw new Error('Solicitud no encontrada.');

    const sol = new Solicitud(raw);
    const updatedSol = sol.rechazarSolicitud(motivo);

    const nextDb: AppDatabase = {
      ...db,
      solicitudes: db.solicitudes.map((s) => (s.idSolicitud === idSolicitud ? updatedSol : s)),
    };
    saveDatabase(nextDb);
    return nextDb;
  }

  /**
   * 3.1: aceptarSolicitud(id, datos) -> S.aceptar(datos) -> H.cambiarEstado('presentada')
   */
  aceptarSolicitud(
    db: AppDatabase,
    idSolicitud: number,
    datosEntrega?: string
  ): { db: AppDatabase; prestamo: PrestamoData } {
    const rawSol = db.solicitudes.find((s) => s.idSolicitud === idSolicitud);
    if (!rawSol) throw new Error('Solicitud no encontrada.');
    const rawTool = db.herramientas.find((h) => h.idHerramienta === rawSol.idHerramienta);
    if (!rawTool || rawTool.estado !== 'disponible') {
      throw new Error('La herramienta ya se encuentra presentada o pausada.');
    }

    const solEntity = new Solicitud(rawSol);
    const toolEntity = new Herramienta(rawTool);

    const entregaTexto =
      datosEntrega?.trim() || `Entrega en portal · ${rawSol.franjaRecogida}`;
    const solAceptada = solEntity.aceptar(entregaTexto);

    // 3.1.1.1: cambiarEstado(presentada)
    toolEntity.cambiarEstado('presentada');
    const toolActualizada = toolEntity.toData();

    const dias = calculateDaysInclusive(rawSol.fechaInicio, rawSol.fechaFin);
    const prestamoId = Date.now();
    const prestamo: PrestamoData = {
      idPrestamo: prestamoId,
      idSolicitud: rawSol.idSolicitud,
      idHerramienta: rawSol.idHerramienta,
      idPrestatario: rawSol.idVecinoSolicitante,
      fechaInicio: rawSol.fechaInicio,
      fechaFin: rawSol.fechaFin,
      franjaRecogida: rawSol.franjaRecogida,
      estado: 'Activo',
      observaciones: '',
      costeTotal: Number((dias * rawTool.precio).toFixed(2)),
      fianzaRetenida: rawTool.fianza,
      codigoEntrega: `PH-${String(prestamoId).slice(-4)}`,
      datosEntrega: entregaTexto,
    };

    const nextDb: AppDatabase = {
      ...db,
      solicitudes: db.solicitudes.map((s) => (s.idSolicitud === idSolicitud ? solAceptada : s)),
      herramientas: db.herramientas.map((h) =>
        h.idHerramienta === rawSol.idHerramienta ? toolActualizada : h
      ),
      prestamos: [prestamo, ...db.prestamos],
    };
    saveDatabase(nextDb);
    return { db: nextDb, prestamo };
  }
}

/**
 * REQ006 — <<control>> ControladorSolicitarAmpliacion
 */
export class ControladorSolicitarAmpliacion {
  private motivoTemporal = '';

  solicitarAmpliacionPlazo(db: AppDatabase, idPrestamo: number): PrestamoData {
    const prestamo = db.prestamos.find((p) => p.idPrestamo === idPrestamo);
    if (!prestamo) throw new Error('Préstamo no encontrado.');
    this.motivoTemporal = '';
    return prestamo;
  }

  /**
   * 2.1: comprobarDisponibilidad(fecha) -> Herramienta.comprobar(fecha)
   */
  comprobarDisponibilidad(
    db: AppDatabase,
    idPrestamo: number,
    nuevaFechaFin: string
  ): { disponible: boolean; motivo?: string } {
    const prestamo = db.prestamos.find((p) => p.idPrestamo === idPrestamo);
    if (!prestamo) return { disponible: false, motivo: 'Préstamo no encontrado.' };
    const rawTool = db.herramientas.find((h) => h.idHerramienta === prestamo.idHerramienta);
    if (!rawTool) return { disponible: false, motivo: 'Herramienta no encontrada.' };

    const h = new Herramienta(rawTool);
    return h.comprobar(nuevaFechaFin, prestamo, db.prestamos);
  }

  /**
   * 3.1 (opt): registrarMotivo(motivo)
   */
  registrarMotivo(motivo: string): string {
    this.motivoTemporal = motivo.trim();
    return this.motivoTemporal;
  }

  solicitarProrroga(
    db: AppDatabase,
    idPrestamo: number,
    nuevaFechaFin: string,
    motivo?: string
  ): AppDatabase {
    const check = this.comprobarDisponibilidad(db, idPrestamo, nuevaFechaFin);
    if (!check.disponible) {
      throw new Error(check.motivo || 'Fecha no disponible para ampliar el plazo.');
    }

    const alreadyPending = db.ampliaciones.some(
      (a) => a.idPrestamo === idPrestamo && a.estado === 'Pendiente'
    );
    if (alreadyPending) {
      throw new Error('Ya existe una solicitud de ampliación pendiente.');
    }

    const entity = new SolicitudDeAmpliacion({
      idAmpliacion: Date.now(),
      idPrestamo,
      nuevaFechaFin,
      motivo: '',
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString().split('T')[0],
    });

    if (motivo?.trim()) {
      this.registrarMotivo(motivo);
      entity.guardarMotivo(motivo);
    }

    const nextDb: AppDatabase = {
      ...db,
      ampliaciones: [entity.toData(), ...db.ampliaciones],
    };
    saveDatabase(nextDb);
    return nextDb;
  }

  /**
   * 3.1.2 (opt): propietario autoriza -> confirmarAmpliación()
   */
  autorizarProrroga(db: AppDatabase, idAmpliacion: number, aprobar: boolean): AppDatabase {
    const rawAmp = db.ampliaciones.find((a) => a.idAmpliacion === idAmpliacion);
    if (!rawAmp) throw new Error('Ampliación no encontrada.');

    const prestamo = db.prestamos.find((p) => p.idPrestamo === rawAmp.idPrestamo);
    const tool = prestamo
      ? db.herramientas.find((h) => h.idHerramienta === prestamo.idHerramienta)
      : undefined;

    const ampEntity = new SolicitudDeAmpliacion(rawAmp);
    const updatedAmp = aprobar
      ? ampEntity.confirmarAmpliacion()
      : { ...rawAmp, estado: 'Denegada' as const };

    const nextDb: AppDatabase = {
      ...db,
      ampliaciones: db.ampliaciones.map((a) => (a.idAmpliacion === idAmpliacion ? updatedAmp : a)),
      prestamos:
        aprobar && prestamo
          ? db.prestamos.map((p) => {
              if (p.idPrestamo !== rawAmp.idPrestamo) return p;
              const dias = calculateDaysInclusive(p.fechaInicio, rawAmp.nuevaFechaFin);
              return {
                ...p,
                fechaFin: rawAmp.nuevaFechaFin,
                costeTotal: tool ? Number((dias * tool.precio).toFixed(2)) : p.costeTotal,
              };
            })
          : db.prestamos,
    };
    saveDatabase(nextDb);
    return nextDb;
  }
}

/**
 * REQ007 — <<control>> ControladorDevolucion
 */
export class ControladorDevolucion {
  /**
   * 1.1: Notificar() — Cliente devuelve la herramienta y notifica al Propietario
   */
  Notificar(db: AppDatabase, idPrestamo: number): { db: AppDatabase; notificado: boolean } {
    const prestamo = db.prestamos.find((p) => p.idPrestamo === idPrestamo);
    if (!prestamo) throw new Error('Préstamo no encontrado.');

    const nextDb: AppDatabase = {
      ...db,
      prestamos: db.prestamos.map((p) =>
        p.idPrestamo === idPrestamo
          ? {
              ...p,
              estado: 'PendienteInspeccion',
              notificadoDevolucion: true,
              fechaDevolucionReal: new Date().toISOString().split('T')[0],
            }
          : p
      ),
    };
    saveDatabase(nextDb);
    return { db: nextDb, notificado: true };
  }

  /**
   * 2.1: GuardarIncidencia() -> Incidencia.CrearIncidencia()
   */
  GuardarIncidencia(
    db: AppDatabase,
    datos: {
      idPrestamo: number;
      idReportante: number;
      gravedad: IncidentSeverity;
      descripcion: string;
    }
  ): AppDatabase {
    const prestamo = db.prestamos.find((p) => p.idPrestamo === datos.idPrestamo);
    if (!prestamo) throw new Error('Préstamo no encontrado.');
    if (datos.descripcion.trim().length < 5) {
      throw new Error('Describe con algo más de detalle la incidencia detectada.');
    }

    const nuevaInc = Incidencia.CrearIncidencia({
      idPrestamo: datos.idPrestamo,
      idHerramienta: prestamo.idHerramienta,
      idReportante: datos.idReportante,
      gravedad: datos.gravedad,
      descripcion: datos.descripcion,
    });

    const nextDb: AppDatabase = {
      ...db,
      incidencias: [nuevaInc, ...db.incidencias],
    };
    saveDatabase(nextDb);
    return nextDb;
  }

  /**
   * 2.3: DejarReseña() -> Reseña.CrearReseña()
   */
  DejarReseña(
    db: AppDatabase,
    datos: {
      idPrestamo: number;
      idAutor: number;
      puntuacion: number;
      comentario: string;
    }
  ): AppDatabase {
    const prestamo = db.prestamos.find((p) => p.idPrestamo === datos.idPrestamo);
    if (!prestamo) throw new Error('Préstamo no encontrado.');
    const autor = db.vecinos.find((v) => v.idVecino === datos.idAutor);

    const nuevaResena = Resena.CrearReseña({
      idPrestamo: datos.idPrestamo,
      idHerramienta: prestamo.idHerramienta,
      autor: autor?.nombre || 'Vecino',
      idAutor: datos.idAutor,
      puntuacion: datos.puntuacion,
      comentario: datos.comentario,
    });

    const nextDb: AppDatabase = {
      ...db,
      resenas: [nuevaResena, ...db.resenas],
    };
    saveDatabase(nextDb);
    return nextDb;
  }

  DejarResena(
    db: AppDatabase,
    datos: { idPrestamo: number; idAutor: number; puntuacion: number; comentario: string }
  ): AppDatabase {
    return this.DejarReseña(db, datos);
  }

  /**
   * 3.1: FinalizarDevolucion() -> cambia Herramienta a 'disponible' y cierra Prestamo + NotificarDevolucion()
   */
  FinalizarDevolucion(
    db: AppDatabase,
    idPrestamo: number,
    opciones: {
      idPropietario: number;
      observaciones: string;
      hayIncidencia?: boolean;
      incidenciaGravedad?: IncidentSeverity;
      incidenciaDescripcion?: string;
      dejarResena?: boolean;
      puntuacion?: number;
      comentarioResena?: string;
    }
  ): { db: AppDatabase; notificacionCliente: string } {
    const prestamo = db.prestamos.find((p) => p.idPrestamo === idPrestamo);
    if (!prestamo) throw new Error('Préstamo no encontrado.');

    let currentDb = db;

    // alt Hay incidencia -> GuardarIncidencia()
    if (opciones.hayIncidencia && opciones.incidenciaDescripcion) {
      currentDb = this.GuardarIncidencia(currentDb, {
        idPrestamo,
        idReportante: opciones.idPropietario,
        gravedad: opciones.incidenciaGravedad || 'Leve',
        descripcion: opciones.incidenciaDescripcion,
      });
    }

    // opt El propietario desea dejar reseña -> DejarReseña()
    if (opciones.dejarResena && opciones.comentarioResena?.trim()) {
      currentDb = this.DejarReseña(currentDb, {
        idPrestamo,
        idAutor: opciones.idPropietario,
        puntuacion: opciones.puntuacion || 5,
        comentario: opciones.comentarioResena,
      });
    }

    // 3.1.1: Herramienta pasa a 'disponible'
    const rawTool = currentDb.herramientas.find((h) => h.idHerramienta === prestamo.idHerramienta);
    const updatedTools = currentDb.herramientas.map((h) => {
      if (h.idHerramienta !== prestamo.idHerramienta) return h;
      const entity = new Herramienta(h);
      entity.cambiarEstado('disponible');
      return entity.toData();
    });

    const nextDb: AppDatabase = {
      ...currentDb,
      herramientas: updatedTools,
      prestamos: currentDb.prestamos.map((p) =>
        p.idPrestamo === idPrestamo
          ? {
              ...p,
              estado: 'Finalizado',
              observaciones:
                opciones.observaciones.trim() || 'Inspeccionada y devuelta correctamente.',
            }
          : p
      ),
    };
    saveDatabase(nextDb);

    // 3.1.2: NotificarDevolucion()
    const msg = this.NotificarDevolucion(rawTool?.titulo || 'Herramienta');
    return { db: nextDb, notificacionCliente: msg };
  }

  NotificarDevolucion(tituloHerramienta: string): string {
    return `Devolución confirmada: «${tituloHerramienta}» vuelve a estar disponible.`;
  }
}

/**
 * REQ008 — <<control>> ControladorHistorial
 */
export class ControladorHistorial {
  /**
   * 1.1: obtenerHistorial() — par cargarPrestamosRecibidos() y cargarPrestamosRealizados()
   */
  obtenerHistorial(
    db: AppDatabase,
    idVecino: number
  ): {
    prestamosRecibidos: PrestamoData[];
    prestamosRealizados: PrestamoData[];
    listaPrestamos: PrestamoData[];
  } {
    const prestamosRecibidos = Prestamo.cargarPrestamosRecibidos(db.prestamos, idVecino);
    const prestamosRealizados = Prestamo.cargarPrestamosRealizados(
      db.prestamos,
      db.herramientas,
      idVecino
    );

    const seen = new Set<number>();
    const listaPrestamos: PrestamoData[] = [];
    for (const p of [...prestamosRecibidos, ...prestamosRealizados]) {
      if (!seen.has(p.idPrestamo)) {
        seen.add(p.idPrestamo);
        listaPrestamos.push(p);
      }
    }

    return { prestamosRecibidos, prestamosRealizados, listaPrestamos };
  }

  /**
   * 2.1 (opt): filtrarPrestamos() -> Prestamo.buscarPrestamos()
   */
  filtrarPrestamos(
    db: AppDatabase,
    idVecino: number,
    criterios: { texto?: string; rol?: 'todos' | 'recibidos' | 'realizados'; estado?: '' | LoanStatus }
  ): PrestamoData[] {
    const { listaPrestamos } = this.obtenerHistorial(db, idVecino);
    return Prestamo.buscarPrestamos(listaPrestamos, db.herramientas, db.vecinos, idVecino, criterios);
  }

  /**
   * 3.1 (opt): obtenerDetallesPrestamo() -> Prestamo.consultarDetalle()
   */
  obtenerDetallesPrestamo(db: AppDatabase, idPrestamo: number): PrestamoData | null {
    const raw = db.prestamos.find((p) => p.idPrestamo === idPrestamo);
    if (!raw) return null;
    return new Prestamo(raw).consultarDetalle();
  }
}

export const ctrlRegistro = new ControladorRegistro();
export const ctrlPublicar = new ControladorPublicarHerramienta();
export const ctrlBuscar = new ControladorBuscarHerramientas();
export const ctrlSolicitar = new ControladorSolicitarPrestamo();
export const ctrlGestionar = new ControladorGestionarSolicitudes();
export const ctrlAmpliacion = new ControladorSolicitarAmpliacion();
export const ctrlDevolucion = new ControladorDevolucion();
export const ctrlHistorial = new ControladorHistorial();

export { loadDatabase, saveDatabase, getInitials };

export function toggleToolAvailabilityStatus(
  db: AppDatabase,
  idHerramienta: number
): { db: AppDatabase; newStatus: EstadoHerramienta } {
  const raw = db.herramientas.find((h) => h.idHerramienta === idHerramienta);
  if (!raw) throw new Error('Herramienta no encontrada.');
  if (raw.estado === 'presentada') {
    throw new Error('No puedes pausar una herramienta mientras está presentada en un préstamo.');
  }
  const h = new Herramienta(raw);
  const newStatus: EstadoHerramienta = h.estado === 'disponible' ? 'pausada' : 'disponible';
  h.cambiarEstado(newStatus);
  const nextDb: AppDatabase = {
    ...db,
    herramientas: db.herramientas.map((item) =>
      item.idHerramienta === idHerramienta ? h.toData() : item
    ),
  };
  saveDatabase(nextDb);
  return { db: nextDb, newStatus };
}
