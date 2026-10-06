# 窝里 · 萌宠猫咪语音互动

一个无依赖、可直接打开的前端 MVP。主界面使用 CSS 绘制猫咪和温馨小家，支持情绪气泡、场景快捷入口、录音权限、按住说话、免提模式和移动端侧栏。

## 本地运行

```bash
cd /workspace/product
python3 -m http.server 4173
```

访问 `http://127.0.0.1:4173/`。录音功能需要 localhost/HTTPS 和麦克风权限。

## 生产架构

```text
浏览器 (MediaRecorder/WebSocket + CSS/Lottie Avatar)
        │ 16k PCM/Opus chunks
        ▼
Realtime Gateway (Node.js/Fastify，鉴权、打断、限流)
        ├─ STT: OpenAI Realtime/Whisper 或 AssemblyAI
        ├─ LLM: GPT-4o-mini（回复 + JSON emotion/action）
        ├─ Memory: Postgres + pgvector（偏好/摘要）
        └─ TTS: OpenAI TTS 或 ElevenLabs（音频流）
        ▼
{ transcript, reply, emotion, action, audioUrl }
        ▼
前端同步播放语音，切换表情/动作（优先 Lottie/Rive；视频 Avatar 作为增强）
```

`app.js` 中的 `voice-captured`/`text-prompt` 事件和 WebSocket 注释是后端接入点。LLM 建议强制返回 `{reply, emotion, action, memoryCandidates}`，前端用 emotion/action 白名单映射到 6 种表情和 4 种动作。

## 服务选择与预算（基础版）

- STT：OpenAI Realtime 延迟最低、链路简单；Whisper 自托管成本低但运维较重；AssemblyAI 有成熟的流式转写和情绪能力。
- LLM：GPT-4o-mini 适合中文和结构化输出，成本/速度平衡；Claude 适合长上下文；Llama 3 适合自托管隐私场景。
- TTS：OpenAI TTS 接入简单；ElevenLabs 音色和情绪最好但单价更高；PlayHT 音色多、延迟略高。
- Avatar：首版使用 Lottie/Rive（稳定、可控、便宜）；D-ID/HeyGen/Decart 适合真人口型视频，但延迟、成本和风格一致性更难控制。
- 4–6 周 1 名全栈可交付基础版（不含视频 Avatar）：约 ¥8–20 万人力；云服务早期约 ¥500–3000/月，按 1,000 次 1 分钟对话计费另加模型费用。
