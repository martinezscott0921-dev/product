const mic = document.querySelector('#micBtn');
const waveform = document.querySelector('#waveform');
const catWrap = document.querySelector('#catWrap');
const moodBubble = document.querySelector('#moodBubble');
const moodLabel = document.querySelector('#moodLabel');
const modeBtn = document.querySelector('#modeBtn');
const handsFree = document.querySelector('#handsFree');
const sidebar = document.querySelector('#sidebar');
const menuBtn = document.querySelector('#menuBtn');
let recording = false;
let recorder;
let chunks = [];

const moods = [
  {label:'晴朗心情', text:'今天也要元气满满呀！'},
  {label:'温柔安慰', text:'辛苦啦，先靠过来抱抱。'},
  {label:'好奇探头', text:'嗯？快告诉我发生什么啦。'},
  {label:'困困陪伴', text:'我们一起慢慢放松下来吧。'}
];

function setSpeaking(on) {
  catWrap.classList.toggle('speaking', on);
  waveform.classList.toggle('active', on);
}
function setMood(index) {
  const mood = moods[index % moods.length];
  moodLabel.textContent = mood.label;
  moodBubble.textContent = mood.text;
  setSpeaking(true);
  window.setTimeout(() => setSpeaking(false), 2600);
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setMood(2);
    moodBubble.textContent = '浏览器暂不支持录音，但我在听你说。';
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      // Production: send this Blob to the WebSocket/STT endpoint.
      const audio = new Blob(chunks, {type:'audio/webm'});
      window.dispatchEvent(new CustomEvent('voice-captured', {detail: audio}));
      setMood(Math.floor(Math.random() * moods.length));
    };
    recorder.start();
    recording = true;
    mic.classList.add('recording');
    mic.setAttribute('aria-label','结束录音');
    waveform.classList.add('active');
    moodBubble.textContent = '我在听，慢慢说…';
    catWrap.classList.add('speaking');
  } catch (error) {
    setMood(1);
    moodBubble.textContent = '麦克风没有打开，但我会一直陪着你。';
  }
}
function stopRecording() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
  recording = false;
  mic.classList.remove('recording');
  mic.setAttribute('aria-label','开始录音');
  waveform.classList.remove('active');
}
mic.addEventListener('pointerdown', e => { e.preventDefault(); if (!recording) startRecording(); });
['pointerup','pointercancel','pointerleave'].forEach(type => mic.addEventListener(type, () => { if(recording) stopRecording(); }));
mic.addEventListener('click', () => { if (recording) stopRecording(); });

document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
  moodBubble.textContent = '收到啦，我来陪你。';
  setSpeaking(true);
  window.setTimeout(() => setSpeaking(false), 2500);
  const prompt = button.dataset.prompt;
  window.dispatchEvent(new CustomEvent('text-prompt', {detail: prompt}));
  fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:prompt})}).then(r=>r.json()).then(data=>{ if(data.reply){ moodBubble.textContent=data.reply; setSpeaking(true); setTimeout(()=>setSpeaking(false),3500); } }).catch(()=>{});
}));

modeBtn.addEventListener('click', () => {
  modeBtn.innerHTML = modeBtn.textContent.includes('按住') ? '<span>◉</span> 点击说话 <i>⌄</i>' : '<span>◉</span> 按住说话 <i>⌄</i>';
});
handsFree.addEventListener('click', () => {
  handsFree.textContent = handsFree.textContent.includes('开启') ? '已开启免提模式' : '开启免提模式';
  handsFree.style.color = handsFree.textContent.includes('已开启') ? '#72ad91' : '';
});
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  item.classList.add('active');
  sidebar.classList.remove('open');
}));

// WebSocket integration seam for the production backend.
// const socket = new WebSocket(import.meta.env.VITE_WS_URL);
// socket.onmessage = ({data}) => { const {emotion, audioUrl} = JSON.parse(data); setMood(emotionMap[emotion]); new Audio(audioUrl).play(); };
