// ✅ ===== Mermaid-based Responsive DFD Generator =====

// 1️⃣ Extract steps
function extractDFDSteps(aiText) {
  const steps = [];
  if (Array.isArray(aiText)) return aiText;
  if (typeof aiText !== "string" || aiText.trim() === "") return ["No Data Found"];

  const boldMatches = [
    ...aiText.matchAll(/<b>(.*?)<\/b>/gi),
    ...aiText.matchAll(/\*\*(.*?)\*\*/g)
  ];

  if (boldMatches.length > 0) {
    for (const match of boldMatches) {
      const step = match[1].trim();
      if (step) steps.push(step);
    }
  } else {
    const sentences = aiText.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
    for (let s of sentences) {
      const match = s.match(/(login to [\w\s]+|open [\w\s]+|navigate to [\w\s]+|access [\w\s]+|select [\w\s]+|choose [\w\s]+|click [\w\s]+)/i);
      if (match) steps.push(capitalize(match[0]));
    }
  }

  return [...new Set(steps)];
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function nodeId(i, text) {
  const s = (text || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 20);
  return `n${i}_${s || i}`;
}

function buildMermaidDFD(stepsArray, containerWidthPx = 1200, minNodeWidth = 220) {
  const steps = stepsArray.slice();
  const nodesPerRow = Math.max(1, Math.floor(containerWidthPx / minNodeWidth));

  let mermaid = `flowchart LR\n  classDef process fill:#ffffff,stroke:#2563eb,stroke-width:2,rx:8,ry:8;\n  classDef stepLabel fill:#f8fafc,stroke:none;\n`;

  for (let r = 0; r < Math.ceil(steps.length / nodesPerRow); r++) {
    const start = r * nodesPerRow;
    const end = Math.min(steps.length, start + nodesPerRow);
    mermaid += `  subgraph row${r} [ ]\n    direction LR\n`;

    for (let i = start; i < end; i++) {
      const id = nodeId(i, steps[i]);
      const label = steps[i].replace(/\n/g, ' ').replace(/"/g, '\\"');
      mermaid += `    ${id}["${label}"]:::process\n`;
    }

    if (end - start >= 2) {
      for (let i = start; i < end - 1; i++) {
        mermaid += `    ${nodeId(i, steps[i])} --> ${nodeId(i + 1, steps[i + 1])}\n`;
      }
    }

    mermaid += `  end\n\n`;
  }

  return mermaid;
}

async function renderMermaidDFD(input, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // 🧠 Extract DFD steps safely
  const dfdData = extractDFDSteps(input)
    .map(step => step.replace(/[^\w\s]/g, '').trim()) // remove invalid chars
    .filter(step => step.length > 0);

  if (dfdData.length < 2) {
    container.innerHTML = "<p style='color:#888;'>No valid DFD detected</p>";
    return;
  }

  // 🧩 Build a valid Mermaid diagram
  const mermaidDefinition = `
    graph TD
    ${dfdData.map((step, i) => `A${i}["${step}"]`).join('\n')}
    ${dfdData.map((_, i, arr) => (i < arr.length - 1 ? `A${i} --> A${i + 1}` : '')).join('\n')}
  `;

  // 🎨 Insert Mermaid container (compact layout)
  container.innerHTML = `
    <div class="mermaid" style="
      width: 100%;
      max-width: 600px;
      margin: 10px auto;
      background: #f9fafc;
      border-radius: 10px;
      padding: 10px;
      overflow-x: auto;
      transform: scale(0.85);
      transform-origin: top left;
      font-size: 11px;
    ">
      ${mermaidDefinition}
    </div>
  `;

  // ⚙️ Render Mermaid safely
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      themeVariables: {
        primaryColor: "#eef3fc",
        edgeLabelBackground: "#fff",
        fontSize: "11px",
        nodeBorder: "#888",
        lineColor: "#999"
      },
    });

    const mermaidDiv = container.querySelector('.mermaid');
    try {
      const { svg } = await mermaid.render(`dfd-${Date.now()}`, mermaidDefinition);
      mermaidDiv.innerHTML = svg;
    } catch (err) {
      console.error("Mermaid render error:", err);
      container.innerHTML = "<p style='color:red;'>⚠️ Unable to render DFD</p>";
    }
  }
}




