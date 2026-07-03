# Fuentes verificadas para Dengue

Objetivo de esta nota: recopilar fuentes oficiales y bibliograficas verificables sobre dengue para uso posterior en la ficha de RESUMMO.

Enfermedad objetivo: `Dengue (clasico/sin signos de alarma, con signos de alarma y grave)`

## Nota metodologica

- Se uso `PubMed MCP` para la busqueda bibliografica.
- Se intento usar `Firecrawl MCP`, pero devolvio `401` en esta sesion.
- La parte web se resolvio con `Busqueda Web` y `WebFetch` sobre URLs oficiales.
- Este archivo NO es la ficha final. Es solo un repositorio de fuentes y hallazgos verificables.
- Donde el entorno no permitio extraer un dato exacto de un PDF oficial, se marca `FALTA VERIFICAR EN PDF OFICIAL` o `[FALTA CITA]`.

---

## 1) Norma tecnica MINSA vigente para dengue en Peru

**Fuente**
- Titulo: `Resolucion Ministerial N.° 175-2024-MINSA`
- Tipo: norma legal oficial MINSA
- URL de ficha: `https://www.gob.pe/institucion/minsa/normas-legales/5323501-175-2024-minsa`
- PDF oficial: `https://cdn.www.gob.pe/uploads/document/file/6007546/5323501-r-m-175-2024-minsa-y-nts-211-dgiesp.pdf?v=1709834791`
- Documento aprobado: `NTS N.° 211-MINSA/DGIESP-2024, Norma Tecnica de Salud para la atencion integral de pacientes con dengue en el Peru`

**Resumen estructurado**
- Valor para RESUMMO: es la fuente normativa principal para clasificacion clinica, organizacion de la atencion y manejo local en Peru.
- Estado: vigente en la busqueda actual.
- Dato normativo clave: la resolucion aprueba formalmente la `NTS N.° 211-MINSA/DGIESP-2024`.
- Alcance: aplicacion obligatoria en establecimientos de salud del MINSA, EsSalud, sanidades FFAA/PNP y privados/mixtos.

**Datos clinicos verificables que usar despues**
- Finalidad de la NTS: reducir la morbimortalidad por dengue en el Peru mediante atencion integral y prevencion de formas graves.
- La norma incluye anexos explicitamente dedicados a:
  - clasificacion del dengue,
  - curso clinico por fases,
  - diagnostico diferencial entre arbovirus,
  - flujograma para casos probables,
  - grupo `A y B1`,
  - grupo `B2`,
  - grupo `C`,
  - criterios de hospitalizacion.

**Clasificacion y grupos peruanos a retener**
- La NTS contiene anexos para:
  - `Grupo A y B1`: dengue sin signos de alarma,
  - `Grupo B2`: dengue con signos de alarma,
  - `Grupo C`: dengue grave con choque.
- La tabla de atencion de casos probables derivada de la NTS, visible en materiales vinculados, resume:
  - `Grupo A`: tratamiento en el hogar / primer nivel.
  - `Grupo B2`: remision a hospital o unidad de dengue para liquidos intravenosos.
  - `Grupo C`: tratamiento de urgencia durante el traslado y remision urgente a hospital de mayor complejidad.

**Hidratacion A, B, C: hallazgos verificables y nivel de certeza**
- `Grupo A / B1`:
  - Material derivado de la NTS reporta: estimular la ingesta de liquidos por via oral.
  - Si el paciente no bebe, bebe poco o esta deshidratado, iniciar liquidos EV con `Lactato de Ringer` o `SSN 0.9%`.
  - En adultos, el material derivado menciona `2-4 mL/kg/h`.
  - En pediatria, el material derivado remite a formula de `Holliday-Segar`.
- `Grupo B2`:
  - La NTS oficial contiene anexos especificos para `DCSA en adulto y gestante - Grupo B2`, `DCSA en nino - Grupo B2` y `DCSA en persona adulta mayor o comorbilidad - Grupo B2`.
  - El OCR del PDF oficial en esta sesion confirma la existencia de esos anexos, pero no devolvio completo el algoritmo con velocidades exactas.
  - Dato operativo util, reproducido en material secundario, pero pendiente de re-verificacion literal contra el PDF oficial: obtener via IV, hemograma completo, vigilar signos vitales, ingresos/egresos y signos de choque compensado.
  - Velocidades exactas del esquema B2: `FALTA VERIFICAR EN PDF OFICIAL`.
