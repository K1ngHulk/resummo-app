# Evidence Workflow for RESUMMO

## 1. Evidence record

Create one record per source:

| Field | Required content |
|---|---|
| Source ID | Stable local identifier such as `S01` |
| Organization or authors | Exact attribution |
| Title | Exact title |
| Publication date | Year and full date when relevant |
| Version | Guideline/version number when available |
| Stable identifier | DOI, PMID, official URL or document code |
| Access date | Date the source was checked |
| Population | Population actually covered |
| Claims supported | Specific claims the source supports |
| Limitations | Scope, uncertainty, conflicts or outdated sections |
| Verification status | `VERIFIED`, `PARTIAL`, `UNVERIFIED` or `REJECTED` |

A citation is not verified merely because its syntax looks valid. Open the source or authoritative index and confirm the metadata.

## 2. Source hierarchy

Prefer, depending on the question:

1. current official public-health or regulatory documents;
2. current specialty-society guidelines with disclosed methodology;
3. systematic reviews and meta-analyses;
4. pivotal trials and high-quality observational evidence;
5. reputable secondary educational sources for orientation only.

Textbooks and subscription platforms may help identify concepts, but they do not replace a current, accessible source for claims that will be published. Do not reproduce protected text.

## 3. Claim-to-source matrix

Before final review, create a matrix:

| Claim ID | Draft claim | Source IDs | Evidence type | Confidence | Reviewer status |
|---|---|---|---|---|---|
| C01 | One precise claim | S01, S03 | Guideline + review | High/medium/low | Pending/approved/rejected |

Every clinically meaningful number, threshold, dose, recommendation and prognostic statement must have at least one adequate source.

## 4. Medication and dose gate

For every medication statement, verify independently:

- generic name;
- indication and population;
- route;
- dose and unit;
- frequency;
- duration or stopping rule;
- renal/hepatic or age adjustment when relevant;
- contraindications and major safety caveats;
- source date and jurisdiction.

Do not infer a dose from a nearby disease, age group or formulation. Do not produce a patient-ready prescription. Educational prescription-format examples, when the product explicitly requires them, must be clearly labeled as non-clinical examples and approved by a qualified reviewer.

## 5. Peru and LATAM gate

A local claim requires a local source or an explicit statement that local evidence was not found. Verify:

- current MINSA or DIGEMID document;
- document date and superseding versions;
- target level of care;
- formulary or availability claim;
- whether the recommendation differs from international guidance.

Do not equate a product being commercially available with being recommended, included in a public formulary or appropriate for a given patient.

## 6. Conflict handling

When reliable sources disagree:

- present the disagreement;
- identify populations and dates;
- explain which recommendation is being used and why;
- avoid collapsing uncertainty into one absolute statement;
- escalate high-impact conflicts to the human reviewer.

## 7. Final release gate

A document cannot be marked ready when any of these remain:

- `UNVERIFIED` citation;
- missing source for a clinical claim;
- dose or unit not independently checked;
- local availability claim without evidence;
- recommendation presented outside its population;
- missing human clinical approval;
- unclear date of evidence cutoff.

Final metadata must include:

```text
Evidence cutoff: YYYY-MM-DD
Clinical reviewer: [name or role]
Review date: YYYY-MM-DD
Status: DRAFT | CLINICAL_REVIEW | APPROVED | RETIRED
Next review: YYYY-MM-DD or trigger condition
```
