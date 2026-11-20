// ============================================================================
// CARTECH AUTOMÓVILES - SISTEMA CLOUD DE GESTIÓN DE VEHÍCULOS, PERITAJE, CRM,
// UBICACIONES DE DINERO LIBRE (LIQUIDEZ), CAPITAL POR SOCIO Y WHATSAPP
// Persistencia 100% en la Nube (Cero Localhost) • Formato es-CO • PC & POCO F8 Ultra
// ============================================================================

const IS_PROD_ENV = location.hostname.includes('netlify.app');
const STORAGE_KEY = IS_PROD_ENV ? 'autogest_pro_db_v1' : 'cartech_pruebas_db_v1';
const AUTH_SESSION_KEY = IS_PROD_ENV ? 'cartech_auth_session_prod_v1' : 'cartech_auth_session_pruebas_v1';
const CLOUD_SYNC_TOPIC = IS_PROD_ENV
  ? 'autogest_pro_sync_ctellez_94827104'
  : 'cartech_pruebas_sync_ctellez_94827104';
const CLOUD_SYNC_URL = `https://ntfy.sh/${CLOUD_SYNC_TOPIC}`;
const DEVICE_ID = 'cartech-' + Math.random().toString(36).slice(2, 10);
let isSyncingFromCloud = false;

let currentActiveModule = 'home';
let currentInventoryStatusTab = 'DISPONIBLES'; // 'DISPONIBLES' | 'En Compra' | 'Alistamiento' | 'Publicado' | 'Vendido' | 'TODOS'
let currentProspectCategory = 'VENTA'; // 'VENTA' | 'COMPRA'
let currentProspectStatusTab = 'TODOS'; // 'TODOS' | 'Nuevo' | 'En negociación' | 'Cerrado' | 'Frío'
let currentDirectoryProfileTab = 'TODOS'; // 'TODOS' | 'CLIENTE_FINAL' | 'COMERCIANTE' | 'PROVEEDOR'
let currentPeriodMode = 'MES'; // 'SEMANA' | 'MES' | 'ANIO' | 'TODOS'
let selectedWhatsAppTemplateId = 'VENTA_1';

// ============================================================================
// PLANTILLAS OFICIALES DE WHATSAPP (VENTA Y COMPRA) - CARTECH AUTOMÓVILES
// ============================================================================
const WHATSAPP_TEMPLATES = [
  {
    id: 'VENTA_1',
    categoria: 'VENTA',
    titulo: '🏷️ Plantilla Venta 1 (Primer contacto)',
    template: '¡Hola {nombre}! Te saluda Carlos de Cartech Automóviles 👋. Vi que te interesó el {vehiculo} (${precio}). Está listo para traspaso. ¿Te envío el peritaje o agendamos para que lo veas hoy?'
  },
  {
    id: 'VENTA_2',
    categoria: 'VENTA',
    titulo: '🏷️ Plantilla Venta 2 (Seguimiento)',
    template: '¡Hola {nombre}! Seguimos teniendo el {vehiculo} disponible, aunque ya hay interesados revisándolo. ¿Sigues buscando vehículo o lo revisamos sin compromiso?'
  },
  {
    id: 'COMPRA_1',
    categoria: 'COMPRA',
    titulo: '🚗 Plantilla Compra 1 (Captación dueño directo)',
    template: '¡Hola {nombre}! Soy Carlos de Cartech Automóviles 👋. Vi tu {vehiculo} publicado y me interesa comprarlo de contado para inventario. Si sigue disponible, dime en cuánto lo negocias y miramos cómo cerramos rápido.'
  },
  {
    id: 'COMPRA_2',
    categoria: 'COMPRA',
    titulo: '🚗 Plantilla Compra 2 (Oferta firme tras revisión)',
    template: 'Hola {nombre}, revisamos los números del {vehiculo}. Teniendo en cuenta alistamiento y valor comercial, nuestra oferta firme de compra inmediata es de ${precio}, pago hoy mismo y trámite a nuestro cargo. ¿Cerramos?'
  }
];

// ============================================================================
// CATÁLOGO PRECARGADO DE MARCAS Y REFERENCIAS COMUNES EN COLOMBIA
// ============================================================================
const COLOMBIA_VEHICLES_CATALOG = {
  'Mazda': [
    'Mazda 2 Sport', 'Mazda 2 Sedán', 'Mazda 2 Grand Touring LX',
    'Mazda 3 Sedán', 'Mazda 3 Sport', 'Mazda 3 Grand Touring LX',
    'Mazda CX-30 Touring', 'Mazda CX-30 Grand Touring', 'Mazda CX-30 Grand Touring LX',
    'Mazda CX-5 Touring', 'Mazda CX-5 Grand Touring', 'Mazda CX-50', 'Mazda CX-9', 'Mazda CX-90', 'Mazda BT-50'
  ],
  'Chevrolet': [
    'Chevrolet Spark GT', 'Chevrolet Spark Life', 'Chevrolet Beat', 'Chevrolet Sail',
    'Chevrolet Joy Sedán / HB', 'Chevrolet Onix Turbo Sedán', 'Chevrolet Onix Turbo RS',
    'Chevrolet Onix Premier', 'Chevrolet Aveo', 'Chevrolet Sonic', 'Chevrolet Cruze',
    'Chevrolet Tracker Turbo', 'Chevrolet Captiva Turbo', 'Chevrolet Equinox',
    'Chevrolet Blazer RS', 'Chevrolet Trailblazer', 'Chevrolet Tahoe', 'Chevrolet Colorado',
    'Chevrolet D-Max', 'Chevrolet N300 / N400', 'Chevrolet NHR / NPR'
  ],
  'Renault': [
    'Renault Logan', 'Renault Logan Intens / Life / Zen', 'Renault Sandero', 'Renault Stepway',
    'Renault Kwid Iconic / Outsider / Zen', 'Renault Duster', 'Renault Duster 1.3 Turbo 4x4',
    'Renault Duster Oroch', 'Renault Kardian', 'Renault Captur', 'Renault Koleos',
    'Renault Arkana Híbrida', 'Renault Twingo', 'Renault Clio', 'Renault Fluence', 'Renault Kangoo', 'Renault Master'
  ],
  'Toyota': [
    'Toyota Corolla Cross XEI', 'Toyota Corolla Cross SEG Híbrida', 'Toyota Corolla Cross XLI',
    'Toyota Corolla Sedán XEI / SEG Híbrido', 'Toyota Hilux 4x4 Diesel', 'Toyota Hilux SRX 4x4 Diesel',
    'Toyota Hilux Gasolina', 'Toyota Fortuner SW4 Diesel', 'Toyota Fortuner SW4 Gasolina',
    'Toyota Fortuner SRV', 'Toyota Prado TXL Diesel', 'Toyota Prado TXL Gasolina',
    'Toyota Prado VX', 'Toyota Prado Sumo', 'Toyota Land Cruiser 300',
    'Toyota 4Runner SR5 / Limited', 'Toyota RAV4 Híbrida / Gasolina', 'Toyota Yaris Cross Híbrida',
    'Toyota Yaris Sport / Sedán', 'Toyota Rush'
  ],
  'Kia': [
    'Kia Picanto Ion / Vibrant', 'Kia Picanto GT-Line / Zenith', 'Kia Rio Vibrant / Zenith',
    'Kia Soluto', 'Kia K3 Sedán', 'Kia K3 Cross', 'Kia Cerato', 'Kia Sonet', 'Kia Seltos',
    'Kia Sportage', 'Kia Sportage Zenith Híbrida', 'Kia Niro Híbrido', 'Kia Sorento', 'Kia EV5 / EV6'
  ],
  'Nissan': [
    'Nissan March Active / Sense / Advance', 'Nissan Versa Sense / Advance / Exclusive',
    'Nissan Sentra SR / Exclusive', 'Nissan Kicks Sense / Advance / e-POWER', 'Nissan Qashqai',
    'Nissan X-Trail e-POWER / Exclusive', 'Nissan Frontier Diesel 4x4 (NP300 / Pro-4X)',
    'Nissan Frontier Gasolina', 'Nissan Tiida', 'Nissan Murano', 'Nissan Patrol'
  ],
  'Suzuki': [
    'Suzuki Swift Híbrido', 'Suzuki Swift Dzire / Sedán', 'Suzuki Vitara Live / AllGrip',
    'Suzuki Grand Vitara Híbrida', 'Suzuki S-Cross', 'Suzuki Jimny 3 Puertas',
    'Suzuki Jimny 5 Puertas', 'Suzuki Baleno', 'Suzuki Alto', 'Suzuki Celerio', 'Suzuki Ertiga'
  ],
  'Volkswagen': [
    'Volkswagen Gol', 'Volkswagen Voyage', 'Volkswagen Polo Track / Comfortline / GTS',
    'Volkswagen Virtus', 'Volkswagen Jetta GLI / Comfortline', 'Volkswagen Nivus Comfortline / Highline',
    'Volkswagen T-Cross', 'Volkswagen Taos', 'Volkswagen Tiguan Allspace', 'Volkswagen Amarok V6 / 2.0', 'Volkswagen Saveiro'
  ],
  'Ford': [
    'Ford Fiesta Sedán / Hatchback', 'Ford EcoSport', 'Ford Escape EcoBoost',
    'Ford Escape Híbrida SE / Titanium', 'Ford Bronco Sport Big Bend / Wildtrak',
    'Ford Territory', 'Ford Edge SEL / ST', 'Ford Explorer XLT / Limited / ST',
    'Ford Ranger XLT / Limited Diesel', 'Ford Ranger Raptor', 'Ford F-150 Lariat / Raptor'
  ],
  'Hyundai': [
    'Hyundai Grand i10 HB / Sedán', 'Hyundai HB20 Getz / Accent', 'Hyundai Elantra',
    'Hyundai Venue', 'Hyundai Creta', 'Hyundai Kona Híbrida / Eléctrica',
    'Hyundai Tucson NX4', 'Hyundai Santa Fe', 'Hyundai Palisade'
  ],
  'BYD': [
    'BYD Seagull Eléctrico', 'BYD Yuan Up Eléctrico', 'BYD Yuan Plus Eléctrico',
    'BYD Song Plus DM-i Híbrida', 'BYD Qin Plus DM-i', 'BYD Dolphin'
  ],
  'BMW / Mercedes / Audi': [
    'BMW 320i / 330i', 'BMW 118i / 128ti', 'BMW X1 sDrive18i / sDrive20i', 'BMW X3 xDrive30i',
    'BMW X4', 'BMW X5', 'Mercedes-Benz A200', 'Mercedes-Benz C180 / C200',
    'Mercedes-Benz GLA 200', 'Mercedes-Benz GLC 300', 'Mercedes-Benz GLE 450', 'Audi A3 / A4', 'Audi Q2 / Q3 / Q5'
  ],
  'Honda / Subaru / Mitsubishi / Jeep': [
    'Honda CR-V', 'Honda HR-V', 'Honda ZR-V', 'Honda Civic', 'Honda City',
    'Subaru Crosstrek / XV Híbrido', 'Subaru Forester Híbrida', 'Subaru Outback',
    'Mitsubishi Montero Sport', 'Mitsubishi L200 Sportero', 'Mitsubishi ASX / Eclipse Cross',
    'Jeep Renegade', 'Jeep Compass', 'Jeep Commander', 'Jeep Wrangler Rubicon'
  ]
};

// ============================================================================
// 1. FORMATO NUMÉRICO ESTÁNDAR COLOMBIA (es-CO) Y VALIDACIÓN ESTRICTA
// ============================================================================
function formatNumberWithDots(amount) {
  const num = Math.round(Number(amount) || 0);
  const sign = num < 0 ? '-' : '';
  return sign + Math.abs(num).toLocaleString('es-CO');
}

function formatCOP(amount) {
  return '$ ' + formatNumberWithDots(amount);
}

function parseCurrencyInput(val) {
  if (typeof val === 'number') return Math.round(val);
  const cleaned = String(val || '').replace(/[^0-9-]/g, '');
  return Number(cleaned) || 0;
}

function formatCurrencyInput(inputEl) {
  if (!inputEl) return;
  const digits = String(inputEl.value || '').replace(/[^0-9]/g, '');
  if (!digits) {
    inputEl.value = '';
    return;
  }
  inputEl.value = Number(digits).toLocaleString('es-CO');
}

function enforceOnlyDigits(inputEl, maxLen = 10) {
  if (!inputEl) return;
  inputEl.value = String(inputEl.value || '').replace(/[^0-9]/g, '').slice(0, maxLen);
}

function enforcePhoneDigits(inputEl) {
  if (!inputEl) return;
  inputEl.value = String(inputEl.value || '').replace(/[^0-9]/g, '').slice(0, 15);
}

function enforceAlphanumericPlate(inputEl) {
  if (!inputEl) return;
  inputEl.value = String(inputEl.value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 10);
}

function enforceLettersAndSpaces(inputEl) {
  if (!inputEl) return;
  inputEl.value = String(inputEl.value || '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s./-]/g, '');
}

document.addEventListener('keydown', (e) => {
  const target = e.target;
  if (target && target.tagName === 'INPUT' && target.getAttribute('inputmode') === 'numeric') {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  }
});

// ============================================================================
// UTILIDADES DE FECHAS
// ============================================================================
function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getISOWeekString(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayNum = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - dayNum);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getVehicleColorAndKm(v) {
  let color = v.color || '';
  let km = typeof v.kilometraje === 'number' ? v.kilometraje : 0;

  if (!color && !km && v.colorKm) {
    const raw = String(v.colorKm);
    const numMatch = raw.match(/([\d.]+)\s*km/i) || raw.match(/([\d.]+)/);
    if (numMatch) km = parseCurrencyInput(numMatch[1]);
    color = raw.replace(/[\d.]+\s*km/i, '').replace(/[•\-]/g, '').trim();
  }
  return { color: color || 'Sin especificar', km };
}

// ============================================================================
// DATOS POR DEFECTO Y ESTRUCTURA DE BASE DE DATOS CLOUD
// ============================================================================
function getDefaultMoneyLocations() {
  return [
    {
      id: 'mloc-bancolombia',
      tipo: 'Banco',
      nombre: 'Bancolombia',
      ubicacionFisica: '',
      saldo: 0
    },
    {
      id: 'mloc-nu',
      tipo: 'Banco',
      nombre: 'Nu Bank',
      ubicacionFisica: '',
      saldo: 0
    },
    {
      id: 'mloc-caja-oficina',
      tipo: 'Efectivo',
      nombre: 'Efectivo Caja Fuerte',
      ubicacionFisica: 'Caja fuerte oficina Cartech',
      saldo: 0
    },
    {
      id: 'mloc-efectivo-carlos',
      tipo: 'Efectivo',
      nombre: 'Efectivo Disponible Carlos',
      ubicacionFisica: 'Efectivo personal Carlos',
      saldo: 0
    }
  ];
}

function getDefaultPartnersList() {
  return [
    { id: 'soc-taty', nombre: 'Taty', tipo: 'Inversionista', telefono: '', documento: '', notas: 'Socia Cartech' },
    { id: 'soc-henry', nombre: 'Henry', tipo: 'Inversionista', telefono: '', documento: '', notas: 'Socio Cartech' },
    { id: 'soc-daniel', nombre: 'Daniel', tipo: 'Negocio', telefono: '', documento: '', notas: 'Socio de Negocio' },
    { id: 'soc-william', nombre: 'William', tipo: 'Negocio', telefono: '', documento: '', notas: 'Socio de Negocio' },
    { id: 'soc-jimmy', nombre: 'Jimmy', tipo: 'Negocio', telefono: '', documento: '', notas: 'Socio de Negocio' }
  ];
}

function getInitialData() {
  return {
    updatedAt: 0,
    moneyLocations: getDefaultMoneyLocations(),
    partners: getDefaultPartnersList(),
    vehicles: [],
    prospects: [],
    directoryProfiles: [],
    ownExpenses: []
  };
}

function ensureDBStructure(data) {
  if (!data || typeof data !== 'object') return getInitialData();
  if (!Array.isArray(data.vehicles)) data.vehicles = [];
  if (!Array.isArray(data.partners)) data.partners = [];
  if (!Array.isArray(data.ownExpenses)) data.ownExpenses = [];
  if (!Array.isArray(data.prospects)) data.prospects = [];
  if (!Array.isArray(data.directoryProfiles)) data.directoryProfiles = [];
  if (!Array.isArray(data.moneyLocations) || data.moneyLocations.length === 0) {
    data.moneyLocations = getDefaultMoneyLocations();
  }

  // Asegurar que cada prospecto tenga categoría 'VENTA' o 'COMPRA'
  data.prospects.forEach((p) => {
    if (!p.tipo) p.tipo = 'VENTA';
  });

  // Asegurar que los socios clave (Taty, Henry, Daniel, William, Jimmy) estén creados si la lista estaba vacía
  if (data.partners.length === 0 && !data.partnersCleanedManually) {
    data.partners = getDefaultPartnersList();
  }

  return data;
}

let db = loadDB();

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return ensureDBStructure(JSON.parse(raw));
  } catch (e) {
    return getInitialData();
  }
}

// ============================================================================
// PERSISTENCIA 100% EN LA NUBE (CERO LOCALHOST)
// ============================================================================
function saveDB() {
  db = ensureDBStructure(db);
  db.updatedAt = Date.now();
  db.lastDeviceId = DEVICE_ID;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  updateAllViews();
  pushToCloud();
}

function setSyncStatusUI(text, isOk = true) {
  const el = document.getElementById('save-status-indicator');
  const btn = document.getElementById('btn-cloud-sync');
  const envLabel = IS_PROD_ENV ? '☁️ Producción Cartech' : '🧪 Entorno PRUEBAS';
  if (el) {
    el.innerHTML = IS_PROD_ENV ? text : `🧪 PRUEBAS • Nube aislada`;
    el.style.color = IS_PROD_ENV ? (isOk ? '#34d399' : '#fcd34d') : '#fbbf24';
    el.style.background = IS_PROD_ENV ? (isOk ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)') : 'rgba(245, 158, 11, 0.18)';
  }
  if (btn) {
    btn.textContent = isOk ? envLabel : '🔄 Sincronizando...';
  }
}

async function pushToCloud() {
  const payloadStr = JSON.stringify({
    type: 'AUTOGEST_DB_SYNC',
    deviceId: DEVICE_ID,
    updatedAt: db.updatedAt,
    db: db
  });

  try {
    const res = await fetch(CLOUD_SYNC_URL, {
      method: 'POST',
      headers: {
        'Title': 'CartechCloudSync',
        'Cache': 'yes'
      },
      body: payloadStr
    });
    if (res.ok) {
      setSyncStatusUI('☁️ Nube Cartech Activa', true);
    }
  } catch (_) {}
}

async function applyIncomingSyncPayload(rawMessageObj, forceAccept = false) {
  try {
    let rawJson = rawMessageObj.message;
    if (rawMessageObj.attachment && rawMessageObj.attachment.url) {
      const attRes = await fetch(rawMessageObj.attachment.url);
      rawJson = await attRes.text();
    }
    if (!rawJson || !rawJson.startsWith('{')) return false;

    const parsed = JSON.parse(rawJson);
    if (parsed && parsed.type === 'AUTOGEST_DB_SYNC' && parsed.db && Array.isArray(parsed.db.vehicles)) {
      const incomingTime = Number(parsed.updatedAt || parsed.db.updatedAt) || 0;
      const localTime = Number(db.updatedAt) || 0;

      if (forceAccept || incomingTime > localTime) {
        db = ensureDBStructure(parsed.db);
        db.updatedAt = incomingTime;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        const anyModalOpen = document.querySelector('.modal-backdrop.open');
        if (!anyModalOpen) {
          updateAllViews();
        }
        const timeStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setSyncStatusUI(`☁️ Nube al día (${timeStr})`, true);
        return true;
      }
    }
  } catch (_) {}
  return false;
}

async function pullFromCloud(manualTrigger = false) {
  if (isSyncingFromCloud) return;
  isSyncingFromCloud = true;

  try {
    const res = await fetch(`${CLOUD_SYNC_URL}/json?poll=1&since=all`, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      let newestSyncEvent = null;
      let newestTimestamp = -1;

      for (const line of lines) {
        try {
          const evt = JSON.parse(line);
          if (evt.event === 'message' && evt.time >= newestTimestamp) {
            if (evt.attachment || (evt.message && evt.message.includes('AUTOGEST_DB_SYNC'))) {
              newestTimestamp = evt.time;
              newestSyncEvent = evt;
            }
          }
        } catch (_) {}
      }

      if (newestSyncEvent) {
        await applyIncomingSyncPayload(newestSyncEvent, manualTrigger);
      } else if ((Number(db.updatedAt) || 0) > 0) {
        await pushToCloud();
      }
      setSyncStatusUI('☁️ Nube Cartech Activa', true);
    }
  } catch (_) {}

  isSyncingFromCloud = false;
}

function startRealtimeCloudListener() {
  if (typeof EventSource === 'undefined') return;
  try {
    const es = new EventSource(`${CLOUD_SYNC_URL}/sse`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.event === 'message') {
          applyIncomingSyncPayload(data);
        }
      } catch (_) {}
    };
  } catch (_) {}
}

async function forceCloudSyncNow() {
  await pullFromCloud(true);
  if ((Number(db.updatedAt) || 0) > 0) {
    await pushToCloud();
  }
}

function clearDemoData() {
  if (!confirm('¿Deseas limpiar los vehículos, prospectos y gastos para empezar en blanco en todos tus dispositivos (conservando tus ubicaciones de dinero y socios base)?')) return;
  db = {
    updatedAt: Date.now(),
    moneyLocations: db.moneyLocations || getDefaultMoneyLocations(),
    partners: getDefaultPartnersList(),
    vehicles: [],
    prospects: [],
    ownExpenses: []
  };
  saveDB();
}

// ============================================================================
// CÁLCULO ESTRICTO DE CAPITAL INVERTIDO (PROPIO CARLOS VS. SOCIOS INDIVIDUALIZADO)
// ============================================================================
function calculateVehicleFinancials(veh) {
  const gastos = Array.isArray(veh.gastos) ? veh.gastos : [];
  const totalAlistamiento = gastos
    .filter((g) => g.tipo === 'Alistamiento')
    .reduce((acc, g) => acc + (Number(g.valor) || 0), 0);
  const totalComisiones = gastos
    .filter((g) => g.tipo === 'Comisión')
    .reduce((acc, g) => acc + (Number(g.valor) || 0), 0);

  const precioCompra = Number(veh.precioCompra) || 0;
  const costoTotal = precioCompra + totalAlistamiento + totalComisiones;

  const esVendido = veh.estado === 'Vendido';
  const precioReferenciaVenta = Number(veh.precioVenta) || Number(veh.precioPublicado) || 0;

  const gananciaNeta = precioReferenciaVenta - costoTotal;
  const margenPct = costoTotal > 0 ? (gananciaNeta / costoTotal) * 100 : 0;

  const modalidad = veh.modalidadSocio || 'PROPIO';
  const numNegocio = Math.max(2, Number(veh.numSociosNegocio) || 2);

  const invPartner = db.partners.find((p) => p.id === veh.socioInversionistaId);
  const negPartners = (veh.sociosNegocioIds || [])
    .map((id) => db.partners.find((p) => p.id === id))
    .filter(Boolean);

  // 1. Cálculo de Capital Aportado en la COMPRA del vehículo (Carlos vs Cada Socio)
  let capitalCompraCarlos = precioCompra;
  const capitalPorSocioMap = {}; // partnerId -> monto capital aportado en este vehículo

  if (modalidad === 'PROPIO') {
    capitalCompraCarlos = precioCompra;
  } else if (modalidad === 'INVERSIONISTA') {
    if (typeof veh.capitalCompraCarlos === 'number' && !Number.isNaN(veh.capitalCompraCarlos)) {
      capitalCompraCarlos = Math.min(precioCompra, Math.max(0, veh.capitalCompraCarlos));
    } else {
      // Por defecto en Inversionista 50/50 o según aporte
      capitalCompraCarlos = Math.round(precioCompra * 0.5);
    }
    const capInv = Math.max(0, precioCompra - capitalCompraCarlos);
    if (veh.socioInversionistaId) {
      capitalPorSocioMap[veh.socioInversionistaId] = (capitalPorSocioMap[veh.socioInversionistaId] || 0) + capInv;
    }
  } else if (modalidad === 'NEGOCIO') {
    if (typeof veh.capitalCompraCarlos === 'number' && !Number.isNaN(veh.capitalCompraCarlos)) {
      capitalCompraCarlos = Math.min(precioCompra, Math.max(0, veh.capitalCompraCarlos));
    } else {
      capitalCompraCarlos = Math.round(precioCompra / numNegocio);
    }
    const capRestanteNegocio = Math.max(0, precioCompra - capitalCompraCarlos);
    const numOtrosSocios = negPartners.length > 0 ? negPartners.length : (numNegocio - 1);
    const capCadaSocio = numOtrosSocios > 0 ? capRestanteNegocio / numOtrosSocios : 0;
    negPartners.forEach((p) => {
      capitalPorSocioMap[p.id] = (capitalPorSocioMap[p.id] || 0) + capCadaSocio;
    });
  } else if (modalidad === 'COMBINADO') {
    const capInv = Math.round(precioCompra * 0.5);
    if (veh.socioInversionistaId) {
      capitalPorSocioMap[veh.socioInversionistaId] = (capitalPorSocioMap[veh.socioInversionistaId] || 0) + capInv;
    }
    const mitadNegocio = precioCompra - capInv;
    if (typeof veh.capitalCompraCarlos === 'number' && !Number.isNaN(veh.capitalCompraCarlos)) {
      capitalCompraCarlos = Math.min(mitadNegocio, Math.max(0, veh.capitalCompraCarlos));
    } else {
      capitalCompraCarlos = Math.round(mitadNegocio / numNegocio);
    }
    const capRestanteNeg = Math.max(0, mitadNegocio - capitalCompraCarlos);
    const numOtros = negPartners.length > 0 ? negPartners.length : (numNegocio - 1);
    const capCadaSocio = numOtros > 0 ? capRestanteNeg / numOtros : 0;
    negPartners.forEach((p) => {
      capitalPorSocioMap[p.id] = (capitalPorSocioMap[p.id] || 0) + capCadaSocio;
    });
  }

  // 2. Sumar quién aportó el capital de cada Gasto de Alistamiento / Comisión del vehículo
  let gastosPagadosPorCarlos = 0;
  let gastosPagadosPorSocios = 0;

  gastos.forEach((g) => {
    const val = Number(g.valor) || 0;
    const pagadoPor = g.pagadoPor || 'CARLOS';
    if (pagadoPor === 'CARLOS') {
      gastosPagadosPorCarlos += val;
    } else if (pagadoPor && pagadoPor.startsWith('soc-')) {
      gastosPagadosPorSocios += val;
      capitalPorSocioMap[pagadoPor] = (capitalPorSocioMap[pagadoPor] || 0) + val;
    } else {
      gastosPagadosPorCarlos += val;
    }
  });

  const capitalTotalCarlosEnVehiculo = capitalCompraCarlos + gastosPagadosPorCarlos;
  const capitalTotalSociosEnVehiculo = Math.max(0, costoTotal - capitalTotalCarlosEnVehiculo);

  // 3. Cálculo de División de Ganancia Neta
  let pagoInversionista = 0;
  let pctInversionista = 0;
  let pagoSociosNegocioTotal = 0;
  let pagoPorCadaSocioNegocio = 0;
  let pctPorCadaSocioNegocio = 0;
  let miGananciaNeta = gananciaNeta;
  let miPorcentaje = 100;
  let resumenSociedad = '100% Propio Carlos';

  if (modalidad === 'INVERSIONISTA') {
    pctInversionista = 50;
    miPorcentaje = 50;
    pagoInversionista = gananciaNeta * 0.5;
    miGananciaNeta = gananciaNeta * 0.5;
    resumenSociedad = `Inversionista 50/50 (${invPartner ? invPartner.nombre : 'Sin asignar'})`;
  } else if (modalidad === 'NEGOCIO') {
    pctPorCadaSocioNegocio = 100 / numNegocio;
    miPorcentaje = pctPorCadaSocioNegocio;
    pagoPorCadaSocioNegocio = gananciaNeta / numNegocio;
    pagoSociosNegocioTotal = pagoPorCadaSocioNegocio * (numNegocio - 1);
    miGananciaNeta = pagoPorCadaSocioNegocio;
    const nombres = negPartners.map((p) => p.nombre.split(' ')[0]).join(', ');
    resumenSociedad = `Negocio entre ${numNegocio} (${pctPorCadaSocioNegocio.toFixed(1)}% c/u${nombres ? ': ' + nombres : ''})`;
  } else if (modalidad === 'COMBINADO') {
    pctInversionista = 50;
    pagoInversionista = gananciaNeta * 0.5;
    const mitadNegocio = gananciaNeta * 0.5;
    pctPorCadaSocioNegocio = 50 / numNegocio;
    miPorcentaje = pctPorCadaSocioNegocio;
    pagoPorCadaSocioNegocio = mitadNegocio / numNegocio;
    pagoSociosNegocioTotal = pagoPorCadaSocioNegocio * (numNegocio - 1);
    miGananciaNeta = pagoPorCadaSocioNegocio;
    resumenSociedad = `Inv. 50% + Negocio entre ${numNegocio} (${pctPorCadaSocioNegocio.toFixed(1)}% c/u)`;
  }

  const totalPagosSocios = pagoInversionista + pagoSociosNegocioTotal;

  return {
    precioCompra,
    totalAlistamiento,
    totalComisiones,
    costoTotal,
    capitalCompraCarlos,
    capitalTotalCarlosEnVehiculo,
    capitalTotalSociosEnVehiculo,
    capitalPorSocioMap,
    precioReferenciaVenta,
    gananciaNeta,
    margenPct,
    esVendido,
    modalidad,
    numNegocio,
    invPartner,
    negPartners,
    pctInversionista,
    pagoInversionista,
    pctPorCadaSocioNegocio,
    pagoPorCadaSocioNegocio,
    pagoSociosNegocioTotal,
    totalPagosSocios,
    miPorcentaje,
    miGananciaNeta,
    resumenSociedad
  };
}

