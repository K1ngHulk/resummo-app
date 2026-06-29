# Plan de Landing Pública de Resummo

Este documento define la estructura, posicionamiento y fases de implementación para la landing pública del proyecto Resummo.

## Resumen

La landing pública de Resummo debe comunicar el valor de la plataforma de forma clara, directa y premium, estableciendo el estado del producto y orientando a los visitantes hacia la solicitud de una demo o contacto con el equipo fundador.

## Posicionamiento

Resummo es una plataforma educativa enfocada en **Learning** (aprendizaje continuo) diseñada para estudiantes de medicina. 

## Estado del producto

Actualmente, Resummo se encuentra en etapa inicial (MVP / Demo). Por tanto, la landing debe orientar la conversión hacia una solicitud de demostración o contacto comercial, y no hacia un registro directo o inicio de sesión auto-gestionado.

## Audiencia

La landing está dirigida principalmente a:
* Estudiantes de medicina.
* Estudiantes en preparación de exámenes (enarm, mir, step).
* Posibles aliados institucionales o miembros del equipo académico.

## Promesa principal

La promesa debe ser realista y medible: **Acompañar y facilitar el estudio médico continuo**. 
* **Disclaimer crítico:** No se debe prometer aprobar exámenes, ni usar lenguaje que sugiera que Resummo actúa como herramienta clínica, de diagnóstico, Clinical Care, Teaching o tratamiento. Su propósito es netamente educativo.

## Estructura recomendada de landing

Se propone un layout compuesto por las siguientes secciones en orden descendente:

1. **Navbar**: Logotipo, enlaces de navegación.
2. **Hero**: Headline fuerte, subheadline explicativo y CTA principal (Solicitar Demo).
3. **Problema**: Descripción empática de los retos del estudiante de medicina moderno.
4. **Solución**: Introducción de Resummo como la solución integral.
5. **Producto**: (Paneles visuales o abstractos)
   * **Biblioteca médica**: Organización y revisión jerárquica.
   * **Banco de preguntas (QBank)**: Práctica activa.
   * **Planes de estudio**: Estructuración del tiempo.
   * **Progreso**: Monitoreo de resultados.
6. **Cómo funciona**: Pasos simples desde el registro hasta el dominio del material.
7. **Seguridad / Privacidad / Disclaimer educativo**: Sección de tranquilidad y límites del alcance.
8. **FAQ**: Preguntas frecuentes.
9. **CTA final**: Último bloque de persuasión para agendar la demo.
10. **Footer**: Enlaces legales, presencia de la creadora y redes.

## Copy inicial sugerido

**Headline:**
Acelera tu formación médica con Resummo.

**Subheadline:**
Organiza tu estudio, repasa con casos interactivos y monitorea tu progreso. La plataforma educativa definitiva para el estudiante de medicina.

**CTAs principales (a priorizar):**
* `Solicitar demo`
* `Hablar con el equipo`
* `Solicitar información`

*(Evitar el uso de `Ingresar`, `Iniciar sesión` o `Acceder` como CTA principal, ya que confunde el modelo MVP actual)*

## Presencia de empresa creadora

En el footer o en una sección dedicada a la fiabilidad de la plataforma, se debe incluir el bloque:
> **Producto desarrollado por Orbital Frameworks.**

**Placeholders pendientes de definición:**
* [Web oficial]
* [Instagram]
* [Correo comercial]

## Rutas públicas recomendadas

* `/` (Landing pública y Home)
* `/learning` (App interna de Learning / MVP actual)
* `/privacy` (Privacidad inicial)
* `/terms` (Términos iniciales)
* `/contact` (Opcional, puede ser un simple `mailto:` por ahora)

## Dirección visual

La implementación debe adherirse a los siguientes principios de diseño:
* **Estética premium**: Colores guinda corporativos (`var(--color-primary)`), fondos limpios, tipografía cuidada.
* **No usar plantillas IA genéricas**: Evitar layouts o ilustraciones robóticas y poco auténticas.
* **Encabezados editoriales**: Utilizar líneas y jerarquía clásica, no usar badges tipo pill que distraigan.
* **Representación del producto**: Usar screenshots/mockups solo si se ven suficientemente pulidos. Si no hay screenshots definitivos de la UI completa, se proponen mockups abstractos o tarjetas visuales.

## Disclaimers

Incluir estos puntos legal y éticamente vinculantes en el footer o sección de seguridad:
* Resummo es una herramienta educativa y de repaso.
* No reemplaza el criterio profesional, la formación clínica supervisada ni el uso de fuentes oficiales o bibliografía básica.
* No es una herramienta diseñada ni validada para el diagnóstico o tratamiento de pacientes reales.

## Información faltante

Para ejecutar la implementación de la landing final, se requiere definir:
* Web oficial.
* Instagram.
* Correo.
* Link de demo/contacto.
* Decisión sobre screenshots (reales vs abstractos).
* Textos iniciales de privacidad y términos.

## Plan de implementación por fases

* **Fase 1**: Branding mínimo del navegador. *[COMPLETADO]*
* **Fase 2**: Landing skeleton.
* **Fase 3**: Privacy/terms.
* **Fase 4**: Revisión visual.
* **Fase 5**: Implementación final.
