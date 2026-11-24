import imgDrill from '../assets/images/tool_percussion_drill_1795364391154.jpg';
import imgLadder from '../assets/images/tool_telescopic_ladder_1795364391272.jpg';
import imgLaser from '../assets/images/tool_laser_level_1795364391157.jpg';
import imgHedge from '../assets/images/tool_hedge_trimmer_1795364391732.jpg';
import imgPaint from '../assets/images/tool_paint_sprayer_kit_1795364392410.jpg';
import imgSander from '../assets/images/tool_orbital_sander_1795364392791.jpg';
import imgWasher from '../assets/images/tool_pressure_washer_1795364393041.jpg';
import imgWrench from '../assets/images/tool_torque_wrench_set_1795364393244.jpg';
import imgCircularSaw from '../assets/images/tool_circular_saw_1795365107749.jpg';
import imgJigsaw from '../assets/images/tool_jigsaw_case_1795365107344.jpg';
import imgHeatGun from '../assets/images/tool_heat_gun_1795365106876.jpg';
import imgMultimeter from '../assets/images/tool_multimeter_tester_1795365107694.jpg';
import imgAngleGrinder from '../assets/images/tool_angle_grinder_1795537131525.jpg';
import imgVacuum from '../assets/images/tool_wet_dry_vacuum_1795537130970.jpg';
import imgChainsaw from '../assets/images/tool_cordless_chainsaw_1795537130692.jpg';
import imgTrimmer from '../assets/images/tool_grass_trimmer_1795537131597.jpg';
import imgThermal from '../assets/images/tool_thermal_detector_1795537132220.jpg';
import imgTileCutter from '../assets/images/tool_tile_cutter_1795537132024.jpg';
import imgDrywallSander from '../assets/images/tool_drywall_sander_1795537132965.jpg';
import imgWelder from '../assets/images/tool_inverter_welder_1795537132748.jpg';
import imgRotaryHammer from '../assets/images/tool_rotary_hammer_1795537461101.jpg';
import imgLaserDistance from '../assets/images/tool_laser_distance_1795537461338.jpg';
import imgWorkbench from '../assets/images/tool_folding_workbench_1795537461895.jpg';
import imgLopper from '../assets/images/tool_telescopic_lopper_1795537461734.jpg';
import imgPaintRoller from '../assets/images/tool_paint_roller_pro_1795537462691.jpg';
import imgPolisher from '../assets/images/tool_orbital_polisher_1795537462472.jpg';

import {
  AppDatabase,
  EstadoHerramienta,
  HerramientaData,
  IncidenciaData,
  PrestamoData,
  ResenaData,
  SolicitudAmpliacionData,
  SolicitudData,
  ToolCategory,
  VecinoData,
} from './types';

export const STORAGE_KEY = 'prestaherramienta_pro_v4';

const LEGACY_IMAGE_MAP: Record<string, string> = {
  '/src/assets/images/tool_percussion_drill_1795364391154.jpg': imgDrill,
  '/src/assets/images/tool_telescopic_ladder_1795364391272.jpg': imgLadder,
  '/src/assets/images/tool_laser_level_1795364391157.jpg': imgLaser,
  '/src/assets/images/tool_hedge_trimmer_1795364391732.jpg': imgHedge,
  '/src/assets/images/tool_paint_sprayer_kit_1795364392410.jpg': imgPaint,
  '/src/assets/images/tool_orbital_sander_1795364392791.jpg': imgSander,
  '/src/assets/images/tool_pressure_washer_1795364393041.jpg': imgWasher,
  '/src/assets/images/tool_torque_wrench_set_1795364393244.jpg': imgWrench,
  '/src/assets/images/tool_circular_saw_1795365107749.jpg': imgCircularSaw,
  '/src/assets/images/tool_jigsaw_case_1795365107344.jpg': imgJigsaw,
  '/src/assets/images/tool_heat_gun_1795365106876.jpg': imgHeatGun,
  '/src/assets/images/tool_multimeter_tester_1795365107694.jpg': imgMultimeter,
};

function normalizeEstadoHerramienta(raw: string): EstadoHerramienta {
  const lower = (raw || '').toLowerCase();
  if (lower === 'presentada' || lower === 'prestada') return 'presentada';
  if (lower === 'pausada') return 'pausada';
  return 'disponible';
}

export const PRESET_GALLERY: { label: string; category: ToolCategory; url: string }[] = [
  { label: 'Taladro percutor', category: 'Eléctrica', url: imgDrill },
  { label: 'Amoladora 125 mm', category: 'Eléctrica', url: imgAngleGrinder },
  { label: 'Sierra circular 18V', category: 'Eléctrica', url: imgCircularSaw },
  { label: 'Sierra de calar', category: 'Eléctrica', url: imgJigsaw },
  { label: 'Lijadora orbital', category: 'Eléctrica', url: imgSander },
  { label: 'Aspirador taller', category: 'Eléctrica', url: imgVacuum },
  { label: 'Soldador inverter', category: 'Eléctrica', url: imgWelder },
  { label: 'Martillo perforador SDS', category: 'Eléctrica', url: imgRotaryHammer },
  { label: 'Pulidora excéntrica', category: 'Eléctrica', url: imgPolisher },
  { label: 'Hidrolimpiadora', category: 'Jardinería', url: imgWasher },
  { label: 'Cortasetos', category: 'Jardinería', url: imgHedge },
  { label: 'Motosierra batería', category: 'Jardinería', url: imgChainsaw },
  { label: 'Desbrozadora', category: 'Jardinería', url: imgTrimmer },
  { label: 'Podadora telescópica', category: 'Jardinería', url: imgLopper },
  { label: 'Escalera telescópica', category: 'Manual', url: imgLadder },
  { label: 'Maletín dinamométrica', category: 'Manual', url: imgWrench },
  { label: 'Cortadora cerámica', category: 'Manual', url: imgTileCutter },
  { label: 'Banco plegable', category: 'Manual', url: imgWorkbench },
  { label: 'Nivel láser', category: 'Medición', url: imgLaser },
  { label: 'Multímetro digital', category: 'Medición', url: imgMultimeter },
  { label: 'Detector térmico', category: 'Medición', url: imgThermal },
  { label: 'Medidor láser 50m', category: 'Medición', url: imgLaserDistance },
  { label: 'Pistola de pintura', category: 'Pintura', url: imgPaint },
  { label: 'Decapador térmico', category: 'Pintura', url: imgHeatGun },
  { label: 'Lijadora de pared', category: 'Pintura', url: imgDrywallSander },
  { label: 'Kit rodillo y pértiga', category: 'Pintura', url: imgPaintRoller },
];

