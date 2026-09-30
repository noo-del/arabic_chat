import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoQ9HP0KVyR12zjEMEEEpUIWD1SzMrcFc",
  authDomain: "chat-19f62.firebaseapp.com",
  databaseURL: "https://chat-19f62-default-rtdb.firebaseio.com",
  projectId: "chat-19f62",
  storageBucket: "chat-19f62.firebasestorage.app",
  messagingSenderId: "341345714762",
  appId: "1:341345714762:web:2c24b6230fcf40624e9cb3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;
const appDiv = document.getElementById("app");

function renderLoginScreen() {
  appDiv.innerHTML = `
    <div class="screen login-screen">
      <div class="logo">💬</div>
      <h1>شات عربي</h1>
      <p class="subtitle">تعرّف على عرب جدد من حول العالم</p>
      <button id="guestBtn" class="btn btn-primary">🎭 الدخول كضيف</button>
      <button id="emailBtn" class="btn btn-secondary">📧 تسجيل بحساب</button>
      <p class="footer-note">بالدخول أنت توافق على قواعد الاستخدام</p>
    </div>
  `;
  document.getElementById("guestBtn").onclick = guestLogin;
  document.getElementById("emailBtn").onclick = () => alert("قريبًا");
}

function renderLoadingScreen() {
  appDiv.innerHTML = `<div class="screen loading-screen"><div class="spinner"></div><p>جاري التحميل...</p></div>`;
}

function renderChatScreen() {
  appDiv.innerHTML = `
    <div class="screen chat-screen">
      <header class="chat-header">
        <h2>غرفة الأردن 🇯🇴</h2>
        <button id="logoutBtn" class="logout-btn">خروج</button>
      </header>
      <div id="messages" class="messages-container"></div>
      <form id="messageForm" class="message-form">
        <input id="messageInput" type="text" placeholder="اكتب رسالتك..." autocomplete="off"/>
        <button type="submit" class="send-btn">➤</button>
      </form>
    </div>
  `;
  setupChat();
}

async function guestLogin() {
  try {
    renderLoadingScreen();
    await signInAnonymously(auth);
  } catch (e) {
    alert("فشل الدخول: " + e.message);
    renderLoginScreen();
  }
}

function setupChat() {
  const messagesDiv = document.getElementById("messages");
  const form = document.getElementById("messageForm");
  const input = document.getElementById("messageInput");
  const messagesRef = ref(db, "rooms/jordan/messages");

  onValue(messagesRef, (snapshot) => {
    messagesDiv.innerHTML = "";
    const data = snapshot.val();
    if (!data) {
      messagesDiv.innerHTML = '<p class="empty-msg">لا توجد رسائل بعد. كن أول من يكتب!</p>';
      return;
    }
    Object.values(data)
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((msg) => {
        const el = document.createElement("div");
        el.className = "message";
        el.innerHTML = `<span class="msg-sender">${msg.username}:</span> <span class="msg-text">${escapeHtml(msg.text)}</span>`;
        messagesDiv.appendChild(el);
      });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    try {
      await push(messagesRef, {
        text,
        senderId: currentUser.uid,
        username: "ضيف-" + currentUser.uid.slice(0, 4),
        createdAt: Date.now(),
      });
    } catch (e) {
      alert("فشل الإرسال");
    }
  };

  document.getElementById("logoutBtn").onclick = () => auth.signOut();
}

function escapeHtml(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) renderChatScreen();
  else renderLoginScreen();
});
