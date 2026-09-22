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
  MARITIME_EVIDENCE_AXES,
  buildEvidenceReviewBrief,
  buildEvidenceWorkspaceExport,
  createEvidenceRows,
  createMaritimeEvidencePackage,
  evaluateCombinedEvidenceReadiness,
  mergeMaritimeBridgeIntoWorkspace,
  parseMaritimeBridgeImport,
  parseEvidenceWorkspaceImport
} from "./evidence-workspace-core-v08.js";
import {
  PUBLIC_AGGREGATE_ENDPOINT,
  buildPublicSubmission,
  normalizePublicAggregate
} from "./public-activity-core.js";
import {
  MARITIME_BRIDGE_SCHEMA,
  MARITIME_BRIDGE_VERSION,
  MARITIME_LOCI,
  MARITIME_QUESTIONS,
  MARITIME_RELATIONS,
  buildMaritimeBridgeExport,
  evaluateMaritimeBridge
} from "./maritime-core.js";
import {
  DOCUMENT_MAX_FILES,
  DOCUMENT_INTAKE_VERSION,
  REGULATORY_HORIZON_AS_OF,
  analyzeDocxArrayBuffer,
  buildDocumentIntakeAssessment,
  buildRegulatoryReadiness,
  emptyRegulatoryProfile,
  selectBestAxisSuggestions
} from "./document-intake-core-v10.js";

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
      privateText: "The assessment and all answers stay in this browser. A working draft is auto-saved only in this tab so ordinary navigation or a refresh does not erase it. Closing the tab or explicitly starting a new assessment clears that tab draft. Only after a substantive run, and only with your explicit consent, a minimal summary can be sent. No answers, scores, free text, evidence locators or files are uploaded.",
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
      restart: "Start new assessment",
      restartConfirm: "Start a new assessment and erase the current tab draft? Export the workspace JSON first if you may need it again.",
      session: {
        title: "Current work protected",
        text: "Auto-saved only in this browser tab. Refreshes, same-tab navigation and language changes keep the draft; closing the tab or starting a new assessment clears it.",
        saved: "Draft saved in this tab"
      },
      why: {
        eyebrow: "Why this test matters",
        title: "Find the claim that may fail review before a client, regulator, insurer or auditor finds it",
        text: "The screen turns a broad confidence statement into a bounded consequence class, an evidence route and a visible list of claims that still need records or independent challenge.",
        level: "Current product level",
        levelText: "Self-reported review-readiness baseline — not an audit or compliance determination.",
        outputs: [
          "A consequence-sensitive route instead of one generic score.",
          "A portable evidence-readiness packet showing what is mapped, open or excluded.",
          "A dated regulatory preparation horizon and a handoff point for qualified independent review."
        ]
      },
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
        privacy: "Nothing is sent to us. A derived working draft is auto-saved only in this browser tab so navigation or refresh does not erase it; the raw document is never retained. Closing the tab or explicitly starting a new assessment clears the tab draft. Export JSON for a portable copy. Use neutral references and do not enter raw evidence, personal data, credentials, client details or operationally sensitive information.",
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
        briefEyebrow: "One-page local decision aid",
        briefTitle: "Review Readiness Brief",
        briefPurpose: "Turn this snapshot into a bounded decision: the problem to solve now, up to five evidence gaps, the response window and whether a scoped professional review is justified.",
        briefStatusLabel: "Current readiness",
        briefStatus: {
          "training-only": ["Training-only snapshot", "The declared exploratory basis prevents a substantive assessment. The mapping below can be used to learn the workflow, not to characterize a real system."],
          "context-required": ["Assessment context required", "Complete the object, version, date and context before treating the mapping as a bounded working record."],
          "sector-package-required": ["Maritime / DP package required", "The main screening is maritime-scoped, but its sector package is not yet attached. Import the matching bridge JSON or complete the bridge in this tab."],
          "priority-open": ["Priority evidence work is open", "The snapshot has a bounded context, but one or more critical doctrine questions still lack a reviewable mapping."],
          "mapping-open": ["Evidence mapping is open", "No critical mapping gap remains, but the working record is not yet complete."],
          "mapping-complete": ["Mapping complete — review still required", "The local mapping fields are complete. This is not verification; an appropriately independent review remains necessary."]
        },
        briefObject: "Object",
        briefVersion: "Version / configuration",
        briefDate: "Assessment date",
        briefBasis: "Declared answer basis",
        notProvided: "Not provided",
        briefPainTitle: "Problem to solve now",
        briefPain: {
          exploratory: "This run cannot support a real decision because the answer basis was exploratory. Repeat it for one bounded object before using the result.",
          unknown: "The highest credible consequence is unresolved. Until it is bounded, the review depth and safe reliance point cannot be selected.",
          live: "The object is already relied on in live operation while material claims may still lack current, attributable and independently challengeable evidence.",
          pilot: "The next test can repeat the same evidence gaps and create false confidence unless open controls are closed or explicitly bounded first.",
          design: "Procurement or deployment can lock in unsupported applicability, authority or control assumptions while changes are still comparatively cheap.",
          concept: "This is the cheapest point to separate intended controls from claims that already have a reviewable evidence basis.",
          lower: "The immediate value is proportionate assurance: document why deeper escalation is not triggered and avoid both false confidence and unnecessary control work."
        },
        briefStageTitle: "Current preparation stage",
        briefTimingTitle: "Response window",
        briefAsOf: "Horizon checked",
        briefGapsTitle: "Priority gaps before next reliance",
        briefNoGaps: "No structural mapping gap remains in this snapshot. Verification and an appropriately independent challenge are still required before external reliance.",
        briefGapActionLabel: "Close",
        briefGap: {
          consequenceAxis: "Consequence boundary",
          consequenceTitle: "The highest credible consequence path is not yet bounded.",
          consequenceAction: "Confirm the highest credible path with an accountable owner before selecting review depth.",
          contextAxis: "Assessment boundary",
          contextTitle: "The object, version, date or use context is not fully bounded.",
          regulatoryAxis: "Legal orientation",
          regulatoryTitle: "Jurisdiction, market role or the suggested regulatory profile still needs confirmation.",
          regulatoryAction: "Confirm the profile and route applicability questions to qualified legal or sector review.",
          maritimeAxis: "Sector package",
          maritimeTitle: "The Maritime / DP evidence package is not attached to this working record."
        },
        briefRecommendationTitle: "Recommended decision",
        briefRecommendation: {
          restart: "Repeat the screening for one real, bounded object. Do not commission a substantive review from this exploratory run.",
          bound: "Complete the assessment boundary and consequence class first. This prevents buying a broad review that cannot reach a defensible conclusion.",
          prepare: "Close the listed gaps, export the bounded packet and then route it for a scoped evidence-readiness review before the stated response window.",
          review: "Prepare the bounded packet now and commission a scoped evidence-readiness review before the stated response window. The review should challenge sources, authority, commit paths and topology — not restate the score.",
          challenge: "The mapping is ready for an appropriately independent challenge. Verify the records, conflicts and applicability before any external claim or operational conclusion."
        },
        briefReviewTitle: "Why a scoped professional review may be justified",
        briefReviewReason: {
          consequence: "The declared consequence class makes an unsupported claim materially expensive.",
          lifecycle: "The pilot or live context shortens the time available to find and correct a false assumption.",
          priority: "{count} critical doctrine record(s) remain open at the handoff boundary.",
          regulatory: "The dated legal horizon is only orientation until role and applicability are tested against the real product and market facts.",
          independence: "{count} source(s) are labelled independent, but that independence is still self-declared and needs external confirmation.",
          concentration: "One source family carries most mapped claims, increasing correlated evidence risk.",
          complete: "A complete mapping is the correct moment for challenge: the reviewer can test identifiable claims instead of reconstructing the scope from scratch.",
          default: "A bounded external challenge can test whether the declared evidence would survive client, regulator, insurer or auditor scrutiny."
        },
        briefReviewScope: "Minimum professional scope: challenge the boundary; trace the 3–5 highest-risk claims; verify source identity, currentness, conflicts and independence; and issue dated findings with explicit hold points.",
        briefDoctrineLabel: "Doctrinal decision chain",
        briefDoctrine: "Scope and applicability → authority → commit → evidence and consequence → topology → drift and runtime.",
        briefCta: "Discuss a scoped review",
        nextActionsTitle: "Recommended next actions",
        nextAction: {
          "rerun-substantive": "Repeat the screening for one real object using identifiable records or a declared mixed basis.",
          "complete-context": "Complete the neutral object, version, date and assessment-context fields.",
          "add-maritime-package": "Attach the matching Maritime / DP bridge before treating the workspace as a complete sector record.",
          "resolve-priority-records": "Start with the priority open records; classify each source, add a controlled locator, and check currentness and conflicts.",
          "complete-open-records": "Complete the remaining open mappings or explicitly justify their scope boundaries.",
          "independent-review": "Route the bounded snapshot and controlled record locators to an appropriately independent reviewer."
        },
        priorityPreviewTitle: "First priority questions",
        noPriorityPreview: "No priority mapping items are open.",
        briefBoundary: "This brief analyzes only the structure and declared state of the local snapshot. It does not read, upload or verify the underlying evidence and is not an audit, compliance conclusion, safety finding or authorization.",
        printBrief: "Print one-page brief",
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
        importMaritimeSuccess: "Matching Maritime / DP package added to this workspace",
        importMaritimeStandalone: "Maritime / DP package loaded; the 17 core records remain open until a matching main snapshot is added or mapped",
        importFailed: "Snapshot could not be restored",
        importTooLarge: "Snapshot is larger than the 512 KB local limit",
        replaceConfirm: "Replace the current Tier 1 workspace with the selected snapshot?",
        mergeMaritimeConfirm: "Add this matching Maritime / DP package to the current workspace?",
        example: "Load neutral example",
        exampleConfirm: "Replace the current workspace with a clearly fictional training example?",
        exampleLoaded: "Fictional training example loaded",
        print: "Print full mapping packet",
        back: "Back to result — keep this work",
        clear: "Reset workspace",
        clearConfirm: "Reset every Tier 1 field in this tab? This cannot be undone unless you already exported a snapshot.",
        exported: "JSON snapshot downloaded",
        exportBoundary: "The JSON is a portable self-reported working record, not an audit artifact, proof package or authorization object.",
        packageTitle: "Evidence packages",
        corePackage: "Core doctrine package",
        maritimePackage: "Maritime / DP sector package",
        packageAttached: "Attached",
        packageMissing: "Not attached",
        packageRoute: "Sector route",
        packageRelation: "Operational relationship",
        packageLocus: "Control locus",
        coreMapTitle: "Core doctrine evidence map",
        maritimeMapTitle: "Maritime / DP evidence map",
        version: "Workspace version",
        emptyOutcome: "Blank workspace",
        current: "current mapping",
        independentHint: "Use “independent” only for a source whose author, method and incentives are sufficiently separate from the claim owner. Selecting the label here does not establish independence.",
        reviewSignals: {
          title: "Review-quality signals",
          clear: "No source-concentration or independence flags were detected from the entered locators. This still does not verify the evidence.",
          singleSource: "One source family supports {count} mapped records. Split claims across controlled records or add corroboration before external reliance.",
          independence: "{count} record(s) are labelled independent. Independence is self-declared here and must be confirmed from source ownership, method and incentives.",
          document: "A locally scanned document supplied candidate locators; phrase matches do not establish record quality or control effectiveness."
        },
        value: {
          eyebrow: "Current product level",
          title: "Review-readiness baseline — not an independent audit",
          promise: "Expose the claim most likely to fail an evidence review before it reaches a client, regulator, insurer or auditor.",
          now: "What you get now",
          nowItems: [
            "A consequence-sensitive map of supported, open and excluded claims — without hiding gaps inside one score.",
            "A portable review-readiness packet with controlled locators, priority actions and a compact brief.",
            "A dated EU/EEA preparation horizon beside the evidence state, with explicit applicability limits."
          ],
          future: "Commercial path after calibration",
          futureItems: [
            "A scoped evidence-readiness review that challenges the map and prepares the controlled handoff.",
            "Qualified legal, sector and genuinely independent evidence-review routes under separate scope.",
            "Private accounts, team history and controlled multi-file workspaces after the public alpha is calibrated."
          ],
          cta: "Discuss a scoped evidence-readiness review",
          boundary: "Call this output an audit-readiness or review-readiness baseline. Do not call it an independent audit: the public alpha does not inspect the underlying evidence, test controls or establish reviewer independence. The test remains free; any professional engagement requires separate scope, competence and independence checks."
        },
        document: {
          intro: "Start with a DOCX",
          eyebrow: "Local document intake · free public alpha",
          title: "Drop in the document first",
          purpose: "Add up to three DOCX files, one at a time. The browser fills only what it can support from the documents, marks everything else as insufficient data and asks for the smallest safe set of answers.",
          choose: "Choose and analyze DOCX",
          add: "Add supporting DOCX",
          maxReached: "Maximum of 3 documents reached",
          apply: "Apply candidate locators",
          applied: "candidate locator(s) added; evidence status remains open",
          spec: "Up to 3 DOCX files · 10 MB each · no macros or password protection",
          privacy: "Each file is read only after you choose it. It is not uploaded, transmitted or saved by us. Its bytes and raw text are discarded immediately after local analysis; only derived metadata and section locators remain in this tab.",
          analyzing: "Reading the selected document locally…",
          ready: "Local scan ready",
          documentNumber: "Document",
          file: "Selected file",
          titleLabel: "Detected title",
          versionLabel: "Detected version",
          pages: "Document-metadata pages",
          words: "Words",
          paragraphs: "Readable paragraphs",
          headings: "Headings",
          cues: "Candidate doctrine sections",
          combinedCues: "Best combined section candidates",
          cueMatches: "matching paragraph(s)",
          suggestion: "Suggested context",
          coverage: "Doctrinal structure cues",
          axesFound: "axes found",
          missingAxes: "No cue yet for",
          statusEyebrow: "Automated orientation",
          statuses: {
            empty: ["Waiting for a document", "Add a DOCX to begin the local orientation."],
            insufficient: ["Insufficient data", "The document supplied useful cues, but cannot safely select the review depth yet. Answer the short questions or add a supporting document."],
            partial: ["Partial orientation", "There is enough structure to begin mapping, but material gaps remain explicit."],
            bounded: ["Bounded orientation ready", "There is enough context and document structure to prepare the evidence map. Nothing has been verified or accepted as evidence."]
          },
          quickTitle: "Answer only what the document cannot safely decide",
          quickHint: "These answers update the orientation immediately. You can then add another document; the earlier analysis stays in this tab.",
          quickConsequence: "Highest credible consequence",
          quickSector: "Context lens",
          quickLifecycle: "Current lifecycle",
          needsTitle: "What the system still needs from you",
          gaps: {
            document: "Add a DOCX to generate local metadata and section suggestions.",
            consequence: "Confirm the highest credible consequence; document wording cannot decide this safely.",
            object: "Name the specific assessment object in the context fields below.",
            version: "Enter or confirm the assessed version in the context fields below.",
            context: "Confirm a neutral assessment context.",
            jurisdiction: "Bound the jurisdiction or market in the regulatory section.",
            "market-role": "Confirm the possible market role in the regulatory section.",
            confirmation: "Confirm the edited regulatory profile for this working context.",
            "missing-axes": "Add a relevant supporting document or leave the missing axes openly unresolved.",
            "evidence-review": "Review every candidate locator for record status, evidence class, currentness and conflicts."
          },
          boundary: "A matching phrase or heading does not prove applicability, admissibility, control effectiveness, safety or compliance. Applying a locator never changes evidence status.",
          errors: {
            "document-type-unsupported": "Only .docx files are supported in this alpha.",
            "document-file-empty": "The selected file is empty.",
            "document-file-too-large": "The selected file is larger than 10 MB.",
            "document-file-limit": "Three documents are already attached to this local orientation.",
            "document-file-duplicate": "This document is already included in the local orientation.",
            "docx-macros-unsupported": "Macro-enabled documents are not accepted.",
            "docx-decompression-unavailable": "This browser cannot perform the local DOCX scan.",
            "docx-no-readable-text": "No readable document text was found.",
            default: "The DOCX could not be analyzed locally. It may be encrypted, damaged or unsupported."
          },
          termsTitle: "Public alpha terms",
          termsItems: [
            "The test is free, voluntary and provided without an account during calibration.",
            "Do not select files containing personal, confidential, client, vessel, security-sensitive or live operational information.",
            "No file is read until you select it; the site does not upload or retain the file.",
            "Automatic cues can be wrong. You remain responsible for confirming scope and every locator.",
            "Outputs are preparation aids, not legal advice, compliance conclusions, safety findings or authorization.",
            "Feedback may be used to improve the test; accounts and commercial review routes may be considered later."
          ]
        },
        regulatory: {
          eyebrow: "Regulatory orientation · EU/EEA alpha",
          title: "Preparation horizon — not a compliance score",
          purpose: "Bound the likely role and product signals, then compare evidence preparation with official current and future dates. Applicability still requires qualified legal and sector analysis.",
          jurisdiction: "Jurisdiction / market",
          jurisdictionOptions: [["unresolved", "Not yet bounded"], ["eu-eea", "EU / EEA"], ["uk", "United Kingdom"], ["us", "United States"], ["other", "Other / multi-jurisdiction"]],
          marketRole: "Possible market role",
          marketRoleOptions: [["unresolved", "Not yet bounded"], ["provider", "Provider / manufacturer"], ["integrator", "Integrator / component supplier"], ["operator", "Deployer / operator"], ["advisory", "Internal or advisory use"]],
          ai: "AI function",
          digitalProduct: "Product with digital elements",
          machinery: "Machinery or regulated product",
          nis2Entity: "Potential NIS2 entity / service",
          triOptions: [["unknown", "Unknown"], ["yes", "Possible / yes"], ["no", "No in stated scope"]],
          confirm: "Confirm this profile",
          confirmed: "Profile confirmed for this working context",
          unconfirmed: "Document cues or edits still require your confirmation",
          level: "Preparation level",
          levels: ["0 · scope not bounded", "1 · obligation orientation", "2 · evidence preparation", "3 · qualified review-ready"],
          levelBoundary: "Level 3 means the mapping can be handed to a qualified reviewer. It does not mean compliant, safe, certified or authorized.",
          urgency: "Recommended timing",
          urgencyLabels: { now: "Now — before continued reliance or operation", "before-next-test": "Before the next pilot or test", "before-deployment": "Before deployment or procurement freeze", "before-claim": "Before an external claim, contract or reliance" },
          horizon: "Official horizon",
          current: "Current",
          future: "Future",
          applicability: { yes: "scope signal: possible", unknown: "scope signal: unresolved" },
          milestones: {
            "ai-act-current": "EU AI Act — general application and enforcement phase",
            "ai-act-annex-iii": "EU AI Act — Annex III high-risk rules",
            "ai-act-product": "EU AI Act — high-risk AI embedded in regulated products",
            "cra-reporting": "Cyber Resilience Act — reporting obligations",
            "cra-main": "Cyber Resilience Act — main obligations",
            "machinery-main": "Machinery Regulation — application",
            "nis2-national": "NIS2 — national transposition was due"
          },
          outsideEu: "Detailed dated orientation is limited to EU/EEA in this alpha. Other jurisdictions remain unresolved until a qualified mapping is added.",
          checked: "Sources checked",
          source: "Official source",
          boundary: "Legal overlays remain subordinate to the doctrine boundary: they may map obligations, but they do not prove applicability, restore admissibility or authorize operation. NIS2 depends on national law and the actual entity/service scope."
        }
      }
    },
    ua: {
      alpha: "Публічна альфа · самооцінка",
      lead: "Короткий скринінг меж для автоматизованих, ШІ-підсилених систем і систем із наслідками.",
      purpose: "Допомагає виявити неповний заявлений обсяг або потребу в глибшому розгляді свідчень. Не визначає відповідність, безпеку, сертифікацію, конформність чи дозвіл на експлуатацію.",
      time: "21 вибір · приблизно 6–9 хвилин",
      private: "Приватність за задумом",
      privateText: "Оцінювання та всі відповіді залишаються в цьому браузері. Робочий чернетковий стан автоматично зберігається лише в цій вкладці, тому звичайна навігація або оновлення сторінки його не стирає. Закриття вкладки або явний початок нового оцінювання очищає чернетку цієї вкладки. Лише після змістовного проходження і тільки за вашою явною згодою можна надіслати мінімальне резюме. Відповіді, бали, вільний текст, локатори свідчень і файли не завантажуються.",
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
      restart: "Почати нове оцінювання",
      restartConfirm: "Почати нове оцінювання і стерти поточну чернетку цієї вкладки? Якщо вона ще може знадобитися, спочатку експортуйте JSON робочого простору.",
      session: {
        title: "Поточну роботу захищено",
        text: "Чернетка автоматично зберігається лише в цій вкладці браузера. Оновлення сторінки, навігація в цій вкладці та зміна мови зберігають її; закриття вкладки або початок нового оцінювання очищає її.",
        saved: "Чернетку збережено в цій вкладці"
      },
      why: {
        eyebrow: "Навіщо потрібен цей тест",
        title: "Знайдіть твердження, яке може не витримати перегляду, раніше за клієнта, регулятора, страховика чи аудитора",
        text: "Скринінг перетворює загальну впевненість на обмежений клас наслідків, доказовий маршрут і видимий перелік тверджень, яким досі потрібні записи або незалежне оскарження.",
        level: "Поточний рівень продукту",
        levelText: "Самозаявлена базова готовність до перегляду — не аудит і не визначення відповідності.",
        outputs: [
          "Маршрут за класом наслідків замість одного універсального бала.",
          "Переносний пакет готовності свідчень: що картовано, відкрито або виключено.",
          "Датований горизонт регуляторної підготовки й точка передачі на кваліфікований незалежний перегляд."
        ]
      },
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
        privacy: "Нічого не надсилається нам. Похідна робоча чернетка автоматично зберігається лише в цій вкладці браузера, тому навігація або оновлення сторінки її не стирає; сирий документ ніколи не зберігається. Закриття вкладки або явний початок нового оцінювання очищає чернетку вкладки. Експортуйте JSON для переносної копії. Використовуйте нейтральні посилання та не вводьте самі свідчення, персональні дані, облікові дані, відомості клієнта або операційно чутливу інформацію.",
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
        briefEyebrow: "Локальний односторінковий орієнтир для рішення",
        briefTitle: "Review Readiness Brief",
        briefPurpose: "Перетворіть цей знімок на обмежене рішення: яку проблему вирішити зараз, до п’яти доказових прогалин, строк реакції та чи виправданий обмежений професійний перегляд.",
        briefStatusLabel: "Поточна готовність",
        briefStatus: {
          "training-only": ["Навчальний знімок", "Заявлена ознайомлювальна підстава не дозволяє змістовного оцінювання. Картування нижче придатне для вивчення процесу, а не для характеристики реальної системи."],
          "context-required": ["Потрібен контекст оцінювання", "Заповніть об’єкт, версію, дату й контекст, перш ніж сприймати картування як обмежений робочий запис."],
          "sector-package-required": ["Потрібен пакет Maritime / DP", "Основний скринінг має морський обсяг, але галузевий пакет ще не приєднано. Імпортуйте відповідний JSON мосту або завершіть міст у цій вкладці."],
          "priority-open": ["Відкрита пріоритетна робота зі свідченнями", "Контекст знімка обмежено, але одне або кілька критичних питань доктрини ще не мають придатного для перегляду картування."],
          "mapping-open": ["Картування свідчень відкрите", "Критичних прогалин картування не залишилося, але робочий запис іще не завершено."],
          "mapping-complete": ["Картування завершено — перегляд усе ще потрібен", "Локальні поля картування заповнено. Це не перевірка; однаково потрібен належно незалежний перегляд."]
        },
        briefObject: "Об’єкт",
        briefVersion: "Версія / конфігурація",
        briefDate: "Дата оцінювання",
        briefBasis: "Заявлена підстава відповідей",
        notProvided: "Не вказано",
        briefPainTitle: "Проблема, яку слід вирішити зараз",
        briefPain: {
          exploratory: "Цей запуск не може підтримувати реальне рішення, бо підстава відповідей була ознайомлювальною. Повторіть його для одного обмеженого об’єкта.",
          unknown: "Найвищий достовірний наслідок не визначено. Поки його не обмежено, неможливо обрати глибину перегляду та безпечну точку покладання.",
          live: "На об’єкт уже покладаються в робочій експлуатації, хоча суттєві твердження можуть не мати актуальних, атрибутованих і придатних до незалежного оскарження свідчень.",
          pilot: "Наступний тест може повторити ті самі доказові прогалини й створити хибну впевненість, якщо відкриті контролі не закрити або явно не обмежити заздалегідь.",
          design: "Закупівля або розгортання можуть зафіксувати непідтверджені припущення щодо застосовності, повноважень чи контролю, поки зміни ще відносно дешеві.",
          concept: "Це найдешевший момент, щоб відокремити заплановані контролі від тверджень, які вже мають придатну для перегляду доказову підставу.",
          lower: "Негайна цінність — пропорційна впевненість: зафіксувати, чому глибша ескалація не спрацьовує, й уникнути як хибної впевненості, так і зайвої контрольної роботи."
        },
        briefStageTitle: "Поточний етап підготовки",
        briefTimingTitle: "Строк реакції",
        briefAsOf: "Горизонт перевірено",
        briefGapsTitle: "Пріоритетні прогалини до наступного покладання",
        briefNoGaps: "У цьому знімку не залишилося структурних прогалин картування. До зовнішнього покладання однаково потрібні перевірка та належно незалежне оскарження.",
        briefGapActionLabel: "Закрити",
        briefGap: {
          consequenceAxis: "Межа наслідків",
          consequenceTitle: "Найвищий достовірний шлях наслідків ще не обмежено.",
          consequenceAction: "Підтвердьте найвищий достовірний шлях із відповідальним власником до вибору глибини перегляду.",
          contextAxis: "Межа оцінювання",
          contextTitle: "Об’єкт, версію, дату або контекст використання визначено не повністю.",
          regulatoryAxis: "Правова орієнтація",
          regulatoryTitle: "Юрисдикція, ринкова роль або запропонований регуляторний профіль ще потребують підтвердження.",
          regulatoryAction: "Підтвердьте профіль і передайте питання застосовності на кваліфікований правовий або галузевий перегляд.",
          maritimeAxis: "Галузевий пакет",
          maritimeTitle: "Пакет свідчень Maritime / DP не приєднано до цього робочого запису."
        },
        briefRecommendationTitle: "Рекомендоване рішення",
        briefRecommendation: {
          restart: "Повторіть скринінг для одного реального обмеженого об’єкта. Не замовляйте змістовний перегляд на підставі цього ознайомлювального запуску.",
          bound: "Спочатку завершіть межу оцінювання та клас наслідків. Це захищає від оплати широкого перегляду, який не зможе дійти захищуваного висновку.",
          prepare: "Закрийте перелічені прогалини, експортуйте обмежений пакет і передайте його на обмежений перегляд готовності свідчень до зазначеного строку.",
          review: "Підготуйте обмежений пакет зараз і замовте обмежений перегляд готовності свідчень до зазначеного строку. Перегляд має оскаржити джерела, повноваження, commit-шляхи й топологію, а не повторювати бал.",
          challenge: "Картування готове до належно незалежного оскарження. Перевірте записи, конфлікти та застосовність до будь-якого зовнішнього твердження чи операційного висновку."
        },
        briefReviewTitle: "Чому обмежений професійний перегляд може бути виправданим",
        briefReviewReason: {
          consequence: "Заявлений клас наслідків робить непідтверджене твердження матеріально дорогим.",
          lifecycle: "Пілотний або робочий контекст скорочує час для виявлення й виправлення хибного припущення.",
          priority: "{count} критичних доктринальних записів залишаються відкритими на межі передачі.",
          regulatory: "Датований правовий горизонт є лише орієнтиром, доки роль і застосовність не перевірено на фактах реального продукту та ринку.",
          independence: "{count} джерел позначено незалежними, але ця незалежність поки самозаявлена й потребує зовнішнього підтвердження.",
          concentration: "Одна група джерел підтримує більшість картованих тверджень, що підвищує корельований доказовий ризик.",
          complete: "Завершене картування — правильний момент для оскарження: рецензент може перевіряти визначені твердження, а не відновлювати обсяг з нуля.",
          default: "Обмежене зовнішнє оскарження може перевірити, чи витримають заявлені свідчення перевірку клієнта, регулятора, страховика або аудитора."
        },
        briefReviewScope: "Мінімальний професійний обсяг: оскаржити межу; простежити 3–5 тверджень із найвищим ризиком; перевірити ідентичність, актуальність, конфлікти й незалежність джерел; видати датовані висновки з явними hold points.",
        briefDoctrineLabel: "Доктринальний ланцюг рішення",
        briefDoctrine: "Обсяг і застосовність → повноваження → commit → свідчення й наслідок → топологія → drift і runtime.",
        briefCta: "Обговорити обмежений перегляд",
        nextActionsTitle: "Рекомендовані наступні дії",
        nextAction: {
          "rerun-substantive": "Повторіть скринінг для одного реального об’єкта на підставі записів, які можна визначити, або заявленої змішаної підстави.",
          "complete-context": "Заповніть нейтральне позначення об’єкта, версію, дату й контекст оцінювання.",
          "add-maritime-package": "Приєднайте відповідний міст Maritime / DP, перш ніж вважати робочий простір повним галузевим записом.",
          "resolve-priority-records": "Почніть із пріоритетних відкритих записів: класифікуйте кожне джерело, додайте контрольований локатор і перевірте актуальність та конфлікти.",
          "complete-open-records": "Завершіть решту відкритих картувань або явно обґрунтуйте їхні межі обсягу.",
          "independent-review": "Передайте обмежений знімок і контрольовані локатори записів належно незалежному рецензенту."
        },
        priorityPreviewTitle: "Перші пріоритетні питання",
        noPriorityPreview: "Відкритих пріоритетних елементів картування немає.",
        briefBoundary: "Цей огляд аналізує лише структуру й заявлений стан локального знімка. Він не читає, не завантажує й не перевіряє самі свідчення та не є аудитом, висновком про відповідність чи безпеку або авторизацією.",
        printBrief: "Друкувати односторінковий brief",
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
        importMaritimeSuccess: "Відповідний пакет Maritime / DP додано до цього робочого простору",
        importMaritimeStandalone: "Пакет Maritime / DP завантажено; 17 основних записів залишаються відкритими, доки не буде додано відповідний основний знімок або картування",
        importFailed: "Не вдалося відновити знімок",
        importTooLarge: "Розмір знімка перевищує локальне обмеження 512 КБ",
        replaceConfirm: "Замінити поточний робочий простір Tier 1 обраним знімком?",
        mergeMaritimeConfirm: "Додати цей відповідний пакет Maritime / DP до поточного робочого простору?",
        example: "Завантажити нейтральний приклад",
        exampleConfirm: "Замінити поточний робочий простір явно вигаданим навчальним прикладом?",
        exampleLoaded: "Вигаданий навчальний приклад завантажено",
        print: "Друкувати повний пакет картування",
        back: "Назад до результату — зберегти цю роботу",
        clear: "Скинути робочий простір",
        clearConfirm: "Скинути всі поля Tier 1 у цій вкладці? Скасувати це неможливо, якщо знімок ще не експортовано.",
        exported: "Знімок JSON завантажено",
        exportBoundary: "JSON є переносним робочим записом самооцінки, а не аудиторським артефактом, пакетом доказів чи об’єктом авторизації.",
        packageTitle: "Пакети свідчень",
        corePackage: "Основний доктринальний пакет",
        maritimePackage: "Галузевий пакет Maritime / DP",
        packageAttached: "Приєднано",
        packageMissing: "Не приєднано",
        packageRoute: "Галузевий маршрут",
        packageRelation: "Операційний зв’язок",
        packageLocus: "Locus керування",
        coreMapTitle: "Карта свідчень основної доктрини",
        maritimeMapTitle: "Карта свідчень Maritime / DP",
        version: "Версія робочого простору",
        emptyOutcome: "Порожній робочий простір",
        current: "поточне картування",
        independentHint: "Використовуйте клас «незалежне» лише для джерела, автор, метод і стимули якого достатньо відокремлені від власника твердження. Вибір цієї мітки тут не встановлює незалежність.",
        reviewSignals: {
          title: "Сигнали якості перегляду",
          clear: "За введеними локаторами не виявлено сигналів концентрації джерела або незалежності. Це однаково не перевіряє свідчення.",
          singleSource: "Одна група джерел підтримує {count} картованих записів. Розділіть твердження між контрольованими записами або додайте підтвердження до зовнішнього покладання.",
          independence: "{count} запис(ів) позначено як незалежні. Тут незалежність є самозаявленою; її слід підтвердити за власністю джерела, методом і стимулами.",
          document: "Локально просканований документ запропонував кандидати локаторів; збіги фраз не встановлюють якість запису або дієвість контролю."
        },
        value: {
          eyebrow: "Поточний рівень продукту",
          title: "Базова готовність до перегляду — не незалежний аудит",
          promise: "Виявіть твердження, яке найімовірніше не витримає доказового перегляду, раніше за клієнта, регулятора, страховика чи аудитора.",
          now: "Що ви отримуєте зараз",
          nowItems: [
            "Карту підтриманих, відкритих і виключених тверджень за класом наслідків — без приховування прогалин в одному балі.",
            "Переносний пакет готовності до перегляду з контрольованими локаторами, пріоритетними діями та стислим оглядом.",
            "Датований горизонт підготовки EU/EEA поруч зі станом свідчень і явними межами застосовності."
          ],
          future: "Комерційний маршрут після калібрування",
          futureItems: [
            "Обмежений перегляд готовності свідчень, який оскаржує карту й готує контрольовану передачу.",
            "Кваліфіковані правові, галузеві та справді незалежні маршрути перегляду за окремим обсягом.",
            "Приватні кабінети, історія команди й контрольовані багатофайлові робочі простори після калібрування публічної альфи."
          ],
          cta: "Обговорити обмежений перегляд готовності свідчень",
          boundary: "Називайте цей результат базовою готовністю до аудиту або перегляду. Не називайте його незалежним аудитом: публічна альфа не перевіряє самі свідчення, не тестує контролі й не встановлює незалежність рецензента. Тест залишається безкоштовним; будь-яка професійна взаємодія потребує окремого обсягу, перевірки компетентності й незалежності."
        },
        document: {
          intro: "Почати з DOCX",
          eyebrow: "Локальний вхід документа · безкоштовна публічна альфа",
          title: "Спочатку просто додайте документ",
          purpose: "Додайте до трьох DOCX по одному. Браузер заповнить лише те, що може обґрунтувати з документів, для решти покаже «недостатньо даних» і поставить мінімум безпечних запитань.",
          choose: "Обрати й проаналізувати DOCX",
          add: "Додати підтверджувальний DOCX",
          maxReached: "Досягнуто максимум — 3 документи",
          apply: "Застосувати кандидати локаторів",
          applied: "кандидатів локаторів додано; стан свідчень залишається відкритим",
          spec: "До 3 файлів DOCX · до 10 МБ кожен · без макросів і захисту паролем",
          privacy: "Кожен файл читається тільки після вашого вибору. Ми не завантажуємо, не передаємо й не зберігаємо його. Байти й сирий текст відкидаються одразу після локального аналізу; у цій вкладці залишаються лише похідні метадані й локатори розділів.",
          analyzing: "Обраний документ читається локально…",
          ready: "Локальне сканування завершено",
          documentNumber: "Документ",
          file: "Обраний файл",
          titleLabel: "Визначена назва",
          versionLabel: "Визначена версія",
          pages: "Сторінки за метаданими документа",
          words: "Слова",
          paragraphs: "Читабельні абзаци",
          headings: "Заголовки",
          cues: "Кандидати розділів доктрини",
          combinedCues: "Найкращі спільні кандидати розділів",
          cueMatches: "відповідних абзаців",
          suggestion: "Запропонований контекст",
          coverage: "Сигнали доктринальної структури",
          axesFound: "осей знайдено",
          missingAxes: "Ще немає сигналу для",
          statusEyebrow: "Автоматична орієнтація",
          statuses: {
            empty: ["Очікується документ", "Додайте DOCX, щоб почати локальну орієнтацію."],
            insufficient: ["Недостатньо даних", "Документ дав корисні сигнали, але ще не дозволяє безпечно обрати глибину перегляду. Дайте короткі відповіді або додайте підтверджувальний документ."],
            partial: ["Часткова орієнтація", "Структури вже достатньо, щоб почати картування, але суттєві прогалини залишаються явними."],
            bounded: ["Обмежена орієнтація готова", "Контексту й структури документів достатньо для підготовки карти свідчень. Нічого не перевірено й не прийнято як свідчення."]
          },
          quickTitle: "Відповідайте лише на те, що документ не може безпечно вирішити",
          quickHint: "Ці відповіді одразу оновлюють орієнтацію. Після цього можна додати інший документ; попередній аналіз залишиться в цій вкладці.",
          quickConsequence: "Найвищий достовірний наслідок",
          quickSector: "Контекстна лінза",
          quickLifecycle: "Поточний життєвий цикл",
          needsTitle: "Що система ще очікує від вас",
          gaps: {
            document: "Додайте DOCX, щоб отримати локальні метадані й підказки розділів.",
            consequence: "Підтвердьте найвищий достовірний наслідок; формулювання документа не може безпечно визначити його.",
            object: "Назвіть конкретний об’єкт оцінювання в полях контексту нижче.",
            version: "Введіть або підтвердьте оцінювану версію в полях контексту нижче.",
            context: "Підтвердьте нейтральний контекст оцінювання.",
            jurisdiction: "Обмежте юрисдикцію або ринок у регуляторному розділі.",
            "market-role": "Підтвердьте можливу ринкову роль у регуляторному розділі.",
            confirmation: "Підтвердьте відредагований регуляторний профіль для цього робочого контексту.",
            "missing-axes": "Додайте релевантний підтверджувальний документ або залиште відсутні осі явно невизначеними.",
            "evidence-review": "Перегляньте кожен кандидат локатора: стан запису, клас свідчення, актуальність і конфлікти."
          },
          boundary: "Збіг фрази або заголовка не доводить застосовність, допустимість, дієвість контролю, безпеку чи відповідність. Застосування локатора ніколи не змінює стан свідчення.",
          errors: {
            "document-type-unsupported": "У цій альфі підтримуються лише файли .docx.",
            "document-file-empty": "Обраний файл порожній.",
            "document-file-too-large": "Розмір обраного файлу перевищує 10 МБ.",
            "document-file-limit": "До цієї локальної орієнтації вже додано три документи.",
            "document-file-duplicate": "Цей документ уже включено до локальної орієнтації.",
            "docx-macros-unsupported": "Документи з макросами не приймаються.",
            "docx-decompression-unavailable": "Цей браузер не може виконати локальне сканування DOCX.",
            "docx-no-readable-text": "У документі не знайдено читабельного тексту.",
            default: "Не вдалося локально проаналізувати DOCX. Він може бути зашифрованим, пошкодженим або непідтримуваним."
          },
          termsTitle: "Умови публічної альфи",
          termsItems: [
            "Тест безкоштовний, добровільний і під час калібрування працює без кабінету.",
            "Не обирайте файли з персональною, конфіденційною, клієнтською, судновою, безпеково чутливою або живою операційною інформацією.",
            "Файл не читається до вашого вибору; сайт не завантажує й не зберігає його.",
            "Автоматичні підказки можуть помилятися. Ви підтверджуєте обсяг і кожен локатор.",
            "Результати є засобом підготовки, а не юридичною порадою, висновком про відповідність чи безпеку або авторизацією.",
            "Відгуки можуть використовуватися для поліпшення тесту; кабінети й комерційні маршрути перегляду можуть розглядатися пізніше."
          ]
        },
        regulatory: {
          eyebrow: "Регуляторна орієнтація · EU/EEA alpha",
          title: "Горизонт підготовки — не бал відповідності",
          purpose: "Обмежте ймовірну роль і сигнали продукту, а потім зіставте підготовку свідчень з офіційними поточними та майбутніми датами. Застосовність однаково потребує кваліфікованого правового й галузевого аналізу.",
          jurisdiction: "Юрисдикція / ринок",
          jurisdictionOptions: [["unresolved", "Ще не визначено"], ["eu-eea", "EU / EEA"], ["uk", "Сполучене Королівство"], ["us", "Сполучені Штати"], ["other", "Інша / кілька юрисдикцій"]],
          marketRole: "Можлива ринкова роль",
          marketRoleOptions: [["unresolved", "Ще не визначено"], ["provider", "Провайдер / виробник"], ["integrator", "Інтегратор / постачальник компонента"], ["operator", "Deployer / оператор"], ["advisory", "Внутрішнє або консультативне використання"]],
          ai: "Функція ШІ",
          digitalProduct: "Продукт із цифровими елементами",
          machinery: "Машинне обладнання або регульований продукт",
          nis2Entity: "Потенційна NIS2-сутність / послуга",
          triOptions: [["unknown", "Невідомо"], ["yes", "Можливо / так"], ["no", "Ні в заявленому обсязі"]],
          confirm: "Підтвердити цей профіль",
          confirmed: "Профіль підтверджено для цього робочого контексту",
          unconfirmed: "Підказки документа або зміни ще потребують вашого підтвердження",
          level: "Рівень підготовки",
          levels: ["0 · обсяг не визначено", "1 · орієнтація в зобов’язаннях", "2 · підготовка свідчень", "3 · готовність до кваліфікованого перегляду"],
          levelBoundary: "Рівень 3 означає, що картування можна передати кваліфікованому рецензенту. Це не означає відповідність, безпеку, сертифікацію чи авторизацію.",
          urgency: "Рекомендований строк",
          urgencyLabels: { now: "Зараз — до подальшого покладання або експлуатації", "before-next-test": "До наступного пілота або тесту", "before-deployment": "До розгортання або фіксації закупівлі", "before-claim": "До зовнішнього твердження, договору або покладання" },
          horizon: "Офіційний горизонт",
          current: "Поточне",
          future: "Майбутнє",
          applicability: { yes: "сигнал обсягу: можливий", unknown: "сигнал обсягу: не визначено" },
          milestones: {
            "ai-act-current": "EU AI Act — фаза загального застосування й нагляду",
            "ai-act-annex-iii": "EU AI Act — правила високого ризику Annex III",
            "ai-act-product": "EU AI Act — високоризиковий ШІ у регульованих продуктах",
            "cra-reporting": "Cyber Resilience Act — зобов’язання зі звітування",
            "cra-main": "Cyber Resilience Act — основні зобов’язання",
            "machinery-main": "Machinery Regulation — застосування",
            "nis2-national": "NIS2 — строк національної транспозиції минув"
          },
          outsideEu: "Детальна датована орієнтація в цій альфі обмежена EU/EEA. Інші юрисдикції залишаються невизначеними до додавання кваліфікованого картування.",
          checked: "Джерела перевірено",
          source: "Офіційне джерело",
          boundary: "Правові overlay залишаються підпорядкованими доктринальній межі: вони можуть картувати зобов’язання, але не доводять застосовність, не відновлюють допустимість і не дозволяють експлуатацію. NIS2 залежить від національного права й фактичного обсягу сутності або послуги."
        }
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
    rows: [],
    maritime: null
  };
  const emptyDocumentIntake = (quickMode = false) => ({ status: "empty", report: null, reports: [], error: "", quickMode });
  let documentIntake = emptyDocumentIntake();
  let regulatoryProfile = emptyRegulatoryProfile();
  let publicAggregate = { status: "idle", data: null };
  let contributionConsent = false;
  let contributionStatus = "idle";
  let contributionToken = null;
  const SESSION_SCHEMA = "goto-calm:screening-tab-draft:0.1";
  const SESSION_KEY = "goto-calm:screening-tab-draft";
  const VALID_PHASES = new Set(["intro", "routing", "questions", "basis", "results", "maritime-routing", "maritime-questions", "maritime-results", "workspace"]);
  const total = QUESTIONS.length + 4;
  const questionById = Object.fromEntries(QUESTIONS.map((question) => [question.id, question]));
  const maritimeQuestionById = Object.fromEntries(MARITIME_QUESTIONS.map((question) => [question.id, question]));
  const maritimeTotal = MARITIME_QUESTIONS.length + 2;

  function hasMeaningfulDraft() {
    return state.phase !== "intro" ||
      Object.keys(state.answers).length > 0 ||
      Object.keys(state.maritimeAnswers).length > 0;
  }

  function sessionSnapshot() {
    return {
      schema: SESSION_SCHEMA,
      savedAt: new Date().toISOString(),
      state,
      workspace,
      documentIntake: documentIntake.status === "ready" || documentIntake.reports?.length
        ? { ...documentIntake, status: "ready", report: documentIntake.reports?.at(-1) || documentIntake.report, error: "" }
        : emptyDocumentIntake(documentIntake.quickMode),
      regulatoryProfile,
      workspaceActionFilter,
      contribution: { status: contributionStatus, token: contributionToken }
    };
  }

  function persistSession() {
    try {
      if (!hasMeaningfulDraft()) {
        window.sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionSnapshot()));
    } catch {
      // The assessment remains usable when browser storage is unavailable.
    }
  }

  function clearPersistedSession() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // No action is needed when browser storage is unavailable.
    }
  }

  function restoreSession() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (saved?.schema !== SESSION_SCHEMA || !saved.state || !VALID_PHASES.has(saved.state.phase)) {
        clearPersistedSession();
        return false;
      }
      Object.assign(state, saved.state, {
        answers: saved.state.answers && typeof saved.state.answers === "object" ? saved.state.answers : {},
        maritimeAnswers: saved.state.maritimeAnswers && typeof saved.state.maritimeAnswers === "object" ? saved.state.maritimeAnswers : {}
      });
      if (saved.workspace?.screening && Array.isArray(saved.workspace.rows)) workspace = saved.workspace;
      if (saved.documentIntake?.status === "ready") {
        const savedReports = Array.isArray(saved.documentIntake.reports)
          ? saved.documentIntake.reports
          : [saved.documentIntake.report].filter(Boolean);
        const reports = savedReports
          .filter((report) => report?.retainedContent === "derived-metadata-and-section-locators-only")
          .slice(0, DOCUMENT_MAX_FILES);
        if (reports.length) {
          documentIntake = {
            status: "ready",
            report: reports.at(-1),
            reports,
            error: "",
            quickMode: Boolean(saved.documentIntake.quickMode)
          };
        }
      }
      if (saved.regulatoryProfile && typeof saved.regulatoryProfile === "object") {
        regulatoryProfile = { ...emptyRegulatoryProfile(), ...saved.regulatoryProfile };
      }
      if (["all", "priority", "scope"].includes(saved.workspaceActionFilter)) workspaceActionFilter = saved.workspaceActionFilter;
      if (["sent", "duplicate", "error"].includes(saved.contribution?.status)) contributionStatus = saved.contribution.status;
      if (typeof saved.contribution?.token === "string" && saved.contribution.token.length <= 96) contributionToken = saved.contribution.token;
      workspaceNotice = t.session.saved;
      return true;
    } catch {
      clearPersistedSession();
      return false;
    }
  }

  function prependSessionGuard() {
    if (state.phase === "intro" || root.querySelector(".gc-session-guard")) return;
    root.insertAdjacentHTML("afterbegin", `
      <aside class="gc-session-guard" role="status">
        <span aria-hidden="true">●</span>
        <div><strong>${t.session.title}</strong><p>${t.session.text}</p></div>
      </aside>`);
  }

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
    render();
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
    render();
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
          <button class="gc-button gc-button-primary" type="button" data-action="document-intake">${t.workspace.document.intro}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="open-workspace-blank">${t.workspace.openBlank}</button>
          <button class="gc-button gc-button-quiet" type="button" data-action="workspace-import">${t.workspace.import}</button>
          <input type="file" accept="application/json,.json" data-workspace-import hidden>
        </div>
        ${renderAlphaTerms()}
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
    prependSessionGuard();
    persistSession();
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
        <section class="gc-panel gc-why-panel" aria-labelledby="gc-why-title">
          <div>
            <p class="gc-eyebrow">${t.why.eyebrow}</p>
            <h3 id="gc-why-title">${t.why.title}</h3>
            <p>${t.why.text}</p>
          </div>
          <div class="gc-why-level">
            <span>${t.why.level}</span>
            <strong>${t.why.levelText}</strong>
            <ul>${t.why.outputs.map((item) => `<li>${item}</li>`).join("")}</ul>
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

  function startWorkspace(blank = false, quickMode = false) {
    if (blank) {
      state.consequenceClass = "unknown";
      state.sectorContext = "general";
      state.lifecycle = "concept";
      state.responseBasis = "mixed";
      state.answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, "unknown"]));
    }
    const screeningResult = evaluateScreening(state);
    const maritime = !blank &&
      state.sectorContext === "maritime" &&
      state.maritimeRelation &&
      state.maritimeLocus &&
      MARITIME_QUESTIONS.every((question) => state.maritimeAnswers[question.id])
      ? createMaritimeEvidencePackage(currentMaritimeResult())
      : null;
    workspace = {
      context: {
        referenceLabel: "",
        assessedVersion: "",
        assessmentDate: localDate(),
        contextLabel: ""
      },
      screening: screeningResult,
      rows: createEvidenceRows(state.answers),
      maritime
    };
    documentIntake = emptyDocumentIntake(quickMode);
    regulatoryProfile = emptyRegulatoryProfile();
    workspaceNotice = "";
    workspaceActionFilter = "all";
    state.phase = "workspace";
    render();
  }

  function openOrResumeWorkspace() {
    if (workspace.screening && Array.isArray(workspace.rows) && workspace.rows.length) {
      state.phase = "workspace";
      workspaceNotice = t.session.saved;
      render();
      return;
    }
    startWorkspace(false);
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
      rows,
      maritime: null
    };
    documentIntake = emptyDocumentIntake();
    regulatoryProfile = emptyRegulatoryProfile();
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
      const payload = JSON.parse(await file.text());
      const maritimeOnly = payload.schema === MARITIME_BRIDGE_SCHEMA;
      const imported = maritimeOnly ? parseMaritimeBridgeImport(payload) : parseEvidenceWorkspaceImport(payload);
      let nextWorkspace;
      let notice = t.workspace.importSuccess;
      if (maritimeOnly && state.phase === "workspace" && workspace.screening?.sectorContext === "maritime") {
        if (!window.confirm(t.workspace.mergeMaritimeConfirm)) return;
        nextWorkspace = mergeMaritimeBridgeIntoWorkspace(workspace, imported);
        notice = t.workspace.importMaritimeSuccess;
      } else {
        if (state.phase === "workspace" && !window.confirm(t.workspace.replaceConfirm)) return;
        nextWorkspace = {
          context: imported.context,
          screening: imported.screening,
          rows: imported.rows,
          maritime: imported.maritime || null
        };
        if (maritimeOnly) {
          notice = t.workspace.importMaritimeStandalone;
        } else if (!nextWorkspace.maritime && workspace.maritime && nextWorkspace.screening.sectorContext === "maritime") {
          nextWorkspace = mergeMaritimeBridgeIntoWorkspace(nextWorkspace, {
            screening: workspace.screening,
            maritime: workspace.maritime
          });
          notice = t.workspace.importMaritimeSuccess;
        }
      }
      workspace = nextWorkspace;
      documentIntake = emptyDocumentIntake();
      regulatoryProfile = emptyRegulatoryProfile();
      state.consequenceClass = imported.screening.consequenceClass;
      state.sectorContext = workspace.screening.sectorContext;
      state.lifecycle = imported.screening.lifecycle;
      state.responseBasis = imported.screening.responseBasis;
      state.answers = Object.fromEntries(workspace.rows.map((row) => [row.questionId, row.sourceAnswer]));
      if (workspace.maritime) {
        state.maritimeRelation = workspace.maritime.operationalRelation;
        state.maritimeLocus = workspace.maritime.controlLocus;
        state.maritimeAnswers = Object.fromEntries(workspace.maritime.rows.map((row) => [row.questionId, row.sourceAnswer]));
      } else {
        state.maritimeRelation = null;
        state.maritimeLocus = null;
        state.maritimeAnswers = {};
      }
      workspaceActionFilter = "all";
      workspaceNotice = notice;
      state.phase = "workspace";
      render();
    } catch (error) {
      setWorkspaceNotice(`${t.workspace.importFailed}: ${error.message}`);
    }
  }

  function pairOptions(items, selected) {
    return items.map(([value, label]) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`
    ).join("");
  }

  function renderAlphaTerms() {
    return `
      <details class="gc-alpha-terms">
        <summary>${t.workspace.document.termsTitle}</summary>
        <ul>${t.workspace.document.termsItems.map((item) => `<li>${item}</li>`).join("")}</ul>
      </details>`;
  }

  function friendlyDocumentError(error) {
    const key = String(error?.message || "");
    return t.workspace.document.errors[key] || t.workspace.document.errors.default;
  }

  function documentDescriptorKey(file) {
    return [file?.name || "", Number(file?.size || 0), Number(file?.lastModified || 0)].join(":");
  }

  function reportDescriptorKey(report) {
    const modified = report?.file?.lastModified ? Date.parse(report.file.lastModified) : 0;
    return [report?.file?.name || "", Number(report?.file?.size || 0), Number.isFinite(modified) ? modified : 0].join(":");
  }

  function mergeDocumentRegulatoryProfiles(reports) {
    const profiles = reports.map((report) => report?.suggestions?.regulatoryProfile).filter(Boolean);
    const consensus = (field, unresolved) => {
      const values = [...new Set(profiles.map((profile) => profile[field]).filter((value) => value && value !== unresolved))];
      return values.length === 1 ? values[0] : unresolved;
    };
    const triState = (field) => {
      const values = profiles.map((profile) => profile[field]).filter(Boolean);
      if (values.includes("yes")) return "yes";
      if (values.length && values.every((value) => value === "no")) return "no";
      return "unknown";
    };
    return {
      jurisdiction: consensus("jurisdiction", "unresolved"),
      marketRole: consensus("marketRole", "unresolved"),
      ai: triState("ai"),
      digitalProduct: triState("digitalProduct"),
      machinery: triState("machinery"),
      nis2Entity: triState("nis2Entity"),
      confirmed: false
    };
  }

  async function analyzeDocumentFile(file) {
    if (!file) return;
    const existingReports = Array.isArray(documentIntake.reports) ? documentIntake.reports : [];
    if (existingReports.length >= DOCUMENT_MAX_FILES) {
      documentIntake = { ...documentIntake, status: "ready", error: friendlyDocumentError(new Error("document-file-limit")) };
      renderWorkspace();
      return;
    }
    if (existingReports.some((report) => reportDescriptorKey(report) === documentDescriptorKey(file))) {
      documentIntake = { ...documentIntake, status: "ready", error: friendlyDocumentError(new Error("document-file-duplicate")) };
      renderWorkspace();
      return;
    }
    documentIntake = { ...documentIntake, status: "analyzing", error: "" };
    workspaceNotice = "";
    renderWorkspace();
    let bytes;
    try {
      bytes = await file.arrayBuffer();
      const report = await analyzeDocxArrayBuffer({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      }, bytes);
      bytes = null;
      const reports = [...existingReports, report];
      documentIntake = { ...documentIntake, status: "ready", report, reports, error: "" };
      if (!workspace.context.referenceLabel.trim()) workspace.context.referenceLabel = report.suggestions.referenceLabel;
      if (!workspace.context.assessedVersion.trim()) workspace.context.assessedVersion = report.suggestions.assessedVersion;
      if (!workspace.context.contextLabel.trim()) workspace.context.contextLabel = report.suggestions.contextLabel;
      if (documentIntake.quickMode && existingReports.length === 0) {
        state.sectorContext = report.suggestions.sectorContext;
        state.lifecycle = report.suggestions.lifecycle;
        workspace.screening = evaluateScreening(state);
      }
      const suggestedProfile = mergeDocumentRegulatoryProfiles(reports);
      const currentProfile = { ...emptyRegulatoryProfile(), ...regulatoryProfile };
      regulatoryProfile = Object.fromEntries(Object.entries(suggestedProfile).map(([field, value]) => {
        if (field === "confirmed") return [field, false];
        const unresolved = ["jurisdiction", "marketRole"].includes(field) ? "unresolved" : "unknown";
        return [field, currentProfile[field] !== unresolved ? currentProfile[field] : value];
      }));
    } catch (error) {
      bytes = null;
      documentIntake = {
        ...documentIntake,
        status: existingReports.length ? "ready" : "error",
        report: existingReports.at(-1) || null,
        reports: existingReports,
        error: friendlyDocumentError(error)
      };
    }
    renderWorkspace();
  }

  function applyDocumentLocators() {
    const suggestions = selectBestAxisSuggestions(documentIntake.reports || []);
    if (!suggestions.length) return;
    const byAxis = Object.fromEntries(suggestions.map((item) => [item.axis, item]));
    const maritimeAxisMap = {
      mode: "scope",
      control: "topology",
      authority: "authority",
      commit: "commit",
      transition: "drift",
      preservation: "consequence",
      runtime: "runtime",
      external: "evidence"
    };
    let applied = 0;
    for (const row of workspace.rows) {
      const suggestion = byAxis[row.axis];
      if (suggestion && !row.recordLocator.trim()) {
        row.recordLocator = suggestion.locator;
        applied += 1;
      }
    }
    for (const row of workspace.maritime?.rows || []) {
      const suggestion = byAxis[maritimeAxisMap[row.axis]];
      if (suggestion && !row.recordLocator.trim()) {
        row.recordLocator = suggestion.locator;
        applied += 1;
      }
    }
    workspaceNotice = `${applied} ${t.workspace.document.applied}`;
    renderWorkspace();
  }

  function renderValuePanel() {
    const value = t.workspace.value;
    const contactPath = `/doctrine-site-box/${language}/contact/`;
    const commercialLabel = language === "ua"
      ? "Варіанти професійного перегляду"
      : "Professional review options";
    return `
      <section class="gc-panel gc-value-panel" aria-labelledby="gc-value-title">
        <p class="gc-eyebrow">${value.eyebrow}</p>
        <h3 id="gc-value-title">${value.title}</h3>
        <p class="gc-value-promise">${value.promise}</p>
        <div class="gc-value-grid">
          <div><strong>${value.now}</strong><ul>${value.nowItems.map((item) => `<li>${item}</li>`).join("")}</ul></div>
          <div><strong>${value.future}</strong><ul>${value.futureItems.map((item) => `<li>${item}</li>`).join("")}</ul></div>
        </div>
        <p class="gc-hint">${value.boundary}</p>
        <div class="gc-actions">
          <a class="gc-button gc-button-primary" href="${contactPath}">${value.cta}</a>
          <a class="gc-button gc-button-secondary" href="https://gotocalm.com/engagements" target="_blank" rel="noopener noreferrer">${commercialLabel}</a>
        </div>
      </section>`;
  }

  function renderDocumentPanel(regulatoryReadiness) {
    const copy = t.workspace.document;
    const reports = Array.isArray(documentIntake.reports) ? documentIntake.reports : [];
    const assessment = buildDocumentIntakeAssessment({
      reports,
      context: workspace.context,
      screening: workspace.screening,
      profile: regulatoryReadiness.profile
    });
    const statusCopy = copy.statuses[assessment.status];
    const bestSuggestions = selectBestAxisSuggestions(reports);
    const missingAxisLabels = assessment.missingAxes.map((axisId) => {
      const axis = AXES.find((candidate) => candidate.id === axisId);
      return axis?.[language] || axisId;
    });
    const needs = [...new Set(assessment.gaps.map((gap) => copy.gaps[gap]).filter(Boolean))];
    const documentCards = reports.map((report, index) => `
      <article class="gc-document-card">
        <div>
          <span>${copy.documentNumber} ${index + 1}</span>
          <strong>${escapeHtml(report.file.name)}</strong>
          <small>${escapeHtml(report.file.type)} · ${escapeHtml(report.file.sizeLabel)} · ${report.axisSuggestions.length}/9 ${copy.axesFound}</small>
        </div>
        <dl>
          <div><dt>${copy.titleLabel}</dt><dd>${escapeHtml(report.metadata.title)}</dd></div>
          <div><dt>${copy.versionLabel}</dt><dd>${escapeHtml(report.suggestions.assessedVersion || t.workspace.notProvided)}</dd></div>
          <div><dt>${copy.suggestion}</dt><dd>${escapeHtml(t.sectors[report.suggestions.sectorContext])} · ${escapeHtml(t.contexts[report.suggestions.lifecycle])}</dd></div>
        </dl>
      </article>`).join("");
    const combinedCues = bestSuggestions.length ? `
      <details class="gc-document-cues">
        <summary>${copy.combinedCues} · ${bestSuggestions.length}/9</summary>
        <ol>${bestSuggestions.map((item) => {
          const axis = AXES.find((candidate) => candidate.id === item.axis);
          return `<li><strong>${escapeHtml(axis?.[language] || item.axis)}</strong><span>${escapeHtml(item.section)}</span><small>${escapeHtml(item.sourceFile)} · ${escapeHtml(item.locator)} · ${item.matches} ${copy.cueMatches}</small></li>`;
        }).join("")}</ol>
      </details>` : "";
    const quickQuestions = reports.length ? `
      <div class="gc-document-quick">
        <h4>${copy.quickTitle}</h4>
        <p>${copy.quickHint}</p>
        <div class="gc-document-quick-grid">
          <label>${copy.quickConsequence}<select data-document-routing-field="consequenceClass">${pairOptions(t.consequenceOptions.map(([value, code, label]) => [value, `${code} · ${label}`]), workspace.screening.consequenceClass)}</select></label>
          <label>${copy.quickSector}<select data-document-routing-field="sectorContext">${pairOptions(t.sectorOptions, workspace.screening.sectorContext)}</select></label>
          <label>${copy.quickLifecycle}<select data-document-routing-field="lifecycle">${pairOptions(t.lifecycleOptions, workspace.screening.lifecycle)}</select></label>
        </div>
      </div>` : "";
    const body = `
      <div class="gc-document-assessment gc-document-assessment-${assessment.status}" role="status">
        <div><span>${copy.statusEyebrow}</span><strong>${statusCopy[0]}</strong><p>${statusCopy[1]}</p></div>
        <div class="gc-document-coverage">
          <div><strong>${assessment.coveredAxes.length}/9</strong><span>${copy.coverage}</span></div>
          <div class="gc-document-coverage-track" role="progressbar" aria-label="${escapeHtml(copy.coverage)}" aria-valuemin="0" aria-valuemax="9" aria-valuenow="${assessment.coveredAxes.length}"><span style="width:${assessment.coveragePercent}%"></span></div>
        </div>
      </div>
      ${documentIntake.status === "analyzing" ? `<p class="gc-document-state" role="status">${copy.analyzing}</p>` : ""}
      ${documentIntake.error ? `<p class="gc-document-error" role="alert">${escapeHtml(documentIntake.error)}</p>` : ""}
      ${documentCards ? `<div class="gc-document-list">${documentCards}</div>` : ""}
      ${missingAxisLabels.length && reports.length ? `<p class="gc-document-missing"><strong>${copy.missingAxes}:</strong> ${escapeHtml(missingAxisLabels.join(" · "))}</p>` : ""}
      ${quickQuestions}
      ${combinedCues}
      ${bestSuggestions.length ? `<button class="gc-button gc-button-primary" type="button" data-action="document-apply-locators">${copy.apply}</button>` : ""}`;
    return `
      <section class="gc-panel gc-document-intake" aria-labelledby="gc-document-intake-title">
        <p class="gc-eyebrow">${copy.eyebrow}</p>
        <h3 id="gc-document-intake-title">${copy.title}</h3>
        <p>${copy.purpose}</p>
        <p class="gc-document-spec"><strong>${copy.spec}</strong></p>
        <p class="gc-hint">${copy.privacy}</p>
        <div class="gc-actions">
          <button class="gc-button ${reports.length ? "gc-button-quiet" : "gc-button-primary"}" type="button" data-action="document-select"${assessment.canAddDocument && documentIntake.status !== "analyzing" ? "" : " disabled"}>${assessment.canAddDocument ? (reports.length ? copy.add : copy.choose) : copy.maxReached}</button>
          <input type="file" accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" data-document-input hidden>
        </div>
        ${body}
        <div class="gc-document-needs">
          <h4>${copy.needsTitle}</h4>
          <ul>${needs.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
        <p class="gc-hint">${copy.boundary}</p>
        ${renderAlphaTerms()}
      </section>`;
  }

  function renderRegulatoryPanel(evaluation, readiness) {
    const copy = t.workspace.regulatory;
    const profile = readiness.profile;
    const formatDate = (value) => new Intl.DateTimeFormat(language === "ua" ? "uk-UA" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(new Date(`${value}T00:00:00Z`));
    const milestones = readiness.milestones.map((item) => `
      <li class="gc-regulatory-milestone gc-regulatory-${item.phase}">
        <span>${item.phase === "current" ? copy.current : copy.future}</span>
        <div><strong>${escapeHtml(copy.milestones[item.id])}</strong><small>${formatDate(item.date)} · ${escapeHtml(copy.applicability[item.applicability])}</small></div>
        <a href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">${copy.source}</a>
      </li>`).join("");
    return `
      <section class="gc-panel gc-regulatory" aria-labelledby="gc-regulatory-title">
        <p class="gc-eyebrow">${copy.eyebrow}</p>
        <h3 id="gc-regulatory-title">${copy.title}</h3>
        <p>${copy.purpose}</p>
        <div class="gc-regulatory-fields">
          <label>${copy.jurisdiction}<select data-regulatory-field="jurisdiction">${pairOptions(copy.jurisdictionOptions, profile.jurisdiction)}</select></label>
          <label>${copy.marketRole}<select data-regulatory-field="marketRole">${pairOptions(copy.marketRoleOptions, profile.marketRole)}</select></label>
          <label>${copy.ai}<select data-regulatory-field="ai">${pairOptions(copy.triOptions, profile.ai)}</select></label>
          <label>${copy.digitalProduct}<select data-regulatory-field="digitalProduct">${pairOptions(copy.triOptions, profile.digitalProduct)}</select></label>
          <label>${copy.machinery}<select data-regulatory-field="machinery">${pairOptions(copy.triOptions, profile.machinery)}</select></label>
          <label>${copy.nis2Entity}<select data-regulatory-field="nis2Entity">${pairOptions(copy.triOptions, profile.nis2Entity)}</select></label>
        </div>
        <div class="gc-regulatory-confirm">
          <button class="gc-button gc-button-primary" type="button" data-action="regulatory-confirm"${profile.confirmed ? " disabled" : ""}>${copy.confirm}</button>
          <span class="${profile.confirmed ? "is-confirmed" : ""}">${profile.confirmed ? copy.confirmed : copy.unconfirmed}</span>
        </div>
        <div class="gc-regulatory-summary">
          <div><span>${copy.level}</span><strong>${escapeHtml(copy.levels[readiness.level])}</strong><small>${copy.levelBoundary}</small></div>
          <div><span>${copy.urgency}</span><strong>${escapeHtml(copy.urgencyLabels[readiness.urgency])}</strong></div>
        </div>
        <h4>${copy.horizon}</h4>
        ${profile.jurisdiction === "eu-eea" ? `<ul class="gc-regulatory-timeline">${milestones || `<li>${copy.outsideEu}</li>`}</ul>` : `<p class="gc-context-warning">${copy.outsideEu}</p>`}
        <p class="gc-regulatory-as-of">${copy.checked}: ${escapeHtml(REGULATORY_HORIZON_AS_OF)}</p>
        <p class="gc-hint">${copy.boundary}</p>
      </section>`;
  }

  function contextGaps() {
    return ["referenceLabel", "assessedVersion", "assessmentDate", "contextLabel"]
      .filter((field) => !workspace.context[field].trim());
  }

  function findWorkspaceRow(rowId) {
    return workspace.rows.find((item) => item.questionId === rowId) ||
      workspace.maritime?.rows.find((item) => item.questionId === rowId) ||
      null;
  }

  function renderWorkspaceRow(row, evaluatedRow, index, questionRegistry = questionById, axes = AXES) {
    const question = questionRegistry[row.questionId];
    const source = SCALE.find((item) => item.value === row.sourceAnswer);
    const excluded = row.evidenceStatus === "excluded";
    const fieldId = `gc-evidence-${row.questionId}`;
    const actions = evaluatedRow.actions.map((action) => `<li>${t.workspace.action[action]}</li>`).join("");
    return `
      <article class="gc-evidence-row gc-evidence-${evaluatedRow.state}" data-question-id="${row.questionId}">
        <header class="gc-evidence-row-header">
          <div>
            <span class="gc-question-number">${index + 1}. ${axes.find((axis) => axis.id === row.axis)[language]}</span>
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
        ${row.evidenceClass === "independent" ? `<p class="gc-independent-hint">${t.workspace.independentHint}</p>` : ""}
        ${actions ? `<ul class="gc-row-actions">${actions}</ul>` : ""}
      </article>`;
  }

  function reviewQualityStats(evaluation) {
    const allRows = [...workspace.rows, ...(workspace.maritime?.rows || [])];
    const evaluated = [...evaluation.core.rows, ...(evaluation.sector?.rows || [])];
    const mappedIds = new Set(evaluated.filter((item) => item.state === "mapped").map((item) => item.questionId));
    const mappedRows = allRows.filter((row) => mappedIds.has(row.questionId));
    const families = new Map();
    for (const row of mappedRows) {
      const family = String(row.recordLocator || "").trim().split("#")[0].split("?")[0];
      if (family) families.set(family, (families.get(family) || 0) + 1);
    }
    const largestFamily = Math.max(0, ...families.values());
    const independentCount = allRows.filter((row) => row.evidenceStatus !== "excluded" && row.evidenceClass === "independent").length;
    return { independentCount, largestFamily, mappedCount: mappedRows.length };
  }

  function buildReviewSignals(evaluation) {
    const { independentCount, largestFamily, mappedCount } = reviewQualityStats(evaluation);
    const copy = t.workspace.reviewSignals;
    const signals = [];
    if (largestFamily >= 3 && largestFamily / Math.max(mappedCount, 1) >= 0.6) {
      signals.push(copy.singleSource.replace("{count}", String(largestFamily)));
    }
    if (independentCount > 0) signals.push(copy.independence.replace("{count}", String(independentCount)));
    if (documentIntake.report) signals.push(copy.document);
    return signals;
  }

  function briefPainKey(brief) {
    if (brief.exploratory) return "exploratory";
    if (workspace.screening.consequenceClass === "unknown") return "unknown";
    if (["informational", "limited"].includes(workspace.screening.consequenceClass) && workspace.screening.outcome === "no-escalation") return "lower";
    return ["concept", "design", "pilot", "live"].includes(workspace.screening.lifecycle)
      ? workspace.screening.lifecycle
      : "concept";
  }

  function briefRecommendationKey(brief, evaluation, regulatoryReadiness) {
    if (brief.exploratory) return "restart";
    if (workspace.screening.consequenceClass === "unknown" || brief.contextGaps.length || regulatoryReadiness.level === 0) return "bound";
    if (evaluation.summary.priorityOpen || ["enterprise", "high", "critical"].includes(workspace.screening.consequenceClass) || ["pilot", "live"].includes(workspace.screening.lifecycle)) return "review";
    if (evaluation.summary.open || brief.missingSectorPackage) return "prepare";
    return "challenge";
  }

  function buildBriefGaps(brief, evaluation, regulatoryReadiness) {
    const copy = t.workspace.briefGap;
    const items = [];
    const seen = new Set();
    const add = (item) => {
      if (!item?.id || seen.has(item.id) || items.length >= 5) return;
      seen.add(item.id);
      items.push({ ...item, urgency: regulatoryReadiness.urgency });
    };

    if (workspace.screening.consequenceClass === "unknown") {
      add({ id: "consequence-boundary", axis: copy.consequenceAxis, title: copy.consequenceTitle, actions: [copy.consequenceAction], priority: true });
    }
    if (brief.contextGaps.length) {
      add({ id: "assessment-context", axis: copy.contextAxis, title: copy.contextTitle, actions: [t.workspace.nextAction["complete-context"]], priority: true });
    }

    const addEvidenceGap = (item) => {
      const questionSet = item.packageType === "maritime-dp" ? maritimeQuestionById : questionById;
      const axes = item.packageType === "maritime-dp" ? MARITIME_EVIDENCE_AXES : AXES;
      const question = questionSet[item.questionId];
      const axis = axes.find((entry) => entry.id === item.axis);
      add({
        id: `${item.packageType}:${item.questionId}`,
        axis: axis?.[language] || item.axis,
        title: question?.[language] || item.questionId,
        actions: item.actions.slice(0, 2).map((action) => t.workspace.action[action]),
        priority: Boolean(item.priority)
      });
    };

    evaluation.openActions
      .filter((item) => item.state === "open" && item.priority)
      .forEach(addEvidenceGap);

    if (brief.missingSectorPackage) {
      add({ id: "maritime-package", axis: copy.maritimeAxis, title: copy.maritimeTitle, actions: [t.workspace.nextAction["add-maritime-package"]], priority: true });
    }
    if (regulatoryReadiness.gaps.some((gap) => ["jurisdiction", "market-role", "confirmation"].includes(gap))) {
      add({ id: "regulatory-profile", axis: copy.regulatoryAxis, title: copy.regulatoryTitle, actions: [copy.regulatoryAction], priority: false });
    }

    evaluation.openActions
      .filter((item) => item.state === "open" && !item.priority)
      .forEach(addEvidenceGap);
    evaluation.openActions
      .filter((item) => item.state === "excluded")
      .forEach(addEvidenceGap);

    return items;
  }

  function buildProfessionalReviewReasons(brief, evaluation, regulatoryReadiness) {
    const copy = t.workspace.briefReviewReason;
    const quality = reviewQualityStats(evaluation);
    const reasons = [];
    if (["enterprise", "high", "critical"].includes(workspace.screening.consequenceClass)) reasons.push(copy.consequence);
    if (["pilot", "live"].includes(workspace.screening.lifecycle)) reasons.push(copy.lifecycle);
    if (evaluation.summary.priorityOpen) reasons.push(copy.priority.replace("{count}", String(evaluation.summary.priorityOpen)));
    if (regulatoryReadiness.profile.confirmed || regulatoryReadiness.milestones.length) reasons.push(copy.regulatory);
    if (quality.independentCount) reasons.push(copy.independence.replace("{count}", String(quality.independentCount)));
    if (quality.largestFamily >= 3 && quality.largestFamily / Math.max(quality.mappedCount, 1) >= 0.6) reasons.push(copy.concentration);
    if (brief.status === "mapping-complete") reasons.push(copy.complete);
    return (reasons.length ? reasons : [copy.default]).slice(0, 4);
  }

  function renderWorkspace() {
    const evaluation = evaluateCombinedEvidenceReadiness(workspace);
    const regulatoryReadiness = buildRegulatoryReadiness({
      profile: regulatoryProfile,
      context: workspace.context,
      screening: workspace.screening,
      evaluation,
      documentReport: documentIntake.report
    });
    const brief = buildEvidenceReviewBrief(workspace);
    const reviewSignals = buildReviewSignals(evaluation);
    const briefGaps = buildBriefGaps(brief, evaluation, regulatoryReadiness);
    const reviewReasons = buildProfessionalReviewReasons(brief, evaluation, regulatoryReadiness);
    const gaps = contextGaps();
    const briefStatus = t.workspace.briefStatus[brief.status];
    const consequence = t.consequenceOptions.find(([value]) => value === workspace.screening.consequenceClass);
    const basis = t.basisOptions.find(([value]) => value === workspace.screening.responseBasis);
    const pain = t.workspace.briefPain[briefPainKey(brief)];
    const recommendation = t.workspace.briefRecommendation[briefRecommendationKey(brief, evaluation, regulatoryReadiness)];
    const contactPath = `/doctrine-site-box/${language}/contact/`;
    const valueOrMissing = (value) => escapeHtml(String(value || "").trim() || t.workspace.notProvided);
    const briefGapItems = briefGaps.map((item) => `
      <li${item.priority ? ' class="gc-brief-gap-priority"' : ""}>
        <div><span>${escapeHtml(item.axis)}</span><span>${escapeHtml(t.workspace.regulatory.urgencyLabels[item.urgency])}</span></div>
        <strong>${escapeHtml(item.title)}</strong>
        <p><b>${t.workspace.briefGapActionLabel}:</b> ${item.actions.map((action) => escapeHtml(action)).join("; ")}</p>
      </li>`).join("");
    const briefReviewReasons = reviewReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
    const filteredActions = evaluation.openActions.filter((item) => {
      if (workspaceActionFilter === "priority") return item.priority;
      if (workspaceActionFilter === "scope") return item.state === "excluded";
      return true;
    });
    const openActions = filteredActions
      .slice()
      .sort((a, b) => Number(b.priority) - Number(a.priority))
      .map((item) => {
        const question = item.packageType === "maritime-dp" ? maritimeQuestionById[item.questionId] : questionById[item.questionId];
        return `<li${item.priority ? ' class="gc-priority-action"' : ""}><strong>${question[language]}</strong><span>${item.actions.map((action) => t.workspace.action[action]).join("; ")}</span></li>`;
      }).join("");
    const groups = AXES.map((axis) => {
      const axisEvaluation = evaluation.core.byAxis.find((item) => item.id === axis.id);
      const axisRows = workspace.rows.filter((row) => row.axis === axis.id);
      const hasPriority = axisRows.some((row) => row.critical && evaluation.core.rows.find((item) => item.questionId === row.questionId)?.state === "open");
      return `
        <details class="gc-axis-group"${hasPriority ? " open" : ""}>
          <summary>
            <span>${axis[language]}</span>
            <span>${t.workspace.mapped}: ${axisEvaluation.mapped} · ${t.workspace.openItems}: ${axisEvaluation.open} · ${t.workspace.excluded}: ${axisEvaluation.excluded}</span>
          </summary>
          <div class="gc-axis-group-body">
            ${axisRows.map((row) => renderWorkspaceRow(row, evaluation.core.rows.find((item) => item.questionId === row.questionId), QUESTIONS.findIndex((question) => question.id === row.questionId))).join("")}
          </div>
        </details>`;
    }).join("");
    const maritimeGroups = workspace.maritime ? MARITIME_EVIDENCE_AXES.map((axis) => {
      const axisEvaluation = evaluation.sector.byAxis.find((item) => item.id === axis.id);
      const axisRows = workspace.maritime.rows.filter((row) => row.axis === axis.id);
      const hasPriority = axisRows.some((row) => row.critical && evaluation.sector.rows.find((item) => item.questionId === row.questionId)?.state === "open");
      return `
        <details class="gc-axis-group gc-axis-group-sector"${hasPriority ? " open" : ""}>
          <summary>
            <span>${axis[language]}</span>
            <span>${t.workspace.mapped}: ${axisEvaluation.mapped} · ${t.workspace.openItems}: ${axisEvaluation.open} · ${t.workspace.excluded}: ${axisEvaluation.excluded}</span>
          </summary>
          <div class="gc-axis-group-body">
            ${axisRows.map((row) => renderWorkspaceRow(row, evaluation.sector.rows.find((item) => item.questionId === row.questionId), MARITIME_QUESTIONS.findIndex((question) => question.id === row.questionId), maritimeQuestionById, MARITIME_EVIDENCE_AXES)).join("")}
          </div>
        </details>`;
    }).join("") : "";
    const relationLabel = workspace.maritime
      ? MARITIME_RELATIONS.find((item) => item.value === workspace.maritime.operationalRelation)?.[language]
      : "";
    const locusLabel = workspace.maritime
      ? MARITIME_LOCI.find((item) => item.value === workspace.maritime.controlLocus)?.[language]
      : "";
    const routeLabel = workspace.maritime ? t.maritime.route[workspace.maritime.route]?.[0] : "";

    root.innerHTML = `
      <section class="gc-workspace" aria-labelledby="gc-workspace-title">
        <header class="gc-panel gc-workspace-header">
          <p class="gc-eyebrow">${t.workspace.eyebrow}</p>
          <h2 id="gc-workspace-title">${t.workspace.title}</h2>
          <p class="gc-lead">${t.workspace.purpose}</p>
          <p class="gc-workspace-privacy">${t.workspace.privacy}</p>
          <p class="gc-workspace-version">${t.workspace.version}: ${EVIDENCE_WORKSPACE_VERSION}</p>
        </header>

        ${renderValuePanel()}
        ${renderDocumentPanel(regulatoryReadiness)}

        <section class="gc-panel gc-workspace-tools" aria-labelledby="gc-workspace-tools-title">
          <h3 id="gc-workspace-tools-title">${t.workspace.import}</h3>
          <p class="gc-hint">${t.workspace.importHint}</p>
          <div class="gc-actions">
            <button class="gc-button gc-button-primary" type="button" data-action="workspace-import">${t.workspace.import}</button>
            <button class="gc-button gc-button-quiet" type="button" data-action="workspace-example">${t.workspace.example}</button>
            <input type="file" accept="application/json,.json" data-workspace-import hidden>
          </div>
        </section>

        <section class="gc-panel gc-evidence-packages" aria-labelledby="gc-evidence-packages-title">
          <h3 id="gc-evidence-packages-title">${t.workspace.packageTitle}</h3>
          <div class="gc-package-grid">
            <article class="gc-package-card gc-package-attached">
              <div><strong>${t.workspace.corePackage}</strong><span>${t.workspace.packageAttached}</span></div>
              <p>${QUESTIONS.length} · ${t.workspace.mapped}: ${evaluation.core.summary.mapped} · ${t.workspace.openItems}: ${evaluation.core.summary.open}</p>
            </article>
            ${workspace.screening.sectorContext === "maritime" ? `
              <article class="gc-package-card ${workspace.maritime ? "gc-package-attached" : "gc-package-missing"}">
                <div><strong>${t.workspace.maritimePackage}</strong><span>${workspace.maritime ? t.workspace.packageAttached : t.workspace.packageMissing}</span></div>
                ${workspace.maritime ? `
                  <dl>
                    <div><dt>${t.workspace.packageRoute}</dt><dd>${escapeHtml(routeLabel)}</dd></div>
                    <div><dt>${t.workspace.packageRelation}</dt><dd>${escapeHtml(relationLabel)}</dd></div>
                    <div><dt>${t.workspace.packageLocus}</dt><dd>${escapeHtml(locusLabel)}</dd></div>
                  </dl>` : `<p>${t.workspace.nextAction["add-maritime-package"]}</p>`}
              </article>` : ""}
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
          <div class="gc-brief-decision-grid">
            <article class="gc-brief-pain">
              <h4>${t.workspace.briefPainTitle}</h4>
              <p>${pain}</p>
            </article>
            <article>
              <h4>${t.workspace.briefStageTitle}</h4>
              <strong>${t.workspace.regulatory.levels[regulatoryReadiness.level]}</strong>
              <p>${t.workspace.regulatory.levelBoundary}</p>
            </article>
            <article>
              <h4>${t.workspace.briefTimingTitle}</h4>
              <strong>${t.workspace.regulatory.urgencyLabels[regulatoryReadiness.urgency]}</strong>
              <p>${t.workspace.briefAsOf}: ${regulatoryReadiness.asOf}</p>
            </article>
          </div>
          <div class="gc-brief-metrics" aria-label="${t.workspace.summaryTitle}">
            <div><strong>${brief.summary.mapped}</strong><span>${t.workspace.mapped}</span></div>
            <div><strong>${brief.summary.open}</strong><span>${t.workspace.openItems}</span></div>
            <div><strong>${brief.summary.excluded}</strong><span>${t.workspace.excluded}</span></div>
            <div><strong>${brief.summary.priorityOpen}</strong><span>${t.workspace.priority}</span></div>
          </div>
          <section class="gc-brief-gap-section" aria-labelledby="gc-brief-gaps-title">
            <h4 id="gc-brief-gaps-title">${t.workspace.briefGapsTitle}</h4>
            ${briefGapItems ? `<ol class="gc-brief-gap-list">${briefGapItems}</ol>` : `<p>${t.workspace.briefNoGaps}</p>`}
          </section>
          <div class="gc-brief-columns gc-brief-commercial-grid">
            <article class="gc-brief-recommendation">
              <h4>${t.workspace.briefRecommendationTitle}</h4>
              <p>${recommendation}</p>
            </article>
            <article>
              <h4>${t.workspace.briefReviewTitle}</h4>
              <ul>${briefReviewReasons}</ul>
              <p class="gc-brief-review-scope">${t.workspace.briefReviewScope}</p>
            </article>
          </div>
          <div class="gc-review-signals">
            <h4>${t.workspace.reviewSignals.title}</h4>
            ${reviewSignals.length ? `<ul>${reviewSignals.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<p>${t.workspace.reviewSignals.clear}</p>`}
          </div>
          <p class="gc-brief-doctrine"><strong>${t.workspace.briefDoctrineLabel}:</strong> ${t.workspace.briefDoctrine}</p>
          <p class="gc-hint">${t.workspace.briefBoundary}</p>
          <div class="gc-actions gc-brief-actions">
            <button class="gc-button gc-button-primary" type="button" data-action="workspace-print-brief">${t.workspace.printBrief}</button>
            <a class="gc-button gc-button-quiet" href="${contactPath}">${t.workspace.briefCta}</a>
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

        ${renderRegulatoryPanel(evaluation, regulatoryReadiness)}

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
          <h3 id="gc-evidence-map-title">${t.workspace.coreMapTitle}</h3>
          ${groups}
          ${workspace.maritime ? `<h3 class="gc-sector-map-title">${t.workspace.maritimeMapTitle}</h3>${maritimeGroups}` : ""}
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
    prependSessionGuard();
    persistSession();
  }

  function exportWorkspace() {
    const payload = buildEvidenceWorkspaceExport({
      language,
      context: workspace.context,
      screening: workspace.screening,
      rows: workspace.rows,
      maritime: workspace.maritime
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
    prependSessionGuard();
    persistSession();
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
    if (action === "open-workspace") openOrResumeWorkspace();
    if (action === "open-workspace-blank") startWorkspace(true);
    if (action === "document-intake") {
      startWorkspace(true, true);
      root.querySelector("[data-document-input]")?.click();
    }
    if (action === "document-select") root.querySelector("[data-document-input]")?.click();
    if (action === "document-apply-locators") applyDocumentLocators();
    if (action === "regulatory-confirm") {
      regulatoryProfile.confirmed = true;
      workspaceNotice = t.workspace.regulatory.confirmed;
      renderWorkspace();
    }
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
      if (!window.confirm(t.restartConfirm)) return;
      clearPersistedSession();
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
      documentIntake = emptyDocumentIntake();
      regulatoryProfile = emptyRegulatoryProfile();
      workspace = {
        context: { referenceLabel: "", assessedVersion: "", assessmentDate: localDate(), contextLabel: "" },
        screening: null,
        rows: [],
        maritime: null
      };
      workspaceActionFilter = "all";
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
      const row = findWorkspaceRow(rowId);
      if (row) row.recordLocator = event.target.value;
    }
    persistSession();
  });

  root.addEventListener("focusout", (event) => {
    const rowId = event.target.dataset.workspaceRow;
    const field = event.target.dataset.workspaceField;
    if (!rowId || field !== "recordLocator") return;
    const row = findWorkspaceRow(rowId);
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
    if (event.target.matches("[data-document-input]")) {
      const [file] = event.target.files || [];
      event.target.value = "";
      await analyzeDocumentFile(file);
      return;
    }
    const documentRoutingField = event.target.dataset.documentRoutingField;
    if (documentRoutingField) {
      state[documentRoutingField] = event.target.value;
      workspace.screening = evaluateScreening(state);
      if (documentRoutingField === "sectorContext" && event.target.value !== "maritime") workspace.maritime = null;
      workspaceNotice = "";
      renderWorkspace();
      root.querySelector(`[data-document-routing-field="${documentRoutingField}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (event.target.matches("[data-workspace-action-filter]")) {
      workspaceActionFilter = event.target.value;
      renderWorkspace();
      root.querySelector("[data-workspace-action-filter]")?.focus({ preventScroll: true });
      return;
    }
    const regulatoryField = event.target.dataset.regulatoryField;
    if (regulatoryField) {
      regulatoryProfile[regulatoryField] = event.target.value;
      regulatoryProfile.confirmed = false;
      workspaceNotice = "";
      renderWorkspace();
      root.querySelector(`[data-regulatory-field="${regulatoryField}"]`)?.focus({ preventScroll: true });
      return;
    }
    const contextField = event.target.dataset.contextField;
    if (contextField) {
      workspace.context[contextField] = event.target.value;
      renderWorkspace();
      root.querySelector(`[data-context-field="${contextField}"]`)?.focus({ preventScroll: true });
      return;
    }
    const rowId = event.target.dataset.workspaceRow;
    const field = event.target.dataset.workspaceField;
    if (!rowId || !field) return;
    const row = findWorkspaceRow(rowId);
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

  restoreSession();
  render();
}
