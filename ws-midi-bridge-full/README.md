# WS‑MIDI Bridge — Proyecto completo (Web + Servidor)

Controlá tu DAW desde un dashboard web. Estructura:
- `/web` — UI (copiada de tu proyecto)
- `/server` — puente WebSocket ⇄ MIDI

## Cómo correr
### Servidor
```bash
cd server
npm run setup
npm run start:virtual   # macOS/Linux (puerto virtual)
# o a salida específica:
node server.js --out "IAC Driver Bus 1"
node server.js --out "loopMIDI Port 1"
```

### Web
Serví `/web` con tu servidor estático o GH Pages y apuntá el WS a `ws://IP_PC:8080`.
