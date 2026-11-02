# Capturas de NovaPsi

`shots.mjs` genera las capturas de `public/works/novapsi/shots/` desde la demostración de NovaPsi (datos ficticios, sin base real).

1. En el proyecto de la app, levantar un servidor de demostración aparte (no toca nada real):
   `NEXT_DIST_DIR=.next-muestra NEXT_PUBLIC_DATA_PROVIDER=mock ACCESO_DEMO=1 AUTH_SECRET=<cualquier texto largo> NEXT_PUBLIC_APP_URL=http://localhost:3101 DATA_DIR=/tmp/capturas-datos node node_modules/next/dist/bin/next dev -p 3101`
2. En una carpeta con `puppeteer-core` (usa el Chrome instalado): `BASE=http://localhost:3101 node shots.mjs es` y `... en`.
   - Paciente: celular 390×844 a 3x (1170×2532). Profesional: 1100×760 a 2x (2200×1520).
   - Se oculta el aviso de demostración, el botón Tutorial, el indicador de Next y los avisos propios del servidor de ejemplo.
   - `dict-en.json` traduce los textos de la interfaz para las versiones en inglés (las fechas se resuelven con reglas dentro del script).
   - El flujo del paciente cancela antes los turnos de Sofía en la demo para que su reserva sea una primera consulta y pida el motivo; por eso el paciente se captura después del profesional.
   - `SOLO=profesional|paciente`, `ONLY=clave1,clave2` y `NOCANCEL=1` permiten repetir solo una parte.
3. Convertir a WebP (`ffmpeg -i x.png -c:v libwebp -quality 84`) y copiar los recuadros de resaltado de `boxes-es.json` a `src/data/novapsi-boxes.json`.
