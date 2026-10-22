import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ASSESSMENT_DATE, QUESTIONS, evaluateScreening } from "../src/assets/screening/screening-core.js";
import {
  buildEvidenceReviewBrief,
  buildEvidenceWorkspaceExport,
  createEvidenceRows,
  parseEvidenceWorkspaceImport
} from "../src/assets/screening/evidence-workspace-core-v08.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const EXAMPLE_ASSESSMENT_DATE = "2026-10-22";
export const EXAMPLE_GENERATED_AT = "2026-10-22T00:00:00.000Z";
export const EXAMPLE_RELEASE_ID = "gotocalm-screening-portable-20261022-v14-r2";
export const EXAMPLE_SHARED_SOURCE_COMMIT = "df4ea1292f6c356950f25e46e6025f68304c8ab8";
export const EXAMPLE_MANIFEST_SHA256 = "619492406980509341b4b99175c762ff116a595c25459722324bd6815763a53d";

// These are display translations only. The pinned core computes every state,
// count, priority item and next-action identifier used in the sample.
const COPY = {
  en: {
    title: "How to read a result: educational example",
    badge: "Training only · nonnormative",
    scenario: "Imagine an assistant that drafts supplier replies for a person to review. This example represents no real organisation, supplier, source document or operational deployment.",
    interpretation: "Every answer is UNKNOWN. The scenario description and context labels are fictional premises, not evidence that a control exists or works. The example shows how unresolved evidence appears in an exploratory record.",
    boundary: "No evidence has been independently reviewed. This is not an assessment of an operational system, an audit or a conclusion on safety, compliance or doctrine conformance. It cannot authorize execution, continuation or restoration.",
    mappingNote: "Open records require further evidence work; they do not establish a failure or a risk level. A mapped record would still not be independent verification.",
    interaction: "Viewing or downloading this example does not change your active screening, completion count or consent, and does not submit to the public aggregate. Importing the JSON is a separate, manual action in the workspace, with its normal replacement prompts.",
    contextTitle: "Fictional context and result",
    countsTitle: "Computed evidence state",
    briefTitle: "Review brief",
    priorityTitle: "Priority questions surfaced in the brief",
    nextTitle: "Next actions in this brief",
    inputsTitle: "The full answer set",
    provenanceTitle: "Dates and provenance",
    dateNote: "The core basis date identifies the pinned rule set. The assessment date belongs only to this fictional scenario. generatedAt is a fixed export timestamp used to reproduce these files; it is not a new evidence-review date.",
    jsonLanguageNote: "The JSON preserves the runtime's schema and its standard English status and limitations. The explanatory brief is available in the selected language.",
    downloadJson: "Download example JSON",
    downloadBrief: "Download review brief (Markdown)",
    field: "Field", value: "Value", question: "Question", answer: "Answer",
    unknown: "UNKNOWN",
    labels: {
      referenceLabel: "Fictional object", assessedVersion: "Scenario version",
      outcome: "Screening outcome", responseBasis: "Response basis",
      consequenceClass: "Consequence class", sectorContext: "Sector context", lifecycle: "Lifecycle",
      unknownCount: "Unknown answers", outOfScopeCount: "Out-of-scope answers",
      mapped: "Mapped records", open: "Open records", priorityOpen: "Priority-open records",
      status: "Brief status", coreBasisDate: "Core basis date",
      assessmentDate: "Synthetic assessment date", generatedAt: "Fixed export timestamp (generatedAt)",
      releaseId: "Pinned shared release", sharedSourceCommit: "Shared r2 source commit",
      manifestSha256: "Release manifest SHA-256", sharedRuntimeSha256: "Shared runtime SHA-256",
      coreVersion: "Screening core version", evidenceVersion: "Evidence workspace version", schema: "JSON schema"
    },
    values: {
      outcome: { exploratory: "Exploratory run — no substantive result" },
      responseBasis: { exploratory: "Exploratory / demonstration run" },
      consequenceClass: { unknown: "UNKNOWN — unresolved" },
      sectorContext: { general: "General / advisory" },
      lifecycle: { concept: "Concept / research" },
      status: { "training-only": "Training-only snapshot" }
    },
    actions: {
      "rerun-substantive": "Repeat the screening for one real object using identifiable records or a declared mixed basis.",
      "resolve-priority-records": "Start with the priority open records; classify each source, add a controlled locator, and check currentness and conflicts.",
      "complete-open-records": "Complete the remaining open mappings or explicitly justify their scope boundaries."
    },
    context: {
      referenceLabel: "Fictional supplier-reply drafting assistant",
      assessedVersion: "synthetic-example-1",
      assessmentDate: EXAMPLE_ASSESSMENT_DATE,
      contextLabel: "Training scenario only; drafts for human review; no real organisation, records or reviewed evidence."
    }
  },
  ua: {
    title: "Як читати результат: навчальний приклад",
    badge: "Лише для навчання · ненормативний",
    scenario: "Уявіть помічника, який готує чернетки відповідей постачальникам для перегляду людиною. Приклад не представляє реальну організацію, постачальника, вихідний документ або систему в експлуатації.",
    interpretation: "Усі відповіді мають значення «НЕВІДОМО». Опис сценарію та позначення контексту є вигаданими передумовами, а не свідченнями існування або дієвості контролів. Приклад показує невизначені свідчення в ознайомлювальному записі.",
    boundary: "Жодних свідчень не перевірено незалежно. Це не оцінювання системи в експлуатації, не аудит і не висновок щодо безпеки, дотримання вимог або відповідності доктрині. Приклад не може дозволяти виконання, продовження чи відновлення.",
    mappingNote: "Відкриті записи потребують подальшої роботи зі свідченнями; вони не встановлюють відмову або рівень ризику. Навіть зіставлений запис не означав би незалежної перевірки.",
    interaction: "Перегляд або завантаження прикладу не змінює активного скринінгу, лічильника завершень чи згоди та не надсилає даних до публічного агрегату. Імпорт JSON є окремою ручною дією в робочому просторі зі звичайними запитами щодо заміни.",
    contextTitle: "Вигаданий контекст і результат",
    countsTitle: "Обчислений стан свідчень",
    briefTitle: "Стислий огляд",
    priorityTitle: "Пріоритетні питання, наведені в огляді",
    nextTitle: "Наступні дії в цьому огляді",
    inputsTitle: "Повний набір відповідей",
    provenanceTitle: "Дати та походження",
    dateNote: "Дата бази ядра визначає зафіксований набір правил. Дата оцінювання стосується лише цього вигаданого сценарію. generatedAt — фіксована часова позначка експорту для відтворення цих файлів, а не нова дата перевірки свідчень.",
    jsonLanguageNote: "JSON зберігає схему та стандартні англомовні статус і обмеження модуля. Пояснювальний огляд доступний обраною мовою.",
    downloadJson: "Завантажити приклад JSON",
    downloadBrief: "Завантажити стислий огляд (Markdown)",
    field: "Поле", value: "Значення", question: "Питання", answer: "Відповідь",
    unknown: "НЕВІДОМО",
    labels: {
      referenceLabel: "Вигаданий об’єкт", assessedVersion: "Версія сценарію",
      outcome: "Результат скринінгу", responseBasis: "Підстава відповідей",
      consequenceClass: "Клас наслідків", sectorContext: "Секторальний контекст", lifecycle: "Життєвий цикл",
      unknownCount: "Відповіді «Невідомо»", outOfScopeCount: "Відповіді поза обсягом",
      mapped: "Зіставлені записи", open: "Відкриті записи", priorityOpen: "Пріоритетні відкриті записи",
      status: "Статус огляду", coreBasisDate: "Дата бази ядра",
      assessmentDate: "Дата навчального оцінювання", generatedAt: "Фіксована часова позначка експорту (generatedAt)",
      releaseId: "Зафіксований спільний випуск", sharedSourceCommit: "Коміт спільного вихідного коду r2",
      manifestSha256: "SHA-256 маніфесту випуску", sharedRuntimeSha256: "SHA-256 спільного модуля виконання",
      coreVersion: "Версія ядра скринінгу", evidenceVersion: "Версія робочого простору свідчень", schema: "Схема JSON"
    },
    values: {
      outcome: { exploratory: "Ознайомлювальний прохід — без змістовного результату" },
      responseBasis: { exploratory: "Ознайомлювальний / демонстраційний прохід" },
      consequenceClass: { unknown: "НЕВІДОМО (UNKNOWN) — не визначено" },
      sectorContext: { general: "Загальний / дорадчий" },
      lifecycle: { concept: "Концепція / дослідження" },
      status: { "training-only": "Навчальний знімок" }
    },
    actions: {
      "rerun-substantive": "Повторіть скринінг для одного реального об’єкта на підставі записів, які можна визначити, або заявленої змішаної підстави.",
      "resolve-priority-records": "Почніть із пріоритетних відкритих записів: класифікуйте кожне джерело, додайте контрольований локатор і перевірте актуальність та конфлікти.",
      "complete-open-records": "Завершіть решту відкритих картувань або явно обґрунтуйте їхні межі обсягу."
    },
    context: {
      referenceLabel: "Вигаданий помічник для підготовки відповідей постачальникам",
      assessedVersion: "synthetic-example-1",
      assessmentDate: EXAMPLE_ASSESSMENT_DATE,
      contextLabel: "Лише навчальний сценарій; чернетки для перегляду людиною; без реальної організації, записів або перевірених свідчень."
    }
  }
};

