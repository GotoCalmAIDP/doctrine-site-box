import { CONSEQUENCE_CLASSES, RESPONSE_BASES } from "./screening-core.js";

export const MARITIME_BRIDGE_VERSION = "maritime-dp-bridge 0.1.0-alpha";
export const MARITIME_BRIDGE_SCHEMA = "goto-calm:maritime-dp-bridge:0.1";

export const MARITIME_RELATIONS = [
  { value: "advisory", en: "Advisory only", ua: "Лише консультативний" },
  { value: "supervisory", en: "Decision support or supervisory influence", ua: "Підтримка рішень або наглядовий вплив" },
  { value: "commit-capable", en: "Command, configuration or actuation capable", ua: "Здатний до команди, конфігурації або виконання" },
  { value: "unresolved", en: "Not yet bounded", ua: "Ще не визначено" }
];

export const MARITIME_LOCI = [
  { value: "onboard", en: "Onboard / local", ua: "На борту / локально" },
  { value: "remote", en: "Remote / shore", ua: "Віддалено / з берега" },
  { value: "hybrid", en: "Hybrid onboard and remote", ua: "Гібридно на борту й віддалено" },
  { value: "unresolved", en: "Not yet bounded", ua: "Ще не визначено" }
];

export const MARITIME_QUESTIONS = [
  {
    id: "maritime_mode_boundary",
    axis: "mode",
    critical: true,
    en: "The assessed vessel, system version, configuration and present operating mode are explicitly bounded.",
    ua: "Оцінювані судно, версія системи, конфігурація та поточний режим роботи явно обмежені."
  },
  {
    id: "maritime_control_locus",
    axis: "control",
    critical: true,
    en: "The locus of decision, command, actuation and stop authority is explicit across onboard, remote and hybrid paths.",
    ua: "Locus рішення, команди, виконання та повноваження на зупинку явно визначено для бортових, віддалених і гібридних шляхів."
  },
  {
    id: "maritime_authority_reachability",
    axis: "authority",
    critical: true,
    en: "A named accountable human authority can effect state change within the required intervention window; authority is not merely nominal.",
    ua: "Названа відповідальна людська влада може змінити стан у межах потрібного вікна втручання; повноваження не є лише номінальними."
  },
  {
    id: "maritime_commit_topology",
    axis: "commit",
    critical: true,
    en: "Every path able to materialize a command, configuration change or operational consequence is identified and subject to the same admissibility and refusal boundary.",
    ua: "Кожен шлях, здатний реалізувати команду, зміну конфігурації або операційний наслідок, визначено й підпорядковано тій самій межі допустимості та відмови."
  },
  {
    id: "maritime_transition_handover",
    axis: "transition",
    critical: true,
    en: "Mode changes and handover are explicit and time-referenced, and a fallback or preservation state is not represented as silent mission continuation.",
    ua: "Зміни режиму й передавання керування є явними та прив’язаними до часу, а fallback або стан збереження не подається як приховане продовження місії."
  },
  {
    id: "maritime_preservation_margin",
    axis: "preservation",
    critical: true,
    en: "The fallback or preservation path has bounded controllability, observability and resource margin and does not depend on unbounded compensation.",
    ua: "Шлях fallback або збереження має обмежені керованість, спостережуваність і запас ресурсів та не залежить від необмеженої компенсації."
  },
  {
    id: "maritime_independent_verifier",
    axis: "runtime",
    critical: true,
    en: "Any runtime-validity claim is checked by a function independent from mission optimization and the controlled inference path.",
    ua: "Будь-яке твердження про runtime-чинність перевіряється функцією, незалежною від оптимізації місії та контрольованого inference-шляху."
  },
  {
    id: "maritime_external_standing",
    axis: "external",
    critical: false,
    en: "Applicable vessel records and class, flag, regulatory or safety-case materials remain separately identifiable and are not replaced by this screening.",
    ua: "Застосовні суднові записи та матеріали class, flag, regulatory або safety case залишаються окремо визначними й не замінюються цим скринінгом."
  }
];