// Calcula el resumen global de Capital Total Invertido, Capital Propio (Carlos) y Capital por cada Socio
function calculateGlobalCapitalBreakdown() {
  let capitalTotalInvertidoGlobal = 0;
  let capitalInvertidoPropioCarlos = 0;
  let capitalInvertidoTotalSocios = 0;
  let carrosActivosCarlos = 0;

  const socioStats = {};
  db.partners.forEach((p) => {
    socioStats[p.id] = {
      partner: p,
      capitalActivo: 0,
      carrosActivos: 0,
      carrosVendidos: 0,
      gananciaAcumuladaVendidos: 0
    };
  });

  db.vehicles.forEach((v) => {
    const fin = calculateVehicleFinancials(v);
    const isSold = v.estado === 'Vendido';

    if (!isSold) {
      capitalTotalInvertidoGlobal += fin.costoTotal;
      capitalInvertidoPropioCarlos += fin.capitalTotalCarlosEnVehiculo;
      capitalInvertidoTotalSocios += fin.capitalTotalSociosEnVehiculo;
      if (fin.capitalTotalCarlosEnVehiculo > 0) carrosActivosCarlos++;

      Object.entries(fin.capitalPorSocioMap).forEach(([pid, capMonto]) => {
        if (socioStats[pid]) {
          socioStats[pid].capitalActivo += capMonto;
        }
      });
    }

    // Contabilizar participación en carros activos y vendidos por socio
    db.partners.forEach((p) => {
      let participa = false;
      let gananciaEnCarro = 0;

      if ((v.modalidadSocio === 'INVERSIONISTA' || v.modalidadSocio === 'COMBINADO') && v.socioInversionistaId === p.id) {
        participa = true;
        gananciaEnCarro += fin.pagoInversionista;
      }
      if ((v.modalidadSocio === 'NEGOCIO' || v.modalidadSocio === 'COMBINADO') && (v.sociosNegocioIds || []).includes(p.id)) {
        participa = true;
        gananciaEnCarro += fin.pagoPorCadaSocioNegocio;
      }
      if ((fin.capitalPorSocioMap[p.id] || 0) > 0) {
        participa = true;
      }

      if (participa && socioStats[p.id]) {
        if (isSold) {
          socioStats[p.id].carrosVendidos++;
          socioStats[p.id].gananciaAcumuladaVendidos += gananciaEnCarro;
        } else {
          socioStats[p.id].carrosActivos++;
        }
      }
    });
  });

  // Liquidez disponible en Ubicaciones de Dinero Libre
  let liquidezBancos = 0;
  let liquidezEfectivo = 0;
  (db.moneyLocations || []).forEach((loc) => {
    const s = Number(loc.saldo) || 0;
    if (loc.tipo === 'Efectivo') liquidezEfectivo += s;
    else liquidezBancos += s;
  });
  const liquidezTotalDisponible = liquidezBancos + liquidezEfectivo;

  return {
    capitalTotalInvertidoGlobal,
    capitalInvertidoPropioCarlos,
    capitalInvertidoTotalSocios,
    carrosActivosCarlos,
    socioStats,
    liquidezBancos,
    liquidezEfectivo,
    liquidezTotalDisponible
  };
}

function renderCapitalBreakdownCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cap = calculateGlobalCapitalBreakdown();

  // Tarjeta 1: Carlos (Capital Propio)
  let html = `
    <div class="partner-capital-card is-carlos">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px; font-weight:700; color:#60a5fa; text-transform:uppercase;">👑 Capital Propio (Carlos)</span>
        <span class="badge condicion-nuevo">${formatNumberWithDots(cap.carrosActivosCarlos)} carros</span>
      </div>
      <div style="font-size:20px; font-weight:800; color:#f8fafc; margin: 2px 0;">
        ${formatCOP(cap.capitalInvertidoPropioCarlos)}
      </div>
      <div style="font-size:11.5px; color:var(--text-muted);">
        Dinero libre disponible: <strong style="color:#34d399;">${formatCOP(cap.liquidezTotalDisponible)}</strong>
      </div>
    </div>
  `;

  // Tarjetas de cada Socio individualizado (Taty, Henry, Daniel, William, Jimmy y demás registrados)
  db.partners.forEach((p) => {
    const st = cap.socioStats[p.id] || { capitalActivo: 0, carrosActivos: 0, carrosVendidos: 0, gananciaAcumuladaVendidos: 0 };
    const esInv = p.tipo === 'Inversionista';
    html += `
      <div class="partner-capital-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:700; color:#e2e8f0;">${esInv ? '💼' : '🤝'} ${escapeHtml(p.nombre)}</span>
          <span class="badge ${esInv ? 'status-publicado' : 'status-compra'}" style="font-size:10.5px; padding:2px 7px;">
            ${esInv ? 'Inv. 50/50' : 'Negocio'}
          </span>
        </div>
        <div style="font-size:19px; font-weight:700; color:${st.capitalActivo > 0 ? '#fcd34d' : '#94a3b8'}; margin: 2px 0;">
          ${formatCOP(st.capitalActivo)}
        </div>
        <div style="font-size:11.5px; color:var(--text-muted);">
          Activos: <strong>${formatNumberWithDots(st.carrosActivos)}</strong> • Ganancia vend.: <strong style="color:#10b981;">${formatCOP(st.gananciaAcumuladaVendidos)}</strong>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============================================================================
// CATÁLOGO COLOMBIA AUTOCOMPLETADO
// ============================================================================
function initColombiaCatalogUI() {
  const brandSelect = document.getElementById('veh-catalogo-marca');
  if (!brandSelect) return;

  const brands = Object.keys(COLOMBIA_VEHICLES_CATALOG);
  brandSelect.innerHTML =
    `<option value="TODAS">🔍 Todas las marcas (${brands.length} marcas en catálogo)</option>` +
    brands.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');

  onCatalogBrandChange();
}

function onCatalogBrandChange() {
  const brandSelect = document.getElementById('veh-catalogo-marca');
  const modelSelect = document.getElementById('veh-catalogo-linea');
  const datalist = document.getElementById('colombia-vehicles-datalist');
  if (!brandSelect || !modelSelect || !datalist) return;

  const selectedBrand = brandSelect.value;
  let models = [];

  if (selectedBrand === 'TODAS') {
    Object.values(COLOMBIA_VEHICLES_CATALOG).forEach((arr) => {
      models.push(...arr);
    });
  } else {
    models = [...(COLOMBIA_VEHICLES_CATALOG[selectedBrand] || [])];
  }

  if (db && Array.isArray(db.vehicles)) {
    db.vehicles.forEach((v) => {
      if (v.marca && !models.includes(v.marca)) {
        if (selectedBrand === 'TODAS' || v.marca.toLowerCase().includes(selectedBrand.toLowerCase())) {
          models.push(v.marca);
        }
      }
    });
  }

  modelSelect.innerHTML =
    `<option value="">-- Seleccionar línea (${models.length} disponibles) --</option>` +
    models.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

  datalist.innerHTML = models.map((m) => `<option value="${escapeHtml(m)}"></option>`).join('');
}

function onCatalogModelSelect() {
  const modelSelect = document.getElementById('veh-catalogo-linea');
  const marcaInput = document.getElementById('veh-marca');
  if (modelSelect && marcaInput && modelSelect.value) {
    marcaInput.value = modelSelect.value;
    marcaInput.focus();
  }
}

function evaluateDocDate(dateStr, label, isNew) {
  if (!dateStr) {
    if (isNew && label === 'Tecno') {
      return { status: 'NA', html: `<span class="doc-pill doc-na">🔹 ${label}: N/A (Nuevo)</span>`, hasAlert: false };
    }
    return { status: 'NA', html: `<span class="doc-pill doc-na">${label}: Sin fecha</span>`, hasAlert: false };
  }

  const today = new Date(getTodayISO() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'VENCIDO',
      html: `<span class="doc-pill doc-expired">🚨 ${label}: ${dateStr} (Vencido)</span>`,
      hasAlert: true
    };
  }
  if (diffDays <= 30) {
    return {
      status: 'PRONTO',
      html: `<span class="doc-pill doc-warn">⚠️ ${label}: ${dateStr} (${diffDays}d)</span>`,
      hasAlert: true
    };
  }
  return {
    status: 'VIGENTE',
    html: `<span class="doc-pill doc-ok">✅ ${label}: ${dateStr}</span>`,
    hasAlert: false
  };
}

function getPeritajeBadgeHtml(v) {
  if (!v.peritaje || !v.peritaje.veredicto) {
    return `<span class="doc-pill doc-na" style="cursor:pointer;" onclick="openPeritajeModal('${v.id}')">📋 Peritaje: Pendiente</span>`;
  }
  const scores = calculateDetailedPeritajeScores(v.peritaje);
  const ver = v.peritaje.veredicto;
  let cls = 'veredicto-bueno';
  let icon = '🔵';
  if (ver === 'Excelente') { cls = 'veredicto-excelente'; icon = '🟢'; }
  else if (ver === 'Regular') { cls = 'veredicto-regular'; icon = '🟡'; }
  else if (ver === 'Para reparar') { cls = 'veredicto-reparar'; icon = '🔴'; }

  return `<span class="doc-pill ${cls}" style="cursor:pointer;" onclick="openPeritajeModal('${v.id}')">📋 ${icon} ${escapeHtml(ver)} (${scores.generalPct}%)</span>`;
}

// Calcula los días transcurridos entre fechaCompra y fechaVenta (o fecha actual)
function calculateDaysInInventory(v) {
  if (!v.fechaCompra) return 1;
  const start = new Date(v.fechaCompra + 'T00:00:00');
  const endStr = (v.estado === 'Vendido' && v.fechaVenta) ? v.fechaVenta : getTodayISO();
  const end = new Date(endStr + 'T00:00:00');
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

// ============================================================================
// ESQUEMA RESUMIDO Y COMPACTO POR ZONAS DE PERITAJE + LLANTAS DE 10% EN 10%
// Costos 100% Manuales y Opcionales (Cero sugerencias automáticas de dinero)
// Escala Oficial: Deficiente (0-59%) | Aceptable (60-89%) | Óptimo (90-100%)
// ============================================================================
const PERITAJE_ZONES = [
  {
    key: 'zonaFrente',
    titulo: '🚘 1. Frente',
    subtitulo: 'Bomper delantero, capó, persiana y frente',
    categoria: 'carroceria'
  },
  {
    key: 'zonaLateralIzq',
    titulo: '◀️ 2. Lateral Izquierdo',
    subtitulo: 'Guardafango del. izq., puerta del. izq., puerta tras. izq., costado tras. izq.',
    categoria: 'carroceria'
  },
  {
    key: 'zonaLateralDer',
    titulo: '▶️ 3. Lateral Derecho',
    subtitulo: 'Guardafango del. der., puerta del. der., puerta tras. der., costado tras. der.',
    categoria: 'carroceria'
  },
  {
    key: 'zonaTrasera',
    titulo: '🔙 4. Parte Trasera',
    subtitulo: 'Bomper trasero, tapa baúl / portón',
    categoria: 'carroceria'
  },
  {
    key: 'zonaTecho',
    titulo: '⬆️ 5. Techo y Estructura Superior',
    subtitulo: 'Techo, parales superiores y marco superior',
    categoria: 'carroceria'
  },
  {
    key: 'zonaChasis',
    titulo: '🏗️ 6. Chasis y Bajos (Peso Alto: 28%)',
    subtitulo: 'Puntas de chasis, piso/baúl, cuna de motor y torretas',
    categoria: 'chasis'
  },
  {
    key: 'zonaMecanica',
    titulo: '⚙️ 7. Mecánica, Motor y Caja (Peso Alto: 27%)',
    subtitulo: 'Motor, caja de cambios, suspensión, frenos y dirección',
    categoria: 'mecanica'
  },
  {
    key: 'zonaInterior',
    titulo: '💺 8. Tapicería, Interior y Eléctrico',
    subtitulo: 'Cojinería, tablero/testigos, aire acondicionado y controles eléctricos',
    categoria: 'interior'
  },
  {
    key: 'zonaVidrios',
    titulo: '🪟 9. Vidrios y Parabrisas',
    subtitulo: 'Parabrisas delantero, vidrios laterales y trasero',
    categoria: 'vidrios'
  },
  {
    key: 'zonaFluidos',
    titulo: '💧 10. Fugas y Fluidos',
    subtitulo: 'Estanqueidad de aceite de motor/caja, refrigerante, frenos y dirección',
    categoria: 'fugas'
  }
];

const PERITAJE_DAMAGE_OPTIONS = [
  { val: 'OPTIMO', label: '🟢 Óptimo / Original (100%)', score: 100, latScore: 100, pinScore: 100, tag: 'ÓPTIMO', color: '#10b981' },
  { val: 'RAYON_LEVE', label: '🟡 Rayón leve / Detalle mínimo (85%)', score: 85, latScore: 95, pinScore: 75, tag: 'RAYÓN LEVE', color: '#eab308' },
  { val: 'ARREGLO_REGULAR', label: '🟠 Arreglo regular / Retoque (70%)', score: 70, latScore: 72, pinScore: 68, tag: 'ARR. REGULAR', color: '#f97316' },
  { val: 'MUY_RAYADO', label: '🟠 Muy rayado (55%)', score: 55, latScore: 65, pinScore: 45, tag: 'MUY RAYADO', color: '#f97316' },
  { val: 'SUMIDO', label: '🟠 Sumido / Abolladura (45%)', score: 45, latScore: 40, pinScore: 50, tag: 'SUMIDO', color: '#f97316' },
  { val: 'GOLPE_MASILLA', label: '🔴 Golpe / Repintado con masilla (25%)', score: 25, latScore: 25, pinScore: 25, tag: 'MASILLA/GOLPE', color: '#ef4444' },
  { val: 'CAMBIO_REQUERIDO', label: '🔴 Cambio o reparación mayor (0%)', score: 0, latScore: 0, pinScore: 0, tag: 'CAMBIO/REP', color: '#dc2626' }
];

// Pasos exactos de 10% en 10% para Llantas
const LLANTAS_STEPS_10 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

function getDamageOptionByVal(val) {
  return PERITAJE_DAMAGE_OPTIONS.find((o) => o.val === val) || PERITAJE_DAMAGE_OPTIONS[0];
}

function calculateDetailedPeritajeScores(peritajeObj) {
  const p = peritajeObj || {};
  const detalles = p.detalles || {};
  const costosManuales = p.costosManuales || {};

  // compatibilidad hacia atrás si había piezas individuales guardadas antes
  function getZoneVal(zoneKey) {
    if (detalles[zoneKey]) return detalles[zoneKey];
    if (zoneKey === 'zonaFrente' && detalles.bomperDelantero) return detalles.bomperDelantero;
    if (zoneKey === 'zonaChasis' && detalles.puntasChasis) return detalles.puntasChasis;
    if (zoneKey === 'zonaMecanica' && detalles.motor) return detalles.motor;
    return 'OPTIMO';
  }

  // 1. Zonas de Carrocería (Frente, Lateral Izq, Lateral Der, Trasera, Techo)
  const carZones = ['zonaFrente', 'zonaLateralIzq', 'zonaLateralDer', 'zonaTrasera', 'zonaTecho'];
  let sumCar = 0;
  let sumLat = 0;
  let sumPin = 0;

  carZones.forEach((zk) => {
    const opt = getDamageOptionByVal(getZoneVal(zk));
    sumCar += opt.score;
    sumLat += opt.latScore;
    sumPin += opt.pinScore;
  });

  const carroceriaPct = Math.round(sumCar / carZones.length);
  const latoneriaPct = Math.round(sumLat / carZones.length);
  const pinturaPct = Math.round(sumPin / carZones.length);

  // 2. Chasis y Bajos (Peso 28%)
  const chasisPct = getDamageOptionByVal(getZoneVal('zonaChasis')).score;

  // 3. Mecánica y Motor (Peso 27%)
  const mecanicaPct = getDamageOptionByVal(getZoneVal('zonaMecanica')).score;

  // 4. Tapicería e Interior (Peso 8%)
  const interiorPct = getDamageOptionByVal(getZoneVal('zonaInterior')).score;

  // 5. Fugas y Fluidos (Peso 12%)
  const fugasPct = getDamageOptionByVal(getZoneVal('zonaFluidos')).score;

  // 6. Llantas (Escalable de 10% en 10%) y Vidrios (Peso 10%)
  const llantasPct = typeof detalles.llantasPct === 'number'
    ? detalles.llantasPct
    : (detalles.llantasPct !== undefined ? Number(detalles.llantasPct) : 100);
  const vidriosPct = getDamageOptionByVal(getZoneVal('zonaVidrios')).score;
  const vidriosLlantasPct = Math.round(llantasPct * 0.65 + vidriosPct * 0.35);

  // Suma exclusivamente de los costos manuales digitados por el usuario
  let totalManualCost = 0;
  Object.values(costosManuales).forEach((val) => {
    totalManualCost += Number(val) || 0;
  });

  // Si es un registro previo que no tenía `detalles`, respetar su costoEstimado manual si existía
  if (!p.detalles && p.veredicto) {
    const fallbackMap = { 'Excelente': 95, 'Bueno': 82, 'Regular': 68, 'Para reparar': 48 };
    const fb = fallbackMap[p.veredicto] || 90;
    return {
      latoneriaPct: fb,
      pinturaPct: fb,
      carroceriaPct: fb,
      chasisPct: fb,
      mecanicaPct: fb,
      fugasPct: fb,
      llantasPct: 90,
      vidriosPct: fb,
      vidriosLlantasPct: fb,
      interiorPct: fb,
      generalPct: fb,
      escalaLabel: fb >= 90 ? 'ÓPTIMO' : (fb >= 60 ? 'ACEPTABLE' : 'DEFICIENTE'),
      totalManualCost: Number(p.costoEstimado) || 0
    };
  }

  // Ponderación con mayor peso en Estructura/Chasis (28%) y Mecánica/Motor (27%)
  const generalPct = Math.round(
    chasisPct * 0.28 +
    mecanicaPct * 0.27 +
    carroceriaPct * 0.15 +
    fugasPct * 0.12 +
    vidriosLlantasPct * 0.10 +
    interiorPct * 0.08
  );

  // Escala oficial solicitada: Deficiente 0-59% / Aceptable 60-89% / Óptimo 90-100%
  let escalaLabel = 'ÓPTIMO';
  if (generalPct < 60) escalaLabel = 'DEFICIENTE';
  else if (generalPct < 90) escalaLabel = 'ACEPTABLE';

  return {
    latoneriaPct,
    pinturaPct,
    carroceriaPct,
    chasisPct,
    mecanicaPct,
    fugasPct,
    llantasPct,
    vidriosPct,
    vidriosLlantasPct,
    interiorPct,
    generalPct,
    escalaLabel,
    totalManualCost
  };
}

function getScoreBarColor(pct) {
  if (pct >= 90) return '#10b981';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

// ============================================================================
// SISTEMA DE SEGURIDAD Y AUTENTICACIÓN CLOUD (CORREO Y CONTRASEÑA SHA-256)
// ============================================================================
const DEFAULT_ADMIN_EMAIL = 'carlos@cartech.co';
const DEFAULT_ADMIN_PASS = 'Cartech2026';

async function sha256Hex(text) {
  const str = String(text || '');
  if (window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(str);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback determinístico si se abre en un contexto sin crypto.subtle
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'fb-' + (h >>> 0).toString(16);
}

async function getEffectiveAuthConfig() {
  if (db.authConfig && db.authConfig.email && db.authConfig.passwordHash) {
    return db.authConfig;
  }
  const defaultHash = await sha256Hex(DEFAULT_ADMIN_PASS);
  return {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: defaultHash
  };
}

function getActiveSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email && parsed.loggedIn === true) return parsed;
  } catch (_) {}
  return null;
}

function isUserAuthenticated() {
  return getActiveSession() !== null;
}

function applyAuthUIState() {
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  const envBadge = document.getElementById('auth-env-badge');
  if (envBadge) {
    envBadge.textContent = IS_PROD_ENV
      ? '☁️ Producción Cartech Automóviles — Conexión Cloud Segura'
      : '🧪 Entorno PRUEBAS — Conexión Cloud Segura';
  }

  const session = getActiveSession();
  if (session) {
    if (authScreen) authScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';

    const userPill = document.getElementById('topbar-user-email');
    if (userPill) userPill.textContent = `👤 ${session.email}`;

    const secEmailEl = document.getElementById('sec-current-email');
    const secInputEl = document.getElementById('sec-new-email');
    if (secEmailEl) secEmailEl.textContent = session.email;
    if (secInputEl && !secInputEl.value) secInputEl.value = session.email;

    updateAllViews();
  } else {
    if (authScreen) authScreen.style.display = 'flex';
    if (appShell) appShell.style.display = 'none';
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
  const passInput = document.getElementById('login-password')?.value || '';
  const remember = document.getElementById('login-remember')?.checked !== false;
  const errBox = document.getElementById('auth-error-msg');

  if (errBox) errBox.style.display = 'none';

  // Sincronizar primero con la nube para validar contra la contraseña más reciente
  await pullFromCloud(false);

  const authCfg = await getEffectiveAuthConfig();
  const inputHash = await sha256Hex(passInput);

  if (emailInput === authCfg.email.toLowerCase() && inputHash === authCfg.passwordHash) {
    const sessionObj = {
      loggedIn: true,
      email: authCfg.email,
      loginAt: Date.now()
    };
    if (remember) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
    }
    document.getElementById('login-password').value = '';
    applyAuthUIState();
    goHome();
  } else {
    if (errBox) {
      errBox.textContent = '⚠️ Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.';
      errBox.style.display = 'block';
    }
  }
}

function handleLogout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  currentActiveModule = 'home';
  applyAuthUIState();
}

async function handleChangePassword(event) {
  event.preventDefault();
  if (!isUserAuthenticated()) return;

  const newEmail = (document.getElementById('sec-new-email')?.value || '').trim().toLowerCase();
  const newPass = document.getElementById('sec-new-pass')?.value || '';

  if (!newEmail || newPass.length < 6) {
    alert('Por favor ingresa un correo válido y una contraseña de al menos 6 caracteres.');
    return;
  }

  const newHash = await sha256Hex(newPass);
  db.authConfig = {
    email: newEmail,
    passwordHash: newHash,
    updatedAt: Date.now()
  };

  // Actualizar sesión activa con el nuevo correo
  const sessionObj = { loggedIn: true, email: newEmail, loginAt: Date.now() };
  if (localStorage.getItem(AUTH_SESSION_KEY)) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
  } else {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
  }

  document.getElementById('sec-new-pass').value = '';
  saveDB();
  applyAuthUIState();
  alert('✅ Correo y contraseña actualizados y sincronizados en la nube correctamente.');
}

// ============================================================================
// NAVEGACIÓN POR MÓDULOS (SIN PESTAÑAS — PÁGINA PRINCIPAL + VOLVER AL INICIO)
// ============================================================================
function goHome() {
  openModule('home');
}

function openModule(moduleId) {
  // Protección obligatoria de rutas internas
  if (!isUserAuthenticated()) {
    applyAuthUIState();
    return;
  }

  currentActiveModule = moduleId;
  const allModules = ['home', 'inventario', 'peritaje', 'prospectos', 'directorio', 'socios', 'gastos-propios', 'dispositivos'];
  allModules.forEach((id) => {
    document.getElementById(`sheet-${id}`)?.classList.toggle('active', id === moduleId);
  });

  const backBtn = document.getElementById('topbar-btn-home');
  if (backBtn) {
    backBtn.style.display = moduleId === 'home' ? 'none' : 'inline-flex';
  }

  if (moduleId === 'home') renderHomeDashboard();
  if (moduleId === 'directorio') renderDirectorySheet();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchSheet(sheetId) {
  openModule(sheetId);
}

function renderHomeDashboard() {
  const cap = calculateGlobalCapitalBreakdown();
  const countDisponibles = db.vehicles.filter((v) => v.estado !== 'Vendido').length;
  const peritadosCount = db.vehicles.filter((v) => v.peritaje && v.peritaje.veredicto).length;
  const dirCount = (db.directoryProfiles || []).length;

  const kpisEl = document.getElementById('home-summary-kpis');
  if (kpisEl) {
    kpisEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>Vehículos Disponibles</span> <span>🚙</span></div>
        <div class="kpi-value">${formatNumberWithDots(countDisponibles)} carros</div>
        <div class="kpi-sub">Total histórico en inventario: ${formatNumberWithDots(db.vehicles.length)}</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Capital Invertido Propio (Carlos)</span> <span>👑</span></div>
        <div class="kpi-value" style="color: #38bdf8;">${formatCOP(cap.capitalInvertidoPropioCarlos)}</div>
        <div class="kpi-sub">Capital Global: ${formatCOP(cap.capitalTotalInvertidoGlobal)}</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Dinero Libre Disponible</span> <span>🏦</span></div>
        <div class="kpi-value" style="color: #34d399;">${formatCOP(cap.liquidezTotalDisponible)}</div>
        <div class="kpi-sub">Bancos + Efectivo físico</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Prospectos y Directorio</span> <span>📇</span></div>
        <div class="kpi-value">${formatNumberWithDots((db.prospects || []).length + dirCount)} contactos</div>
        <div class="kpi-sub">Prospectos: ${(db.prospects || []).length} • Directorio: ${dirCount}</div>
      </div>
    `;
  }

  const bInv = document.getElementById('home-badge-inventario');
  const bPer = document.getElementById('home-badge-peritaje');
  const bPro = document.getElementById('home-badge-prospectos');
  const bDir = document.getElementById('home-badge-directorio');
  const bSoc = document.getElementById('home-badge-socios');
  const bGas = document.getElementById('home-badge-gastos');

  if (bInv) bInv.textContent = `${formatNumberWithDots(db.vehicles.length)} vehículos`;
  if (bPer) bPer.textContent = `${formatNumberWithDots(peritadosCount)} peritados`;
  if (bPro) bPro.textContent = `${formatNumberWithDots((db.prospects || []).length)} prospectos`;
  if (bDir) bDir.textContent = `${formatNumberWithDots(dirCount)} perfiles`;
  if (bSoc) bSoc.textContent = `${formatNumberWithDots(db.partners.length)} socios`;
  if (bGas) bGas.textContent = `${formatNumberWithDots(db.ownExpenses.length)} gastos`;
}