function addDaysISO(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function getInitials(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function calculateDaysInclusive(start: string, end: string): number {
  if (!start || !end) return 1;
  const d1 = new Date(`${start}T00:00:00`);
  const d2 = new Date(`${end}T00:00:00`);
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function createSeedDatabase(): AppDatabase {
  const now = new Date();
  const today = addDaysISO(now, 0);
  const tomorrow = addDaysISO(now, 1);
  const inThreeDays = addDaysISO(now, 3);
  const twoDaysAgo = addDaysISO(now, -2);
  const fiveDaysAgo = addDaysISO(now, -5);
  const tenDaysAgo = addDaysISO(now, -10);
  const twelveDaysAgo = addDaysISO(now, -12);

  const vecinos: VecinoData[] = [
    {
      idVecino: 1,
      nombre: 'Ana García',
      email: 'ana.garcia@comunidad.es',
      contrasena: '1234',
      direccion: 'Portal 1 · 2ºA',
      telefono: '645 218 904',
      verificado: true,
      fechaRegistro: '2025-09-14',
    },
    {
      idVecino: 2,
      nombre: 'Carlos Ruiz',
      email: 'carlos.ruiz@comunidad.es',
      contrasena: '1234',
      direccion: 'Portal 3 · Bajo B',
      telefono: '619 840 312',
      verificado: true,
      fechaRegistro: '2025-10-02',
    },
    {
      idVecino: 3,
      nombre: 'Marta Jiménez',
      email: 'marta.jimenez@comunidad.es',
      contrasena: '1234',
      direccion: 'Portal 2 · 4ºC',
      telefono: '678 502 119',
      verificado: true,
      fechaRegistro: '2025-11-18',
    },
    {
      idVecino: 4,
      nombre: 'Javier Navarro',
      email: 'javier.navarro@comunidad.es',
      contrasena: '1234',
      direccion: 'Portal 1 · 5ºB',
      telefono: '633 771 450',
      verificado: true,
      fechaRegistro: '2026-01-20',
    },
    {
      idVecino: 5,
      nombre: 'Laura Morales',
      email: 'laura.morales@comunidad.es',
      contrasena: '1234',
      direccion: 'Portal 2 · 1ºD',
      telefono: '652 914 208',
      verificado: true,
      fechaRegistro: '2026-02-04',
    },
    {
      idVecino: 6,
      nombre: 'Sergio Delgado',
      email: 'sergio.delgado@comunidad.es',
      contrasena: '1234',
      direccion: 'Portal 3 · 3ºA',
      telefono: '689 310 542',
      verificado: true,
      fechaRegistro: '2026-03-09',
    },
  ];

  const herramientas: HerramientaData[] = [
    {
      idHerramienta: 101,
      idPropietario: 1,
      titulo: 'Taladro percutor brushless 20V con maletín 35 brocas',
      descripcion:
        'Motor sin escobillas para hormigón, ladrillo, madera y acero. Incluye dos baterías de 5.0Ah, cargador rápido y estuche rígido de puntas y brocas.',
      foto: imgDrill,
      condiciones: 'Devolver las baterías cargadas y comprobar que no falte ninguna broca en el estuche.',
      disponibilidad: 'Lunes a viernes de 18:00 a 21:00 · Fines de semana flexible',
      precio: 0,
      fianza: 25,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'DeWalt XR',
        modelo: 'DCD796P2',
        potenciaOCapacidad: '20V · 70 Nm · 34.000 ipm',
        peso: '1,8 kg',
        valorReposicion: 245,
      },
      fechaPublicacion: '2026-02-10',
    },
    {
      idHerramienta: 109,
      idPropietario: 4,
      titulo: 'Sierra circular a batería 18V disco carburo 184 mm',
      descripcion:
        'Cortes rectos y en inglete de hasta 57 mm en tableros, tarima y vigas de madera. Incluye batería ProCORE 18V y disco de 40 dientes.',
      foto: imgCircularSaw,
      condiciones: 'Uso obligatorio de gafas protectoras. Limpiar serrín de la carcasa protectora.',
      disponibilidad: 'Tardes a partir de las 18:30 y sábados mañana',
      precio: 4.5,
      fianza: 35,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Bosch Professional',
        modelo: 'GKS 18V-57-2',
        potenciaOCapacidad: '18V · Ø 184 mm · 5.000 rpm',
        peso: '3,4 kg',
        valorReposicion: 290,
      },
      fechaPublicacion: '2026-05-10',
    },
    {
      idHerramienta: 102,
      idPropietario: 2,
      titulo: 'Escalera telescópica de aluminio anodizado 3,8 metros',
      descripcion:
        'Plegable ultracompacta de 88 cm cerrada (cabe en ascensor y maletero). Certificación antideslizante EN131 hasta 150 kg para techos y lámparas.',
      foto: imgLadder,
      condiciones: 'No apoyar sobre paredes recién pintadas y limpiar zapatas de goma tras usar en patio.',
      disponibilidad: 'Cualquier día avisando por la mañana',
      precio: 2.5,
      fianza: 20,
      estado: 'disponible',
      tipo: 'Manual',
      specs: {
        marca: 'ProStep',
        modelo: 'TS-380 EN131',
        potenciaOCapacidad: 'Altura 3,8 m · Carga 150 kg',
        peso: '10,4 kg',
        valorReposicion: 135,
      },
      fechaPublicacion: '2026-02-18',
    },
    {
      idHerramienta: 103,
      idPropietario: 3,
      titulo: 'Nivel láser autonivelante cruz verde 360° con trípode',
      descripcion:
        'Proyección láser verde visible hasta 25 metros con trípode de aluminio regulable. Muy práctico para alinear cuadros, muebles o azulejos.',
      foto: imgLaser,
      condiciones: 'Bloquear el péndulo antes de guardarlo en la funda acolchada.',
      disponibilidad: 'Mañanas (09:30–13:00) y tardes desde las 17:30',
      precio: 3,
      fianza: 30,
      estado: 'disponible',
      tipo: 'Medición',
      specs: {
        marca: 'Huepar',
        modelo: 'LS05G 3D',
        potenciaOCapacidad: 'Alcance 25 m · ±2 mm/10 m',
        peso: '1,2 kg',
        valorReposicion: 160,
      },
      fechaPublicacion: '2026-03-01',
    },
    {
      idHerramienta: 110,
      idPropietario: 1,
      titulo: 'Sierra de calar pendular 18V con 10 hojas para madera',
      descripcion:
        'Ideal para recortes curvos en encimeras, estantes y puertas. Incluye guía paralela y juego de 10 hojas de corte fino y rápido.',
      foto: imgJigsaw,
      condiciones: 'Se entrega sin batería extra (compatible con cargador DeWalt 18V/20V o se presta junta).',
      disponibilidad: 'Lunes a viernes desde las 18:00',
      precio: 3,
      fianza: 20,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'DeWalt XR',
        modelo: 'DCS334N',
        potenciaOCapacidad: '18V · 3.200 cpm · Corte 135 mm',
        peso: '2,1 kg',
        valorReposicion: 185,
      },
      fechaPublicacion: '2026-05-08',
    },
    {
      idHerramienta: 107,
      idPropietario: 3,
      titulo: 'Hidrolimpiadora alta presión 150 bar para terrazas',
      descripcion:
        'Limpia suelos de terraza, persianas, muros y bicicletas en minutos. Incluye lanza regulable, boquilla rotativa y manguera de 8 metros.',
      foto: imgWasher,
      condiciones: 'Conectar primero al grifo antes de encender el motor y purgar el agua al terminar.',
      disponibilidad: 'Sábados y domingos de 09:00 a 20:00',
      precio: 5,
      fianza: 40,
      estado: 'disponible',
      tipo: 'Jardinería',
      specs: {
        marca: 'AquaPress',
        modelo: 'AP-3200e',
        potenciaOCapacidad: '2.100W · 150 Bar · 450 l/h',
        peso: '9,8 kg',
        valorReposicion: 220,
      },
      fechaPublicacion: '2026-04-19',
    },
    {
      idHerramienta: 105,
      idPropietario: 2,
      titulo: 'Equipo de pintura HVLP Wagner y kit de rodillos',
      descripcion:
        'Pistola de pulverización fina para paredes, techos o carpintería junto con alargador telescópico, cubeta y rodillos antigoteo.',
      foto: imgPaint,
      condiciones: 'Limpiar la boquilla y el depósito con agua tibia inmediatamente después de pintar.',
      disponibilidad: 'Horario flexible en Portal 3',
      precio: 4,
      fianza: 30,
      estado: 'presentada',
      tipo: 'Pintura',
      specs: {
        marca: 'Wagner',
        modelo: 'Flexio 590',
        potenciaOCapacidad: '630W · Depósito 1.300 ml',
        peso: '2,9 kg',
        valorReposicion: 190,
      },
      fechaPublicacion: '2026-03-22',
    },
    {
      idHerramienta: 106,
      idPropietario: 4,
      titulo: 'Lijadora excéntrica orbital 280W con discos variados',
      descripcion:
        'Lijadora rotorbital de velocidad regulable y depósito microfiltro. Incluye discos de grano 60, 80, 120 y 220 para restauración de muebles.',
      foto: imgSander,
      condiciones: 'Vaciar el depósito de polvo después de cada sesión y no forzar el plato.',
      disponibilidad: 'Tardes a partir de las 19:00',
      precio: 0,
      fianza: 15,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'DeWalt',
        modelo: 'DWE6423',
        potenciaOCapacidad: '280W · 8.000–12.000 opm · Ø 125 mm',
        peso: '1,3 kg',
        valorReposicion: 120,
      },
      fechaPublicacion: '2026-04-04',
    },
    {
      idHerramienta: 104,
      idPropietario: 1,
      titulo: 'Cortasetos eléctrico espada doble acción 55 cm',
      descripcion:
        'Cuchilla de 55 cm con funda protectora rígida y alargador exterior de 15 metros. Ideal para setos de terraza y patios.',
      foto: imgHedge,
      condiciones: 'No cortar ramas de más de 22 mm de grosor. Retirar restos de la cuchilla tras usar.',
      disponibilidad: 'Viernes tarde y fines de semana',
      precio: 2,
      fianza: 15,
      estado: 'disponible',
      tipo: 'Jardinería',
      specs: {
        marca: 'Husqvarna',
        modelo: '120iTK4-H',
        potenciaOCapacidad: '550W · Espada 55 cm · Corte 22 mm',
        peso: '3,4 kg',
        valorReposicion: 175,
      },
      fechaPublicacion: '2026-03-11',
    },
    {
      idHerramienta: 108,
      idPropietario: 4,
      titulo: 'Maletín llave dinamométrica y vasos 76 piezas',
      descripcion:
        'Carracas de 1/4" y 1/2", vasos métricos en cromo-vanadio y llave dinamométrica calibrada (28–210 Nm) para bici, moto o montaje.',
      foto: imgWrench,
      condiciones: 'Dejar la llave dinamométrica en el valor mínimo al guardarla.',
      disponibilidad: 'Cualquier día entre 18:00 y 21:30',
      precio: 2,
      fianza: 25,
      estado: 'disponible',
      tipo: 'Manual',
      specs: {
        marca: 'Apex Pro',
        modelo: 'CV-76 Series',
        potenciaOCapacidad: '28–210 Nm · 76 piezas CR-V',
        peso: '5,2 kg',
        valorReposicion: 145,
      },
      fechaPublicacion: '2026-05-02',
    },
    {
      idHerramienta: 111,
      idPropietario: 2,
      titulo: 'Decapador térmico digital 2.000W con 3 boquillas',
      descripcion:
        'Pistola de aire caliente regulable (60°C a 650°C) con pantalla LCD y boquillas de acero inoxidable para decapar pintura, barniz o termorretráctil.',
      foto: imgHeatGun,
      condiciones: 'Dejar enfriar completamente antes de guardar en la caja. No obstruir la toma trasera.',
      disponibilidad: 'Lunes a sábado en Portal 3',
      precio: 0,
      fianza: 0,
      estado: 'disponible',
      tipo: 'Pintura',
      specs: {
        marca: 'IronClad',
        modelo: 'HG2000 Pro',
        potenciaOCapacidad: '2.000W · 60–650 °C · 500 l/min',
        peso: '0,9 kg',
        valorReposicion: 65,
      },
      fechaPublicacion: '2026-05-14',
    },
    {
      idHerramienta: 112,
      idPropietario: 3,
      titulo: 'Multímetro digital True-RMS + detector de tensión',
      descripcion:
        'Polímetro de precisión para comprobar enchufes, cuadros eléctricos y pilas. Incluye puntas de prueba aisladas y buscapolos sin contacto.',
      foto: imgMultimeter,
      condiciones: 'No medir corriente en amperios directamente en enchufes de pared. Devolver con funda.',
      disponibilidad: 'Tardes entre 17:30 y 20:30',
      precio: 0,
      fianza: 0,
      estado: 'disponible',
      tipo: 'Medición',
      specs: {
        marca: 'Fluke',
        modelo: '87V + LVD2',
        potenciaOCapacidad: 'CAT IV 600V · True-RMS',
        peso: '0,6 kg',
        valorReposicion: 210,
      },
      fechaPublicacion: '2026-05-16',
    },
    {
      idHerramienta: 113,
      idPropietario: 5,
      titulo: 'Amoladora angular 125 mm 750W con disco diamante y metal',
      descripcion:
        'Radial compacta de arranque suave y empuñadura antivibración. Incluye disco de corte fino para acero y disco segmentado para azulejo o piedra.',
      foto: imgAngleGrinder,
      condiciones: 'Utilizar siempre pantalla facial o gafas y comprobar el apriete de la tuerca antes de encender.',
      disponibilidad: 'Lunes a viernes de 17:30 a 21:00',
      precio: 3,
      fianza: 25,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Bosch Professional',
        modelo: 'GWS 750-125',
        potenciaOCapacidad: '750W · Ø 125 mm · 11.000 rpm',
        peso: '1,8 kg',
        valorReposicion: 110,
      },
      fechaPublicacion: '2026-06-02',
    },
    {
      idHerramienta: 114,
      idPropietario: 6,
      titulo: 'Aspirador seco y húmedo en acero inox 17L para reformas',
      descripcion:
        'Aspirador de gran succión para polvo de obra, serrín, bricolaje o líquidos. Incluye filtro de cartucho lavable, bolsa y boquilla ancha.',
      foto: imgVacuum,
      condiciones: 'Retirar la bolsa si se va a aspirar agua o líquidos. Vaciar depósito antes de devolver.',
      disponibilidad: 'Cualquier tarde en Portal 3',
      precio: 3.5,
      fianza: 25,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Kärcher',
        modelo: 'WD 3 S V-17/4/20',
        potenciaOCapacidad: '1.000W · Depósito 17 L inox',
        peso: '4,8 kg',
        valorReposicion: 129,
      },
      fechaPublicacion: '2026-06-05',
    },
    {
      idHerramienta: 115,
      idPropietario: 5,
      titulo: 'Motosierra compacta a batería 36V espada 30 cm para poda',
      descripcion:
        'Silenciosa y ligera para poda de ramas gruesas, limpieza de patio o corte de leña. Tensor rápido sin herramientas y freno de cadena instantáneo.',
      foto: imgChainsaw,
      condiciones: 'No cortar tocando tierra ni piedras. Se entrega con depósito de aceite de cadena lleno.',
      disponibilidad: 'Fines de semana de 09:30 a 20:00',
      precio: 6,
      fianza: 45,
      estado: 'disponible',
      tipo: 'Jardinería',
      specs: {
        marca: 'STIHL',
        modelo: 'MSA 120 C-B',
        potenciaOCapacidad: '36V AK · Espada 30 cm',
        peso: '2,7 kg',
        valorReposicion: 310,
      },
      fechaPublicacion: '2026-06-11',
    },
    {
      idHerramienta: 116,
      idPropietario: 2,
      titulo: 'Cortabordes y desbrozadora telescópica 20V con cabezal orientable',
      descripcion:
        'Recortabordes inalámbrico con cabezal giratorio 90° para perfilar césped, macizos y juntas de terraza. Muy ligero y manejable.',
      foto: imgTrimmer,
      condiciones: 'Retirar restos de hierba húmeda del protector al terminar.',
      disponibilidad: 'Tardes entre semana y sábados',
      precio: 2.5,
      fianza: 15,
      estado: 'disponible',
      tipo: 'Jardinería',
      specs: {
        marca: 'Gardena',
        modelo: 'ComfortCut 23/18V',
        potenciaOCapacidad: '18V · Ancho corte 23 cm',
        peso: '2,1 kg',
        valorReposicion: 115,
      },
      fechaPublicacion: '2026-06-15',
    },
    {
      idHerramienta: 117,
      idPropietario: 6,
      titulo: 'Detector térmico infrarrojo para fugas, puentes térmicos y humedad',
      descripcion:
        'Localiza pérdidas de aislamiento en ventanas, radiadores obstruidos, humedades ocultas y sobrecalentamiento en cuadros eléctricos.',
      foto: imgThermal,
      condiciones: 'No apuntar el láser hacia los ojos ni exponer la lente a salpicaduras.',
      disponibilidad: 'Horario flexible en Portal 3 · 3ºA',
      precio: 4,
      fianza: 30,
      estado: 'disponible',
      tipo: 'Medición',
      specs: {
        marca: 'Bosch',
        modelo: 'PTD 1 + Termovisión',
        potenciaOCapacidad: '-20 °C a +200 °C · Alerta puente térmico',
        peso: '0,5 kg',
        valorReposicion: 175,
      },
      fechaPublicacion: '2026-06-18',
    },
    {
      idHerramienta: 118,
      idPropietario: 4,
      titulo: 'Cortadora manual de cerámica y gres hasta 51 cm con tope lateral',
      descripcion:
        'Guías de acero cromado rectificadas y rodel de carburo de tungsteno para cortes rectos y diagonales limpios en azulejos de baño y cocina.',
      foto: imgTileCutter,
      condiciones: 'Limpiar el polvo cerámico de las guías tras su uso; no golpear el separador.',
      disponibilidad: 'Lunes a domingo previo aviso',
      precio: 3.5,
      fianza: 25,
      estado: 'disponible',
      tipo: 'Manual',
      specs: {
        marca: 'Rubi',
        modelo: 'Star-51 MAX',
        potenciaOCapacidad: 'Corte 51 cm · Espesor 12 mm',
        peso: '4,9 kg',
        valorReposicion: 140,
      },
      fechaPublicacion: '2026-06-21',
    },
    {
      idHerramienta: 119,
      idPropietario: 5,
      titulo: 'Lijadora jirafa telescópica 710W para paredes, techos y pladur',
      descripcion:
        'Cabezal articulado de 225 mm extensible hasta 1,65 m con manguera de aspiración incluida para alisar gotelé, masilla y techos sin esfuerzo.',
      foto: imgDrywallSander,
      condiciones: 'Conectar a aspirador de obra para minimizar polvo. Incluye 4 discos P120/P180.',
      disponibilidad: 'Fines de semana y tardes en Portal 2',
      precio: 5.5,
      fianza: 40,
      estado: 'disponible',
      tipo: 'Pintura',
      specs: {
        marca: 'Einhell',
        modelo: 'TE-DW 225 X',
        potenciaOCapacidad: '710W · Plato Ø 225 mm · Hasta 1,65 m',
        peso: '4,1 kg',
        valorReposicion: 165,
      },
      fechaPublicacion: '2026-06-25',
    },
    {
      idHerramienta: 120,
      idPropietario: 6,
      titulo: 'Soldador inverter 130A IGBT + careta automática fotosensible',
      descripcion:
        'Equipo portátil para pequeñas reparaciones en verjas, soportes metálicos y herrería doméstica con electrodos de rutilo 1,6 a 3,2 mm.',
      foto: imgWelder,
      condiciones: 'Préstamo solo a vecinos con experiencia previa en soldadura. Incluye careta y piqueta.',
      disponibilidad: 'Sábados y domingos de 10:00 a 19:00',
      precio: 6.5,
      fianza: 50,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Stanley',
        modelo: 'Star 3200 Inverter',
        potenciaOCapacidad: '130A · Electrodos 1,6–3,2 mm',
        peso: '3,9 kg',
        valorReposicion: 230,
      },
      fechaPublicacion: '2026-06-29',
    },
    {
      idHerramienta: 121,
      idPropietario: 4,
      titulo: 'Martillo perforador SDS-Plus 800W con brocas y cincel para hormigón',
      descripcion:
        'Rotomartillo electroneumático con tres modos (perforar, percutir y cincelar) ideal para hormigón armado, rozas ligeras y anclajes de toldos.',
      foto: imgRotaryHammer,
      condiciones: 'Engrasar ligeramente la cola SDS si se usa en techo y devolver las brocas limpias.',
      disponibilidad: 'Lunes a viernes desde las 18:00 · Fines de semana',
      precio: 4.5,
      fianza: 35,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Bosch Professional',
        modelo: 'GBH 2-26 DRE',
        potenciaOCapacidad: '800W · 2,7 J · SDS-Plus',
        peso: '2,8 kg',
        valorReposicion: 195,
      },
      fechaPublicacion: '2026-07-04',
    },
    {
      idHerramienta: 122,
      idPropietario: 3,
      titulo: 'Medidor láser de distancia digital 50 m con pantalla retroiluminada',
      descripcion:
        'Calcula longitudes, superficies, volúmenes y mediciones indirectas por Pitágoras con precisión milimétrica. Incluye funda de cinturón.',
      foto: imgLaserDistance,
      condiciones: 'No apuntar a personas ni superficies reflectantes a corta distancia.',
      disponibilidad: 'Mañanas y tardes en Portal 2 · 4ºC',
      precio: 2,
      fianza: 15,
      estado: 'disponible',
      tipo: 'Medición',
      specs: {
        marca: 'Razor Pro',
        modelo: 'LDM-50',
        potenciaOCapacidad: 'Alcance 0,05–50 m · ±1,5 mm',
        peso: '0,15 kg',
        valorReposicion: 85,
      },
      fechaPublicacion: '2026-07-08',
    },
    {
      idHerramienta: 123,
      idPropietario: 2,
      titulo: 'Banco de trabajo plegable con mordazas de bambú y sujeción rápida',
      descripcion:
        'Mesa auxiliar portátil con doble husillo de apriete, 4 topes orientables y estructura de acero plegable hasta 150 kg de carga.',
      foto: imgWorkbench,
      condiciones: 'No serrar directamente sobre la superficie de bambú sin tablero mártir.',
      disponibilidad: 'Cualquier tarde en Portal 3 · Bajo B',
      precio: 2.5,
      fianza: 20,
      estado: 'disponible',
      tipo: 'Manual',
      specs: {
        marca: 'Wolfcraft',
        modelo: 'MASTER 600',
        potenciaOCapacidad: 'Carga 150 kg · Altura 78–95 cm',
        peso: '13,5 kg',
        valorReposicion: 125,
      },
      fechaPublicacion: '2026-07-11',
    },
    {
      idHerramienta: 124,
      idPropietario: 5,
      titulo: 'Podadora telescópica de yunque + tijera de mano para ramas gruesas',
      descripcion:
        'Conjunto de poda con mangos extensibles de aluminio antideslizantes y cuchillas antiadherentes para setos altos, trepadoras y rosales.',
      foto: imgLopper,
      condiciones: 'Limpiar la savia de las hojas con un paño seco tras podar.',
      disponibilidad: 'Viernes tarde y fines de semana',
      precio: 2,
      fianza: 15,
      estado: 'disponible',
      tipo: 'Jardinería',
      specs: {
        marca: 'Veridia Garden',
        modelo: 'PowerCut 240 Set',
        potenciaOCapacidad: 'Corte hasta Ø 42 mm · 95 cm',
        peso: '1,6 kg',
        valorReposicion: 78,
      },
      fechaPublicacion: '2026-07-15',
    },
    {
      idHerramienta: 125,
      idPropietario: 1,
      titulo: 'Kit profesional de rodillo microfibra, pértiga 2 m y mezclador',
      descripcion:
        'Set completo para pintar habitaciones sin escalera: rodillo antigoteo de 22 cm, mango telescópico de aluminio, cubeta profunda y varilla mezcladora.',
      foto: imgPaintRoller,
      condiciones: 'Lavar bien el rodillo y la cubeta con agua templada nada más terminar.',
      disponibilidad: 'Lunes a domingo previo aviso en Portal 1',
      precio: 0,
      fianza: 10,
      estado: 'disponible',
      tipo: 'Pintura',
      specs: {
        marca: 'Nespoli Pro',
        modelo: 'WallMaster 200',
        potenciaOCapacidad: 'Pértiga 1,1–2,0 m · Rodillo 22 cm',
        peso: '1,4 kg',
        valorReposicion: 48,
      },
      fechaPublicacion: '2026-07-19',
    },
    {
      idHerramienta: 126,
      idPropietario: 6,
      titulo: 'Pulidora excéntrica dual-action 750W con esponjas de acabado',
      descripcion:
        'Pulidora orbital de velocidad electrónica variable (1.800–6.800 opm) para abrillantar carrocería de coche, encimeras o barniz de madera.',
      foto: imgPolisher,
      condiciones: 'Lavar y escurrir las esponjas usadas antes de entregar.',
      disponibilidad: 'Sábados y domingos de 10:00 a 19:00',
      precio: 5,
      fianza: 35,
      estado: 'disponible',
      tipo: 'Eléctrica',
      specs: {
        marca: 'Makita',
        modelo: 'PO5000C Dual',
        potenciaOCapacidad: '750W · Plato Ø 150 mm · 6 vel.',
        peso: '2,6 kg',
        valorReposicion: 260,
      },
      fechaPublicacion: '2026-07-23',
    },
  ];

  const solicitudes: SolicitudData[] = [
    {
      idSolicitud: 501,
      idHerramienta: 101,
      idVecinoSolicitante: 2,
      fechaSolicitud: today,
      fechaInicio: tomorrow,
      fechaFin: inThreeDays,
      franjaRecogida: 'Tarde (18:00–21:00)',
      mensaje:
        'Hola Ana, necesito colgar tres estanterías y un soporte de TV en el salón. Te lo subo con las baterías cargadas.',
      estado: 'Pendiente',
      motivoRechazo: '',
    },
    {
      idSolicitud: 502,
      idHerramienta: 103,
      idVecinoSolicitante: 1,
      fechaSolicitud: today,
      fechaInicio: tomorrow,
      fechaFin: tomorrow,
      franjaRecogida: 'Mañana (10:00–13:00)',
      mensaje:
        'Buenas Marta, queremos alinear unos cuadros en el pasillo este sábado por la mañana. En un par de horas te lo devuelvo.',
      estado: 'Pendiente',
      motivoRechazo: '',
    },
    {
      idSolicitud: 503,
      idHerramienta: 105,
      idVecinoSolicitante: 1,
      fechaSolicitud: fiveDaysAgo,
      fechaInicio: twoDaysAgo,
      fechaFin: tomorrow,
      franjaRecogida: 'Tarde (18:00–21:00)',
      mensaje: 'Hola Carlos, vamos a dar dos manos de pintura blanca al dormitorio principal.',
      estado: 'Aceptada',
      motivoRechazo: '',
      datosEntrega: 'Entrega en Portal 3 Bajo B · Tarde (18:00–21:00)',
    },
    {
      idSolicitud: 504,
      idHerramienta: 102,
      idVecinoSolicitante: 3,
      fechaSolicitud: twelveDaysAgo,
      fechaInicio: twelveDaysAgo,
      fechaFin: tenDaysAgo,
      franjaRecogida: 'Mañana (10:00–13:00)',
      mensaje: 'Necesito cambiar dos focos del techo del recibidor.',
      estado: 'Aceptada',
      motivoRechazo: '',
      datosEntrega: 'Entrega en Portal 3 Bajo B · Mañana (10:00–13:00)',
    },
  ];

  const prestamos: PrestamoData[] = [
    {
      idPrestamo: 701,
      idSolicitud: 503,
      idHerramienta: 105,
      idPrestatario: 1,
      fechaInicio: twoDaysAgo,
      fechaFin: tomorrow,
      franjaRecogida: 'Tarde (18:00–21:00)',
      estado: 'Activo',
      observaciones: '',
      costeTotal: 16,
      fianzaRetenida: 30,
      codigoEntrega: 'PH-0701',
      datosEntrega: 'Entrega en Portal 3 Bajo B · Tarde (18:00–21:00)',
    },
    {
      idPrestamo: 702,
      idSolicitud: 504,
      idHerramienta: 102,
      idPrestatario: 3,
      fechaInicio: twelveDaysAgo,
      fechaFin: tenDaysAgo,
      franjaRecogida: 'Mañana (10:00–13:00)',
      estado: 'Finalizado',
      observaciones: 'Devuelta limpia y con los bloqueos revisados.',
      costeTotal: 7.5,
      fianzaRetenida: 20,
      codigoEntrega: 'PH-0702',
      datosEntrega: 'Entrega en Portal 3 Bajo B · Mañana (10:00–13:00)',
    },
    {
      idPrestamo: 703,
      idSolicitud: 0,
      idHerramienta: 113,
      idPrestatario: 4,
      fechaInicio: addDaysISO(now, -18),
      fechaFin: addDaysISO(now, -16),
      franjaRecogida: 'Tarde (18:00–21:00)',
      estado: 'Finalizado',
      observaciones: 'Disco limpio y maletín completo.',
      costeTotal: 9,
      fianzaRetenida: 25,
      codigoEntrega: 'PH-0703',
      datosEntrega: 'Entrega en Portal 2 1ºD · Tarde (18:00–21:00)',
    },
    {
      idPrestamo: 704,
      idSolicitud: 0,
      idHerramienta: 118,
      idPrestatario: 5,
      fechaInicio: addDaysISO(now, -22),
      fechaFin: addDaysISO(now, -20),
      franjaRecogida: 'Mañana (10:00–13:00)',
      estado: 'Finalizado',
      observaciones: 'Guías engrasadas y limpias.',
      costeTotal: 10.5,
      fianzaRetenida: 25,
      codigoEntrega: 'PH-0704',
      datosEntrega: 'Entrega en Portal 1 5ºB · Mañana (10:00–13:00)',
    },
  ];

  const ampliaciones: SolicitudAmpliacionData[] = [
    {
      idAmpliacion: 801,
      idPrestamo: 701,
      nuevaFechaFin: addDaysISO(now, 2),
      motivo: 'Nos falta dar la segunda mano de acabado en la pared de la ventana. ¿Podemos devolverla un día después?',
      estado: 'Pendiente',
      fechaCreacion: today,
    },
  ];

  const incidencias: IncidenciaData[] = [
    {
      idIncidencia: 601,
      idPrestamo: 702,
      idHerramienta: 102,
      idReportante: 2,
      gravedad: 'Leve',
      descripcion: 'Una de las tapas plásticas de la zapata inferior llegó ligeramente suelta; se reajustó sin daño funcional.',
      fecha: tenDaysAgo,
      estado: 'Resuelta',
      resolucion: 'Zapata fijada con tornillo nuevo por el propietario. Sin coste adicional.',
    },
  ];

  const resenas: ResenaData[] = [
    {
      idResena: 901,
      idPrestamo: 0,
      idHerramienta: 101,
      autor: 'Carlos Ruiz',
      idAutor: 2,
      puntuacion: 5,
      comentario: 'Tiene mucha fuerza en hormigón y las brocas están nuevas. Ana me lo entregó puntualísima.',
      fecha: '2026-04-12',
    },
    {
      idResena: 902,
      idPrestamo: 702,
      idHerramienta: 102,
      autor: 'Marta Jiménez',
      idAutor: 3,
      puntuacion: 5,
      comentario: 'Muy estable y práctica para subirla en el ascensor sin rozar nada.',
      fecha: tenDaysAgo,
    },
    {
      idResena: 903,
      idPrestamo: 0,
      idHerramienta: 103,
      autor: 'Javier Navarro',
      idAutor: 4,
      puntuacion: 5,
      comentario: 'El haz verde se ve muy bien incluso de día. El trípode incluido ayuda muchísimo.',
      fecha: '2026-04-28',
    },
    {
      idResena: 904,
      idPrestamo: 0,
      idHerramienta: 107,
      autor: 'Carlos Ruiz',
      idAutor: 2,
      puntuacion: 4,
      comentario: 'Dejó el suelo de la terraza impecable en veinte minutos. Necesita toma de agua cercana.',
      fecha: '2026-05-09',
    },
    {
      idResena: 905,
      idPrestamo: 0,
      idHerramienta: 109,
      autor: 'Ana García',
      idAutor: 1,
      puntuacion: 5,
      comentario: 'Cortes limpios sin astillar en tablero de pino. Javier me explicó el ajuste de profundidad en un minuto.',
      fecha: '2026-05-12',
    },
    {
      idResena: 906,
      idPrestamo: 0,
      idHerramienta: 112,
      autor: 'Carlos Ruiz',
      idAutor: 2,
      puntuacion: 5,
      comentario: 'El buscapolos sin contacto me ahorró desmontar dos cajas de registro.',
      fecha: '2026-05-18',
    },
    {
      idResena: 907,
      idPrestamo: 703,
      idHerramienta: 113,
      autor: 'Javier Navarro',
      idAutor: 4,
      puntuacion: 5,
      comentario: 'Corté cuatro pernos oxidados de la terraza en cinco minutos. Muy cómoda de manejar.',
      fecha: addDaysISO(now, -16),
    },
    {
      idResena: 908,
      idPrestamo: 704,
      idHerramienta: 118,
      autor: 'Laura Morales',
      idAutor: 5,
      puntuacion: 5,
      comentario: 'Corta el porcelánico recto a la primera sin desportillar el esmalte.',
      fecha: addDaysISO(now, -20),
    },
    {
      idResena: 909,
      idPrestamo: 0,
      idHerramienta: 117,
      autor: 'Ana García',
      idAutor: 1,
      puntuacion: 5,
      comentario: 'Localizamos en minutos por dónde entraba aire frío en el ventanal del salón.',
      fecha: addDaysISO(now, -8),
    },
    {
      idResena: 910,
      idPrestamo: 0,
      idHerramienta: 121,
      autor: 'Carlos Ruiz',
      idAutor: 2,
      puntuacion: 5,
      comentario: 'Hice los seis taladros del toldo en hormigón armado sin ningún esfuerzo; con taladro normal era imposible.',
      fecha: addDaysISO(now, -1),
    },
    {
      idResena: 911,
      idPrestamo: 0,
      idHerramienta: 125,
      autor: 'Laura Morales',
      idAutor: 5,
      puntuacion: 5,
      comentario: 'Pintamos todo el techo del pasillo en una mañana sin necesidad de sacar escalera. Muy limpio todo.',
      fecha: addDaysISO(now, -2),
    },
    {
      idResena: 912,
      idPrestamo: 0,
      idHerramienta: 122,
      autor: 'Sergio Delgado',
      idAutor: 6,
      puntuacion: 5,
      comentario: 'Medimos todas las habitaciones para pedir las cortinas y encargar suelo vinílico en diez minutos.',
      fecha: addDaysISO(now, -3),
    },
    {
      idResena: 913,
      idPrestamo: 0,
      idHerramienta: 123,
      autor: 'Marta Jiménez',
      idAutor: 3,
      puntuacion: 4,
      comentario: 'Muy sólido para lijar y cepillar dos puertas del dormitorio en el patio sin dañar la mesa.',
      fecha: addDaysISO(now, -4),
    },
    {
      idResena: 914,
      idPrestamo: 0,
      idHerramienta: 115,
      autor: 'Javier Navarro',
      idAutor: 4,
      puntuacion: 5,
      comentario: 'Apenas hace ruido y cortó todas las ramas secas del naranjo del patio en media hora.',
      fecha: addDaysISO(now, -5),
    },
    {
      idResena: 915,
      idPrestamo: 0,
      idHerramienta: 126,
      autor: 'Carlos Ruiz',
      idAutor: 2,
      puntuacion: 5,
      comentario: 'Dejó los faros y el capó del coche como recién salido del taller. Sergio me dio el truco de las pasadas.',
      fecha: addDaysISO(now, -6),
    },
  ];

  return {
    vecinos,
    herramientas,
    solicitudes,
    prestamos,
    ampliaciones,
    incidencias,
    resenas,
    favoritos: {
      1: [103, 107, 117],
      2: [101, 109, 113],
    },
  };
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedDatabase();
      saveDatabase(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as AppDatabase;
    if (!parsed.vecinos?.length || !parsed.herramientas?.length) {
      const seed = createSeedDatabase();
      saveDatabase(seed);
      return seed;
    }
    const migratedTools = parsed.herramientas.map((h) => ({
      ...h,
      foto: LEGACY_IMAGE_MAP[h.foto] || h.foto,
      estado: normalizeEstadoHerramienta(h.estado),
    }));
    return { ...parsed, herramientas: migratedTools };
  } catch {
    const seed = createSeedDatabase();
    saveDatabase(seed);
    return seed;
  }
}

