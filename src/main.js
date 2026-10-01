// ==========================================
// شات عربي - Arabic Chat
// الملف الرئيسي - main.js
// ==========================================

import './style.css';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ===== إعدادات Firebase =====
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

const appDiv = document.getElementById("app");

// ==========================================
// نظام الرتب
// ==========================================
function getRoleInfo(role) {
  const roles = {
    owner: { label: "صاحب الموقع", color: "#fbbf24", order: 1 },
    super_admin: { label: "SUPER ADMIN", color: "#ef4444", order: 2 },
    admin: { label: "ADMIN", color: "#8b5cf6", order: 3 },
    premium: { label: "PREMIUM", color: "#06b6d4", order: 4 },
    member: { label: "عضو", color: "#a5b4fc", order: 5 },
    guest: { label: "زائر", color: "#94a3b8", order: 6 },
  };
  return roles[role] || roles.member;
}

// ==========================================
// الشاشة الرئيسية
// ==========================================
function renderWelcomeScreen() {
  appDiv.innerHTML = `
    <div class="screen welcome-screen">
      <div class="top-bar">
        <div class="brand">
          <span class="brand-icon">💬</span>
          <span>ARABI chat</span>
        </div>
        <button class="android-badge">📱 أندرويد</button>
      </div>

      <div class="hero">
        <h1>شات عربي</h1>
        <p>دردشة عربية للتعارف مع أصدقاء من جميع دول الوطن العربي في محادثات جماعية وخاصة</p>
      </div>

      <div class="buttons-group">
        <button class="btn btn-google" id="googleBtn">
          <span class="btn-icon">🔵</span>
          <span>الدخول بواسطة جوجل</span>
        </button>

        <button class="btn btn-guest" id="guestBtn">
          <span class="btn-icon">👤</span>
          <span>دخول كضيف</span>
        </button>

        <button class="btn btn-members" id="membersBtn">
          <span class="btn-icon">👥</span>
          <span>دخول الأعضاء</span>
        </button>
      </div>

      <div class="terms">
        باستخدامك التطبيق أنت توافق على شروط الاستخدام
      </div>
    </div>
  `;

  document.getElementById("googleBtn").onclick = () =>
    alert("جوجل - سنضيفها لاحقًا");
  document.getElementById("guestBtn").onclick = openGuestModal;
  document.getElementById("membersBtn").onclick = openMembersModal;
}

// ==========================================
// نافذة دخول الأعضاء
// ==========================================
function openMembersModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "membersModal";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeMembers">✕</button>
      <h2>دخول الأعضاء</h2>

      <div class="field">
        <label>اسم المستخدم</label>
        <input type="text" id="loginUsername" placeholder="أدخل اسم المستخدم" />
      </div>

      <div class="field">
        <label>كلمة المرور</label>
        <input type="password" id="loginPassword" placeholder="أدخل كلمة المرور" />
      </div>

      <button class="btn-action" id="loginBtn">🚪 دخول</button>

      <a class="link-text" id="forgotLink">نسيت كلمة المرور؟</a>
      <a class="link-text" id="goToRegister">
        ليس لديك حساب؟ <strong>إنشاء حساب</strong>
      </a>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeMembers").onclick = () => modal.remove();
  document.getElementById("forgotLink").onclick = () =>
    alert("قريبًا: استعادة كلمة المرور");
  document.getElementById("goToRegister").onclick = () => {
    modal.remove();
    openRegisterModal();
  };
  document.getElementById("loginBtn").onclick = handleLogin;
}