const json = value => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const cell = value => String(value).replaceAll("|", "\\|").replace(/\r?\n/g, " ");
const table = (columns, rows) => [
  `| ${columns.map(cell).join(" | ")} |`,
  `| ${columns.map(() => "---").join(" | ")} |`,
  ...rows.map(row => `| ${row.map(cell).join(" | ")} |`)
].join("\n");

function markdownBrief(view, data, payload) {
  const c = view.copy;
  return [
    `# ${c.title}`, `**${c.badge}**`, c.scenario, c.interpretation, c.boundary,
    `## ${c.contextTitle}`,
    table([c.field, c.value], view.contextRows.map(row => [row.label, row.value])),
    `## ${c.countsTitle}`,
    table([c.field, c.value], view.metrics.map(row => [row.label, row.value])),
    c.mappingNote,
    `## ${c.briefTitle}`, `**${c.labels.status}: ${view.statusLabel}**`,
    `### ${c.priorityTitle}`, view.priorityItems.map(item => `- ${item.text}`).join("\n"),
    `### ${c.nextTitle}`, view.nextActions.map(item => `- ${item.text}`).join("\n"),
    `## ${c.inputsTitle}`,
    table([c.question, c.answer], payload.evidenceRecords.map(record => [
      QUESTIONS.find(question => question.id === record.questionId)[payload.language],
      record.sourceAnswer === "unknown" ? c.unknown : record.sourceAnswer
    ])),
    `## ${c.provenanceTitle}`,
    table([c.field, c.value], [...view.dateRows, ...view.provenanceRows].map(row => [row.label, row.value])),
    c.dateNote, c.jsonLanguageNote,
    `[${c.downloadJson}](./screening-${payload.language}.json)`, c.interaction,
    `<!-- Generated by scripts/build-screening-example.mjs; sample ${data.sampleId}. -->`
  ].join("\n\n") + "\n";
}