- `Grupo C`:
  - En adulto con choque hipovolemico:
    - cristaloide (`Lactato de Ringer` o `SSN 0.9%`) `20 mL/kg` en `15-30 minutos`.
    - si no mejora y no hay sobrecarga: repetir segundo y tercer bolo de `20 mL/kg` en `15-30 minutos`.
    - si mejora: bajar a `10 mL/kg/h` por `1-2 h`, luego `5-7 mL/kg/h` por `2-4 h`, luego `3-5 mL/kg/h` por `2-4 h`, luego `2-4 mL/kg/h` por `2-4 h`, con reduccion gradual y monitoreo horario.
  - En adulto mayor o comorbilidad:
    - cristaloide `250 mL` en `15-30 minutos`.
    - si no mejora y no hay sobrecarga: repetir segunda y tercera carga de `250 mL`.
    - si mejora: bajar a `5 mL/kg/h` por `1-2 h`, luego `4 mL/kg/h` por `4-6 h`, luego `3 mL/kg/h` por `2-4 h` y reducir gradualmente a razon de `2 mL/kg/h` por `24-48 h`.
  - En gestante con choque:
    - cristaloide `10 mL/kg` en `15-30 minutos`.
    - si no mejora y no hay sobrecarga: repetir segunda y tercera carga de `10 mL/kg` en `15-30 minutos`.
  - Soporte vasopresor descrito en el flujograma OCR:
    - `noradrenalina 0.05-5 mcg/kg/min` en escenarios de evaluacion de bomba/hipoperfusion persistente.

**Notas para la futura ficha**
- Base normativa primaria para `Contexto Peruano`, `Clasificacion`, `Tratamiento` y `Checklist de atencion`.
- No usar todavia una velocidad exacta para `Grupo B2` sin reabrir el PDF/anexo exacto y verificarla de forma literal.

---

## 2) Portal IETSI/EsSalud con materiales derivados de la NTS

**Fuente**
- Titulo: `INFORMACION DENGUE`
- Tipo: recopilatorio institucional EsSalud/IETSI
- URL: `https://ietsi.essalud.gob.pe/info-dengue/`

**Enlaces utiles dentro de la fuente**
- Clasificacion de casos de dengue: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/03/Clasificacion-de-casos-de-dengue.pdf`
- Pautas para el diagnostico y manejo de dengue: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/03/1.-Afiche-A4-Esquema.pdf`
- NTS dengue espejada por EsSalud: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/03/NTS-Dengue.pdf`
- Flujograma casos probables: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/07/1-FLUJOGRAMA-Casos-probables-de-dengue.pdf`
- Flujograma DSSA grupo A y B1: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/07/2-FLUJOGRAMA-Dengue-sin-signos-de-alarma-Grupo-A-y-B1.pdf`
- Flujograma DCSA grupo B2: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/07/4-FLUJOGRAMAS-Dengue-cons-signos-de-alarma-Grupo-B2.pdf`
- Flujograma grupo C: `https://ietsi.essalud.gob.pe/wp-content/uploads/2024/08/5-FLUJOGRAMA-Dengue-grave-Grupo-C.pdf`

**Resumen estructurado**
- Valor para RESUMMO: sirve como indice institucional de anexos utiles de la NTS y materiales operativos para primer nivel y hospital.
- El portal confirma que EsSalud esta usando la NTS MINSA 2024 como base de trabajo.

**Datos clinicos verificables que usar despues**
- Clasificacion operativa resumida por materiales del portal:
  - `Dengue sin signos de alarma`
  - `Dengue con signos de alarma`
  - `Dengue grave`
- Signos de alarma visibles en material asociado:
  - dolor abdominal intenso,
  - vomitos persistentes,
  - acumulacion de liquidos,
  - sangrado de mucosas,
  - irritabilidad o letargia,
  - hepatomegalia,
  - aumento progresivo de hematocrito con caida de plaquetas.
- Puntos de manejo no farmacologico utiles:
  - vigilancia de signos vitales,
  - balance de liquidos,
  - educacion sobre signos de alarma,
  - evitar automedicacion.

**Dosis y manejo sintomatico visibles en material derivado**
- `Paracetamol`:
  - material derivado del flujograma A/B1 menciona `10-15 mg/kg cada 6 horas` en ninos,
  - dosis maxima diaria `75 mg/kg/dia`.
