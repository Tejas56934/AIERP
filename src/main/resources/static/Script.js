// ============================================
// AI ERP ASSISTANT - COMPLETE JAVASCRIPT
// ============================================

// ===== MERMAID DFD GENERATOR (PRESERVED LOGIC) =====

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

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function nodeId(i, text) {
    const s = (text || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 20);
    return `n${i}_${s || i}`;
}

function buildMermaidDFD(stepsArray, containerWidthPx = 1200, minNodeWidth = 220) {
    const steps = stepsArray.slice();
    const nodesPerRow = Math.max(1, Math.floor(containerWidthPx / minNodeWidth));

    let mermaid = `flowchart LR\n  classDef process fill:#ffffff,stroke:#6366f1,stroke-width:2,rx:8,ry:8;\n  classDef stepLabel fill:#f8fafc,stroke:none;\n`;

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

    // Check if DFD is enabled in settings
    const showDFD = document.getElementById('showDFD');
    if (showDFD && !showDFD.checked) {
        container.style.display = 'none';
        return;
    }

    const dfdData = extractDFDSteps(input)
        .map(step => step.replace(/[^\w\s]/g, '').trim())
        .filter(step => step.length > 0);

    if (dfdData.length < 2) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">
            <i class="fa-solid fa-diagram-project"></i> No valid DFD detected
        </p>`;
        return;
    }

    const mermaidDefinition = `
        graph TD
        ${dfdData.map((step, i) => `A${i}["${step}"]`).join('\n')}
        ${dfdData.map((_, i, arr) => (i < arr.length - 1 ? `A${i} --> A${i + 1}` : '')).join('\n')}
    `;

    container.innerHTML = `
        <div class="dfd-header">
            <span><i class="fa-solid fa-diagram-project"></i> Process Flow Diagram</span>
            <button class="dfd-copy-btn" onclick="copyDFD(this)">
                <i class="fa-solid fa-copy"></i> Copy
            </button>
        </div>
        <div class="mermaid">${mermaidDefinition}</div>
    `;

    if (window.mermaid) {
        mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            themeVariables: {
                primaryColor: "#6366f1",
                primaryTextColor: "#1e293b",
                primaryBorderColor: "#6366f1",
                lineColor: "#8b5cf6",
                secondaryColor: "#f1f5f9",
                tertiaryColor: "#e0e7ff",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif"
            },
        });

        const mermaidDiv = container.querySelector('.mermaid');
        try {
            const { svg } = await mermaid.render(`dfd-${Date.now()}`, mermaidDefinition);
            mermaidDiv.innerHTML = svg;
        } catch (err) {
            console.error("Mermaid render error:", err);
            container.innerHTML = `<p style="color: var(--error); text-align: center; padding: 20px;">
                <i class="fa-solid fa-exclamation-triangle"></i> Unable to render DFD
            </p>`;
        }
    }
}

function copyDFD(btn) {
    const container = btn.closest('.ai-dfd-part') || btn.closest('.dfd-container');
    const svg = container.querySelector('svg');
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        navigator.clipboard.writeText(svgData).then(() => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
            }, 2000);
        });
    }
}

// ===== DOM ELEMENTS =====

const chatContainer = document.getElementById('chatContainer');
const inputField = document.getElementById('userInput');
const fileInput = document.getElementById('fileInput');
const addFilesButton = document.getElementById('AddFiles');
const historyBtn = document.getElementById('historyBtn');
const sidebar = document.getElementById('SideBar');
const historyList = document.getElementById('historyList');
const micBtn = document.getElementById("micBtn");
const themeToggle = document.getElementById("themeToggle");
const clearHistoryBtn = document.getElementById("clearHistory");
const sortSelect = document.getElementById("sortHistory");
const searchInput = document.getElementById("searchHistory");
const sendBtn = document.getElementById("sendBtn");
const refreshBtn = document.getElementById("refreshBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSidebar = document.getElementById("closeSidebar");
const fileIndicator = document.getElementById("fileIndicator");
const fileName = document.getElementById("fileName");
const removeFileBtn = document.getElementById("removeFile");
const globalSearch = document.getElementById("globalSearch");
const welcomeCard = document.getElementById("welcomeCard");
const exportHistoryBtn = document.getElementById("exportHistory");

// ===== STATE VARIABLES =====

let chatHistory = [];
let filteredHistory = [];
let selectedFile = null;
let isRecording = false;
let currentTheme = localStorage.getItem('theme') || 'dark';

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Apply saved theme
    applyTheme(currentTheme);

    // Load chat history
    loadChatHistory();

    // Setup event listeners
    setupEventListeners();

    // Initialize Mermaid
    if (window.mermaid) {
        mermaid.initialize({ startOnLoad: false });
    }

    // Show welcome message
    console.log('%c🚀 AI ERP Assistant Initialized', 'color: #6366f1; font-size: 16px; font-weight: bold;');
}

function setupEventListeners() {
    // Send message
    sendBtn?.addEventListener('click', sendToAI);
    inputField?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToAI();
        }
    });

    // File handling
    addFilesButton?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', handleFileSelect);
    removeFileBtn?.addEventListener('click', removeSelectedFile);

    // Sidebar
    historyBtn?.addEventListener('click', toggleSidebar);
    closeSidebar?.addEventListener('click', () => sidebar?.classList.remove('active'));

    // History controls
    searchInput?.addEventListener('input', handleHistorySearch);
    sortSelect?.addEventListener('change', applySortingAndRender);
    clearHistoryBtn?.addEventListener('click', handleClearHistory);
    exportHistoryBtn?.addEventListener('click', exportHistory);

    // Theme toggle
    themeToggle?.addEventListener('click', toggleTheme);

    // Refresh
    refreshBtn?.addEventListener('click', () => location.reload());

    // Settings
    settingsBtn?.addEventListener('click', () => settingsModal?.classList.add('active'));
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            settingsModal?.classList.remove('active');
        });
    });

    // Quick actions
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.dataset.query;
            if (query) {
                inputField.value = query;
                sendToAI();
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (sidebar?.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !historyBtn?.contains(e.target)) {
            sidebar.classList.remove('active');
        }
        if (settingsModal?.classList.contains('active') &&
            !settingsModal.querySelector('.modal-content').contains(e.target) &&
            !settingsBtn?.contains(e.target)) {
            settingsModal.classList.remove('active');
        }
    });

    // Voice input
    setupVoiceRecognition();
}

// ===== KEYBOARD SHORTCUTS =====

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K - Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        globalSearch?.focus();
    }
    // Ctrl/Cmd + M - Toggle mic
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        micBtn?.click();
    }
    // Ctrl/Cmd + U - Upload file
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInput?.click();
    }
    // Escape - Close modals/sidebar
    if (e.key === 'Escape') {
        sidebar?.classList.remove('active');
        settingsModal?.classList.remove('active');
    }
}

// ===== THEME HANDLING =====

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

// ===== FILE HANDLING =====

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        fileName.textContent = selectedFile.name;
        fileIndicator.style.display = 'flex';
        showToast('success', 'File attached', selectedFile.name);
    }
}

function removeSelectedFile() {
    selectedFile = null;
    fileInput.value = '';
    fileIndicator.style.display = 'none';
}

// ===== CHAT HISTORY (PRESERVED LOGIC) =====

async function loadChatHistory() {
    try {
        const res = await fetch("http://localhost:8080/history");
        if (!res.ok) throw new Error("Failed to load history");
        chatHistory = await res.json();
        filteredHistory = [...chatHistory];
        applySortingAndRender();
    } catch (err) {
        console.error("Server fetch error:", err);
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>
                <p>No history available</p>
            </div>
        `;
    }
}

