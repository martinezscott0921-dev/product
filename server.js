import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};

async function chat(body) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {method:'POST', headers:{'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':'http://localhost:4173','X-Title':'Woli Companion'}, body:JSON.stringify({model:'openai/gpt-4o-mini', messages:[{role:'system',content:'你是温柔可爱的陪伴猫咪团团。用简短、自然的中文回复，返回 JSON：{"reply":"...","emotion":"happy|comfort|curious|sleepy"}。只返回 JSON。'},{role:'user',content:body.message}], temperature:.8})});
  if (!r.ok) throw new Error(`OpenRouter ${r.status}`);
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content || '{"reply":"我在这里陪着你。","emotion":"comfort"}';
  try { return JSON.parse(text.replace(/^```json\s*|\s*```$/g,'')); } catch { return {reply:text, emotion:'comfort'}; }
}
const server = http.createServer(async (req,res)=>{
  if (req.url === '/api/chat' && req.method === 'POST') {
    let raw=''; req.on('data', c=>raw+=c); req.on('end', async()=>{try { const out=await chat(JSON.parse(raw)); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(out)); } catch(e) { res.writeHead(502,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'AI 服务暂时不可用'})); }}); return;
  }
  const file = path.join(root, req.url === '/' ? 'index.html' : req.url);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}); fs.createReadStream(file).pipe(res);
});
server.listen(port,'0.0.0.0',()=>console.log(`Woli running on ${port}`));