- `Grupo A / B1`:
  - hidratacion oral vigorosa.
  - si no tolera VO o se deshidrata: `Lactato de Ringer` o `SSN 0.9%`.
  - en adultos: `2-4 mL/kg/h`.
- `Grupo C`:
  - reproduce con OCR las cargas de `20 mL/kg` en adulto y `250 mL` en adulto mayor/comorbilidad; ver fuente 1 para el detalle resumido.

**Notas para la futura ficha**
- Muy util para `Zona de presentaciones y RP` no tanto por farmacos, sino por denominaciones institucionales y flujogramas.
- Sirve como respaldo de implementacion local, pero para dosis o textos literales finales debe preferirse el PDF oficial de la NTS.

---

## 3) OPS/OMS 2025: directriz mas reciente localizada para dengue grave en UCI

**Fuente**
- Titulo: `Directrices para el manejo del dengue grave en unidades de cuidados intensivos`
- Tipo: directriz OPS/OMS
- URL documento OPS: `https://www.paho.org/es/documentos/directrices-para-manejo-dengue-grave-unidades-cuidados-intensivos`
- URL IRIS/OPS: `https://iris.paho.org/handle/10665.2/68589`
- PDF localizado: `https://iris.paho.org/bitstream/handle/10665.2/68589/9789275330487_spa.pdf?sequence=6`
- Fecha visible en portal OPS: `15 Sep 2025`

**Resumen estructurado**
- Valor para RESUMMO: es la directriz OPS mas reciente localizada en esta sesion para manejo de dengue grave en la Region, especificamente en UCI.
- Alcance: no reemplaza una guia regional general de atencion del dengue; su foco es `dengue grave` y `cuidados intensivos`.
- El portal OPS la describe como la primera directriz especificamente dedicada al manejo del dengue grave en UCI.

**Datos clinicos verificables que usar despues**
- La publicacion responde a `17 preguntas especificas` para la atencion de pacientes criticos.
- El objetivo regional explicito es:
  - mejorar la deteccion temprana de complicaciones,
  - estandarizar el manejo clinico basado en evidencia,
  - reducir mortalidad por dengue grave.
- El abstract visible en IRIS/OPS menciona que incluye, entre otros temas:
  - administracion de liquidos intravenosos,
  - soporte de pacientes criticos,
  - lineamientos practicos basados en mejor evidencia disponible.

**Notas para la futura ficha**
- Fuente prioritaria para secciones futuras de `Tratamiento`, `Complicaciones`, `Pronostico` y `Pitfalls` del dengue grave.
- Debe usarse junto con la NTS MINSA para adaptar el manejo al contexto peruano.

---

## 4) OPS/OMS 2016: guia regional amplia de atencion de pacientes con dengue en las Americas

**Fuente**
- Titulo: `Dengue: guidelines for patient care in the Region of the Americas. 2. ed.`
- Tipo: guia regional OPS/OMS
- URL OPS: `https://www.paho.org/en/documents/dengue-guidelines-patient-care-region-americas-2-ed`
- Biblioteca digital OPS: `https://iris.paho.org/handle/10665.2/31207`
- PDF citado en buscadores: `http://iris.paho.org/xmlui/bitstream/handle/123456789/31207/9789275118900-eng.pdf?sequence=1&isAllowed=y&ua=1`
- Fecha visible en portal OPS: `8 Feb 2016`

**Resumen estructurado**
- Valor para RESUMMO: sigue siendo la guia amplia regional de atencion de pacientes para dengue en las Americas.
- Importante distincion:
  - `OPS 2025` = mas reciente, centrada en dengue grave/UCI.
  - `OPS 2016` = guia regional amplia de atencion del paciente con dengue.

**Datos clinicos verificables que usar despues**
- Fases clinicas:
  - `fase febril`: fiebre aguda de `2-7 dias` con rubor facial, dolor corporal, mialgia, artralgia, cefalea y dolor retroocular.
  - `fase critica`: cerca de la defervescencia, usualmente entre `dias 3-7`, cuando aumenta la permeabilidad capilar.
  - `fase de recuperacion`: mejora del estado general, apetito, sintomas GI y diuresis.
- Clasificacion revisada:
  - `dengue sin signos de alarma`
  - `dengue con signos de alarma`
  - `dengue grave`
