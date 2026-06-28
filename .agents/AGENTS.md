# Instrucciones Locales: Resummo

## 1. Identidad del Proyecto
- Nombre: Resummo
- Contexto: Plataforma de estudio medico / aprendizaje medico (MVP).
- Stack: React 19, Vite, CSS manual, ESLint. Scripts reales: `npm run dev`, `npm run build`, `npm run lint`.

## 2. Reglas Especificas de Resummo
- **Educativo vs Clinico**: Resummo es una herramienta de estudio. No presentar contenido como consejo medico clinico.
- **Falsas Promesas**: No prometer mejores notas, aprobacion de examenes, resultados medicos ni diagnosticos.
- **Integridad Academica**: No inventar papers, fuentes, DOI, autores, estadisticas ni evidencia.
- **No Fake Social Proof**: No inventar universidades, hospitales, medicos, estudiantes, estudios, metricas ni avales.
- **Calidad de Contenido**: Si se generan preguntas, explicaciones o resumenes medicos, deben ser didacticos y claros.
- **Separacion de Contextos**: 
  - Landing publica: propuesta clara, etica y orientada al SEO. 
  - App privada: enfoque en aprendizaje, privacidad y consistencia de contenido.
- **Archivos No Trackeados**: Son intocables salvo instruccion explicita.

## 3. Revision Humana
- Typos o formato simple: NO hace falta revision humana.
- Claims medicos, inclusion de articulos, papers o recomendaciones academicas: MARCAR para revision humana.

## 4. Validacion Requerida
- Usar `npm run lint` y `npm run build` para cambios de codigo, estructura, rutas, componentes o metadata cuando aplique.
- Para cambios solo de texto/copy, revisar diff y marcar revision humana si hay claims medicos o academicos.
- Para landing publica: revisar metadata/SEO si se toca copy, `index.html` o componentes publicos.

## 5. Skills Recomendadas
- Reconocimiento: `project-analyzer`, `code-tour`, `workspace-surface-audit`.
- Limpieza / Refactor: `plankton-code-quality`, `verification-loop`.
- Landing / UI / SEO: `seo-audit`, `ui-ux-pro-max`, `impeccable`, `taste-skill` (cuando aplique).
- Seguridad: `security-review` (solo si aparecen auth, pagos, backend o datos personales).
