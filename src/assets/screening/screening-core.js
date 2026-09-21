export const ASSESSMENT_VERSION = "screening-core 0.2.0-alpha";
export const ASSESSMENT_DATE = "2026-09-21";

export const CONSEQUENCE_CLASSES = ["informational", "limited", "enterprise", "high", "critical", "unknown"];
export const SECTOR_CONTEXTS = ["general", "enterprise", "maritime", "critical-infrastructure", "unbounded"];

export const AXES = [
  { id: "scope", en: "Scope and applicability basis", ua: "Обсяг і підстава застосовності" },
  { id: "explanation", en: "Explanatory boundary visibility", ua: "Видимість пояснювальної межі" },
  { id: "authority", en: "Human authority effectiveness", ua: "Дієвість людських повноважень" },
  { id: "commit", en: "Commit-time admissibility", ua: "Допустимість у момент фіксації" },
  { id: "evidence", en: "Evidence and proof discipline", ua: "Дисципліна свідчень і доказів" },
  { id: "consequence", en: "Consequence and reversibility posture", ua: "Позиція щодо наслідків і зворотності" },
  { id: "topology", en: "Topology-wide enforcement", ua: "Застосування в усій топології" },
  { id: "drift", en: "Change and trajectory integrity", ua: "Цілісність змін і траєкторії" },
  { id: "runtime", en: "Runtime and post-boundary integrity", ua: "Цілісність виконання та стану після межі" }
];

export const QUESTIONS = [
  {
    id: "scope_object",
    axis: "scope",
    critical: true,
    en: "Is the assessed object explicit, including its context, version and assessment date?",
    ua: "Чи визначено об’єкт оцінювання разом із контекстом, версією та датою оцінювання?"
  },
  {
    id: "applicability_basis",
    axis: "scope",
    critical: true,
    en: "Are the claimed use, applicability basis, exclusions and dependencies recorded?",
    ua: "Чи зафіксовано заявлене використання, підставу застосовності, виключення та залежності?"
  },
  {
    id: "explanation_units",
    axis: "explanation",
    en: "Can an affected reviewer identify which assumptions support each material claim?",
    ua: "Чи може зацікавлений рецензент визначити, які припущення підтримують кожне суттєве твердження?"
  },
  {
    id: "boundary_disclosure",
    axis: "explanation",
    en: "Are limitations, validity conditions and important uncertainties visible at the point of use?",
    ua: "Чи видимі обмеження, умови чинності та важливі невизначеності в точці використання?"
  },
  {
    id: "authority_identity",
    axis: "authority",
    en: "Is the current human or institutional authority for the consequential action identifiable?",
    ua: "Чи можна визначити актуального людського або інституційного носія повноважень щодо дії з наслідками?"
  },
  {
    id: "authority_effectiveness",
    axis: "authority",
    critical: true,
    en: "Can that authority intervene in time, with the information and means needed to change the outcome?",
    ua: "Чи може цей носій повноважень вчасно втрутитися, маючи інформацію та засоби для зміни результату?"
  },
  {
    id: "commit_preconditions",
    axis: "commit",
    critical: true,
    en: "Does execution require a current admissibility check immediately before the consequential commitment?",
    ua: "Чи вимагає виконання актуальної перевірки допустимості безпосередньо перед фіксацією дії з наслідками?"
  },
  {
    id: "revocation",
    axis: "commit",
    critical: true,
    en: "Does invalid, expired or revoked authority or evidence reliably block or stop commitment?",
    ua: "Чи блокує або зупиняє фіксацію недійсне, прострочене чи відкликане повноваження або свідчення?"
  },
  {
    id: "evidence_freshness",
    axis: "evidence",
    critical: true,
    en: "Are decision records current, attributable, time-bounded and linked to the assessed object?",
    ua: "Чи є записи рішення актуальними, атрибутованими, обмеженими в часі та пов’язаними з об’єктом оцінювання?"
  },
  {
    id: "proof_reconstruction",
    axis: "evidence",
    critical: true,
    en: "Can an independent reviewer reconstruct why execution was permitted from durable records?",
    ua: "Чи може незалежний рецензент відтворити з довговічних записів, чому виконання було дозволене?"
  },
  {
    id: "consequence_classification",
    axis: "consequence",
    en: "Are consequence type, affected parties and reversibility classified before action?",
    ua: "Чи класифікуються тип наслідків, зачеплені сторони та зворотність до виконання дії?"
  },
  {
    id: "resource_posture",
    axis: "consequence",
    en: "Are rollback, safe degradation or preservation resources reserved and checked when relevant?",
    ua: "Чи зарезервовано та перевірено ресурси відкату, безпечної деградації або збереження, коли це доречно?"
  },
  {
    id: "topology_enforcement",
    axis: "topology",
    critical: true,
    en: "Do controls apply across replicas, delegated agents, integrations and alternate execution paths?",
    ua: "Чи діють контролі для копій, делегованих агентів, інтеграцій та альтернативних шляхів виконання?"
  },
  {
    id: "systemic_stop",
    axis: "topology",
    critical: true,
    en: "Does stop or revocation propagate across the relevant topology without leaving active bypasses?",
    ua: "Чи поширюється зупинка або відкликання на відповідну топологію без активних шляхів обходу?"
  },
  {
    id: "change_reassessment",
    axis: "drift",
    en: "Do material changes in models, data, policy, environment or dependencies trigger reassessment?",
    ua: "Чи запускають суттєві зміни моделей, даних, політик, середовища або залежностей повторне оцінювання?"
  },
  {
    id: "standing_continuity",
    axis: "drift",
    critical: true,
    en: "Is current authority and evidence standing re-established after updates, handoffs or interruptions?",
    ua: "Чи відновлюється актуальна чинність повноважень і свідчень після оновлень, передач або переривань?"
  },
  {
    id: "runtime_integrity",
    axis: "runtime",
    critical: true,
    en: "During operation, are key predicates re-verified and are consequential events preserved for review?",
    ua: "Чи перевіряються ключові передумови під час роботи та чи зберігаються події з наслідками для перегляду?"
  }
];

