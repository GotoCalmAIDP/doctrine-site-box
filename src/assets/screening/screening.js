import {
  ASSESSMENT_DATE,
  ASSESSMENT_VERSION,
  AXES,
  QUESTIONS,
  SCALE,
  evaluateScreening
} from "./screening-core.js";
import {
  CONFLICT_STATES,
  EVIDENCE_CLASSES,
  EVIDENCE_STATUSES,
  EVIDENCE_WORKSPACE_VERSION,
  FRESHNESS_STATES,
  buildEvidenceWorkspaceExport,
  createEvidenceRows,
  evaluateEvidenceReadiness
} from "./evidence-workspace-core.js";

const root = document.querySelector("#gc-screening");

if (root) {
  const language = root.dataset.language === "ua" ? "ua" : "en";
  const t = {
    en: {
      alpha: "Public alpha · self-reported",
      lead: "A short boundary screening for automated, AI-enabled and consequence-bearing systems.",
      purpose: "It helps identify where the stated scope is incomplete or where a deeper evidence review may be useful. It does not determine compliance, safety, certification, conformance or permission to operate.",
      time: "19 selections · about 6–9 minutes",
      private: "Private by design",
      privateText: "The assessment runs in this browser. No account, uploads, names, free text or answer submission are used.",
      before: "Before you begin",
      beforeItems: [
        "Choose one specific system or decision context and one current version.",
        "Answer from records you can actually identify, not from intended future controls.",
        "Do not enter confidential, personal, client, vessel, project or system information."
      ],
      start: "Start screening",
      progress: "Progress",
      question: "Question",
      of: "of",
      back: "Back",
      next: "Continue",
      seeResult: "See screening result",
      materialTitle: "Could this system or its output create a material consequence?",
      materialHint: "Include physical, operational, legal, financial or durable recorded consequences. Choose unknown if the consequence path has not been mapped.",
      materialOptions: [
        ["yes", "Yes"],
        ["no", "No, within the stated scope"],
        ["unknown", "Unknown"]
      ],
      lifecycleTitle: "What is the closest current lifecycle context?",
      lifecycleHint: "Select the present context, not the intended future state.",
      lifecycleOptions: [
        ["concept", "Concept or early research"],
        ["design", "Design, procurement or pre-deployment"],
        ["pilot", "Pilot, test or limited operation"],
        ["live", "Live or production operation"]
      ],
      scaleHelp: "Use the same evidence scale for each statement.",
      resultLabel: "Screening result",
      outcome: {
        indeterminate: ["Insufficient basis for a bounded result", "Unknown, excluded or weakly defined scope elements constrain this screening. Clarify the assessment object and evidence basis before relying on the profile."],
        review: ["Deeper evidence review is advisable", "The answers indicate a material consequence path or one or more control gaps that merit scoped review. This is a screening signal, not a finding of non-compliance or unsafety."],
        "no-escalation": ["No escalation indicator identified in the stated scope", "The self-reported answers did not trigger this screening’s escalation rules. This is not verification, approval, certification, conformance or evidence that the system is safe."]
      },
      profile: "Self-reported boundary profile",
      profileHelp: "Percentages summarize selected answers within each axis. They are navigation aids, not grades, benchmarks or proof.",
      unknown: "Unknown answers",
      excluded: "Out-of-scope answers",
      material: "Material consequence path",
      lifecycle: "Lifecycle context",
      yes: "Yes",
      no: "No",
      unknownValue: "Unknown",
      contexts: { concept: "Concept / research", design: "Design / pre-deployment", pilot: "Pilot / test", live: "Live / production" },
      method: "Assessment record",
      selfReported: "Self-reported; evidence not reviewed",
      disclaimerTitle: "Important boundary",
      disclaimer: "This educational screening is not an audit, independent verification, certification, safety case, legal advice, engineering approval or regulatory conclusion. Answers and percentages are not evidence or proof and do not establish applicability, admissibility, authority, mandate continuity or doctrine conformance. The result cannot authorize execution, continuation or restoration. Unknown and excluded areas constrain the result. It applies only to the object, context, version and date you considered; material changes require reassessment.",
      urgent: "Do not use this screening for urgent operational decisions or as a substitute for qualified legal, safety, engineering or regulatory judgment.",
      print: "Print or save result",
      restart: "Restart",
      readScope: "Read Scope and Limitations",
      readEvidence: "Read Evidence",
      answerRequired: "Select one answer to continue.",
      percentUnavailable: "Not bounded",
      workspace: {
        open: "Continue to evidence readiness workspace",
        openBlank: "Open blank evidence workspace",
        eyebrow: "Tier 1 local alpha · structured working record",
        title: "Evidence Readiness Workspace",
        purpose: "Map where reviewable records exist and where the evidence basis remains open. This workspace does not review evidence and does not produce a pass, approval or conformance result.",
        privacy: "Nothing is sent or saved automatically. The working record exists only in this tab unless you export it. Use neutral references and do not enter raw evidence, personal data, credentials, client details or operationally sensitive information.",
        contextTitle: "Assessment context",
        referenceLabel: "Neutral object reference",
        referenceHint: "Example: SYSTEM-A or CASE-014",
        versionLabel: "Assessed version or configuration",
        versionHint: "Example: v2.4 or config-2026-09",
        dateLabel: "Assessment date",
        contextLabel: "Neutral context label",
        contextHint: "Example: pre-deployment review",
        summaryTitle: "Readiness map",
        mapped: "Mapped records",
        openItems: "Open records",
        excluded: "Outside stated scope",
        priority: "Priority open records",
        summaryBoundary: "Mapped means only that a current, classified record locator with no known conflict has been entered. It is not proof that the underlying claim is true or admissible.",
        contextOpen: "assessment context field(s) remain incomplete",
        mapTitle: "Evidence map by doctrine axis",
        sourceAnswer: "Screening answer",
        status: "Record status",
        evidenceClass: "Evidence class",
        locator: "Record locator",
        locatorHint: "Identifier, register path or controlled reference — not the evidence itself",
        freshness: "Currentness",
        conflict: "Conflict check",
        mappingState: "Mapping state",
        state: { mapped: "Mapped", open: "Open", excluded: "Scope boundary" },
        actionsTitle: "Open action register",
        noOpenActions: "No mapping actions remain. Independent review is still required before any evidentiary or operational conclusion.",
        action: {
          "confirm-scope-boundary": "Confirm and justify the stated scope boundary",
          "identify-record-status": "Identify whether a relevant record exists",
          "locate-or-create-record": "Locate or create the required record",
          "complete-record-basis": "Complete the partial or informal record basis",
          "classify-evidence": "Classify the evidence source",
          "add-record-locator": "Add a controlled record locator",
          "recheck-currentness": "Recheck the record for the current context",
          "establish-currentness": "Establish the record's currentness",
          "resolve-evidence-conflict": "Resolve the identified evidence conflict",
          "check-for-conflict": "Check for conflicting records or observations"
        },
        export: "Export JSON snapshot",
        print: "Print working record",
        back: "Back to screening result",
        clear: "Reset workspace",
        clearConfirm: "Reset every Tier 1 field in this tab? This cannot be undone unless you already exported a snapshot.",
        exported: "JSON snapshot downloaded",
        exportBoundary: "The JSON is a portable self-reported working record, not an audit artifact, proof package or authorization object.",
        version: "Workspace version",
        emptyOutcome: "Blank workspace",
        current: "current mapping"
      }
    },
    ua: {
      alpha: "Публічна альфа · самооцінка",
      lead: "Короткий скринінг меж для автоматизованих, ШІ-підсилених систем і систем із наслідками.",
      purpose: "Допомагає виявити неповний заявлений обсяг або потребу в глибшому розгляді свідчень. Не визначає відповідність, безпеку, сертифікацію, конформність чи дозвіл на експлуатацію.",
      time: "19 виборів · приблизно 6–9 хвилин",
      private: "Приватність за задумом",
      privateText: "Оцінювання виконується в цьому браузері. Обліковий запис, завантаження, імена, вільний текст і надсилання відповідей не використовуються.",
      before: "Перед початком",
      beforeItems: [
        "Оберіть одну конкретну систему або контекст рішення та одну актуальну версію.",
        "Відповідайте на підставі записів, які можете визначити, а не майбутніх запланованих контролів.",
        "Не вводьте конфіденційні, персональні, клієнтські, суднові, проєктні чи системні дані."
      ],
      start: "Почати скринінг",
      progress: "Прогрес",
      question: "Питання",
      of: "з",
      back: "Назад",
      next: "Продовжити",
      seeResult: "Показати результат",
      materialTitle: "Чи може ця система або її результат створити суттєвий наслідок?",
      materialHint: "Враховуйте фізичні, операційні, правові, фінансові або довговічно зафіксовані наслідки. Оберіть «Невідомо», якщо шлях наслідків не картовано.",
      materialOptions: [
        ["yes", "Так"],
        ["no", "Ні, у заявленому обсязі"],
        ["unknown", "Невідомо"]
      ],
      lifecycleTitle: "Який поточний контекст життєвого циклу є найближчим?",
      lifecycleHint: "Оберіть теперішній контекст, а не бажаний майбутній стан.",
      lifecycleOptions: [
        ["concept", "Концепція або раннє дослідження"],
        ["design", "Проєктування, закупівля або підготовка до розгортання"],
        ["pilot", "Пілот, тест або обмежена експлуатація"],
        ["live", "Діюча або виробнича експлуатація"]
      ],
      scaleHelp: "Для кожного твердження використовуйте однакову шкалу свідчень.",
      resultLabel: "Результат скринінгу",
      outcome: {
        indeterminate: ["Недостатня підстава для обмеженого результату", "Невідомі, виключені або слабо визначені елементи обсягу обмежують цей скринінг. Уточніть об’єкт оцінювання та підставу свідчень, перш ніж покладатися на профіль."],
        review: ["Доцільний глибший розгляд свідчень", "Відповіді вказують на шлях суттєвих наслідків або одну чи кілька прогалин контролю, що потребують обмеженого розгляду. Це сигнал скринінгу, а не висновок про невідповідність чи небезпечність."],
        "no-escalation": ["У заявленому обсязі сигнал ескалації не виявлено", "Самозаявлені відповіді не активували правила ескалації цього скринінгу. Це не є перевіркою, схваленням, сертифікацією, конформністю або доказом безпеки системи."]
      },
      profile: "Самозаявлений профіль меж",
      profileHelp: "Відсотки підсумовують обрані відповіді в межах кожної осі. Це навігаційні орієнтири, а не оцінки, еталони чи докази.",
      unknown: "Відповіді «Невідомо»",
      excluded: "Відповіді «Поза обсягом»",
      material: "Шлях суттєвих наслідків",
      lifecycle: "Контекст життєвого циклу",
      yes: "Так",
      no: "Ні",
      unknownValue: "Невідомо",
      contexts: { concept: "Концепція / дослідження", design: "Проєктування / до розгортання", pilot: "Пілот / тест", live: "Діюча / виробнича" },
      method: "Запис оцінювання",
      selfReported: "Самооцінка; свідчення не перевірялися",
      disclaimerTitle: "Важлива межа",
      disclaimer: "Цей освітній скринінг не є аудитом, незалежною перевіркою, сертифікацією, обґрунтуванням безпеки, юридичною порадою, інженерним схваленням або регуляторним висновком. Відповіді та відсотки не є свідченнями чи доказами і не встановлюють застосовність, допустимість, повноваження, безперервність мандата або відповідність доктрині. Результат не може дозволяти виконання, продовження чи відновлення. Невідомі та виключені області обмежують результат. Він стосується лише об’єкта, контексту, версії та дати, які ви розглядали; суттєві зміни потребують повторного оцінювання.",
      urgent: "Не використовуйте цей скринінг для термінових операційних рішень або замість кваліфікованого юридичного, безпекового, інженерного чи регуляторного судження.",
      print: "Друкувати або зберегти результат",
      restart: "Почати знову",
      readScope: "Читати «Обсяг та обмеження»",
      readEvidence: "Читати «Доказовість»",
      answerRequired: "Оберіть одну відповідь, щоб продовжити.",
      percentUnavailable: "Не визначено",
      workspace: {
        open: "Перейти до робочого простору готовності свідчень",
        openBlank: "Відкрити порожній робочий простір свідчень",
        eyebrow: "Локальна альфа Tier 1 · структурований робочий запис",
        title: "Робочий простір готовності свідчень",
        purpose: "Позначте, де існують записи для перегляду, а де доказова підстава залишається відкритою. Цей простір не перевіряє свідчення і не видає результату про проходження, схвалення чи конформність.",
        privacy: "Нічого не надсилається і не зберігається автоматично. Робочий запис існує лише в цій вкладці, доки ви його не експортуєте. Використовуйте нейтральні посилання та не вводьте самі свідчення, персональні дані, облікові дані, відомості клієнта або операційно чутливу інформацію.",
        contextTitle: "Контекст оцінювання",
        referenceLabel: "Нейтральне позначення об’єкта",
        referenceHint: "Приклад: SYSTEM-A або CASE-014",
        versionLabel: "Оцінювана версія або конфігурація",
        versionHint: "Приклад: v2.4 або config-2026-09",
        dateLabel: "Дата оцінювання",
        contextLabel: "Нейтральна назва контексту",
        contextHint: "Приклад: перегляд до розгортання",
        summaryTitle: "Карта готовності",
        mapped: "Картовані записи",
        openItems: "Відкриті записи",
        excluded: "Поза заявленим обсягом",
        priority: "Пріоритетні відкриті записи",
        summaryBoundary: "«Картовано» означає лише, що введено актуальний класифікований локатор запису без відомого конфлікту. Це не доводить істинність або допустимість відповідного твердження.",
        contextOpen: "полів контексту оцінювання залишаються незаповненими",
        mapTitle: "Карта свідчень за осями доктрини",
        sourceAnswer: "Відповідь скринінгу",
        status: "Стан запису",
        evidenceClass: "Клас свідчення",
        locator: "Локатор запису",
        locatorHint: "Ідентифікатор, шлях у реєстрі або контрольоване посилання — не саме свідчення",
        freshness: "Актуальність",
        conflict: "Перевірка конфлікту",
        mappingState: "Стан картування",
        state: { mapped: "Картовано", open: "Відкрито", excluded: "Межа обсягу" },
        actionsTitle: "Реєстр відкритих дій",
        noOpenActions: "Дій з картування не залишилося. Незалежний перегляд однаково потрібен до будь-якого доказового або операційного висновку.",
        action: {
          "confirm-scope-boundary": "Підтвердити й обґрунтувати заявлену межу обсягу",
          "identify-record-status": "Визначити, чи існує відповідний запис",
          "locate-or-create-record": "Знайти або створити потрібний запис",
          "complete-record-basis": "Доповнити часткову або неформальну підставу запису",
          "classify-evidence": "Класифікувати джерело свідчення",
          "add-record-locator": "Додати контрольований локатор запису",
          "recheck-currentness": "Перевірити актуальність запису для поточного контексту",
          "establish-currentness": "Встановити актуальність запису",
          "resolve-evidence-conflict": "Усунути виявлений конфлікт свідчень",
          "check-for-conflict": "Перевірити наявність суперечливих записів або спостережень"
        },
        export: "Експортувати знімок JSON",
        print: "Друкувати робочий запис",
        back: "Назад до результату скринінгу",
        clear: "Скинути робочий простір",
        clearConfirm: "Скинути всі поля Tier 1 у цій вкладці? Скасувати це неможливо, якщо знімок ще не експортовано.",
        exported: "Знімок JSON завантажено",
        exportBoundary: "JSON є переносним робочим записом самооцінки, а не аудиторським артефактом, пакетом доказів чи об’єктом авторизації.",
        version: "Версія робочого простору",
        emptyOutcome: "Порожній робочий простір",
        current: "поточне картування"
      }
    }
  }[language];

  const localDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const state = {
    phase: "intro",
    routingIndex: 0,
    questionIndex: 0,
    materialConsequence: null,
    lifecycle: null,
    answers: {}
  };
  let workspaceNotice = "";
  let workspace = {
    context: {
      referenceLabel: "",
      assessedVersion: "",
      assessmentDate: localDate(),
      contextLabel: ""
    },
    screening: null,
    rows: []
  };
  const total = QUESTIONS.length + 2;
  const questionById = Object.fromEntries(QUESTIONS.map((question) => [question.id, question]));

  const checked = (actual, expected) => actual === expected ? " checked" : "";
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const selectOptions = (items, selected) => items.map((item) =>
    `<option value="${item.value}"${item.value === selected ? " selected" : ""}>${item[language]}</option>`
  ).join("");
  const progress = (current) => `
    <div class="gc-progress-block">
      <div class="gc-progress-copy"><span>${t.progress}</span><span>${current} ${t.of} ${total}</span></div>
      <div class="gc-progress" role="progressbar" aria-label="${t.progress}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${current}">
        <span style="width:${Math.round((current / total) * 100)}%"></span>
      </div>
    </div>`;

  const options = (items, selected) => items.map(([value, label]) => `
    <label class="gc-option">
      <input type="radio" name="answer" value="${value}"${checked(selected, value)}>
      <span>${label}</span>
    </label>`).join("");

  function renderIntro() {
    root.innerHTML = `
      <section class="gc-panel gc-intro" aria-labelledby="gc-intro-title">
        <p class="gc-eyebrow">${t.alpha}</p>
        <h2 id="gc-intro-title">${t.lead}</h2>
        <p class="gc-lead">${t.purpose}</p>
        <p class="gc-time">${t.time}</p>
        <div class="gc-privacy"><strong>${t.private}</strong><span>${t.privateText}</span></div>
        <h3>${t.before}</h3>
        <ul>${t.beforeItems.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="gc-actions">
          <button class="gc-button gc-button-primary" type="button" data-action="start">${t.start}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="open-workspace-blank">${t.workspace.openBlank}</button>
        </div>
      </section>`;
  }

  function renderRouting() {
    const isMaterial = state.routingIndex === 0;
    const title = isMaterial ? t.materialTitle : t.lifecycleTitle;
    const hint = isMaterial ? t.materialHint : t.lifecycleHint;
    const choiceList = isMaterial ? t.materialOptions : t.lifecycleOptions;
    const selected = isMaterial ? state.materialConsequence : state.lifecycle;
    root.innerHTML = `
      ${progress(state.routingIndex + 1)}
      <form class="gc-panel gc-question" data-form="routing">
        <fieldset>
          <legend>${title}</legend>
          <p class="gc-hint">${hint}</p>
          <div class="gc-options">${options(choiceList, selected)}</div>
          <p class="gc-form-error" role="alert" hidden>${t.answerRequired}</p>
        </fieldset>
        <div class="gc-actions">
          <button class="gc-button gc-button-quiet" type="button" data-action="back">${t.back}</button>
          <button class="gc-button gc-button-primary" type="submit">${t.next}</button>
        </div>
      </form>`;
  }

  function renderQuestion() {
    const question = QUESTIONS[state.questionIndex];
    const current = state.questionIndex + 3;
    const scaleItems = SCALE.map((item) => [item.value, item[language]]);
    root.innerHTML = `
      ${progress(current)}
      <form class="gc-panel gc-question" data-form="question">
        <fieldset>
          <p class="gc-axis">${AXES.find((axis) => axis.id === question.axis)[language]}</p>
          <legend><span class="gc-question-number">${t.question} ${state.questionIndex + 1}</span>${question[language]}</legend>
          <p class="gc-hint">${t.scaleHelp}</p>
          <div class="gc-options gc-scale">${options(scaleItems, state.answers[question.id])}</div>
          <p class="gc-form-error" role="alert" hidden>${t.answerRequired}</p>
        </fieldset>
        <div class="gc-actions">
          <button class="gc-button gc-button-quiet" type="button" data-action="back">${t.back}</button>
          <button class="gc-button gc-button-primary" type="submit">${state.questionIndex === QUESTIONS.length - 1 ? t.seeResult : t.next}</button>
        </div>
      </form>`;
  }

  function renderResults() {
    const result = evaluateScreening(state);
    const [title, description] = t.outcome[result.outcome];
    const consequenceLabel = result.materialConsequence === "yes" ? t.yes : result.materialConsequence === "no" ? t.no : t.unknownValue;
    const scopePath = language === "en" ? "en/scope-and-limitations" : "ua/scope-and-limitations";
    const evidencePath = language === "en" ? "en/evidence" : "ua/evidence";
    root.innerHTML = `
      <section class="gc-results" aria-labelledby="gc-result-title">
        <div class="gc-panel gc-outcome gc-outcome-${result.outcome}">
          <p class="gc-eyebrow">${t.resultLabel}</p>
          <h2 id="gc-result-title">${title}</h2>
          <p class="gc-lead">${description}</p>
        </div>
        <div class="gc-result-grid">
          <section class="gc-panel" aria-labelledby="gc-profile-title">
            <h3 id="gc-profile-title">${t.profile}</h3>
            <p class="gc-hint">${t.profileHelp}</p>
            <div class="gc-axis-list" role="list">
              ${result.axes.map((axis) => {
                const score = axis.score === null ? t.percentUnavailable : `${axis.score}%`;
                const width = axis.score === null ? 0 : axis.score;
                return `<div class="gc-axis-row" role="listitem">
                  <div><span>${axis[language]}</span><strong>${score}</strong></div>
                  <div class="gc-axis-meter" aria-hidden="true"><span style="width:${width}%"></span></div>
                </div>`;
              }).join("")}
            </div>
          </section>
          <aside class="gc-panel gc-record" aria-labelledby="gc-record-title">
            <h3 id="gc-record-title">${t.method}</h3>
            <dl>
              <div><dt>${t.material}</dt><dd>${consequenceLabel}</dd></div>
              <div><dt>${t.lifecycle}</dt><dd>${t.contexts[result.lifecycle]}</dd></div>
              <div><dt>${t.unknown}</dt><dd>${result.unknownCount}</dd></div>
              <div><dt>${t.excluded}</dt><dd>${result.outOfScopeCount}</dd></div>
              <div><dt>Version</dt><dd>${ASSESSMENT_VERSION}</dd></div>
              <div><dt>Date</dt><dd>${ASSESSMENT_DATE}</dd></div>
              <div><dt>Status</dt><dd>${t.selfReported}</dd></div>
            </dl>
          </aside>
        </div>
        <section class="gc-boundary" aria-labelledby="gc-boundary-title">
          <h3 id="gc-boundary-title">${t.disclaimerTitle}</h3>
          <p>${t.disclaimer}</p>
          <p><strong>${t.urgent}</strong></p>
        </section>
        <div class="gc-actions gc-result-actions">
          <button class="gc-button gc-button-primary" type="button" data-action="open-workspace">${t.workspace.open}</button>
          <button class="gc-button gc-button-primary" type="button" data-action="print">${t.print}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="restart">${t.restart}</button>
          <a class="gc-text-link" href="/doctrine-site-box/${scopePath}/">${t.readScope}</a>
          <a class="gc-text-link" href="/doctrine-site-box/${evidencePath}/">${t.readEvidence}</a>
        </div>
      </section>`;
  }

  function startWorkspace(blank = false) {
    if (blank) {
      state.materialConsequence = "unknown";
      state.lifecycle = "concept";
      state.answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, "unknown"]));
    }
    const screeningResult = evaluateScreening(state);
    workspace = {
      context: {
        referenceLabel: "",
        assessedVersion: "",
        assessmentDate: localDate(),
        contextLabel: ""
      },
      screening: screeningResult,
      rows: createEvidenceRows(state.answers)
    };
    workspaceNotice = "";
    state.phase = "workspace";
    render();
  }

  function contextGaps() {
    return ["referenceLabel", "assessedVersion", "assessmentDate", "contextLabel"]
      .filter((field) => !workspace.context[field].trim());
  }

  function renderWorkspaceRow(row, evaluatedRow, index) {
    const question = questionById[row.questionId];
    const source = SCALE.find((item) => item.value === row.sourceAnswer);
    const excluded = row.evidenceStatus === "excluded";
    const fieldId = `gc-evidence-${row.questionId}`;
    const actions = evaluatedRow.actions.map((action) => `<li>${t.workspace.action[action]}</li>`).join("");
    return `
      <article class="gc-evidence-row gc-evidence-${evaluatedRow.state}" data-question-id="${row.questionId}">
        <header class="gc-evidence-row-header">
          <div>
            <span class="gc-question-number">${index + 1}. ${AXES.find((axis) => axis.id === row.axis)[language]}</span>
            <h4>${question[language]}</h4>
          </div>
          <span class="gc-state-chip gc-state-${evaluatedRow.state}">${t.workspace.state[evaluatedRow.state]}</span>
        </header>
        <p class="gc-source-answer"><strong>${t.workspace.sourceAnswer}:</strong> ${source ? source[language] : row.sourceAnswer}</p>
        <div class="gc-evidence-fields">
          <label for="${fieldId}-status">${t.workspace.status}
            <select id="${fieldId}-status" data-workspace-row="${row.questionId}" data-workspace-field="evidenceStatus">
              ${selectOptions(EVIDENCE_STATUSES, row.evidenceStatus)}
            </select>
          </label>
          <label for="${fieldId}-class">${t.workspace.evidenceClass}
            <select id="${fieldId}-class" data-workspace-row="${row.questionId}" data-workspace-field="evidenceClass"${excluded ? " disabled" : ""}>
              ${selectOptions(EVIDENCE_CLASSES, row.evidenceClass)}
            </select>
          </label>
          <label for="${fieldId}-freshness">${t.workspace.freshness}
            <select id="${fieldId}-freshness" data-workspace-row="${row.questionId}" data-workspace-field="freshness"${excluded ? " disabled" : ""}>
              ${selectOptions(FRESHNESS_STATES, row.freshness)}
            </select>
          </label>
          <label for="${fieldId}-conflict">${t.workspace.conflict}
            <select id="${fieldId}-conflict" data-workspace-row="${row.questionId}" data-workspace-field="conflict"${excluded ? " disabled" : ""}>
              ${selectOptions(CONFLICT_STATES, row.conflict)}
            </select>
          </label>
          <label class="gc-locator-field" for="${fieldId}-locator">${t.workspace.locator}
            <input id="${fieldId}-locator" type="text" value="${escapeHtml(row.recordLocator)}" placeholder="${escapeHtml(t.workspace.locatorHint)}" data-workspace-row="${row.questionId}" data-workspace-field="recordLocator" autocomplete="off"${excluded ? " disabled" : ""}>
          </label>
        </div>
        ${actions ? `<ul class="gc-row-actions">${actions}</ul>` : ""}
      </article>`;
  }

  function renderWorkspace() {
    const evaluation = evaluateEvidenceReadiness(workspace.rows);
    const gaps = contextGaps();
    const openActions = evaluation.openActions
      .slice()
      .sort((a, b) => Number(b.priority) - Number(a.priority))
      .map((item) => {
        const question = questionById[item.questionId];
        return `<li${item.priority ? ' class="gc-priority-action"' : ""}><strong>${question[language]}</strong><span>${item.actions.map((action) => t.workspace.action[action]).join("; ")}</span></li>`;
      }).join("");
    const groups = AXES.map((axis) => {
      const axisEvaluation = evaluation.byAxis.find((item) => item.id === axis.id);
      const axisRows = workspace.rows.filter((row) => row.axis === axis.id);
      const hasPriority = axisRows.some((row) => row.critical && evaluation.rows.find((item) => item.questionId === row.questionId)?.state === "open");
      return `
        <details class="gc-axis-group"${hasPriority ? " open" : ""}>
          <summary>
            <span>${axis[language]}</span>
            <span>${t.workspace.mapped}: ${axisEvaluation.mapped} · ${t.workspace.openItems}: ${axisEvaluation.open} · ${t.workspace.excluded}: ${axisEvaluation.excluded}</span>
          </summary>
          <div class="gc-axis-group-body">
            ${axisRows.map((row) => renderWorkspaceRow(row, evaluation.rows.find((item) => item.questionId === row.questionId), QUESTIONS.findIndex((question) => question.id === row.questionId))).join("")}
          </div>
        </details>`;
    }).join("");

    root.innerHTML = `
      <section class="gc-workspace" aria-labelledby="gc-workspace-title">
        <header class="gc-panel gc-workspace-header">
          <p class="gc-eyebrow">${t.workspace.eyebrow}</p>
          <h2 id="gc-workspace-title">${t.workspace.title}</h2>
          <p class="gc-lead">${t.workspace.purpose}</p>
          <p class="gc-workspace-privacy">${t.workspace.privacy}</p>
          <p class="gc-workspace-version">${t.workspace.version}: ${EVIDENCE_WORKSPACE_VERSION}</p>
        </header>

        <section class="gc-panel gc-context" aria-labelledby="gc-context-title">
          <h3 id="gc-context-title">${t.workspace.contextTitle}</h3>
          <div class="gc-context-grid">
            <label>${t.workspace.referenceLabel}
              <input type="text" value="${escapeHtml(workspace.context.referenceLabel)}" placeholder="${escapeHtml(t.workspace.referenceHint)}" data-context-field="referenceLabel" autocomplete="off">
            </label>
            <label>${t.workspace.versionLabel}
              <input type="text" value="${escapeHtml(workspace.context.assessedVersion)}" placeholder="${escapeHtml(t.workspace.versionHint)}" data-context-field="assessedVersion" autocomplete="off">
            </label>
            <label>${t.workspace.dateLabel}
              <input type="date" value="${escapeHtml(workspace.context.assessmentDate)}" data-context-field="assessmentDate">
            </label>
            <label>${t.workspace.contextLabel}
              <input type="text" value="${escapeHtml(workspace.context.contextLabel)}" placeholder="${escapeHtml(t.workspace.contextHint)}" data-context-field="contextLabel" autocomplete="off">
            </label>
          </div>
        </section>

        <section class="gc-panel gc-readiness" aria-labelledby="gc-readiness-title">
          <h3 id="gc-readiness-title">${t.workspace.summaryTitle}</h3>
          <div class="gc-readiness-grid">
            <div><strong>${evaluation.summary.mapped}</strong><span>${t.workspace.mapped}</span></div>
            <div><strong>${evaluation.summary.open}</strong><span>${t.workspace.openItems}</span></div>
            <div><strong>${evaluation.summary.excluded}</strong><span>${t.workspace.excluded}</span></div>
            <div><strong>${evaluation.summary.priorityOpen}</strong><span>${t.workspace.priority}</span></div>
          </div>
          <p class="gc-hint">${t.workspace.summaryBoundary}</p>
        </section>

        <section class="gc-evidence-map" aria-labelledby="gc-evidence-map-title">
          <h3 id="gc-evidence-map-title">${t.workspace.mapTitle}</h3>
          ${groups}
        </section>

        <details class="gc-panel gc-action-register" open>
          <summary>${t.workspace.actionsTitle}</summary>
          ${gaps.length ? `<p class="gc-context-warning">${gaps.length} ${t.workspace.contextOpen}</p>` : ""}
          ${openActions ? `<ol>${openActions}</ol>` : `<p>${t.workspace.noOpenActions}</p>`}
        </details>

        <section class="gc-boundary">
          <p>${t.workspace.exportBoundary}</p>
        </section>
        <p class="gc-live-status" aria-live="polite">${workspaceNotice}</p>
        <div class="gc-actions gc-workspace-actions">
          <button class="gc-button gc-button-primary" type="button" data-action="workspace-export">${t.workspace.export}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="workspace-print">${t.workspace.print}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="workspace-back">${t.workspace.back}</button>
          <button class="gc-button gc-button-danger" type="button" data-action="workspace-clear">${t.workspace.clear}</button>
        </div>
      </section>`;
  }

  function exportWorkspace() {
    const payload = buildEvidenceWorkspaceExport({
      language,
      context: workspace.context,
      screening: workspace.screening,
      rows: workspace.rows
    });
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const safeLabel = (workspace.context.referenceLabel || "evidence-readiness")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "evidence-readiness";
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeLabel}-${workspace.context.assessmentDate || "undated"}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    workspaceNotice = t.workspace.exported;
    const status = root.querySelector(".gc-live-status");
    if (status) status.textContent = workspaceNotice;
  }

  function render() {
    if (state.phase === "intro") renderIntro();
    if (state.phase === "routing") renderRouting();
    if (state.phase === "questions") renderQuestion();
    if (state.phase === "results") renderResults();
    if (state.phase === "workspace") renderWorkspace();
    root.querySelector("button, input, summary")?.focus({ preventScroll: true });
  }

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "start") {
      state.phase = "routing";
      render();
    }
    if (action === "open-workspace") startWorkspace(false);
    if (action === "open-workspace-blank") startWorkspace(true);
    if (action === "back") {
      if (state.phase === "routing" && state.routingIndex === 0) state.phase = "intro";
      else if (state.phase === "routing") state.routingIndex -= 1;
      else if (state.phase === "questions" && state.questionIndex === 0) {
        state.phase = "routing";
        state.routingIndex = 1;
      } else if (state.phase === "questions") state.questionIndex -= 1;
      render();
    }
    if (action === "print") window.print();
    if (action === "workspace-print") window.print();
    if (action === "workspace-export") exportWorkspace();
    if (action === "workspace-back") {
      state.phase = "results";
      render();
    }
    if (action === "workspace-clear" && window.confirm(t.workspace.clearConfirm)) {
      startWorkspace(false);
    }
    if (action === "restart") {
      state.phase = "intro";
      state.routingIndex = 0;
      state.questionIndex = 0;
      state.materialConsequence = null;
      state.lifecycle = null;
      state.answers = {};
      render();
    }
  });

  root.addEventListener("input", (event) => {
    const contextField = event.target.dataset.contextField;
    if (contextField) workspace.context[contextField] = event.target.value;
    const rowId = event.target.dataset.workspaceRow;
    const field = event.target.dataset.workspaceField;
    if (rowId && field === "recordLocator") {
      const row = workspace.rows.find((item) => item.questionId === rowId);
      if (row) row.recordLocator = event.target.value;
    }
  });

  root.addEventListener("change", (event) => {
    const contextField = event.target.dataset.contextField;
    if (contextField) {
      workspace.context[contextField] = event.target.value;
      return;
    }
    const rowId = event.target.dataset.workspaceRow;
    const field = event.target.dataset.workspaceField;
    if (!rowId || !field) return;
    const row = workspace.rows.find((item) => item.questionId === rowId);
    if (!row) return;
    if (field === "recordLocator") {
      row.recordLocator = event.target.value;
      workspaceNotice = "";
      renderWorkspace();
      root.querySelector(`[data-workspace-row="${rowId}"][data-workspace-field="recordLocator"]`)?.focus({ preventScroll: true });
      return;
    }
    row[field] = event.target.value;
    if (field === "evidenceStatus" && event.target.value !== "excluded" && row.freshness === "not-applicable") {
      row.freshness = "unknown";
      row.conflict = "unknown";
    }
    workspaceNotice = "";
    renderWorkspace();
    root.querySelector(`[data-workspace-row="${rowId}"][data-workspace-field="${field}"]`)?.focus({ preventScroll: true });
  });

  root.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = new FormData(event.target).get("answer");
    const error = event.target.querySelector(".gc-form-error");
    if (!selected) {
      error.hidden = false;
      return;
    }
    if (event.target.dataset.form === "routing") {
      if (state.routingIndex === 0) {
        state.materialConsequence = selected;
        state.routingIndex = 1;
      } else {
        state.lifecycle = selected;
        state.phase = "questions";
        state.questionIndex = 0;
      }
    } else {
      state.answers[QUESTIONS[state.questionIndex].id] = selected;
      if (state.questionIndex === QUESTIONS.length - 1) state.phase = "results";
      else state.questionIndex += 1;
    }
    render();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
}