- Signos de alarma descritos en contenido OPS:
  - dolor abdominal intenso y continuo,
  - vomitos persistentes,
  - acumulacion de liquidos,
  - sangrado de mucosas,
  - alteracion del estado mental,
  - hepatomegalia,
  - aumento progresivo del hematocrito.
- Dengue grave definido por:
  - choque por fuga plasmatica,
  - sangrado grave,
  - compromiso severo de organos.

**Notas para la futura ficha**
- Fuente muy util para `Definicion`, `Fisiopatologia`, `Clinica`, `Diagnostico`, `Algoritmo` y `High-yield`.
- Tambien util para armonizar lenguaje entre MINSA y OPS.

---

## 5) PubMed: revision sobre diagnostico y su impacto en el manejo clinico

**Fuente**
- Titulo: `Dengue diagnosis and impact on clinical management: A literature review`
- Tipo: revision
- PMID: `40587449`
- PMCID: `PMC12208413`
- DOI: `10.1371/journal.pntd.0013196`
- PubMed: `https://pubmed.ncbi.nlm.nih.gov/40587449/`
- PMC: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12208413/`

**Resumen estructurado**
- Valor para RESUMMO: muy util para la seccion futura de `Diagnostico`, `Diagnostico diferencial`, `Pitfalls` y `Tratamiento` (por errores de manejo asociados a diagnostico tardio o incorrecto).

**Datos clinicos verificables que usar despues**
- El dengue comparte sintomas no especificos con otros cuadros febriles agudos:
  - fiebre,
  - rash,
  - cefalea,
  - artralgias,
  - nauseas,
  - vomitos.
- En la muestra revisada, las pruebas serologicas rapidas `NS1/IgG/IgM` fueron las herramientas diagnosticas mas usadas.
- Se documento uso frecuente e inapropiado de:
  - antimalaricos pese a pruebas de malaria negativas,
  - antibioticos sin evidencia de infeccion bacteriana.
- La revision enfatiza que mejorar el diagnostico diferencial entre dengue y malaria puede reducir uso innecesario de antimicrobianos.

**Puntos para futura redaccion**
- Utilizar como respaldo para advertir contra el sobrediagnostico de malaria u otras fiebres en contexto endemico.
- Util para justificar inclusion de `NS1`, serologia y diagnostico diferencial bien estructurado.

---

## 6) PubMed: revision sistematica sobre terapias antivirales, inmunomoduladoras y elevadoras de plaquetas

**Fuente**
- Titulo: `Effectiveness of antiviral, immunomodulatory and platelet-enhancing agents for treatment of dengue infection: A systematic review`
- Tipo: revision sistematica
- PMID: `41214477`
- PMCID: `PMC12622339`
- DOI: `10.1080/21505594.2025.2587491`
- PubMed: `https://pubmed.ncbi.nlm.nih.gov/41214477/`
- PMC: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12622339/`

**Resumen estructurado**
- Valor para RESUMMO: util para `Tratamiento`, `Notas de transparencia` y `Pitfalls`, especialmente para separar manejo estandar de terapias en investigacion.

**Datos clinicos verificables que usar despues**
- Incluyo `26 estudios` clinicos.
- Hallazgos resumidos del abstract:
  - algunas intervenciones mostraron reduccion de estancia hospitalaria.
  - `doxiciclina` fue una de las intervenciones con senales favorables en algunos estudios.
  - la combinacion `doxiciclina + Carica papaya` mostro la reduccion mas marcada de estancia (`7.3 dias vs 9.1 dias`) y aumento de plaquetas en `7 dias`.
  - terapias inmunomoduladoras no demostraron eficacia clara.
  - `rupatadina` podria aumentar plaquetas, pero la evidencia sigue siendo limitada.
  - agentes elevadores de plaquetas como `rhIL-11`, `anti-D` y `eltrombopag` aumentaron recuento plaquetario en estudios pequenos.
- Conclusion clave:
  - tamano muestral pequeno y necesidad de ensayos mas grandes.
  - no convierte estas estrategias en nuevo estandar de cuidado.

**Puntos para futura redaccion**
- Muy util para dejar claro que el manejo base sigue siendo de soporte.
- Si luego se menciona doxiciclina, Carica papaya o agentes elevadores de plaquetas, deben ir en bloque de evidencia emergente, no como recomendacion estandar peruana.

---

## 7) PubMed: revision para diagnostico diferencial en paciente febril viajero

**Fuente**
- Titulo: `Emergency department evaluation and management of serious and high-risk infections in the febrile returning traveler`
- Tipo: revision
- PMID: `42024815`
- PMCID: `no disponible en la metadata recuperada`
- DOI: `no visible en la metadata recuperada`
- PubMed: `https://pubmed.ncbi.nlm.nih.gov/42024815/`

