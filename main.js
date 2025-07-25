const messageContainer = document.getElementById("message");
const messageInput = document.getElementById("message-input");
const voiceBtn = document.getElementById("voice-btn");
const scrollBtn = document.getElementById("scroll-btn");

const API_KEY = "kode api kamu";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
const username = localStorage.getItem("chantik_username");

let chatMemory = []; // 🧠 Tambahkan di sini, setelah variabel utama

if (!username) {
  window.location.href = "login.html";
}

function addMessageAnimated(text, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;

  const messageText = document.createElement("div");
  messageText.className = "message-text";
  messageDiv.appendChild(messageText);

  if (!isUser) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "🗑";
    deleteBtn.onclick = () => deleteSingleMessage(text, messageDiv);
    messageDiv.appendChild(deleteBtn);
  }

  const timestamp = document.createElement("div");
  timestamp.className = "timestamp";
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  messageDiv.appendChild(timestamp);

  messageContainer.appendChild(messageDiv);
  scrollToBottom();
  updateScrollButton();

  let index = 0;
  const typingSpeed = 0;

  function typeChar() {
    if (index < text.length) {
      messageText.innerHTML += text.charAt(index);
      index++;
      scrollToBottom();
      setTimeout(typeChar, typingSpeed);
    } else {
      formatMessageContent(messageText);
    }
  }

  typeChar();
}

function formatMessageContent(container) {
  let raw = container.innerHTML;

  let codeBlocks = [];
  raw = raw.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = escapeHtml(code);
    const block = `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
    codeBlocks.push(block);
    return `___CODEBLOCK${codeBlocks.length - 1}___`;
  });

  let formatted = raw
    .replace(/^- (.*$)/gm, "<li>$1</li>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");

  formatted = formatted.replace(/___CODEBLOCK(\d+)___/g, (_, i) => codeBlocks[i]);
  container.innerHTML = formatted;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag]));
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.id = "typing";
  typingDiv.className = "bot-message typing-indicator";
  typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  messageContainer.appendChild(typingDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const typingDiv = document.getElementById("typing");
  if (typingDiv) typingDiv.remove();
}

function isTechQuestion(message) {
  const techKeywords = ["cpu", "gpu", "ram", "ssd", "html", "javascript", "python", "linux", "windows", "network", "ai", "ml", "data", "cloud", "react", "vue", "sql", "php", "arduino", "unity"];
  const msg = message.toLowerCase();
  return techKeywords.some(k => msg.includes(k));
}

async function sendingMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;

  addMessageAnimated(msg, true);
  messageInput.value = "";

  if (!isTechQuestion(msg)) {
    addMessageAnimated("❌ I can only answer computer-related questions.");
    return;
  }

  showTypingIndicator();

  const memoryText = chatMemory
    .map((pair, i) => `User: ${pair.q}\nBot: ${pair.a}`)
    .join("\n");

  const fullPrompt = `${memoryText}\nUser: ${msg}\nBot:`;

  const reply = await callGeminiAPI(fullPrompt);
  removeTypingIndicator();
  addMessageAnimated(reply);

  chatMemory.push({ q: msg, a: reply });
  if (chatMemory.length > 5) chatMemory.shift();

  saveChatToDatabase(msg, reply);
}

function saveChatToDatabase(question, answer) {
  const username = localStorage.getItem("chantik_username");
  fetch("http://localhost/chantik/save_chat.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, username }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.status !== "success") {
        console.error("Gagal menyimpan ke database:", data.message);
      }
    })
    .catch(err => console.error("Fetch error:", err));
}

async function callGeminiAPI(message) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ API Error:", res.status, errorText);
      return `⚠️ API request failed. Status: ${res.status}`;
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Empty response from Gemini.";
  } catch (error) {
    console.error("❌ Network/Parsing Error:", error);
    return "⚠️ Request error. Please check your connection or API format.";
  }
}

function scrollToBottom() {
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function updateScrollButton() {
  const isBottom = messageContainer.scrollHeight - messageContainer.scrollTop === messageContainer.clientHeight;
  scrollBtn.style.display = isBottom ? "none" : "flex";
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme", !isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function clearChat() {
  messageContainer.innerHTML = "";
  scrollBtn.style.display = "none";

  const username = localStorage.getItem("chantik_username");

  fetch("http://localhost/chantik/delete_chat.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  })
    .then(res => res.text())
    .then(text => {
      try {
        const data = JSON.parse(text);
        if (data.status !== "success") {
          console.error("❌ Gagal hapus chat dari database:", data.message);
        } else {
          console.log("✅ Chat berhasil dihapus dari database.");
        }
      } catch (e) {
        console.error("❌ Respon bukan JSON valid:", text);
      }
    })
    .catch(err => {
      console.error("❌ Error koneksi ke delete_chat.php:", err);
    });
}

function deleteSingleMessage(messageText, messageElement) {
  const username = localStorage.getItem("chantik_username");

  fetch("http://localhost/chantik/delete_single.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, message: messageText }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        messageElement.remove();
      } else {
        alert("❌ Gagal menghapus pesan.");
      }
    })
    .catch(err => {
      console.error("❌ Error hapus pesan:", err);
    });
}

function startVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice recognition not supported.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.onstart = () => voiceBtn.classList.add("recording");
  recognition.onresult = (e) => {
    messageInput.value = e.results[0][0].transcript;
    sendingMessage();
  };
  recognition.onerror = console.error;
  recognition.onend = () => voiceBtn.classList.remove("recording");
  recognition.start();
}

async function loadChatHistory() {
  const username = localStorage.getItem("chantik_username");
  if (!username) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`http://localhost/chantik/get_chat.php?username=${username}`);
    const data = await res.json();
    data.forEach(item => {
      addMessageAnimated(item.question, true);
      addMessageAnimated(item.answer, false);
    });
  } catch (err) {
    console.error("Gagal memuat histori chat:", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.add("light-theme");
  }

  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "stars";
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    document.body.appendChild(star);
  }

  messageInput.focus();

  const username = localStorage.getItem("chantik_username");
  if (!username) {
    window.location.href = "login.html";
    return;
  }

  loadChatHistory();
});

messageContainer.addEventListener("scroll", updateScrollButton);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendingMessage();
});

function getUserId() {
  let userId = localStorage.getItem("chantik_user_id");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("chantik_user_id", userId);
  }
  return userId;
}

function logoutUser() {
  localStorage.removeItem("chantik_username");
  localStorage.removeItem("chantik_user_id");
  window.location.href = "login.html";
}