const ANSWERS = new Set(["3", "2", "1", "0", "unknown", "out"]);
const RELATIONS = new Set(MARITIME_RELATIONS.map((item) => item.value));
const LOCI = new Set(MARITIME_LOCI.map((item) => item.value));
const CONSEQUENCES = new Set(CONSEQUENCE_CLASSES);
const BASES = new Set(RESPONSE_BASES);
const WEAK = new Set(["1", "0", "unknown", "out"]);
const UNBOUNDED = new Set(["unknown", "out"]);

export function evaluateMaritimeBridge({ consequenceClass, responseBasis, relation, locus, answers }) {
  if (!CONSEQUENCES.has(consequenceClass)) throw new Error(`Invalid consequenceClass: ${consequenceClass}`);
  if (!BASES.has(responseBasis)) throw new Error(`Invalid responseBasis: ${responseBasis}`);
  if (!RELATIONS.has(relation)) throw new Error(`Invalid maritime relation: ${relation}`);
  if (!LOCI.has(locus)) throw new Error(`Invalid maritime locus: ${locus}`);

  const normalizedAnswers = {};
  for (const question of MARITIME_QUESTIONS) {
    const value = String(answers?.[question.id] ?? "unknown");
    if (!ANSWERS.has(value)) throw new Error(`Invalid maritime answer: ${value}`);
    normalizedAnswers[question.id] = value;
  }

  const critical = MARITIME_QUESTIONS.filter((question) => question.critical);
  const priorityGapCount = critical.filter((question) => WEAK.has(normalizedAnswers[question.id])).length;
  const criticalUnbounded = critical.some((question) => UNBOUNDED.has(normalizedAnswers[question.id]));
  const unknownCount = Object.values(normalizedAnswers).filter((value) => value === "unknown").length;
  const outOfScopeCount = Object.values(normalizedAnswers).filter((value) => value === "out").length;

  let route = "tier1-sector";
  if (responseBasis === "exploratory") route = "exploratory";
  else if (relation === "unresolved" || locus === "unresolved" || criticalUnbounded || consequenceClass === "unknown") route = "scope-first";
  else if (relation === "commit-capable" || consequenceClass === "critical") route = "tier3";
  else if (relation === "supervisory" || consequenceClass === "high" || consequenceClass === "enterprise" || priorityGapCount) route = "tier2";

  const answerDistribution = ["3", "2", "1", "0", "unknown", "out"].map((value) => {
    const count = Object.values(normalizedAnswers).filter((answer) => answer === value).length;
    return { value, count, percent: Math.round((count / MARITIME_QUESTIONS.length) * 100) };
  });

  return {
    version: MARITIME_BRIDGE_VERSION,
    route,
    consequenceClass,
    responseBasis,
    relation,
    locus,
    answers: normalizedAnswers,
    priorityGapCount,
    unknownCount,
    outOfScopeCount,
    answerDistribution
  };
}

export function buildMaritimeBridgeExport({ language, lifecycle, result, generatedAt = new Date().toISOString() }) {
  if (!new Set(["en", "ua"]).has(language)) throw new Error(`Unsupported language: ${language}`);
  if (!result || result.version !== MARITIME_BRIDGE_VERSION) throw new Error("Invalid maritime bridge result");
  return {
    schema: MARITIME_BRIDGE_SCHEMA,
    version: MARITIME_BRIDGE_VERSION,
    generatedAt,
    language,
    status: "self-reported local sector-routing record",
    context: {
      consequenceClass: result.consequenceClass,
      lifecycle,
      responseBasis: result.responseBasis,
      operationalRelation: result.relation,
      controlLocus: result.locus
    },
    result: {
      route: result.route,
      priorityGapCount: result.priorityGapCount,
      unknownCount: result.unknownCount,
      outOfScopeCount: result.outOfScopeCount
    },
    answers: MARITIME_QUESTIONS.map((question) => ({
      questionId: question.id,
      axis: question.axis,
      critical: question.critical,
      value: result.answers[question.id]
    })),
    limitations: [
      "This is a self-reported sector-routing record; no evidence was independently reviewed.",
      "It is not a DP class, FMEA, proving-trials, ASOG, CAMO, TAM, flag, class, regulatory, engineering or safety-case conclusion.",
      "It cannot authorize command, actuation, operation, continuation, restoration or return to mission.",
      "The record contains answer states only and must not contain raw vessel, client, operational or security-sensitive evidence."
    ]
  };
}
