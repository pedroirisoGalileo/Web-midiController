# MIDI Builder (Web)

Generador de superficies **MIDI** en el navegador. Armá botones y sliders, definí mensajes MIDI (CC/PC/Note), y guardá **múltiples presets** locales o en **archivos `.json`** para compartir. Todo sin dependencias externas: es un único `index.html`.

> **Estado actual**
> - Transporte **WebMIDI** (local) o **WebSocket** (remoto).
> - **Candado por control**: bloquea **posición/tamaño** (layout) pero **no** la funcionalidad MIDI.
> - **Presets múltiples** con **exportar/importar** a JSON.
> - Drag & Drop intuitivo (arrastrá la tarjeta desde zonas no interactivas).

---

## Tabla de contenidos
- [Demo / Screenshot](#demo--screenshot)
- [Características](#características)
- [Requisitos](#requisitos)
- [Uso rápido](#uso-rápido)
- [Instalación](#instalación)
  - [Abrir en local](#abrir-en-local)
  - [Publicar en GitHub Pages](#publicar-en-github-pages)
- [Transporte](#transporte)
  - [WebMIDI (local)](#webmidi-local)
  - [WebSocket (remoto)](#websocket-remoto)
- [Controles](#controles)
  - [Botón: Toggle vs Momentary](#botón-toggle-vs-momentary)
  - [Slider](#slider)
  - [Bloqueo 🔒 (layout)](#bloqueo--layout)
  - [Editar / Borrar](#editar--borrar)
- [Presets](#presets)
  - [Guardar como](#guardar-como)
  - [Cargar](#cargar)
  - [Eliminar](#eliminar)
  - [Exportar](#exportar)
  - [Importar](#importar)
  - [Formato de archivo](#formato-de-archivo)
- [Atajos / Tips](#atajos--tips)
- [Solución de problemas](#solución-de-problemas)
- [Desarrollo](#desarrollo)
- [Licencia](#licencia)

---

## Demo / Screenshot
> _Agregá aquí una captura o GIF de uso. Ej.:_ `docs/screenshot.png`

---

## Características

- **UI modular**: agregá _Botón_ o _Slider_ desde la paleta.
- **Mensajes MIDI** por control:
  - Modo **Auto** → asigna CC seguros **102–119** (evita disparar notas accidentalmente).
  - Modo **Custom** → elegí **CC**, **Program Change (PC)** o **Note On/Off** + canal.
- **Drag & Drop** para ordenar controles. Campo “Columnas” (1–12) para el ancho.
- **Bloqueo por control** (🔒): inmoviliza **solo** su posición/ancho (layout); **la interacción MIDI sigue activa**.
- **Presets múltiples**:
  - Guardá/cargá en `localStorage` (lista desplegable).
  - Exportá/Importá **`.json`** para compartir o versionar.
- **Transporte**:
  - **WebMIDI** (local) — ideal con **IAC Driver** (macOS) / **loopMIDI** (Windows).
  - **WebSocket** — envía un JSON al servidor que vos elijas.

---

## Requisitos

- Navegador **Chromium** (Chrome / Edge) recomendado.
- **HTTPS** para WebMIDI (requerido por el navegador). En **localhost** también funciona.
- Permitir permisos de **MIDI** cuando el navegador lo solicite.
- Opcional (enrutamiento interno):
  - macOS: **IAC Driver** (Audio MIDI Setup → ventana MIDI Studio → doble clic en IAC → Enable).
  - Windows: **loopMIDI** (crear puerto virtual).
  - Linux: **ALSA** puertos virtuales.

---

## Uso rápido

1. Abrí `index.html` (local o hospedado).
2. Elegí **Transporte**:
   - **WebMIDI** (local) → seleccioná **Salida MIDI**.
   - **WebSocket** → poné la **WS URL** (p.ej. `ws://127.0.0.1:8080`).
3. **Canal MIDI** global (1–16) — cada control puede sobreescribirlo.
4. Agregá **Botón** o **Slider**.
5. (Opcional) **Editar** para configurar mensaje (Auto / Custom).
6. **Arrastrá** para reordenar, ajustá **Columnas** (1–12).
7. Activá el **candado** si querés fijar su posición (sin afectar la interacción MIDI).
8. Usá **Preset → Guardar como** para guardar el layout actual.
9. **Exportar** para bajar un `.json` portable; **Importar** para subirlo de vuelta.

---

## Instalación

### Abrir en local
- No requiere build. Solo un archivo HTML.
- Doble clic (o abrir con un servidor estático). Para WebMIDI, preferí **https** o **localhost**.

### Publicar en GitHub Pages
1. Creá un repositorio y agregá el archivo `index.html` (este proyecto).
2. En **Settings → Pages**, elegí:
   - **Source**: `Deploy from a branch`.
   - **Branch**: `main` (o `master`) y **/ (root)**.
3. Guardá. Tu sitio quedará en `https://<usuario>.github.io/<repo>/`.

> Si el archivo se llama `midi-builder.html`, renombralo a **`index.html`** o visitá la URL directa `.../midi-builder.html`.

---

## Transporte

### WebMIDI (local)
- La app usa la API WebMIDI del navegador.
- Elegí la **Salida MIDI** (p.ej. IAC, loopMIDI, un hardware, etc.).
- El LED **READY** se enciende cuando hay transporte OK.

### WebSocket (remoto)
- Definí `WS URL` (ej.: `ws://127.0.0.1:8080`).
- Cada interacción envía un JSON. Ejemplo para **CC** auto:
  ```json
  { "type":"cc", "ch":1, "cc":104, "val":127 }
  ```
- Otros tipos posibles:
  ```json
  { "type":"pc", "ch":1, "val":10 }                  // Program Change
  { "type":"noteon", "ch":1, "note":60, "vel":100 }  // Note On
  { "type":"noteoff", "ch":1, "note":60, "vel":0 }   // Note Off
  ```
- El servidor puede responder con:
  ```json
  { "type":"ack", "ok": true }
  ```
  para incrementar el contador **ACK** (opcional).

> **Ejemplo simple de servidor Node.js (WS → imprimir mensajes):**
> ```js
> import { WebSocketServer } from 'ws';
> const wss = new WebSocketServer({ port: 8080 });
> wss.on('connection', ws => {
>   ws.on('message', msg => {
>     try {
>       const obj = JSON.parse(msg);
>       console.log('MIDI msg:', obj);
>       ws.send(JSON.stringify({ type: 'ack', ok: true }));
>     } catch (e) {}
>   });
> });
> console.log('WS server on ws://127.0.0.1:8080');
> ```

---

## Controles

### Botón: Toggle vs Momentary
- **Toggle**: alterna ON/OFF; envía `valHi` al encender y `valLo` al apagar (para CC), o **Note On/Off** si elegiste tipo `note`.
- **Momentary**: envía al presionar/soltar. ON en `pointerdown`, OFF en `pointerup`.

### Slider
- Envía un **CC** con el valor 0–127 (o lo que hayas configurado en Custom).

### Bloqueo 🔒 (layout)
- El **candado** inmoviliza solo la **posición** y el **ancho** del control (y desactiva el drag).
- **La funcionalidad MIDI permanece activa**. Podés seguir clickeando el botón o moviendo el slider.

### Editar / Borrar
- **Editar** abre el modal de propiedades (etiqueta, grupo, tipo, mensaje, canal y valores).
- **Borrar** elimina el control del lienzo.

---

## Presets

### Guardar como
- Escribí un nombre en **Nombre** y clic en **Guardar como**. Se guarda en `localStorage` y aparece en la lista.

### Cargar
- Elegí un preset de la lista y clic en **Cargar**.

### Eliminar
- Seleccioná y clic en **🗑** (confirmación requerida).

### Exportar
- Descarga un `.json` del preset seleccionado. Si no hay seleccionado, exporta el **estado actual**.

### Importar
- Clic en **Importar** y elegí un `.json`. Si existe un preset con el mismo nombre, se crea **“(2)”**, **“(3)”**, etc.
- Se carga automáticamente tras la importación.

### Formato de archivo
```json
{
  "kind": "midi-builder-preset",
  "name": "Mi Preset",
  "version": 2,
  "createdAt": "2025-08-25T12:34:56.000Z",
  "model": [ /* array de controles */ ],
  "nextCC": 113,
  "mode": "webmidi",
  "ws": "ws://127.0.0.1:8080"
}
```
- `model` contiene cada control con sus props (id, kind, label, group, msgMode, type, num, valLo/valHi, ch, span, state/value, locked).
- `nextCC` retiene el punto de la **asignación segura** de CC (102–119).

---

## Atajos / Tips
- **Reordenar**: arrastrá la **tarjeta** desde zonas no interactivas (no sobre el slider ni el texto del botón).
- **Columnas (1–12)**: define el ancho de cada control en la grilla.
- **Seguridad**: el modo **Auto** usa CC 102–119 para minimizar conflictos con instrumentos/sintetizadores.

---

## Solución de problemas
- **No aparece WebMIDI / no pide permiso**:
  - Asegurate de usar **HTTPS** o **localhost**.
  - Probá en **Chrome/Edge** actualizados.
- **No veo la salida MIDI**:
  - Verificá que exista un puerto virtual (IAC / loopMIDI) o un dispositivo activo.
- **No llega al DAW**:
  - Enrutá el puerto virtual como **entrada** en tu DAW y habilitá “Remote/Control” según el software.
- **WebSocket no conecta**:
  - Revisá la URL (ws:// o wss://) y que el puerto esté abierto.
  - Mirá la consola del navegador para errores.

---

## Desarrollo
- No hay build, es **vanilla HTML/CSS/JS**.
- Podés editar `index.html` a gusto. Pull Requests bienvenidos.

---

## Licencia
Sugerencia: **MIT**. Actualizá este archivo si preferís otra licencia.


---

## WS‑MIDI Bridge (servidor)

Se agregó el puente en [`server/`](server/). Leé [`server/README.md`](server/README.md) para instalación por SO y protocolo.
