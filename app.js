const bootstrapApp = () => {
  const MAX_OBJ = 5;
  const TOTAL_STEPS = 3;
  const STORAGE_KEY = 'usilSmartStatePresentation2';
  // --- API KEYS con fallback automático ---
  // Si la key principal agota su cuota, se usa la de respaldo automáticamente.
  const GEMINI_API_KEYS = [
    'AQ.Ab8RN6IE6QHUThKGVePhMxjuimiqqJr0gYHjYsC2Qj82zcsH6Q', // Key principal
    'AIzaSyBmrQXJ7OFRMEsPKqTPTmEgalEap64e2uQ'                 // Key de respaldo
  ];
  const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const SAVE_WEBHOOK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfhCeBSfkyAniPfjm8eTn9bUKKot83nP5dkkiu0YXKijG_yqw/formResponse';

  // --- AI SUGGESTION ENGINE con rotación de keys ---
  async function callGeminiAI(prompt) {
    for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
      const key = GEMINI_API_KEYS[i];
      try {
        const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          })
        });
        // Si es error de cuota (429) o auth (403), intenta con la siguiente key
        if (res.status === 429 || res.status === 403) {
          console.warn(`Key ${i + 1} agotada o inválida (${res.status}), intentando key ${i + 2}...`);
          continue;
        }
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (result) return result;
      } catch (e) {
        console.warn(`Error con key ${i + 1}:`, e.message);
        // Si quedan más keys, continúa; si era la última, retorna null
        if (i === GEMINI_API_KEYS.length - 1) return null;
      }
    }
    return null;
  }

  const AREAS_USIL = [
    'Académico / Escuelas',
    'Administración y Finanzas',
    'Bienestar Universitario',
    'Capital Humano',
    'Comunicaciones y Marketing',
    'Dirección General',
    'Infraestructura y Servicios',
    'Informática / Transformación Digital',
    'Legal',
    'Operaciones',
    'Registros Académicos',
    'Relaciones Internacionales',
    'Investigación y Doctorado',
  ];

  // Fallback static list for objectives similarity comparison
  const PREV_OBJ_2025 = [
    { area: 'Capital Humano', kw: ['rotación','turnover','fuga de talento'], verbo: 'Reducir', texto: 'Reducir rotación de personal de 15% a 12%', meta: 12 },
    { area: 'Capital Humano', kw: ['capacitación','horas formación','training'], verbo: 'Aumentar', texto: 'Aumentar horas de capacitación por colaborador de 20h a 30h', meta: 30 },
    { area: 'Capital Humano', kw: ['clima laboral','satisfacción laboral','encuesta clima'], verbo: 'Aumentar', texto: 'Aumentar índice de clima laboral de 72% a 80%', meta: 80 },
    { area: 'Capital Humano', kw: ['evaluación desempeño','desempeño','performance review'], verbo: 'Implementar', texto: 'Implementar ciclo completo de evaluación de desempeño', meta: null },
    { area: 'Académico / Escuelas', kw: ['satisfacción estudiantil','nps','encuesta alumnos'], verbo: 'Aumentar', texto: 'Aumentar satisfacción estudiantil de 75% a 82%', meta: 82 },
    { area: 'Académico / Escuelas', kw: ['deserción','abandono','retiro estudiantil'], verbo: 'Reducir', texto: 'Reducir tasa de deserción académica de 12% a 8%', meta: 8 },
    { area: 'Académico / Escuelas', kw: ['acreditación','licenciamiento'], verbo: 'Ejecutar', texto: 'Ejecutar proceso de acreditación de 3 programas', meta: 3 },
    { area: 'Legal', kw: ['denuncia','litigio','demanda','proceso legal'], verbo: 'Mantener', texto: 'Mantener en 0% las denuncias activas', meta: 0, excepcionLegal: true },
    { area: 'Administración y Finanzas', kw: ['costo operativo','gasto','presupuesto'], verbo: 'Reducir', texto: 'Reducir costos operativos en 10% respecto al año anterior', meta: null },
    { area: 'Administración y Finanzas', kw: ['cobranza','mora','recaudación'], verbo: 'Aumentar', texto: 'Aumentar tasa de cobranza mensual de 85% a 92%', meta: 92 },
    { area: 'Comunicaciones y Marketing', kw: ['matrícula','captación','leads','conversión'], verbo: 'Aumentar', texto: 'Aumentar tasa de conversión de leads de 18% a 25%', meta: 25 },
    { area: 'Comunicaciones y Marketing', kw: ['redes sociales','engagement','seguidores'], verbo: 'Aumentar', texto: 'Aumentar engagement en redes sociales de 3.2% a 5%', meta: 5 },
    { area: 'Informática / Transformación Digital', kw: ['sistema','plataforma','digitalización','automatización'], verbo: 'Implementar', texto: 'Implementar 2 nuevos módulos en el sistema ERP institucional', meta: 2 },
    { area: 'Informática / Transformación Digital', kw: ['incidencia','ticket','soporte','tiempo respuesta'], verbo: 'Reducir', texto: 'Reducir tiempo de atención de incidencias de 48h a 24h', meta: 24 },
    { area: 'Infraestructura y Servicios', kw: ['mantenimiento','instalación','obra'], verbo: 'Ejecutar', texto: 'Ejecutar plan de mantenimiento preventivo al 95% de instalaciones', meta: 95 },
    { area: 'Bienestar Universitario', kw: ['participación','programa bienestar','actividades'], verbo: 'Aumentar', texto: 'Aumentar participación en programas de bienestar de 45% a 60%', meta: 60 },
    { area: 'Operaciones', kw: ['proceso','tiempo ciclo','eficiencia operativa'], verbo: 'Optimizar', texto: 'Optimizar tiempo de ciclo de procesos administrativos de 5 días a 3 días', meta: 3 },
    { area: 'Relaciones Internacionales', kw: ['convenio','acuerdo internacional','movilidad'], verbo: 'Aumentar', texto: 'Aumentar convenios internacionales activos de 12 a 18', meta: 18 },
    { area: 'Investigación y Doctorado', kw: ['publicación','scopus','artículo científico','investigación'], verbo: 'Aumentar', texto: 'Aumentar publicaciones indexadas de 8 a 15 anuales', meta: 15 },
    { area: 'Registros Académicos', kw: ['grado','título','trámite','tiempo proceso'], verbo: 'Reducir', texto: 'Reducir tiempo de procesamiento de grados y títulos de 90 a 60 días', meta: 60 },
  ];

  let db = {}; // Loaded from db.json

  let state = {
    userId: '',
    area: '',
    collabInfo: null,
    currentObjIndex: 0,
    wizardStep: 1,
    objectives: Array(MAX_OBJ).fill(null).map(() => ({
      status: 'pending',
      action: '',
      enfoque: '',
      pilares: [],
      metrica: '',
      lineaBase: '',
      meta: '',
      tipoEval: '',
      queHaras: '',
      finalSmart: '',
      ref2025: ''
    }))
  };

  const screens = {
    hero: document.getElementById('screen-hero'),
    dashboard: document.getElementById('screen-dashboard'),
    wizard: document.getElementById('screen-wizard'),
    result: document.getElementById('screen-result')
  };

  const UI = {
    progressSegments: document.getElementById('progress-segments'),
    stepBadge: document.getElementById('step-badge'),
    wizardContent: document.getElementById('wizard-content'),
    btnNext: document.getElementById('btn-next-step'),
    btnPrev: document.getElementById('btn-prev-step'),
    objTitle: document.getElementById('wizard-obj-title'),
    autosaveIndicator: document.getElementById('autosave-indicator'),
    loginInput: document.getElementById('inp-login-id'),
    loginError: document.getElementById('login-error')
  };

  let autosaveTimeout;

  const SHEETS_URL = ''; 

  async function loadDatabase() {
    if (SHEETS_URL) {
      try {
        const res = await fetch(SHEETS_URL);
        const text = await res.text();
        const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
        if (jsonStr && jsonStr[1]) {
          const sheetsData = JSON.parse(jsonStr[1]);
          const rows = sheetsData.table.rows;
          db = {};
          rows.forEach(row => {
            const cells = row.c;
            if (!cells) return;
            const dni = cells[0]?.v ? String(cells[0].v).trim() : '';
            const nombre = cells[1]?.v ? String(cells[1].v).trim() : '';
            const puesto = cells[2]?.v ? String(cells[2].v).trim() : '';
            const area = cells[3]?.v ? String(cells[3].v).trim() : '';
            const matricula = cells[4]?.v ? String(cells[4].v).trim() : '';
            const objsStr = cells[5]?.v ? String(cells[5].v).trim() : '';
            if (!dni && !matricula) return;
            
            const objetivos_2025 = objsStr ? objsStr.split(' | ').filter(Boolean) : [];
            const user = { dni, nombre, puesto, area, matricula, objetivos_2025 };
            
            if (dni) db[dni] = user;
            if (matricula) db[matricula] = user;
          });
          console.log("✅ Database loaded from Google Sheets, entries:", Object.keys(db).length);
          return;
        }
      } catch (e) {
        console.warn("⚠ Google Sheets fetch failed, falling back to local:", e);
      }
    }

    try {
      if (typeof DB_USERS !== 'undefined' && Array.isArray(DB_USERS)) {
        db = {};
        DB_USERS.forEach(user => {
          if (user.dni) db[user.dni] = user;
          if (user.matricula) db[user.matricula] = user;
        });
        console.log("✅ Database loaded from db_data.js, entries:", Object.keys(db).length);
        return;
      }
    } catch (e) {
      console.error("Error loading local db:", e);
    }

    console.warn("⚠ No database found. Running in free mode.");
  }

  async function init() {
    localStorage.removeItem(STORAGE_KEY);
    showScreen('hero');
    await loadDatabase();
  }

  function saveState(showFeedback = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    if (showFeedback) {
      clearTimeout(autosaveTimeout);
      UI.autosaveIndicator.classList.add('visible');
      autosaveTimeout = setTimeout(() => {
        UI.autosaveIndicator.classList.remove('visible');
      }, 2000);
    }
  }

  function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenId].classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const mainHeader = document.querySelector('.card-header');
    if (mainHeader) {
      mainHeader.style.display = (screenId === 'wizard' || screenId === 'result') ? 'none' : 'block';
    }
    
    UI.progressSegments.style.display = (screenId === 'wizard') ? 'flex' : 'none';
    UI.stepBadge.style.display = (screenId === 'wizard') ? 'inline-block' : 'none';
  }

  document.getElementById('btn-start').addEventListener('click', () => {
    const loginValue = UI.loginInput.value.trim();

    if (!loginValue) {
      UI.loginError.style.display = 'block';
      UI.loginInput.style.borderColor = 'var(--danger)';
      UI.loginInput.focus();
      return;
    }
    UI.loginError.style.display = 'none';
    UI.loginInput.style.borderColor = 'var(--border)';

    const overlay = document.getElementById('scanner-overlay');
    const scannerStatus = document.getElementById('scanner-status');
    const scannerDetails = document.getElementById('scanner-details');
    const scannerLine = document.getElementById('scanner-line');
    const scannerIcon = document.getElementById('scanner-icon');

    overlay.classList.add('active');
    scannerStatus.textContent = "Buscando colaborador en el Maestro USIL...";
    scannerDetails.classList.add('hidden');
    scannerLine.style.display = 'block';
    scannerIcon.textContent = "🔍";

    const cleanCode = loginValue.replace(/^0+/, '');
    const userRecord = db[cleanCode];

    setTimeout(() => {
      scannerLine.style.display = 'none';
      
      if (userRecord) {
        scannerIcon.textContent = "👤";
        scannerStatus.textContent = "¡Colaborador USIL!";
        document.getElementById('scanner-detected-name').textContent = userRecord.nombre;
        document.getElementById('scanner-detected-puesto').textContent = userRecord.puesto || 'Puesto no especificado';
        document.getElementById('scanner-detected-area').textContent = userRecord.area || 'Área no especificada';
        scannerDetails.classList.remove('hidden');
        
        state.userId = cleanCode;
        state.collabInfo = userRecord;
        state.area = userRecord.area || '';
      } else {
        scannerIcon.textContent = "🔓";
        scannerStatus.textContent = "Identificación no encontrada";
        document.getElementById('scanner-detected-name').textContent = "Colaborador Libre";
        document.getElementById('scanner-detected-puesto').textContent = "Perfil general de planificación";
        document.getElementById('scanner-detected-area').textContent = "Área General";
        scannerDetails.classList.remove('hidden');
        
        state.userId = cleanCode;
        state.collabInfo = {
          nombre: "Colaborador Libre",
          puesto: "Perfil general de planificación",
          area: "Área General",
          objetivos_2025: []
        };
        state.area = '';
      }
      
      const banner = document.getElementById('user-profile-banner');
      const nameEl = document.getElementById('profile-user-name');
      const detailsEl = document.getElementById('profile-user-details');
      nameEl.textContent = state.collabInfo.nombre;
      detailsEl.textContent = `${state.collabInfo.puesto} | ${state.collabInfo.area}`;
      banner.classList.remove('hidden');

      setTimeout(() => {
        overlay.classList.remove('active');
        
        state.currentObjIndex = 0;
        state.wizardStep = 1;
        saveState(true);
        showScreen('dashboard');
        renderDashboard();
      }, 1800);

    }, 1800);
  });

  document.getElementById('btn-back-dash').addEventListener('click', () => {
    showScreen('dashboard');
    renderDashboard();
  });

  document.getElementById('btn-continue-stack').addEventListener('click', () => {
     let nextPending = state.objectives.findIndex(o => o.status === 'pending' || o.status === 'progress');
     if (nextPending !== -1) {
       state.currentObjIndex = nextPending;
       state.wizardStep = 1;
       state.objectives[nextPending].status = 'progress';
       
       const refCard = document.getElementById('wizard-reference-card');
       if (state.objectives[nextPending].ref2025) {
         document.getElementById('wizard-reference-text').textContent = state.objectives[nextPending].ref2025;
         refCard.classList.remove('hidden');
       } else {
         refCard.classList.add('hidden');
       }

       saveState(true);
       startWizard();
     }
  });

  document.getElementById('btn-close-ref').addEventListener('click', () => {
    document.getElementById('wizard-reference-card').classList.add('hidden');
    const obj = state.objectives[state.currentObjIndex];
    if (obj) {
      obj.ref2025 = '';
      saveState(false);
    }
  });

  function renderDashboard() {
    const list = document.getElementById('objectives-list');
    list.innerHTML = '';
    let allCompleted = true;
    
    state.objectives.forEach((obj, idx) => {
      if (obj.status !== 'completed') allCompleted = false;

      const div = document.createElement('div');
      div.className = 'obj-card';
      
      let statusClass = 'status-pending';
      let statusText = 'Pendiente';
      
      if (obj.status === 'completed') { statusClass = 'status-completed'; statusText = 'Completado'; }
      else if (obj.status === 'progress') { statusClass = 'status-progress'; statusText = 'En progreso'; }

      const titleText = (obj.pilares && obj.pilares.length > 0) ? obj.pilares[0] : (obj.finalSmart ? 'Objetivo Estratégico' : 'Nuevo Objetivo');

      div.innerHTML = `
        <div class="obj-card-left">
          <div class="obj-number">${idx + 1}</div>
          <div>
            <div class="obj-title" style="color:var(--usil-blue);">${titleText}</div>
            <div style="font-size:0.875rem; color:var(--text-muted); margin-top:4px;">
              ${obj.finalSmart ? obj.finalSmart : 'Definición pendiente'}
            </div>
          </div>
        </div>
        <div class="obj-status ${statusClass}">${statusText}</div>
      `;

      div.addEventListener('click', () => {
        state.currentObjIndex = idx;
        if(obj.status === 'completed') {
          showResultScreen();
        } else {
          obj.status = 'progress';
          state.wizardStep = 1;
          
          const refCard = document.getElementById('wizard-reference-card');
          if (obj.ref2025) {
            document.getElementById('wizard-reference-text').textContent = obj.ref2025;
            refCard.classList.remove('hidden');
          } else {
            refCard.classList.add('hidden');
          }

          saveState(false);
          startWizard();
        }
      });

      list.appendChild(div);
    });

    const prevSection = document.getElementById('previous-objectives-section');
    const prevList = document.getElementById('prev-objectives-list');
    
    if (state.collabInfo && state.collabInfo.objetivos_2025 && state.collabInfo.objetivos_2025.length > 0) {
      prevSection.classList.remove('hidden');
      prevList.innerHTML = '';
      state.collabInfo.objetivos_2025.forEach((objText) => {
        const div = document.createElement('div');
        div.className = 'prev-obj-card';
        div.innerHTML = `
          <div class="prev-obj-text">${objText}</div>
          <div class="prev-obj-actions">
            <button class="btn-refine-prev">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 0.15rem;">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              Refinar para 2026
            </button>
          </div>
        `;
        
        div.querySelector('.btn-refine-prev').addEventListener('click', (e) => {
          e.stopPropagation();
          refineObjective2025(objText);
        });
        
        prevList.appendChild(div);
      });
    } else {
      prevSection.classList.add('hidden');
    }

    const btnCont = document.getElementById('btn-continue-stack');
    if (!allCompleted) {
      btnCont.style.display = 'inline-block';
      let nextPending = state.objectives.findIndex(o => o.status === 'pending' || o.status === 'progress');
      btnCont.textContent = `Continuar con Objetivo ${nextPending + 1} →`;
    } else {
      btnCont.style.display = 'none';
    }
  }

  function refineObjective2025(objText) {
    const parsed = parsePreviousObjective(objText);
    
    let nextPending = state.objectives.findIndex(o => o.status === 'pending' || o.status === 'progress');
    if (nextPending === -1) {
      nextPending = 0;
    }
    
    state.currentObjIndex = nextPending;
    state.wizardStep = 1;
    state.objectives[nextPending] = {
      status: 'progress',
      action: parsed.action,
      enfoque: parsed.enfoque,
      pilares: [], 
      metrica: '',
      lineaBase: parsed.lineaBase,
      meta: parsed.meta,
      tipoEval: '',
      queHaras: parsed.queHaras,
      finalSmart: '',
      ref2025: objText
    };
    
    saveState(true);
    
    const refCard = document.getElementById('wizard-reference-card');
    const refTextEl = document.getElementById('wizard-reference-text');
    refTextEl.textContent = objText;
    refCard.classList.remove('hidden');
    
    startWizard();
  }

  function parsePreviousObjective(text) {
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    let action = 'Implementar';
    
    const verbs = {
      'implementar': 'Implementar',
      'aumentar': 'Aumentar',
      'incrementar': 'Aumentar',
      'reducir': 'Reducir',
      'disminuir': 'Reducir',
      'mantener': 'Mantener',
      'optimizar': 'Optimizar',
      'ejecutar': 'Ejecutar',
      'lograr': 'Aumentar',
      'salvaguardar': 'Mantener',
      'organizar': 'Ejecutar',
      'diseñar': 'Implementar'
    };
    
    const firstWord = cleanText.split(' ')[0].toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
    for (const k in verbs) {
      if (firstWord.startsWith(k)) {
        action = verbs[k];
        break;
      }
    }
    
    let lineaBase = '';
    let meta = '';
    
    const deAMatch = cleanText.match(/(?:de|del|desde)\s+([\d.,]+%?)\s+(?:a|al|hasta)\s+([\d.,]+%?)/i);
    if (deAMatch) {
      lineaBase = deAMatch[1];
      meta = deAMatch[2];
    } else {
      const metaMatch = cleanText.match(/(?:al menos|mínimo de|a|al|hasta|superior al|en un)\s+([\d.,]+%?)/i);
      if (metaMatch) {
        meta = metaMatch[1];
      }
    }
    
    let queHaras = '';
    const actionsMatch = cleanText.match(/(?:mediante|a través de|con el fin de|para lo cual|priorizando|desarrollando)\s+(.*)/i);
    if (actionsMatch) {
      queHaras = actionsMatch[1].trim();
      queHaras = queHaras.replace(/(?:,\s+)?al cierre del?\s+\d+.*?$/i, '')
                         .replace(/(?:,\s+)?durante el periodo.*?$/i, '')
                         .replace(/(?:,\s+)?antes de finalizar.*?$/i, '')
                         .replace(/\.+$/, '');
    }
    
    let enfoque = cleanText;
    const firstWordLen = cleanText.split(' ')[0].length;
    enfoque = enfoque.substring(firstWordLen).trim();
    const cutPos = enfoque.search(/(?:\bde\b|\bdel\b|\bdesde\b|\bmediante\b|\ba través de\b|\bpara\b)/i);
    if (cutPos !== -1) {
      enfoque = enfoque.substring(0, cutPos).trim();
    }
    enfoque = enfoque.replace(/^la\s+/i, '').replace(/^el\s+/i, '').replace(/^[,\s]+|[,\s]+$/g, '');
    
    return {
      action,
      enfoque: enfoque ? enfoque.charAt(0).toUpperCase() + enfoque.slice(1) : '',
      lineaBase,
      meta,
      queHaras: queHaras ? queHaras.charAt(0).toUpperCase() + queHaras.slice(1) : ''
    };
  }

  function getAiSuggestion(actionStr) {
    if (!actionStr) return "Operativo";
    const str = actionStr.toLowerCase();
    if (str.includes("implementar") || str.includes("innovar")) return "Innovación / Desarrollo";
    if (str.includes("aumentar") || str.includes("reducir")) return "Estratégico / Operativo";
    if (str.includes("mantener") || str.includes("ejecutar")) return "Operativo";
    return "Estratégico";
  }

  // ── MOTOR DE REGLAS HÍBRIDO (Capa 1) ────────────────────────────────────
  // Prioridad: Métrica numérica > Naturaleza del texto > Verbo
  function getSuggestedEvalType(actionStr, tipoEvalManual, lineaBase, meta, enfoque, queHaras) {
    if (tipoEvalManual) return tipoEvalManual;
    const act = (actionStr || '').toLowerCase();
    const enf = (enfoque   || '').toLowerCase();
    const que = (queHaras  || '').toLowerCase();
    const fullText = `${act} ${enf} ${que}`;

    // ── Capa 1A: ¿Existe métrica numérica con línea base y meta? ──
    const baseNum = parseFloat(String(lineaBase || '').replace(',','.'));
    const metaNum = parseFloat(String(meta      || '').replace(',','.'));
    const hayMetrica = !isNaN(baseNum) && !isNaN(metaNum);

    if (hayMetrica) {
      if (metaNum > baseNum) {
        return '📈 Directo';
      } else if (metaNum < baseNum) {
        return '📉 Inverso';
      }
      
      // Si metaNum === baseNum
      const señalesRango = ['mantener','sostener','estabiliz','entre','rango','nivel'];
      if (señalesRango.some(s => fullText.includes(s))) {
        return '📊 Rango';
      }
      return '📈 Directo';
    }

    // ── Capa 1B: Sin métrica numérica → usar verbo/texto ──
    const verbosInverso = ['reducir','disminuir','bajar','eliminar'];
    if (verbosInverso.some(v => act.includes(v))) return '📉 Inverso';

    const verbosRango = ['mantener','sostener'];
    if (verbosRango.some(v => act.includes(v))) return '📊 Rango';

    // Verbos de implementación sin métrica → Discreto
    const verbosDiscreto = ['implementar','ejecutar','crear','desarrollar','diseñar','desplegar','lanzar','construir','establecer'];
    if (verbosDiscreto.some(v => act.includes(v) || enf.startsWith(v))) return '🎯 Discreto';

    return '📈 Directo';
  }

  function parseNumericValue(value) {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim().replace(/\s+/g, '').replace(',', '.');
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatDelta(delta, metrica) {
    const rounded = Math.round(delta * 10) / 10;
    const unit = metrica ? ` ${metrica}` : '';
    return `${rounded}${unit}`;
  }

  function calcEfficacyLevel(obj) {
    const base = parseNumericValue(obj.lineaBase);
    const meta = parseNumericValue(obj.meta);
    if (base === null || meta === null) {
      return { level: 'misión', score: 0, label: '⚠️ Tipo Misión — objetivo no cuantificado', color: '#7c3aed', tip: 'Agrega línea base y meta numérica para transformarlo en un objetivo SMART real.' };
    }
    const ref = base === 0 ? Math.abs(meta) || 1 : Math.abs(base);
    const pct = Math.abs(meta - base) / ref;
    if (pct < 0.05) return { level: 'conservador', score: 1, label: '🔵 Conservador', color: '#94a3b8', tip: 'El objetivo mantiene el statu quo. Considera elevar la meta para mayor impacto.' };
    if (pct < 0.15) return { level: 'moderado', score: 2, label: '🟢 Moderado', color: '#3b82f6', tip: 'Objetivo alcanzable. Puedes hacerlo más retador incrementando la ambición de la meta.' };
    if (pct < 0.35) return { level: 'retador', score: 3, label: '🌟 Retador — nivel óptimo', color: '#10b981', tip: 'Nivel ideal: ambicioso y alcanzable. Este objetivo genera verdadero impacto.' };
    if (pct < 0.55) return { level: 'ambicioso', score: 4, label: '🔶 Muy Ambicioso', color: '#f59e0b', tip: 'Meta muy exigente. Valida con tu líder y asegura recursos para sostenerlo.' };
    return { level: 'misión', score: 5, label: '🔴 Tipo Misión — requiere reformulación', color: '#dc2626', tip: 'La brecha es demasiado grande para una sola anualidad. Divide en hitos o ajusta la meta.' };
  }

  function checkPreviousYearCollabSimilarity(obj) {
    if (!state.collabInfo || !state.collabInfo.objetivos_2025 || state.collabInfo.objetivos_2025.length === 0) {
      return null;
    }
    
    const currentText = `${obj.enfoque || ''} ${obj.queHaras || ''}`.toLowerCase();
    if (!currentText.trim()) return null;
    
    const currentWords = currentText.split(/\s+/).filter(w => w.length > 4);
    if (currentWords.length === 0) return null;

    for (const prevText of state.collabInfo.objetivos_2025) {
      const prevClean = prevText.toLowerCase();
      const prevWords = prevClean.split(/\s+/).filter(w => w.length > 4);
      
      let matchCount = 0;
      for (const pw of prevWords) {
        if (currentWords.includes(pw)) matchCount++;
      }
      
      const matchRatio = prevWords.length > 0 ? matchCount / prevWords.length : 0;
      
      if (matchRatio > 0.4 || matchCount >= 4) {
        return {
          previousText: prevText
        };
      }
    }
    return null;
  }

  function checkPreviousYearSimilarity(obj) {
    const area = state.area;
    if (!area || !obj.enfoque) return null;
    const enf = obj.enfoque.toLowerCase();
    
    for (const prev of PREV_OBJ_2025) {
      if (prev.area !== area) continue;
      if (prev.excepcionLegal && area === 'Legal') continue;
      const match = prev.kw.some(k => enf.includes(k.toLowerCase()));
      if (match) {
        let sugerencia = '';
        if (prev.meta !== null && prev.meta !== undefined) {
          const nuevoMeta = prev.verbo === 'Reducir'
            ? Math.round(prev.meta * 0.85)
            : Math.round(prev.meta * 1.15);
          sugerencia = `Para 2026, considera llevar la meta a ${nuevoMeta} (15% más ambicioso que el año anterior).`;
        } else {
          sugerencia = `Amplía el alcance: en lugar de solo implementarlo, define un indicador de uso o adopción medible.`;
        }
        return { previousText: prev.texto, sugerencia };
      }
    }
    return null;
  }

  function analyzeObjectiveViability(obj) {
    const evalType = obj.tipoEval || getSuggestedEvalType(obj.action, null, obj.lineaBase, obj.meta, obj.enfoque, obj.queHaras);
    const base = parseNumericValue(obj.lineaBase);
    const meta = parseNumericValue(obj.meta);
    const accionDescriptiva = obj.queHaras && obj.queHaras.trim().length >= 20;
    const reasons = [];
    let level = 'media';
    let title = 'Viabilidad por validar';
    let message = 'El objetivo necesita una revisión breve antes de confirmarlo.';
    let statusColor = 'var(--warning)';

    if (!obj.action || !obj.enfoque || obj.lineaBase === '' || obj.meta === '' || !obj.queHaras) {
      reasons.push('Faltan datos clave para evaluar la viabilidad completa del objetivo.');
      return { evalType, level, title, message, reasons, statusColor };
    }

    if (base === null || meta === null) {
      reasons.push('La línea base o la meta no se pudieron interpretar como valores medibles.');
      reasons.push('Usa números claros para que la viabilidad pueda analizarse correctamente.');
      return { evalType, level, title, message, reasons, statusColor };
    }

    const delta = meta - base;
    const reference = base === 0 ? Math.abs(meta) || 1 : Math.abs(base);
    const variationPct = Math.abs(delta) / reference;

    if (evalType.includes('Inverso')) {
      if (meta >= base) {
        level = 'alta';
        title = 'Viabilidad comprometida';
        message = 'La meta no reduce el valor actual, así que el objetivo no sigue la lógica esperada para una reducción.';
        statusColor = 'var(--danger)';
        reasons.push(`Si buscas reducir, la meta debería quedar por debajo de la línea base actual (${base}).`);
      } else if (variationPct <= 0.2) {
        level = accionDescriptiva ? 'baja' : 'media';
        title = accionDescriptiva ? 'Objetivo viable' : 'Viabilidad por validar';
        message = accionDescriptiva
          ? 'La reducción propuesta es consistente y cuenta con una acción concreta declarada.'
          : 'La reducción parece razonable, pero detalla mejor la acción para confirmar viabilidad.';
        statusColor = accionDescriptiva ? 'var(--success)' : 'var(--warning)';
        reasons.push(`La meta reduce ${formatDelta(Math.abs(delta), '')} puntos frente a la línea base.`);
        if (!accionDescriptiva) reasons.push('Detalla más la acción del paso 4 para fortalecer la viabilidad del objetivo.');
      } else if (variationPct <= 0.4) {
        reasons.push('La reducción propuesta es retadora y conviene validarla con capacidad operativa y recursos.');
      } else {
        level = 'alta';
        title = 'Meta muy exigente';
        message = 'La reducción requerida es agresiva para una sola anualidad y necesita sustento adicional.';
        statusColor = 'var(--danger)';
        reasons.push(`La reducción supera el ${Math.round(variationPct * 100)}% sobre la línea base.`);
      }
    } else if (evalType.includes('Rango')) {
      if (variationPct <= 0.1) {
        level = 'baja';
        title = 'Objetivo viable';
        message = 'La meta plantea sostener el resultado actual con una variación controlada.';
        statusColor = 'var(--success)';
        reasons.push('La diferencia entre línea base y meta es acotada, consistente con un objetivo de mantenimiento.');
      } else if (variationPct <= 0.2) {
        reasons.push('La meta se aleja del mantenimiento puro; revisa si el verbo correcto debería ser aumentar o reducir.');
      } else {
        level = 'alta';
        title = 'Inconsistencia en la meta';
        message = 'El objetivo se declaró como mantenimiento, pero la variación propuesta es demasiado amplia.';
        statusColor = 'var(--danger)';
        reasons.push(`La variación es de ${Math.round(variationPct * 100)}%, alta para un objetivo de mantener.`);
      }
    } else if (evalType.includes('Discreto')) {
      if (!obj.queHaras || obj.queHaras.trim().length < 12) {
        reasons.push('Describe con mayor precisión la acción principal para sustentar un objetivo discreto.');
      }
      if (meta <= base) {
        reasons.push('La meta discreta no supera el valor actual; revisa si realmente representa un avance esperado.');
      }
      if (meta > base && obj.queHaras.trim().length >= 12) {
        level = 'baja';
        title = 'Objetivo viable';
        message = 'La lógica del objetivo es consistente para una meta discreta y cuenta con una acción declarada.';
        statusColor = 'var(--success)';
        reasons.push('La acción registrada ayuda a justificar el cumplimiento del entregable o hito medible.');
      }
    } else {
      if (meta <= base) {
        level = 'alta';
        title = 'Viabilidad comprometida';
        message = 'Para un objetivo de crecimiento, la meta debe superar la línea base.';
        statusColor = 'var(--danger)';
        reasons.push(`La meta actual (${meta}) no es mayor que la línea base (${base}).`);
      } else if (variationPct <= 0.15) {
        level = accionDescriptiva ? 'baja' : 'media';
        title = accionDescriptiva ? 'Objetivo viable' : 'Viabilidad por validar';
        message = accionDescriptiva
          ? 'El incremento propuesto es razonable y cuenta con una acción concreta declarada.'
          : 'El incremento parece razonable, pero detalla mejor la acción para confirmar viabilidad.';
        statusColor = accionDescriptiva ? 'var(--success)' : 'var(--warning)';
        reasons.push(`El crecimiento esperado es de ${Math.round(variationPct * 100)}%, dentro de un rango manejable.`);
        if (!accionDescriptiva) reasons.push('Detalla más la acción del paso 4 para fortalecer la viabilidad del objetivo.');
      } else if (variationPct <= 0.35) {
        reasons.push(`El crecimiento esperado es de ${Math.round(variationPct * 100)}%, retador pero posible si las acciones se ejecutan con disciplina.`);
        if (!accionDescriptiva) reasons.push('Describe con mayor precisión la acción que asegurará el cumplimiento.');
      } else {
        level = 'alta';
        title = 'Meta muy exigente';
        message = 'El salto entre línea base y meta es alto y requiere validar capacidad real de ejecución.';
        statusColor = 'var(--danger)';
        reasons.push(`El crecimiento esperado supera el ${Math.round(variationPct * 100)}% sobre la línea base.`);
      }
    }

    if (obj.pilares.length === 0) {
      reasons.push('Considera asociar al menos un pilar estratégico para fortalecer la relevancia del objetivo.');
    }

    return { evalType, level, title, message, reasons, statusColor };
  }

  function startWizard() {
    showScreen('wizard');
    UI.objTitle.textContent = `Objetivo ${state.currentObjIndex + 1}`;
    renderWizardStep();
  }

  function renderWizardStep() {
    const obj = state.objectives[state.currentObjIndex];
    UI.stepBadge.textContent = `Paso ${state.wizardStep} / ${TOTAL_STEPS}`;
    
    UI.progressSegments.innerHTML = '';
    for(let i=1; i<=TOTAL_STEPS; i++) {
      const seg = document.createElement('div');
      seg.className = `segment ${i === state.wizardStep ? 'active' : ''} ${i < state.wizardStep ? 'completed' : ''}`;
      UI.progressSegments.appendChild(seg);
    }

    UI.btnPrev.classList.toggle('hidden', state.wizardStep === 1);
    
    if (state.wizardStep === TOTAL_STEPS) {
      UI.btnNext.textContent = 'Generar Objetivo';
      UI.btnNext.className = 'btn-success'; 
    } else {
      UI.btnNext.textContent = 'Siguiente';
      UI.btnNext.className = 'btn-primary'; 
    }

    let html = '';
    
    if (state.wizardStep === 1) {
      html = `
        <div>
          <div class="info-hint-box" style="margin-top:0">
            💡 Recuerda que el objetivo debe estar ligado a tu área y al negocio.
          </div>
          <p class="input-label" style="margin-top:1.5rem; margin-bottom:0.5rem; font-weight:700;">Selección de verbo</p>
          <select class="custom-select" id="sel-accion">
            <option value="" disabled ${!obj.action ? 'selected' : ''}>Selecciona un verbo de acción</option>
            <option value="Implementar" ${obj.action === 'Implementar' ? 'selected' : ''}>Implementar — Nuevos proyectos, sistemas o iniciativas</option>
            <option value="Aumentar" ${obj.action === 'Aumentar' ? 'selected' : ''}>Aumentar / Incrementar</option>
            <option value="Reducir" ${obj.action === 'Reducir' ? 'selected' : ''}>Reducir / Disminuir</option>
            <option value="Mantener" ${obj.action === 'Mantener' ? 'selected' : ''}>Mantener — Sostener resultados actuales</option>
            <option value="Optimizar" ${obj.action === 'Optimizar' ? 'selected' : ''}>Optimizar — Mejorar eficiencia de un proceso o flujo</option>
            <option value="Ejecutar" ${obj.action === 'Ejecutar' ? 'selected' : ''}>Ejecutar — Acciones o entregables específicos</option>
          </select>
        </div>
      `;
    } 
    else if (state.wizardStep === 2) {
      const pilaresList = [
        "Cultura USIL", 
        "Excelencia académica", 
        "Transformación digital", 
        "Internacionalización", 
        "Crecimiento sostenible"
      ];

      let checkboxesHtml = pilaresList.map(p => `
        <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem; padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: background 0.2s;">
          <input type="checkbox" class="chk-pilar" value="${p}" ${obj.pilares.includes(p) ? 'checked' : ''} style="width:1.25rem; height:1.25rem;">
          <span style="font-size:0.9375rem; color:var(--text-main); font-weight: 500;">${p}</span>
        </label>
      `).join('');

      html = `
        <div>
          <p class="input-label" style="margin-top:0">El proyecto en el que se enfocará tu objetivo:</p>
          <input type="text" class="custom-input" id="inp-enfoque" placeholder="Ej. Tasa de retención de alumnos de pregrado" value="${obj.enfoque}">
          
          <p class="input-label" style="margin-top:2rem; margin-bottom:1rem;">Selección de uno o dos pilares:</p>
          <div id="pilares-container" class="mt-4">
            ${checkboxesHtml}
          </div>
        </div>
      `;
    }
    // STEP 3: Indicador actual, meta y acciones
    else if (state.wizardStep === 3) {
      const enfHint = obj.enfoque ? `<div style="background:#f1f5f9; border-radius:8px; padding:0.6rem 0.75rem; margin-bottom:0.85rem; font-size:0.8rem; color:#475569;"><span style="font-weight:700; color:#1e3a5f;">Tu objetivo es:</span> ${obj.enfoque}</div>` : '';
      
      html = `
        <div>
          <div class="input-grid" style="margin-top:1rem; margin-bottom:1.5rem;">
            <div>
              <label class="input-label" style="margin-top:0">¿Cómo se encuentra tu indicador actualmente?</label>
              <input type="text" class="custom-input" id="inp-base" placeholder="Ej. 85" value="${obj.lineaBase}">
            </div>
            <div>
              <label class="input-label" style="margin-top:0">¿Cuál es tu expectativa de meta?</label>
              <input type="text" class="custom-input" id="inp-meta" placeholder="Ej. 95 o 4.5" value="${obj.meta}">
            </div>
          </div>
          
          <div style="border-top: 1px solid var(--border); padding-top: 1.5rem;">
            <p class="input-label" style="margin-top:0">¿Cómo lo vas a lograr? Describe el <strong>método o estrategia</strong>, no repitas el objetivo:</p>
            ${enfHint}
            <input type="text" class="custom-input" id="inp-que" placeholder="Ej. levantamiento de requerimientos, automatización del flujo de aprobaciones y capacitación al equipo" value="${obj.queHaras}">
            <div id="redundancy-warn" style="display:none; margin-top:0.5rem; padding:0.5rem 0.75rem; background:#fef3c7; border:1px solid #fcd34d; border-radius:6px; font-size:0.75rem; color:#92400e; font-weight:600;">⚠️ Tu descripción repite lo que ya escribiste en el enfoque. Describe <em>cómo</em> lo harás, no <em>qué</em> harás.</div>

            <!-- Sugerencias IA -->
            <div id="ai-actions-panel" style="margin-top:1.25rem;">
              <div id="ai-actions-loading" style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:var(--text-muted); font-weight:600;">
                <span style="display:inline-block; width:14px; height:14px; border:2px solid var(--usil-blue); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
                ✨ La IA está generando sugerencias de metodología...
              </div>
              <div id="ai-actions-chips" style="display:none;">
                <p style="font-size:0.75rem; font-weight:800; color:var(--usil-blue); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.6rem;">💡 Formas de lograrlo — haz clic para usar:</p>
                <div id="ai-chips-container" style="display:flex; flex-wrap:wrap; gap:0.5rem;"></div>
                <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.6rem;">Selecciona uno o varios y edítalos a tu gusto.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    UI.wizardContent.innerHTML = html;

    // EVENT LISTENERS WITH REAL-TIME AUTOSAVE
    const handleInput = (id, field) => {
      const el = document.getElementById(id);
      if(el) {
        el.addEventListener('input', (e) => { obj[field] = e.target.value; saveState(true); });
        el.addEventListener('change', (e) => { obj[field] = e.target.value; saveState(true); });
      }
    };

    if (state.wizardStep === 1) {
      const sel = document.getElementById('sel-accion');
      if(sel) {
        sel.addEventListener('change', (e) => {
          obj.action = e.target.value;
          saveState(true);
        });
      }
    } else if (state.wizardStep === 2) {
      handleInput('inp-enfoque', 'enfoque');
      const container = document.getElementById('pilares-container');
      if(container) {
        container.querySelectorAll('.chk-pilar').forEach(chk => {
          chk.addEventListener('change', () => {
            const checked = Array.from(container.querySelectorAll('.chk-pilar:checked')).map(c => c.value);
            if (checked.length > 2) {
              chk.checked = false;
              alert('Selecciona un máximo de 2 pilares.');
              return;
            }
            obj.pilares = checked;
            saveState(true);
          });
        });
      }
    } else if (state.wizardStep === 3) {
      handleInput('inp-base', 'lineaBase');
      handleInput('inp-meta', 'meta');
      handleInput('inp-que', 'queHaras');

      // Detector de redundancia en tiempo real
      const inp = document.getElementById('inp-que');
      const warnEl = document.getElementById('redundancy-warn');
      const checkRedundancy = () => {
        if (!inp || !warnEl || !obj.enfoque) return;
        const normR = s => s.toLowerCase()
          .replace(/[áà]/g,'a').replace(/[éè]/g,'e')
          .replace(/[íì]/g,'i').replace(/[óò]/g,'o')
          .replace(/[úù]/g,'u').replace(/[^a-z\s]/g,' ');
        const enfW = normR(obj.enfoque).split(/\s+/).filter(w => w.length > 4);
        const queW = normR(inp.value).split(/\s+/).filter(w => w.length > 4);
        if (enfW.length > 0 && queW.length > 0) {
          const hits = enfW.filter(ew => queW.some(qw => qw.includes(ew) || ew.includes(qw)));
          warnEl.style.display = (hits.length / enfW.length) > 0.5 ? 'block' : 'none';
        }
      };
      if (inp) inp.addEventListener('input', checkRedundancy);
      checkRedundancy();

      // Generar sugerencias IA en segundo plano
      generateActionSuggestions(obj);
    }

  }

  // ── GENERADOR DE SUGERENCIAS DE ACCIONES CON IA ──────────────────────────
  async function generateActionSuggestions(obj) {
    const loadingEl  = document.getElementById('ai-actions-loading');
    const chipsEl    = document.getElementById('ai-actions-chips');
    const container  = document.getElementById('ai-chips-container');
    if (!loadingEl || !chipsEl || !container) return;

    const puesto  = state.collabInfo?.puesto || 'Colaborador';
    const area    = state.collabInfo?.area   || state.area || 'General';
    const verbo   = obj.action   || 'Implementar';
    const enfoque = obj.enfoque  || '';
    const meta    = obj.meta     || '';
    const base    = obj.lineaBase || '';

    const prompt = `Eres un experto en gestión del desempeño de USIL (Perú).

Un colaborador está definiendo su objetivo SMART 2026:
- Puesto: ${puesto}
- Área: ${area}
- Verbo elegido: ${verbo}
- Enfoque / proyecto: ${enfoque}
- Indicador actual (línea base): ${base}
- Meta esperada: ${meta}

Tu tarea: genera exactamente 5 sugerencias de acciones clave, cortas y accionables (máximo 12 palabras cada una), que este colaborador podría realizar para lograr su meta. Deben ser específicas para su puesto y contexto.

Responde SOLO con un JSON válido, sin markdown:
{"sugerencias": ["acción 1", "acción 2", "acción 3", "acción 4", "acción 5"]}`;

    try {
      const raw = await callGeminiAI(prompt);
      if (!raw) throw new Error('No response');
      let cleaned = raw.trim().replace(/```json\s*/g,'').replace(/```\s*/g,'');
      const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}');
      if (fb !== -1 && lb !== -1) cleaned = cleaned.substring(fb, lb+1);
      const parsed = JSON.parse(cleaned);
      const sugs = parsed.sugerencias || [];

      if (sugs.length > 0) {
        container.innerHTML = '';
        sugs.forEach(sug => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.textContent = sug;
          chip.style.cssText = `
            padding: 0.45rem 0.85rem;
            border: 1.5px solid var(--usil-blue-light);
            border-radius: 999px;
            background: var(--primary-light);
            color: var(--usil-blue);
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.18s;
            font-family: inherit;
          `;
          chip.addEventListener('mouseenter', () => {
            chip.style.background = 'var(--usil-blue)';
            chip.style.color = '#fff';
          });
          chip.addEventListener('mouseleave', () => {
            chip.style.background = 'var(--primary-light)';
            chip.style.color = 'var(--usil-blue)';
          });
          chip.addEventListener('click', () => {
            const inp = document.getElementById('inp-que');
            if (!inp) return;
            // Agregar al texto existente o reemplazar si está vacío
            const current = inp.value.trim();
            inp.value = current ? `${current}, ${sug}` : sug;
            obj.queHaras = inp.value;
            saveState(true);
            inp.focus();
            // Marcar chip como seleccionado
            chip.style.background = '#10b981';
            chip.style.color = '#fff';
            chip.style.borderColor = '#10b981';
          });
          container.appendChild(chip);
        });
        loadingEl.style.display = 'none';
        chipsEl.style.display = 'block';
      } else {
        loadingEl.style.display = 'none';
      }
    } catch(e) {
      console.warn('AI action suggestions failed:', e);
      loadingEl.style.display = 'none';
    }
  }


  UI.btnNext.addEventListener('click', () => {
    const obj = state.objectives[state.currentObjIndex];

    // ── PER-STEP VALIDATION ──────────────────────────────────────────────────
    if (state.wizardStep === 1) {
      if (!obj.action) {
        showStepError('Debes seleccionar un verbo de acción antes de continuar.');
        return;
      }
      
      // Sin restricción: cualquier colaborador puede usar "Implementar" o "Ejecutar"
    }

    if (state.wizardStep === 2) {
      const enfoqueVal = (document.getElementById('inp-enfoque')?.value || '').trim();
      if (!enfoqueVal) {
        const el = document.getElementById('inp-enfoque');
        if (el) {
          el.style.borderColor = 'var(--danger)';
          el.focus();
          el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
        }
        showStepError('Debes definir el proyecto o proceso antes de continuar.');
        return;
      }
      obj.enfoque = enfoqueVal;
    }

    if (state.wizardStep === 3) {
      const baseVal = (document.getElementById('inp-base')?.value || '').trim();
      const metaVal = (document.getElementById('inp-meta')?.value || '').trim();
      const queVal = (document.getElementById('inp-que')?.value || '').trim();
      
      let hasError = false;
      if (!baseVal || !metaVal) {
        ['inp-base', 'inp-meta'].forEach(id => {
          const el = document.getElementById(id);
          if (el && !el.value.trim()) {
            el.style.borderColor = 'var(--danger)';
            el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
          }
        });
        hasError = true;
      }
      if (!queVal) {
        const el = document.getElementById('inp-que');
        if (el) {
          el.style.borderColor = 'var(--danger)';
          el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
        }
        hasError = true;
      }
      
      if (hasError) {
        showStepError('Debes completar el indicador actual, la meta y las acciones antes de generar el objetivo.');
        return;
      }
      
      obj.lineaBase = baseVal;
      obj.meta = metaVal;
      obj.queHaras = queVal;
    }
    // ── END VALIDATION ───────────────────────────────────────────────────────

    if (state.wizardStep < TOTAL_STEPS) {
      state.wizardStep++;
      saveState(false);
      renderWizardStep();
    } else {
      // PRE-CHECK BEFORE GENERATION
      const similarityCheck = checkPreviousYearCollabSimilarity(obj);
      
      if (similarityCheck) {
        // Show pre-generation warning modal
        const modalHtml = `
          <div class="modal-backdrop" id="pre-gen-modal">
            <div class="modal-box critical-modal" style="text-align:left; border-top: 6px solid var(--warning);">
              <div style="font-size:2.5rem; margin-bottom:1rem;">⚠️</div>
              <h3 class="critical-title" style="color:#b45309; margin-bottom:0.5rem;">Alerta de Similitud 2025</h3>
              <p style="font-size:0.9375rem; color:var(--text-main); margin-bottom:1rem; line-height:1.6;">
                Hemos detectado que tu proyecto es <strong>casi idéntico</strong> a uno de tus objetivos del año pasado:
              </p>
              <div style="background:#fffbeb; padding:1rem; border-radius:8px; border:1px solid #fcd34d; font-size:0.875rem; font-style:italic; color:#92400e; margin-bottom:1.5rem;">
                "${similarityCheck.previousText}"
              </div>
              <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:1.5rem; line-height:1.5;">
                Sabemos que por tu puesto es normal que los programas o proyectos se repitan. Sin embargo, <strong>la meta debe ser más alta este año</strong>.<br><br>
                ¿Deseas editar tu objetivo para elevar el nivel de exigencia, o estás seguro de que la meta ya es lo suficientemente ambiciosa?
              </p>
              <div style="display:flex; gap:1rem;">
                <button class="btn-secondary" id="btn-modal-edit" style="flex:1;">✍️ Editar Objetivo</button>
                <button class="btn-primary" id="btn-modal-proceed" style="flex:1; background:#b45309;">Continuar de todos modos</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btn-modal-edit').addEventListener('click', () => {
          document.getElementById('pre-gen-modal').remove();
          // Regresar al paso 2 para que edite la esencia del proyecto
          state.wizardStep = 2;
          saveState(false);
          renderWizardStep();
        });
        
        document.getElementById('btn-modal-proceed').addEventListener('click', () => {
          document.getElementById('pre-gen-modal').remove();
          generateResult();
        });
      } else {
        generateResult();
      }
    }
  });

  // Helper: show an inline error message below the wizard content
  function showStepError(message) {
    // Remove any existing error
    const existing = document.getElementById('step-validation-error');
    if (existing) existing.remove();

    const err = document.createElement('div');
    err.id = 'step-validation-error';
    err.style.cssText = 'margin-top:1rem; padding:0.75rem 1rem; background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; color:#dc2626; font-size:0.875rem; font-weight:600; display:flex; align-items:center; gap:0.5rem;';
    err.innerHTML = `⚠️ ${message}`;
    UI.wizardContent.appendChild(err);

    // Auto-remove after 4s
    setTimeout(() => { if (err.parentNode) err.remove(); }, 4000);
  }

  // Advertencia informativa (amarillo) — NO bloquea el flujo, solo orienta al usuario
  function showStepWarning(message) {
    const existing = document.getElementById('step-validation-warning');
    if (existing) existing.remove();

    const warn = document.createElement('div');
    warn.id = 'step-validation-warning';
    warn.style.cssText = 'margin-top:1rem; padding:0.75rem 1rem; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; color:#92400e; font-size:0.875rem; font-weight:500; line-height:1.5;';
    warn.innerHTML = message;
    UI.wizardContent.appendChild(warn);

    // Auto-remove after 6s
    setTimeout(() => { if (warn.parentNode) warn.remove(); }, 6000);
  }

  UI.btnPrev.addEventListener('click', () => {
    if (state.wizardStep > 1) {
      state.wizardStep--;
      saveState(false);
      renderWizardStep();
    }
  });

  // PROFESSIONAL SMART TEXT RECONSTRUCTOR FOR FLUID COHERENCY
  function formatObjectiveText(obj) {
    const act = (obj.action || 'Lograr').trim();
    let enf = (obj.enfoque || '').trim();
    let base = (obj.lineaBase || '').trim();
    let meta = (obj.meta || '').trim();
    let que = (obj.queHaras || '').trim();
    let pilar = (obj.pilares && obj.pilares.length > 0) ? obj.pilares[0] : '';
    
    // --- MOTOR DE REGLAS: Eliminar verbo duplicado al inicio del enfoque ---
    // Si el usuario escribe el verbo dentro del campo "enfoque", se duplicaría con el
    // verbo del dropdown. Esta regla lo detecta y elimina antes de construir el texto.
    if (enf) {
      const normalize = s => s.toLowerCase()
        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u');

      // Todos los sinónimos de cada verbo del dropdown
      const verbGroups = [
        ['implementar', 'implementacion', 'implementación'],
        ['ejecutar', 'ejecucion', 'ejecución'],
        ['aumentar','incrementar', 'aumento', 'incremento'],
        ['reducir','disminuir', 'reduccion', 'reducción', 'disminucion', 'disminución'],
        ['mantener', 'mantenimiento'],
        ['optimizar', 'optimizacion', 'optimización'],
        ['lograr', 'logro'],
      ];

      const enfNorm = normalize(enf);
      const firstWord = enfNorm.split(/\s+/)[0];

      for (const group of verbGroups) {
        if (group.includes(firstWord)) {
          // Strip the leading verb word(s) — remove first word + any trailing space
          enf = enf.replace(/^\S+\s*/,'').trim();
          // Strip leading "de " or "del " that might be left over (e.g. "Incremento de participacion" -> "participacion")
          enf = enf.replace(/^(de|del)\s+/i, '').trim();
          break;
        }
      }
    }

    // Smooth lowercasing for grammatical flow
    if (enf) {
      enf = enf.replace(/\\.$/, '').trim();
      if (enf.charAt(0) === enf.charAt(0).toUpperCase() && !/^[A-Z]{2,}/.test(enf) && !/^(USIL|SAEI|ERP|NPS|KPI|SG)/.test(enf)) {
        enf = enf.charAt(0).toLowerCase() + enf.slice(1);
      }
    }
    
    if (que) {
      que = que.replace(/\\.$/, '').trim();
      if (que.charAt(0) === que.charAt(0).toUpperCase() && !/^[A-Z]{2,}/.test(que)) {
        que = que.charAt(0).toLowerCase() + que.slice(1);
      }
      // Limpiar preposiciones duplicadas al inicio
      if (que.startsWith('mediante ')) que = que.substring(9);
      if (que.startsWith('a traves de ')) que = que.substring(12);
      if (que.startsWith('por medio de ')) que = que.substring(13);
      if (que.startsWith('ejecutando ')) que = que.substring(11);
      if (que.startsWith('implementando ')) que = que.substring(14);

      // ── DETECTOR DE REDUNDANCIA ──
      // Si queHaras repite el mismo contenido que enfoque (>50% overlap), lo nullificamos
      // para no generar frases como "Implementar X, mediante implementar X..."
      const normFn = s => s.toLowerCase()
        .replace(/[\u00e1\u00e0]/g,'a').replace(/[\u00e9\u00e8]/g,'e')
        .replace(/[\u00ed\u00ec]/g,'i').replace(/[\u00f3\u00f2]/g,'o')
        .replace(/[\u00fa\u00f9]/g,'u').replace(/[^a-z\s]/g,' ');
      if (enf) {
        const enfWords = normFn(enf).split(/\s+/).filter(w => w.length > 4);
        const queWords = normFn(que).split(/\s+/).filter(w => w.length > 4);
        if (enfWords.length > 0 && queWords.length > 0) {
          const matches = enfWords.filter(ew => queWords.some(qw => qw.includes(ew) || ew.includes(qw)));
          const overlapRatio = matches.length / enfWords.length;
          if (overlapRatio > 0.5) {
            // Alta redundancia: suprimir el campo de acciones para no repetir
            que = '';
          }
        }
      }
    }
    
    // Add units like % if missing but present in the other
    if (base && meta) {
      if (meta.endsWith('%') && !base.endsWith('%') && /^\d+$/.test(base)) {
        base = base + '%';
      }
      if (base.endsWith('%') && !meta.endsWith('%') && /^\d+$/.test(meta)) {
        meta = meta + '%';
      }
    }
    
    let rangeText = '';
    if (base && meta) {
      rangeText = ` del ${base} al ${meta}`;
      if (!base.includes('%') && !base.includes('s') && !base.includes('h') && !base.includes('d')) {
        rangeText = ` de ${base} a ${meta}`;
      }
    } else if (meta) {
      rangeText = ` en ${meta}`;
    }
    
    let text = '';
    if (act === 'Implementar' || act === 'Ejecutar') {
      text = `${act} ${enf}`;
      // Usar el tipo real determinado por la IA/motor, no solo el verbo
      const tipoReal = (obj.tipoEval || '').toLowerCase();
      if (tipoReal.includes('inverso') && base && meta) {
        text += `, reduciendo el indicador de ${base} a ${meta}`;
      } else if (tipoReal.includes('directo') && base && meta) {
        text += `, elevando el indicador de ${base} a ${meta}`;
      } else if (tipoReal.includes('rango') && base && meta) {
        text += `, manteniendo el indicador entre ${base} y ${meta}`;
      } else if (meta) {
        text += `, alcanzando un nivel de cumplimiento de ${meta}`;
      }
      if (que) {
        const prep = /^\\w+(ando|iendo|endo)\\b/i.test(que) ? '' : 'mediante ';
        text += `, ${prep}${que}`;
      }
    } else if (act === 'Optimizar') {
      text = `${act} ${enf}`;
      if (base && meta) {
        text += `, logrando reducir los tiempos de ciclo de ${base} a ${meta}`;
      }
      if (que) {
        const prep = /^\\w+(ando|iendo|endo)\\b/i.test(que) ? '' : 'a través de ';
        text += `, ${prep}${que}`;
      }
    } else if (act === 'Mantener') {
      text = `${act} ${enf}`;
      if (meta) {
        text += ` en ${meta}`;
      }
      if (base) {
        text += ` (línea base de ${base})`;
      }
      if (que) {
        const prep = /^\\w+(ando|iendo|endo)\\b/i.test(que) ? '' : 'mediante ';
        text += `, ${prep}${que}`;
      }
    } else { // Aumentar, Reducir, Incrementar, Disminuir
      text = `${act} ${enf}${rangeText}`;
      if (que) {
        const prep = /^\\w+(ando|iendo|endo)\\b/i.test(que) ? '' : 'mediante ';
        text += `, ${prep}${que}`;
      }
    }
    
    // Timeline anchor
    text += `, para el cierre del año 2026.`;
    
    // Clean text and capitalize
    text = text.replace(/\s+/g, ' ').replace(/\.\s*,/g, ',').replace(/,\s*,/g, ',').trim();
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!text.endsWith('.')) text += '.';
    
    return text;
  }

  async function generateResult() {
    const obj = state.objectives[state.currentObjIndex];
    const analysis = analyzeObjectiveViability(obj);

    // --- Show AI Analysis Overlay ---
    const overlay = document.getElementById('scanner-overlay');
    const scannerStatus = document.getElementById('scanner-status');
    const scannerDetails = document.getElementById('scanner-details');
    const scannerLine = document.getElementById('scanner-line');
    const scannerIcon = document.getElementById('scanner-icon');

    overlay.classList.add('active');
    scannerLine.style.display = 'block';
    scannerIcon.textContent = '🧠';
    scannerStatus.textContent = 'IA analizando tu objetivo...';
    scannerDetails.classList.add('hidden');

    const puesto = state.collabInfo?.puesto || 'Colaborador';
    const area = state.collabInfo?.area || 'General';
    const nombre = state.collabInfo?.nombre || '';

    // --- Call Gemini to determine objective type + suggestion ---
    const historial = (state.collabInfo?.objetivos_2025 || []).join(' | ');
    const objetivoCompleto = `${obj.action} ${obj.enfoque} (de ${obj.lineaBase} a ${obj.meta}) mediante ${obj.queHaras}`;
    const aiPrompt = `Eres un experto en formulación de objetivos SMART, OKR y KPIs para USIL (Universidad San Ignacio de Loyola, Perú).

Perfil del colaborador:
- Nombre: ${nombre}
- Puesto: ${puesto}
- Área: ${area}
- Historial Objetivos 2025: ${historial ? historial : 'Sin historial previo'}

Datos del objetivo 2026:
- Verbo de acción: ${obj.action}
- Proyecto/Enfoque: ${obj.enfoque}
- Indicador actual (línea base): ${obj.lineaBase}
- Meta esperada: ${obj.meta}
- Pilares: ${(obj.pilares || []).join(', ')}
- Acciones declaradas: ${obj.queHaras}
- Objetivo completo inferido: "${objetivoCompleto}"

━━━ TAREA 1: CLASIFICAR TIPO DE EVALUACIÓN ━━━

Tipos posibles:
1. DIRECTO  — Mayor valor es mejor. Ej: aumentar ventas de 100 a 150.
2. INVERSO  — Menor valor es mejor. Ej: reducir tiempo de atención de 30 a 10 min.
3. DISCRETO — Solo se evalúa si se cumplió o no (binario: sí/no). Ej: implementar un ERP sin métricas de resultado.
4. Rango    — El indicador debe mantenerse dentro de un intervalo. Ej: mantener inventario entre 95% y 105%.

REGLAS DE CLASIFICACIÓN (en orden de prioridad):
- REGLA 1: Si existen línea base y meta numéricas → NUNCA uses Discreto. Analiza la naturaleza de la métrica:
  * Si menor es mejor (reducir tiempo, costos, errores, rotación, mora) → INVERSO
  * Si mayor es mejor (aumentar ventas, productividad, satisfacción) → DIRECTO
  * Si hay rango mínimo/máximo → Rango
- REGLA 2: Si NO hay métricas numéricas Y el resultado es binario (se hace o no se hace) → DISCRETO
- REGLA 3: NO clasifiques como Discreto solo porque el verbo sea "implementar". Si hay métrica de mejora, prioriza Directo o Inverso.

Casos de referencia:
| Objetivo                                              | Tipo     |
|-------------------------------------------------------|----------|
| Implementar ERP                                       | Discreto |
| Implementar ERP para reducir tiempos de 20 a 5 días  | Inverso  |
| Aumentar ventas en 30%                                | Directo  |
| Reducir rotación de personal de 15% a 5%              | Inverso  |
| Mantener disponibilidad entre 99.5% y 99.9%           | Rango    |
| Lanzar portal de empleados                            | Discreto |
| Crear chatbot para reducir tickets en 40%             | Inverso  |
| Implementar IA para aumentar productividad en 25%     | Directo  |

━━━ TAREA 2: CORRECCIÓN ORTOGRÁFICA (silenciosa y agresiva) ━━━
Corrige TODOS los errores en Proyecto/Enfoque y Acciones. Reglas estrictas:
1. Palabras de UNA sola letra que no sean artículos válidos (a, e, o, u, y) → reconstruir por contexto. Ej: "sistema d vacaciones" → "sistema de vacaciones", "q" → "que".
2. Palabras con letras faltantes → completar. Ej: "vacacion" → "vacaciones", "basandome" → "basándome".
3. Tildes faltantes en palabras comunes → agregar. Ej: "gestion" → "gestión", "digitalizacion" → "digitalización".
4. Frases coloquiales o informales fuera de contexto laboral ("comprendes", "esto comprendes", "sabes") → eliminar silenciosamente.
5. NO cambies el sentido ni elimines información relevante del objetivo.

━━━ TAREA 3: ANÁLISIS PREDICTIVO ━━━
Genera una sugerencia retadora basada en el historial 2025 del colaborador y su puesto.

IMPORTANTE — Corrección ortográfica: Corrige silenciosamente cualquier error tipográfico o de ortografía en los campos "Proyecto/Enfoque" y "Acciones" del usuario. No cambies el sentido, solo corrige errores de escritura evidentes (letras faltantes, palabras duplicadas, mayúsculas incorrectas, etc.).

Responde SOLAMENTE con un JSON válido (sin markdown, sin texto fuera del JSON):
{
  "tipoObjetivo": "Directo",
  "confianza": 95,
  "razon": "Justificación clara de por qué este tipo es el correcto según las reglas de prioridad",
  "sugerencia": "Análisis predictivo y sugerencia retadora basada en historial 2025 y puesto",
  "kpiComplementario": "Un KPI complementario específico para este objetivo",
  "correctedEnfoque": "Texto de Proyecto/Enfoque corregido (igual si no hay errores). No incluyas punto final.",
  "correctedQueHaras": "Texto de Acciones corregido. IMPORTANTE 1: Si empieza con un verbo en infinitivo (ej: 'implementar', 'realizar'), cámbialo obligatoriamente a un sustantivo verbal (ej: 'la implementación de', 'la realización de') o gerundio ('implementando') para asegurar coherencia gramatical al unirse con la palabra 'mediante'. IMPORTANTE 2: si el texto repite las mismas palabras del Enfoque, REESCRÍBELO describiendo el CÓMO. No incluyas punto final.",
  "smartValidation": {
    "S": { "pass": true, "msg": "Evaluación: acción específica y clara" },
    "M": { "pass": true, "msg": "Evaluación: métricas cuantificables" },
    "A": { "pass": true, "msg": "Evaluación: viabilidad operativa" },
    "R": { "pass": true, "msg": "Evaluación: relevancia corporativa" },
    "T": { "pass": true, "msg": "Evaluación: temporal 2026" }
  }
}`;

    let aiResult = null;
    try {
      const rawResponse = await callGeminiAI(aiPrompt);
      if (rawResponse) {
        let cleaned = rawResponse.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        aiResult = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error('AI JSON parse error:', e);
    }

    // --- Apply AI result ---
    const emojiMap = { 'Directo': '📈', 'Inverso': '📉', 'Rango': '📊', 'Discreto': '🎯' };
    if (aiResult && aiResult.tipoObjetivo) {
      const emoji = emojiMap[aiResult.tipoObjetivo] || '📈';
      obj.tipoEval = `${emoji} ${aiResult.tipoObjetivo}`;
      obj.aiRazon = aiResult.razon || '';
      obj.aiSugerencia = aiResult.sugerencia || '';
      obj.aiKpi = aiResult.kpiComplementario || '';
      obj.aiSmart = aiResult.smartValidation || null;
      // Apply AI spell-corrections to the obj fields before building the final text
      if (aiResult.correctedEnfoque && aiResult.correctedEnfoque.trim().length > 3) {
        obj.enfoque = aiResult.correctedEnfoque.trim();
      }
      if (aiResult.correctedQueHaras && aiResult.correctedQueHaras.trim().length > 3) {
        obj.queHaras = aiResult.correctedQueHaras.trim();
      }
    } else {
      // Fallback to rule-based analysis
      obj.tipoEval = analysis.evalType;
      obj.aiRazon = 'Determinado por motor de reglas interno.';
      obj.aiSugerencia = '';
      obj.aiKpi = '';
      obj.aiSmart = null;
    }

    // ── DEDUP GUARD: quitar el verbo si el usuario lo repitió al inicio del enfoque ──
    // Esto ocurre cuando la IA corrige un typo del verbo (ej: "implmentar" → "Implementar")
    // y el motor de texto lo concatena: "Implementar Implementar sistema..." → bug visual.
    if (obj.enfoque && obj.action) {
      const normalize = s => s.toLowerCase()
        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u');
      const actionNorm = normalize(obj.action);
      const enfNorm    = normalize(obj.enfoque.trim());
      // Si el enfoque empieza exactamente con el verbo elegido, lo quitamos
      if (enfNorm.startsWith(actionNorm)) {
        obj.enfoque = obj.enfoque.trim().substring(obj.action.length).trim();
      }
      // También cubrir sinónimos comunes
      const sinonimos = { 'Aumentar': ['incrementar'], 'Reducir': ['disminuir'] };
      const alts = sinonimos[obj.action] || [];
      for (const alt of alts) {
        if (enfNorm.startsWith(alt)) {
          obj.enfoque = obj.enfoque.trim().substring(alt.length).trim();
          break;
        }
      }
    }
    obj.finalSmart = formatObjectiveText(obj);
    obj.status = 'completed';
    saveState(true);

    // --- Update scanner overlay with AI result ---
    scannerLine.style.display = 'none';
    scannerIcon.textContent = '✨';
    scannerStatus.textContent = '¡Objetivo analizado por IA!';
    document.getElementById('scanner-detected-name').textContent = `Tipo: ${obj.tipoEval}`;
    document.getElementById('scanner-detected-puesto').textContent = obj.aiRazon;
    document.getElementById('scanner-detected-area').textContent = '';
    scannerDetails.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.remove('active');
      showResultScreen();
    }, 2000);
  }

  function showResultScreen() {
    showScreen('result');
    const obj = state.objectives[state.currentObjIndex];
    document.getElementById('smart-result-text').textContent = obj.finalSmart;

    const analysis = analyzeObjectiveViability(obj);
    const efficacy = calcEfficacyLevel(obj);
    const crossRef = checkPreviousYearCollabSimilarity(obj) || checkPreviousYearSimilarity(obj);

    // --- SMART Render Helper ---
    const renderSmart = (elId, letter, name, fallbackPass, fallbackMsgPass, fallbackMsgFail) => {
      const el = document.getElementById(elId);
      if (!el) return;
      let pass = fallbackPass;
      let msg = pass ? fallbackMsgPass : fallbackMsgFail;
      
      if (!fallbackPass) {
        // Regla de Negocio Estricta: Si JS local detecta falla (links, spam), se bloquea sin importar lo que diga la IA.
        pass = false;
        msg = fallbackMsgFail;
      } else if (obj.aiSmart && obj.aiSmart[letter]) {
        // Si pasa la validación local estricta, confiamos en el análisis avanzado de la IA.
        pass = obj.aiSmart[letter].pass;
        msg = obj.aiSmart[letter].msg;
      }
      
      if (pass) {
        el.innerHTML = `<span style="color:var(--success)">✓ ${name}:</span> <span style="font-weight:500; font-size:0.85rem; display:block; margin-top:2px; color:var(--text-main);">${msg}</span>`;
      } else {
        el.innerHTML = `<span style="color:var(--danger)">⚠ ${name}:</span> <span style="font-weight:500; font-size:0.85rem; display:block; margin-top:2px; color:var(--danger);">${msg}</span>`;
      }
    };

    const hasLinksOrGibberish = (text) => {
      if (!text) return true;
      const str = text.toLowerCase();
      if (str.includes('http') || str.includes('www.') || str.includes('.com') || str.includes('.io')) return true;
      const words = str.split(/\s+/).filter(w => w.length > 2);
      if (words.length < 3) return true; // Muy corto
      return false;
    };
    
    const isValidNumber = (text) => {
      if (!text) return false;
      const str = String(text).toLowerCase().trim();
      // Reject links explicitly
      if (str.includes('http') || str.includes('www.') || str.includes('.com') || str.includes('.io')) return false;
      // Must contain at least one digit — short numeric values like "80" or "8" are valid
      return /\d/.test(str);
    };

    renderSmart('smart-specific-status', 'S', 'Específico', 
      !hasLinksOrGibberish(obj.queHaras) && obj.queHaras.trim().length >= 15 && !hasLinksOrGibberish(obj.enfoque), 
      'Acción clara, estructurada y detallada.', 
      'El texto ingresado es inválido, contiene enlaces o carece de sentido profesional.'
    );

    renderSmart('smart-measurable-status', 'M', 'Medible', 
      isValidNumber(obj.lineaBase) && isValidNumber(obj.meta), 
      'Línea base y meta numéricas correctamente definidas.', 
      'Los indicadores deben contener valores numéricos y no enlaces ni texto sin sentido.'
    );

    renderSmart('smart-achievable-status', 'A', 'Alcanzable', 
      (!hasLinksOrGibberish(obj.queHaras) && (analysis.level === 'baja' || analysis.level === 'media')), 
      'Viabilidad operativa consistente con los datos.', 
      'Datos incongruentes, irreales o meta excesivamente fuera de rango.'
    );

    renderSmart('smart-relevant-status', 'R', 'Relevante', 
      obj.pilares && obj.pilares.length > 0 && !hasLinksOrGibberish(obj.enfoque), 
      'Alineado estratégicamente a un pilar corporativo.', 
      'Objetivo no estructurado correctamente o sin pilar válido.'
    );

    renderSmart('smart-time-status', 'T', 'Temporal', 
      true, 
      'Enfoque anual definido para 2026.', 
      'Falta establecer el año límite.'
    );

    // --- Tipo de objetivo (determinado por IA / Reglas) con traza al input del usuario ---
    const evalSelected = obj.tipoEval || '🎯 Discreto';
    const evalKey = evalSelected.replace(/📈|📉|🎯|📊/g, '').trim();
    const evalColorMap = { 'Directo': '#2563eb', 'Inverso': '#059669', 'Discreto': '#d97706', 'Rango': '#7c3aed', 'Rangos': '#7c3aed' };
    const evalBgMap   = { 'Directo': '#eff6ff', 'Inverso': '#f0fdf4', 'Discreto': '#fffbeb', 'Rango': '#faf5ff', 'Rangos': '#faf5ff' };
    const evalDescMap = {
      'Directo':  'El indicador mejora mientras más alto sea el valor alcanzado.',
      'Inverso':  'El indicador mejora mientras más bajo sea el valor resultante.',
      'Discreto': 'El cumplimiento es binario: el hito se logra completamente o no.',
      'Rango':    'El resultado es válido si se mantiene dentro de un intervalo definido.',
      'Rangos':   'El resultado es válido si se mantiene dentro de un intervalo definido.'
    };
    const evalColor = evalColorMap[evalKey] || '#0f172a';
    const evalBg    = evalBgMap[evalKey] || '#f8fafc';
    const evalDesc  = evalDescMap[evalKey] || '';

    // Build input-trace: show the user's actual inputs that led to this type
    const traceItems = [];
    if (obj.action) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Verbo: <strong>${obj.action}</strong></span>`);
    if (obj.enfoque) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Proyecto: <strong>${obj.enfoque.length > 40 ? obj.enfoque.substring(0,40)+'…' : obj.enfoque}</strong></span>`);
    if (obj.lineaBase) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Línea base: <strong>${obj.lineaBase}</strong></span>`);
    if (obj.meta) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Meta: <strong>${obj.meta}</strong></span>`);
    const traceHtml = traceItems.length > 0 ? `
      <div style="margin-top:0.6rem; display:flex; flex-wrap:wrap; gap:0.35rem; align-items:center;">
        <span style="font-size:0.7rem; color:#94a3b8; font-weight:600;">Determinado desde tu input →</span>
        ${traceItems.join('')}
      </div>` : '';

    const suggestionEl = document.getElementById('smart-eval-suggestion');
    if (suggestionEl) {
      const evalCardsHtml = [
        { key: 'Directo', emoji: '📈', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Directo', sub: 'mayor es mejor' },
        { key: 'Inverso', emoji: '📉', color: '#059669', bg: '#f0fdf4', border: '#86efac', label: 'Inverso', sub: 'menor es mejor' },
        { key: 'Discreto', emoji: '🎯', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Discreto', sub: 'cumple o no cumple' },
        { key: 'Rango', emoji: '📊', color: '#7c3aed', bg: '#faf5ff', border: '#d8b4fe', label: 'Rangos', sub: 'mantener en intervalo' }
      ].map(t => {
        const isInferred = t.key === evalKey || (evalKey === 'Rangos' && t.key === 'Rango') || (evalKey === 'Rango' && t.key === 'Rango');
        return `<div data-eval-card="${t.key}" style="
          flex:1; min-width:0; padding:0.6rem 0.5rem; border-radius:10px;
          border:2px solid ${isInferred ? t.color : t.border};
          background:${isInferred ? t.bg : '#fff'};
          text-align:center; transition:all 0.25s;
          box-shadow: ${isInferred ? `0 0 0 3px ${t.color}22` : 'none'};
        ">
          <div style="font-size:1.3rem;">${t.emoji}</div>
          <div class="eval-card-label" style="font-size:0.7rem; font-weight:${isInferred ? '800' : '600'}; color:${isInferred ? t.color : '#64748b'}; margin-top:2px;">${t.label}</div>
          <div style="font-size:0.6rem; color:${isInferred ? t.color : '#94a3b8'};">${t.sub}</div>
          <div class="eval-active-badge" style="display:${isInferred ? 'block' : 'none'}; font-size:0.6rem; font-weight:800; color:${t.color}; margin-top:4px; background:${t.bg}; border-radius:4px; padding:1px 4px;">← Sugerido</div>
        </div>`;
      }).join('');

      suggestionEl.innerHTML = `
        <div style="display:flex; gap:0.4rem; margin-bottom:1rem;">${evalCardsHtml}</div>
        <div style="background:${evalBg}; border:2px solid ${evalColor}22; border-radius:12px; padding:1rem; margin-bottom:0.75rem;">
          <div style="font-size:0.8rem; color:#374151; font-weight:600; margin-bottom:0.25rem;">${evalDesc}</div>
          <div style="font-size:0.8rem; color:#64748b; line-height:1.5;">${obj.aiRazon || 'Determinado por motor de reglas interno.'}</div>
          ${traceHtml}
        </div>
      `;
    }

    // --- Nivel de Reto (Eficacia) ---
    const efficacyEl = document.getElementById('panel-efficacy');
    if (efficacyEl) {
      const bars = [1,2,3,4,5].map(i => {
        const filled = i <= efficacy.score;
        return `<div style="flex:1; height:10px; border-radius:4px; background:${filled ? efficacy.color : '#e2e8f0'}; transition:all 0.4s;"></div>`;
      }).join('');
      efficacyEl.innerHTML = `
        <h4 style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">⚡ Nivel de Reto del Objetivo</h4>
        <div style="font-size:1rem; font-weight:800; color:${efficacy.color}; margin-bottom:0.5rem;">${efficacy.label}</div>
        <div style="display:flex; gap:6px; margin-bottom:0.75rem;">${bars}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${efficacy.tip}</div>
      `;
      efficacyEl.style.display = 'block';
    }

    // --- Cruce con año anterior (Opcional mostrarlo aquí si continuó) ---
    const crossEl = document.getElementById('panel-crossref');
    if (crossEl) {
      if (crossRef) {
        crossEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; font-weight:800; color:#92400e; margin-bottom:0.5rem;">🔄 CRUCE CON HISTORIAL 2025</div>
          <div style="font-size:0.875rem; color:var(--text-main); margin-bottom:0.5rem;">
            Tu meta del año pasado: <em>"${crossRef.previousText}"</em>
          </div>
          <div style="font-size:0.875rem; color:#92400e; font-weight:600;">💡 Has confirmado que este objetivo 2026 tiene una meta de exigencia mayor.</div>
        `;
        crossEl.style.display = 'block';
        crossEl.classList.remove('hidden');
      } else {
        crossEl.style.display = 'none';
      }
    }

    // --- AI Suggestion Panel (Gemini) ---
    const aiPanel = document.getElementById('ai-suggestion-panel');
    if (aiPanel) {
      if (obj.aiSugerencia || obj.aiKpi) {
        const puesto = state.collabInfo?.puesto || 'Colaborador';
        aiPanel.style.display = 'block';
        aiPanel.innerHTML = `
          <div class="ai-result-container ai-result-enter">
            <div class="ai-result-header">
              <div class="ai-sparkle-icon">✨</div>
              <div>
                <h4 style="margin:0; font-size:0.875rem; font-weight:800; color:var(--usil-blue); text-transform:uppercase; letter-spacing:0.04em;">Inteligencia Artificial — Sugerencia Personalizada</h4>
                <p style="margin:0; font-size:0.7rem; color:var(--text-muted);">Basado en tu puesto: ${puesto}</p>
              </div>
            </div>
            <div class="ai-result-body">
              ${obj.aiSugerencia ? `<p style="font-size:0.9375rem; line-height:1.7; color:var(--text-main); margin-bottom:0.75rem;">💡 ${obj.aiSugerencia}</p>` : ''}
              ${obj.aiKpi ? `<p style="font-size:0.875rem; line-height:1.5; color:var(--usil-blue); font-weight:600;">📊 KPI Complementario: ${obj.aiKpi}</p>` : ''}
            </div>
          </div>
        `;
      } else {
        aiPanel.style.display = 'none';
      }
    }
  }

  document.getElementById('btn-redo').addEventListener('click', () => {
    state.objectives[state.currentObjIndex].status = 'progress';
    state.wizardStep = 1;
    saveState(true);
    startWizard();
  });

  document.getElementById('btn-accept-result').addEventListener('click', () => {
    const obj = state.objectives[state.currentObjIndex];
    if (obj && obj.finalSmart && SAVE_WEBHOOK_URL !== '') {
      saveObjectiveToCloud(obj.finalSmart, obj);
    }
    continueStackFlow();
  });

  function continueStackFlow() {
    let nextPending = state.objectives.findIndex(o => o.status === 'pending');
    
    if (nextPending !== -1) {
      state.currentObjIndex = nextPending;
      state.wizardStep = 1;
      state.objectives[nextPending].status = 'progress';
      
      const refCard = document.getElementById('wizard-reference-card');
      if (state.objectives[nextPending].ref2025) {
        document.getElementById('wizard-reference-text').textContent = state.objectives[nextPending].ref2025;
        refCard.classList.remove('hidden');
      } else {
        refCard.classList.add('hidden');
      }

      saveState(true);
      startWizard();
    } else {
      showScreen('dashboard');
      renderDashboard();
    }
  }

  // --- CLOUD SAVE FUNCTION (GOOGLE FORMS INVISIBLE) ---
  function saveObjectiveToCloud(finalSmart, obj) {
    if (!SAVE_WEBHOOK_URL) return;

    const formData = new FormData();
    formData.append('entry.191290211', state.collabInfo?.dni || state.userId || '-'); // DNI
    formData.append('entry.1646991907', state.collabInfo?.nombre || '-');         // Nombres
    formData.append('entry.144480401', state.collabInfo?.puesto || '-');          // Puesto
    formData.append('entry.779363949', state.collabInfo?.area || state.area || '-'); // Area
    formData.append('entry.86969653', (obj.pilares && obj.pilares.length > 0) ? obj.pilares[0] : '-'); // Pilar
    
    // Tipo Eval
    const tipo = document.getElementById('select-tipo-eval') ? document.getElementById('select-tipo-eval').value : (obj.tipoEval || '-');
    formData.append('entry.1662612282', tipo);
    
    // Objetivo
    formData.append('entry.2087132226', finalSmart);

    fetch(SAVE_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    }).catch(err => console.error("Error al guardar en Form:", err));
  }

  init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
