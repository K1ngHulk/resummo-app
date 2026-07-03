[OPEN] PubMed MCP failed to start

## Session
- session_id: pubmed-mcp-start
- date: 2026-07-01

## Symptom
- `pubmed-mcp` aparece como `Failed to start` en Trae.

## Initial Hypotheses
1. El paquete `pubmed-mcp-server` publicado en npm está incompleto o no implementa correctamente el servidor MCP.
2. El binario arranca y termina enseguida, por lo que Trae lo marca como fallo.
3. El paquete usa un transporte o punto de entrada distinto al que Trae espera por `stdio`.
4. El nombre correcto del paquete/binario no es `pubmed-mcp-server`, aunque npm lo resuelva.
5. Trae necesita una configuración distinta para este servidor concreto y el paquete directo de npm no es la vía correcta.

## Evidence Log
- `npm view pubmed-mcp-server bin --json` -> expone `dist/index.js`.
- `Read dist/index.js` del tarball de `pubmed-mcp-server@1.0.0` -> archivo casi vacío:
  - `"use strict";`
  - `//# sourceMappingURL=index.js.map`
- `npx -y pubmed-mcp-server` -> termina inmediatamente con `EXIT:0`.
- README oficial de `@cyanheads/pubmed-mcp-server` documenta configuración `npx -y @cyanheads/pubmed-mcp-server@latest` con `MCP_TRANSPORT_TYPE=stdio`.
- `npx -y @cyanheads/pubmed-mcp-server@latest` con `MCP_TRANSPORT_TYPE=stdio` -> proceso queda corriendo.

## Next Step
- Sustituir el paquete roto por `@cyanheads/pubmed-mcp-server@latest` en la configuración de Trae.
