param([string]$Port="8080",[string]$Out="loopMIDI Port 1",[string]$Token="")
npm install
if ($Token -ne "") { $env:WS_TOKEN = $Token }
node server.js --port $Port --out "$Out"