// ==========================================
// نافذة إنشاء حساب
// ==========================================
function openRegisterModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "registerModal";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeRegister">✕</button>
      <h2>إنشاء حساب جديد</h2>

      <div class="field">
        <label>اسم المستخدم</label>
        <input type="text" id="regUsername" placeholder="اسمك الذي سيظهر للآخرين" />
      </div>

      <div class="field">
        <label>البريد الإلكتروني</label>
        <input type="email" id="regEmail" placeholder="example@gmail.com" />
      </div>

      <div class="field">
        <label>كلمة المرور</label>
        <input type="password" id="regPassword" placeholder="6 أحرف على الأقل" />
      </div>

      <div class="alert">
        ⚠️ تنبيه هام: سيصلك رابط تأكيد على بريدك الإلكتروني. لا يمكنك الدخول قبل التأكيد.
      </div>

      <div style="display: flex; gap: 10px;">
        <div class="field" style="flex:1">
          <label>الجنس</label>
          <select id="regGender">
            <option value="">اختر</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>
        <div class="field" style="flex:1">
          <label>العمر</label>
          <select id="regAge">
            <option value="">اختر</option>
          </select>
        </div>
      </div>

      <button class="btn-action secondary" id="registerBtn">
        ✨ إنشاء حساب
      </button>

      <div class="terms">
        بتسجيلك أنت توافق على شروط الاستخدام
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const ageSelect = document.getElementById("regAge");
  for (let i = 15; i <= 70; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    ageSelect.appendChild(opt);
  }

  document.getElementById("closeRegister").onclick = () => modal.remove();
  document.getElementById("registerBtn").onclick = handleRegister;
}

// ==========================================
// نافذة دخول كضيف
// ==========================================
function openGuestModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "guestModal";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeGuest">✕</button>
      <h2>دخول كضيف</h2>

      <div class="field">
        <label>اسم المستخدم</label>
        <input type="text" id="guestName" placeholder="اختر اسمًا" />
      </div>

      <div class="field">
        <label>الجنس</label>
        <select id="guestGender">
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
      </div>

      <button class="btn-action" id="enterAsGuest">
        👤 الدخول الآن
      </button>

      <div class="terms">
        كضيف، يمكنك الدردشة الخاصة فقط
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeGuest").onclick = () => modal.remove();
  document.getElementById("enterAsGuest").onclick = handleGuestLogin;
}

// ==========================================
// معالجة تسجيل الدخول
// ==========================================
async function handleLogin() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    alert("املأ جميع الحقول");
    return;
  }

  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);

    if (!snapshot.exists()) {
      alert("اسم المستخدم غير موجود");
      return;
    }

    const userData = snapshot.val();
    const email = userData.email;

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (!user.emailVerified) {
      alert("يجب تأكيد بريدك الإلكتروني أولًا");
      await signOut(auth);
      return;
    }

    document.getElementById("membersModal").remove();
  } catch (error) {
    console.error(error);
    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      alert("كلمة المرور غير صحيحة");
    } else {
      alert("خطأ: " + error.message);
    }
  }
}