**Resumen estructurado**
- Valor para RESUMMO: util para `Diagnostico diferencial`, sobre todo para distinguir dengue de otras fiebres importadas o arbovirosis.

**Datos clinicos verificables que usar despues**
- En el viajero febril, la evaluacion en emergencias debe considerar una gama amplia de infecciones con presentaciones no especificas.
- `Malaria` se remarca como la causa tropical mas frecuente y potencialmente letal a descartar.
- Otros diagnosticos clave que deben contemplarse junto a dengue:
  - fiebre enterica,
  - leptospirosis,
  - otras infecciones de alto riesgo.
- La revision propone un enfoque estructurado y sistematico para reconocimiento temprano, diagnostico y tratamiento.

**Puntos para futura redaccion**
- Util para la tabla maestra de `Diagnostico diferencial`.
- No reemplaza guias especificas de dengue, pero aporta estructura de triage y red flags cuando el cuadro no es tipico.

---

## 8) PubMed adicional de soporte terapeutico y vacunas

**Fuente**
- Titulo: `Dengue: Update on Clinically Relevant Therapeutic Strategies and Vaccines`
- Tipo: revision
- PMID: `37124673`
- PMCID: `PMC10111087`
- DOI: `10.1007/s40506-023-00263-w`
- PubMed: `https://pubmed.ncbi.nlm.nih.gov/37124673/`
- PMC: `https://pmc.ncbi.nlm.nih.gov/articles/PMC10111087/`

**Resumen estructurado**
- Valor para RESUMMO: util como fuente de fondo para contextualizar que el tratamiento estandar sigue siendo de soporte.

**Datos clinicos verificables que usar despues**
- La revision subraya que el tratamiento actual del dengue es principalmente `soporte`.
- Resume avances en antivirales directos, terapias dirigidas al huesped y vacunas candidatas.
- Remarca que aun hay necesidad de terapeuticas que reduzcan morbilidad y carga de enfermedad.

**Puntos para futura redaccion**
- Util para `Tratamiento`, `Prevencion` y `Notas de transparencia`.
- No usar para desplazar la NTS/OPS en manejo clinico basico.

---

## 9) PNUME oficial: presentaciones verificables de paracetamol en Peru

**Fuente**
- Titulo: `Documento tecnico: Petitorio Nacional Unico de Medicamentos Esenciales para el Sector Salud`
- Tipo: PNUME oficial / DIGEMID-MINSA
- URL oficial: `https://www.digemid.minsa.gob.pe/Archivos/PortalWeb/Informativo/Acceso/Semts/Normas/03_PNUME_2015.pdf`
- Fuente alterna localizada en buscador: `https://bvcenadim.digemid.minsa.gob.pe/lildbi/textcomp/PNUME_2015-F.pdf`
- Resolucion asociada visible en el documento: `RM N.° 399-2015/MINSA`

**Resumen estructurado**
- Valor para RESUMMO: fuente oficial util para cerrar denominaciones y formas farmaceuticas reales en Peru cuando la ficha necesite una `RP` o validar disponibilidad institucional.
- Alcance: confirma principios activos, concentraciones y formas farmaceuticas incluidas en el petitorio oficial localizado.

**Datos verificables que usar despues**
- `Paracetamol 500 mg TAB`
- `Paracetamol 120 mg/5 mL LIQ ORAL`
- `Paracetamol 100 mg/mL LIQ ORAL gotas`
- `Paracetamol 100-300 mg SUP`

**Notas para la futura ficha**
- Esta fuente si permite reemplazar el vacio de presentacion exacta de `Paracetamol` en Peru.
- La presencia de `Paracetamol 500 mg TAB` en PNUME no autoriza por si sola a inventar dosis para dengue; la dosis debe seguir viniendo de fuente clinica verificable.

---

## 10) DIGEMID: soporte oficial para sales de rehidratacion oral