const chatContainer = document.getElementById('chatContainer');
const inputField = document.getElementById('userInput');
const fileInput = document.getElementById('fileInput');
const addFilesButton = document.getElementById('AddFiles');
const historyBtn = document.getElementById('historyBtn');
const sidebar = document.getElementById('SideBar');
const historyList = document.getElementById('historyList');
const micBtn = document.getElementById("micBtn");
const userInput = document.getElementById("userInput");
const themeToggle = document.getElementById("themeToggle");

const body = document.body;


const clearHistoryBtn = document.getElementById("clearHistory");
const sortSelect = document.getElementById("sortHistory");
const searchInput = document.getElementById("searchHistory");


let chatHistory = [];
let filteredHistory = [];
let debounceTimer = null;

// ✅ Load all history once (no query)
async function loadChatHistory() {
  try {
    const res = await fetch("http://localhost:8080/history");
    if (!res.ok) throw new Error("Failed to load history");
    chatHistory = await res.json();
    filteredHistory = [...chatHistory];
    applySortingAndRender();
  } catch (err) {
    console.error("Server fetch error:", err);
    historyList.innerHTML = "<p style='color:red;text-align:center;'>⚠️ Unable to load history</p>";
  }
}

// ✅ Render
function renderHistory(list) {
  historyList.innerHTML = "";
  if (!list.length) {
    historyList.innerHTML = "<p style='text-align:center;color:#666;'>No results</p>";
    return;
  }
  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<span><b>${item.topic || "General"}</b> — ${item.text}</span>
                     <button class="delete-btn" title="Remove from view">🗑️</button>`;
    div.querySelector(".delete-btn").addEventListener("click", async () => {
      div.remove();
      filteredHistory = filteredHistory.filter(h => h.id !== item.id);
    });
    historyList.appendChild(div);
  });
}

// ✅ Sorting
function applySorting(list) {
  const sorted = [...list];
  if (sortSelect.value === "date") {
    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortSelect.value === "topic") {
    sorted.sort((a, b) => (a.topic || "").localeCompare(b.topic || ""));
  }
  return sorted;
}

function applySortingAndRender() {
  renderHistory(applySorting(filteredHistory));
}

// ✅ Fixed Search (Client-side only)
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  if (query === "") {
    filteredHistory = [...chatHistory]; // show all again
  } else {
    filteredHistory = chatHistory.filter(item =>
      (item.text && item.text.toLowerCase().includes(query)) ||
      (item.topic && item.topic.toLowerCase().includes(query))
    );
  }

  applySortingAndRender(); // re-render only matches
});

sortSelect.addEventListener("change", () => {
  applySortingAndRender();
});

// initial load
loadChatHistory();

// 🗑️ Clear All (Frontend Only)
clearHistoryBtn.addEventListener("click", () => {
  if (confirm("Clear all chat history from view?")) {
    historyList.innerHTML = "";
  }
});

// 🚀 Load on Startup
loadChatHistory();

let selectedFile = null;

// 📂 File upload
addFilesButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedFile = e.target.files[0];
    appendMessage('user', `📎 Selected file: ${selectedFile.name}`);
  }
});

// 🧠 Send to AI
async function sendToAI() {
  const query = inputField.value.trim();
  if (!query && !selectedFile) return;

  if (query) appendMessage('user', query);
  inputField.value = '';

  const thinkingMessage = appendMessage('ai', '<span class="typing"><span></span><span></span><span></span></span>');

  try {
    let res;
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('query', query);
      res = await fetch("http://localhost:8080/api/ai/ask-file", { method: "POST", body: formData });
      selectedFile = null;
    } else {
      res = await fetch("http://localhost:8080/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query
      });
    }

    const text = await res.text();
        thinkingMessage.remove();
        appendMessage('ai', text, true);
        saveQueryToDB(query, text);
        speakAIResponse(text);
      } catch (error) {
        thinkingMessage.remove();
        appendMessage('ai', "⚠️ Error connecting to server: " + error.message);
      }
}

// 💾 Save to DB
async function saveQueryToDB(query, response) {
  try {
    await fetch("http://localhost:8080/api/ai/save-query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ userName: "User", queryText: query, responseText: response })
    });
  } catch (e) {
    console.error("Error saving query:", e);
  }
}

// 🗂️ Load history (sidebar)
historyBtn.addEventListener('click', async () => {
  sidebar.classList.toggle('active');
  if (sidebar.classList.contains('active')) await loadHistory();
});

async function loadHistory() {
  historyList.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch("http://localhost:8080/api/ai/history");
    const data = await res.json();
    historyList.innerHTML = "";
    if (data.length === 0) {
      historyList.innerHTML = "<p>No history found</p>";
      return;
    }

    data.slice().reverse().forEach(item => {
      const div = document.createElement("div");
      div.className = "history-item";

      const time = new Date(item.timestamp);
      const formatted = time.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      div.innerHTML = `
        <strong>${item.query}</strong><br>
        <small>${formatted}</small>
      `;

      div.addEventListener("click", () =>
        showChat(item.query, item.response, formatted)
      );

      historyList.appendChild(div);
    });
  } catch (err) {
    historyList.innerHTML = "<p>Error loading history</p>";
  }
}


function showChat(query, response) {
  chatContainer.innerHTML = "";
  appendMessage('user', query);
  appendMessage('ai', response, true);
}
// 💬 Append message (Updated for AI DFD)
function appendMessage(role, message, markdown = false) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  if (role === "ai") {
    const dfdSteps = extractDFDSteps(message);

    const responseBlock = document.createElement("div");
    responseBlock.className = "ai-response-block";

    const textPart = document.createElement("div");
    textPart.className = "ai-text-part";
    textPart.innerHTML = `
      <div class="message-content">
        ${markdown ? marked.parse(message) : message}
        <button class="copy-btn" onclick="copyText(this)">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>`;

    const dfdPart = document.createElement("div");
    dfdPart.className = "ai-dfd-part";

    if (dfdSteps.length > 1) {
      const dfdContainer = document.createElement("div");
      dfdContainer.id = "myDfdContainer_" + Date.now();
      dfdContainer.className = "dfd-container";
      dfdPart.appendChild(dfdContainer);

      setTimeout(() => renderMermaidDFD(message, `#${dfdContainer.id}`), 200);
    }

    responseBlock.appendChild(textPart);
    responseBlock.appendChild(dfdPart);
    div.appendChild(responseBlock);
  } else {
    div.innerHTML = `<div class="message-content">${message}</div>`;
  }

  chatContainer.appendChild(div);
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  return div;
}



