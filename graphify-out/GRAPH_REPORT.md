# Graph Report - .  (2026-07-03)

## Corpus Check
- 110 files · ~145,359 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 333 nodes · 514 edges · 77 communities (16 shown, 61 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Package Cluster|Package Cluster]]
- [[_COMMUNITY_Server Cluster|Server Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Scripts Cluster|Scripts Cluster]]
- [[_COMMUNITY_Server Cluster|Server Cluster]]
- [[_COMMUNITY_Package Cluster|Package Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Prisma Cluster|Prisma Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Prisma Cluster|Prisma Cluster]]
- [[_COMMUNITY_Cluster| Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Src Cluster|Src Cluster]]
- [[_COMMUNITY_Generic Cluster 23|Generic Cluster 23]]
- [[_COMMUNITY_Generic Cluster 24|Generic Cluster 24]]
- [[_COMMUNITY_Agents Cluster|Agents Cluster]]
- [[_COMMUNITY_Agents Cluster|Agents Cluster]]
- [[_COMMUNITY_Agents Cluster|Agents Cluster]]
- [[_COMMUNITY_Docker Cluster|Docker Cluster]]
- [[_COMMUNITY_Docsarticulos Cluster|Docs/articulos Cluster]]
- [[_COMMUNITY_Docsarticulos Cluster|Docs/articulos Cluster]]
- [[_COMMUNITY_Docsarticulos Cluster|Docs/articulos Cluster]]
- [[_COMMUNITY_Generic Cluster 32|Generic Cluster 32]]
- [[_COMMUNITY_Generic Cluster 33|Generic Cluster 33]]
- [[_COMMUNITY_Docscontent-pipelinedraftsfuentes Cluster|Docs/content-pipeline/drafts/fuentes Cluster]]
- [[_COMMUNITY_Docscontent-pipelinefichas Cluster|Docs/content-pipeline/fichas Cluster]]
- [[_COMMUNITY_Docscontent-pipelinepromptscritic Cluster|Docs/content-pipeline/prompts/critic Cluster]]
- [[_COMMUNITY_Docscontent-pipelinepromptsestructura Cluster|Docs/content-pipeline/prompts/estructura Cluster]]
- [[_COMMUNITY_Docscontent-pipelinepromptsgenerador Cluster|Docs/content-pipeline/prompts/generador Cluster]]
- [[_COMMUNITY_Docscontent-pipelinepromptsredactor Cluster|Docs/content-pipeline/prompts/redactor Cluster]]
- [[_COMMUNITY_Generic Cluster 40|Generic Cluster 40]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Docs Cluster|Docs Cluster]]
- [[_COMMUNITY_Generic Cluster 60|Generic Cluster 60]]
- [[_COMMUNITY_Prisma Cluster|Prisma Cluster]]
- [[_COMMUNITY_Generic Cluster 63|Generic Cluster 63]]
- [[_COMMUNITY_Generic Cluster 64|Generic Cluster 64]]
- [[_COMMUNITY_Readme Cluster|Readme Cluster]]
- [[_COMMUNITY_Generic Cluster 66|Generic Cluster 66]]
- [[_COMMUNITY_Generic Cluster 67|Generic Cluster 67]]
- [[_COMMUNITY_Generic Cluster 68|Generic Cluster 68]]
- [[_COMMUNITY_Generic Cluster 69|Generic Cluster 69]]
- [[_COMMUNITY_Generic Cluster 70|Generic Cluster 70]]
- [[_COMMUNITY_Generic Cluster 71|Generic Cluster 71]]
- [[_COMMUNITY_Generic Cluster 72|Generic Cluster 72]]
- [[_COMMUNITY_Trae Cluster|Trae Cluster]]
- [[_COMMUNITY_Trae Cluster|Trae Cluster]]
- [[_COMMUNITY_Vite Cluster|Vite Cluster]]