export async function buildScreeningExample({ rootDir = ROOT } = {}) {
  const manifestBytes = await readFile(resolve(rootDir, "docs/screening-shared-v14/RELEASE_MANIFEST.json"));
  assert.equal(sha256(manifestBytes), EXAMPLE_MANIFEST_SHA256, "Pinned r2 release manifest changed");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(manifest.release_id, EXAMPLE_RELEASE_ID, "Sample requires the pinned r2 release");
  assert.equal(manifest.assets.length, 9, "Unexpected pinned runtime closure");
  for (const asset of manifest.assets) {
    const bytes = await readFile(resolve(rootDir, asset.path));
    assert.equal(bytes.length, asset.bytes, `Pinned asset size changed: ${asset.path}`);
    assert.equal(sha256(bytes), asset.sha256, `Pinned asset hash changed: ${asset.path}`);
  }
  const answers = Object.fromEntries(QUESTIONS.map(question => [question.id, "unknown"]));
  const screening = evaluateScreening({
    consequenceClass: "unknown", sectorContext: "general", lifecycle: "concept",
    responseBasis: "exploratory", answers
  });
  const rows = createEvidenceRows(answers);
  const data = {
    version: 1,
    sampleId: "fictional-supplier-reply-assistant",
    fictional: true,
    nonnormative: true,
    screening,
    evidenceReviewed: false,
    answerCount: rows.length,
    dates: {
      coreBasisDate: ASSESSMENT_DATE,
      assessmentDate: EXAMPLE_ASSESSMENT_DATE,
      generatedAt: EXAMPLE_GENERATED_AT
    },
    provenance: {
      releaseId: manifest.release_id,
      sharedSourceCommit: EXAMPLE_SHARED_SOURCE_COMMIT,
      manifestSha256: sha256(manifestBytes),
      sharedRuntimeSha256: manifest.assets.find(asset => asset.path === "src/assets/screening/screening-v14.js").sha256,
      coreVersion: screening.version,
      evidenceVersion: manifest.evidence_version,
      schema: manifest.schemas.evidence
    },
    languages: {}
  };
  const files = {};
  for (const language of ["en", "ua"]) {
    const copy = COPY[language];
    const workspace = { context: copy.context, screening, rows, maritime: null };
    const payload = buildEvidenceWorkspaceExport({ language, ...workspace, generatedAt: EXAMPLE_GENERATED_AT });
    const brief = buildEvidenceReviewBrief(workspace);
    const imported = parseEvidenceWorkspaceImport(JSON.parse(json(payload)));
    assert.deepEqual(buildEvidenceWorkspaceExport({ language, ...imported, generatedAt: EXAMPLE_GENERATED_AT }), payload);
    assert.deepEqual(buildEvidenceReviewBrief(imported), brief);
    assert.equal(payload.version, data.provenance.evidenceVersion);
    assert.equal(payload.schema, data.provenance.schema);
    if (data.brief) assert.deepEqual(data.brief, brief, "Translated contexts changed computed semantics");
    data.brief = brief;
    data.summary = brief.summary;
    const view = {
      copy,
      contextRows: [
        ...["referenceLabel", "assessedVersion"].map(key => ({ key, label: copy.labels[key], value: copy.context[key] })),
        ...["consequenceClass", "responseBasis", "outcome", "sectorContext", "lifecycle"].map(key => {
          const value = copy.values[key][screening[key]];
          assert.ok(value, `Missing ${language} translation: ${key}/${screening[key]}`);
          return { key, label: copy.labels[key], value };
        })
      ],
      metrics: ["unknownCount", "outOfScopeCount", "mapped", "open", "priorityOpen"].map(key => ({
        key, label: copy.labels[key], value: screening[key] ?? brief.summary[key]
      })),
      statusLabel: copy.values.status[brief.status],
      priorityItems: brief.priorityItems.map(item => ({
        id: item.questionId, text: QUESTIONS.find(question => question.id === item.questionId)[language]
      })),
      nextActions: brief.nextActions.map(id => {
        assert.ok(copy.actions[id], `Missing ${language} action translation: ${id}`);
        return { id, text: copy.actions[id] };
      }),
      dateRows: Object.entries(data.dates).map(([key, value]) => ({ key, label: copy.labels[key], value })),
      provenanceRows: Object.entries(data.provenance).map(([key, value]) => ({ key, label: copy.labels[key], value })),
      downloads: { json: `/assets/examples/screening-${language}.json`, markdown: `/assets/examples/screening-${language}.md` }
    };
    assert.ok(view.statusLabel, `Missing ${language} brief status translation`);
    data.languages[language] = view;
    files[`src/assets/examples/screening-${language}.json`] = json(payload);
    files[`src/assets/examples/screening-${language}.md`] = markdownBrief(view, data, payload);
  }
  files["src/_data/screeningExample.json"] = json(data);
  return { data, files };
}

export async function writeScreeningExample({ rootDir = ROOT, outputDir = rootDir } = {}) {
  const result = await buildScreeningExample({ rootDir });
  for (const [path, contents] of Object.entries(result.files)) {
    const destination = resolve(outputDir, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents, "utf8");
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { data, files } = await writeScreeningExample();
  console.log(`Screening example: ${Object.keys(files).length} deterministic files; ${data.answerCount} UNKNOWN; ${data.summary.mapped} mapped / ${data.summary.open} open; ${data.brief.status}.`);
}
