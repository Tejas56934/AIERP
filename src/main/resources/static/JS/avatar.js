// ✅ Correct imports for Three.js v150+ modular usage
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'https://cdn.skypack.dev/gsap@3.12.2';



(() => {

  const modelUrl = '/models/ai_robot.glb';

  const container = document.getElementById('ai-avatar-container');
  const canvas = document.getElementById('ai-avatar-canvas');
  const textBox = document.getElementById('ai-avatar-text');
  const toggleBtn = document.getElementById('ai-avatar-toggle');
  const voiceBtn = document.getElementById('ai-avatar-talk');
  const input = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');

  // Scene setup
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

  function resizeRenderer() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) renderer.setSize(w, h, false);
  }
  resizeRenderer();

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 1.4, 3);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(2, 4, 5);
  scene.add(directionalLight);


  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.9));
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  let mixer = null;
  let actions = {};
  let activeAction = null;
  let modelRoot = null;

  // ✅ Load GLB Model
 const loader = new GLTFLoader();
 loader.load('/models/ai_robot.glb',
   (gltf) => {
     const model = gltf.scene;
     model.scale.set(1.5, 1.5, 1.5);
     model.position.set(0, -1, 0);
     scene.add(model);
     console.log('✅ Model loaded successfully');
   },
   (xhr) => {
     console.log(`Loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
   },
   (error) => {
     console.error('❌ Model failed to load:', error);
   }
 );



  // Animation control
  function setAction(name) {
    if (!mixer) return;
    name = name.toLowerCase();
    const next = actions[name];
    if (!next) return;
    if (activeAction === next) return;
    next.reset().fadeIn(0.2).play();
    if (activeAction) activeAction.fadeOut(0.2);
    activeAction = next;
  }

  // Floating effect using GSAP
  function floatAvatar(object3d) {
    if (!object3d) return;
    gsap.to(object3d.position, {
      y: '+=0.18',
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  // Idle animation drift
  function randomIdle(object3d) {
    setInterval(() => {
      if (!object3d) return;
      gsap.to(object3d.rotation, { y: Math.random() * 0.5 - 0.25, duration: 1.1, ease: 'power1.inOut' });
    }, 4500);
  }

  // Rendering loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    resizeRenderer();
    const dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    renderer.render(scene, camera);
  }

  // ✅ Draggable avatar
  let isDragging = false, offsetX = 0, offsetY = 0;
  container.addEventListener('mousedown', e => {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    container.style.cursor = 'grabbing';
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;
    x = Math.max(6, Math.min(window.innerWidth - container.offsetWidth - 6, x));
    y = Math.max(6, Math.min(window.innerHeight - container.offsetHeight - 6, y));
    container.style.left = x + 'px';
    container.style.top = y + 'px';
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  // Toggle avatar visibility
  toggleBtn.addEventListener('click', () => {
    const visible = canvas.style.display !== 'none';
    canvas.style.display = visible ? 'none' : 'block';
    textBox.style.display = visible ? 'none' : 'block';
    toggleBtn.textContent = visible ? 'Show' : 'Hide';
  });

  // Toggle voice
  let voiceEnabled = true;
  voiceBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    voiceBtn.textContent = voiceEnabled ? 'Voice' : 'Mute';
  });

  // Speak text with browser TTS
  function speakText(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.onstart = () => setAction('talk');
    utter.onend = () => setAction('idle');
    speechSynthesis.speak(utter);
  }

  function showText(txt) {
    textBox.innerText = txt;
    textBox.style.display = 'block';
  }

  // ✅ WebSocket connection
  const wsProto = (location.protocol === 'https:') ? 'wss:' : 'ws:';
  const wsUrl = `${wsProto}//${location.host}/ws/avatar`;
  let socket = null;

  function connectWebSocket() {
    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      console.log('🟢 Avatar WebSocket connected');
      sendPageContext();
    });

    socket.addEventListener('message', ev => {
      try {
        const msg = JSON.parse(ev.data);
        handleServerMessage(msg);
      } catch (e) {
        console.warn('Non-JSON WS message:', ev.data);
      }
    });

    socket.addEventListener('close', () => {
      console.warn('🔴 WebSocket closed, retrying in 3s...');
      setTimeout(connectWebSocket, 3000);
    });
  }
  connectWebSocket();

  function sendPageContext() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'page', page: window.location.pathname }));
  }

  function handleServerMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'speak') {
      showText(msg.text || '');
      if (msg.animation) setAction(msg.animation);
      else setAction('talk');
      speakText(msg.text || '');
    } else if (msg.type === 'action') {
      if (msg.action === 'highlight' && msg.selector) highlightElement(msg.selector);
      if (msg.action === 'move' && msg.selector) moveAvatarNearElement(msg.selector);
      if (msg.action === 'setAction' && msg.name) setAction(msg.name);
    } else if (msg.type === 'system') {
      showText(msg.text || '');
    }
  }

  // Highlight UI element
  function highlightElement(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    const oldShadow = el.style.boxShadow || '';
    el.style.boxShadow = '0 0 12px 3px rgba(255,200,0,0.95)';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => el.style.boxShadow = oldShadow, 2200);
  }

  // Move avatar near element
  function moveAvatarNearElement(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(6, Math.min(window.innerWidth - container.offsetWidth - 6, rect.left - container.offsetWidth - 12));
    const y = Math.max(6, Math.min(window.innerHeight - container.offsetHeight - 6, rect.top - 40));
    gsap.to(container, { left: x + 'px', top: y + 'px', duration: 0.9, ease: 'power2.inOut' });
  }

  // Send user query
  function sendUserQuery(text) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      showText('Connecting to assistant...');
      return;
    }
    socket.send(JSON.stringify({ type: 'user_query', text, page: window.location.pathname }));
    showText('Thinking...');
  }

  sendBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) return;
    sendUserQuery(val);
    input.value = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendBtn.click();
  });

  // Notify backend on form submission
  document.addEventListener('submit', e => {
    const form = e.target;
    const payload = { type: 'user_event', event: 'submit', page: window.location.pathname, formId: form.id || null };
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }, true);
})();