## God Nodes (most connected - your core abstractions)
1. `useAuth` - 38 edges
2. `requireAuth` - 16 edges
3. `scripts` - 14 edges
4. `prisma` - 12 edges
5. `AppIcon` - 8 edges
6. `DashboardPage` - 8 edges
7. `router` - 7 edges
8. `StudyPlanElements` - 7 edges
9. `requireRole` - 6 edges
10. `App()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `seedTopics()` --references--> `prisma`  [EXTRACTED]
  prisma/seed.js → server/lib/prisma.js
- `runChecks()` --semantically_similar_to--> `run()`  [INFERRED] [semantically similar]
  scripts/smoke-http-admin.mjs → scripts/smoke-http-library.mjs
- `runSmoke()` --semantically_similar_to--> `runChecks()`  [INFERRED] [semantically similar]
  scripts/smoke-http-qbank.mjs → scripts/smoke-http-admin.mjs
- `requireRole` --semantically_similar_to--> `requireAuth`  [INFERRED] [semantically similar]
  server/middleware/requireRole.js → server/middleware/requireAuth.js
- `CircularProgress` --semantically_similar_to--> `DonutChart`  [INFERRED] [semantically similar]
  src/components/ui/CircularProgress.jsx → src/components/ui/DonutChart.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Protected Routes** — server_routes_admincontentroutes_router, server_routes_articleroutes_router, server_routes_dashboardroutes_router, server_routes_adminroutes_router [EXTRACTED 1.00]
- **Dashboard Cards** — src_components_dashboard_continuelearningcard_continuelearningcard, src_components_dashboard_progressoverviewcard_progressoverviewcard, src_components_dashboard_questionsessioncard_questionsessioncard, src_components_dashboard_recentarticlescard_recentarticlescard [INFERRED 0.85]
- **Admin Pages** — src_pages_admin_adminankiimportpage_adminankiimportpage, src_pages_admin_adminarticlecreatepage_adminarticlecreatepage, src_pages_admin_adminarticlereviewpage_adminarticlereviewpage, src_pages_admin_adminarticlespage_adminarticlespage, src_pages_admin_adminhomepage_adminhomepage, src_pages_admin_adminquestioncreatepage_adminquestioncreatepage, src_pages_admin_adminquestionreviewpage_adminquestionreviewpage, src_pages_admin_adminquestionspage_adminquestionspage, src_pages_admin_admintopiccreatepage_admintopiccreatepage, src_pages_admin_admintopicreviewpage_admintopicreviewpage [INFERRED 0.85]
- **Learning Surfaces** — docs_01_prd_learning_aprender, docs_01_prd_learning_repasar, docs_01_prd_learning_practicar, docs_01_prd_learning_progreso [EXTRACTED 1.00]

## Communities (77 total, 61 thin omitted)

### Community 0 - "Src Cluster"
Cohesion: 0.08
Nodes (38): App(), getLocationState(), normalizePath(), routeConfig, AdminHeader, AppHeader, learningRoutes, apiRequest (+30 more)

### Community 1 - "Package Cluster"
Cohesion: 0.06
Nodes (32): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, pg, @prisma/adapter-pg (+24 more)

### Community 2 - "Server Cluster"
Cohesion: 0.16
Nodes (21): app, port, comparePassword, hashPassword, signToken, verifyToken, prisma, requireAuth (+13 more)

### Community 3 - "Src Cluster"
Cohesion: 0.09
Nodes (25): continueLearning, learningRoutes, library, libraryArticleDetail, libraryNodes, loadingScreen, mockUser, overallProgress (+17 more)

### Community 4 - "Src Cluster"
Cohesion: 0.18
Nodes (13): ContinueLearningCard, formatDateLabel, ProgressOverviewCard, QuestionSessionCard, RecentArticlesCard, AppIcon, iconMap, CircularProgress (+5 more)

### Community 5 - "Scripts Cluster"
Cohesion: 0.16
Nodes (14): runChecks(), serverProcess, timeoutPromise, waitForHealth(), log(), pass(), run(), wait() (+6 more)

### Community 6 - "Server Cluster"
Cohesion: 0.26
Nodes (9): buildAnkiPreview, contentStatusSchema, loadAnkiReferenceData, mapValidPreviewItemToCreateData(), normalizePrompt(), normalizeTags(), parseAnkiTsv, validateAnkiRows (+1 more)

### Community 7 - "Package Cluster"
Cohesion: 0.17
Nodes (12): devDependencies, effect, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, prisma (+4 more)

### Community 8 - "Src Cluster"
Cohesion: 0.38
Nodes (11): studyPlanCurrent, ArticleCard, DayMetrics, DayProgress, SessionCard, StudyPlanCurrentPage, StudyPlanDayCard, StudyPlanElements (+3 more)

### Community 9 - "Src Cluster"
Cohesion: 0.53
Nodes (8): studyPlanWizard, MockCheckbox, StepIntro, StudyPlanStepOne, StudyPlanStepTwo, StudyPlanWizardPage, WizardFeatureRow, WizardLogo

### Community 10 - "Prisma Cluster"
Cohesion: 0.32
Nodes (7): adminUser, demoUser, editorUser, main(), seedDemoActivity(), seedTopics(), topics

### Community 11 - "Src Cluster"
Cohesion: 0.47
Nodes (5): getLibraryChildren, getLibraryDescendantArticles, getLibraryNode, getLibraryPath, getLibraryRootNode

### Community 12 - "Prisma Cluster"
Cohesion: 0.67
Nodes (3): Article, Question, Topic

## Knowledge Gaps
- **104 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **61 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Package Cluster` to `Package Cluster`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `prisma` connect `Package Cluster` to `Server Cluster`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Src Cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.08418079096045197 - nodes in this community are weakly interconnected._
- **Should `Package Cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Src Cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.09259259259259259 - nodes in this community are weakly interconnected._