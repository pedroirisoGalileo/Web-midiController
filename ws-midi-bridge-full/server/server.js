// server.js
const WebSocket = require('ws');
const easymidi = require('easymidi');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const readline = require('readline');
const url = require('url');

const argv = yargs(hideBin(process.argv))
  .option('port',    { type: 'number', default: process.env.PORT || 8080 })
  .option('host',    { type: 'string', default: process.env.HOST || '0.0.0.0' })
  .option('out',     { type: 'string', default: process.env.MIDI_OUT || '' })
  .option('virtual', { type: 'boolean', default: /^(1|true)$/i.test(String(process.env.MIDI_VIRTUAL || '')) })
  .option('token',   { type: 'string', default: process.env.WS_TOKEN || '' })
  .help().argv;

const PORT = argv.port;
const HOST = argv.host;
const REQ_TOKEN = argv.token || '';
const VIRTUAL_NAME = 'WS-MIDI Bridge';

let midiOut = null;
let midiOutName = null;
let virtualMode = false;

function listOutputs() { return easymidi.getOutputs(); }
function openOutputByName(name){ closeOut(); midiOut=new easymidi.Output(name); midiOutName=name; virtualMode=false; log('Salida:',name); }
function openVirtual(){ closeOut(); midiOut=new easymidi.Output(VIRTUAL_NAME,true); midiOutName=VIRTUAL_NAME; virtualMode=true; log('Virtual:',VIRTUAL_NAME); }
function closeOut(){ if(midiOut){ try{midiOut.close();}catch{} midiOut=null; midiOutName=null; virtualMode=false; } }

function sendCC(cc,val,ch=1){ if(!midiOut) throw Error('no_output'); midiOut.send('cc',{controller:(cc|0)&127,value:(val|0)&127,channel:((ch|0)-1)&15}); }
function sendPC(pg,ch=1){ if(!midiOut) throw Error('no_output'); midiOut.send('program',{number:(pg|0)&127,channel:((ch|0)-1)&15}); }
function sendNote(on,note,vel=100,ch=1){ if(!midiOut) throw Error('no_output'); midiOut.send(on?'noteon':'noteoff',{note:(note|0)&127,velocity:on?((vel|0)&127):0,channel:((ch|0)-1)&15}); }

function log(...a){ console.log('[WS-MIDI]',...a); }
function warn(...a){ console.warn('[WS-MIDI]',...a); }

async function pickOutputIfNeeded(){
  const outs=listOutputs();
  if(argv.virtual){ openVirtual(); return; }
  if(argv.out){
    if(outs.includes(argv.out)) { openOutputByName(argv.out); return; }
    warn('--out no existe; creando virtual'); openVirtual(); return;
  }
  if(!outs.length){ warn('Sin salidas; creando virtual'); openVirtual(); return; }
  console.log('Salidas MIDI:');
  outs.forEach((n,i)=>console.log(`[${i}] ${n}`));
  console.log('Elegí índice y ENTER (o "v" para virtual):');
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  const ans=await new Promise(r=>rl.question('> ',x=>(rl.close(),r(x.trim()))));
  if(/^v$/i.test(ans)) return openVirtual();
  const idx=+ans; if(Number.isInteger(idx) && outs[idx]) openOutputByName(outs[idx]); else { warn('Selección inválida; virtual'); openVirtual(); }
}

const wss = new WebSocket.Server({ host: HOST, port: PORT }, ()=>{
  log(`WS en ws://${HOST}:${PORT}`);
  if(REQ_TOKEN) log(`Auth con token activada (?token=...)`);
});

wss.on('connection',(ws,req)=>{
  if(REQ_TOKEN){
    const q=url.parse(req.url,true).query;
    if(q.token!==REQ_TOKEN){ ws.close(1008,'invalid token'); return; }
  }
  log('Cliente conectado');
  safeSend(ws,{type:'hello',version:'1.0',outputs:listOutputs(),selected:midiOutName,virtual:virtualMode});

  ws.on('message',(d)=>{
    let m; try{ m=JSON.parse(String(d)); }catch{ return safeSend(ws,{type:'ack',ok:false,error:'json_invalid'}); }

    if(m.type==='ping') return safeSend(ws,{type:'pong',t:Date.now()});
    if(m.type==='listOuts') return safeSend(ws,{type:'outs',outputs:listOutputs(),selected:midiOutName,virtual:virtualMode});

    if(m.type==='selectOut'){
      try{
        if(m.virtual) openVirtual();
        else if(typeof m.name==='string' && listOutputs().includes(m.name)) openOutputByName(m.name);
        else if(Number.isInteger(m.index)){ const outs=listOutputs(); if(outs[m.index]) openOutputByName(outs[m.index]); else throw Error('index_invalid'); }
        else throw Error('params_invalid');
        broadcast({type:'outs',outputs:listOutputs(),selected:midiOutName,virtual:virtualMode});
        return safeSend(ws,{type:'ack',ok:true,id:m.id??null});
      }catch(e){ return safeSend(ws,{type:'ack',ok:false,id:m.id??null,error:String(e.message||e)}); }
    }

    try{
      switch(m.type){
        case 'cc': sendCC(m.cc,m.val,m.ch||1); break;
        case 'pc': sendPC(m.program ?? m.val ?? 0, m.ch||1); break;
        case 'noteon': sendNote(true,m.note,m.vel??100,m.ch||1); break;
        case 'noteoff': sendNote(false,m.note,0,m.ch||1); break;
        case 'midi':
          if(!Array.isArray(m.data)) throw Error('data_invalid');
          if(!midiOut) throw Error('no_output');
          midiOut.send('message', m.data.map(x=>x&0xFF));
          break;
        default: return safeSend(ws,{type:'ack',ok:false,id:m.id??null,error:'type_unknown'});
      }
      safeSend(ws,{type:'ack',ok:true,id:m.id??null});
    }catch(e){ safeSend(ws,{type:'ack',ok:false,id:m.id??null,error:String(e.message||e)}); }
  });
});

function safeSend(ws,obj){ try{ ws.readyState===WebSocket.OPEN && ws.send(JSON.stringify(obj)); }catch{} }
function broadcast(obj){ const s=JSON.stringify(obj); wss.clients.forEach(c=>{ try{ c.readyState===WebSocket.OPEN && c.send(s); }catch{} }); }

function shutdown(){ log('Cerrando…'); wss.clients.forEach(c=>{ try{ c.close(1001,'server_shutdown'); }catch{} }); wss.close(()=>{}); closeOut(); setTimeout(()=>process.exit(0),200); }
process.on('SIGINT',shutdown); process.on('SIGTERM',shutdown);

(async()=>{ await pickOutputIfNeeded(); })();