export const SCALE = [
  { value: "3", score: 3, en: "Documented, tested, current record", ua: "Задокументовано, перевірено, запис актуальний" },
  { value: "2", score: 2, en: "Documented, not recently checked", ua: "Задокументовано, але давно не перевірялося" },
  { value: "1", score: 1, en: "Partial or informal", ua: "Частково або неформально" },
  { value: "0", score: 0, en: "No", ua: "Ні" },
  { value: "unknown", score: 0, en: "Unknown", ua: "Невідомо" },
  { value: "out", score: null, en: "Out of stated scope", ua: "Поза заявленим обсягом" }
];

const PRIORITY_IDS = new Set([
  "authority_effectiveness",
  "commit_preconditions",
  "revocation",
  "evidence_freshness",
  "proof_reconstruction",
  "topology_enforcement",
  "systemic_stop"
]);

const LIVE_PRIORITY_IDS = new Set(["standing_continuity", "runtime_integrity"]);

function normalizedAnswer(value) {
  const match = SCALE.find((item) => item.value === String(value));
  return match || null;
}

export function normalizeConsequenceClass(value) {
  const normalized = String(value ?? "unknown");
  if (normalized === "yes") return "enterprise";
  if (normalized === "no") return "informational";
  return CONSEQUENCE_CLASSES.includes(normalized) ? normalized : "unknown";
}

export function evaluateScreening({ consequenceClass, materialConsequence, sectorContext = "general", lifecycle, answers }) {
  const resolvedConsequenceClass = normalizeConsequenceClass(consequenceClass ?? materialConsequence);
  const resolvedSectorContext = SECTOR_CONTEXTS.includes(sectorContext) ? sectorContext : "unbounded";
  const axisState = Object.fromEntries(AXES.map((axis) => [axis.id, { earned: 0, possible: 0, unknown: 0, out: 0 }]));
  const priorityFlags = [];
  let unknownCount = 0;
  let outOfScopeCount = 0;

  for (const question of QUESTIONS) {
    const answer = normalizedAnswer(answers[question.id]);
    if (!answer) {
      throw new Error(`Missing or invalid answer for ${question.id}`);
    }
    const axis = axisState[question.axis];
    if (answer.value === "unknown") {
      unknownCount += 1;
      axis.unknown += 1;
    }
    if (answer.value === "out") {
      outOfScopeCount += 1;
      axis.out += 1;
    } else {
      axis.earned += answer.score;
      axis.possible += 3;
    }

    const lowOrUnknown = answer.value === "unknown" || answer.value === "0";
    const isPriority = PRIORITY_IDS.has(question.id) ||
      (["pilot", "live"].includes(lifecycle) && LIVE_PRIORITY_IDS.has(question.id));
    if (lowOrUnknown && isPriority) {
      priorityFlags.push(question.id);
    }
  }

  const axes = AXES.map((axis) => {
    const state = axisState[axis.id];
    return {
      ...axis,
      score: state.possible ? Math.round((state.earned / state.possible) * 100) : null,
      unknown: state.unknown,
      out: state.out
    };
  });

  const firstScope = [answers.scope_object, answers.applicability_basis];
  const weakScope = firstScope.some((value) => ["0", "1", "unknown", "out"].includes(String(value)));
  const emptyAxis = axes.some((axis) => axis.score === null);
  const materiallyLowAxis = axes.some((axis) => axis.score !== null && axis.score < 50);

  let outcome;
  if (resolvedConsequenceClass === "unknown" || resolvedSectorContext === "unbounded" || weakScope || unknownCount >= 4 || outOfScopeCount > 0 || emptyAxis) {
    outcome = "indeterminate";
  } else if (["enterprise", "high", "critical"].includes(resolvedConsequenceClass) || priorityFlags.length > 0 || materiallyLowAxis) {
    outcome = "review";
  } else {
    outcome = "no-escalation";
  }

  return {
    outcome,
    axes,
    priorityFlags,
    unknownCount,
    outOfScopeCount,
    consequenceClass: resolvedConsequenceClass,
    sectorContext: resolvedSectorContext,
    lifecycle,
    version: ASSESSMENT_VERSION,
    assessmentDate: ASSESSMENT_DATE
  };
}