export function saveDatabase(db: AppDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function updateNeighborProfile(
  db: AppDatabase,
  idVecino: number,
  updates: { nombre: string; direccion: string; email: string; telefono: string }
): AppDatabase {
  const nombre = updates.nombre.trim();
  const direccion = updates.direccion.trim();
  const email = updates.email.trim();
  const telefono = updates.telefono.trim();

  if (nombre.length < 3 || !email.includes('@') || direccion.length < 3) {
    throw new Error('Revisa que nombre, vivienda y correo electrónico sean válidos.');
  }

  const emailTaken = db.vecinos.some(
    (v) => v.idVecino !== idVecino && v.email.toLowerCase() === email.toLowerCase()
  );
  if (emailTaken) {
    throw new Error('Ese correo electrónico ya pertenece a otro vecino.');
  }

  const nextDb: AppDatabase = {
    ...db,
    vecinos: db.vecinos.map((v) =>
      v.idVecino === idVecino ? { ...v, nombre, direccion, email, telefono } : v
    ),
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function updateTool(
  db: AppDatabase,
  idHerramienta: number,
  updates: Partial<HerramientaData>
): AppDatabase {
  const nextDb: AppDatabase = {
    ...db,
    herramientas: db.herramientas.map((h) => (h.idHerramienta === idHerramienta ? { ...h, ...updates } : h)),
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function deleteTool(db: AppDatabase, idHerramienta: number): AppDatabase {
  const tool = db.herramientas.find((h) => h.idHerramienta === idHerramienta);
  if (!tool) throw new Error('Herramienta no encontrada.');
  if (tool.estado === 'presentada') {
    throw new Error('No se puede eliminar una herramienta presentada en un préstamo en curso.');
  }
  const nextDb: AppDatabase = {
    ...db,
    herramientas: db.herramientas.filter((h) => h.idHerramienta !== idHerramienta),
    solicitudes: db.solicitudes.filter(
      (s) => !(s.idHerramienta === idHerramienta && s.estado === 'Pendiente')
    ),
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function getToolBookedDates(db: AppDatabase, idHerramienta: number): { start: string; end: string }[] {
  return db.prestamos
    .filter((p) => p.idHerramienta === idHerramienta && p.estado !== 'Finalizado')
    .map((p) => ({ start: p.fechaInicio, end: p.fechaFin }));
}

export function resolveIncident(db: AppDatabase, idIncidencia: number, resolucion: string): AppDatabase {
  if (resolucion.trim().length < 4) {
    throw new Error('Añade una nota explicando cómo se resolvió la incidencia.');
  }
  const nextDb: AppDatabase = {
    ...db,
    incidencias: db.incidencias.map((inc) =>
      inc.idIncidencia === idIncidencia
        ? { ...inc, estado: 'Resuelta', resolucion: resolucion.trim() }
        : inc
    ),
  };
  saveDatabase(nextDb);
  return nextDb;
}

export function getToolRatingStats(
  resenas: ResenaData[],
  idHerramienta: number
): { average: number; count: number } {
  const list = resenas.filter((r) => r.idHerramienta === idHerramienta);
  if (!list.length) return { average: 0, count: 0 };
  const total = list.reduce((acc, item) => acc + item.puntuacion, 0);
  return { average: Number((total / list.length).toFixed(1)), count: list.length };
}
