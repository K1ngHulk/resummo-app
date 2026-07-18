# Resummo Medical Author Kit

## Estado

- Tipo: capacidad documental local del proyecto.
- Activación global: no.
- MCPs o servicios instalados por este kit: ninguno.
- Publicación automática: prohibida.
- Uso clínico directo o consejo para pacientes: fuera de alcance.

Este paquete conserva una guía especializada para redactar material educativo médico de RESUMMO. No convierte al agente en una fuente clínica autónoma ni garantiza que una cita, dosis, guía o disponibilidad local sea correcta solo porque aparezca en una respuesta.

## Contenido

```text
resummo-author-kit/
├── README.md
├── EVIDENCE_WORKFLOW.md
└── skills/
    └── resummo-medical-author/
        └── SKILL.md
```

La skill permanece dentro del repositorio para trazabilidad y revisión. No debe copiarse automáticamente a una raíz global de Codex, Gemini, Claude u otro agente. Su activación dentro de RESUMMO requiere un bloque separado y reversible después de aprobar una prueba de calidad médica.

## Flujo obligatorio

1. **Definir el encargo**
   - tema;
   - público y profundidad;
   - país o contexto asistencial;
   - fecha de corte;
   - secciones requeridas.

2. **Construir un paquete de evidencia**
   - fuentes oficiales vigentes;
   - guías clínicas identificadas por nombre, organismo y fecha;
   - artículos primarios o revisiones relevantes;
   - normativa, formularios o petitorios locales cuando apliquen.

3. **Registrar la evidencia**
   - URL o identificador estable;
   - DOI o PMID cuando exista y haya sido comprobado;
   - fecha de publicación y consulta;
   - afirmaciones que realmente respalda;
   - limitaciones o conflicto entre fuentes.

4. **Redactar un borrador**
   - solo con afirmaciones respaldadas;
   - separando evidencia, consenso, inferencia y práctica local;
   - marcando datos pendientes de verificación.

5. **Verificación independiente**
   - comprobar DOI/PMID en la fuente correspondiente;
   - revisar dosis, vía, frecuencia, duración y población;
   - comprobar vigencia de guías y documentos MINSA/DIGEMID;
   - confirmar que las citas respaldan la frase asociada.

6. **Revisión humana clínica**
   - obligatoria antes de publicar;
   - realizada por una persona competente para el tema;
   - con registro de observaciones y aprobación.

7. **Publicación controlada**
   - nunca automática;
   - conservar fecha de corte y versión;
   - programar revisión futura del contenido.

## Herramientas de investigación

El kit no instala MCPs ni ejecuta comandos de instalación automática. PubMed, sitios oficiales, buscadores académicos, navegador o conectores pueden utilizarse como **fuentes de búsqueda**, no como garantía de exactitud.

Antes de incorporar un MCP o servicio externo debe auditarse por separado:

- repositorio, mantenedor y licencia;
- versión o commit fijado;
- comandos y scripts de instalación;
- permisos, scopes y credenciales;
- almacenamiento de consultas o documentos;
- operaciones de lectura y escritura;
- compatibilidad con Windows y los agentes usados;
- política de actualización y rollback.

La alternativa preferida para el primer piloto es investigación web manual y trazable con fuentes oficiales y primarias, sin instalar un MCP persistente.

## Prohibiciones

- No inventar referencias, DOI, PMID, guías, dosis o disponibilidad de medicamentos.
- No convertir contenido educativo en una indicación individual para un paciente.
- No generar recetas listas para uso real.
- No afirmar que una herramienta produce evidencia “100 % real”.
- No citar un resumen, snippet o respuesta de IA como si fuera la fuente primaria.
- No publicar contenido sin revisión médica humana.
- No copiar extensamente textos protegidos de libros, plataformas de suscripción o guías.

## Criterio de activación futura

La skill podrá exponerse como capacidad local del proyecto solo después de una evaluación con temas de prueba que mida:

- exactitud factual;
- trazabilidad cita-afirmación;
- tasa de referencias inexistentes;
- exactitud de dosis y unidades;
- adaptación peruana verificable;
- calidad pedagógica;
- manejo de incertidumbre;
- resultado de revisión humana.

Hasta entonces su estado es `PROJECT_LIBRARY / NOT_AUTO_LOADED`.
