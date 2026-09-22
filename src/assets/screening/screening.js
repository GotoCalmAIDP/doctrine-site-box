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
  buildEvidenceReviewBrief,
  buildEvidenceWorkspaceExport,
  createEvidenceRows,
  evaluateEvidenceReadiness,
  parseEvidenceWorkspaceImport
} from "./evidence-workspace-core.js";
import {
  PUBLIC_AGGREGATE_ENDPOINT,
  buildPublicSubmission,
  normalizePublicAggregate
} from "./public-activity-core.js";
import {
  MARITIME_BRIDGE_VERSION,
  MARITIME_LOCI,
  MARITIME_QUESTIONS,
  MARITIME_RELATIONS,
  buildMaritimeBridgeExport,
  evaluateMaritimeBridge
} from "./maritime-core.js";

const root = document.querySelector("#gc-screening");

if (root) {
  const language = root.dataset.language === "ua" ? "ua" : "en";
  const t = {
    en: {
      alpha: "Public alpha · self-reported",
      lead: "A short boundary screening for automated, AI-enabled and consequence-bearing systems.",
      purpose: "It helps identify where the stated scope is incomplete or where a deeper evidence review may be useful. It does not determine compliance, safety, certification, conformance or permission to operate.",
      time: "21 selections · about 6–9 minutes",
      private: "Private by design",
      privateText: "The assessment and all answers stay in this browser. Only after a substantive run, and only with your explicit consent, a minimal summary can be sent. No answers, scores, free text, evidence locators or files are uploaded.",
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
      consequenceTitle: "What is the highest credible consequence in the stated scope?",
      consequenceHint: "Choose a public triage class, not a legal, regulatory, safety-integrity or DP equipment class. Use the highest credible path, including loss of control and delayed effects.",
      consequenceOptions: [
        ["informational", "0", "Informational", "No material consequence or independent reliance in the stated scope."],
        ["limited", "1", "Limited", "Localized and timely reversible impact."],
        ["enterprise", "2", "Enterprise", "Material organizational, legal, financial, workforce, customer or sustained operational impact."],
        ["high", "3", "High consequence", "Regulated, safety-significant, environmental, critical-service or public-interest impact."],
        ["critical", "4", "Critical execution", "Plausible loss of life, major pollution, critical-infrastructure harm, or vessel / industrial actuation."],
        ["unknown", "?", "Unresolved", "The consequence path is not yet bounded."]
      ],
      sectorTitle: "Which context lens is most useful for this screening?",
      sectorHint: "Context changes the evidence questions, but it does not determine consequence class, product tier or permission to operate.",
      sectorOptions: [
        ["general", "General / advisory"],
        ["enterprise", "Enterprise organization"],
        ["maritime", "Maritime / DP / remote operations"],
        ["critical-infrastructure", "Critical infrastructure / industrial OT"],
        ["unbounded", "Not yet bounded"]
      ],
      lifecycleTitle: "What is the closest current lifecycle context?",
      lifecycleHint: "Select the present context, not the intended future state.",
      lifecycleOptions: [
        ["concept", "Concept or early research"],
        ["design", "Design, procurement or pre-deployment"],
        ["pilot", "Pilot, test or limited operation"],
        ["live", "Live or production operation"]
      ],
      basisTitle: "What did you use to choose the answers?",
      basisHint: "This declaration changes how the result may be interpreted. It does not change the consequence class or hide gaps.",
      basisOptions: [
        ["records", "Identifiable records", "I answered from current records I could identify for this specific object and context."],
        ["mixed", "Records plus memory or assumptions", "Some answers were based on recollection, intention or an unverified assumption."],
        ["exploratory", "Exploratory / demonstration run", "I was learning the interface, trying answer patterns or selecting without a real evidence basis."]
      ],
      scaleHelp: "Use the same evidence scale for each statement.",
      resultLabel: "Screening result",
      outcome: {
        exploratory: ["Exploratory run — no substantive result", "You marked this run as a demonstration or answer-pattern test. The selected class and profile remain visible for learning, but they must not be interpreted as an assessment of a real system."],
        indeterminate: ["Insufficient basis for a bounded result", "Unknown, excluded or weakly defined scope elements constrain this screening. Clarify the assessment object and evidence basis before relying on the profile."],
        review: ["Deeper evidence review is advisable", "The answers indicate a material consequence path or one or more control gaps that merit scoped review. This is a screening signal, not a finding of non-compliance or unsafety."],
        "no-escalation": ["No escalation indicator identified in the stated scope", "The self-reported answers did not trigger this screening’s escalation rules. This is not verification, approval, certification, conformance or evidence that the system is safe."]
      },
      profile: "Self-reported boundary profile",
      profileHelp: "Percentages are calculated only from the selected answers, usually one or two prompts per axis. They are navigation aids, not measured performance, grades, benchmarks or proof.",
      composition: "Answer composition",
      compositionHelp: "This shows the mix behind the profile so a polished percentage cannot hide unknown, partial or negative answers.",
      responseBasis: "Answer basis",
      basisResult: {
        records: ["Declared basis: identifiable records", "The result is still self-reported and no evidence has been reviewed."],
        mixed: ["Limited basis: memory or assumptions used", "Treat the profile as a question map. Re-answer from identifiable current records before using it to plan a review."],
        exploratory: ["Exploratory mode", "The answers are shown for learning only and are not interpreted as a substantive screening result."]
      },
      unknown: "Unknown answers",
      excluded: "Out-of-scope answers",
      consequenceClass: "Public triage class",
      sector: "Context lens",
      lifecycle: "Lifecycle context",
      consequenceBoundary: "This class selects review depth only. It is not a legal classification, DP equipment class, safety rating, risk acceptance or authorization.",
      contexts: { concept: "Concept / research", design: "Design / pre-deployment", pilot: "Pilot / test", live: "Live / production" },
      sectors: { general: "General / advisory", enterprise: "Enterprise organization", maritime: "Maritime / DP / remote operations", "critical-infrastructure": "Critical infrastructure / industrial OT", unbounded: "Not bounded" },
      routeTitle: "Suggested evidence route",
      routeBoundary: "Consequence class increases expected evidence depth. Product tier, sector package and deployment profile remain separate choices.",
      reviewPath: {
        informational: ["Tier 0 · boundary screen", "Keep use advisory. Reclassify if independent reliance, durable commitment or actuation appears."],
        limited: ["Tier 1 · evidence readiness", "Map scope, limitations, current records, human authority and rollback resources."],
        enterprise: ["Tier 1 + scoped Tier 2 review", "Add obligation mapping, named authority, conflict checks and durable proof reconstruction."],
        high: ["Tier 2 · independent evidence review", "Add dated regulatory posture, external corroboration and change-triggered reassessment."],
        critical: ["Tier 3 · critical-systems / sector engagement", "Use sector specialists and formal safety, regulatory, class or flag processes. The public screen must not authorize operation."],
        unknown: ["Bound the consequence path first", "No reliable review depth can be selected while the highest credible consequence remains unresolved."]
      },
      sectorFocusTitle: "Context-specific evidence focus",
      sectorFocus: {
        general: ["scope and exclusions", "authority at the point of use", "evidence freshness"],
        enterprise: ["legal, financial and operational obligations", "organizational and authority boundaries", "durable review record"],
        maritime: ["functional allocation and control locus", "connectivity, fallback and operative capacity", "evidence standing with separate class / flag review"],
        "critical-infrastructure": ["commit and actuation boundary", "topology-wide stop and revocation", "safe degradation and post-consequence proof"],
        unbounded: ["define the operating context before relying on this route"]
      },
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
      activity: {
        eyebrow: "Public activity",
        title: "Consented screening aggregate",
        loading: "Loading the public aggregate…",
        belowThreshold: "The distribution will appear after 10 consented substantive completions within the rolling 30-day window.",
        unavailable: "The aggregate is temporarily unavailable. The screening itself remains local and usable.",
        completed: "Consented completions",
        tier2: "Scoped Tier 2+ routes",
        period: "Rolling window",
        days: "days",
        updated: "Updated",
        distribution: "Public triage-class distribution",
        boundary: "Self-reported, opt-in completions only. This is not a visitor count, unique-user count, benchmark, audit, proof of safety or doctrine conformance.",
        contributeTitle: "Contribute to the public aggregate",
        contributeText: "Send only the triage class, context lens, outcome and declared answer basis from this result. Your answers, scores, text, evidence locators and files are not sent.",
        consent: "I agree to contribute this minimal summary.",
        send: "Contribute summary",
        sending: "Sending…",
        sent: "Thank you. The minimal summary was added to the rolling aggregate.",
        duplicate: "This result was already received; it was not counted twice.",
        error: "The summary could not be sent. Nothing from the answers was uploaded; you can try again.",
        exploratory: "Exploratory runs are excluded from the public aggregate. Re-run with a real object and a declared records or mixed basis to contribute."
      },
      maritime: {
        open: "Continue to Maritime / DP bridge",
        eyebrow: "Tier 1.2 local sector alpha",
        title: "Maritime / DP applicability bridge",
        purpose: "Bound how an AI-enabled or automated function relates to vessel decisions, commands and preservation before selecting a deeper evidence route.",
        privacy: "Answers remain in this browser. Use neutral descriptions only; do not enter vessel identifiers, client data, positions, incidents, credentials, network details or raw operational evidence.",
        progress: "Maritime / DP bridge progress",
        relationTitle: "What is the function’s highest operational relationship to the vessel or DP context?",
        relationHint: "Choose what the function can actually influence now, not the intended future product description.",
        locusTitle: "Where can the relevant decision, command or actuation path exist?",
        locusHint: "Choose the widest credible current path. A hybrid path includes any meaningful onboard and remote dependency.",
        scaleHelp: "Answer from identifiable current records. Use Unknown where the boundary is not demonstrable.",
        axes: { mode: "Mode boundary", control: "Control locus", authority: "Authority reachability", commit: "Commit topology", transition: "Transition and handover", preservation: "Fallback and preservation", runtime: "Runtime verification", external: "External standing" },
        question: "Sector question",
        resultLabel: "Maritime / DP route",
        route: {
          exploratory: ["Training-only sector route", "The declared exploratory basis prevents a substantive sector result. The selected route remains visible only to demonstrate the decision logic."],
          "scope-first": ["Bound the maritime control path first", "The operational relationship, control locus or a critical sector boundary remains unresolved. Do not infer a review depth until these paths are explicit."],
          "tier1-sector": ["Tier 1.2 · Maritime / DP evidence map", "Use a bounded sector evidence map for mode, authority, commit paths, transition, preservation and external standing. Independent domain processes remain separate."],
          tier2: ["Scoped Tier 2 · maritime evidence review", "Use an appropriately independent review of authority reachability, commit topology, handover, bounded fallback, runtime claims and external class / flag standing."],
          tier3: ["Tier 3 · critical-systems and sector engagement", "Use qualified maritime, DP, safety, engineering, class, flag and regulatory processes. This public bridge must not authorize command, actuation, continuation or return to mission."]
        },
        composition: "Sector answer composition",
        compositionHint: "This is a navigation aid, not a DP capability score, safety rating or benchmark.",
        priorityGaps: "Priority sector gaps",
        unknown: "Unknown answers",
        excluded: "Outside-scope answers",
        recordTitle: "Sector routing record",
        relation: "Operational relationship",
        locus: "Control locus",
        version: "Bridge version",
        statusLabel: "Status",
        status: "Self-reported; evidence not reviewed",
        critical: "Priority",
        export: "Export Maritime / DP JSON",
        exported: "Maritime / DP routing JSON downloaded",
        back: "Back to main screening result",
        boundaryTitle: "Sector boundary",
        boundary: "This bridge is not a DP equipment class, FMEA, proving-trials programme, ASOG, CAMO, TAM, flag or class review, safety case, engineering approval or operational procedure. ACE remains a declaration of applicability loss, not a control command. The bridge selects evidence depth only and cannot authorize operation, continuation, restoration or return to mission."
      },
      workspace: {
        open: "Continue to evidence readiness workspace",
        openBlank: "Open blank evidence workspace",
        eyebrow: "Tier 1.1 local alpha · structured working record",
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
        briefEyebrow: "Local JSON analysis",
        briefTitle: "Compact review brief",
        briefPurpose: "A local triage of this snapshot: what it can support, the main readiness gaps and the next bounded actions.",
        briefStatusLabel: "Analysis readiness",
        briefStatus: {
          "training-only": ["Training-only snapshot", "The declared exploratory basis prevents a substantive assessment. The mapping below can be used to learn the workflow, not to characterize a real system."],
          "context-required": ["Assessment context required", "Complete the object, version, date and context before treating the mapping as a bounded working record."],
          "priority-open": ["Priority evidence work is open", "The snapshot has a bounded context, but one or more critical doctrine questions still lack a reviewable mapping."],
          "mapping-open": ["Evidence mapping is open", "No critical mapping gap remains, but the working record is not yet complete."],
          "mapping-complete": ["Mapping complete — review still required", "The local mapping fields are complete. This is not verification; an appropriately independent review remains necessary."]
        },
        briefObject: "Object",
        briefVersion: "Version / configuration",
        briefDate: "Assessment date",
        briefBasis: "Declared answer basis",
        notProvided: "Not provided",
        nextActionsTitle: "Recommended next actions",
        nextAction: {
          "rerun-substantive": "Repeat the screening for one real object using identifiable records or a declared mixed basis.",
          "complete-context": "Complete the neutral object, version, date and assessment-context fields.",
          "resolve-priority-records": "Start with the priority open records; classify each source, add a controlled locator, and check currentness and conflicts.",
          "complete-open-records": "Complete the remaining open mappings or explicitly justify their scope boundaries.",
          "independent-review": "Route the bounded snapshot and controlled record locators to an appropriately independent reviewer."
        },
        priorityPreviewTitle: "First priority questions",
        noPriorityPreview: "No priority mapping items are open.",
        briefBoundary: "This brief analyzes only the structure and declared state of the local snapshot. It does not read, upload or verify the underlying evidence.",
        printBrief: "Print compact brief",
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
        actionView: "Action view",
        actionFilters: { all: "All unresolved", priority: "Priority only", scope: "Scope boundaries" },
        noFilteredActions: "No actions match this view.",
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
        import: "Import and analyze JSON snapshot",
        importHint: "The selected snapshot is validated and analyzed only in this browser tab. Nothing is uploaded.",
        importSuccess: "JSON snapshot restored and analyzed locally",
        importFailed: "Snapshot could not be restored",
        importTooLarge: "Snapshot is larger than the 512 KB local limit",
        replaceConfirm: "Replace the current Tier 1 workspace with the selected snapshot?",
        example: "Load neutral example",
        exampleConfirm: "Replace the current workspace with a clearly fictional training example?",
        exampleLoaded: "Fictional training example loaded",
        print: "Print full mapping packet",
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
      time: "21 вибір · приблизно 6–9 хвилин",
      private: "Приватність за задумом",
      privateText: "Оцінювання та всі відповіді залишаються в цьому браузері. Лише після змістовного проходження і тільки за вашою явною згодою можна надіслати мінімальне резюме. Відповіді, бали, вільний текст, локатори свідчень і файли не завантажуються.",
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
      consequenceTitle: "Який найвищий достовірно можливий наслідок у заявленому обсязі?",
      consequenceHint: "Оберіть публічний triage-клас, а не юридичний, регуляторний, safety-integrity чи DP equipment class. Врахуйте найтяжчий достовірний шлях, включно з втратою керування та відкладеними наслідками.",
      consequenceOptions: [
        ["informational", "0", "Інформаційний", "У заявленому обсязі немає суттєвого наслідку або незалежного покладання на результат."],
        ["limited", "1", "Обмежений", "Локальний вплив, який можна вчасно й повністю повернути."],
        ["enterprise", "2", "Enterprise", "Суттєвий організаційний, правовий, фінансовий, кадровий, клієнтський або тривалий операційний вплив."],
        ["high", "3", "Високі наслідки", "Регульований, безпеково значущий, екологічний, суспільний вплив або вплив на критичну послугу."],
        ["critical", "4", "Критичне виконання", "Можливі втрата життя, значне забруднення, шкода критичній інфраструктурі або керування судном / промисловим об’єктом."],
        ["unknown", "?", "Не визначено", "Шлях наслідків ще не обмежено."]
      ],
      sectorTitle: "Яка контекстна лінза найкорисніша для цього скринінгу?",
      sectorHint: "Контекст змінює питання до свідчень, але не визначає клас наслідків, рівень продукту чи дозвіл на експлуатацію.",
      sectorOptions: [
        ["general", "Загальний / консультативний"],
        ["enterprise", "Enterprise-організація"],
        ["maritime", "Maritime / DP / віддалені операції"],
        ["critical-infrastructure", "Критична інфраструктура / промислова OT"],
        ["unbounded", "Ще не визначено"]
      ],
      lifecycleTitle: "Який поточний контекст життєвого циклу є найближчим?",
      lifecycleHint: "Оберіть теперішній контекст, а не бажаний майбутній стан.",
      lifecycleOptions: [
        ["concept", "Концепція або раннє дослідження"],
        ["design", "Проєктування, закупівля або підготовка до розгортання"],
        ["pilot", "Пілот, тест або обмежена експлуатація"],
        ["live", "Діюча або виробнича експлуатація"]
      ],
      basisTitle: "На чому ґрунтувався вибір відповідей?",
      basisHint: "Ця декларація змінює спосіб тлумачення результату. Вона не змінює клас наслідків і не приховує прогалини.",
      basisOptions: [
        ["records", "Записи, які можна визначити", "Я відповідав на підставі актуальних записів, які можу визначити для цього об’єкта й контексту."],
        ["mixed", "Записи разом із пам’яттю чи припущеннями", "Частина відповідей ґрунтувалася на спогадах, намірах або неперевірених припущеннях."],
        ["exploratory", "Ознайомлювальний / демонстраційний прохід", "Я вивчав інтерфейс, перевіряв комбінації або обирав відповіді без реальної доказової підстави."]
      ],
      scaleHelp: "Для кожного твердження використовуйте однакову шкалу свідчень.",
      resultLabel: "Результат скринінгу",
      outcome: {
        exploratory: ["Ознайомлювальний прохід — без змістовного результату", "Ви позначили цей прохід як демонстрацію або перевірку комбінацій відповідей. Обраний клас і профіль залишаються видимими для навчання, але їх не можна тлумачити як оцінювання реальної системи."],
        indeterminate: ["Недостатня підстава для обмеженого результату", "Невідомі, виключені або слабо визначені елементи обсягу обмежують цей скринінг. Уточніть об’єкт оцінювання та підставу свідчень, перш ніж покладатися на профіль."],
        review: ["Доцільний глибший розгляд свідчень", "Відповіді вказують на шлях суттєвих наслідків або одну чи кілька прогалин контролю, що потребують обмеженого розгляду. Це сигнал скринінгу, а не висновок про невідповідність чи небезпечність."],
        "no-escalation": ["У заявленому обсязі сигнал ескалації не виявлено", "Самозаявлені відповіді не активували правила ескалації цього скринінгу. Це не є перевіркою, схваленням, сертифікацією, конформністю або доказом безпеки системи."]
      },
      profile: "Самозаявлений профіль меж",
      profileHelp: "Відсотки обчислено лише з обраних відповідей — зазвичай з одного або двох тверджень на вісь. Це навігаційні орієнтири, а не виміряна результативність, оцінки, еталони чи докази.",
      composition: "Склад відповідей",
      compositionHelp: "Показує суміш відповідей за профілем, щоб привабливий відсоток не приховував невідомі, часткові або негативні відповіді.",
      responseBasis: "Підстава відповідей",
      basisResult: {
        records: ["Заявлена підстава: записи, які можна визначити", "Результат однаково є самооцінкою; свідчення не перевірялися."],
        mixed: ["Обмежена підстава: використано пам’ять або припущення", "Сприймайте профіль як карту питань. Дайте відповіді повторно на підставі актуальних записів, перш ніж планувати перегляд."],
        exploratory: ["Ознайомлювальний режим", "Відповіді показано лише для навчання; вони не тлумачаться як змістовний результат скринінгу."]
      },
      unknown: "Відповіді «Невідомо»",
      excluded: "Відповіді «Поза обсягом»",
      consequenceClass: "Публічний triage-клас",
      sector: "Контекстна лінза",
      lifecycle: "Контекст життєвого циклу",
      consequenceBoundary: "Цей клас лише обирає глибину перегляду. Це не юридична класифікація, DP equipment class, рейтинг безпеки, прийняття ризику чи авторизація.",
      contexts: { concept: "Концепція / дослідження", design: "Проєктування / до розгортання", pilot: "Пілот / тест", live: "Діюча / виробнича" },
      sectors: { general: "Загальний / консультативний", enterprise: "Enterprise-організація", maritime: "Maritime / DP / віддалені операції", "critical-infrastructure": "Критична інфраструктура / промислова OT", unbounded: "Не визначено" },
      routeTitle: "Рекомендований доказовий маршрут",
      routeBoundary: "Вищий клас наслідків підвищує очікувану глибину свідчень. Рівень продукту, галузевий пакет і профіль розгортання залишаються окремими виборами.",
      reviewPath: {
        informational: ["Tier 0 · скринінг меж", "Зберігайте використання консультативним. Перекласифікуйте, якщо з’являться незалежне покладання, тривале зобов’язання або виконання."],
        limited: ["Tier 1 · готовність свідчень", "Картуйте обсяг, обмеження, актуальні записи, людські повноваження та ресурси відкату."],
        enterprise: ["Tier 1 + обмежений перегляд Tier 2", "Додайте картування зобов’язань, названого носія повноважень, перевірку конфліктів і довговічне відтворення доказів."],
        high: ["Tier 2 · незалежний перегляд свідчень", "Додайте датовану регуляторну позицію, зовнішнє підтвердження та повторне оцінювання після змін."],
        critical: ["Tier 3 · critical-systems / sector engagement", "Залучайте галузевих фахівців і формальні safety, regulatory, class або flag процеси. Публічний скринінг не може дозволяти експлуатацію."],
        unknown: ["Спочатку обмежте шлях наслідків", "Надійну глибину перегляду не можна обрати, доки найвищий достовірний наслідок не визначено."]
      },
      sectorFocusTitle: "Контекстний фокус свідчень",
      sectorFocus: {
        general: ["обсяг і виключення", "повноваження в точці використання", "актуальність свідчень"],
        enterprise: ["правові, фінансові й операційні зобов’язання", "організаційні межі та межі повноважень", "довговічний запис перегляду"],
        maritime: ["функціональний розподіл і locus керування", "зв’язність, fallback і operative capacity", "чинність свідчень з окремим class / flag review"],
        "critical-infrastructure": ["межа commit і actuation", "зупинка та відкликання в усій топології", "безпечна деградація і доказ після наслідку"],
        unbounded: ["визначте операційний контекст, перш ніж покладатися на цей маршрут"]
      },
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
      activity: {
        eyebrow: "Публічна активність",
        title: "Агрегат добровільно переданих скринінгів",
        loading: "Завантаження публічного агрегату…",
        belowThreshold: "Розподіл з’явиться після 10 добровільно переданих змістовних завершень у рухомому 30-денному вікні.",
        unavailable: "Агрегат тимчасово недоступний. Сам скринінг залишається локальним і придатним до використання.",
        completed: "Добровільні завершення",
        tier2: "Маршрути зі scoped Tier 2+",
        period: "Рухоме вікно",
        days: "днів",
        updated: "Оновлено",
        distribution: "Розподіл за публічним triage-класом",
        boundary: "Лише добровільні результати самооцінки. Це не кількість відвідувачів чи унікальних користувачів, не benchmark, аудит, доказ безпеки або відповідності доктрині.",
        contributeTitle: "Додати результат до публічного агрегату",
        contributeText: "Надіслати лише triage-клас, контекстну лінзу, результат і задекларовану підставу відповідей. Відповіді, бали, текст, локатори свідчень і файли не надсилаються.",
        consent: "Я погоджуюся передати це мінімальне резюме.",
        send: "Додати резюме",
        sending: "Надсилання…",
        sent: "Дякуємо. Мінімальне резюме додано до рухомого агрегату.",
        duplicate: "Цей результат уже отримано; вдруге його не зараховано.",
        error: "Не вдалося надіслати резюме. Жодну відповідь не завантажено; можна повторити спробу.",
        exploratory: "Демонстраційні проходження не входять до публічного агрегату. Щоб долучитися, пройдіть скринінг для реального об’єкта з підставою records або mixed."
      },
      maritime: {
        open: "Перейти до Maritime / DP bridge",
        eyebrow: "Локальна галузева альфа Tier 1.2",
        title: "Maritime / DP міст застосовності",
        purpose: "Обмежте зв’язок ШІ-підсиленої або автоматизованої функції із судновими рішеннями, командами та збереженням, перш ніж обирати глибший доказовий маршрут.",
        privacy: "Відповіді залишаються в цьому браузері. Використовуйте лише нейтральні описи; не вводьте ідентифікатори судна, дані клієнта, позиції, інциденти, облікові дані, деталі мережі або сирі операційні свідчення.",
        progress: "Прогрес Maritime / DP bridge",
        relationTitle: "Який найвищий операційний зв’язок функції із судном або DP-контекстом?",
        relationHint: "Оберіть те, на що функція реально може впливати зараз, а не бажаний майбутній опис продукту.",
        locusTitle: "Де може існувати відповідний шлях рішення, команди або виконання?",
        locusHint: "Оберіть найширший достовірний поточний шлях. Гібридний шлях включає будь-яку суттєву бортову й віддалену залежність.",
        scaleHelp: "Відповідайте за актуальними записами, які можна визначити. Оберіть «Невідомо», якщо межу неможливо підтвердити.",
        axes: { mode: "Межа режиму", control: "Locus керування", authority: "Досяжність повноважень", commit: "Commit-топологія", transition: "Перехід і handover", preservation: "Fallback і збереження", runtime: "Runtime-перевірка", external: "Зовнішня чинність" },
        question: "Галузеве питання",
        resultLabel: "Maritime / DP маршрут",
        route: {
          exploratory: ["Навчальний галузевий маршрут", "Заявлена ознайомлювальна підстава не дозволяє змістовного галузевого результату. Обраний маршрут показано лише для демонстрації логіки рішення."],
          "scope-first": ["Спочатку обмежте морський шлях керування", "Операційний зв’язок, locus керування або критична галузева межа залишаються невизначеними. Не визначайте глибину перегляду, доки ці шляхи не стануть явними."],
          "tier1-sector": ["Tier 1.2 · Maritime / DP карта свідчень", "Використовуйте обмежену галузеву карту для режиму, повноважень, commit-шляхів, переходу, збереження та зовнішньої чинності. Незалежні галузеві процеси залишаються окремими."],
          tier2: ["Обмежений Tier 2 · морський перегляд свідчень", "Потрібен належно незалежний перегляд досяжності повноважень, commit-топології, handover, bounded fallback, runtime-тверджень і зовнішньої class / flag чинності."],
          tier3: ["Tier 3 · critical systems і галузеве залучення", "Застосовуйте кваліфіковані maritime, DP, safety, engineering, class, flag і regulatory процеси. Цей публічний міст не може дозволяти команду, виконання, продовження або повернення до місії."]
        },
        composition: "Склад галузевих відповідей",
        compositionHint: "Це навігаційний орієнтир, а не оцінка DP-спроможності, рейтинг безпеки чи benchmark.",
        priorityGaps: "Пріоритетні галузеві прогалини",
        unknown: "Відповіді «Невідомо»",
        excluded: "Відповіді «Поза обсягом»",
        recordTitle: "Запис галузевої маршрутизації",
        relation: "Операційний зв’язок",
        locus: "Locus керування",
        version: "Версія мосту",
        statusLabel: "Статус",
        status: "Самооцінка; свідчення не перевірялися",
        critical: "Пріоритет",
        export: "Експортувати Maritime / DP JSON",
        exported: "Maritime / DP routing JSON завантажено",
        back: "Назад до основного результату скринінгу",
        boundaryTitle: "Галузева межа",
        boundary: "Цей міст не є DP equipment class, FMEA, proving-trials programme, ASOG, CAMO, TAM, flag або class review, safety case, інженерним схваленням чи операційною процедурою. ACE залишається декларацією втрати застосовності, а не командою керування. Міст лише обирає глибину свідчень і не може дозволяти експлуатацію, продовження, відновлення або повернення до місії."
      },
      workspace: {
        open: "Перейти до робочого простору готовності свідчень",
        openBlank: "Відкрити порожній робочий простір свідчень",
        eyebrow: "Локальна альфа Tier 1.1 · структурований робочий запис",
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
        briefEyebrow: "Локальний аналіз JSON",
        briefTitle: "Стислий огляд",
        briefPurpose: "Локальний triage цього знімка: що він може підтримувати, головні прогалини готовності та наступні обмежені дії.",
        briefStatusLabel: "Готовність аналізу",
        briefStatus: {
          "training-only": ["Навчальний знімок", "Заявлена ознайомлювальна підстава не дозволяє змістовного оцінювання. Картування нижче придатне для вивчення процесу, а не для характеристики реальної системи."],
          "context-required": ["Потрібен контекст оцінювання", "Заповніть об’єкт, версію, дату й контекст, перш ніж сприймати картування як обмежений робочий запис."],
          "priority-open": ["Відкрита пріоритетна робота зі свідченнями", "Контекст знімка обмежено, але одне або кілька критичних питань доктрини ще не мають придатного для перегляду картування."],
          "mapping-open": ["Картування свідчень відкрите", "Критичних прогалин картування не залишилося, але робочий запис іще не завершено."],
          "mapping-complete": ["Картування завершено — перегляд усе ще потрібен", "Локальні поля картування заповнено. Це не перевірка; однаково потрібен належно незалежний перегляд."]
        },
        briefObject: "Об’єкт",
        briefVersion: "Версія / конфігурація",
        briefDate: "Дата оцінювання",
        briefBasis: "Заявлена підстава відповідей",
        notProvided: "Не вказано",
        nextActionsTitle: "Рекомендовані наступні дії",
        nextAction: {
          "rerun-substantive": "Повторіть скринінг для одного реального об’єкта на підставі записів, які можна визначити, або заявленої змішаної підстави.",
          "complete-context": "Заповніть нейтральне позначення об’єкта, версію, дату й контекст оцінювання.",
          "resolve-priority-records": "Почніть із пріоритетних відкритих записів: класифікуйте кожне джерело, додайте контрольований локатор і перевірте актуальність та конфлікти.",
          "complete-open-records": "Завершіть решту відкритих картувань або явно обґрунтуйте їхні межі обсягу.",
          "independent-review": "Передайте обмежений знімок і контрольовані локатори записів належно незалежному рецензенту."
        },
        priorityPreviewTitle: "Перші пріоритетні питання",
        noPriorityPreview: "Відкритих пріоритетних елементів картування немає.",
        briefBoundary: "Цей огляд аналізує лише структуру й заявлений стан локального знімка. Він не читає, не завантажує й не перевіряє самі свідчення.",
        printBrief: "Друкувати стислий огляд",
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
        actionView: "Подання дій",
        actionFilters: { all: "Усі невирішені", priority: "Лише пріоритетні", scope: "Межі обсягу" },
        noFilteredActions: "Для цього подання дій немає.",
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
        import: "Імпортувати й проаналізувати знімок JSON",
        importHint: "Обраний знімок перевіряється й аналізується лише в цій вкладці браузера. Нічого не завантажується на сервер.",
        importSuccess: "Знімок JSON локально відновлено й проаналізовано",
        importFailed: "Не вдалося відновити знімок",
        importTooLarge: "Розмір знімка перевищує локальне обмеження 512 КБ",
        replaceConfirm: "Замінити поточний робочий простір Tier 1 обраним знімком?",
        example: "Завантажити нейтральний приклад",
        exampleConfirm: "Замінити поточний робочий простір явно вигаданим навчальним прикладом?",
        exampleLoaded: "Вигаданий навчальний приклад завантажено",
        print: "Друкувати повний пакет картування",
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
    consequenceClass: null,
    sectorContext: null,
    lifecycle: null,
    responseBasis: null,
    answers: {},
    maritimeRoutingIndex: 0,
    maritimeQuestionIndex: 0,
    maritimeRelation: null,
    maritimeLocus: null,
    maritimeAnswers: {}
  };
  let workspaceNotice = "";
  let maritimeNotice = "";
  let workspaceActionFilter = "all";
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
  let publicAggregate = { status: "idle", data: null };
  let contributionConsent = false;
  let contributionStatus = "idle";
  let contributionToken = null;
  const total = QUESTIONS.length + 4;
  const questionById = Object.fromEntries(QUESTIONS.map((question) => [question.id, question]));
  const maritimeTotal = MARITIME_QUESTIONS.length + 2;

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

  const maritimeProgress = (current) => `
    <div class="gc-progress-block">
      <div class="gc-progress-copy"><span>${t.maritime.progress}</span><span>${current} ${t.of} ${maritimeTotal}</span></div>
      <div class="gc-progress" role="progressbar" aria-label="${t.maritime.progress}" aria-valuemin="0" aria-valuemax="${maritimeTotal}" aria-valuenow="${current}">
        <span style="width:${Math.round((current / maritimeTotal) * 100)}%"></span>
      </div>
    </div>`;

  const options = (items, selected) => items.map(([value, label]) => `
    <label class="gc-option">
      <input type="radio" name="answer" value="${value}"${checked(selected, value)}>
      <span>${label}</span>
    </label>`).join("");

  const consequenceOptions = (items, selected) => items.map(([value, code, label, description]) => `
    <label class="gc-option gc-consequence-option">
      <input type="radio" name="answer" value="${value}"${checked(selected, value)}>
      <span class="gc-class-code">${code}</span>
      <span><strong>${label}</strong><small>${description}</small></span>
    </label>`).join("");

  const describedOptions = (items, selected) => items.map(([value, label, description]) => `
    <label class="gc-option gc-described-option">
      <input type="radio" name="answer" value="${value}"${checked(selected, value)}>
      <span><strong>${label}</strong><small>${description}</small></span>
    </label>`).join("");

  function renderPublicAggregate() {
    const activity = t.activity;
    let body;
    if (publicAggregate.status === "loading" || publicAggregate.status === "idle") {
      body = `<p class="gc-activity-state" aria-live="polite">${activity.loading}</p>`;
    } else if (publicAggregate.status === "error") {
      body = `<p class="gc-activity-state" aria-live="polite">${activity.unavailable}</p>`;
    } else if (!publicAggregate.data.reportable) {
      body = `<p class="gc-activity-state" aria-live="polite">${activity.belowThreshold}</p>`;
    } else {
      const aggregate = publicAggregate.data;
      const updated = new Intl.DateTimeFormat(language === "ua" ? "uk-UA" : "en-GB", {
        dateStyle: "medium",
        timeZone: "UTC"
      }).format(aggregate.generatedAt);
      const classLabels = Object.fromEntries(t.consequenceOptions.map(([key, code, label]) => [key, `${code} · ${label}`]));
      body = `
        <div class="gc-activity-metrics">
          <div><strong>${aggregate.total}</strong><span>${activity.completed}</span></div>
          <div><strong>${aggregate.scopedTier2PlusPercent}%</strong><span>${activity.tier2}</span></div>
          <div><strong>${aggregate.windowDays}</strong><span>${activity.days} · ${activity.period}</span></div>
        </div>
        <h4>${activity.distribution}</h4>
        <div class="gc-activity-bars" role="list">
          ${aggregate.classes.map((item) => `
            <div class="gc-activity-bar" role="listitem">
              <div><span>${classLabels[item.key]}</span><strong>${item.percent}%</strong></div>
              <div aria-hidden="true"><span class="gc-class-${item.key}" style="width:${item.percent}%"></span></div>
            </div>`).join("")}
        </div>
        <p class="gc-activity-updated">${activity.updated}: ${updated}</p>`;
    }
    return `
      <section class="gc-panel gc-public-activity" aria-labelledby="gc-public-activity-title">
        <p class="gc-eyebrow">${activity.eyebrow}</p>
        <h3 id="gc-public-activity-title">${activity.title}</h3>
        ${body}
        <p class="gc-hint">${activity.boundary}</p>
      </section>`;
  }

  async function loadPublicAggregate(force = false) {
    if (!force && publicAggregate.status !== "idle") return;
    publicAggregate = { status: "loading", data: null };
    try {
      const response = await fetch(`${PUBLIC_AGGREGATE_ENDPOINT}/aggregate`, {
        headers: { accept: "application/json" }
      });
      if (!response.ok) throw new Error(`Aggregate request failed: ${response.status}`);
      publicAggregate = { status: "ready", data: normalizePublicAggregate(await response.json()) };
    } catch {
      publicAggregate = { status: "error", data: null };
    }
    if (state.phase === "intro") renderIntro();
  }

  function createContributionToken() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll("-", "");
    const bytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  function renderContribution(result) {
    const activity = t.activity;
    if (result.responseBasis === "exploratory") {
      return `
        <section class="gc-panel gc-contribution gc-contribution-ineligible" aria-labelledby="gc-contribution-title">
          <p class="gc-eyebrow">${activity.eyebrow}</p>
          <h3 id="gc-contribution-title">${activity.contributeTitle}</h3>
          <p>${activity.exploratory}</p>
        </section>`;
    }
    const completed = contributionStatus === "sent" || contributionStatus === "duplicate";
    const message = contributionStatus === "sent" ? activity.sent
      : contributionStatus === "duplicate" ? activity.duplicate
        : contributionStatus === "error" ? activity.error : "";
    return `
      <section class="gc-panel gc-contribution" aria-labelledby="gc-contribution-title">
        <p class="gc-eyebrow">${activity.eyebrow}</p>
        <h3 id="gc-contribution-title">${activity.contributeTitle}</h3>
        <p>${activity.contributeText}</p>
        ${completed ? "" : `
          <label class="gc-consent">
            <input type="checkbox" data-contribution-consent${contributionConsent ? " checked" : ""}${contributionStatus === "sending" ? " disabled" : ""}>
            <span>${activity.consent}</span>
          </label>
          <button class="gc-button gc-button-primary" type="button" data-action="contribute"${!contributionConsent || contributionStatus === "sending" ? " disabled" : ""}>
            ${contributionStatus === "sending" ? activity.sending : activity.send}
          </button>`}
        <p class="gc-live-status" aria-live="polite">${message}</p>
        <p class="gc-hint">${activity.boundary}</p>
      </section>`;
  }

  async function submitContribution() {
    if (!contributionConsent || contributionStatus === "sending") return;
    const result = evaluateScreening(state);
    if (result.responseBasis === "exploratory") return;
    contributionToken ||= createContributionToken();
    contributionStatus = "sending";
    renderResults();
    try {
      const response = await fetch(`${PUBLIC_AGGREGATE_ENDPOINT}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPublicSubmission(result, contributionToken))
      });
      const reply = await response.json();
      if (!response.ok || (!reply.accepted && !reply.duplicate)) throw new Error("Submission rejected");
      contributionStatus = reply.duplicate ? "duplicate" : "sent";
      publicAggregate = { status: "idle", data: null };
      void loadPublicAggregate();
    } catch {
      contributionStatus = "error";
    }
    renderResults();
  }

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
          <button class="gc-button gc-button-quiet" type="button" data-action="workspace-import">${t.workspace.import}</button>
          <input type="file" accept="application/json,.json" data-workspace-import hidden>
        </div>
        <p class="gc-live-status" aria-live="polite">${workspaceNotice}</p>
      </section>
      ${renderPublicAggregate()}`;
    void loadPublicAggregate();
  }

  function renderRouting() {
    const route = [
      { title: t.consequenceTitle, hint: t.consequenceHint, choiceList: t.consequenceOptions, selected: state.consequenceClass, rich: true },
      { title: t.sectorTitle, hint: t.sectorHint, choiceList: t.sectorOptions, selected: state.sectorContext },
      { title: t.lifecycleTitle, hint: t.lifecycleHint, choiceList: t.lifecycleOptions, selected: state.lifecycle }
    ][state.routingIndex];
    root.innerHTML = `
      ${progress(state.routingIndex + 1)}
      <form class="gc-panel gc-question" data-form="routing">
        <fieldset>
          <legend>${route.title}</legend>
          <p class="gc-hint">${route.hint}</p>
          <div class="gc-options${route.rich ? " gc-consequence-options" : ""}">${route.rich ? consequenceOptions(route.choiceList, route.selected) : options(route.choiceList, route.selected)}</div>
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
    const current = state.questionIndex + 4;
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
          <button class="gc-button gc-button-primary" type="submit">${t.next}</button>
        </div>
      </form>`;
  }

  function renderBasis() {
    root.innerHTML = `
      ${progress(total)}
      <form class="gc-panel gc-question" data-form="basis">
        <fieldset>
          <legend>${t.basisTitle}</legend>
          <p class="gc-hint">${t.basisHint}</p>
          <div class="gc-options">${describedOptions(t.basisOptions, state.responseBasis)}</div>
          <p class="gc-form-error" role="alert" hidden>${t.answerRequired}</p>
        </fieldset>
        <div class="gc-actions">
          <button class="gc-button gc-button-quiet" type="button" data-action="back">${t.back}</button>
          <button class="gc-button gc-button-primary" type="submit">${t.seeResult}</button>
        </div>
      </form>`;
  }

  function renderMaritimeRouting() {
    const isRelation = state.maritimeRoutingIndex === 0;
    const title = isRelation ? t.maritime.relationTitle : t.maritime.locusTitle;
    const hint = isRelation ? t.maritime.relationHint : t.maritime.locusHint;
    const items = (isRelation ? MARITIME_RELATIONS : MARITIME_LOCI).map((item) => [item.value, item[language]]);
    const selected = isRelation ? state.maritimeRelation : state.maritimeLocus;
    root.innerHTML = `
      ${maritimeProgress(state.maritimeRoutingIndex + 1)}
      <form class="gc-panel gc-question gc-maritime-question" data-form="maritime-routing">
        <fieldset>
          <p class="gc-eyebrow">${t.maritime.eyebrow}</p>
          <legend>${title}</legend>
          <p class="gc-hint">${hint}</p>
          <div class="gc-options">${options(items, selected)}</div>
          <p class="gc-form-error" role="alert" hidden>${t.answerRequired}</p>
        </fieldset>
        <div class="gc-actions">
          <button class="gc-button gc-button-quiet" type="button" data-action="back">${t.back}</button>
          <button class="gc-button gc-button-primary" type="submit">${t.next}</button>
        </div>
      </form>`;
  }

  function renderMaritimeQuestion() {
    const question = MARITIME_QUESTIONS[state.maritimeQuestionIndex];
    const scaleItems = SCALE.map((item) => [item.value, item[language]]);
    root.innerHTML = `
      ${maritimeProgress(state.maritimeQuestionIndex + 3)}
      <form class="gc-panel gc-question gc-maritime-question" data-form="maritime-question">
        <fieldset>
          <p class="gc-axis">${t.maritime.axes[question.axis]}</p>
          <legend><span class="gc-question-number">${t.maritime.question} ${state.maritimeQuestionIndex + 1}</span>${question[language]}</legend>
          <p class="gc-hint">${t.maritime.scaleHelp}</p>
          <div class="gc-options gc-scale">${options(scaleItems, state.maritimeAnswers[question.id])}</div>
          <p class="gc-form-error" role="alert" hidden>${t.answerRequired}</p>
        </fieldset>
        <div class="gc-actions">
          <button class="gc-button gc-button-quiet" type="button" data-action="back">${t.back}</button>
          <button class="gc-button gc-button-primary" type="submit">${state.maritimeQuestionIndex === MARITIME_QUESTIONS.length - 1 ? t.seeResult : t.next}</button>
        </div>
      </form>`;
  }

  function currentMaritimeResult() {
    return evaluateMaritimeBridge({
      consequenceClass: state.consequenceClass,
      responseBasis: state.responseBasis,
      relation: state.maritimeRelation,
      locus: state.maritimeLocus,
      answers: state.maritimeAnswers
    });
  }

  function renderMaritimeResults() {
    const result = currentMaritimeResult();
    const [routeTitle, routeDescription] = t.maritime.route[result.route];
    const relation = MARITIME_RELATIONS.find((item) => item.value === result.relation);
    const locus = MARITIME_LOCI.find((item) => item.value === result.locus);
    const selectedConsequence = t.consequenceOptions.find(([value]) => value === result.consequenceClass) || t.consequenceOptions.at(-1);
    root.innerHTML = `
      <section class="gc-results gc-maritime-results" aria-labelledby="gc-maritime-result-title">
        <div class="gc-panel gc-outcome gc-maritime-outcome gc-maritime-route-${result.route}">
          <p class="gc-eyebrow">${t.maritime.resultLabel}</p>
          <h2 id="gc-maritime-result-title">${routeTitle}</h2>
          <p class="gc-lead">${routeDescription}</p>
        </div>
        <section class="gc-panel gc-maritime-summary" aria-labelledby="gc-maritime-summary-title">
          <div class="gc-section-heading">
            <div>
              <p class="gc-eyebrow">${t.maritime.eyebrow}</p>
              <h3 id="gc-maritime-summary-title">${t.maritime.title}</h3>
            </div>
            <span class="gc-selected-class">${selectedConsequence[1]} · ${selectedConsequence[2]}</span>
          </div>
          <p>${t.maritime.purpose}</p>
          <div class="gc-maritime-metrics">
            <div><strong>${result.priorityGapCount}</strong><span>${t.maritime.priorityGaps}</span></div>
            <div><strong>${result.unknownCount}</strong><span>${t.maritime.unknown}</span></div>
            <div><strong>${result.outOfScopeCount}</strong><span>${t.maritime.excluded}</span></div>
          </div>
          <div class="gc-composition">
            <h4>${t.maritime.composition}</h4>
            <p class="gc-hint">${t.maritime.compositionHint}</p>
            <div class="gc-composition-bar" role="img" aria-label="${t.maritime.composition}">
              ${result.answerDistribution.filter((item) => item.count > 0).map((item) => {
                const scale = SCALE.find((entry) => entry.value === item.value);
                return `<span class="gc-answer-${item.value}" style="width:${item.percent}%" title="${scale[language]}: ${item.count}"></span>`;
              }).join("")}
            </div>
            <ul class="gc-composition-legend">
              ${result.answerDistribution.map((item) => {
                const scale = SCALE.find((entry) => entry.value === item.value);
                return `<li><span class="gc-answer-dot gc-answer-${item.value}"></span><span>${scale[language]}</span><strong>${item.count} · ${item.percent}%</strong></li>`;
              }).join("")}
            </ul>
          </div>
          <ol class="gc-maritime-answer-list">
            ${MARITIME_QUESTIONS.map((question) => {
              const scale = SCALE.find((item) => item.value === result.answers[question.id]);
              return `<li>
                <div><span>${t.maritime.axes[question.axis]}</span>${question.critical ? `<strong>${t.maritime.critical}</strong>` : ""}</div>
                <p>${question[language]}</p>
                <span class="gc-maritime-answer"><i class="gc-answer-dot gc-answer-${result.answers[question.id]}"></i>${scale[language]}</span>
              </li>`;
            }).join("")}
          </ol>
        </section>
        <aside class="gc-panel gc-record" aria-labelledby="gc-maritime-record-title">
          <h3 id="gc-maritime-record-title">${t.maritime.recordTitle}</h3>
          <dl>
            <div><dt>${t.maritime.relation}</dt><dd>${relation[language]}</dd></div>
            <div><dt>${t.maritime.locus}</dt><dd>${locus[language]}</dd></div>
            <div><dt>${t.consequenceClass}</dt><dd>${selectedConsequence[1]} · ${selectedConsequence[2]}</dd></div>
            <div><dt>${t.responseBasis}</dt><dd>${t.basisOptions.find(([value]) => value === result.responseBasis)[1]}</dd></div>
            <div><dt>${t.maritime.version}</dt><dd>${MARITIME_BRIDGE_VERSION}</dd></div>
            <div><dt>${t.maritime.statusLabel}</dt><dd>${t.maritime.status}</dd></div>
          </dl>
        </aside>
        <section class="gc-boundary" aria-labelledby="gc-maritime-boundary-title">
          <h3 id="gc-maritime-boundary-title">${t.maritime.boundaryTitle}</h3>
          <p>${t.maritime.boundary}</p>
        </section>
        <p class="gc-live-status gc-maritime-status" aria-live="polite">${maritimeNotice}</p>
        <div class="gc-actions gc-result-actions">
          <button class="gc-button gc-button-primary" type="button" data-action="maritime-export">${t.maritime.export}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="open-workspace">${t.workspace.open}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="maritime-back-results">${t.maritime.back}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="print">${t.print}</button>
        </div>
      </section>`;
  }

  function renderResults() {
    const result = evaluateScreening(state);
    const [title, description] = t.outcome[result.outcome];
    const selectedConsequence = t.consequenceOptions.find(([value]) => value === result.consequenceClass) || t.consequenceOptions.at(-1);
    const consequenceLabel = `${selectedConsequence[1]} · ${selectedConsequence[2]}`;
    const [routeTitle, routeDescription] = t.reviewPath[result.consequenceClass];
    const sectorFocus = t.sectorFocus[result.sectorContext] || t.sectorFocus.unbounded;
    const [basisTitle, basisDescription] = t.basisResult[result.responseBasis];
    const scopePath = language === "en" ? "en/scope-and-limitations" : "ua/scope-and-limitations";
    const evidencePath = language === "en" ? "en/evidence" : "ua/evidence";
    root.innerHTML = `
      <section class="gc-results" aria-labelledby="gc-result-title">
        <div class="gc-panel gc-outcome gc-outcome-${result.outcome}">
          <p class="gc-eyebrow">${t.resultLabel}</p>
          <h2 id="gc-result-title">${title}</h2>
          <p class="gc-lead">${description}</p>
        </div>
        <section class="gc-panel gc-basis-note gc-basis-${result.responseBasis}" aria-labelledby="gc-basis-result-title">
          <p class="gc-eyebrow">${t.responseBasis}</p>
          <h3 id="gc-basis-result-title">${basisTitle}</h3>
          <p>${basisDescription}</p>
        </section>
        <section class="gc-panel gc-consequence-map" aria-labelledby="gc-consequence-map-title">
          <div class="gc-section-heading">
            <div>
              <p class="gc-eyebrow">${t.consequenceClass}</p>
              <h3 id="gc-consequence-map-title">${consequenceLabel}</h3>
            </div>
            <span class="gc-selected-class">${t.sectors[result.sectorContext]}</span>
          </div>
          <div class="gc-consequence-ladder" role="list">
            ${t.consequenceOptions.map(([value, code, label]) => `<div class="gc-consequence-step${value === result.consequenceClass ? " is-selected" : ""}${value === "unknown" ? " is-unresolved" : ""}" role="listitem"><span>${code}</span><strong>${label}</strong></div>`).join("")}
          </div>
          <p class="gc-hint">${t.consequenceBoundary}</p>
        </section>
        <section class="gc-route-grid" aria-label="${t.routeTitle}">
          <div class="gc-panel gc-route-card">
            <p class="gc-eyebrow">${t.routeTitle}</p>
            <h3>${routeTitle}</h3>
            <p>${routeDescription}</p>
            <p class="gc-route-boundary">${t.routeBoundary}</p>
          </div>
          <div class="gc-panel gc-route-card">
            <p class="gc-eyebrow">${t.sectorFocusTitle}</p>
            <h3>${t.sectors[result.sectorContext]}</h3>
            <ul>${sectorFocus.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
        </section>
        <div class="gc-result-grid">
          <section class="gc-panel" aria-labelledby="gc-profile-title">
            <h3 id="gc-profile-title">${t.profile}</h3>
            <p class="gc-hint">${t.profileHelp}</p>
            <div class="gc-composition">
              <h4>${t.composition}</h4>
              <p class="gc-hint">${t.compositionHelp}</p>
              <div class="gc-composition-bar" role="img" aria-label="${t.composition}">
                ${result.answerDistribution.filter((item) => item.count > 0).map((item) => {
                  const scale = SCALE.find((entry) => entry.value === item.value);
                  return `<span class="gc-answer-${item.value}" style="width:${item.percent}%" title="${scale[language]}: ${item.count}"></span>`;
                }).join("")}
              </div>
              <ul class="gc-composition-legend">
                ${result.answerDistribution.map((item) => {
                  const scale = SCALE.find((entry) => entry.value === item.value);
                  return `<li><span class="gc-answer-dot gc-answer-${item.value}"></span><span>${scale[language]}</span><strong>${item.count} · ${item.percent}%</strong></li>`;
                }).join("")}
              </ul>
            </div>
            <div class="gc-axis-list" role="list">
              ${result.axes.map((axis) => {
                const score = axis.score === null ? t.percentUnavailable : `${axis.score}%`;
                const width = axis.score === null ? 0 : axis.score;
                return `<div class="gc-axis-row" role="listitem">
                  <div><span>${axis[language]}</span><span class="gc-axis-score"><strong>${score}</strong><small>n=${axis.promptCount}</small></span></div>
                  <div class="gc-axis-meter" aria-hidden="true"><span style="width:${width}%"></span></div>
                </div>`;
              }).join("")}
            </div>
          </section>
          <aside class="gc-panel gc-record" aria-labelledby="gc-record-title">
            <h3 id="gc-record-title">${t.method}</h3>
            <dl>
              <div><dt>${t.consequenceClass}</dt><dd>${consequenceLabel}</dd></div>
              <div><dt>${t.sector}</dt><dd>${t.sectors[result.sectorContext]}</dd></div>
              <div><dt>${t.lifecycle}</dt><dd>${t.contexts[result.lifecycle]}</dd></div>
              <div><dt>${t.responseBasis}</dt><dd>${t.basisOptions.find(([value]) => value === result.responseBasis)[1]}</dd></div>
              <div><dt>${t.unknown}</dt><dd>${result.unknownCount}</dd></div>
              <div><dt>${t.excluded}</dt><dd>${result.outOfScopeCount}</dd></div>
              <div><dt>Version</dt><dd>${ASSESSMENT_VERSION}</dd></div>
              <div><dt>Date</dt><dd>${ASSESSMENT_DATE}</dd></div>
              <div><dt>Status</dt><dd>${t.selfReported}</dd></div>
            </dl>
          </aside>
        </div>
        ${renderContribution(result)}
        <section class="gc-boundary" aria-labelledby="gc-boundary-title">
          <h3 id="gc-boundary-title">${t.disclaimerTitle}</h3>
          <p>${t.disclaimer}</p>
          <p><strong>${t.urgent}</strong></p>
        </section>
        <div class="gc-actions gc-result-actions">
          ${result.sectorContext === "maritime" ? `<button class="gc-button gc-button-primary" type="button" data-action="start-maritime">${t.maritime.open}</button>` : ""}
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
      state.consequenceClass = "unknown";
      state.sectorContext = "general";
      state.lifecycle = "concept";
      state.responseBasis = "mixed";
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
    workspaceActionFilter = "all";
    state.phase = "workspace";
    render();
  }

  function loadNeutralExample() {
    state.consequenceClass = "unknown";
    state.sectorContext = "general";
    state.lifecycle = "concept";
    state.responseBasis = "exploratory";
    state.answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, "unknown"]));
    const rows = createEvidenceRows(state.answers);
    Object.assign(rows[0], {
      evidenceStatus: "documented",
      evidenceClass: "documentary",
      recordLocator: "REGISTER/DEMO/OBJECT",
      freshness: "current",
      conflict: "no"
    });
    Object.assign(rows[1], {
      evidenceStatus: "partial",
      evidenceClass: "documentary",
      recordLocator: "REGISTER/DEMO/SCOPE",
      freshness: "current",
      conflict: "no"
    });
    Object.assign(rows[2], {
      evidenceStatus: "documented",
      evidenceClass: "observational",
      recordLocator: "REGISTER/DEMO/BOUNDARY",
      freshness: "stale",
      conflict: "no"
    });
    workspace = {
      context: {
        referenceLabel: "DEMO-SYSTEM",
        assessedVersion: "demo-v1",
        assessmentDate: localDate(),
        contextLabel: language === "ua" ? "навчальний приклад — вигаданий" : "training example — fictional"
      },
      screening: evaluateScreening(state),
      rows
    };
    workspaceActionFilter = "all";
    workspaceNotice = t.workspace.exampleLoaded;
    state.phase = "workspace";
    render();
  }

  function setWorkspaceNotice(message) {
    workspaceNotice = message;
    const status = root.querySelector(".gc-live-status");
    if (status) status.textContent = workspaceNotice;
  }

  async function importWorkspaceFile(file) {
    if (!file) return;
    if (file.size > 512 * 1024) {
      setWorkspaceNotice(t.workspace.importTooLarge);
      return;
    }
    try {
      const imported = parseEvidenceWorkspaceImport(JSON.parse(await file.text()));
      if (state.phase === "workspace" && !window.confirm(t.workspace.replaceConfirm)) return;
      workspace = {
        context: imported.context,
        screening: imported.screening,
        rows: imported.rows
      };
      state.consequenceClass = imported.screening.consequenceClass;
      state.sectorContext = imported.screening.sectorContext;
      state.lifecycle = imported.screening.lifecycle;
      state.responseBasis = imported.screening.responseBasis;
      state.answers = Object.fromEntries(imported.rows.map((row) => [row.questionId, row.sourceAnswer]));
      workspaceActionFilter = "all";
      workspaceNotice = t.workspace.importSuccess;
      state.phase = "workspace";
      render();
    } catch (error) {
      setWorkspaceNotice(`${t.workspace.importFailed}: ${error.message}`);
    }
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
            <input id="${fieldId}-locator" type="text" maxlength="320" value="${escapeHtml(row.recordLocator)}" placeholder="${escapeHtml(t.workspace.locatorHint)}" data-workspace-row="${row.questionId}" data-workspace-field="recordLocator" autocomplete="off"${excluded ? " disabled" : ""}>
          </label>
        </div>
        ${actions ? `<ul class="gc-row-actions">${actions}</ul>` : ""}
      </article>`;
  }

  function renderWorkspace() {
    const evaluation = evaluateEvidenceReadiness(workspace.rows);
    const brief = buildEvidenceReviewBrief(workspace);
    const gaps = contextGaps();
    const briefStatus = t.workspace.briefStatus[brief.status];
    const consequence = t.consequenceOptions.find(([value]) => value === workspace.screening.consequenceClass);
    const basis = t.basisOptions.find(([value]) => value === workspace.screening.responseBasis);
    const valueOrMissing = (value) => escapeHtml(String(value || "").trim() || t.workspace.notProvided);
    const briefPriorityItems = brief.priorityItems.map((item) => {
      const question = questionById[item.questionId];
      return `<li><strong>${question[language]}</strong><span>${item.actions.slice(0, 2).map((action) => t.workspace.action[action]).join("; ")}</span></li>`;
    }).join("");
    const briefNextActions = brief.nextActions
      .map((action) => `<li>${t.workspace.nextAction[action]}</li>`)
      .join("");
    const filteredActions = evaluation.openActions.filter((item) => {
      if (workspaceActionFilter === "priority") return item.priority;
      if (workspaceActionFilter === "scope") return item.state === "excluded";
      return true;
    });
    const openActions = filteredActions
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

        <section class="gc-panel gc-workspace-tools" aria-labelledby="gc-workspace-tools-title">
          <h3 id="gc-workspace-tools-title">${t.workspace.import}</h3>
          <p class="gc-hint">${t.workspace.importHint}</p>
          <div class="gc-actions">
            <button class="gc-button gc-button-primary" type="button" data-action="workspace-import">${t.workspace.import}</button>
            <button class="gc-button gc-button-quiet" type="button" data-action="workspace-example">${t.workspace.example}</button>
            <input type="file" accept="application/json,.json" data-workspace-import hidden>
          </div>
        </section>

        <section class="gc-panel gc-review-brief" aria-labelledby="gc-review-brief-title">
          <div class="gc-review-brief-heading">
            <div>
              <p class="gc-eyebrow">${t.workspace.briefEyebrow}</p>
              <h3 id="gc-review-brief-title">${t.workspace.briefTitle}</h3>
              <p>${t.workspace.briefPurpose}</p>
            </div>
            <div class="gc-brief-status gc-brief-status-${brief.status}">
              <span>${t.workspace.briefStatusLabel}</span>
              <strong>${briefStatus[0]}</strong>
              <p>${briefStatus[1]}</p>
            </div>
          </div>
          <dl class="gc-brief-context">
            <div><dt>${t.workspace.briefObject}</dt><dd>${valueOrMissing(workspace.context.referenceLabel)}</dd></div>
            <div><dt>${t.workspace.briefVersion}</dt><dd>${valueOrMissing(workspace.context.assessedVersion)}</dd></div>
            <div><dt>${t.workspace.briefDate}</dt><dd>${valueOrMissing(workspace.context.assessmentDate)}</dd></div>
            <div><dt>${t.consequenceClass}</dt><dd>${consequence ? `${consequence[1]} · ${consequence[2]}` : t.workspace.notProvided}</dd></div>
            <div><dt>${t.workspace.briefBasis}</dt><dd>${basis ? basis[1] : t.workspace.notProvided}</dd></div>
          </dl>
          <div class="gc-brief-metrics" aria-label="${t.workspace.summaryTitle}">
            <div><strong>${brief.summary.mapped}</strong><span>${t.workspace.mapped}</span></div>
            <div><strong>${brief.summary.open}</strong><span>${t.workspace.openItems}</span></div>
            <div><strong>${brief.summary.excluded}</strong><span>${t.workspace.excluded}</span></div>
            <div><strong>${brief.summary.priorityOpen}</strong><span>${t.workspace.priority}</span></div>
          </div>
          <div class="gc-brief-columns">
            <div>
              <h4>${t.workspace.nextActionsTitle}</h4>
              <ol>${briefNextActions}</ol>
            </div>
            <div>
              <h4>${t.workspace.priorityPreviewTitle}</h4>
              ${briefPriorityItems ? `<ol class="gc-brief-priorities">${briefPriorityItems}</ol>` : `<p>${t.workspace.noPriorityPreview}</p>`}
            </div>
          </div>
          <p class="gc-hint">${t.workspace.briefBoundary}</p>
          <div class="gc-actions gc-brief-actions">
            <button class="gc-button gc-button-primary" type="button" data-action="workspace-print-brief">${t.workspace.printBrief}</button>
          </div>
        </section>

        <section class="gc-panel gc-context" aria-labelledby="gc-context-title">
          <h3 id="gc-context-title">${t.workspace.contextTitle}</h3>
          <div class="gc-context-grid">
            <label>${t.workspace.referenceLabel}
              <input type="text" maxlength="160" value="${escapeHtml(workspace.context.referenceLabel)}" placeholder="${escapeHtml(t.workspace.referenceHint)}" data-context-field="referenceLabel" autocomplete="off">
            </label>
            <label>${t.workspace.versionLabel}
              <input type="text" maxlength="160" value="${escapeHtml(workspace.context.assessedVersion)}" placeholder="${escapeHtml(t.workspace.versionHint)}" data-context-field="assessedVersion" autocomplete="off">
            </label>
            <label>${t.workspace.dateLabel}
              <input type="date" value="${escapeHtml(workspace.context.assessmentDate)}" data-context-field="assessmentDate">
            </label>
            <label>${t.workspace.contextLabel}
              <input type="text" maxlength="160" value="${escapeHtml(workspace.context.contextLabel)}" placeholder="${escapeHtml(t.workspace.contextHint)}" data-context-field="contextLabel" autocomplete="off">
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
          <summary>${t.workspace.actionsTitle} · ${filteredActions.length}/${evaluation.openActions.length}</summary>
          <label class="gc-action-filter">${t.workspace.actionView}
            <select data-workspace-action-filter>
              ${Object.entries(t.workspace.actionFilters).map(([value, label]) => `<option value="${value}"${workspaceActionFilter === value ? " selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          ${gaps.length ? `<p class="gc-context-warning">${gaps.length} ${t.workspace.contextOpen}</p>` : ""}
          ${openActions ? `<ol>${openActions}</ol>` : `<p>${evaluation.openActions.length ? t.workspace.noFilteredActions : t.workspace.noOpenActions}</p>`}
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

  function exportMaritimeBridge() {
    const payload = buildMaritimeBridgeExport({
      language,
      lifecycle: state.lifecycle,
      result: currentMaritimeResult()
    });
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `maritime-dp-bridge-${localDate()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    maritimeNotice = t.maritime.exported;
    const status = root.querySelector(".gc-maritime-status");
    if (status) status.textContent = maritimeNotice;
  }

  function render() {
    if (state.phase === "intro") renderIntro();
    if (state.phase === "routing") renderRouting();
    if (state.phase === "questions") renderQuestion();
    if (state.phase === "basis") renderBasis();
    if (state.phase === "results") renderResults();
    if (state.phase === "maritime-routing") renderMaritimeRouting();
    if (state.phase === "maritime-questions") renderMaritimeQuestion();
    if (state.phase === "maritime-results") renderMaritimeResults();
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
    if (action === "contribute") void submitContribution();
    if (action === "start-maritime" && state.sectorContext === "maritime") {
      state.phase = "maritime-routing";
      state.maritimeRoutingIndex = 0;
      maritimeNotice = "";
      render();
    }
    if (action === "open-workspace") startWorkspace(false);
    if (action === "open-workspace-blank") startWorkspace(true);
    if (action === "back") {
      if (state.phase === "routing" && state.routingIndex === 0) state.phase = "intro";
      else if (state.phase === "routing") state.routingIndex -= 1;
      else if (state.phase === "questions" && state.questionIndex === 0) {
        state.phase = "routing";
        state.routingIndex = 2;
      } else if (state.phase === "questions") state.questionIndex -= 1;
      else if (state.phase === "basis") {
        state.phase = "questions";
        state.questionIndex = QUESTIONS.length - 1;
      } else if (state.phase === "maritime-routing" && state.maritimeRoutingIndex === 0) {
        state.phase = "results";
      } else if (state.phase === "maritime-routing") {
        state.maritimeRoutingIndex -= 1;
      } else if (state.phase === "maritime-questions" && state.maritimeQuestionIndex === 0) {
        state.phase = "maritime-routing";
        state.maritimeRoutingIndex = 1;
      } else if (state.phase === "maritime-questions") {
        state.maritimeQuestionIndex -= 1;
      }
      render();
    }
    if (action === "print") window.print();
    if (action === "maritime-export") exportMaritimeBridge();
    if (action === "maritime-back-results") {
      state.phase = "results";
      render();
    }
    if (action === "workspace-print-brief") {
      document.body.classList.add("gc-print-brief");
      const clearPrintMode = () => document.body.classList.remove("gc-print-brief");
      window.addEventListener("afterprint", clearPrintMode, { once: true });
      window.print();
      window.setTimeout(clearPrintMode, 1000);
    }
    if (action === "workspace-print") {
      workspaceActionFilter = "all";
      renderWorkspace();
      window.print();
    }
    if (action === "workspace-export") exportWorkspace();
    if (action === "workspace-import") root.querySelector("[data-workspace-import]")?.click();
    if (action === "workspace-example" && window.confirm(t.workspace.exampleConfirm)) loadNeutralExample();
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
      state.consequenceClass = null;
      state.sectorContext = null;
      state.lifecycle = null;
      state.responseBasis = null;
      state.answers = {};
      state.maritimeRoutingIndex = 0;
      state.maritimeQuestionIndex = 0;
      state.maritimeRelation = null;
      state.maritimeLocus = null;
      state.maritimeAnswers = {};
      workspaceNotice = "";
      maritimeNotice = "";
      contributionConsent = false;
      contributionStatus = "idle";
      contributionToken = null;
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

  root.addEventListener("focusout", (event) => {
    const rowId = event.target.dataset.workspaceRow;
    const field = event.target.dataset.workspaceField;
    if (!rowId || field !== "recordLocator") return;
    const row = workspace.rows.find((item) => item.questionId === rowId);
    if (!row) return;
    const nextId = event.relatedTarget?.id || "";
    row.recordLocator = event.target.value;
    workspaceNotice = "";
    renderWorkspace();
    if (nextId) document.getElementById(nextId)?.focus({ preventScroll: true });
  });

  root.addEventListener("change", async (event) => {
    if (event.target.matches("[data-contribution-consent]")) {
      contributionConsent = event.target.checked;
      const button = root.querySelector('[data-action="contribute"]');
      if (button) button.disabled = !contributionConsent;
      return;
    }
    if (event.target.matches("[data-workspace-import]")) {
      const [file] = event.target.files || [];
      event.target.value = "";
      await importWorkspaceFile(file);
      return;
    }
    if (event.target.matches("[data-workspace-action-filter]")) {
      workspaceActionFilter = event.target.value;
      renderWorkspace();
      root.querySelector("[data-workspace-action-filter]")?.focus({ preventScroll: true });
      return;
    }
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
    if (field === "recordLocator") return;
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
        state.consequenceClass = selected;
        state.routingIndex = 1;
      } else if (state.routingIndex === 1) {
        state.sectorContext = selected;
        state.routingIndex = 2;
      } else {
        state.lifecycle = selected;
        state.phase = "questions";
        state.questionIndex = 0;
      }
    } else if (event.target.dataset.form === "basis") {
      state.responseBasis = selected;
      state.phase = "results";
      contributionConsent = false;
      contributionStatus = "idle";
      contributionToken = null;
    } else if (event.target.dataset.form === "maritime-routing") {
      if (state.maritimeRoutingIndex === 0) {
        state.maritimeRelation = selected;
        state.maritimeRoutingIndex = 1;
      } else {
        state.maritimeLocus = selected;
        state.maritimeQuestionIndex = 0;
        state.phase = "maritime-questions";
      }
    } else if (event.target.dataset.form === "maritime-question") {
      state.maritimeAnswers[MARITIME_QUESTIONS[state.maritimeQuestionIndex].id] = selected;
      if (state.maritimeQuestionIndex === MARITIME_QUESTIONS.length - 1) state.phase = "maritime-results";
      else state.maritimeQuestionIndex += 1;
    } else {
      state.answers[QUESTIONS[state.questionIndex].id] = selected;
      if (state.questionIndex === QUESTIONS.length - 1) state.phase = "basis";
      else state.questionIndex += 1;
    }
    render();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
}
