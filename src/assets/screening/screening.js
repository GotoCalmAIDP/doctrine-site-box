import {
  ASSESSMENT_DATE,
  ASSESSMENT_VERSION,
  AXES,
  QUESTIONS,
  SCALE,
  evaluateScreening
} from "./screening-core.js";

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
      percentUnavailable: "Not bounded"
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
      percentUnavailable: "Не визначено"
    }
  }[language];

  const state = {
    phase: "intro",
    routingIndex: 0,
    questionIndex: 0,
    materialConsequence: null,
    lifecycle: null,
    answers: {}
  };
  const total = QUESTIONS.length + 2;

  const checked = (actual, expected) => actual === expected ? " checked" : "";
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
        <button class="gc-button gc-button-primary" type="button" data-action="start">${t.start}</button>
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
          <button class="gc-button gc-button-primary" type="button" data-action="print">${t.print}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="restart">${t.restart}</button>
          <a class="gc-text-link" href="/doctrine-site-box/${scopePath}/">${t.readScope}</a>
          <a class="gc-text-link" href="/doctrine-site-box/${evidencePath}/">${t.readEvidence}</a>
        </div>
      </section>`;
  }

  function render() {
    if (state.phase === "intro") renderIntro();
    if (state.phase === "routing") renderRouting();
    if (state.phase === "questions") renderQuestion();
    if (state.phase === "results") renderResults();
    root.querySelector("button, input")?.focus({ preventScroll: true });
  }

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "start") {
      state.phase = "routing";
      render();
    }
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