// ============================================================================
// NUEVO MÓDULO: DIRECTORIO Y PERFILES (CLIENTE FINAL / COMERCIANTE / PROVEEDOR)
// ============================================================================
function setDirectoryProfileTab(tipoVal) {
  currentDirectoryProfileTab = tipoVal;
  const sel = document.getElementById('filter-dir-tipo');
  if (sel && sel.value !== tipoVal) sel.value = tipoVal;
  renderDirectorySheet();
}

function renderDirectorySheet() {
  const list = Array.isArray(db.directoryProfiles) ? db.directoryProfiles : [];
  const search = (document.getElementById('filter-dir-search')?.value || '').toLowerCase().trim();

  const countCF = list.filter((x) => x.tipo === 'CLIENTE_FINAL').length;
  const countCom = list.filter((x) => x.tipo === 'COMERCIANTE').length;
  const countProv = list.filter((x) => x.tipo === 'PROVEEDOR').length;

  const kpisEl = document.getElementById('directorio-kpis');
  if (kpisEl) {
    kpisEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>Total en Directorio</span> <span>📇</span></div>
        <div class="kpi-value">${formatNumberWithDots(list.length)} perfiles</div>
        <div class="kpi-sub">Contactos sincronizados en la nube</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Clientes Finales</span> <span>👤</span></div>
        <div class="kpi-value">${formatNumberWithDots(countCF)}</div>
        <div class="kpi-sub">Compradores e interesados finales</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Clientes Comerciantes</span> <span>🏢</span></div>
        <div class="kpi-value">${formatNumberWithDots(countCom)}</div>
        <div class="kpi-sub">Vitrinas, compra/venta e intermediarios</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Proveedores y Talleres</span> <span>🔧</span></div>
        <div class="kpi-value">${formatNumberWithDots(countProv)}</div>
        <div class="kpi-sub">Mecánica, latonería, repuestos y trámites</div>
      </div>
    `;
  }

  const tabsEl = document.getElementById('directorio-profile-tabs');
  if (tabsEl) {
    const tabs = [
      { id: 'TODOS', label: '📋 Todos', count: list.length },
      { id: 'CLIENTE_FINAL', label: '👤 Cliente Final', count: countCF },
      { id: 'COMERCIANTE', label: '🏢 Cliente Comerciante', count: countCom },
      { id: 'PROVEEDOR', label: '🔧 Proveedor', count: countProv }
    ];
    tabsEl.innerHTML = tabs
      .map(
        (t) => `
        <button class="status-tab-pill ${currentDirectoryProfileTab === t.id ? 'active' : ''}" onclick="setDirectoryProfileTab('${t.id}')">
          <span>${t.label}</span>
          <span class="status-tab-count">${formatNumberWithDots(t.count)}</span>
        </button>
      `
      )
      .join('');
  }

  const filtered = list.filter((item) => {
    const matchType = currentDirectoryProfileTab === 'TODOS' || item.tipo === currentDirectoryProfileTab;
    const blob = [
      item.nombre,
      item.telefono,
      item.documento,
      item.correo,
      item.ciudad,
      item.vehiculoInteres,
      item.contactoPrincipal,
      item.especialidad,
      item.direccion,
      item.historialNegocios,
      item.notas
    ]
      .join(' ')
      .toLowerCase();
    const matchSearch = !search || blob.includes(search);
    return matchType && matchSearch;
  });

  const countLabel = document.getElementById('directorio-count-label');
  if (countLabel) {
    countLabel.textContent = `Mostrando ${formatNumberWithDots(filtered.length)} de ${formatNumberWithDots(list.length)} contactos`;
  }

  const tbody = document.getElementById('directorio-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">
          No hay contactos en este filtro. Haz clic en <strong>"➕ Nuevo Contacto / Perfil"</strong> para agregar uno.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map((item) => {
      const cleanPhone = String(item.telefono || '').replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
      const waLink = waPhone
        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`¡Hola ${item.contactoPrincipal || item.nombre}! Te saluda Carlos de Cartech Automóviles 👋.`)}`
        : '#';

      let badgeHtml = `<span class="badge profile-badge-cliente">👤 Cliente Final</span>`;
      let extraColHtml = '';
      let subNameHtml = '';

      if (item.tipo === 'CLIENTE_FINAL') {
        subNameHtml = item.documento ? `CC/Doc: ${escapeHtml(item.documento)}` : '';
        extraColHtml = item.vehiculoInteres
          ? `<div>🚙 <strong>${escapeHtml(item.vehiculoInteres)}</strong></div>`
          : `<span style="color: var(--text-muted);">Sin vehículo asociado aún</span>`;
      } else if (item.tipo === 'COMERCIANTE') {
        badgeHtml = `<span class="badge profile-badge-comerciante">🏢 Comerciante</span>`;
        subNameHtml = item.contactoPrincipal ? `Contacto: ${escapeHtml(item.contactoPrincipal)}` : '';
        extraColHtml = `
          <div>🏷️ <strong>${escapeHtml(item.especialidad || 'Gama general')}</strong></div>
          ${item.historialNegocios ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(item.historialNegocios)}</div>` : ''}
        `;
      } else if (item.tipo === 'PROVEEDOR') {
        badgeHtml = `<span class="badge profile-badge-proveedor">🔧 Proveedor</span>`;
        const starsCount = Math.min(5, Math.max(1, Number(item.calificacion) || 5));
        const starsStr = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
        extraColHtml = `
          <div>🛠️ <strong>${escapeHtml(item.especialidad || 'Servicio general')}</strong></div>
          <div class="star-rating-display" title="${starsCount} de 5 estrellas">${starsStr} <span style="font-size: 11px; color: var(--text-muted);">(${starsCount}/5)</span></div>
        `;
      }

      return `
        <tr>
          <td>
            <div style="margin-bottom: 4px;">${badgeHtml}</div>
            <div style="font-weight: 700; color: #f8fafc;">${escapeHtml(item.nombre)}</div>
            ${subNameHtml ? `<div style="font-size: 11.5px; color: var(--text-muted);">${subNameHtml}</div>` : ''}
          </td>
          <td>
            <div style="font-weight: 600; font-family: monospace;">📞 ${escapeHtml(item.telefono)}</div>
            ${item.correo ? `<div style="font-size: 11.5px; color: var(--text-muted);">✉️ ${escapeHtml(item.correo)}</div>` : ''}
            ${waPhone ? `<a href="${waLink}" target="_blank" style="display:inline-block; margin-top:4px; font-size:12px; color:#34d399; font-weight:700; text-decoration:none;">💬 Abrir WhatsApp</a>` : ''}
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(item.ciudad || item.direccion || '-')}</div>
            ${item.tipo === 'PROVEEDOR' && item.direccion ? `<div style="font-size: 11.5px; color: var(--text-muted);">📍 ${escapeHtml(item.direccion)}</div>` : ''}
          </td>
          <td>${extraColHtml}</td>
          <td style="max-width: 240px; font-size: 12.5px; color: #cbd5e1;">
            ${escapeHtml(item.notas || '-')}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm" onclick="openDirectoryModal('${item.id}')">✏️ Editar</button>
              <button class="btn btn-danger-ghost btn-sm" onclick="deleteDirectoryProfile('${item.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function onDirectoryProfileTypeChange() {
  const tipo = document.getElementById('dir-tipo')?.value || 'CLIENTE_FINAL';
  document.getElementById('dir-fields-cliente-final').style.display = tipo === 'CLIENTE_FINAL' ? 'flex' : 'none';
  document.getElementById('dir-fields-comerciante').style.display = tipo === 'COMERCIANTE' ? 'flex' : 'none';
  document.getElementById('dir-fields-proveedor').style.display = tipo === 'PROVEEDOR' ? 'flex' : 'none';

  const labelNombre = document.getElementById('label-dir-nombre');
  if (labelNombre) {
    if (tipo === 'CLIENTE_FINAL') labelNombre.textContent = 'Nombre Completo *';
    else if (tipo === 'COMERCIANTE') labelNombre.textContent = 'Nombre / Razón Social o Vitrina *';
    else labelNombre.textContent = 'Nombre del Proveedor o Empresa *';
  }
}

function openDirectoryModal(profileId = null) {
  const form = document.getElementById('form-directory-profile');
  form.reset();
  initColombiaCatalogUI();

  if (profileId) {
    const item = (db.directoryProfiles || []).find((x) => x.id === profileId);
    if (!item) return;
    document.getElementById('modal-dir-title').textContent = `✏️ Editar Perfil: ${item.nombre}`;
    document.getElementById('dir-id').value = item.id;
    document.getElementById('dir-tipo').value = item.tipo || 'CLIENTE_FINAL';
    document.getElementById('dir-nombre').value = item.nombre || '';
    document.getElementById('dir-telefono').value = item.telefono || '';
    document.getElementById('dir-cf-documento').value = item.documento || '';
    document.getElementById('dir-cf-correo').value = item.correo || '';
    document.getElementById('dir-cf-ciudad').value = item.ciudad || '';
    document.getElementById('dir-cf-vehiculo').value = item.vehiculoInteres || '';
    document.getElementById('dir-com-contacto').value = item.contactoPrincipal || '';
    document.getElementById('dir-com-ciudad').value = item.ciudad || '';
    document.getElementById('dir-com-especialidad').value = item.especialidad || '';
    document.getElementById('dir-com-historial').value = item.historialNegocios || '';
    document.getElementById('dir-prov-especialidad').value = item.especialidad || 'Mecánica General';
    document.getElementById('dir-prov-direccion').value = item.direccion || '';
    document.getElementById('dir-prov-calificacion').value = String(item.calificacion || 5);
    document.getElementById('dir-notas').value = item.notas || '';
  } else {
    document.getElementById('modal-dir-title').textContent = '📇 Nuevo Contacto en Directorio y Perfiles';
    document.getElementById('dir-id').value = '';
    const defaultTipo = currentDirectoryProfileTab !== 'TODOS' ? currentDirectoryProfileTab : 'CLIENTE_FINAL';
    document.getElementById('dir-tipo').value = defaultTipo;
  }

  onDirectoryProfileTypeChange();
  document.getElementById('modal-directory-profile').classList.add('open');
}

function saveDirectoryProfile(event) {
  event.preventDefault();
  const id = document.getElementById('dir-id').value;
  const tipo = document.getElementById('dir-tipo').value;

  const payload = {
    id: id || 'dir-' + Date.now(),
    tipo: tipo,
    nombre: document.getElementById('dir-nombre').value.trim(),
    telefono: document.getElementById('dir-telefono').value.trim(),
    documento: tipo === 'CLIENTE_FINAL' ? document.getElementById('dir-cf-documento').value.trim() : '',
    correo: tipo === 'CLIENTE_FINAL' ? document.getElementById('dir-cf-correo').value.trim() : '',
    ciudad: tipo === 'CLIENTE_FINAL'
      ? document.getElementById('dir-cf-ciudad').value.trim()
      : (tipo === 'COMERCIANTE' ? document.getElementById('dir-com-ciudad').value.trim() : ''),
    vehiculoInteres: tipo === 'CLIENTE_FINAL' ? document.getElementById('dir-cf-vehiculo').value.trim() : '',
    contactoPrincipal: tipo === 'COMERCIANTE' ? document.getElementById('dir-com-contacto').value.trim() : '',
    especialidad: tipo === 'COMERCIANTE'
      ? document.getElementById('dir-com-especialidad').value.trim()
      : (tipo === 'PROVEEDOR' ? document.getElementById('dir-prov-especialidad').value : ''),
    historialNegocios: tipo === 'COMERCIANTE' ? document.getElementById('dir-com-historial').value.trim() : '',
    direccion: tipo === 'PROVEEDOR' ? document.getElementById('dir-prov-direccion').value.trim() : '',
    calificacion: tipo === 'PROVEEDOR' ? Number(document.getElementById('dir-prov-calificacion').value) || 5 : 0,
    notas: document.getElementById('dir-notas').value.trim(),
    updatedAt: Date.now()
  };

  if (!Array.isArray(db.directoryProfiles)) db.directoryProfiles = [];
  if (id) {
    const idx = db.directoryProfiles.findIndex((x) => x.id === id);
    if (idx !== -1) db.directoryProfiles[idx] = payload;
  } else {
    db.directoryProfiles.unshift(payload);
  }

  saveDB();
  closeModal('modal-directory-profile');
}

function deleteDirectoryProfile(profileId) {
  if (!confirm('¿Seguro que deseas eliminar este perfil del Directorio?')) return;
  db.directoryProfiles = (db.directoryProfiles || []).filter((x) => x.id !== profileId);
  saveDB();
}

// ============================================================================
// HOJA 1: LISTADO MAESTRO DE VEHÍCULOS Y SEPARACIÓN ESTRICTA DE CAPITAL
// ============================================================================
function setInventoryStatusTab(statusValue) {
  currentInventoryStatusTab = statusValue;
  const selectEl = document.getElementById('filter-veh-status');
  if (selectEl && selectEl.value !== statusValue) {
    selectEl.value = statusValue;
  }
  renderInventory();
}