**Fuente**
- Titulo: `Informe tecnico solucion de rehidratacion oral (electrolitos) solucion oral`
- Tipo: informe tecnico institucional DIGEMID
- URI oficial: `https://repositorio-digemid.minsa.gob.pe/handle/20.500.14882/640`
- Descarga del PDF: `https://repositorio-digemid.minsa.gob.pe/bitstreams/1513741f-e580-425c-b19e-9a80d15fa3e6/download`
- Fecha visible en metadatos: `2010`

**Resumen estructurado**
- Valor para RESUMMO: sirve para sostener que existe respaldo institucional DIGEMID para `sales de rehidratacion oral (electrolitos) solucion oral`.
- Limite: el documento localizado no confirma en esta sesion una presentacion exacta tipo sobre, volumen comercial o concentracion rotulada equivalente al nivel de detalle del `PNUME`.

**Datos verificables que usar despues**
- La adquisicion de `sales de rehidratacion oral en solucion` puede justificarse si la composicion corresponde a la `SRO de osmolaridad reducida` establecida por `OMS` y `UNICEF`.
- La forma documental verificable localizada es `solucion oral`.

**Notas para la futura ficha**
- Esta fuente permite mejorar el realismo peruano de la `RP`, pero no cerrar todavia una presentacion exacta al nivel de concentracion/volumen o empaque.
- Si se requiere una presentacion farmaceutica exacta para `SRO`, sigue siendo necesario localizar una fuente primaria adicional mas especifica.

---

## Hallazgos clinicos transversales para reutilizar despues

### Clasificacion consolidada
- `Dengue sin signos de alarma`
- `Dengue con signos de alarma`
- `Dengue grave`

### Signos de alarma repetidos en fuentes oficiales/regionales
- dolor abdominal intenso o continuo
- vomitos persistentes
- acumulacion de liquidos
- sangrado de mucosas
- irritabilidad o letargia
- hepatomegalia > 2 cm
- aumento del hematocrito con caida de plaquetas

### Dengue grave: criterios repetidos
- choque por fuga plasmatica
- dificultad respiratoria por acumulacion de liquidos
- sangrado grave
- dano organico severo

### Manejo/hidratacion con mejor soporte encontrado
- `Grupo A / B1`: hidratacion oral; si intolerancia VO o deshidratacion, `LR` o `SSN 0.9%`; en adultos, `2-4 mL/kg/h` en material derivado.
- `Grupo B2`: monitoreo estrecho, acceso IV, hemograma completo, ingresos/egresos, vigilancia de choque compensado; velocidad exacta del algoritmo peruano `FALTA VERIFICAR EN PDF OFICIAL`.
- `Grupo C`: bolos de cristaloides y descenso escalonado segun respuesta clinica y diuresis; ver detalle en fuente 1.

### Presentaciones peruanas confirmadas
- `Paracetamol 500 mg TAB` en PNUME oficial.
- `Paracetamol 120 mg/5 mL LIQ ORAL` en PNUME oficial.
- `Paracetamol 100 mg/mL LIQ ORAL gotas` en PNUME oficial.
- `SRO`: respaldo institucional DIGEMID para `sales de rehidratacion oral (electrolitos) solucion oral`, pero sin presentacion exacta suficientemente cerrada para esta ficha.

### Pruebas diagnosticas a priorizar despues
- `RT-PCR` y/o `NS1` en la fase temprana
- `IgM` cuando la ventana temporal lo permita
- `hemograma seriado` y `hematocrito` para vigilar progresion

### Errores o pitfalls detectados en la bibliografia
- uso inadecuado de antibioticos sin evidencia de infeccion bacteriana
- uso inadecuado de antimalaricos pese a pruebas negativas
- asumir que todo paciente febril requiere fluidos IV agresivos sin estratificar
- extrapolar terapias emergentes como estandar cuando la evidencia aun es limitada

---

## Pendientes antes de redactar la ficha final

- Reabrir y verificar de forma literal el anexo oficial `Grupo B2` del PDF MINSA para extraer la secuencia exacta de hidratacion.
- Contrastar, si se necesitara, la terminologia local entre `grupo B`, `B1`, `B2` y `grupo C` para mantener consistencia editorial.
- Revisar si existe una actualizacion MINSA/OPS posterior a las localizadas aqui antes de congelar referencias finales.
- Localizar una fuente primaria mas especifica para la presentacion exacta de `sales de rehidratacion oral` si se quiere cerrar una `RP` completamente operativa sin campos pendientes.