// ==========================================
// معالجة إنشاء الحساب
// ==========================================
async function handleRegister() {
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const gender = document.getElementById("regGender").value;
  const age = document.getElementById("regAge").value;

  if (!username || !email || !password || !gender || !age) {
    alert("املأ جميع الحقول");
    return;
  }

  if (username.length < 3) {
    alert("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
    return;
  }

  if (password.length < 6) {
    alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    return;
  }

  try {
    const usernameRef = ref(db, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    if (snapshot.exists()) {
      alert("اسم المستخدم محجوز، اختر اسمًا آخر");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await sendEmailVerification(user);

    await set(ref(db, `users/${user.uid}`), {
      username,
      email,
      gender,
      age: parseInt(age),
      role: "member",
      isGuest: false,
      emailVerified: false,
      avatar: "none",
      cover: "none",
      song: "none",
      color: "#a5b4fc",
      bgColor: "#0a0e27",
      decoration: "none",
      bio: "",
      createdAt: Date.now(),
    });

    await set(usernameRef, {
      email: email,
      uid: user.uid,
    });

    document.getElementById("registerModal").remove();

    await signOut(auth);

    showVerificationMessage(email);
  } catch (error) {
    console.error(error);
    if (error.code === "auth/email-already-in-use") {
      alert("هذا البريد مستخدم بالفعل");
    } else if (error.code === "auth/invalid-email") {
      alert("البريد الإلكتروني غير صحيح");
    } else {
      alert("خطأ: " + error.message);
    }
  }
}

// ==========================================
// معالجة دخول الضيف
// ==========================================
async function handleGuestLogin() {
  const username = document.getElementById("guestName").value.trim();
  const gender = document.getElementById("guestGender").value;

  if (!username) {
    alert("اكتب اسمك");
    return;
  }

  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    await set(ref(db, `users/${user.uid}`), {
      username,
      gender,
      role: "guest",
      isGuest: true,
      avatar: "none",
      cover: "none",
      song: "none",
      color: "#94a3b8",
      bgColor: "#0a0e27",
      decoration: "none",
      bio: "",
      createdAt: Date.now(),
    });

    document.getElementById("guestModal").remove();
  } catch (error) {
    console.error(error);
    alert("فشل الدخول: " + error.message);
  }
}

// ==========================================
// شاشة رسالة التأكيد
// ==========================================
function showVerificationMessage(email) {
  appDiv.innerHTML = `
    <div class="screen welcome-screen">
      <div class="success-screen">
        <div class="success-icon">📧</div>
        <h2>تم إنشاء حسابك!</h2>
        <p>
          أرسلنا رابط تأكيد إلى بريدك الإلكتروني:<br>
          <strong style="color:#a5b4fc">${email}</strong>
          <br><br>
          افتح بريدك واضغط على الرابط لتفعيل حسابك، ثم عد وسجّل الدخول.
        </p>
        <button class="btn btn-members" onclick="location.reload()">
          🔄 العودة للرئيسية
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// شاشة الدردشة
// ==========================================
function renderChatScreen(user) {
  appDiv.innerHTML = `
    <div class="screen chat-screen">
      <header class="chat-header">
        <h2>غرفة الأردن 🇯🇴</h2>
        <button id="logoutBtn" class="logout-btn">خروج</button>
      </header>

      <div id="messages" class="messages-container">
        <p class="empty-msg">جاري التحميل...</p>
      </div>

      <form id="messageForm" class="message-form">
        <input id="messageInput" type="text" placeholder="اكتب رسالتك..." autocomplete="off"/>
        <button type="submit" class="send-btn">➤</button>
      </form>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => {
    signOut(auth);
  };

  const userRef = ref(db, `users/${user.uid}`);
  get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
      startChat(user, snapshot.val());
    }
  });
}

// ==========================================
// بدء الدردشة الفعلية
// ==========================================
function startChat(user, userData) {
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

    const sortedMessages = Object.entries(data).sort(
      ([, a], [, b]) => a.createdAt - b.createdAt
    );

    sortedMessages.forEach(([id, msg]) => {
      const isMine = msg.senderId === user.uid;
      const roleInfo = getRoleInfo(msg.senderRole || "member");

      const msgEl = document.createElement("div");
      msgEl.className = isMine ? "message mine" : "message";
      msgEl.innerHTML = `
        <div class="msg-header">
          <span class="msg-role" style="color:${roleInfo.color}">${roleInfo.label}</span>
          <span class="msg-sender" style="color:${msg.senderColor || '#a5b4fc'}">${escapeHtml(msg.senderName)}</span>
        </div>
        <div class="msg-text">${escapeHtml(msg.text)}</div>
      `;
      messagesDiv.appendChild(msgEl);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    try {
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        text: text,
        senderId: user.uid,
        senderName: userData.username || "مجهول",
        senderRole: userData.role || (user.isAnonymous ? "guest" : "member"),
        senderColor: userData.color || "#a5b4fc",
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error(error);
      alert("فشل الإرسال: " + error.message);
    }
  };
}

// ==========================================
// حماية النص
// ==========================================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================
// مراقبة حالة المستخدم
// ==========================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("المستخدم:", user.uid, "ضيف:", user.isAnonymous);
    renderChatScreen(user);
  } else {
    renderWelcomeScreen();
  }
});
