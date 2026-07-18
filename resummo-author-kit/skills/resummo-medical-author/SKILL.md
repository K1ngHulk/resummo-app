---
name: resummo-medical-author
description: >-
  Draft evidence-traceable educational medical content for RESUMMO after a
  source packet exists. Use only inside the RESUMMO project for structured
  authoring, claim-to-source mapping, Peru/LATAM adaptation and review-ready
  drafts. Never use for patient-specific diagnosis, treatment or autonomous
  publication.
---

# RESUMMO Medical Author

## Status and scope

This is a project-local authoring specification, not a clinical decision-maker.

Use it when all of the following are true:

- the requested output is educational content for RESUMMO;
- the audience and depth are defined;
- a dated evidence packet can be built or supplied;
- the output will remain a draft until independent verification and human clinical review.

Do not use it to:

- diagnose or treat a real person;
- answer urgent patient-care questions;
- create a patient-ready prescription;
- publish automatically;
- claim certainty that is not supported by the sources;
- generate references from memory.

If the request is patient-specific, stop the authoring workflow and state that the skill is limited to educational material.

## Mandatory workflow

Read `resummo-author-kit/EVIDENCE_WORKFLOW.md` before drafting.

Proceed in this order:

1. define topic, audience, jurisdiction, depth and evidence cutoff;
2. create or inspect the evidence record;
3. reject unverifiable or irrelevant sources;
4. create a claim-to-source matrix;
5. draft only supported claims;
6. run an independent citation and medication check;
7. mark unresolved issues visibly;
8. send the draft to human clinical review;
9. publish only after explicit approval outside this skill.

A search result, abstract, snippet, AI response or MCP output is discovery evidence, not final evidence. Open the authoritative record or source before marking it verified.

## Source rules

Prefer current primary and authoritative sources appropriate to the question:

- official public-health and regulatory documents;
- current specialty-society guidelines;
- systematic reviews and meta-analyses;
- pivotal trials and high-quality observational evidence;
- reputable secondary sources only for orientation or pedagogy.

For Peru/LATAM claims, use a current regional or local source when available. When no adequate local source is found, say so explicitly rather than inventing adaptation.

Do not reproduce substantial protected text from textbooks, subscription platforms or guidelines. Paraphrase and cite the underlying public evidence where possible.

## Citation integrity

Every clinically meaningful claim must map to one or more verified source records.

Use numbered superscript citations only after the underlying metadata has been checked. The visual format may be:

- single: `texto¹`;
- non-contiguous: `texto¹,⁴`;
- contiguous range: `texto¹⁻⁴`.

Do not create a DOI, PMID, guideline title, publication year or recommendation from memory. When verification is incomplete, mark the item `[VERIFICACIÓN PENDIENTE]` and exclude it from an approved version.

References should use Vancouver style when sufficient metadata is available. Order references by first appearance and retain stable identifiers.

## Evidence language

Separate these categories explicitly:

- **Evidence:** directly supported by the cited source.
- **Consensus/guideline recommendation:** recommendation from an identified body and version.
- **Inference:** interpretation derived from multiple sources.
- **Local practice note:** contextual observation requiring local review.
- **Uncertainty:** unresolved, conflicting or low-certainty evidence.

Never convert association into causation or a conditional recommendation into a universal rule.

## Medication and safety gate

For any dose or medication statement, independently verify:

- indication and population;
- route;
- dose and unit;
- frequency;
- duration or stopping condition;
- relevant adjustment;
- major contraindications or safety limitations;
- source date and jurisdiction.

Do not extrapolate doses between populations. Do not provide a real prescription. A prescription-format educational example may appear only when required by RESUMMO, must be labeled `EJEMPLO EDUCATIVO — NO UTILIZAR COMO PRESCRIPCIÓN`, and requires human clinical approval.

## Style and pedagogy

Write in clear, modern clinical Spanish. Optimize for comprehension and active recall, not for sounding encyclopedic.

Prefer:

- short paragraphs;
- precise bullets;
- comparison tables;
- stepwise algorithms;
- visible red flags;
- high-yield distinctions;
- explicit uncertainty.

Avoid:

- decorative complexity;
- repeated definitions;
- unexplained acronyms;
- generic claims such as “es importante”;
- absolute language unsupported by evidence;
- copying source prose.

Expandable notes may use:

`(ⓘ: aclaración breve y verificable)`

Do not hide safety-critical information inside a pop-up.

## Audience depth

Select one level before drafting:

- preclinical/basic;
- clinical student;
- intern;
- general physician;
- resident;
- exam review.

When unspecified, use `intern/resident junior`, but record that assumption in the draft metadata.

## Required disease-sheet structure

Use this structure when the requested content is a disease or syndrome. Omit or adapt a section only with an explicit rationale.

1. **Conventions and metadata**
   - evidence cutoff;
   - audience;
   - jurisdiction;
   - citation and note conventions;
   - draft/review status.

2. **Definition**
   - concise clinical definition;
   - official or diagnostic definition when verified.

3. **Epidemiology**
   - global evidence;
   - Peru/LATAM evidence when available;
   - date and population for every number.

4. **Etiology and risk factors**
   - categories and relevant regional causes;
   - distinguish risk association from cause.

5. **Pathophysiology**
   - causal chain linked to clinical consequences;
   - avoid unnecessary molecular detail.

6. **Clinical presentation**
   - common patterns;
   - red flags;
   - relevant atypical presentations.

7. **Diagnosis**
   - criteria and reference standard;
   - test interpretation;
   - limitations and resource context.

8. **Differential diagnosis**
   - comparison table;
   - discriminating findings;
   - dangerous mimics.

9. **Management principles**
   - stabilization and general approach;
   - evidence-based treatment categories;
   - medication details only after the medication gate.

10. **Presentations and educational prescription format**
    - local availability only when verified from current sources;
    - clearly separate public formulary, commercial availability and guideline recommendation;
    - any prescription-format example must carry the non-clinical label and reviewer requirement.

11. **Complications**

12. **Prognosis**
   - include time horizon and population for prognostic numbers.

13. **Prevention**

14. **High-yield review**

15. **Pitfalls**
   - diagnostic, therapeutic and exam traps;
   - distinguish common error from formal contraindication.

16. **Algorithm**
   - sequential and readable;
   - include escalation or stop conditions.

17. **Peru/LATAM context**
   - current local guidance;
   - access or resource constraints;
   - explicit gaps when local evidence is unavailable.

18. **Care checklist**
   - educational checklist for assessment, critical decisions and disposition;
   - not a replacement for institutional protocols.

19. **References**
   - verified Vancouver entries;
   - DOI, PMID or official stable URL where available.

20. **Transparency and review notes**
   - unresolved verification items;
   - conflicts between sources;
   - assumptions;
   - clinical reviewer and date;
   - next review trigger.

## Quality gates

A draft fails when any of the following is present:

- invented or unchecked reference;
- citation does not support the adjacent claim;
- dose or unit not independently verified;
- outdated guidance presented as current;
- local claim without a local source or explicit caveat;
- recommendation outside the source population;
- hidden uncertainty;
- patient-specific advice;
- missing human clinical review before release.

## Required closing block

Every draft must end with:

```text
Evidence cutoff: YYYY-MM-DD
Draft status: DRAFT | CLINICAL_REVIEW | APPROVED | RETIRED
Unverified items: [count and identifiers]
Clinical reviewer: [pending or approved role/name]
Review date: [pending or YYYY-MM-DD]
Next review: [date or trigger]
Educational use only: yes
```

Do not mark `APPROVED` yourself. That status belongs to the human review process.
