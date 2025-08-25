# WS‑MIDI Bridge (Servidor)

Puente **WebSocket ⇄ MIDI** para conectar tu dashboard web con tu DAW/host.

## Instalación rápida

```bash
cd server
npm run setup
```

### macOS
- Activá **IAC Driver** (Configuración de Audio MIDI → Estudio MIDI → IAC → “Dispositivo en línea”).

Ejecutar:
```bash
npm run start:virtual
# o a un bus específico
npm run start:out:iac
```

### Windows
- Instalá **loopMIDI** y creá un puerto (p.ej. "loopMIDI Port 1").

Ejecutar:
```powershell
npm run setup
node server.js --port 8080 --out "loopMIDI Port 1"
```

### Linux
Instalá dependencias del sistema (ALSA):
```bash
sudo apt install -y build-essential libasound2-dev alsa-utils  # Debian/Ubuntu
npm run start:virtual
```

Conectar con `aconnect` si hace falta:
```bash
aconnect -l
aconnect 128:0 129:0
```

## Protocolo

- `{"type":"listOuts"}` → salidas disponibles
- `{"type":"selectOut","name":"IAC Driver Bus 1"}` | `{"index":0}` | `{"virtual":true}`
- MIDI:
  - `{"type":"cc","ch":1,"cc":102,"val":127}`
  - `{"type":"pc","ch":1,"program":10}`
  - `{"type":"noteon","ch":1,"note":60,"vel":100}` / `{"type":"noteoff","ch":1,"note":60}`
  - `{"type":"midi","data":[176,102,127]}`

Respuestas: `{"type":"ack","ok":true|false,"id":"...","error":"..."}`

## Seguridad (opcional)
```bash
WS_TOKEN=secreto node server.js --virtual
# cliente: ws://host:8080?token=secreto
```