function renderHistory(list) {
    historyList.innerHTML = "";
    if (!list.length) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-search" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>
                <p>No results found</p>
            </div>
        `;
        return;
    }

    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";

        const date = item.date ? new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        div.innerHTML = `
            <strong>${item.topic || item.query || "General"}</strong>
            <small>${item.text || date}</small>
            <button class="delete-btn" title="Remove">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        div.querySelector(".delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            div.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                div.remove();
                filteredHistory = filteredHistory.filter(h => h.id !== item.id);
            }, 300);
        });

        div.addEventListener("click", () => {
            showChat(item.query, item.response);
            sidebar?.classList.remove('active');
        });

        historyList.appendChild(div);
    });
}

function applySorting(list) {
    const sorted = [...list];
    if (sortSelect?.value === "date") {
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortSelect?.value === "topic") {
        sorted.sort((a, b) => (a.topic || "").localeCompare(b.topic || ""));
    }
    return sorted;
}

function applySortingAndRender() {
    renderHistory(applySorting(filteredHistory));
}

function handleHistorySearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
        filteredHistory = [...chatHistory];
    } else {
        filteredHistory = chatHistory.filter(item =>
            (item.text && item.text.toLowerCase().includes(query)) ||
            (item.topic && item.topic.toLowerCase().includes(query)) ||
            (item.query && item.query.toLowerCase().includes(query))
        );
    }

    applySortingAndRender();
}

function handleClearHistory() {
    if (confirm("Are you sure you want to clear all chat history?")) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size: 40px; margin-bottom: 15px; display: block;"></i>
                <p>History cleared</p>
            </div>
        `;
        chatHistory = [];
        filteredHistory = [];
        showToast('success', 'History cleared', 'All conversations have been removed');
    }
}

function exportHistory() {
    if (chatHistory.length === 0) {
        showToast('warning', 'No history', 'There is no history to export');
        return;
    }

    const dataStr = JSON.stringify(chatHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Exported', 'Chat history downloaded successfully');
}

function toggleSidebar() {
    sidebar?.classList.toggle('active');
    if (sidebar?.classList.contains('active')) {
        loadChatHistory();
    }
}