function renderInventory() {
  const search = (document.getElementById('filter-veh-search')?.value || '').toLowerCase().trim();
  const condFilter = document.getElementById('filter-veh-condicion')?.value || 'TODOS';
  const docsFilter = document.getElementById('filter-veh-docs')?.value || 'TODOS';

  const countCompra = db.vehicles.filter((v) => v.estado === 'En Compra').length;
  const countAlistamiento = db.vehicles.filter((v) => v.estado === 'Alistamiento').length;
  const countPublicado = db.vehicles.filter((v) => v.estado === 'Publicado').length;
  const countVendido = db.vehicles.filter((v) => v.estado === 'Vendido').length;
  const countDisponibles = countCompra + countAlistamiento + countPublicado;
  const countTodos = db.vehicles.length;

  const tabsContainer = document.getElementById('inventory-status-tabs');
  if (tabsContainer) {
    const tabs = [
      { id: 'DISPONIBLES', label: '🟢 Disponibles (Activos)', count: countDisponibles },
      { id: 'Publicado', label: '🔵 Publicados', count: countPublicado },
      { id: 'Alistamiento', label: '🟡 En Preparación', count: countAlistamiento },
      { id: 'En Compra', label: '🟣 En Compra', count: countCompra },
      { id: 'Vendido', label: '🏆 Vendidos', count: countVendido },
      { id: 'TODOS', label: '📋 Todos', count: countTodos }
    ];
    tabsContainer.innerHTML = tabs
      .map(
        (t) => `
        <button class="status-tab-pill ${currentInventoryStatusTab === t.id ? 'active' : ''}" onclick="setInventoryStatusTab('${t.id}')">
          <span>${t.label}</span>
          <span class="status-tab-count">${formatNumberWithDots(t.count)}</span>
        </button>
      `
      )
      .join('');
  }

  // KPIs Globales con Separación Estricta de Capital Invertido (Total vs Propio Carlos vs Socios vs Liquidez)
  const cap = calculateGlobalCapitalBreakdown();

  const kpiContainer = document.getElementById('inventario-kpis');
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>Capital Total Invertido (Global)</span> <span>🏛️</span></div>
        <div class="kpi-value">${formatCOP(cap.capitalTotalInvertidoGlobal)}</div>
        <div class="kpi-sub">${formatNumberWithDots(countDisponibles)} vehículo(s) activos + gastos activos</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Capital Invertido Propio (Carlos)</span> <span>👑</span></div>
        <div class="kpi-value" style="color: #38bdf8;">${formatCOP(cap.capitalInvertidoPropioCarlos)}</div>
        <div class="kpi-sub">Tu dinero invertido actualmente en carros</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Capital Invertido por Socios</span> <span>🤝</span></div>
        <div class="kpi-value" style="color: #fcd34d;">${formatCOP(cap.capitalInvertidoTotalSocios)}</div>
        <div class="kpi-sub">Suma del capital activo puesto por socios</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Dinero Libre Disponible (Liquidez)</span> <span>🏦</span></div>
        <div class="kpi-value" style="color: #34d399;">${formatCOP(cap.liquidezTotalDisponible)}</div>
        <div class="kpi-sub">Bancos: ${formatCOP(cap.liquidezBancos)} • Efectivo: ${formatCOP(cap.liquidezEfectivo)}</div>
      </div>
    `;
  }

  // Renderizar tarjetas de desglose individualizado por socio y Carlos
  renderCapitalBreakdownCards('inventory-capital-breakdown');

  const filtered = db.vehicles.filter((v) => {
    const { color } = getVehicleColorAndKm(v);
    const matchText =
      !search ||
      (v.placa || '').toLowerCase().includes(search) ||
      (v.marca || '').toLowerCase().includes(search) ||
      (v.propietario || '').toLowerCase().includes(search) ||
      color.toLowerCase().includes(search) ||
      String(v.anio).includes(search);

    let matchStatus = true;
    if (currentInventoryStatusTab === 'DISPONIBLES') {
      matchStatus = v.estado !== 'Vendido';
    } else if (currentInventoryStatusTab !== 'TODOS') {
      matchStatus = v.estado === currentInventoryStatusTab;
    }

    const matchCond = condFilter === 'TODOS' || v.condicion === condFilter;

    const soatEval = evaluateDocDate(v.soat, 'SOAT', v.condicion === 'Nuevo');
    const tecnoEval = evaluateDocDate(v.tecno, 'Tecno', v.condicion === 'Nuevo');
    const hasDocAlert = (soatEval.hasAlert || tecnoEval.hasAlert) && v.estado !== 'Vendido';
    const matchDocs = docsFilter === 'TODOS' || (docsFilter === 'ALERTA' && hasDocAlert);

    return matchText && matchStatus && matchCond && matchDocs;
  });

  const headingMap = {
    'DISPONIBLES': '🟢 Vehículos Disponibles en Inventario (En Compra, Preparación y Publicados)',
    'En Compra': '🟣 Vehículos en Proceso de Compra',
    'Alistamiento': '🟡 Vehículos en Preparación / Alistamiento',
    'Publicado': '🔵 Vehículos Publicados Listos para Venta',
    'Vendido': '🏆 Vehículos Vendidos y Liquidados',
    'TODOS': '📋 Listado Maestro Completo de Vehículos'
  };
  document.getElementById('inventario-table-heading').textContent = headingMap[currentInventoryStatusTab] || 'Listado Maestro de Vehículos';
  document.getElementById('inventario-count-label').textContent = `Mostrando ${formatNumberWithDots(filtered.length)} de ${formatNumberWithDots(db.vehicles.length)} vehículos`;

  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 32px; color: var(--text-muted);">
          No hay vehículos en la vista <strong>"${headingMap[currentInventoryStatusTab]}"</strong>. Haz clic en <strong>"➕ Nuevo Vehículo"</strong> para agregar uno.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map((v) => {
      const fin = calculateVehicleFinancials(v);
      const { color, km } = getVehicleColorAndKm(v);
      const soatEval = evaluateDocDate(v.soat, 'SOAT', v.condicion === 'Nuevo');
      const tecnoEval = evaluateDocDate(v.tecno, 'Tecno', v.condicion === 'Nuevo');
      const peritajeBadge = getPeritajeBadgeHtml(v);

      const statusClassMap = {
        'En Compra': 'status-compra',
        'Alistamiento': 'status-alistamiento',
        'Publicado': 'status-publicado',
        'Vendido': 'status-vendido'
      };
      const statusBadgeClass = statusClassMap[v.estado] || 'status-compra';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #f8fafc; margin-bottom: 4px;">${escapeHtml(v.marca)}</div>
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span class="badge ${v.condicion === 'Nuevo' ? 'condicion-nuevo' : 'condicion-usado'}">${v.condicion}</span>
              <span style="font-size: 12px; color: var(--text-muted);">${escapeHtml(color)} • <strong>${formatNumberWithDots(km)} km</strong></span>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; font-family: monospace; font-size: 14px; color: #38bdf8;">${escapeHtml(v.placa)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">Modelo ${v.anio}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(v.propietario)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">📞 ${escapeHtml(v.propContacto || 'Sin teléfono')}</div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-start;">
              ${soatEval.html}
              ${tecnoEval.html}
              ${peritajeBadge}
            </div>
          </td>
          <td>
            <select
              onchange="quickChangeVehicleStatus('${v.id}', this.value)"
              class="badge ${statusBadgeClass}"
              style="cursor: pointer; width: auto; padding: 6px 10px; background-color: #0f172a;"
            >
              <option value="En Compra" ${v.estado === 'En Compra' ? 'selected' : ''}>🟣 En Compra</option>
              <option value="Alistamiento" ${v.estado === 'Alistamiento' ? 'selected' : ''}>🟡 En Preparación</option>
              <option value="Publicado" ${v.estado === 'Publicado' ? 'selected' : ''}>🔵 Publicado</option>
              <option value="Vendido" ${v.estado === 'Vendido' ? 'selected' : ''}>🏆 Vendido</option>
            </select>
          </td>
          <td>
            <div style="font-size: 12.5px; font-weight: 700; color: #f8fafc;">
              Costo Total: ${formatCOP(fin.costoTotal)}
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Compra: ${formatCOP(fin.precioCompra)} | Gastos: ${formatCOP(fin.totalAlistamiento + fin.totalComisiones)}
            </div>
            <div style="font-size: 11.5px; color: #38bdf8; margin-top: 3px;">
              👑 Cap. Carlos: <strong>${formatCOP(fin.capitalTotalCarlosEnVehiculo)}</strong>
            </div>
            <div style="font-size: 11.5px; color: #fcd34d;">
              🤝 Cap. Socios: <strong>${formatCOP(fin.capitalTotalSociosEnVehiculo)}</strong>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; font-size: 14.5px; color: ${fin.esVendido ? '#34d399' : '#93c5fd'};">
              ${formatCOP(fin.precioReferenciaVenta)}
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              ${fin.esVendido ? '✅ Precio Final Venta' : '🏷️ Precio Publicado'}
            </div>
          </td>
          <td>
            <div style="font-weight: 700; font-size: 14px; color: ${fin.gananciaNeta >= 0 ? '#10b981' : '#ef4444'};">
              ${fin.esVendido ? 'Quedó:' : 'Proy.:'} ${formatCOP(fin.gananciaNeta)}
            </div>
            <div style="font-size: 11.5px; color: #c4b5fd; margin-top: 2px;">
              🤝 ${escapeHtml(fin.resumenSociedad)}
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #38bdf8; margin-top: 2px;">
              Carlos (${fin.miPorcentaje.toFixed(0)}%): ${formatCOP(fin.miGananciaNeta)}
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <button class="btn btn-primary btn-sm" onclick="openVehicleExpensesModal('${v.id}')">
                🔧 Gastos (${formatNumberWithDots((v.gastos || []).length)}) / Liquidar
              </button>
              <div style="display: flex; gap: 5px;">
                <button class="btn btn-outline btn-sm" style="flex:1;" onclick="openPeritajeModal('${v.id}')">📋 Peritaje</button>
                <button class="btn btn-outline btn-sm" onclick="printPeritajePDF('${v.id}')" title="Imprimir / PDF Hoja de Peritaje">🖨️ PDF</button>
              </div>
              <div style="display: flex; gap: 5px;">
                <button class="btn btn-whatsapp btn-sm" style="flex:1;" onclick="openWhatsAppModalFromVehicle('${v.id}')">💬 WhatsApp</button>
                <button class="btn btn-outline btn-sm" onclick="printSettlementPDF('${v.id}')" title="Imprimir / PDF Liquidación a Socios">📄 Cuentas</button>
              </div>
              <div style="display: flex; gap: 5px;">
                <button class="btn btn-outline btn-sm" style="flex:1;" onclick="openVehicleModal('${v.id}')">✏️ Editar</button>
                <button class="btn btn-danger-ghost btn-sm" onclick="deleteVehicle('${v.id}')">🗑️</button>
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

// ============================================================================
// HOJA 2: MÓDULO DE HOJA DE PERITAJE TÉCNICO
// ============================================================================
function renderPeritajeSheet() {
  const search = (document.getElementById('filter-peritaje-search')?.value || '').toLowerCase().trim();
  const verFilter = document.getElementById('filter-peritaje-veredicto')?.value || 'TODOS';

  let countConPeritaje = 0;
  let countExcelente = 0;
  let countParaReparar = 0;
  let totalCostoEstimadoReparacion = 0;

  db.vehicles.forEach((v) => {
    if (v.peritaje && v.peritaje.veredicto) {
      countConPeritaje++;
      if (v.peritaje.veredicto === 'Excelente') countExcelente++;
      if (v.peritaje.veredicto === 'Para reparar' || v.peritaje.veredicto === 'Regular') countParaReparar++;
      totalCostoEstimadoReparacion += Number(v.peritaje.costoEstimado) || 0;
    }
  });

  const kpiEl = document.getElementById('peritaje-kpis');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>Vehículos Peritados</span> <span>📋</span></div>
        <div class="kpi-value">${formatNumberWithDots(countConPeritaje)} de ${formatNumberWithDots(db.vehicles.length)}</div>
        <div class="kpi-sub">Con hoja de peritaje registrada</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Veredicto Excelente</span> <span>🟢</span></div>
        <div class="kpi-value">${formatNumberWithDots(countExcelente)} vehículos</div>
        <div class="kpi-sub">Estructura, motor y pintura óptimos</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Regular / Para Reparar</span> <span>🔧</span></div>
        <div class="kpi-value">${formatNumberWithDots(countParaReparar)} vehículos</div>
        <div class="kpi-sub">Requieren intervención o alistamiento</div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-label"><span>Presupuesto Est. Reparaciones</span> <span>💵</span></div>
        <div class="kpi-value">${formatCOP(totalCostoEstimadoReparacion)}</div>
        <div class="kpi-sub">Suma de costos estimados en peritaje</div>
      </div>
    `;
  }

  const filtered = db.vehicles.filter((v) => {
    const matchText =
      !search ||
      (v.placa || '').toLowerCase().includes(search) ||
      (v.marca || '').toLowerCase().includes(search);

    const ver = v.peritaje?.veredicto || '';
    let matchVer = true;
    if (verFilter === 'SIN_PERITAJE') matchVer = !ver;
    else if (verFilter !== 'TODOS') matchVer = ver === verFilter;

    return matchText && matchVer;
  });

  const tbody = document.getElementById('peritaje-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 28px; color: var(--text-muted);">
          No hay vehículos que coincidan con el filtro de peritaje seleccionado.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map((v) => {
      const p = v.peritaje || null;
      const { km } = getVehicleColorAndKm(v);

      if (!p) {
        return `
          <tr>
            <td>
              <div style="font-weight: 700;">${escapeHtml(v.marca)} (${v.anio})</div>
              <div style="font-size: 12px; color: #38bdf8; font-family: monospace;">${escapeHtml(v.placa)} • ${formatNumberWithDots(km)} km</div>
            </td>
            <td><span class="badge condicion-usado">⚪ Sin Peritaje</span></td>
            <td colspan="6" style="color: var(--text-muted); font-size: 13px;">Aún no se ha diligenciado la hoja de peritaje para este vehículo.</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="openPeritajeModal('${v.id}')">📋 Realizar Peritaje</button>
            </td>
          </tr>
        `;
      }

      let verClass = 'veredicto-bueno';
      if (p.veredicto === 'Excelente') verClass = 'veredicto-excelente';
      else if (p.veredicto === 'Regular') verClass = 'veredicto-regular';
      else if (p.veredicto === 'Para reparar') verClass = 'veredicto-reparar';

      const sc = calculateDetailedPeritajeScores(p);

      return `
        <tr>
          <td>
            <div style="font-weight: 700;">${escapeHtml(v.marca)} (${v.anio})</div>
            <div style="font-size: 12px; color: #38bdf8; font-family: monospace;">${escapeHtml(v.placa)} • ${formatNumberWithDots(km)} km</div>
          </td>
          <td>
            <div style="font-weight: 800; font-size: 16px; color: ${getScoreBarColor(sc.generalPct)};">${sc.generalPct}% (${sc.escalaLabel})</div>
            <span class="badge ${verClass}" style="margin-top: 3px;">${escapeHtml(p.veredicto)}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: ${getScoreBarColor(sc.chasisPct)};">Chasis: ${sc.chasisPct}%</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(p.estructuraEstado || 'Evaluado por piezas')}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: ${getScoreBarColor(sc.mecanicaPct)};">Mecánica: ${sc.mecanicaPct}%</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(p.motorEstado || 'Tren motriz evaluado')}</div>
          </td>
          <td>
            <div style="font-weight: 700; color: ${getScoreBarColor(sc.carroceriaPct)};">Latonería: ${sc.latoneriaPct}% • Pintura: ${sc.pinturaPct}%</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">13 piezas inspeccionadas</div>
          </td>
          <td>
            <div style="font-weight: 700; color: ${getScoreBarColor(sc.vidriosLlantasPct)};">Llantas/Vidrios: ${sc.vidriosLlantasPct}%</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">Interior/Tapicería: ${sc.interiorPct}%</div>
          </td>
          <td>
            <div style="font-weight: 700; color: ${getScoreBarColor(sc.fugasPct)};">Fluidos: ${sc.fugasPct}%</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(p.docsEstado || 'Al día')}</div>
          </td>
          <td style="font-weight: 700; color: #fcd34d;">
            ${formatCOP(p.costoEstimado || 0)}
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <button class="btn btn-success btn-sm" onclick="printPeritajePDF('${v.id}')">🖨️ Imprimir / PDF Peritaje</button>
              <button class="btn btn-outline btn-sm" onclick="openPeritajeModal('${v.id}')">✏️ Editar Peritaje</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function buildPeritajeDetailedSectionsHTML(detalles = {}, costosManuales = {}) {
  const zonesHtml = PERITAJE_ZONES.map((z) => {
    const curVal = detalles[z.key] || 'OPTIMO';
    const curCost = Number(costosManuales[z.key]) || 0;
    const optsHtml = PERITAJE_DAMAGE_OPTIONS
      .map((o) => `<option value="${o.val}" ${o.val === curVal ? 'selected' : ''}>${escapeHtml(o.label)}</option>`)
      .join('');

    return `
      <div class="peritaje-zone-card">
        <div class="peritaje-zone-header">
          <div>
            <div class="peritaje-zone-title">${escapeHtml(z.titulo)}</div>
            <div class="peritaje-zone-sub">${escapeHtml(z.subtitulo)}</div>
          </div>
        </div>
        <div class="peritaje-zone-controls">
          <div class="form-group">
            <label>Estado / Nivel de Daño</label>
            <select data-peritaje-zone="${z.key}" onchange="onPeritajeItemChange()">
              ${optsHtml}
            </select>
          </div>
          <div class="form-group">
            <label>Costo daño ($) (Opcional)</label>
            <input
              type="text"
              inputmode="numeric"
              data-peritaje-cost="${z.key}"
              value="${curCost > 0 ? formatNumberWithDots(curCost) : ''}"
              placeholder="Opcional: $ 0"
              oninput="formatCurrencyInput(this); onPeritajeItemChange()"
            />
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Tarjeta especial: LLANTAS escalable de 10% en 10% (100%, 90%, ..., 0%)
  const curLlantasPct = typeof detalles.llantasPct === 'number'
    ? detalles.llantasPct
    : (detalles.llantasPct !== undefined ? Number(detalles.llantasPct) : 100);
  const curLlantasCost = Number(costosManuales.zonaLlantas) || 0;

  const llantasOptsHtml = LLANTAS_STEPS_10
    .map((pct) => {
      const icon = pct >= 90 ? '🟢' : (pct >= 60 ? '🟡' : '🔴');
      return `<option value="${pct}" ${pct === curLlantasPct ? 'selected' : ''}>${icon} ${pct}% vida útil de llantas</option>`;
    })
    .join('');

  const llantasCardHtml = `
    <div class="peritaje-zone-card" style="border-color: rgba(59, 130, 246, 0.55);">
      <div class="peritaje-zone-header">
        <div>
          <div class="peritaje-zone-title">🛞 11. Estado de Llantas (Escala de 10% en 10%)</div>
          <div class="peritaje-zone-sub">Ajusta el porcentaje de vida útil del juego de llantas en pasos exactos de 10%</div>
        </div>
      </div>
      <div class="peritaje-zone-controls">
        <div class="form-group">
          <label>Porcentaje Llantas (10% en 10%)</label>
          <div class="llantas-stepper-box">
            <button type="button" class="llantas-step-btn" onclick="stepLlantasPct(-10)">-10%</button>
            <select id="per-llantas-pct-select" onchange="onPeritajeItemChange()" style="flex:1; font-weight:700;">
              ${llantasOptsHtml}
            </select>
            <button type="button" class="llantas-step-btn" onclick="stepLlantasPct(10)">+10%</button>
          </div>
        </div>
        <div class="form-group">
          <label>Costo daño / llantas ($) (Opcional)</label>
          <input
            type="text"
            inputmode="numeric"
            data-peritaje-cost="zonaLlantas"
            value="${curLlantasCost > 0 ? formatNumberWithDots(curLlantasCost) : ''}"
            placeholder="Opcional: $ 0"
            oninput="formatCurrencyInput(this); onPeritajeItemChange()"
          />
        </div>
      </div>
    </div>
  `;

  return zonesHtml + llantasCardHtml;
}

function stepLlantasPct(delta) {
  const sel = document.getElementById('per-llantas-pct-select');
  if (!sel) return;
  const cur = Number(sel.value) || 0;
  const next = Math.min(100, Math.max(0, Math.round((cur + delta) / 10) * 10));
  sel.value = String(next);
  onPeritajeItemChange();
}

function getPeritajeDetailsFromModalDOM() {
  const detalles = {};
  document.querySelectorAll('select[data-peritaje-zone]').forEach((sel) => {
    const key = sel.getAttribute('data-peritaje-zone');
    detalles[key] = sel.value;
  });
  const llantasSel = document.getElementById('per-llantas-pct-select');
  detalles.llantasPct = llantasSel ? Number(llantasSel.value) : 100;
  return detalles;
}

function getPeritajeManualCostsFromModalDOM() {
  const costosManuales = {};
  document.querySelectorAll('input[data-peritaje-cost]').forEach((inp) => {
    const key = inp.getAttribute('data-peritaje-cost');
    const val = parseCurrencyInput(inp.value);
    if (val > 0) {
      costosManuales[key] = val;
    }
  });
  return costosManuales;
}

function onPeritajeItemChange() {
  const detalles = getPeritajeDetailsFromModalDOM();
  const costosManuales = getPeritajeManualCostsFromModalDOM();
  const sc = calculateDetailedPeritajeScores({ detalles, costosManuales });

  const bannerEl = document.getElementById('peritaje-live-score-banner');
  if (bannerEl) {
    const colorGen = getScoreBarColor(sc.generalPct);
    bannerEl.innerHTML = `
      <div>
        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Puntaje General Ponderado del Vehículo</div>
        <div style="font-size: 26px; font-weight: 900; color: ${colorGen};">
          ${sc.generalPct}% — ${sc.escalaLabel}
        </div>
        <div style="font-size: 12px; color: #cbd5e1;">Ponderación alta en Chasis (28%) y Mecánica/Motor (27%)</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: var(--text-muted);">Total Costo de Daños Digitado Manualmente:</div>
        <div style="font-size: 22px; font-weight: 800; color: #fcd34d;">${formatCOP(sc.totalManualCost)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">Escala: 🔴 Deficiente (0-59%) • 🟡 Aceptable (60-89%) • 🟢 Óptimo (90-100%)</div>
      </div>
    `;
  }

  const barsEl = document.getElementById('peritaje-live-cat-bars');
  if (barsEl) {
    const cats = [
      { label: '🏗️ Estructura / Chasis', pct: sc.chasisPct },
      { label: '⚙️ Mecánica / Motor', pct: sc.mecanicaPct },
      { label: '🔨 Latonería', pct: sc.latoneriaPct },
      { label: '🎨 Pintura', pct: sc.pinturaPct },
      { label: '🛞 Llantas (' + sc.llantasPct + '%) y Vidrios', pct: sc.vidriosLlantasPct },
      { label: '💧 Fugas / Fluidos', pct: sc.fugasPct },
      { label: '💺 Tapicería / Interior', pct: sc.interiorPct }
    ];
    barsEl.innerHTML = cats
      .map((c) => {
        const col = getScoreBarColor(c.pct);
        return `
          <div class="pbar-item">
            <div class="pbar-header">
              <span>${c.label}</span>
              <span style="color: ${col};">${c.pct}%</span>
            </div>
            <div class="pbar-track">
              <div class="pbar-fill" style="width: ${c.pct}%; background: ${col};"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Actualizar veredicto según escala Deficiente (0-59%) / Aceptable (60-89%) / Óptimo (90-100%)
  const verSelect = document.getElementById('per-veredicto');
  if (verSelect) {
    if (sc.generalPct >= 90) verSelect.value = 'Excelente';
    else if (sc.generalPct >= 75) verSelect.value = 'Bueno';
    else if (sc.generalPct >= 60) verSelect.value = 'Regular';
    else verSelect.value = 'Para reparar';
  }

  // Actualizar Total Costo de Daños / Alistamiento sumando exclusivamente los costos manuales digitados
  const costInput = document.getElementById('per-costo-estimado');
  if (costInput) {
    costInput.value = formatNumberWithDots(sc.totalManualCost);
  }
}

function openPeritajeModal(vehId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  const { km } = getVehicleColorAndKm(v);
  document.getElementById('per-veh-id').value = v.id;
  document.getElementById('modal-peritaje-title').textContent = `📋 Hoja de Peritaje Compacta: ${v.marca} (${v.placa})`;
  document.getElementById('modal-peritaje-subtitle').textContent = `Modelo ${v.anio} • ${formatNumberWithDots(km)} km • SOAT: ${v.soat || 'N/A'} • Tecno: ${v.tecno || 'N/A'}`;

  const p = v.peritaje || {};
  const container = document.getElementById('peritaje-detailed-sections-container');
  if (container) {
    container.innerHTML = buildPeritajeDetailedSectionsHTML(p.detalles || {}, p.costosManuales || {});
  }

  document.getElementById('per-docs-estado').value = p.docsEstado || 'Al día / Listo para traspaso';
  document.getElementById('per-docs-notas').value = p.docsNotas || '';
  document.getElementById('per-veredicto').value = p.veredicto || 'Excelente';
  document.getElementById('per-observaciones').value = p.observaciones || '';
  document.getElementById('per-fecha').value = p.fecha || getTodayISO();

  onPeritajeItemChange();
  document.getElementById('modal-peritaje').classList.add('open');
}

function saveVehiclePeritajeDataFromModal() {
  const vehId = document.getElementById('per-veh-id').value;
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return null;

  const detalles = getPeritajeDetailsFromModalDOM();
  const costosManuales = getPeritajeManualCostsFromModalDOM();
  const sc = calculateDetailedPeritajeScores({ detalles, costosManuales });

  v.peritaje = {
    detalles: detalles,
    costosManuales: costosManuales,
    puntajes: sc,
    estructuraEstado: `Chasis ${sc.chasisPct}% (${sc.chasisPct >= 90 ? 'Óptimo' : (sc.chasisPct >= 60 ? 'Aceptable' : 'Deficiente')})`,
    pinturaEstado: `Latonería ${sc.latoneriaPct}% / Pintura ${sc.pinturaPct}%`,
    motorEstado: `Mecánica ${sc.mecanicaPct}% / Fluidos ${sc.fugasPct}%`,
    suspensionEstado: `Llantas ${sc.llantasPct}% / Vidrios ${sc.vidriosPct}% / Interior ${sc.interiorPct}%`,
    docsEstado: document.getElementById('per-docs-estado').value,
    docsNotas: document.getElementById('per-docs-notas').value.trim(),
    veredicto: document.getElementById('per-veredicto').value,
    costoEstimado: sc.totalManualCost,
    observaciones: document.getElementById('per-observaciones').value.trim(),
    fecha: document.getElementById('per-fecha').value || getTodayISO()
  };

  saveDB();
  return v;
}

function saveVehiclePeritaje(event) {
  event.preventDefault();
  saveVehiclePeritajeDataFromModal();
  closeModal('modal-peritaje');
}

function saveAndPrintPeritajeFromModal() {
  const v = saveVehiclePeritajeDataFromModal();
  if (v) {
    printPeritajePDF(v.id);
  }
}

// ============================================================================
// 2. MÓDULO DE PROSPECTOS (DIVIDIDO EN PROSPECTOS DE VENTA Y COMPRA)
// ============================================================================
function setProspectCategory(cat) {
  currentProspectCategory = cat;
  currentProspectStatusTab = 'TODOS';
  renderProspectsSheet();
}

function setProspectStatusTab(statusVal) {
  currentProspectStatusTab = statusVal;
  renderProspectsSheet();
}

function renderProspectsSheet() {
  const allProspects = Array.isArray(db.prospects) ? db.prospects : [];
  const ventaProspects = allProspects.filter((p) => (p.tipo || 'VENTA') === 'VENTA');
  const compraProspects = allProspects.filter((p) => p.tipo === 'COMPRA');

  // Renderizar switcher superior: Prospectos de Venta vs Prospectos de Compra
  const switcherEl = document.getElementById('prospect-type-switcher');
  if (switcherEl) {
    switcherEl.innerHTML = `
      <button class="prospect-type-btn ${currentProspectCategory === 'VENTA' ? 'active-venta' : ''}" onclick="setProspectCategory('VENTA')">
        <div>
          <div>🏷️ Prospectos de Venta (Clientes Compradores)</div>
          <div style="font-size: 12px; font-weight: 500; opacity: 0.8; margin-top: 2px;">Interesados en comprar vehículos de nuestro inventario</div>
        </div>
        <span class="status-tab-count" style="font-size: 14px; padding: 4px 12px;">${formatNumberWithDots(ventaProspects.length)}</span>
      </button>
      <button class="prospect-type-btn ${currentProspectCategory === 'COMPRA' ? 'active-compra' : ''}" onclick="setProspectCategory('COMPRA')">
        <div>
          <div>🚗 Prospectos de Compra (Dueños Vendiendo su Carro)</div>
          <div style="font-size: 12px; font-weight: 500; opacity: 0.8; margin-top: 2px;">Captación de vehículos de propietarios para nuestro inventario</div>
        </div>
        <span class="status-tab-count" style="font-size: 14px; padding: 4px 12px;">${formatNumberWithDots(compraProspects.length)}</span>
      </button>
    `;
  }

  const activeCategoryList = currentProspectCategory === 'VENTA' ? ventaProspects : compraProspects;
  const search = (document.getElementById('filter-prosp-search')?.value || '').toLowerCase().trim();
  const vehFilterGroup = document.getElementById('group-filter-prosp-vehiculo');
  const vehFilterSelect = document.getElementById('filter-prosp-vehiculo');
  const selectedVehFilter = vehFilterSelect?.value || 'TODOS';

  if (vehFilterGroup) {
    vehFilterGroup.style.display = currentProspectCategory === 'VENTA' ? 'flex' : 'none';
  }

  if (vehFilterSelect && currentProspectCategory === 'VENTA') {
    const prev = vehFilterSelect.value || 'TODOS';
    vehFilterSelect.innerHTML =
      `<option value="TODOS">Todos los vehículos del inventario</option>` +
      db.vehicles
        .map(
          (v) =>
            `<option value="${v.id}" ${v.id === prev ? 'selected' : ''}>${escapeHtml(v.marca)} (${escapeHtml(v.placa)}) — ${formatCOP(v.precioPublicado || v.precioCompra)}</option>`
        )
        .join('');
  }

  const countNuevo = activeCategoryList.filter((p) => p.estado === 'Nuevo').length;
  const countNegociacion = activeCategoryList.filter((p) => p.estado === 'En negociación').length;
  const countCerrado = activeCategoryList.filter((p) => p.estado === 'Cerrado').length;
  const countFrio = activeCategoryList.filter((p) => p.estado === 'Frío').length;

  const kpisEl = document.getElementById('prospectos-kpis');
  if (kpisEl) {
    const labelCat = currentProspectCategory === 'VENTA' ? 'de Venta' : 'de Compra (Captación)';
    kpisEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>Total Prospectos ${labelCat}</span> <span>👥</span></div>
        <div class="kpi-value">${formatNumberWithDots(activeCategoryList.length)} registros</div>
        <div class="kpi-sub">En esta categoría comercial</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>En Negociación Activa</span> <span>🤝</span></div>
        <div class="kpi-value">${formatNumberWithDots(countNegociacion)}</div>
        <div class="kpi-sub">Nuevos por contactar: ${formatNumberWithDots(countNuevo)}</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Negocios Cerrados</span> <span>🏆</span></div>
        <div class="kpi-value">${formatNumberWithDots(countCerrado)}</div>
        <div class="kpi-sub">${currentProspectCategory === 'VENTA' ? 'Ventas concretadas' : 'Carros captados'}</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Fríos / Seguimiento</span> <span>❄️</span></div>
        <div class="kpi-value">${formatNumberWithDots(countFrio)}</div>
        <div class="kpi-sub">Para retomar con plantilla WhatsApp</div>
      </div>
    `;
  }

  const tabsEl = document.getElementById('prospects-status-tabs');
  if (tabsEl) {
    const pTabs = [
      { id: 'TODOS', label: '📋 Todos', count: activeCategoryList.length },
      { id: 'Nuevo', label: '🔵 Nuevos', count: countNuevo },
      { id: 'En negociación', label: '🟡 En Negociación', count: countNegociacion },
      { id: 'Cerrado', label: '🟢 Cerrados', count: countCerrado },
      { id: 'Frío', label: '⚪ Fríos', count: countFrio }
    ];
    tabsEl.innerHTML = pTabs
      .map(
        (t) => `
        <button class="status-tab-pill ${currentProspectStatusTab === t.id ? 'active' : ''}" onclick="setProspectStatusTab('${t.id}')">
          <span>${t.label}</span>
          <span class="status-tab-count">${formatNumberWithDots(t.count)}</span>
        </button>
      `
      )
      .join('');
  }

  const filtered = activeCategoryList.filter((p) => {
    const matchStatus = currentProspectStatusTab === 'TODOS' || p.estado === currentProspectStatusTab;
    const matchVeh =
      currentProspectCategory !== 'VENTA' ||
      selectedVehFilter === 'TODOS' ||
      (p.vehiculosIds || []).includes(selectedVehFilter);

    const matchText =
      !search ||
      (p.nombre || '').toLowerCase().includes(search) ||
      (p.telefono || '').toLowerCase().includes(search) ||
      (p.notas || '').toLowerCase().includes(search) ||
      (p.vehiculoExtra || '').toLowerCase().includes(search) ||
      (p.vehiculoOfrecido || '').toLowerCase().includes(search) ||
      (p.placaOfrecida || '').toLowerCase().includes(search);

    return matchStatus && matchVeh && matchText;
  });

  document.getElementById('prospectos-table-title').textContent =
    currentProspectCategory === 'VENTA'
      ? '🏷️ Listado de Prospectos de Venta (Clientes buscando comprar carro)'
      : '🚗 Listado de Prospectos de Compra (Dueños vendiendo su carro para inventario)';
  document.getElementById('prospectos-count-label').textContent = `Mostrando ${formatNumberWithDots(filtered.length)} de ${formatNumberWithDots(activeCategoryList.length)}`;

  const thead = document.getElementById('prospectos-thead');
  const tbody = document.getElementById('prospectos-tbody');
  if (!thead || !tbody) return;

  if (currentProspectCategory === 'VENTA') {
    thead.innerHTML = `
      <tr>
        <th>Cliente / Fecha</th>
        <th>Teléfono / WhatsApp</th>
        <th>Vehículo(s) de Interés (Nuestro Inventario)</th>
        <th>Presupuesto Cliente</th>
        <th>Estado</th>
        <th>Notas de Seguimiento</th>
        <th>Plantillas WhatsApp y Acciones</th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th>Dueño / Vendedor</th>
        <th>Teléfono / WhatsApp</th>
        <th>Vehículo Ofrecido / Placa / Km</th>
        <th>Precio Pretendido vs. Oferta Cartech</th>
        <th>Estado</th>
        <th>Notas de Negociación</th>
        <th>Plantillas WhatsApp y Acciones</th>
      </tr>
    `;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 28px; color: var(--text-muted);">
          No hay prospectos en esta vista. Usa los botones superiores para registrar un <strong>Prospecto de Venta</strong> o un <strong>Prospecto de Compra</strong>.
        </td>
      </tr>
    `;
    return;
  }

  const statusBadgeMap = {
    'Nuevo': 'status-publicado',
    'En negociación': 'status-alistamiento',
    'Cerrado': 'status-vendido',
    'Frío': 'condicion-usado'
  };

  tbody.innerHTML = filtered
    .map((p) => {
      if (currentProspectCategory === 'VENTA') {
        const linkedVehicles = (p.vehiculosIds || [])
          .map((id) => db.vehicles.find((v) => v.id === id))
          .filter(Boolean);

        const vehBadgesHtml = linkedVehicles.length
          ? linkedVehicles
              .map(
                (v) =>
                  `<div style="margin-bottom: 4px;"><span class="badge status-publicado">🚙 ${escapeHtml(v.marca)} (${escapeHtml(v.placa)}) — ${formatCOP(v.precioPublicado || v.precioCompra)}</span></div>`
              )
              .join('')
          : '';

        const extraHtml = p.vehiculoExtra
          ? `<div style="font-size: 12px; color: #fcd34d;">🔎 Busca: ${escapeHtml(p.vehiculoExtra)}</div>`
          : '';

        return `
          <tr>
            <td>
              <div style="font-weight: 700; color: #f8fafc;">${escapeHtml(p.nombre)}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">📅 ${p.fecha || '-'}</div>
            </td>
            <td>
              <div style="font-weight: 600; font-family: monospace; font-size: 13.5px;">📞 ${escapeHtml(p.telefono)}</div>
            </td>
            <td>
              ${vehBadgesHtml || '<span style="color: var(--text-muted); font-size: 12px;">Sin vehículo del inventario asignado</span>'}
              ${extraHtml}
            </td>
            <td style="font-weight: 700; color: #38bdf8;">
              ${p.presupuesto ? formatCOP(p.presupuesto) : 'Por definir'}
            </td>
            <td>
              <select
                onchange="quickChangeProspectStatus('${p.id}', this.value)"
                class="badge ${statusBadgeMap[p.estado] || 'status-publicado'}"
                style="cursor: pointer; width: auto; padding: 6px 10px; background-color: #0f172a;"
              >
                <option value="Nuevo" ${p.estado === 'Nuevo' ? 'selected' : ''}>🔵 Nuevo</option>
                <option value="En negociación" ${p.estado === 'En negociación' ? 'selected' : ''}>🟡 En negociación</option>
                <option value="Cerrado" ${p.estado === 'Cerrado' ? 'selected' : ''}>🟢 Cerrado</option>
                <option value="Frío" ${p.estado === 'Frío' ? 'selected' : ''}>⚪ Frío</option>
              </select>
            </td>
            <td style="max-width: 240px; font-size: 13px; color: #e2e8f0;">
              ${escapeHtml(p.notas || '')}
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <button class="btn btn-whatsapp btn-sm" onclick="openWhatsAppModalFromProspect('${p.id}')">
                  💬 Plantillas WhatsApp (Venta)
                </button>
                <div style="display: flex; gap: 5px;">
                  <button class="btn btn-outline btn-sm" style="flex:1;" onclick="openProspectModal('${p.id}')">✏️ Editar</button>
                  <button class="btn btn-danger-ghost btn-sm" onclick="deleteProspect('${p.id}')">🗑️</button>
                </div>
              </div>
            </td>
          </tr>
        `;
      } else {
        // PROSPECTO DE COMPRA (Captación de dueño vendiendo su carro)
        return `
          <tr>
            <td>
              <div style="font-weight: 700; color: #f8fafc;">${escapeHtml(p.nombre)}</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">📅 ${p.fecha || '-'}</div>
            </td>
            <td>
              <div style="font-weight: 600; font-family: monospace; font-size: 13.5px;">📞 ${escapeHtml(p.telefono)}</div>
            </td>
            <td>
              <div style="font-weight: 700; color: #f8fafc;">🚗 ${escapeHtml(p.vehiculoOfrecido || 'Vehículo sin especificar')}</div>
              <div style="font-size: 12px; color: #38bdf8; font-family: monospace; margin-top: 2px;">
                Placa: ${escapeHtml(p.placaOfrecida || 'S/P')} • ${formatNumberWithDots(p.kilometrajeOfrecido || 0)} km
              </div>
            </td>
            <td>
              <div style="font-size: 12px; color: var(--text-muted);">Pide dueño: <strong style="color: #f8fafc;">${formatCOP(p.precioPretendido || 0)}</strong></div>
              <div style="font-size: 13px; color: #34d399; font-weight: 700; margin-top: 2px;">Oferta nuestra: ${formatCOP(p.ofertaNuestra || 0)}</div>
            </td>
            <td>
              <select
                onchange="quickChangeProspectStatus('${p.id}', this.value)"
                class="badge ${statusBadgeMap[p.estado] || 'status-publicado'}"
                style="cursor: pointer; width: auto; padding: 6px 10px; background-color: #0f172a;"
              >
                <option value="Nuevo" ${p.estado === 'Nuevo' ? 'selected' : ''}>🔵 Nuevo</option>
                <option value="En negociación" ${p.estado === 'En negociación' ? 'selected' : ''}>🟡 En negociación</option>
                <option value="Cerrado" ${p.estado === 'Cerrado' ? 'selected' : ''}>🟢 Cerrado</option>
                <option value="Frío" ${p.estado === 'Frío' ? 'selected' : ''}>⚪ Frío</option>
              </select>
            </td>
            <td style="max-width: 240px; font-size: 13px; color: #e2e8f0;">
              ${escapeHtml(p.notas || '')}
            </td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <button class="btn btn-whatsapp btn-sm" onclick="openWhatsAppModalFromProspect('${p.id}')">
                  💬 Plantillas WhatsApp (Compra)
                </button>
                <button class="btn btn-outline btn-sm" onclick="convertPurchaseProspectToInventory('${p.id}')" title="Pasar este carro al Inventario Maestro">
                  ➕ Pasar a Inventario
                </button>
                <div style="display: flex; gap: 5px;">
                  <button class="btn btn-outline btn-sm" style="flex:1;" onclick="openProspectModal('${p.id}')">✏️ Editar</button>
                  <button class="btn btn-danger-ghost btn-sm" onclick="deleteProspect('${p.id}')">🗑️</button>
                </div>
              </div>
            </td>
          </tr>
        `;
      }
    })
    .join('');
}

function onProspectTypeModalChange() {
  const tipo = document.getElementById('prosp-tipo').value;
  document.getElementById('prosp-fields-venta').style.display = tipo === 'VENTA' ? 'flex' : 'none';
  document.getElementById('prosp-fields-compra').style.display = tipo === 'COMPRA' ? 'flex' : 'none';
}

function openProspectModal(prospId = null, defaultType = null) {
  const form = document.getElementById('form-prospect');
  form.reset();
  initColombiaCatalogUI();

  let selectedVehIds = [];
  if (prospId) {
    const p = (db.prospects || []).find((item) => item.id === prospId);
    if (!p) return;
    document.getElementById('modal-prospect-title').textContent = `Editar Prospecto: ${p.nombre}`;
    document.getElementById('prosp-id').value = p.id;
    document.getElementById('prosp-tipo').value = p.tipo || 'VENTA';
    document.getElementById('prosp-nombre').value = p.nombre || '';
    document.getElementById('prosp-telefono').value = p.telefono || '';
    document.getElementById('prosp-estado').value = p.estado || 'Nuevo';
    document.getElementById('prosp-presupuesto').value = p.presupuesto ? formatNumberWithDots(p.presupuesto) : '';
    document.getElementById('prosp-vehiculo-extra').value = p.vehiculoExtra || '';
    document.getElementById('prosp-compra-vehiculo').value = p.vehiculoOfrecido || '';
    document.getElementById('prosp-compra-placa').value = p.placaOfrecida || '';
    document.getElementById('prosp-compra-km').value = p.kilometrajeOfrecido ? formatNumberWithDots(p.kilometrajeOfrecido) : '';
    document.getElementById('prosp-compra-pretendido').value = p.precioPretendido ? formatNumberWithDots(p.precioPretendido) : '';
    document.getElementById('prosp-compra-oferta').value = p.ofertaNuestra ? formatNumberWithDots(p.ofertaNuestra) : '';
    document.getElementById('prosp-notas').value = p.notas || '';
    selectedVehIds = p.vehiculosIds || [];
  } else {
    const targetType = defaultType || currentProspectCategory || 'VENTA';
    document.getElementById('modal-prospect-title').textContent =
      targetType === 'VENTA'
        ? '🏷️ Nuevo Prospecto de Venta (Cliente Comprador)'
        : '🚗 Nuevo Prospecto de Compra (Dueño Vendiendo su Carro)';
    document.getElementById('prosp-id').value = '';
    document.getElementById('prosp-tipo').value = targetType;
    document.getElementById('prosp-estado').value = 'Nuevo';
  }

  onProspectTypeModalChange();

  const checklistEl = document.getElementById('prosp-vehiculos-checklist');
  if (checklistEl) {
    if (db.vehicles.length === 0) {
      checklistEl.innerHTML = `<span style="font-size: 12.5px; color: var(--text-muted);">No hay vehículos en el inventario maestro. Puedes anotar el vehículo buscado abajo.</span>`;
    } else {
      checklistEl.innerHTML = db.vehicles
        .map((v) => {
          const checked = selectedVehIds.includes(v.id) ? 'checked' : '';
          const price = v.precioPublicado || v.precioVenta || v.precioCompra;
          return `
            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; background: rgba(30, 41, 59, 0.7); cursor: pointer; font-size: 13px;">
              <input type="checkbox" name="prosp-veh-check" value="${v.id}" ${checked} style="width: auto;" />
              <span><strong>${escapeHtml(v.marca)}</strong> (${escapeHtml(v.placa)} • Mod. ${v.anio}) — <span style="color: #38bdf8;">${formatCOP(price)}</span> [${v.estado}]</span>
            </label>
          `;
        })
        .join('');
    }
  }

  document.getElementById('modal-prospect').classList.add('open');
}

function saveProspect(event) {
  event.preventDefault();
  const id = document.getElementById('prosp-id').value;
  const tipo = document.getElementById('prosp-tipo').value;
  const checkedVehIds = Array.from(document.querySelectorAll('input[name="prosp-veh-check"]:checked')).map((c) => c.value);

  const payload = {
    id: id || 'prosp-' + Date.now(),
    tipo: tipo,
    nombre: document.getElementById('prosp-nombre').value.trim(),
    telefono: document.getElementById('prosp-telefono').value.trim(),
    estado: document.getElementById('prosp-estado').value,
    presupuesto: parseCurrencyInput(document.getElementById('prosp-presupuesto').value),
    vehiculosIds: tipo === 'VENTA' ? checkedVehIds : [],
    vehiculoExtra: document.getElementById('prosp-vehiculo-extra').value.trim(),
    vehiculoOfrecido: document.getElementById('prosp-compra-vehiculo').value.trim(),
    placaOfrecida: document.getElementById('prosp-compra-placa').value.toUpperCase().trim(),
    kilometrajeOfrecido: parseCurrencyInput(document.getElementById('prosp-compra-km').value),
    precioPretendido: parseCurrencyInput(document.getElementById('prosp-compra-pretendido').value),
    ofertaNuestra: parseCurrencyInput(document.getElementById('prosp-compra-oferta').value),
    notas: document.getElementById('prosp-notas').value.trim(),
    fecha: getTodayISO()
  };

  if (!Array.isArray(db.prospects)) db.prospects = [];
  if (id) {
    const idx = db.prospects.findIndex((item) => item.id === id);
    if (idx !== -1) db.prospects[idx] = payload;
  } else {
    db.prospects.unshift(payload);
  }

  currentProspectCategory = tipo;
  saveDB();
  closeModal('modal-prospect');
}

function convertPurchaseProspectToInventory(prospId) {
  const p = (db.prospects || []).find((item) => item.id === prospId);
  if (!p) return;

  switchSheet('inventario');
  openVehicleModal();

  document.getElementById('veh-estado').value = 'En Compra';
  document.getElementById('veh-placa').value = p.placaOfrecida || 'SIN-PLACA';
  document.getElementById('veh-marca').value = p.vehiculoOfrecido || '';
  document.getElementById('veh-kilometraje').value = p.kilometrajeOfrecido ? formatNumberWithDots(p.kilometrajeOfrecido) : '';
  document.getElementById('veh-propietario').value = p.nombre || '';
  document.getElementById('veh-prop-contacto').value = p.telefono || '';
  const buyPrice = p.ofertaNuestra || p.precioPretendido || 0;
  document.getElementById('veh-precio-compra').value = buyPrice ? formatNumberWithDots(buyPrice) : '';
  onVehiclePriceOrModeInput();
}

function quickChangeProspectStatus(prospId, newStatus) {
  const p = (db.prospects || []).find((item) => item.id === prospId);
  if (!p) return;
  p.estado = newStatus;
  saveDB();
}

function deleteProspect(prospId) {
  if (!confirm('¿Eliminar este prospecto del CRM?')) return;
  db.prospects = (db.prospects || []).filter((item) => item.id !== prospId);
  saveDB();
}

// ============================================================================
// 3. PLANTILLAS DE MENSAJES DE WHATSAPP (VENTA Y COMPRA)
// ============================================================================
function openWhatsAppModalFromProspect(prospId) {
  const p = (db.prospects || []).find((item) => item.id === prospId);
  if (!p) return;

  const isCompra = p.tipo === 'COMPRA';
  let vehName = 'vehículo';
  let priceVal = 0;
  let kmVal = 0;

  if (isCompra) {
    vehName = p.vehiculoOfrecido || 'vehículo';
    priceVal = p.ofertaNuestra || p.precioPretendido || 0;
    kmVal = p.kilometrajeOfrecido || 0;
    selectedWhatsAppTemplateId = p.ofertaNuestra > 0 ? 'COMPRA_2' : 'COMPRA_1';
  } else {
    const firstVeh = (p.vehiculosIds || []).map((id) => db.vehicles.find((v) => v.id === id)).find(Boolean);
    if (firstVeh) {
      const { km } = getVehicleColorAndKm(firstVeh);
      vehName = `${firstVeh.marca} ${firstVeh.anio}`;
      priceVal = firstVeh.precioPublicado || firstVeh.precioVenta || firstVeh.precioCompra || 0;
      kmVal = km;
    } else if (p.vehiculoExtra) {
      vehName = p.vehiculoExtra;
      priceVal = p.presupuesto || 0;
    }
    selectedWhatsAppTemplateId = 'VENTA_1';
  }

  document.getElementById('wa-var-nombre').value = p.nombre || '';
  document.getElementById('wa-var-telefono').value = p.telefono || '';
  document.getElementById('wa-var-vehiculo').value = vehName;
  document.getElementById('wa-var-precio').value = priceVal ? formatNumberWithDots(priceVal) : '0';
  document.getElementById('wa-var-km').value = kmVal ? formatNumberWithDots(kmVal) : '0';

  refreshWhatsAppTemplatesPreview();
  document.getElementById('modal-whatsapp-templates').classList.add('open');
}

function openWhatsAppModalFromVehicle(vehId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  const { km } = getVehicleColorAndKm(v);
  const isEnCompra = v.estado === 'En Compra';
  selectedWhatsAppTemplateId = isEnCompra ? 'COMPRA_2' : 'VENTA_1';

  document.getElementById('wa-var-nombre').value = isEnCompra ? (v.propietario || '') : 'Cliente';
  document.getElementById('wa-var-telefono').value = isEnCompra ? (v.propContacto || '') : '';
  document.getElementById('wa-var-vehiculo').value = `${v.marca} ${v.anio}`;
  const refPrice = isEnCompra ? v.precioCompra : (v.precioPublicado || v.precioVenta || v.precioCompra);
  document.getElementById('wa-var-precio').value = refPrice ? formatNumberWithDots(refPrice) : '0';
  document.getElementById('wa-var-km').value = km ? formatNumberWithDots(km) : '0';

  refreshWhatsAppTemplatesPreview();
  document.getElementById('modal-whatsapp-templates').classList.add('open');
}

function buildWhatsAppMessageFromTemplate(tplStr) {
  const nombre = document.getElementById('wa-var-nombre').value.trim() || 'amigo(a)';
  const vehiculo = document.getElementById('wa-var-vehiculo').value.trim() || 'vehículo';
  const precioNum = parseCurrencyInput(document.getElementById('wa-var-precio').value);
  const precioFormatted = formatNumberWithDots(precioNum);
  const kmNum = parseCurrencyInput(document.getElementById('wa-var-km').value);
  const kmFormatted = formatNumberWithDots(kmNum) + ' km';

  return tplStr
    .replace(/\{nombre\}/g, nombre)
    .replace(/\{vehiculo\}/g, vehiculo)
    .replace(/\{precio\}/g, precioFormatted)
    .replace(/\{kilometraje\}/g, kmFormatted);
}

function selectWhatsAppTemplate(tplId) {
  selectedWhatsAppTemplateId = tplId;
  refreshWhatsAppTemplatesPreview();
}

function refreshWhatsAppTemplatesPreview() {
  const listEl = document.getElementById('wa-templates-list');
  const finalMsgEl = document.getElementById('wa-final-message');
  if (!listEl || !finalMsgEl) return;

  listEl.innerHTML = WHATSAPP_TEMPLATES.map((t) => {
    const previewText = buildWhatsAppMessageFromTemplate(t.template);
    const isSel = t.id === selectedWhatsAppTemplateId;
    return `
      <div class="wa-template-card ${isSel ? 'selected' : ''}" onclick="selectWhatsAppTemplate('${t.id}')">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size: 13px; color: ${t.categoria === 'VENTA' ? '#60a5fa' : '#34d399'};">${escapeHtml(t.titulo)}</strong>
          <span class="badge ${t.categoria === 'VENTA' ? 'status-publicado' : 'status-vendido'}" style="font-size: 10.5px;">${t.categoria}</span>
        </div>
        <div style="font-size: 12.5px; color: #cbd5e1; line-height: 1.45;">${escapeHtml(previewText)}</div>
      </div>
    `;
  }).join('');

  const activeTpl = WHATSAPP_TEMPLATES.find((t) => t.id === selectedWhatsAppTemplateId) || WHATSAPP_TEMPLATES[0];
  finalMsgEl.value = buildWhatsAppMessageFromTemplate(activeTpl.template);
}

function sendSelectedWhatsAppMessage() {
  const rawPhone = String(document.getElementById('wa-var-telefono').value || '').replace(/[^0-9]/g, '');
  const message = document.getElementById('wa-final-message').value.trim();

  if (!rawPhone) {
    alert('Por favor ingresa el número de Teléfono / WhatsApp del destinatario.');
    document.getElementById('wa-var-telefono').focus();
    return;
  }

  const waPhone = rawPhone.length === 10 ? `57${rawPhone}` : rawPhone;
  const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// ============================================================================
// HOJA 4: BASE DE DATOS DE SOCIOS, CAPITAL INDIVIDUALIZADO Y GANANCIAS
// ============================================================================
function renderPartnersSheet() {
  const cap = calculateGlobalCapitalBreakdown();

  let totalPagadoSociosVendidos = 0;
  let totalMiGananciaVendidos = 0;

  db.vehicles.forEach((v) => {
    const fin = calculateVehicleFinancials(v);
    if (v.estado === 'Vendido') {
      totalPagadoSociosVendidos += fin.totalPagosSocios;
      totalMiGananciaVendidos += fin.miGananciaNeta;
    }
  });

  const kpisEl = document.getElementById('socios-kpis');
  if (kpisEl) {
    kpisEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label"><span>Capital Total Invertido (Global)</span> <span>🏛️</span></div>
        <div class="kpi-value">${formatCOP(cap.capitalTotalInvertidoGlobal)}</div>
        <div class="kpi-sub">Carros activos en inventario + gastos activos</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Capital Invertido Propio (Carlos)</span> <span>👑</span></div>
        <div class="kpi-value" style="color: #38bdf8;">${formatCOP(cap.capitalInvertidoPropioCarlos)}</div>
        <div class="kpi-sub">Participación propia activa de Carlos</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Capital Invertido por Socios</span> <span>🤝</span></div>
        <div class="kpi-value" style="color: #fcd34d;">${formatCOP(cap.capitalInvertidoTotalSocios)}</div>
        <div class="kpi-sub">Total capital activo de todos los socios</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Ganancia Neta Carlos (Vendidos)</span> <span>🏆</span></div>
        <div class="kpi-value">${formatCOP(totalMiGananciaVendidos)}</div>
        <div class="kpi-sub">Pagado a socios (vendidos): ${formatCOP(totalPagadoSociosVendidos)}</div>
      </div>
    `;
  }

  renderCapitalBreakdownCards('socios-capital-breakdown');

  const partnersTbody = document.getElementById('partners-db-tbody');
  if (partnersTbody) {
    if (db.partners.length === 0) {
      partnersTbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding: 24px; color: var(--text-muted);">
            No hay socios registrados. Agrega Socios Inversionistas o Socios de Negocio.
          </td>
        </tr>
      `;
    } else {
      partnersTbody.innerHTML = db.partners
        .map((p) => {
          const st = cap.socioStats[p.id] || { capitalActivo: 0, carrosActivos: 0, carrosVendidos: 0, gananciaAcumuladaVendidos: 0 };
          const esInv = p.tipo === 'Inversionista';
          return `
            <tr>
              <td>
                <div style="font-weight: 700; color: #f8fafc;">${escapeHtml(p.nombre)}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(p.notas || '')}</div>
              </td>
              <td>
                <span class="badge ${esInv ? 'status-publicado' : 'status-compra'}">
                  ${esInv ? '💼 Socio Inversionista' : '🤝 Socio de Negocio'}
                </span>
              </td>
              <td>
                <strong style="color: ${esInv ? '#38bdf8' : '#c4b5fd'};">
                  ${esInv ? '50% / 50% Fijo' : 'Según cantidad (Entre 2 = 50%, Entre 3 = 33.3%)'}
                </strong>
              </td>
              <td>
                <div>📞 ${escapeHtml(p.telefono || '-')}</div>
                <div style="font-size: 12px; color: var(--text-muted);">ID: ${escapeHtml(p.documento || '-')}</div>
              </td>
              <td><strong>${formatNumberWithDots(st.carrosActivos)}</strong> activos</td>
              <td style="font-weight: 700; color: #fcd34d; font-size: 14.5px;">${formatCOP(st.capitalActivo)}</td>
              <td><strong>${formatNumberWithDots(st.carrosVendidos)}</strong> vendidos</td>
              <td style="font-weight: 700; color: #10b981;">${formatCOP(st.gananciaAcumuladaVendidos)}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-outline btn-sm" onclick="openPartnerModal('${p.id}')">✏️</button>
                  <button class="btn btn-danger-ghost btn-sm" onclick="deletePartner('${p.id}')">🗑️</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  const settlementFilter = document.getElementById('filter-liquidacion-estado')?.value || 'TODOS';
  const settlementsTbody = document.getElementById('settlements-tbody');
  if (!settlementsTbody) return;

  const vehList = db.vehicles.filter((v) => {
    if (settlementFilter === 'Vendido') return v.estado === 'Vendido';
    if (settlementFilter === 'EN_PROCESO') return v.estado !== 'Vendido';
    return true;
  });

  if (vehList.length === 0) {
    settlementsTbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding: 24px; color: var(--text-muted);">
          No hay vehículos en este filtro para mostrar liquidación.
        </td>
      </tr>
    `;
    return;
  }

  settlementsTbody.innerHTML = vehList
    .map((v) => {
      const fin = calculateVehicleFinancials(v);
      const diasInv = calculateDaysInInventory(v);
      let desgloseSociosHtml = '<span style="color: var(--text-muted);">Sin socios (100% Carlos)</span>';

      if (fin.modalidad === 'INVERSIONISTA') {
        desgloseSociosHtml = `
          <div>💼 <strong>${escapeHtml(fin.invPartner ? fin.invPartner.nombre : 'Inversionista')} (50%):</strong> ${formatCOP(fin.pagoInversionista)}</div>
        `;
      } else if (fin.modalidad === 'NEGOCIO') {
        const nombres = fin.negPartners.length
          ? fin.negPartners.map((p) => escapeHtml(p.nombre)).join(', ')
          : `${fin.numNegocio - 1} socio(s) de negocio`;
        desgloseSociosHtml = `
          <div>🤝 <strong>Dividido entre ${fin.numNegocio} (${fin.pctPorCadaSocioNegocio.toFixed(1)}% c/u):</strong></div>
          <div style="font-size: 12px; color: var(--text-muted);">${nombres}: ${formatCOP(fin.pagoPorCadaSocioNegocio)} c/u</div>
          <div style="font-size: 12px; color: #fcd34d;">Total otros socios: ${formatCOP(fin.pagoSociosNegocioTotal)}</div>
        `;
      } else if (fin.modalidad === 'COMBINADO') {
        desgloseSociosHtml = `
          <div>💼 <strong>Inv. 50%:</strong> ${formatCOP(fin.pagoInversionista)}</div>
          <div>🤝 <strong>Socios Negocio (${fin.pctPorCadaSocioNegocio.toFixed(1)}% c/u):</strong> ${formatCOP(fin.pagoSociosNegocioTotal)}</div>
        `;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 700;">${escapeHtml(v.marca)} (${v.anio})</div>
            <div style="font-size: 12px; color: #38bdf8; font-family: monospace;">${escapeHtml(v.placa)}</div>
          </td>
          <td>
            <span class="badge ${v.estado === 'Vendido' ? 'status-vendido' : 'status-publicado'}">
              ${v.estado === 'Vendido' ? '🏆 Vendido (Final)' : `⏳ ${v.estado}`}
            </span>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">⏱️ ${formatNumberWithDots(diasInv)} día(s) inv.</div>
          </td>
          <td>
            <div><strong>${formatCOP(fin.costoTotal)}</strong></div>
            <div style="font-size: 11.5px; color: var(--text-muted);">
              Compra: ${formatCOP(fin.precioCompra)} | Gastos: ${formatCOP(fin.totalAlistamiento + fin.totalComisiones)}
            </div>
          </td>
          <td>
            <div style="font-size: 12px; color: #38bdf8;">👑 Carlos: <strong>${formatCOP(fin.capitalTotalCarlosEnVehiculo)}</strong></div>
            <div style="font-size: 12px; color: #fcd34d;">🤝 Socios: <strong>${formatCOP(fin.capitalTotalSociosEnVehiculo)}</strong></div>
          </td>
          <td style="font-weight: 700;">${formatCOP(fin.precioReferenciaVenta)}</td>
          <td style="font-weight: 700; color: ${fin.gananciaNeta >= 0 ? '#10b981' : '#ef4444'};">
            ${formatCOP(fin.gananciaNeta)}
          </td>
          <td>${desgloseSociosHtml}</td>
          <td>
            <div style="font-weight: 700; font-size: 15px; color: #38bdf8;">${formatCOP(fin.miGananciaNeta)}</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">Participación: ${fin.miPorcentaje.toFixed(1)}%</div>
          </td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="printSettlementPDF('${v.id}')">
              📄 PDF Liquidación
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

// ============================================================================
// HOJA 5: UBICACIONES DE DINERO LIBRE (LIQUIDEZ DISPONIBLE) Y GASTOS PROPIOS
// ============================================================================
function renderMoneyLocationsSection() {
  const cap = calculateGlobalCapitalBreakdown();
  const kpisEl = document.getElementById('liquidez-kpis');
  if (kpisEl) {
    kpisEl.innerHTML = `
      <div class="kpi-card kpi-green">
        <div class="kpi-label"><span>Dinero Libre Total Disponible</span> <span>💰</span></div>
        <div class="kpi-value" style="color: #34d399;">${formatCOP(cap.liquidezTotalDisponible)}</div>
        <div class="kpi-sub">Saldo total pendiente de gasto</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><span>Total en Cuentas Bancarias</span> <span>🏦</span></div>
        <div class="kpi-value" style="color: #38bdf8;">${formatCOP(cap.liquidezBancos)}</div>
        <div class="kpi-sub">Bancolombia, Nu y demás bancos</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Total en Efectivo Físico</span> <span>💵</span></div>
        <div class="kpi-value" style="color: #fcd34d;">${formatCOP(cap.liquidezEfectivo)}</div>
        <div class="kpi-sub">Caja fuerte, efectivo Carlos, casa</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Capital Propio Invertido en Carros</span> <span>👑</span></div>
        <div class="kpi-value">${formatCOP(cap.capitalInvertidoPropioCarlos)}</div>
        <div class="kpi-sub">Total Patrimonio Carlos: ${formatCOP(cap.liquidezTotalDisponible + cap.capitalInvertidoPropioCarlos)}</div>
      </div>
    `;
  }

  const container = document.getElementById('money-locations-container');
  if (!container) return;

  const locs = db.moneyLocations || [];
  if (locs.length === 0) {
    container.innerHTML = `<div style="padding: 16px; color: var(--text-muted);">No hay ubicaciones de dinero libre configuradas.</div>`;
    return;
  }

  container.innerHTML = locs
    .map((loc) => {
      const esEfectivo = loc.tipo === 'Efectivo';
      return `
        <div class="money-loc-card ${esEfectivo ? 'loc-efectivo' : 'loc-banco'}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div>
              <div style="font-weight:700; font-size:14.5px; color:#f8fafc;">
                ${esEfectivo ? '💵' : '🏦'} ${escapeHtml(loc.nombre)}
              </div>
              <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                ${esEfectivo ? `📍 Ubicación física: <strong>${escapeHtml(loc.ubicacionFisica || 'Sin especificar')}</strong>` : 'Cuenta Bancaria'}
              </div>
            </div>
            <span class="badge ${esEfectivo ? 'status-vendido' : 'status-publicado'}" style="font-size:11px;">
              ${esEfectivo ? 'Efectivo' : 'Banco'}
            </span>
          </div>
          <div style="font-size:21px; font-weight:800; color:${(Number(loc.saldo) || 0) >= 0 ? '#34d399' : '#f87171'}; margin: 4px 0;">
            ${formatCOP(loc.saldo)}
          </div>
          <div style="display:flex; gap:6px; margin-top:auto;">
            <button class="btn btn-outline btn-sm" style="flex:1;" onclick="openMoneyLocationModal('${loc.id}')">✏️ Editar / Ajustar Saldo</button>
            <button class="btn btn-danger-ghost btn-sm" onclick="deleteMoneyLocation('${loc.id}')">🗑️</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function populateMoneyLocationsSelect(selectId, selectedId = '', includeEmptyOption = false) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  const locs = db.moneyLocations || [];
  let html = includeEmptyOption
    ? `<option value="">-- No descontar de Dinero Libre --</option>`
    : '';

  html += locs
    .map((loc) => {
      const esEf = loc.tipo === 'Efectivo';
      const detail = esEf && loc.ubicacionFisica ? ` [${loc.ubicacionFisica}]` : '';
      return `<option value="${loc.id}" ${loc.id === selectedId ? 'selected' : ''}>${esEf ? '💵' : '🏦'} ${escapeHtml(loc.nombre)}${escapeHtml(detail)} — Saldo: ${formatCOP(loc.saldo)}</option>`;
    })
    .join('');

  sel.innerHTML = html;
}

function onMoneyLocationTypeChange() {
  const tipo = document.getElementById('mloc-tipo').value;
  const groupFisica = document.getElementById('group-mloc-ubicacion-fisica');
  const inputFisica = document.getElementById('mloc-ubicacion-fisica');
  const labelNombre = document.getElementById('label-mloc-nombre');

  if (tipo === 'Efectivo') {
    groupFisica.style.display = 'flex';
    inputFisica.required = true;
    labelNombre.textContent = 'Nombre del Fondo en Efectivo *';
  } else {
    groupFisica.style.display = 'none';
    inputFisica.required = false;
    labelNombre.textContent = 'Nombre de la Cuenta Bancaria (Ej: Bancolombia, Nu) *';
  }
}

function openMoneyLocationModal(locId = null) {
  const form = document.getElementById('form-money-location');
  form.reset();

  if (locId) {
    const loc = (db.moneyLocations || []).find((l) => l.id === locId);
    if (!loc) return;
    document.getElementById('modal-money-loc-title').textContent = `Editar Ubicación de Dinero: ${loc.nombre}`;
    document.getElementById('mloc-id').value = loc.id;
    document.getElementById('mloc-tipo').value = loc.tipo || 'Banco';
    document.getElementById('mloc-nombre').value = loc.nombre || '';
    document.getElementById('mloc-ubicacion-fisica').value = loc.ubicacionFisica || '';
    document.getElementById('mloc-saldo').value = formatNumberWithDots(loc.saldo || 0);
  } else {
    document.getElementById('modal-money-loc-title').textContent = '🏦 Nueva Ubicación de Dinero Libre';
    document.getElementById('mloc-id').value = '';
    document.getElementById('mloc-tipo').value = 'Banco';
    document.getElementById('mloc-saldo').value = '';
  }

  onMoneyLocationTypeChange();
  document.getElementById('modal-money-location').classList.add('open');
}

function saveMoneyLocation(event) {
  event.preventDefault();
  const id = document.getElementById('mloc-id').value;
  const tipo = document.getElementById('mloc-tipo').value;
  const ubicacionFisica = document.getElementById('mloc-ubicacion-fisica').value.trim();

  if (tipo === 'Efectivo' && !ubicacionFisica) {
    alert('Por favor ingresa el Lugar / Ubicación Física para el efectivo (ej. Caja fuerte oficina, Efectivo Carlos, Casa).');
    return;
  }

  const payload = {
    id: id || 'mloc-' + Date.now(),
    tipo: tipo,
    nombre: document.getElementById('mloc-nombre').value.trim(),
    ubicacionFisica: tipo === 'Efectivo' ? ubicacionFisica : '',
    saldo: parseCurrencyInput(document.getElementById('mloc-saldo').value)
  };

  if (!Array.isArray(db.moneyLocations)) db.moneyLocations = [];
  if (id) {
    const idx = db.moneyLocations.findIndex((l) => l.id === id);
    if (idx !== -1) db.moneyLocations[idx] = payload;
  } else {
    db.moneyLocations.push(payload);
  }

  saveDB();
  closeModal('modal-money-location');
}

function deleteMoneyLocation(locId) {
  const loc = (db.moneyLocations || []).find((l) => l.id === locId);
  if (!loc) return;
  if (!confirm(`¿Eliminar la ubicación de dinero "${loc.nombre}"?`)) return;
  db.moneyLocations = db.moneyLocations.filter((l) => l.id !== locId);
  saveDB();
}

// Descuenta o reintegra saldo de una Ubicación de Dinero Libre
function adjustMoneyLocationBalance(locationId, deltaAmount) {
  if (!locationId || !deltaAmount) return;
  const loc = (db.moneyLocations || []).find((l) => l.id === locationId);
  if (loc) {
    loc.saldo = (Number(loc.saldo) || 0) + Number(deltaAmount);
  }
}

function getMoneyLocationLabel(locationId) {
  const loc = (db.moneyLocations || []).find((l) => l.id === locationId);
  if (!loc) return 'No especificada';
  return loc.tipo === 'Efectivo'
    ? `💵 ${loc.nombre} (${loc.ubicacionFisica || 'Efectivo'})`
    : `🏦 ${loc.nombre}`;
}

function initExpenseFiltersDefaults() {
  const today = getTodayISO();
  const weekInput = document.getElementById('filter-exp-week');
  const monthInput = document.getElementById('filter-exp-month');
  const yearSelect = document.getElementById('filter-exp-year');

  if (weekInput && !weekInput.value) weekInput.value = getISOWeekString(today);
  if (monthInput && !monthInput.value) monthInput.value = today.slice(0, 7);

  if (yearSelect) {
    const currentYear = Number(today.slice(0, 4));
    const years = new Set([currentYear - 1, currentYear, currentYear + 1]);
    db.ownExpenses.forEach((e) => {
      if (e.fecha) years.add(Number(e.fecha.slice(0, 4)));
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const prevVal = yearSelect.value || String(currentYear);
    yearSelect.innerHTML = sortedYears
      .map((y) => `<option value="${y}" ${String(y) === prevVal ? 'selected' : ''}>Año ${y}</option>`)
      .join('');
  }
}

function setExpensePeriodMode(mode) {
  currentPeriodMode = mode;
  ['semana', 'mes', 'anio', 'todos'].forEach((m) => {
    document.getElementById(`tab-period-${m}`)?.classList.toggle('active', m.toUpperCase() === mode);
  });

  document.getElementById('period-picker-week-group').style.display = mode === 'SEMANA' ? 'flex' : 'none';
  document.getElementById('period-picker-month-group').style.display = mode === 'MES' ? 'flex' : 'none';
  document.getElementById('period-picker-year-group').style.display = mode === 'ANIO' ? 'flex' : 'none';

  renderOwnExpenses();
}

function renderOwnExpenses() {
  renderMoneyLocationsSection();
  initExpenseFiltersDefaults();

  const today = getTodayISO();
  const thisWeek = getISOWeekString(today);
  const thisMonth = today.slice(0, 7);
  const thisYear = today.slice(0, 4);

  const selectedWeek = document.getElementById('filter-exp-week')?.value || thisWeek;
  const selectedMonth = document.getElementById('filter-exp-month')?.value || thisMonth;
  const selectedYear = document.getElementById('filter-exp-year')?.value || thisYear;
  const selectedCat = document.getElementById('filter-exp-cat')?.value || 'TODAS';
  const searchQuery = (document.getElementById('filter-exp-search')?.value || '').toLowerCase().trim();

  let sumThisWeek = 0;
  let sumThisMonth = 0;
  let sumThisYear = 0;

  db.ownExpenses.forEach((e) => {
    const val = Number(e.valor) || 0;
    const eWeek = getISOWeekString(e.fecha);
    const eMonth = (e.fecha || '').slice(0, 7);
    const eYear = (e.fecha || '').slice(0, 4);

    if (eWeek === thisWeek) sumThisWeek += val;
    if (eMonth === thisMonth) sumThisMonth += val;
    if (eYear === thisYear) sumThisYear += val;
  });

  const filtered = db.ownExpenses.filter((e) => {
    const eWeek = getISOWeekString(e.fecha);
    const eMonth = (e.fecha || '').slice(0, 7);
    const eYear = (e.fecha || '').slice(0, 4);

    let matchPeriod = true;
    if (currentPeriodMode === 'SEMANA') matchPeriod = eWeek === selectedWeek;
    else if (currentPeriodMode === 'MES') matchPeriod = eMonth === selectedMonth;
    else if (currentPeriodMode === 'ANIO') matchPeriod = eYear === selectedYear;

    const matchCat = selectedCat === 'TODAS' || e.categoria === selectedCat;
    const matchSearch =
      !searchQuery ||
      (e.concepto || '').toLowerCase().includes(searchQuery) ||
      (e.categoria || '').toLowerCase().includes(searchQuery);

    return matchPeriod && matchCat && matchSearch;
  });

  const totalFiltered = filtered.reduce((acc, e) => acc + (Number(e.valor) || 0), 0);

  let periodLabel = 'Todos los registros';
  if (currentPeriodMode === 'SEMANA') periodLabel = `Semana ${selectedWeek}`;
  if (currentPeriodMode === 'MES') periodLabel = `Mes ${selectedMonth}`;
  if (currentPeriodMode === 'ANIO') periodLabel = `Año ${selectedYear}`;

  const kpisEl = document.getElementById('gastos-propios-kpis');
  if (kpisEl) {
    kpisEl.innerHTML = `
      <div class="kpi-card kpi-red">
        <div class="kpi-label"><span>Total Filtro Activo (${periodLabel})</span> <span>🎯</span></div>
        <div class="kpi-value">${formatCOP(totalFiltered)}</div>
        <div class="kpi-sub">${formatNumberWithDots(filtered.length)} gasto(s) en el período</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label"><span>Gasto Esta Semana (${thisWeek})</span> <span>📅</span></div>
        <div class="kpi-value">${formatCOP(sumThisWeek)}</div>
        <div class="kpi-sub">Acumulado semanal actual</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label"><span>Gasto Este Mes (${thisMonth})</span> <span>🗓️</span></div>
        <div class="kpi-value">${formatCOP(sumThisMonth)}</div>
        <div class="kpi-sub">Acumulado mensual actual</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label"><span>Gasto Este Año (${thisYear})</span> <span>📆</span></div>
        <div class="kpi-value">${formatCOP(sumThisYear)}</div>
        <div class="kpi-sub">Acumulado anual</div>
      </div>
    `;
  }

  document.getElementById('own-expenses-table-title').textContent = `Gastos Propios — ${periodLabel}`;
  document.getElementById('own-expenses-count').textContent = `${formatNumberWithDots(filtered.length)} registro(s) • Total: ${formatCOP(totalFiltered)}`;

  const tbody = document.getElementById('own-expenses-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 28px; color: var(--text-muted);">
          No hay gastos propios registrados para <strong>${periodLabel}</strong>.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
    .map((e) => {
      const weekStr = getISOWeekString(e.fecha);
      const monthStr = (e.fecha || '').slice(0, 7);
      const origenLabel = e.locationId ? getMoneyLocationLabel(e.locationId) : (e.metodo || 'Sin ubicación');
      return `
        <tr>
          <td style="font-weight: 600;">${e.fecha}</td>
          <td>
            <span class="badge condicion-usado">${weekStr}</span>
            <span style="font-size: 12px; color: var(--text-muted); margin-left: 4px;">(${monthStr})</span>
          </td>
          <td style="font-weight: 600; color: #f8fafc;">${escapeHtml(e.concepto)}</td>
          <td><span class="badge status-compra">${escapeHtml(e.categoria)}</span></td>
          <td><span style="font-size: 12.5px; color: #38bdf8; font-weight: 600;">${escapeHtml(origenLabel)}</span></td>
          <td style="font-weight: 700; color: #f87171;">${formatCOP(e.valor)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm" onclick="openOwnExpenseModal('${e.id}')">✏️</button>
              <button class="btn btn-danger-ghost btn-sm" onclick="deleteOwnExpense('${e.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

// ============================================================================
// MODALES Y CRUD DE VEHÍCULOS, CAPITAL APORTADO Y GASTOS POR CARRO
// ============================================================================
function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('open');
}

function populatePartnerSelectsInVehicleModal(selectedInvId = '', selectedNegIds = []) {
  const invSelect = document.getElementById('veh-socio-inversionista');
  const negContainer = document.getElementById('veh-socios-negocio-list');

  const invPartners = db.partners.filter((p) => p.tipo === 'Inversionista');
  const negPartners = db.partners.filter((p) => p.tipo === 'Negocio');

  if (invSelect) {
    if (invPartners.length === 0) {
      invSelect.innerHTML = `<option value="">-- Primero agrega un Socio Inversionista --</option>`;
    } else {
      invSelect.innerHTML = invPartners
        .map((p) => `<option value="${p.id}" ${p.id === selectedInvId ? 'selected' : ''}>${escapeHtml(p.nombre)} (50/50)</option>`)
        .join('');
    }
  }

  if (negContainer) {
    if (negPartners.length === 0) {
      negContainer.innerHTML = `<span style="font-size: 12.5px; color: var(--text-muted);">No hay Socios de Negocio en la base de datos aún.</span>`;
    } else {
      negContainer.innerHTML = negPartners
        .map((p) => {
          const checked = selectedNegIds.includes(p.id) ? 'checked' : '';
          return `
            <label style="display: inline-flex; align-items: center; gap: 6px; background: var(--bg-input); padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-color); cursor: pointer; font-size: 13px;">
              <input type="checkbox" name="veh-socio-neg-check" value="${p.id}" ${checked} onchange="handleNegocioCheckboxChange()" style="width: auto;" />
              <span>${escapeHtml(p.nombre)}</span>
            </label>
          `;
        })
        .join('');
    }
  }
}

function handleNegocioCheckboxChange() {
  const checkedBoxes = document.querySelectorAll('input[name="veh-socio-neg-check"]:checked');
  const numSelect = document.getElementById('veh-num-socios-negocio');
  if (numSelect && checkedBoxes.length > 0) {
    const totalParticipants = Math.min(4, Math.max(2, checkedBoxes.length + 1));
    numSelect.value = String(totalParticipants);
  }
  onVehiclePriceOrModeInput();
}

function handlePartnerModeChange() {
  const mode = document.getElementById('veh-modalidad-socio').value;
  document.getElementById('group-select-inversionista').style.display =
    mode === 'INVERSIONISTA' || mode === 'COMBINADO' ? 'flex' : 'none';
  document.getElementById('group-cantidad-negocio').style.display =
    mode === 'NEGOCIO' || mode === 'COMBINADO' ? 'flex' : 'none';
  document.getElementById('group-checkboxes-negocio').style.display =
    mode === 'NEGOCIO' || mode === 'COMBINADO' ? 'flex' : 'none';

  onVehiclePriceOrModeInput();
}

function onVehiclePriceOrModeInput() {
  const precioCompra = parseCurrencyInput(document.getElementById('veh-precio-compra').value);
  const mode = document.getElementById('veh-modalidad-socio').value;
  const numNeg = Number(document.getElementById('veh-num-socios-negocio').value) || 2;

  let defaultCarlosCap = precioCompra;
  if (mode === 'INVERSIONISTA') defaultCarlosCap = Math.round(precioCompra * 0.5);
  else if (mode === 'NEGOCIO') defaultCarlosCap = Math.round(precioCompra / numNeg);
  else if (mode === 'COMBINADO') defaultCarlosCap = Math.round((precioCompra * 0.5) / numNeg);

  const capCarlosEl = document.getElementById('veh-capital-carlos');
  const capSociosEl = document.getElementById('veh-capital-socios');
  if (capCarlosEl && capSociosEl) {
    capCarlosEl.value = defaultCarlosCap ? formatNumberWithDots(defaultCarlosCap) : '0';
    const sociosCap = Math.max(0, precioCompra - defaultCarlosCap);
    capSociosEl.value = formatNumberWithDots(sociosCap);
  }

  updateVehiclePartnerPreview();
}

function onManualCarlosCapitalInput() {
  const precioCompra = parseCurrencyInput(document.getElementById('veh-precio-compra').value);
  let capCarlos = parseCurrencyInput(document.getElementById('veh-capital-carlos').value);
  if (capCarlos > precioCompra) {
    capCarlos = precioCompra;
    document.getElementById('veh-capital-carlos').value = formatNumberWithDots(capCarlos);
  }
  const sociosCap = Math.max(0, precioCompra - capCarlos);
  document.getElementById('veh-capital-socios').value = formatNumberWithDots(sociosCap);
  updateVehiclePartnerPreview();
}

function updateVehiclePartnerPreview() {
  const vehId = document.getElementById('veh-id').value;
  const existingVeh = db.vehicles.find((v) => v.id === vehId);
  const checkedNegIds = Array.from(document.querySelectorAll('input[name="veh-socio-neg-check"]:checked')).map((c) => c.value);

  const tempVeh = {
    estado: document.getElementById('veh-estado').value,
    precioCompra: parseCurrencyInput(document.getElementById('veh-precio-compra').value),
    precioPublicado: parseCurrencyInput(document.getElementById('veh-precio-publicado').value),
    precioVenta: parseCurrencyInput(document.getElementById('veh-precio-venta').value),
    capitalCompraCarlos: parseCurrencyInput(document.getElementById('veh-capital-carlos').value),
    modalidadSocio: document.getElementById('veh-modalidad-socio').value,
    socioInversionistaId: document.getElementById('veh-socio-inversionista').value,
    numSociosNegocio: Number(document.getElementById('veh-num-socios-negocio').value) || 2,
    sociosNegocioIds: checkedNegIds,
    gastos: existingVeh ? existingVeh.gastos : []
  };

  const fin = calculateVehicleFinancials(tempVeh);
  const previewEl = document.getElementById('veh-partner-preview');
  if (!previewEl) return;

  previewEl.innerHTML = `
    <div class="split-row">
      <span>Costo Total (Compra + Alistamiento + Comisiones):</span>
      <strong>${formatCOP(fin.costoTotal)}</strong>
    </div>
    <div class="split-row">
      <span>Capital Aportado por Carlos vs. Socio(s):</span>
      <span><strong style="color:#38bdf8;">Carlos: ${formatCOP(fin.capitalTotalCarlosEnVehiculo)}</strong> • <strong style="color:#fcd34d;">Socios: ${formatCOP(fin.capitalTotalSociosEnVehiculo)}</strong></span>
    </div>
    <div class="split-row">
      <span>Utilidad Neta Estimada / Final:</span>
      <strong style="color: ${fin.gananciaNeta >= 0 ? '#10b981' : '#ef4444'};">${formatCOP(fin.gananciaNeta)}</strong>
    </div>
    <div class="split-row">
      <span>Pago de Ganancia a Socio(s) (${escapeHtml(fin.resumenSociedad)}):</span>
      <strong style="color: #fcd34d;">${formatCOP(fin.totalPagosSocios)}</strong>
    </div>
    <div class="split-row">
      <span><strong>Ganancia Neta Libre Carlos (${fin.miPorcentaje.toFixed(1)}%):</strong></span>
      <strong style="color: #38bdf8; font-size: 15px;">${formatCOP(fin.miGananciaNeta)}</strong>
    </div>
  `;
}

function openVehicleModal(vehId = null) {
  const form = document.getElementById('form-vehicle');
  form.reset();
  initColombiaCatalogUI();
  populateMoneyLocationsSelect('veh-money-location-id', '', true);

  if (vehId) {
    const v = db.vehicles.find((item) => item.id === vehId);
    if (!v) return;
    const { color, km } = getVehicleColorAndKm(v);
    const fin = calculateVehicleFinancials(v);
    document.getElementById('modal-vehicle-title').textContent = `Editar Vehículo: ${v.marca} (${v.placa})`;
    document.getElementById('veh-id').value = v.id;
    document.getElementById('veh-condicion').value = v.condicion || 'Usado';
    document.getElementById('veh-estado').value = v.estado || 'En Compra';
    document.getElementById('veh-placa').value = v.placa || '';
    document.getElementById('veh-marca').value = v.marca || '';
    document.getElementById('veh-anio').value = v.anio || 2024;
    document.getElementById('veh-color').value = color !== 'Sin especificar' ? color : '';
    document.getElementById('veh-kilometraje').value = km ? formatNumberWithDots(km) : '0';
    document.getElementById('veh-propietario').value = v.propietario || '';
    document.getElementById('veh-prop-contacto').value = String(v.propContacto || '').replace(/[^0-9]/g, '');
    document.getElementById('veh-soat').value = v.soat || '';
    document.getElementById('veh-tecno').value = v.tecno || '';
    document.getElementById('veh-precio-compra').value = v.precioCompra ? formatNumberWithDots(v.precioCompra) : '';
    document.getElementById('veh-precio-publicado').value = v.precioPublicado ? formatNumberWithDots(v.precioPublicado) : '';
    document.getElementById('veh-precio-venta').value = v.precioVenta ? formatNumberWithDots(v.precioVenta) : '';
    document.getElementById('veh-fecha-compra').value = v.fechaCompra || getTodayISO();
    document.getElementById('veh-fecha-venta').value = v.fechaVenta || '';
    document.getElementById('veh-modalidad-socio').value = v.modalidadSocio || 'PROPIO';
    document.getElementById('veh-num-socios-negocio').value = String(v.numSociosNegocio || 2);
    populatePartnerSelectsInVehicleModal(v.socioInversionistaId, v.sociosNegocioIds || []);

    const mode = v.modalidadSocio || 'PROPIO';
    document.getElementById('group-select-inversionista').style.display =
      mode === 'INVERSIONISTA' || mode === 'COMBINADO' ? 'flex' : 'none';
    document.getElementById('group-cantidad-negocio').style.display =
      mode === 'NEGOCIO' || mode === 'COMBINADO' ? 'flex' : 'none';
    document.getElementById('group-checkboxes-negocio').style.display =
      mode === 'NEGOCIO' || mode === 'COMBINADO' ? 'flex' : 'none';

    document.getElementById('veh-capital-carlos').value = formatNumberWithDots(fin.capitalCompraCarlos);
    document.getElementById('veh-capital-socios').value = formatNumberWithDots(Math.max(0, fin.precioCompra - fin.capitalCompraCarlos));
    updateVehiclePartnerPreview();
  } else {
    document.getElementById('modal-vehicle-title').textContent = 'Registrar Nuevo Vehículo en Inventario';
    document.getElementById('veh-id').value = '';
    document.getElementById('veh-fecha-compra').value = getTodayISO();
    document.getElementById('veh-fecha-venta').value = '';
    document.getElementById('veh-anio').value = new Date().getFullYear();
    document.getElementById('veh-modalidad-socio').value = 'PROPIO';
    populatePartnerSelectsInVehicleModal('', []);
    handlePartnerModeChange();
  }

  document.getElementById('modal-vehicle').classList.add('open');
}

function saveVehicle(event) {
  event.preventDefault();
  const id = document.getElementById('veh-id').value;
  const checkedNegIds = Array.from(document.querySelectorAll('input[name="veh-socio-neg-check"]:checked')).map((c) => c.value);

  const colorVal = document.getElementById('veh-color').value.trim();
  const kmVal = parseCurrencyInput(document.getElementById('veh-kilometraje').value);
  const precioCompraVal = parseCurrencyInput(document.getElementById('veh-precio-compra').value);
  const capitalCarlosVal = Math.min(precioCompraVal, parseCurrencyInput(document.getElementById('veh-capital-carlos').value));
  const selectedMoneyLocId = document.getElementById('veh-money-location-id').value;

  const payload = {
    id: id || 'veh-' + Date.now(),
    condicion: document.getElementById('veh-condicion').value,
    estado: document.getElementById('veh-estado').value,
    placa: document.getElementById('veh-placa').value.toUpperCase().trim(),
    marca: document.getElementById('veh-marca').value.trim(),
    anio: Number(document.getElementById('veh-anio').value) || new Date().getFullYear(),
    color: colorVal,
    kilometraje: kmVal,
    colorKm: `${colorVal || 'Color'} • ${formatNumberWithDots(kmVal)} km`,
    propietario: document.getElementById('veh-propietario').value.trim(),
    propContacto: document.getElementById('veh-prop-contacto').value.trim(),
    soat: document.getElementById('veh-soat').value,
    tecno: document.getElementById('veh-tecno').value,
    precioCompra: precioCompraVal,
    precioPublicado: parseCurrencyInput(document.getElementById('veh-precio-publicado').value),
    precioVenta: parseCurrencyInput(document.getElementById('veh-precio-venta').value),
    capitalCompraCarlos: capitalCarlosVal,
    fechaCompra: document.getElementById('veh-fecha-compra').value || getTodayISO(),
    fechaVenta: document.getElementById('veh-fecha-venta').value || (document.getElementById('veh-estado').value === 'Vendido' ? getTodayISO() : ''),
    modalidadSocio: document.getElementById('veh-modalidad-socio').value,
    socioInversionistaId: document.getElementById('veh-socio-inversionista').value || '',
    numSociosNegocio: Number(document.getElementById('veh-num-socios-negocio').value) || 2,
    sociosNegocioIds: checkedNegIds
  };

  // Si seleccionó descontar el aporte de capital propio de Carlos de una Ubicación de Dinero Libre
  if (selectedMoneyLocId && capitalCarlosVal > 0) {
    adjustMoneyLocationBalance(selectedMoneyLocId, -capitalCarlosVal);
  }

  if (id) {
    const idx = db.vehicles.findIndex((v) => v.id === id);
    if (idx !== -1) {
      payload.gastos = db.vehicles[idx].gastos || [];
      payload.peritaje = db.vehicles[idx].peritaje || null;
      db.vehicles[idx] = payload;
    }
  } else {
    payload.gastos = [];
    payload.peritaje = null;
    db.vehicles.unshift(payload);
  }

  saveDB();
  closeModal('modal-vehicle');
}

function quickChangeVehicleStatus(vehId, newStatus) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  if (newStatus === 'Vendido') {
    if (!v.fechaVenta) v.fechaVenta = getTodayISO();
    if (!v.precioVenta || v.precioVenta <= 0) {
      const suggested = v.precioPublicado || v.precioCompra;
      const input = prompt(
        `El vehículo ${v.marca} (${v.placa}) pasa a estado VENDIDO.\nIngresa el Precio Final de Venta ($) para calcular cuánto quedó al final:`,
        formatNumberWithDots(suggested)
      );
      if (input !== null) {
        const parsed = parseCurrencyInput(input);
        if (parsed > 0) v.precioVenta = parsed;
      }
    }
  }

  v.estado = newStatus;
  saveDB();
}

function deleteVehicle(vehId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;
  if (!confirm(`¿Seguro que deseas eliminar el vehículo ${v.marca} (${v.placa}) y sus registros asociados?`)) return;
  db.vehicles = db.vehicles.filter((item) => item.id !== vehId);
  saveDB();
}

// ============================================================================
// GASTOS POR VEHÍCULO CON DESCUENTO DE DINERO LIBRE Y APORTANTE DE CAPITAL
// ============================================================================
function openVehicleExpensesModal(vehId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  document.getElementById('exp-veh-id').value = v.id;
  document.getElementById('modal-veh-exp-title').textContent = `Gastos y Liquidación: ${v.marca} (${v.placa})`;
  document.getElementById('modal-veh-exp-subtitle').textContent = `Propietario: ${v.propietario} • Estado: ${v.estado}`;
  document.getElementById('vexp-fecha').value = getTodayISO();
  document.getElementById('vexp-concepto').value = '';
  document.getElementById('vexp-valor').value = '';

  populateMoneyLocationsSelect('vexp-money-location', '', false);

  // Selector de quién aportó el capital de este gasto (Carlos o un Socio)
  const pagadoSelect = document.getElementById('vexp-pagado-por');
  if (pagadoSelect) {
    pagadoSelect.innerHTML =
      `<option value="CARLOS">👑 Carlos (Capital Propio — Descuenta de Ubicación)</option>` +
      db.partners
        .map((p) => `<option value="${p.id}">🤝 Socio: ${escapeHtml(p.nombre)} (Suma a capital del socio)</option>`)
        .join('');
  }

  renderVehicleExpensesModalContent(v);
  document.getElementById('modal-veh-expenses').classList.add('open');
}

function renderVehicleExpensesModalContent(v) {
  const fin = calculateVehicleFinancials(v);
  populateMoneyLocationsSelect('vexp-money-location', '', false);

  document.getElementById('veh-exp-summary-kpis').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label"><span>Precio Compra</span></div>
      <div class="kpi-value" style="font-size: 18px;">${formatCOP(fin.precioCompra)}</div>
      <div class="kpi-sub">Carlos: ${formatCOP(fin.capitalCompraCarlos)}</div>
    </div>
    <div class="kpi-card kpi-amber">
      <div class="kpi-label"><span>Gastos Alistamiento</span></div>
      <div class="kpi-value" style="font-size: 18px;">${formatCOP(fin.totalAlistamiento)}</div>
    </div>
    <div class="kpi-card kpi-purple">
      <div class="kpi-label"><span>Gastos Comisiones</span></div>
      <div class="kpi-value" style="font-size: 18px;">${formatCOP(fin.totalComisiones)}</div>
    </div>
    <div class="kpi-card kpi-green">
      <div class="kpi-label"><span>Costo Total Acumulado</span></div>
      <div class="kpi-value" style="font-size: 18px;">${formatCOP(fin.costoTotal)}</div>
      <div class="kpi-sub">Cap. Total Carlos: ${formatCOP(fin.capitalTotalCarlosEnVehiculo)}</div>
    </div>
  `;

  const tbody = document.getElementById('veh-expenses-list-tbody');
  const gastos = v.gastos || [];
  if (gastos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 18px; color: var(--text-muted);">
          Este vehículo aún no tiene gastos de alistamiento ni comisiones registrados.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = gastos
      .map((g) => {
        const locLabel = g.locationId ? getMoneyLocationLabel(g.locationId) : 'Sin ubicación';
        let aportanteLabel = '👑 Carlos';
        if (g.pagadoPor && g.pagadoPor.startsWith('soc-')) {
          const sp = db.partners.find((p) => p.id === g.pagadoPor);
          aportanteLabel = `🤝 ${sp ? sp.nombre : 'Socio'}`;
        }
        return `
          <tr>
            <td>${g.fecha || '-'}</td>
            <td>
              <span class="badge ${g.tipo === 'Alistamiento' ? 'status-alistamiento' : 'status-compra'}">
                ${g.tipo === 'Alistamiento' ? '🔧 Alistamiento' : '🤝 Comisión'}
              </span>
            </td>
            <td style="font-weight: 600;">${escapeHtml(g.concepto)}</td>
            <td>
              <div style="font-size: 12px; color: #38bdf8; font-weight: 600;">${escapeHtml(locLabel)}</div>
              <div style="font-size: 11px; color: var(--text-muted);">Capital: ${escapeHtml(aportanteLabel)}</div>
            </td>
            <td style="font-weight: 700;">${formatCOP(g.valor)}</td>
            <td>
              <button class="btn btn-danger-ghost btn-sm" onclick="removeVehicleExpense('${v.id}', '${g.id}')">✕</button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  document.getElementById('veh-exp-final-settlement').innerHTML = `
    <h4 style="color: #60a5fa; font-size: 14px; margin-bottom: 4px;">
      📊 Resumen de Liquidación (${v.estado === 'Vendido' ? 'VEHÍCULO VENDIDO - RESULTADO FINAL' : 'PROYECCIÓN AL VENDER'})
    </h4>
    <div class="split-row">
      <span>Precio de Venta (${v.estado === 'Vendido' ? 'Final' : 'Proyectado'}):</span>
      <strong>${formatCOP(fin.precioReferenciaVenta)}</strong>
    </div>
    <div class="split-row">
      <span>(-) Costo Total (Compra ${formatCOP(fin.precioCompra)} + Alistamiento ${formatCOP(fin.totalAlistamiento)} + Comisiones ${formatCOP(fin.totalComisiones)}):</span>
      <strong style="color: #f87171;">- ${formatCOP(fin.costoTotal)}</strong>
    </div>
    <div class="split-row">
      <span>Capital Aportado en este Vehículo:</span>
      <span><strong style="color:#38bdf8;">Carlos: ${formatCOP(fin.capitalTotalCarlosEnVehiculo)}</strong> • <strong style="color:#fcd34d;">Socio(s): ${formatCOP(fin.capitalTotalSociosEnVehiculo)}</strong></span>
    </div>
    <div class="split-row">
      <span><strong>(=) Ganancia Neta Total del Vehículo (Cuánto quedó al final):</strong></span>
      <strong style="color: ${fin.gananciaNeta >= 0 ? '#10b981' : '#ef4444'}; font-size: 15px;">${formatCOP(fin.gananciaNeta)}</strong>
    </div>
    <div class="split-row">
      <span>Reparto con Socios (${escapeHtml(fin.resumenSociedad)}):</span>
      <strong style="color: #fcd34d;">Socio(s): ${formatCOP(fin.totalPagosSocios)}</strong>
    </div>
    <div class="split-row">
      <span><strong>🏆 Ganancia Libre Carlos (${fin.miPorcentaje.toFixed(1)}%):</strong></span>
      <strong style="color: #38bdf8; font-size: 16px;">${formatCOP(fin.miGananciaNeta)}</strong>
    </div>
  `;
}

function addVehicleExpense(event) {
  event.preventDefault();
  const vehId = document.getElementById('exp-veh-id').value;
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  const valor = parseCurrencyInput(document.getElementById('vexp-valor').value);
  const locationId = document.getElementById('vexp-money-location').value;
  const pagadoPor = document.getElementById('vexp-pagado-por')?.value || 'CARLOS';

  const newExp = {
    id: 'vexp-' + Date.now(),
    tipo: document.getElementById('vexp-tipo').value,
    concepto: document.getElementById('vexp-concepto').value.trim(),
    valor: valor,
    locationId: locationId,
    pagadoPor: pagadoPor,
    fecha: document.getElementById('vexp-fecha').value || getTodayISO()
  };

  // Descontar automáticamente del saldo de la Ubicación de Dinero Libre seleccionada
  if (locationId && valor > 0) {
    adjustMoneyLocationBalance(locationId, -valor);
  }

  if (!Array.isArray(v.gastos)) v.gastos = [];
  v.gastos.push(newExp);

  saveDB();
  document.getElementById('vexp-concepto').value = '';
  document.getElementById('vexp-valor').value = '';
  renderVehicleExpensesModalContent(v);
}

function removeVehicleExpense(vehId, expId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;
  const expToRemove = (v.gastos || []).find((g) => g.id === expId);
  if (expToRemove && expToRemove.locationId && expToRemove.valor) {
    // Reintegrar el valor a la ubicación de dinero libre al eliminar el gasto
    adjustMoneyLocationBalance(expToRemove.locationId, Number(expToRemove.valor));
  }
  v.gastos = (v.gastos || []).filter((g) => g.id !== expId);
  saveDB();
  renderVehicleExpensesModalContent(v);
}

function quickMarkAsSold() {
  const vehId = document.getElementById('exp-veh-id').value;
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  const currentSale = v.precioVenta || v.precioPublicado || v.precioCompra;
  const input = prompt(
    `Confirmar Precio Final de Venta ($) para ${v.marca} (${v.placa}):`,
    formatNumberWithDots(currentSale)
  );
  if (input === null) return;

  const parsed = parseCurrencyInput(input);
  if (parsed > 0) {
    v.precioVenta = parsed;
    v.estado = 'Vendido';
    if (!v.fechaVenta) v.fechaVenta = getTodayISO();
    saveDB();
    renderVehicleExpensesModalContent(v);
  }
}

function printSettlementFromExpenseModal() {
  const vehId = document.getElementById('exp-veh-id').value;
  if (vehId) printSettlementPDF(vehId);
}

// ============================================================================
// GENERADORES DE IMPRESIÓN / PDF CON IDENTIDAD CARTECH AUTOMÓVILES
// ============================================================================
function getCartechLogoPrintHTML() {
  return `
    <div style="display:inline-flex; flex-direction:column; align-items:center;">
      <div style="display:inline-flex; border:2.5px solid #003893; border-radius:3px; overflow:hidden; background:#fff;">
        <span style="background:#ffffff; color:#003893; font-weight:900; font-size:24px; letter-spacing:1.5px; padding:4px 12px; font-family:'Arial Black',Impact,sans-serif;">CAR</span>
        <span style="background:#003893; color:#ffffff; font-weight:900; font-size:24px; letter-spacing:1.5px; padding:4px 12px; font-family:'Arial Black',Impact,sans-serif;">TECH</span>
      </div>
      <div style="font-size:9.5px; font-weight:800; letter-spacing:1px; color:#111827; margin-top:3px; font-family:Arial,sans-serif;">
        COMERCIALIZADORA DE VEHÍCULOS
      </div>
    </div>
  `;
}

// 2. IMPRESIÓN / PDF DE HOJA DE PERITAJE TÉCNICO (POR ZONAS Y COSTOS MANUALES)
function printPeritajePDF(vehId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  const p = v.peritaje || {};
  const detalles = p.detalles || {};
  const costosManuales = p.costosManuales || {};
  const sc = calculateDetailedPeritajeScores(p);
  const { color, km } = getVehicleColorAndKm(v);

  function getZoneBadgeInfo(zoneKey) {
    const val = detalles[zoneKey] || 'OPTIMO';
    return getDamageOptionByVal(val);
  }

  function buildSvgZone(x, y, w, h, zoneKey, titleShort, rx = 7) {
    const info = getZoneBadgeInfo(zoneKey);
    const fillBg = info.val === 'OPTIMO' ? '#ecfdf5' : (info.color === '#eab308' ? '#fef9c3' : (info.color === '#f97316' ? '#ffedd5' : '#fee2e2'));
    const strokeCol = info.color;
    return `
      <g>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fillBg}" stroke="${strokeCol}" stroke-width="2.2" />
        <text x="${x + w / 2}" y="${y + h / 2 - 4}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#0f172a" font-family="Arial">${titleShort}</text>
        <text x="${x + w / 2}" y="${y + h / 2 + 10}" text-anchor="middle" font-size="9.5" font-weight="900" fill="${strokeCol}" font-family="Arial">[${info.tag}]</text>
      </g>
    `;
  }

  const llantasColor = getScoreBarColor(sc.llantasPct);
  const carDiagramSVG = `
    <svg viewBox="0 0 360 250" width="100%" height="235" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px;">
      <text x="180" y="16" text-anchor="middle" font-size="10.5" font-weight="800" fill="#003893" font-family="Arial">DIAGRAMA DE ZONAS DEL VEHÍCULO Y ESTADO DE LLANTAS</text>
      <!-- Zona 1: Frente -->
      ${buildSvgZone(100, 24, 160, 40, 'zonaFrente', '1. FRENTE (Bomper / Capó)', 10)}
      <!-- Zona 2: Lateral Izquierdo -->
      ${buildSvgZone(18, 70, 88, 120, 'zonaLateralIzq', '2. LATERAL IZQ.')}
      <!-- Zona 5: Techo y Estructura Superior -->
      ${buildSvgZone(112, 70, 136, 62, 'zonaTecho', '5. TECHO / SUP.')}
      <!-- Zona 6: Chasis y Bajos -->
      ${buildSvgZone(112, 138, 136, 52, 'zonaChasis', '6. CHASIS Y BAJOS')}
      <!-- Zona 3: Lateral Derecho -->
      ${buildSvgZone(254, 70, 88, 120, 'zonaLateralDer', '3. LATERAL DER.')}
      <!-- Zona 4: Parte Trasera -->
      ${buildSvgZone(100, 196, 160, 40, 'zonaTrasera', '4. PARTE TRASERA (Baúl/Bomper)', 10)}
      <!-- Indicador de Llantas en las 4 esquinas -->
      <rect x="20" y="28" width="72" height="32" rx="6" fill="#eff6ff" stroke="${llantasColor}" stroke-width="2" />
      <text x="56" y="42" text-anchor="middle" font-size="8.5" font-weight="800" fill="#1e293b" font-family="Arial">LLANTAS</text>
      <text x="56" y="54" text-anchor="middle" font-size="10" font-weight="900" fill="${llantasColor}" font-family="Arial">${sc.llantasPct}% VIDA</text>
      <rect x="268" y="28" width="72" height="32" rx="6" fill="#eff6ff" stroke="${llantasColor}" stroke-width="2" />
      <text x="304" y="42" text-anchor="middle" font-size="8.5" font-weight="800" fill="#1e293b" font-family="Arial">MECÁNICA</text>
      <text x="304" y="54" text-anchor="middle" font-size="10" font-weight="900" fill="${getScoreBarColor(sc.mecanicaPct)}" font-family="Arial">${sc.mecanicaPct}%</text>
    </svg>
  `;

  const catBarsData = [
    { name: 'ESTRUCTURA Y CHASIS (Ponderación 28%)', pct: sc.chasisPct },
    { name: 'MECÁNICA, MOTOR Y CAJA (Ponderación 27%)', pct: sc.mecanicaPct },
    { name: 'LATONERÍA CARROCERÍA', pct: sc.latoneriaPct },
    { name: 'PINTURA Y ACABADO', pct: sc.pinturaPct },
    { name: 'LLANTAS (' + sc.llantasPct + '%) Y VIDRIOS (' + sc.vidriosPct + '%)', pct: sc.vidriosLlantasPct },
    { name: 'ESTANQUEIDAD / FLUIDOS (SIN FUGAS)', pct: sc.fugasPct },
    { name: 'TAPICERÍA, INTERIOR Y ELÉCTRICO', pct: sc.interiorPct }
  ];

  const catBarsHtml = catBarsData
    .map((c) => {
      const col = getScoreBarColor(c.pct);
      const tag = c.pct >= 90 ? 'ÓPTIMO' : (c.pct >= 60 ? 'ACEPTABLE' : 'DEFICIENTE');
      return `
        <div style="margin-bottom:7px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:2px; color:#1e293b;">
            <span>${c.name}</span>
            <span style="color:${col};">${c.pct}% (${tag})</span>
          </div>
          <div style="width:100%; height:10px; background:#e2e8f0; border-radius:99px; overflow:hidden; border:1px solid #cbd5e1;">
            <div style="width:${c.pct}%; height:100%; background:${col};"></div>
          </div>
        </div>
      `;
    })
    .join('');

  // Tabla resumen de las zonas evaluadas y sus costos manuales (si se digitaron)
  const zoneRowsHtml = PERITAJE_ZONES.map((z) => {
    const info = getZoneBadgeInfo(z.key);
    const cleanLabel = info.label.replace(/^[🟢🟡🟠🔴]\s*/, '');
    const manualCost = Number(costosManuales[z.key]) || 0;
    return `
      <tr>
        <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#003893;">${escapeHtml(z.titulo.replace(/^[^\s]+\s*/, ''))}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; color:#475569;">${escapeHtml(z.subtitulo)}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; font-weight:700; color:${info.color};">${escapeHtml(cleanLabel)}</td>
        <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:700;">${manualCost > 0 ? formatCOP(manualCost) : '$ 0'}</td>
      </tr>
    `;
  }).join('') + `
    <tr>
      <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; font-weight:700; color:#003893;">11. Llantas (Escala 10% en 10%)</td>
      <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; color:#475569;">Juego de llantas del vehículo</td>
      <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; font-weight:700; color:${llantasColor};">${sc.llantasPct}% de vida útil</td>
      <td style="padding:5px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:700;">${Number(costosManuales.zonaLlantas) > 0 ? formatCOP(costosManuales.zonaLlantas) : '$ 0'}</td>
    </tr>
  `;

  const genColor = getScoreBarColor(sc.generalPct);
  const totalCostoFinal = Number(p.costoEstimado) || sc.totalManualCost || 0;

  const printHtml = `
    <!DOCTYPE html>
    <html lang="es-CO">
    <head>
      <meta charset="UTF-8" />
      <title>Hoja de Peritaje Cartech - ${escapeHtml(v.placa)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #f1f5f9; padding: 18px; }
        .page { max-width: 980px; margin: 0 auto; background: #ffffff; border: 2px solid #003893; border-radius: 8px; padding: 18px 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); }
        .no-print-bar { max-width: 980px; margin: 0 auto 12px; display: flex; justify-content: space-between; align-items: center; background: #003893; color: #fff; padding: 10px 16px; border-radius: 8px; }
        .btn-print { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
        .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #003893; padding-bottom: 12px; margin-bottom: 12px; }
        .info-two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
        .info-card { border: 1.5px solid #003893; border-radius: 6px; overflow: hidden; }
        .info-card-title { background: #003893; color: #ffffff; font-size: 11.5px; font-weight: 800; padding: 5px 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; padding: 9px 12px; font-size: 11.5px; }
        .info-item span { color: #64748b; font-size: 10.5px; display: block; text-transform: uppercase; font-weight: 700; }
        .info-item strong { color: #0f172a; font-size: 12.5px; }
        .middle-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 14px; margin-bottom: 12px; align-items: stretch; }
        .scale-legend { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 5px 10px; font-size: 10.5px; font-weight: 800; margin-top: 8px; }
        .obs-box { border: 1.5px solid #003893; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; background: #f8fafc; font-size: 11.5px; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 26px; padding-top: 10px; }
        .sig-line { border-top: 1.5px solid #0f172a; text-align: center; padding-top: 5px; font-size: 11.5px; font-weight: 700; }
        @media print {
          body { background: #fff; padding: 0; }
          .no-print-bar { display: none !important; }
          .page { box-shadow: none; border: 2px solid #003893; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span><strong>CARTECH AUTOMÓVILES</strong> — Vista previa de impresión / Guardar como PDF</span>
        <div style="display:flex; gap:8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
          <button class="btn-print" style="background:#475569;" onclick="window.close()">Cerrar</button>
        </div>
      </div>

      <div class="page">
        <div class="header-row">
          ${getCartechLogoPrintHTML()}
          <div style="text-align:center;">
            <div style="font-size:17px; font-weight:900; color:#003893; letter-spacing:0.4px;">HOJA TÉCNICA DE PERITAJE E INSPECCIÓN VEHICULAR</div>
            <div style="font-size:11.5px; color:#475569; font-weight:600; margin-top:2px;">Fecha de Inspección: ${escapeHtml(p.fecha || getTodayISO())} • Código: PRT-${escapeHtml(v.placa)}</div>
          </div>
          <div style="text-align:right; background:${genColor}; color:#fff; padding:8px 14px; border-radius:8px; min-width:140px;">
            <div style="font-size:10px; font-weight:800; text-transform:uppercase;">Calificación Global</div>
            <div style="font-size:24px; font-weight:900; line-height:1.1;">${sc.generalPct}%</div>
            <div style="font-size:11px; font-weight:800;">${sc.escalaLabel} (${escapeHtml(p.veredicto || 'Evaluado')})</div>
          </div>
        </div>

        <div class="info-two-cols">
          <div class="info-card">
            <div class="info-card-title">🚘 1. Datos Técnicos del Vehículo</div>
            <div class="info-grid">
              <div class="info-item"><span>Placa</span><strong style="font-size:15px; color:#003893; font-family:monospace;">${escapeHtml(v.placa)}</strong></div>
              <div class="info-item"><span>Marca y Línea</span><strong>${escapeHtml(v.marca)}</strong></div>
              <div class="info-item"><span>Modelo (Año)</span><strong>${v.anio} (${escapeHtml(v.condicion)})</strong></div>
              <div class="info-item"><span>Kilometraje</span><strong>${formatNumberWithDots(km)} km</strong></div>
              <div class="info-item"><span>Color</span><strong>${escapeHtml(color)}</strong></div>
              <div class="info-item"><span>SOAT / Tecnomecánica</span><strong>SOAT: ${escapeHtml(v.soat || 'N/A')} | Tecno: ${escapeHtml(v.tecno || 'N/A')}</strong></div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-title">👤 2. Propietario, Documentación y Valoración</div>
            <div class="info-grid">
              <div class="info-item"><span>Propietario / Cliente</span><strong>${escapeHtml(v.propietario || '-')}</strong></div>
              <div class="info-item"><span>Teléfono Contacto</span><strong>${escapeHtml(v.propContacto || '-')}</strong></div>
              <div class="info-item"><span>Estado Documental</span><strong>${escapeHtml(p.docsEstado || 'Al día')}</strong></div>
              <div class="info-item"><span>Valor Comercial / Lista</span><strong style="color:#003893;">${formatCOP(v.precioPublicado || v.precioVenta || v.precioCompra)}</strong></div>
              <div class="info-item"><span>Total Costo Daños / Alist.</span><strong style="color:#d97706;">${formatCOP(totalCostoFinal)}</strong></div>
              <div class="info-item"><span>Veredicto Cartech</span><strong style="color:${genColor};">${escapeHtml(p.veredicto || 'Excelente')} (${sc.escalaLabel})</strong></div>
            </div>
          </div>
        </div>

        <div class="middle-grid">
          <div class="info-card" style="padding:10px 12px;">
            <div style="font-size:12px; font-weight:900; color:#003893; margin-bottom:8px; text-transform:uppercase; border-bottom:1.5px solid #003893; padding-bottom:4px;">
              📊 Estado General por Sistemas y Porcentaje de Conservación
            </div>
            ${catBarsHtml}
            <div class="scale-legend">
              <span style="color:#ef4444;">🔴 DEFICIENTE: 0% a 59%</span>
              <span style="color:#d97706;">🟡 ACEPTABLE: 60% a 89%</span>
              <span style="color:#10b981;">🟢 ÓPTIMO: 90% a 100%</span>
            </div>
          </div>

          <div class="info-card" style="padding:8px 10px; display:flex; flex-direction:column; justify-content:space-between;">
            ${carDiagramSVG}
            <div style="font-size:9.5px; color:#475569; text-align:center; margin-top:4px; font-weight:700;">
              ESCALA: Óptimo (90-100%) • Aceptable (60-89%) • Deficiente (0-59%)
            </div>
          </div>
        </div>

        <!-- Tabla de Zonas Evaluadas y Costos de Daños -->
        <div class="info-card" style="margin-bottom: 12px;">
          <div class="info-card-title">📋 3. Evaluación Detallada por Zonas y Costos de Daños / Alistamiento</div>
          <table style="width:100%; border-collapse:collapse; font-size:11px;">
            <thead>
              <tr style="background:#e2e8f0; color:#1e293b; text-transform:uppercase; font-size:10px;">
                <th style="padding:6px 8px; text-align:left;">Zona Evaluada</th>
                <th style="padding:6px 8px; text-align:left;">Componentes Incluidos</th>
                <th style="padding:6px 8px; text-align:left;">Diagnóstico / Nivel de Daño</th>
                <th style="padding:6px 8px; text-align:right;">Costo Daño ($)</th>
              </tr>
            </thead>
            <tbody>
              ${zoneRowsHtml}
              <tr style="background:#003893; color:#fff; font-weight:900;">
                <td colspan="3" style="padding:7px 8px; text-align:right;">TOTAL COSTO DE DAÑOS / ALISTAMIENTO:</td>
                <td style="padding:7px 8px; text-align:right; font-size:13px;">${formatCOP(totalCostoFinal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="obs-box">
          <strong style="color:#003893; text-transform:uppercase;">📝 Observaciones Técnicas y Notas Documentales:</strong>
          <div style="margin-top:3px; color:#1e293b;">
            ${escapeHtml(p.observaciones || 'Vehículo inspeccionado bajo estándares técnicos de Cartech Automóviles.')}
            ${p.docsNotas ? ` • Documentación: ${escapeHtml(p.docsNotas)}` : ''}
          </div>
        </div>

        <div class="signatures">
          <div class="sig-line">
            FIRMA INSPECTOR / PERITO — CARTECH AUTOMÓVILES<br/>
            <span style="font-size:10px; font-weight:500; color:#64748b;">Comercializadora de Vehículos</span>
          </div>
          <div class="sig-line">
            FIRMA PROPIETARIO / CLIENTE (${escapeHtml(v.propietario || '')})<br/>
            <span style="font-size:10px; font-weight:500; color:#64748b;">Recibí informe de estado técnico</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
  } else {
    alert('Por favor permite las ventanas emergentes en tu navegador para generar el PDF.');
  }
}

// 3. IMPRESIÓN / PDF DE LIQUIDACIÓN FINAL DE NEGOCIO (CUENTAS CLARAS A SOCIOS)
function printSettlementPDF(vehId) {
  const v = db.vehicles.find((item) => item.id === vehId);
  if (!v) return;

  const fin = calculateVehicleFinancials(v);
  const { color, km } = getVehicleColorAndKm(v);
  const diasInv = calculateDaysInInventory(v);
  const fechaVentaStr = v.fechaVenta || (v.estado === 'Vendido' ? getTodayISO() : 'En proceso (Proyección)');

  // Construir filas de gastos del vehículo
  const gastos = v.gastos || [];
  const gastosRowsHtml = gastos.length === 0
    ? `<tr><td colspan="5" style="padding:8px; text-align:center; color:#64748b;">Sin gastos adicionales registrados en este vehículo.</td></tr>`
    : gastos.map((g) => {
        let aportante = 'Carlos (Cartech)';
        if (g.pagadoPor && g.pagadoPor.startsWith('soc-')) {
          const sp = db.partners.find((p) => p.id === g.pagadoPor);
          aportante = sp ? sp.nombre : 'Socio';
        }
        return `
          <tr>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escapeHtml(g.fecha || '-')}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-weight:700;">${escapeHtml(g.tipo)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escapeHtml(g.concepto)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escapeHtml(aportante)}</td>
            <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:700;">${formatCOP(g.valor)}</td>
          </tr>
        `;
      }).join('');

  // Construir filas de Liquidación por Participante (Carlos + cada Socio Participante)
  const participantesLiquidacion = [];

  // 1. Fila de Carlos (Cartech Automóviles)
  participantesLiquidacion.push({
    nombre: 'Carlos Téllez (Cartech Automóviles)',
    rol: 'Gestor / Capital Propio',
    capitalAportado: fin.capitalTotalCarlosEnVehiculo,
    pctUtilidad: fin.miPorcentaje,
    utilidadCorrespondiente: fin.miGananciaNeta,
    totalAEntregar: fin.capitalTotalCarlosEnVehiculo + fin.miGananciaNeta
  });

  // 2. Fila de Socio Inversionista (si aplica)
  if ((fin.modalidad === 'INVERSIONISTA' || fin.modalidad === 'COMBINADO') && fin.invPartner) {
    const capSocioInv = fin.capitalPorSocioMap[fin.invPartner.id] || 0;
    participantesLiquidacion.push({
      nombre: fin.invPartner.nombre,
      rol: 'Socio Inversionista (50/50)',
      capitalAportado: capSocioInv,
      pctUtilidad: fin.pctInversionista,
      utilidadCorrespondiente: fin.pagoInversionista,
      totalAEntregar: capSocioInv + fin.pagoInversionista
    });
  } else if (fin.modalidad === 'INVERSIONISTA' && !fin.invPartner) {
    const capSocioInv = fin.capitalTotalSociosEnVehiculo;
    participantesLiquidacion.push({
      nombre: 'Socio Inversionista',
      rol: 'Inversionista (50/50)',
      capitalAportado: capSocioInv,
      pctUtilidad: 50,
      utilidadCorrespondiente: fin.pagoInversionista,
      totalAEntregar: capSocioInv + fin.pagoInversionista
    });
  }

  // 3. Filas de Socios de Negocio (si aplica)
  if (fin.modalidad === 'NEGOCIO' || fin.modalidad === 'COMBINADO') {
    if (fin.negPartners.length > 0) {
      fin.negPartners.forEach((np) => {
        const capSocioNeg = fin.capitalPorSocioMap[np.id] || 0;
        participantesLiquidacion.push({
          nombre: np.nombre,
          rol: `Socio de Negocio (1/${fin.numNegocio})`,
          capitalAportado: capSocioNeg,
          pctUtilidad: fin.pctPorCadaSocioNegocio,
          utilidadCorrespondiente: fin.pagoPorCadaSocioNegocio,
          totalAEntregar: capSocioNeg + fin.pagoPorCadaSocioNegocio
        });
      });
    } else {
      const countOtros = Math.max(1, fin.numNegocio - 1);
      const capCadaUno = fin.capitalTotalSociosEnVehiculo / countOtros;
      for (let i = 1; i <= countOtros; i++) {
        participantesLiquidacion.push({
          nombre: `Socio de Negocio #${i}`,
          rol: `Socio de Negocio (1/${fin.numNegocio})`,
          capitalAportado: capCadaUno,
          pctUtilidad: fin.pctPorCadaSocioNegocio,
          utilidadCorrespondiente: fin.pagoPorCadaSocioNegocio,
          totalAEntregar: capCadaUno + fin.pagoPorCadaSocioNegocio
        });
      }
    }
  }

  const participantesRowsHtml = participantesLiquidacion
    .map((pt) => `
      <tr>
        <td style="padding:8px 10px; border-bottom:1px solid #cbd5e1; font-weight:800; color:#003893;">${escapeHtml(pt.nombre)}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #cbd5e1;">${escapeHtml(pt.rol)}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right; font-weight:700;">${formatCOP(pt.capitalAportado)}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:center; font-weight:700;">${pt.pctUtilidad.toFixed(1)}%</td>
        <td style="padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right; font-weight:700; color:${pt.utilidadCorrespondiente >= 0 ? '#059669' : '#dc2626'};">
          ${formatCOP(pt.utilidadCorrespondiente)}
        </td>
        <td style="padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right; font-weight:900; font-size:13.5px; background:#eff6ff; color:#003893;">
          ${formatCOP(pt.totalAEntregar)}
        </td>
      </tr>
    `)
    .join('');

  const signaturesHtml = participantesLiquidacion
    .map((pt) => `
      <div style="border-top:1.5px solid #0f172a; text-align:center; padding-top:6px; font-size:11.5px; font-weight:700; margin-top:28px;">
        FIRMA DE CONFORMIDAD: ${escapeHtml(pt.nombre.toUpperCase())}<br/>
        <span style="font-size:10px; font-weight:500; color:#64748b;">Total Liquidado (Capital + Utilidad): ${formatCOP(pt.totalAEntregar)}</span>
      </div>
    `)
    .join('');

  const printHtml = `
    <!DOCTYPE html>
    <html lang="es-CO">
    <head>
      <meta charset="UTF-8" />
      <title>Liquidación de Negocio Cartech - ${escapeHtml(v.placa)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #f1f5f9; padding: 18px; }
        .page { max-width: 940px; margin: 0 auto; background: #ffffff; border: 2px solid #003893; border-radius: 8px; padding: 22px 26px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); }
        .no-print-bar { max-width: 940px; margin: 0 auto 12px; display: flex; justify-content: space-between; align-items: center; background: #003893; color: #fff; padding: 10px 16px; border-radius: 8px; }
        .btn-print { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
        .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #003893; padding-bottom: 14px; margin-bottom: 16px; }
        .section-box { border: 1.5px solid #003893; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
        .section-title { background: #003893; color: #fff; font-size: 12px; font-weight: 800; padding: 6px 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px; background: #f8fafc; }
        .sum-card { background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; }
        .sum-card span { font-size: 10.5px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; }
        .sum-card strong { font-size: 15px; color: #0f172a; margin-top: 2px; display: block; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #e2e8f0; color: #1e293b; text-transform: uppercase; font-size: 10.5px; font-weight: 800; padding: 7px 10px; text-align: left; border-bottom: 1.5px solid #94a3b8; }
        .sig-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px; margin-top: 16px; }
        @media print {
          body { background: #fff; padding: 0; }
          .no-print-bar { display: none !important; }
          .page { box-shadow: none; border: 2px solid #003893; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span><strong>CARTECH AUTOMÓVILES</strong> — Estado de Liquidación Final a Socios</span>
        <div style="display:flex; gap:8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
          <button class="btn-print" style="background:#475569;" onclick="window.close()">Cerrar</button>
        </div>
      </div>

      <div class="page">
        <div class="header-row">
          ${getCartechLogoPrintHTML()}
          <div style="text-align:center;">
            <div style="font-size:17px; font-weight:900; color:#003893;">ACTA DE LIQUIDACIÓN FINAL DE NEGOCIO Y CUENTAS A SOCIOS</div>
            <div style="font-size:12px; color:#475569; font-weight:600; margin-top:3px;">
              Fecha de Emisión: ${getTodayISO()} • Estado del Vehículo: <strong>${escapeHtml(v.estado.toUpperCase())}</strong>
            </div>
          </div>
          <div style="text-align:right; background:#003893; color:#fff; padding:8px 14px; border-radius:8px;">
            <div style="font-size:10px; font-weight:700; text-transform:uppercase;">Placa Vehículo</div>
            <div style="font-size:20px; font-weight:900; font-family:monospace;">${escapeHtml(v.placa)}</div>
          </div>
        </div>

        <!-- 1. Datos del Vehículo y Tiempos de Rotación -->
        <div class="section-box">
          <div class="section-title">🚘 1. Información del Vehículo y Tiempos de Inventario</div>
          <div class="summary-grid">
            <div class="sum-card">
              <span>Vehículo / Modelo</span>
              <strong>${escapeHtml(v.marca)} (${v.anio})</strong>
            </div>
            <div class="sum-card">
              <span>Color y Kilometraje</span>
              <strong>${escapeHtml(color)} • ${formatNumberWithDots(km)} km</strong>
            </div>
            <div class="sum-card">
              <span>Fecha Compra / Fecha Venta</span>
              <strong>${escapeHtml(v.fechaCompra || '-')} → ${escapeHtml(fechaVentaStr)}</strong>
            </div>
            <div class="sum-card">
              <span>Tiempo en Inventario</span>
              <strong style="color:#003893;">${formatNumberWithDots(diasInv)} día(s)</strong>
            </div>
          </div>
        </div>

        <!-- 2. Balance Financiero General del Negocio -->
        <div class="section-box">
          <div class="section-title">💵 2. Balance Financiero del Vehículo (Compra, Gastos, Venta y Utilidad Neta)</div>
          <div class="summary-grid" style="grid-template-columns: repeat(5, 1fr);">
            <div class="sum-card">
              <span>1. Compra Inicial</span>
              <strong>${formatCOP(fin.precioCompra)}</strong>
            </div>
            <div class="sum-card">
              <span>2. Total Gastos (${gastos.length})</span>
              <strong style="color:#d97706;">+ ${formatCOP(fin.totalAlistamiento + fin.totalComisiones)}</strong>
            </div>
            <div class="sum-card" style="background:#eff6ff; border-color:#93c5fd;">
              <span>3. Inversión Total</span>
              <strong style="color:#003893;">${formatCOP(fin.costoTotal)}</strong>
            </div>
            <div class="sum-card">
              <span>4. Valor Final Venta</span>
              <strong style="color:#0284c7;">${formatCOP(fin.precioReferenciaVenta)}</strong>
            </div>
            <div class="sum-card" style="background:#ecfdf5; border-color:#6ee7b7;">
              <span>5. Utilidad Neta (${fin.margenPct.toFixed(1)}%)</span>
              <strong style="color:${fin.gananciaNeta >= 0 ? '#059669' : '#dc2626'};">${formatCOP(fin.gananciaNeta)}</strong>
            </div>
          </div>

          <!-- Detalle de Gastos del Vehículo -->
          <div style="padding: 0 12px 12px; background: #f8fafc;">
            <div style="font-size:11px; font-weight:800; color:#003893; margin-bottom:6px; text-transform:uppercase;">
              🔧 Relación Detallada de Gastos de Alistamiento y Comisiones:
            </div>
            <table style="background:#fff; border:1px solid #cbd5e1;">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Concepto / Detalle</th>
                  <th>Pagado Por</th>
                  <th style="text-align:right;">Valor ($)</th>
                </tr>
              </thead>
              <tbody>
                ${gastosRowsHtml}
                <tr style="background:#f1f5f9; font-weight:800;">
                  <td colspan="4" style="padding:7px 8px; text-align:right;">TOTAL GASTOS DEL VEHÍCULO (Alistamiento: ${formatCOP(fin.totalAlistamiento)} + Comisiones: ${formatCOP(fin.totalComisiones)}):</td>
                  <td style="padding:7px 8px; text-align:right; color:#d97706;">${formatCOP(fin.totalAlistamiento + fin.totalComisiones)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Liquidación Individualizada y Devolución de Capital + Utilidad por Socio -->
        <div class="section-box">
          <div class="section-title">🤝 3. Desglose de Liquidación a Socios (Capital Aportado + Utilidad = Total a Entregar)</div>
          <table>
            <thead>
              <tr>
                <th>Participante / Socio</th>
                <th>Modalidad / Rol</th>
                <th style="text-align:right;">Capital Aportado ($)</th>
                <th style="text-align:center;">% Utilidad</th>
                <th style="text-align:right;">Utilidad Neta ($)</th>
                <th style="text-align:right;">TOTAL A ENTREGAR ($)</th>
              </tr>
            </thead>
            <tbody>
              ${participantesRowsHtml}
              <tr style="background:#003893; color:#ffffff; font-weight:900;">
                <td colspan="2" style="padding:8px 10px;">TOTALES CONSOLIDADOS DEL NEGOCIO</td>
                <td style="padding:8px 10px; text-align:right;">${formatCOP(fin.costoTotal)}</td>
                <td style="padding:8px 10px; text-align:center;">100%</td>
                <td style="padding:8px 10px; text-align:right;">${formatCOP(fin.gananciaNeta)}</td>
                <td style="padding:8px 10px; text-align:right; font-size:14px;">${formatCOP(fin.precioReferenciaVenta)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Firmas de Conformidad -->
        <div class="sig-grid">
          ${signaturesHtml}
        </div>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
  } else {
    alert('Por favor permite las ventanas emergentes en tu navegador para generar el PDF de liquidación.');
  }
}

// ============================================================================
// CRUD SOCIOS (HOJA 4)
// ============================================================================
function openPartnerModal(partnerId = null) {
  const form = document.getElementById('form-partner');
  form.reset();

  if (partnerId) {
    const p = db.partners.find((item) => item.id === partnerId);
    if (!p) return;
    document.getElementById('modal-partner-title').textContent = 'Editar Socio';
    document.getElementById('part-id').value = p.id;
    document.getElementById('part-nombre').value = p.nombre;
    document.getElementById('part-tipo').value = p.tipo;
    document.getElementById('part-telefono').value = String(p.telefono || '').replace(/[^0-9]/g, '');
    document.getElementById('part-documento').value = p.documento ? formatNumberWithDots(parseCurrencyInput(p.documento)) : '';
    document.getElementById('part-notas').value = p.notas || '';
  } else {
    document.getElementById('modal-partner-title').textContent = 'Agregar Socio a la Base de Datos';
    document.getElementById('part-id').value = '';
  }

  document.getElementById('modal-partner').classList.add('open');
}

function savePartner(event) {
  event.preventDefault();
  const id = document.getElementById('part-id').value;
  const payload = {
    id: id || 'soc-' + Date.now(),
    nombre: document.getElementById('part-nombre').value.trim(),
    tipo: document.getElementById('part-tipo').value,
    telefono: document.getElementById('part-telefono').value.trim(),
    documento: document.getElementById('part-documento').value.trim(),
    notas: document.getElementById('part-notas').value.trim()
  };

  if (id) {
    const idx = db.partners.findIndex((p) => p.id === id);
    if (idx !== -1) db.partners[idx] = payload;
  } else {
    db.partners.push(payload);
  }

  saveDB();
  closeModal('modal-partner');
}

function deletePartner(partnerId) {
  const p = db.partners.find((item) => item.id === partnerId);
  if (!p) return;
  if (!confirm(`¿Eliminar a "${p.nombre}" de la base de datos de socios?`)) return;
  db.partners = db.partners.filter((item) => item.id !== partnerId);
  db.partnersCleanedManually = true;
  saveDB();
}

// ============================================================================
// CRUD GASTOS PROPIOS (CON DESCUENTO AUTOMÁTICO DE UBICACIÓN DE DINERO LIBRE)
// ============================================================================
function openOwnExpenseModal(expId = null) {
  const form = document.getElementById('form-own-expense');
  form.reset();

  if (expId) {
    const e = db.ownExpenses.find((item) => item.id === expId);
    if (!e) return;
    document.getElementById('modal-own-exp-title').textContent = 'Editar Gasto Propio';
    document.getElementById('oexp-id').value = e.id;
    document.getElementById('oexp-fecha').value = e.fecha;
    document.getElementById('oexp-categoria').value = e.categoria;
    document.getElementById('oexp-concepto').value = e.concepto;
    document.getElementById('oexp-valor').value = formatNumberWithDots(e.valor);
    populateMoneyLocationsSelect('oexp-location-id', e.locationId || '', false);
  } else {
    document.getElementById('modal-own-exp-title').textContent = 'Registrar Gasto Propio';
    document.getElementById('oexp-id').value = '';
    document.getElementById('oexp-fecha').value = getTodayISO();
    populateMoneyLocationsSelect('oexp-location-id', '', false);
  }

  document.getElementById('modal-own-expense').classList.add('open');
}

function saveOwnExpense(event) {
  event.preventDefault();
  const id = document.getElementById('oexp-id').value;
  const valor = parseCurrencyInput(document.getElementById('oexp-valor').value);
  const locationId = document.getElementById('oexp-location-id').value;

  if (!locationId) {
    alert('Por favor selecciona de qué Ubicación de Dinero Libre salió el pago.');
    return;
  }

  // Si estamos editando un gasto previo, reintegrar primero el monto anterior a su ubicación previa
  if (id) {
    const prevExp = db.ownExpenses.find((item) => item.id === id);
    if (prevExp && prevExp.locationId && prevExp.valor) {
      adjustMoneyLocationBalance(prevExp.locationId, Number(prevExp.valor));
    }
  }

  // Descontar el nuevo valor de la Ubicación de Dinero Libre seleccionada
  adjustMoneyLocationBalance(locationId, -valor);

  const payload = {
    id: id || 'oe-' + Date.now(),
    fecha: document.getElementById('oexp-fecha').value,
    categoria: document.getElementById('oexp-categoria').value,
    concepto: document.getElementById('oexp-concepto').value.trim(),
    valor: valor,
    locationId: locationId,
    metodo: getMoneyLocationLabel(locationId)
  };

  if (id) {
    const idx = db.ownExpenses.findIndex((item) => item.id === id);
    if (idx !== -1) db.ownExpenses[idx] = payload;
  } else {
    db.ownExpenses.unshift(payload);
  }

  saveDB();
  closeModal('modal-own-expense');
}

function deleteOwnExpense(expId) {
  const exp = db.ownExpenses.find((item) => item.id === expId);
  if (!exp) return;
  if (!confirm('¿Eliminar este gasto propio? (El valor se reintegrará automáticamente al saldo de la ubicación de dinero libre).')) return;

  if (exp.locationId && exp.valor) {
    adjustMoneyLocationBalance(exp.locationId, Number(exp.valor));
  }
  db.ownExpenses = db.ownExpenses.filter((item) => item.id !== expId);
  saveDB();
}

// ============================================================================
// EXPORTACIÓN A EXCEL (.XLSX) MULTI-HOJA CON LAS 7 HOJAS DE CARTECH
// ============================================================================
function exportToExcel() {
  const cap = calculateGlobalCapitalBreakdown();

  const hojaInventario = db.vehicles.map((v) => {
    const fin = calculateVehicleFinancials(v);
    const { color, km } = getVehicleColorAndKm(v);
    return {
      Condicion: v.condicion,
      Estado: v.estado,
      Placa: v.placa,
      Marca_y_Linea: v.marca,
      Modelo_Anio: v.anio,
      Color: color,
      Kilometraje: formatNumberWithDots(km),
      Propietario: v.propietario,
      Telefono_Propietario: v.propContacto,
      Vencimiento_SOAT: v.soat || 'N/A',
      Vencimiento_Tecnomecanica: v.tecno || 'N/A',
      Veredicto_Peritaje: v.peritaje?.veredicto || 'Pendiente',
      Precio_Compra_COP: formatCOP(fin.precioCompra),
      Gastos_Alistamiento_COP: formatCOP(fin.totalAlistamiento),
      Gastos_Comisiones_COP: formatCOP(fin.totalComisiones),
      Costo_Total_Vehiculo_COP: formatCOP(fin.costoTotal),
      Capital_Invertido_Carlos_COP: formatCOP(fin.capitalTotalCarlosEnVehiculo),
      Capital_Invertido_Socios_COP: formatCOP(fin.capitalTotalSociosEnVehiculo),
      Precio_Venta_o_Publicado_COP: formatCOP(fin.precioReferenciaVenta),
      Ganancia_Neta_Final_COP: formatCOP(fin.gananciaNeta),
      Esquema_Socios: fin.resumenSociedad,
      Pago_Total_Socios_COP: formatCOP(fin.totalPagosSocios),
      Ganancia_Libre_Carlos_COP: formatCOP(fin.miGananciaNeta)
    };
  });

  const hojaPeritajes = db.vehicles.map((v) => {
    const p = v.peritaje || {};
    return {
      Placa: v.placa,
      Vehiculo: `${v.marca} (${v.anio})`,
      Veredicto_Final: p.veredicto || 'Sin Peritaje',
      Fecha_Peritaje: p.fecha || '-',
      Estructura_Chasis: `${p.estructuraEstado || '-'} (${p.estructuraNotas || ''})`,
      Pintura_y_Lamina: `${p.pinturaEstado || '-'} (${p.pinturaNotas || ''})`,
      Motor_y_Caja: `${p.motorEstado || '-'} (${p.motorNotas || ''})`,
      Suspension_y_Frenos: `${p.suspensionEstado || '-'} (${p.suspensionNotas || ''})`,
      Documentacion_y_SOAT: `${p.docsEstado || '-'} (${p.docsNotas || ''})`,
      Costo_Estimado_Reparacion: formatCOP(p.costoEstimado || 0),
      Observaciones_Generales: p.observaciones || ''
    };
  });

  const hojaProspectos = (db.prospects || []).map((pr) => {
    const vehNames = (pr.vehiculosIds || [])
      .map((id) => db.vehicles.find((v) => v.id === id))
      .filter(Boolean)
      .map((v) => `${v.marca} (${v.placa})`)
      .join(', ');
    return {
      Tipo_Prospecto: pr.tipo || 'VENTA',
      Fecha: pr.fecha,
      Nombre_Cliente_o_Dueno: pr.nombre,
      Telefono: pr.telefono,
      Estado_Prospecto: pr.estado,
      Vehiculos_Interes_Venta: vehNames || pr.vehiculoExtra || '-',
      Presupuesto_Cliente_Venta: pr.presupuesto ? formatCOP(pr.presupuesto) : '-',
      Vehiculo_Ofrecido_Compra: pr.vehiculoOfrecido || '-',
      Placa_Ofrecida_Compra: pr.placaOfrecida || '-',
      Kilometraje_Compra: pr.kilometrajeOfrecido ? formatNumberWithDots(pr.kilometrajeOfrecido) : '-',
      Precio_Pretendido_Dueno: pr.precioPretendido ? formatCOP(pr.precioPretendido) : '-',
      Oferta_Firme_Cartech: pr.ofertaNuestra ? formatCOP(pr.ofertaNuestra) : '-',
      Notas_Seguimiento: pr.notas || ''
    };
  });

  const hojaGastosVehiculos = [];
  db.vehicles.forEach((v) => {
    (v.gastos || []).forEach((g) => {
      hojaGastosVehiculos.push({
        Placa: v.placa,
        Vehiculo: `${v.marca} (${v.anio})`,
        Estado_Vehiculo: v.estado,
        Fecha_Gasto: g.fecha,
        Tipo_Gasto: g.tipo,
        Concepto_Trabajo: g.concepto,
        Ubicacion_Dinero_Origen: g.locationId ? getMoneyLocationLabel(g.locationId) : '-',
        Valor_COP: formatCOP(g.valor)
      });
    });
  });

  const hojaCapitalSocios = [
    {
      Participante: 'Carlos (Capital Propio)',
      Tipo: 'Propietario Cartech',
      Carros_Activos: cap.carrosActivosCarlos,
      Capital_Invertido_Activo_COP: formatCOP(cap.capitalInvertidoPropioCarlos),
      Carros_Vendidos: '-',
      Ganancia_Acumulada_Vendidos_COP: '-'
    },
    ...db.partners.map((p) => {
      const st = cap.socioStats[p.id] || { capitalActivo: 0, carrosActivos: 0, carrosVendidos: 0, gananciaAcumuladaVendidos: 0 };
      return {
        Participante: p.nombre,
        Tipo: p.tipo,
        Carros_Activos: st.carrosActivos,
        Capital_Invertido_Activo_COP: formatCOP(st.capitalActivo),
        Carros_Vendidos: st.carrosVendidos,
        Ganancia_Acumulada_Vendidos_COP: formatCOP(st.gananciaAcumuladaVendidos)
      };
    })
  ];

  const hojaUbicacionesDinero = (db.moneyLocations || []).map((loc) => ({
    Tipo: loc.tipo,
    Nombre_Cuenta_o_Efectivo: loc.nombre,
    Ubicacion_Fisica_Efectivo: loc.ubicacionFisica || 'N/A (Cuenta Bancaria)',
    Saldo_Disponible_COP: formatCOP(loc.saldo)
  }));

  const hojaGastosPropios = db.ownExpenses.map((e) => ({
    Fecha: e.fecha,
    Semana_ISO: getISOWeekString(e.fecha),
    Mes: (e.fecha || '').slice(0, 7),
    Anio: (e.fecha || '').slice(0, 4),
    Categoria: e.categoria,
    Concepto: e.concepto,
    Ubicacion_Dinero_Origen: e.locationId ? getMoneyLocationLabel(e.locationId) : (e.metodo || '-'),
    Valor_COP: formatCOP(e.valor)
  }));

  const hojaDirectorio = (db.directoryProfiles || []).map((d) => ({
    Tipo_Perfil: d.tipo === 'CLIENTE_FINAL' ? 'Cliente Final' : (d.tipo === 'COMERCIANTE' ? 'Cliente Comerciante' : 'Proveedor'),
    Nombre_o_Empresa: d.nombre,
    Telefono_WhatsApp: d.telefono,
    Documento: d.documento || '-',
    Correo: d.correo || '-',
    Ciudad_o_Direccion: d.ciudad || d.direccion || '-',
    Contacto_Principal: d.contactoPrincipal || '-',
    Especialidad_o_Vehiculo: d.especialidad || d.vehiculoInteres || '-',
    Calificacion_Proveedor: d.tipo === 'PROVEEDOR' ? `${d.calificacion || 5}/5` : '-',
    Historial_y_Notas: [d.historialNegocios, d.notas].filter(Boolean).join(' | ')
  }));

  const fileName = `Cartech_Automoviles_${getTodayISO()}.xlsx`;

  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaInventario.length ? hojaInventario : [{ Info: 'Sin vehículos' }]), '1_Inventario_y_Capital');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaPeritajes.length ? hojaPeritajes : [{ Info: 'Sin peritajes' }]), '2_Hoja_de_Peritaje');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaProspectos.length ? hojaProspectos : [{ Info: 'Sin prospectos' }]), '3_Prospectos_Venta_Compra');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaCapitalSocios), '4_Capital_Carlos_y_Socios');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaUbicacionesDinero), '5_Ubicaciones_Dinero_Libre');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaGastosVehiculos.length ? hojaGastosVehiculos : [{ Info: 'Sin gastos' }]), '6_Gastos_Carros');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaGastosPropios.length ? hojaGastosPropios : [{ Info: 'Sin gastos propios' }]), '7_Gastos_Propios');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hojaDirectorio.length ? hojaDirectorio : [{ Info: 'Sin contactos en directorio' }]), '8_Directorio_y_Perfiles');

    XLSX.writeFile(wb, fileName);
  } else {
    exportBackupJSON();
  }
}

function exportBackupJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `Respaldo_Cartech_${getTodayISO()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importBackupJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && Array.isArray(imported.vehicles)) {
        db = ensureDBStructure(imported);
        saveDB();
        alert('✅ Base de datos de Cartech Automóviles restaurada y sincronizada en la nube.');
      } else {
        alert('⚠️ El archivo no tiene un formato válido.');
      }
    } catch (err) {
      alert('Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
}

// ============================================================================
// INSTALACIÓN PWA (PC / POCO F8 ULTRA / iOS)
// ============================================================================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

async function triggerInstallPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  } else {
    alert(
      'Para instalar Cartech Automóviles como App:\n\n' +
      '• En tu POCO F8 Ultra (Chrome): Abre el menú (⋮) > "Instalar aplicación".\n' +
      '• En PC (Chrome / Edge): Haz clic en el ícono de instalar en la barra de direcciones o usa Iniciar_App_Escritorio.bat.\n' +
      '• En iPhone / iPad (Safari): Toca Compartir (⬆️) > "Agregar a inicio".'
    );
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateAllViews() {
  db = ensureDBStructure(db);
  renderHomeDashboard();
  renderInventory();
  renderPeritajeSheet();
  renderProspectsSheet();
  renderDirectorySheet();
  renderPartnersSheet();
  renderOwnExpenses();
}

// Inicialización 100% Cloud con protección obligatoria de inicio de sesión
document.addEventListener('DOMContentLoaded', () => {
  applyAuthUIState();
  pullFromCloud();
  startRealtimeCloudListener();
  setInterval(() => {
    pullFromCloud();
  }, 4500);
  window.addEventListener('focus', () => pullFromCloud());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pullFromCloud();
  });
});