function copyText(button) {
  const text = button.parentElement.innerText.replace("Copy", "").trim();
  navigator.clipboard.writeText(text).then(() => {
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.add("copied");
    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-copy"></i> Copy';
      button.classList.remove("copied");
    }, 1500);
  });
}

// 🎤 MIC + SPEECH SYSTEM
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;

  micBtn.addEventListener('click', () => {
    recognition.start();
    micBtn.innerText = '🎧 Listening...';
  });

  recognition.onresult = async (event) => {
    const voiceQuery = event.results[0][0].transcript;
    micBtn.innerText = '🎤 Speak';
    appendMessage('user', `🎤 ${voiceQuery}`);
    inputField.value = voiceQuery;
    sendToAI();
  };

  recognition.onerror = () => {
    micBtn.innerText = '🎤 Speak';
  };
} else {
  micBtn.disabled = true;
  micBtn.innerText = "🎤 Not Supported";
}

// 🎤 AI speech
function speakAIResponse(text) {
  let sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  let shortResponse = sentences.slice(0, 2).join('. ') + '.';
  const utterance = new SpeechSynthesisUtterance(shortResponse);
  utterance.lang = 'en-IN';
  utterance.pitch = 1.1;
  utterance.rate = 1;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.name.includes('Google') && v.lang === 'en-IN');
  if (indianVoice) utterance.voice = indianVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

inputField.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendToAI();
});




