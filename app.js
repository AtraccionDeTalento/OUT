const bootstrapApp = () => {
  const MAX_OBJ = 5;
  const TOTAL_STEPS = 3;
  const STORAGE_KEY = 'usilSmartStatePresentation2';
  // --- API KEYS con fallback automático ---
  // Si la key principal agota su cuota, se usa la de respaldo automáticamente.
  const GEMINI_API_KEYS = [
    'AQ.Ab8RN6IE6QHUThKGVePhMxjuimiqqJr0gYHjYsC2Qj82zcsH6Q', // Key principal
    'AQ.Ab8RN6KED4qh_e2JJ209w8awCOgI4b8l02MxfChXKdwK1ffxdw',
    'AQ.Ab8RN6K7mBcgpcqBu_C0Do4qOoACbuwuIQ0vch5h95wCgXL6_A',
    'AQ.Ab8RN6IR1SRg_vAK-40XxjCyYWP0cUi_EF9jhSuib1_VjXk2HQ',
    'AQ.Ab8RN6Lwpww1CFVd9zGtzVvcQPQ_FmrquNvJDmpWmicwDl6YMQ',
    'AQ.Ab8RN6L7xL8CBLEnr07oxeRE8ZRMmtA6_iooLyev_eOMJ7RqNg',
     'AIzaSyBmrQXJ7OFRMEsPKqTPTmEgalEap64e2uQ',// Key de respaldo
  ];
  const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const SAVE_WEBHOOK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfhCeBSfkyAniPfjm8eTn9bUKKot83nP5dkkiu0YXKijG_yqw/formResponse';
  const SAVE_WEBHOOK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfhCeBSfkyAniPfjm8eTn9bUKKot83nP5dkkiu0YXKijG_yqw/formResponse';

  // --- AI SUGGESTION ENGINE con rotación de keys y fallback a Groq ---
  async function callGeminiAI(prompt) {
    let lastError = null;
    
    // 1. Intentar con todas las llaves de Gemini
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
        
        if (!res.ok) {
          console.warn(`Gemini Key ${i + 1} falló (${res.status}), intentando siguiente...`);
          lastError = new Error(`API ${res.status}`);
          continue;
        }
        
        const data = await res.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (result) return result;
      } catch (e) {
        console.warn(`Error con Gemini key ${i + 1}:`, e.message);
        lastError = e;
      }
    }
    
    // 2. Si fallaron todas las Gemini, hacer Fallback a Groq (Llama 3)
    console.warn("Todas las llaves de Gemini fallaron. Activando motor de rescate Groq...");
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192', // Modelo de alto rendimiento
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (!groqRes.ok) {
        throw new Error(`Groq API ${groqRes.status}`);
      }
      
      const groqData = await groqRes.json();
      const groqResult = groqData.choices?.[0]?.message?.content || null;
      if (groqResult) return groqResult;
    } catch (groqError) {
      console.error("Groq fallback también falló:", groqError.message);
      // Si ambos motores fallaron, lanza el error para que la UI lo atrape
      if (lastError) throw lastError;
      throw groqError;
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
    { area: 'Capital Humano', kw: ['rotación', 'turnover', 'fuga de talento'], verbo: 'Reducir', texto: 'Reducir rotación de personal de 15% a 12%', meta: 12 },
    { area: 'Capital Humano', kw: ['capacitación', 'horas formación', 'training'], verbo: 'Aumentar', texto: 'Aumentar horas de capacitación por colaborador de 20h a 30h', meta: 30 },
    { area: 'Capital Humano', kw: ['clima laboral', 'satisfacción laboral', 'encuesta clima'], verbo: 'Aumentar', texto: 'Aumentar índice de clima laboral de 72% a 80%', meta: 80 },
    { area: 'Capital Humano', kw: ['evaluación desempeño', 'desempeño', 'performance review'], verbo: 'Implementar', texto: 'Implementar ciclo completo de evaluación de desempeño', meta: null },
    { area: 'Académico / Escuelas', kw: ['satisfacción estudiantil', 'nps', 'encuesta alumnos'], verbo: 'Aumentar', texto: 'Aumentar satisfacción estudiantil de 75% a 82%', meta: 82 },
    { area: 'Académico / Escuelas', kw: ['deserción', 'abandono', 'retiro estudiantil'], verbo: 'Reducir', texto: 'Reducir tasa de deserción académica de 12% a 8%', meta: 8 },
    { area: 'Académico / Escuelas', kw: ['acreditación', 'licenciamiento'], verbo: 'Ejecutar', texto: 'Ejecutar proceso de acreditación de 3 programas', meta: 3 },
    { area: 'Legal', kw: ['denuncia', 'litigio', 'demanda', 'proceso legal'], verbo: 'Mantener', texto: 'Mantener en 0% las denuncias activas', meta: 0, excepcionLegal: true },
    { area: 'Administración y Finanzas', kw: ['costo operativo', 'gasto', 'presupuesto'], verbo: 'Reducir', texto: 'Reducir costos operativos en 10% respecto al año anterior', meta: null },
    { area: 'Administración y Finanzas', kw: ['cobranza', 'mora', 'recaudación'], verbo: 'Aumentar', texto: 'Aumentar tasa de cobranza mensual de 85% a 92%', meta: 92 },
    { area: 'Comunicaciones y Marketing', kw: ['matrícula', 'captación', 'leads', 'conversión'], verbo: 'Aumentar', texto: 'Aumentar tasa de conversión de leads de 18% a 25%', meta: 25 },
    { area: 'Comunicaciones y Marketing', kw: ['redes sociales', 'engagement', 'seguidores'], verbo: 'Aumentar', texto: 'Aumentar engagement en redes sociales de 3.2% a 5%', meta: 5 },
    { area: 'Informática / Transformación Digital', kw: ['sistema', 'plataforma', 'digitalización', 'automatización'], verbo: 'Implementar', texto: 'Implementar 2 nuevos módulos en el sistema ERP institucional', meta: 2 },
    { area: 'Informática / Transformación Digital', kw: ['incidencia', 'ticket', 'soporte', 'tiempo respuesta'], verbo: 'Reducir', texto: 'Reducir tiempo de atención de incidencias de 48h a 24h', meta: 24 },
    { area: 'Infraestructura y Servicios', kw: ['mantenimiento', 'instalación', 'obra'], verbo: 'Ejecutar', texto: 'Ejecutar plan de mantenimiento preventivo al 95% de instalaciones', meta: 95 },
    { area: 'Bienestar Universitario', kw: ['participación', 'programa bienestar', 'actividades'], verbo: 'Aumentar', texto: 'Aumentar participación en programas de bienestar de 45% a 60%', meta: 60 },
    { area: 'Operaciones', kw: ['proceso', 'tiempo ciclo', 'eficiencia operativa'], verbo: 'Optimizar', texto: 'Optimizar tiempo de ciclo de procesos administrativos de 5 días a 3 días', meta: 3 },
    { area: 'Relaciones Internacionales', kw: ['convenio', 'acuerdo internacional', 'movilidad'], verbo: 'Aumentar', texto: 'Aumentar convenios internacionales activos de 12 a 18', meta: 18 },
    { area: 'Investigación y Doctorado', kw: ['publicación', 'scopus', 'artículo científico', 'investigación'], verbo: 'Aumentar', texto: 'Aumentar publicaciones indexadas de 8 a 15 anuales', meta: 15 },
    { area: 'Registros Académicos', kw: ['grado', 'título', 'trámite', 'tiempo proceso'], verbo: 'Reducir', texto: 'Reducir tiempo de procesamiento de grados y títulos de 90 a 60 días', meta: 60 },
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
      tipoEvalManual: '',
      queHaras: '',
      impacto: '',
      finalSmart: '',
      ref2025: ''
    }))
  };

  const screens = {
    hero: document.getElementById('screen-hero'),
    intro: document.getElementById('screen-intro'),
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
        showScreen('intro');
      }, 1800);

    }, 1800);
  });

  document.getElementById('btn-continue-intro').addEventListener('click', () => {
    showScreen('dashboard');
    renderDashboard();
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
        if (obj.status === 'completed') {
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
      const btnExcel = document.getElementById('btn-download-excel');
      if (btnExcel) {
        btnExcel.style.display = 'inline-flex';
      }
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

  // ── MOTOR DE REGLAS HÍBRIDO v2 ────────────────────────────────────────────
  // Prioridad: Señales textuales fuertes > Área > Métrica numérica > Verbo
  // Replica la jerarquía de 5 niveles del Prompt_Clasificador_SMART_USIL.md
  function getSuggestedEvalType(actionStr, tipoEvalManual, lineaBase, meta, enfoque, queHaras, areaCollab) {
    if (tipoEvalManual) return tipoEvalManual;
    const act = (actionStr || '').toLowerCase();
    const enf = (enfoque || '').toLowerCase();
    const que = (queHaras || '').toLowerCase();
    const fullText = `${act} ${enf} ${que}`;
    const areaLower = (areaCollab || '').toLowerCase();

    // ══════════════════════════════════════════════════════════════════════
    // NIVEL 1 — SEÑALES FUERTES DE INVERSO (ratio >30x en el dataset)
    // ══════════════════════════════════════════════════════════════════════
    const señalesInverso = [
      'reducir en un', 'reducir el tiempo', 'disminuir en',
      'tasa de rotación', 'tasa de abandono', 'rotación voluntaria',
      'por debajo de s/', 'por debajo de', 'morosidad',
      'devolución', 'devoluciones', 'errores en la facturación',
      'reducir la tasa', 'disminuir la tasa', 'minimizar',
      'bajar el índice', 'reducir el índice'
    ];
    if (señalesInverso.some(s => fullText.includes(s))) return '📉 Inverso';

    // ══════════════════════════════════════════════════════════════════════
    // NIVEL 2 — SEÑALES FUERTES DE RANGOS (ratio >100x en el dataset)
    // ══════════════════════════════════════════════════════════════════════
    const señalesRangos = [
      'ahorro acumulado', 'ahorro generado', 'ahorro anual',
      'órdenes de compra', 'ordenes de compra',
      'contrato marco', 'tarifario vigente', 'tarifario',
      'artículos científicos', 'articulos cientificos',
      'revistas indexadas', 'scopus', 'web of science',
      'homologación de proveedores', 'homologacion de proveedores',
      'days payable outstanding', 'dpo',
      'capex', 'opex', 'capex/opex',
      'margen de contribución', 'margen de contribucion',
      'ebitda', 'ebit',
      'ingresos netos', 'facturación neta', 'facturacion neta',
      'utilidad operativa', 'rentabilidad operativa',
      'licitaciones', 'licitación',
      'producción científica', 'produccion cientifica'
    ];
    if (señalesRangos.some(s => fullText.includes(s))) return '📊 Rangos';

    // ══════════════════════════════════════════════════════════════════════
    // NIVEL 3 — SEÑALES FUERTES DE DISCRETO (ratio >40x en el dataset)
    // ══════════════════════════════════════════════════════════════════════
    const señalesDiscreto = [
      'dentro del plazo', 'dentro de los plazos',
      'reiteración de pedido', 'reiteracion de pedido',
      'sin observaciones', 'sin observacion',
      'antes de su vencimiento', 'antes del vencimiento',
      'cumplir dentro de los plazos',
      'resoluciones del tribunal', 'tribunal de apelaciones',
      'expedientes presentados', 'expedientes de acreditación',
      'expedientes de acreditacion',
      'apelaciones', 'indecopi', 'sunedu', 'minedu',
      'acreditación', 'acreditacion', 'licenciamiento',
      'auditoría', 'auditoria',
      'cumplimiento normativo', 'cumplimiento regulatorio',
      'sanción', 'sancion', 'multa'
    ];
    if (señalesDiscreto.some(s => fullText.includes(s))) return '🎯 Discreto';

    // ══════════════════════════════════════════════════════════════════════
    // NIVEL 2B — CLASIFICACIÓN POR ÁREA ORGANIZACIONAL (prioridad alta)
    // ══════════════════════════════════════════════════════════════════════
    const areasDiscreto = [
      'legal', 'acreditación', 'acreditacion', 'licenciamiento'
    ];
    const areasRangos = [
      'contabilidad', 'finanzas', 'financiero', 'costos', 'presupuesto',
      'tesorería', 'tesoreria', 'logística', 'logistica',
      'compras', 'cobranza', 'facturación', 'facturacion',
      'activos fijos', 'patrimoni', 'investigación', 'investigacion'
    ];
    if (areasDiscreto.some(a => areaLower.includes(a))) return '🎯 Discreto';
    if (areasRangos.some(a => areaLower.includes(a))) return '📊 Rangos';

    // ══════════════════════════════════════════════════════════════════════
    // NIVEL 4 — MÉTRICA NUMÉRICA (línea base vs meta)
    // ══════════════════════════════════════════════════════════════════════
    const baseNum = parseFloat(String(lineaBase || '').replace(',', '.'));
    const metaNum = parseFloat(String(meta || '').replace(',', '.'));
    const hayMetrica = !isNaN(baseNum) && !isNaN(metaNum);

    if (hayMetrica) {
      if (metaNum < baseNum) {
        return '📉 Inverso';
      }
      // metaNum >= baseNum — podría ser Directo o Rango según contexto
      const señalesEstabilidad = ['mantener', 'sostener', 'estabiliz', 'entre', 'rango', 'nivel'];
      if (metaNum === baseNum && señalesEstabilidad.some(s => fullText.includes(s))) {
        return '📊 Rangos';
      }
      // Default para meta > base sin señales especiales
      return '📈 Directo';
    }

    // ══════════════════════════════════════════════════════════════════════
    // NIVEL 5 — CLASIFICACIÓN POR VERBO (sin señales textuales ni números)
    // ══════════════════════════════════════════════════════════════════════
    const verbosInverso = ['reducir', 'disminuir', 'bajar', 'eliminar', 'minimizar'];
    if (verbosInverso.some(v => act.includes(v))) return '📉 Inverso';

    const verbosRango = ['mantener', 'sostener'];
    // "mantener" algo positivo por encima → Directo; algo negativo por debajo → Inverso
    if (verbosRango.some(v => act.includes(v))) {
      const señalesNegativas = ['rotación', 'rotacion', 'abandono', 'error', 'mora', 'gasto', 'costo', 'desperdicio'];
      if (señalesNegativas.some(s => fullText.includes(s))) return '📉 Inverso';
      return '📊 Rangos';
    }

    // Verbos de implementación → Discreto
    const verbosDiscreto = ['implementar', 'ejecutar', 'crear', 'desarrollar', 'diseñar', 'desplegar', 'lanzar', 'construir', 'establecer'];
    if (verbosDiscreto.some(v => act.includes(v) || enf.startsWith(v))) return '🎯 Discreto';

    // Verbos de crecimiento → Directo
    const verbosDirecto = ['aumentar', 'incrementar', 'mejorar', 'ampliar', 'elevar', 'crecer', 'fortalecer', 'potenciar', 'optimizar'];
    if (verbosDirecto.some(v => act.includes(v))) return '📈 Directo';

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
    const emojiMap = { 'Directo': '📈', 'Inverso': '📉', 'Rangos': '📊', 'Discreto': '🎯', 'Rango': '📊' };
    let evalType = '';
    if (obj.tipoEvalManual) {
      const emoji = emojiMap[obj.tipoEvalManual] || '📈';
      evalType = `${emoji} ${obj.tipoEvalManual}`;
    } else {
      evalType = obj.tipoEval || getSuggestedEvalType(obj.action, obj.tipoEvalManual, obj.lineaBase, obj.meta, obj.enfoque, obj.queHaras, state.area);
    }
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
      level = 'baja';
      title = 'Objetivo de estabilidad';
      message = 'El objetivo busca mantener el resultado dentro de los límites definidos.';
      statusColor = 'var(--success)';
      reasons.push(`Se evaluará el mantenimiento del indicador entre ${base} y ${meta}.`);
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
    for (let i = 1; i <= TOTAL_STEPS; i++) {
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

      const tarjetas = '';

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

          <div style="border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 1.5rem;">
            <p class="input-label" style="margin-top:0">¿Cuál es el <strong>impacto esperado</strong> de lograr este objetivo? <span style="color:var(--danger)">*</span></p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">Describe el propósito de negocio: ¿para qué se hace?</p>
            <input type="text" class="custom-input" id="inp-impacto" placeholder="Ej. Garantizar información confiable para la toma de decisiones gerenciales" value="${obj.impacto || ''}">
          </div>
          
          ${tarjetas}
        </div>
      `;
    }

    UI.wizardContent.innerHTML = html;

    // EVENT LISTENERS WITH REAL-TIME AUTOSAVE
    const handleInput = (id, field) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => { obj[field] = e.target.value; saveState(true); });
        el.addEventListener('change', (e) => { obj[field] = e.target.value; saveState(true); });
      }
    };

    if (state.wizardStep === 1) {
      const sel = document.getElementById('sel-accion');
      if (sel) {
        sel.addEventListener('change', (e) => {
          obj.action = e.target.value;
          saveState(true);
        });
      }
    } else if (state.wizardStep === 2) {
      handleInput('inp-enfoque', 'enfoque');
      const container = document.getElementById('pilares-container');
      if (container) {
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
      handleInput('inp-impacto', 'impacto');

      // Detector de redundancia en tiempo real
      const inp = document.getElementById('inp-que');
      const warnEl = document.getElementById('redundancy-warn');
      const checkRedundancy = () => {
        if (!inp || !warnEl || !obj.enfoque) return;
        const normR = s => s.toLowerCase()
          .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e')
          .replace(/[íì]/g, 'i').replace(/[óò]/g, 'o')
          .replace(/[úù]/g, 'u').replace(/[^a-z\s]/g, ' ');
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
    const loadingEl = document.getElementById('ai-actions-loading');
    const chipsEl = document.getElementById('ai-actions-chips');
    const container = document.getElementById('ai-chips-container');
    if (!loadingEl || !chipsEl || !container) return;

    const puesto = state.collabInfo?.puesto || 'Colaborador';
    const area = state.collabInfo?.area || state.area || 'General';
    const verbo = obj.action || 'Implementar';
    const enfoque = obj.enfoque || '';
    const meta = obj.meta || '';
    const base = obj.lineaBase || '';

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
      let cleaned = raw.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}');
      if (fb !== -1 && lb !== -1) cleaned = cleaned.substring(fb, lb + 1);
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
    } catch (e) {
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
      const impactoVal = (document.getElementById('inp-impacto')?.value || '').trim();

      let hasError = false;
      ['inp-base', 'inp-meta', 'inp-que', 'inp-impacto'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
          el.style.borderColor = 'var(--danger)';
          el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
          hasError = true;
        }
      });

      if (hasError) {
        showStepError('Debes completar todos los campos: indicador actual, meta, acciones e impacto esperado.');
        return;
      }

      obj.lineaBase = baseVal;
      obj.meta = metaVal;
      obj.queHaras = queVal;
      obj.impacto = impactoVal;
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
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');

      // Todos los sinónimos de cada verbo del dropdown
      const verbGroups = [
        ['implementar', 'implementacion', 'implementación'],
        ['ejecutar', 'ejecucion', 'ejecución'],
        ['aumentar', 'incrementar', 'aumento', 'incremento'],
        ['reducir', 'disminuir', 'reduccion', 'reducción', 'disminucion', 'disminución'],
        ['mantener', 'mantenimiento'],
        ['optimizar', 'optimizacion', 'optimización'],
        ['lograr', 'logro'],
      ];

      const enfNorm = normalize(enf);
      const firstWord = enfNorm.split(/\s+/)[0];

      for (const group of verbGroups) {
        if (group.includes(firstWord)) {
          // Strip the leading verb word(s) — remove first word + any trailing space
          enf = enf.replace(/^\S+\s*/, '').trim();
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
        .replace(/[\u00e1\u00e0]/g, 'a').replace(/[\u00e9\u00e8]/g, 'e')
        .replace(/[\u00ed\u00ec]/g, 'i').replace(/[\u00f3\u00f2]/g, 'o')
        .replace(/[\u00fa\u00f9]/g, 'u').replace(/[^a-z\s]/g, ' ');
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
      const tipoReal = (obj.tipoEvalManual || obj.tipoEval || '').toLowerCase();
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
    // Impacto organizacional
    if (obj.impacto && obj.impacto.trim().length > 5) {
      let imp = obj.impacto.trim();
      if (imp.charAt(0) === imp.charAt(0).toUpperCase() && !/^[A-Z]{2,}/.test(imp)) {
        imp = imp.charAt(0).toLowerCase() + imp.slice(1);
      }
      imp = imp.replace(/\.+$/, '');
      text += `, con el fin de ${imp}`;
    }

    // Cálculo del porcentaje de crecimiento/reducción
    const baseCalc = parseFloat(String(obj.lineaBase || '').replace(',', '.'));
    const metaCalc = parseFloat(String(obj.meta || '').replace(',', '.'));
    if (!isNaN(baseCalc) && !isNaN(metaCalc) && baseCalc !== 0) {
      const deltaPct = Math.abs(((metaCalc - baseCalc) / baseCalc) * 100);
      const roundedPct = Math.round(deltaPct * 10) / 10;
      if (roundedPct > 0) {
        const direction = metaCalc > baseCalc ? 'crecimiento' : 'reducción';
        text += `, representando un ${direction} del ${roundedPct}%`;
      }
    }

    // Timeline anchor
    text += `, al cierre del año 2026.`;

    // Clean text and capitalize
    text = text.replace(/\s+/g, ' ').replace(/\.\s*,/g, ',').replace(/,\s*,/g, ',').trim();
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!text.endsWith('.')) text += '.';

    return text;
  }

  function getClasificacionJustificacion(tipo, base, meta) {
    if (tipo === 'Directo') {
      const b = parseFloat(String(base).replace(',', '.'));
      const m = parseFloat(String(meta).replace(',', '.'));
      if (!isNaN(b) && !isNaN(m) && m > b) {
        return "la meta es superior a la línea base.";
      }
      return "busca incrementar el indicador.";
    } else if (tipo === 'Inverso') {
      const b = parseFloat(String(base).replace(',', '.'));
      const m = parseFloat(String(meta).replace(',', '.'));
      if (!isNaN(b) && !isNaN(m) && m < b) {
        return "la meta es inferior a la línea base.";
      }
      return "busca reducir el indicador.";
    } else if (tipo === 'Discreto') {
      return "el indicador representa cumplimiento de un hito o entregable.";
    } else if (tipo === 'Rangos') {
      return "el indicador debe mantenerse dentro de límites o condiciones definidas.";
    }
    return "fue seleccionado manualmente.";
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
    const objetivoCompleto = `${obj.action} ${obj.enfoque} (de ${obj.lineaBase} a ${obj.meta}) mediante ${obj.queHaras}, con el fin de ${obj.impacto}`;
    const aiPrompt = `Eres un experto en Gestión del Desempeño, OKRs, KPIs y metodología SMART de la Corporación Educativa USIL.

Tu tarea NO es redactar inmediatamente el objetivo. Primero debes VALIDAR que existan los 7 componentes obligatorios, luego clasificar el tipo, y finalmente generar el objetivo profesional.

Perfil del colaborador:
- Nombre: ${nombre}
- Puesto: ${puesto}
- Área: ${area}
- Historial Objetivos 2025: ${historial ? historial : 'Sin historial previo'}

COMPONENTES DEL OBJETIVO 2026 (los 7 campos obligatorios):
1. Verbo SMART: ${obj.action}
2. Indicador/Proyecto: ${obj.enfoque}
3. Línea base: ${obj.lineaBase}
4. Meta esperada: ${obj.meta}
5. Método/Estrategia: ${obj.queHaras}
6. Impacto organizacional: ${obj.impacto}
7. Plazo: cierre del año 2026
- Pilares estratégicos: ${(obj.pilares || []).join(', ')}
- Objetivo completo inferido: "${objetivoCompleto}"

━━━ TAREA 1: CLASIFICAR TIPO DE EVALUACIÓN (PROMPT COMPLETO) ━━━

DEFINICIÓN DE LOS 4 TIPOS:

TIPO 1: DIRECTO
Lógica: Mayor valor logrado = mayor porcentaje de logro.
Fórmula: % Logro = (Valor Logrado / Meta) × 100
Cuándo usar: El indicador mide avance, ejecución, cobertura, cantidad de cosas realizadas o porcentajes de cumplimiento donde más es mejor.
Ejemplo: "Implementar 4 campañas" → si logra 4, obtiene 100%; si logra 5, obtiene 120%.

TIPO 2: INVERSO
Lógica: Menor valor logrado = mayor porcentaje de logro.
Fórmula: % Logro = (Meta / Valor Logrado) × 100
Cuándo usar: El indicador mide algo negativo que se quiere reducir: errores, tiempo de resolución, tasas de abandono, desperdicios, rotación de personal, morosidad, devoluciones, reclamos.
Ejemplo: "Reducir la tasa de rotación al 8%" → si logra 6%, obtiene 133%.
Trampa: Si se usa DIRECTO aquí, el sistema castiga al colaborador que redujo más de lo esperado.

TIPO 3: DISCRETO
Lógica: Cumplimiento por umbrales fijos, generalmente todo o nada.
Estructura: 99% o menos → 0% | 100% → 100% | 100% con anticipación → 120%
Cuándo usar: Cumplimiento normativo, legal o regulatorio donde el incumplimiento total tiene consecuencias fijas (multa, sanción, observación SUNEDU/INDECOPI/MINEDU).
Ejemplo: "Atender el 100% de reclamos SAC de INDECOPI dentro de 2 días hábiles".

TIPO 4: RANGOS
Lógica: Escala graduada de 4 niveles de logro.
Estructura: Nivel 0 → 0% | Nivel 1 (mínimo) → 85% | Nivel 2 (esperado) → 100% | Nivel 3 (sobresaliente) → 120%
Cuándo usar: Resultados financieros, comerciales, de abastecimiento o de producción científica donde distintos niveles de logro tienen valor diferenciado.
Ejemplo: "Generar ahorro acumulado de S/ 2,488,296" → lograr 85% de la meta tiene valor significativo.

REGLAS DE CLASIFICACIÓN POR ÁREA ORGANIZACIONAL (PRIORIDAD ALTA):
GERENCIA LEGAL / VICEPRESIDENCIA LEGAL / DIRECCIÓN DE ACREDITACIÓN / ACREDITACIÓN Y LICENCIAMIENTO / LICENCIAMIENTO → DISCRETO
SUBGERENCIA DE CONTABILIDAD / VICEPRESIDENCIA DE FINANZAS / ANÁLISIS Y PLAN FINANCIERO / COSTOS Y PRESUPUESTOS / COMPENSACIONES Y PRESUPUESTO / SUBGERENCIA CORPORATIVA DE TESORERÍA / LOGÍSTICA / COMPRAS / CRÉDITOS Y COBRANZAS / GERENCIA CORPORATIVO DE FACTURACIÓN / ACTIVOS FIJOS Y CONTROL PATRIMONIAL / DIRECCIÓN GESTIÓN DE LA INVESTIGACIÓN → RANGOS

REGLAS POR SEÑALES TEXTUALES (en orden de prioridad):

NIVEL 1 — SEÑALES FUERTES DE INVERSO:
"reducir en un X%", "reducir el tiempo", "disminuir en", "tasa de rotación", "tasa de abandono", "por debajo de S/.", "morosidad", "devolución", "rotación voluntaria", "errores en la facturación"

NIVEL 2 — SEÑALES FUERTES DE RANGOS:
"ahorro acumulado", "órdenes de compra", "contrato marco", "tarifario vigente", "artículos científicos", "revistas indexadas", "en SCOPUS", "homologación de proveedores", "DPO", "CAPEX/OPEX", "margen de contribución", "EBITDA"

NIVEL 3 — SEÑALES FUERTES DE DISCRETO:
"dentro del plazo" + área legal/normativa, "reiteración de pedido", "sin observaciones", "antes de su vencimiento", "cumplir dentro de los plazos", "resoluciones del Tribunal", "expedientes presentados", "apelaciones" + área legal

NIVEL 4 — POR VERBO INICIAL:
reducir/disminuir/minimizar/bajar → INVERSO (ALTA) | mantener algo negativo → INVERSO (MEDIA) | lograr con escala financiera → RANGOS (MEDIA) | participar en eventos/publicaciones → RANGOS (MEDIA) | incrementar/aumentar → DIRECTO (ALTA) | mejorar/diseñar/organizar → DIRECTO (MEDIA) | implementar proceso normativo → DISCRETO (MEDIA) | lograr/alcanzar/implementar general → DIRECTO (BAJA)

NIVEL 5 — RESIDUAL: Si nada aplica → DIRECTO con confianza BAJA.

SEÑALES QUE INVALIDAN UNA CLASIFICACIÓN (errores frecuentes):
- Área Finanzas/Contabilidad + DIRECTO → Cambiar a RANGOS
- Área Legal/Acreditación + DIRECTO → Cambiar a DISCRETO
- Verbo "reducir" + DIRECTO → Cambiar a INVERSO
- "mantener por debajo de" + DIRECTO → Cambiar a INVERSO
- RANGOS en actividades académicas → Cambiar a DIRECTO
- INVERSO con meta de S/ absoluto (no tasa) → Cambiar a RANGOS

CASOS AMBIGUOS:
- "Mantener" positivo por encima de umbral → DIRECTO | "Mantener" negativo por debajo → INVERSO
- "Lograr" académico/operativo → DIRECTO | financiero → RANGOS | normativo/legal → DISCRETO
- "Implementar" proporcional → DIRECTO | auditoría/acreditación/normativa → DISCRETO
- Publicaciones en SCOPUS, artículos enviados → RANGOS

━━━ TAREA 2: CORRECCIÓN ORTOGRÁFICA (silenciosa y agresiva) ━━━
1. Palabras de UNA sola letra que no sean artículos válidos (a, e, o, u, y) → reconstruir por contexto.
2. Palabras con letras faltantes → completar.
3. Tildes faltantes → agregar.
4. Frases coloquiales o informales fuera de contexto laboral → eliminar silenciosamente.
5. NO cambies el sentido ni elimines información relevante del objetivo.

━━━ TAREA 3: ANÁLISIS PREDICTIVO ━━━
Genera una sugerencia retadora basada en el historial 2025 del colaborador y su puesto.

━━━ TAREA 4: VALIDAR Y GENERAR OBJETIVO SMART PROFESIONAL ━━━
Actúa como un experto en Gestión del Desempeño de la Corporación Educativa USIL.

PASO 1 — VALIDAR: Verifica que los 7 componentes obligatorios existan y tengan contenido real:
1. Verbo SMART (no genérico)
2. Indicador/Proyecto (específico y medible)
3. Línea base (valor numérico actual)
4. Meta (valor numérico objetivo)
5. Método/Estrategia (cómo se logrará — NO puede repetir el proyecto)
6. Impacto organizacional (para qué se hace — propósito de negocio)
7. Plazo (temporal)

Si alguno falta o es genérico/vacío, marca "completo": false y lista los faltantes.

PASO 2 — GENERAR: Solo si todos los componentes existen, reescribe el objetivo como una versión profesional, ejecutiva y evaluable.

REGLAS DE GENERACIÓN:
- Nunca ignores un componente. Los 7 deben reflejarse en el texto final.
- El método debe aparecer explícitamente (mediante/a través de).
- El impacto debe aparecer explícitamente (con el fin de/para).
- La línea base debe aparecer explícitamente.
- La meta debe aparecer explícitamente.
- SIEMPRE calcula matemáticamente la diferencia porcentual o el porcentaje de crecimiento/reducción entre la línea base y la meta e inclúyelo en la redacción de forma explícita (ej. "representando un crecimiento de X%").
- El plazo debe aparecer explícitamente (al cierre del año 2026).
- Si contiene porcentajes, especifica respecto a qué valor se comparan.
- Si contiene métricas absolutas, asegúrate de que sean cuantificables.
- Elimina actividades operativas como objetivo principal. Enfócate en resultados e impacto.
- El resultado debe tener entre 40 y 80 palabras.
- Redacción ejecutiva, breve y profesional.
- No uses frases genéricas. El objetivo debe ser evaluable.
- Devuelve el resultado en el campo "objetivoSMARTMejorado".

Responde SOLAMENTE con un JSON válido (sin markdown, sin texto fuera del JSON):
{
  "completo": true,
  "faltantes": [],
  "tipoObjetivo": "Directo",
  "confianza": "ALTA",
  "razon": "Justificación en máximo 30 palabras de por qué elegiste ese tipo",
  "señalDetectada": "La frase o palabra clave específica que activó la clasificación",
  "advertencia": "Solo si hay combinación errónea, explicar impacto. Dejar vacío si no aplica.",
  "sugerencia": "Análisis predictivo y sugerencia retadora basada en historial 2025 y puesto",
  "kpiComplementario": "Un KPI complementario específico para este objetivo",
  "correctedEnfoque": "Texto de Proyecto/Enfoque corregido. No incluyas punto final.",
  "correctedQueHaras": "Texto de Acciones corregido. Si empieza con verbo en infinitivo, cámbialo a sustantivo verbal o gerundio para coherencia con 'mediante'. Si repite el Enfoque, reescríbelo describiendo el CÓMO. No incluyas punto final.",
  "correctedImpacto": "Texto de Impacto corregido ortográficamente. No incluyas punto final.",
  "objetivoSMARTMejorado": "Versión profesional, ejecutiva y evaluable del objetivo completo (40-80 palabras). DEBE incluir: verbo + indicador + de [línea base] a [meta] + mediante [método] + con el fin de [impacto] + al cierre del año 2026.",
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

    if (aiResult && aiResult.completo === false) {
      overlay.classList.remove('active');
      const faltantesStr = (aiResult.faltantes && aiResult.faltantes.length > 0) ? aiResult.faltantes.join(', ') : 'componentes clave';
      showStepError(`La IA detectó que tu redacción es insuficiente o faltan detalles: ${faltantesStr}. Por favor, mejora tu respuesta.`);
      return;
    }

    // --- Apply AI result ---
    const emojiMap = { 'Directo': '📈', 'Inverso': '📉', 'Rangos': '📊', 'Discreto': '🎯', 'Rango': '📊' };

    if (aiResult) {
      // La IA clasifica automáticamente el tipo
      const aiTipo = aiResult.tipoObjetivo === 'Rango' ? 'Rangos' : (aiResult.tipoObjetivo || 'Directo');
      const emoji = emojiMap[aiTipo] || '📈';
      obj.tipoEval = `${emoji} ${aiTipo}`;
      obj.tipoEvalManual = aiTipo; // Guardar para que formatObjectiveText use el tipo correcto
      obj.aiTipoSugerido = aiTipo;
      obj.aiRazon = aiResult.razon || getClasificacionJustificacion(aiTipo, obj.lineaBase, obj.meta);
      obj.aiConfianza = aiResult.confianza || 'MEDIA';
      obj.aiSenalDetectada = aiResult.señalDetectada || aiResult.senalDetectada || '';
      obj.aiAdvertencia = aiResult.advertencia || '';
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
      // Fallback: usar motor de reglas local si la IA falla
      const fallbackTipo = getSuggestedEvalType(obj.action, '', obj.lineaBase, obj.meta, obj.enfoque, obj.queHaras, state.area);
      const cleanTipo = fallbackTipo.replace(/📈|📉|🎯|📊/g, '').trim();
      const emoji = emojiMap[cleanTipo] || '📈';
      obj.tipoEval = `${emoji} ${cleanTipo}`;
      obj.tipoEvalManual = cleanTipo;
      obj.aiTipoSugerido = cleanTipo;
      obj.aiRazon = getClasificacionJustificacion(cleanTipo, obj.lineaBase, obj.meta);
      obj.aiConfianza = 'BAJA';
      obj.aiSenalDetectada = '';
      obj.aiAdvertencia = '';
      obj.aiSugerencia = '';
      obj.aiKpi = '';
      obj.aiSmart = null;
    }

    // ── DEDUP GUARD: quitar el verbo si el usuario lo repitió al inicio del enfoque ──
    // Esto ocurre cuando la IA corrige un typo del verbo (ej: "implmentar" → "Implementar")
    // y el motor de texto lo concatena: "Implementar Implementar sistema..." → bug visual.
    if (obj.enfoque && obj.action) {
      const normalize = s => s.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
      const actionNorm = normalize(obj.action);
      const enfNorm = normalize(obj.enfoque.trim());
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
    // Usar el objetivo reescrito por la IA si está disponible; sino, usar el constructor local
    if (aiResult && aiResult.objetivoSMARTMejorado && aiResult.objetivoSMARTMejorado.trim().length > 20) {
      obj.finalSmart = aiResult.objetivoSMARTMejorado.trim();
      // Asegurar que termine con punto
      if (!obj.finalSmart.endsWith('.')) obj.finalSmart += '.';
    } else {
      obj.finalSmart = formatObjectiveText(obj);
    }
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
    const evalSuggested = obj.aiTipoSugerido || obj.tipoEvalManual || 'Directo';
    const evalKey = evalSuggested.replace(/📈|📉|🎯|📊/g, '').trim();

    // Build input-trace: show the user's actual inputs that led to this type
    const traceItems = [];
    if (obj.action) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Verbo: <strong>${obj.action}</strong></span>`);
    if (obj.enfoque) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Proyecto: <strong>${obj.enfoque.length > 40 ? obj.enfoque.substring(0, 40) + '…' : obj.enfoque}</strong></span>`);
    if (obj.lineaBase) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Línea base: <strong>${obj.lineaBase}</strong></span>`);
    if (obj.meta) traceItems.push(`<span style="background:#f1f5f9; border-radius:4px; padding:1px 6px; font-size:0.75rem;">Meta: <strong>${obj.meta}</strong></span>`);
    const traceHtml = traceItems.length > 0 ? `
      <div style="margin-top:0.6rem; display:flex; flex-wrap:wrap; gap:0.35rem; align-items:center;">
        ${traceItems.join('')}
      </div>` : '';

    const suggestionEl = document.getElementById('smart-eval-suggestion');
    if (suggestionEl) {
      const allCards = [
        { key: 'Directo', emoji: '📈', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Directo', sub: 'mayor es mejor' },
        { key: 'Inverso', emoji: '📉', color: '#059669', bg: '#f0fdf4', border: '#86efac', label: 'Inverso', sub: 'menor es mejor' },
        { key: 'Discreto', emoji: '🎯', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: 'Discreto', sub: 'cumple o no cumple' },
        { key: 'Rangos', emoji: '📊', color: '#7c3aed', bg: '#faf5ff', border: '#d8b4fe', label: 'Rangos', sub: 'mantener en intervalo' }
      ];

      const t = allCards.find(c => c.key === evalKey) || allCards[0];

      // Confidence badge colors
      const confColors = { 'ALTA': '#10b981', 'MEDIA': '#f59e0b', 'BAJA': '#ef4444' };
      const confColor = confColors[obj.aiConfianza] || '#94a3b8';

      const evalCardsHtml = `<div data-eval-card="${t.key}" style="
          width: 180px; padding:1rem; border-radius:12px;
          border:2px solid ${t.color};
          background:${t.bg};
          text-align:center; margin: 0 auto;
          box-shadow: 0 4px 12px ${t.color}22;
        ">
          <div style="font-size:2rem; margin-bottom: 0.5rem;">${t.emoji}</div>
          <div class="eval-card-label" style="font-size:1rem; font-weight:800; color:${t.color}; margin-top:2px;">${t.label}</div>
          <div style="font-size:0.75rem; color:${t.color}; margin-bottom: 0.5rem;">${t.sub}</div>
          <div style="display:flex; gap:0.35rem; justify-content:center; flex-wrap:wrap;">
            <div class="eval-active-badge" style="display:inline-block; font-size:0.65rem; font-weight:800; color:#fff; background:${t.color}; border-radius:6px; padding:2px 8px;">Sugerido por el Sistema</div>
          </div>
        </div>`;

      let justificacionHtml = `Este objetivo fue clasificado como <strong>${t.label}</strong> porque ${obj.aiRazon}`;

      // Signal detected
      const senalHtml = obj.aiSenalDetectada ? `
        <div style="margin-top:0.75rem; padding:0.5rem 0.75rem; background:#f1f5f9; border-radius:8px; font-size:0.8rem; color:#475569;">
          <span style="font-weight:700; color:#1e3a5f;">🔍 Señal detectada:</span> ${obj.aiSenalDetectada}
        </div>` : '';

      // Warning if any
      const advertenciaHtml = obj.aiAdvertencia ? `
        <div style="margin-top:0.75rem; padding:0.6rem 0.75rem; background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; font-size:0.8rem; color:#92400e; font-weight:600;">
          ⚠️ ${obj.aiAdvertencia}
        </div>` : '';

      suggestionEl.innerHTML = `
        <div style="display:flex; justify-content:center; margin-bottom:1.5rem;">${evalCardsHtml}</div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem; margin-bottom:0.75rem;">
          <div style="font-size:0.95rem; color:#1e293b; line-height:1.5; font-weight: 500;">${justificacionHtml}</div>
          ${senalHtml}
          ${advertenciaHtml}
          ${traceHtml}
        </div>
      `;
    }

    // --- Nivel de Reto (Eficacia) ---
    const efficacyEl = document.getElementById('panel-efficacy');
    if (efficacyEl) {
      const bars = [1, 2, 3, 4, 5].map(i => {
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

  const btnDownloadExcel = document.getElementById('btn-download-excel');
  if (btnDownloadExcel) {
    btnDownloadExcel.addEventListener('click', () => {
      if (typeof XLSX === 'undefined') {
        alert("La librería para exportar Excel no se ha cargado correctamente.");
        return;
      }
      
      const wb = XLSX.utils.book_new();
      
      const data = [
        ['N°', 'DNI', 'Colaborador', 'Puesto', 'Área', 'Objetivo SMART Generado', 'Tipo de Objetivo (Clasificación)', 'Día y Fecha de Realización']
      ];
      
      const currentDateTime = new Date().toLocaleString('es-PE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
      });
      
      state.objectives.forEach((obj, i) => {
        if (obj.finalSmart) {
          data.push([
            i + 1,
            state.collabInfo?.dni || state.userId || '-',
            state.collabInfo?.nombre || '-',
            state.collabInfo?.puesto || '-',
            state.collabInfo?.area || state.area || 'General',
            obj.finalSmart,
            obj.tipoEvalManual || obj.tipoEval || 'No clasificado',
            currentDateTime
          ]);
        }
      });
      
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Styling columns width
      ws['!cols'] = [
        {wch: 5},   // N°
        {wch: 12},  // DNI
        {wch: 30},  // Colaborador
        {wch: 30},  // Puesto
        {wch: 25},  // Área
        {wch: 90},  // Objetivo SMART Generado
        {wch: 25},  // Tipo
        {wch: 25}   // Fecha
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Objetivos 2026");
      
      const fileName = `Objetivos_SMART_2026_${state.collabInfo?.nombre?.replace(/\s+/g, '_') || 'USIL'}.xlsx`;
      XLSX.writeFile(wb, fileName);
    });
  }

  init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
