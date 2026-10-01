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

// ===== إعدادات Cloudinary =====
const CLOUDINARY_CLOUD_NAME = "zzswviqu";
const CLOUDINARY_UPLOAD_PRESET = "chat_uploads";

// ==========================================
// نظام الرتب
// ==========================================
function getRoleInfo(role) {
  const roles = {
    owner: { label: "صاحب الموقع", color: "#fbbf24" },
    super_admin: { label: "SUPER ADMIN", color: "#ef4444" },
    admin: { label: "ADMIN", color: "#8b5cf6" },
    premium: { label: "PREMIUM", color: "#06b6d4" },
    member: { label: "عضو", color: "#a5b4fc" },
    guest: { label: "زائر", color: "#94a3b8" },
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
      themeColor: "#0f172a",
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
      themeColor: "#0f172a",
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
// شاشة قائمة الغرف
// ==========================================
function renderRoomsScreen(user, userData) {
  const isOwner = userData.role === "owner";
  const roleInfo = getRoleInfo(userData.role);

  appDiv.innerHTML = `
    <div class="screen rooms-screen">
      <header class="rooms-header">
        <div class="rooms-top">
          <button class="top-icon-btn" id="menuBtn" title="القائمة">☰</button>
          <span class="rooms-title">ARABI chat</span>
          <button class="top-icon-btn" id="logoutBtn" title="خروج">⎋</button>
        </div>

        <div class="rooms-tabs">
          <button class="tab-btn active">
            <span class="tab-icon">👥</span>
            <span class="tab-label">الغرف</span>
          </button>
          <button class="tab-btn">
            <span class="tab-icon">⭐</span>
            <span class="tab-label">الكبار</span>
          </button>
          <button class="tab-btn">
            <span class="tab-icon">🎁</span>
            <span class="tab-label">الهدايا</span>
          </button>
          <button class="tab-btn">
            <span class="tab-icon">💌</span>
            <span class="tab-label">رسائل</span>
          </button>
          <button class="tab-btn" id="myProfileBtn">
            <span class="tab-icon">👤</span>
            <span class="tab-label">ملفي</span>
          </button>
        </div>
      </header>

      <div id="rooms-list" class="rooms-list">
        <p class="empty-msg">جاري التحميل...</p>
      </div>

      ${isOwner ? `
        <button id="addRoomBtn" class="add-room-btn">+</button>
      ` : ''}

      <div class="rooms-bottom">
        <button class="bottom-btn">
          <span class="bottom-icon">▶️</span>
          <span class="bottom-label">Radio</span>
        </button>
        <button class="bottom-btn active">
          <span class="bottom-icon">🏠</span>
          <span class="bottom-label">الغرف</span>
        </button>
        <button class="bottom-btn">
          <span class="bottom-icon">👥</span>
          <span class="bottom-label">المتصلين</span>
        </button>
        <button class="bottom-btn" id="bottomProfileBtn">
          <span class="bottom-icon">👤</span>
          <span class="bottom-label">ملفي</span>
        </button>
      </div>

      <div style="position:absolute;top:140px;left:15px;font-size:11px;color:${roleInfo.color};font-weight:700;">
        ${roleInfo.label} • ${userData.username}
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => signOut(auth);
  document.getElementById("menuBtn").onclick = () =>
    openSideMenu(user, userData);

  document.getElementById("myProfileBtn").onclick = () =>
    showProfile(user.uid, user, userData);
  document.getElementById("bottomProfileBtn").onclick = () =>
    showProfile(user.uid, user, userData);

  const roomsRef = ref(db, "rooms");
  onValue(roomsRef, (snapshot) => {
    const roomsList = document.getElementById("rooms-list");
    roomsList.innerHTML = "";

    const data = snapshot.val();
    if (!data) {
      roomsList.innerHTML = '<p class="empty-msg">لا توجد غرف. أضف غرفة جديدة!</p>';
      return;
    }

    Object.entries(data).forEach(([roomId, room]) => {
      const memberCount = room.membersCount || 0;
      const roomEl = document.createElement("div");
      roomEl.className = "room-item";
      roomEl.innerHTML = `
        <div class="room-left">
          <span class="room-flag-big">${room.flag || "💬"}</span>
          <div class="room-details">
            <span class="room-title-name">غرفة || ${escapeHtml(room.name || roomId)}</span>
            <span class="room-count">👥 ${memberCount}</span>
          </div>
        </div>
        <button class="room-enter-btn" data-room="${roomId}">← دخول الغرفة</button>
        ${isOwner ? `<button class="room-delete-btn" data-room="${roomId}">🗑️</button>` : ''}
      `;
      roomsList.appendChild(roomEl);
    });

    document.querySelectorAll(".room-enter-btn").forEach((btn) => {
      btn.onclick = () => {
        const roomId = btn.dataset.room;
        renderChatScreen(user, userData, roomId);
      };
    });

    document.querySelectorAll(".room-delete-btn").forEach((btn) => {
      btn.onclick = async () => {
        const roomId = btn.dataset.room;
        if (confirm("حذف الغرفة؟")) {
          await set(ref(db, `rooms/${roomId}`), null);
        }
      };
    });
  });

  if (isOwner) {
    document.getElementById("addRoomBtn").onclick = () => {
      openAddRoomModal();
    };
  }
}

// ==========================================
// القائمة الجانبية (☰)
// ==========================================
function openSideMenu(user, userData) {
  const isOwner = userData.role === "owner";
  const roleInfo = getRoleInfo(userData.role);
  const avatar = userData.avatar && userData.avatar !== "none" ? userData.avatar : null;

  const menu = document.createElement("div");
  menu.className = "side-menu-overlay";
  menu.id = "sideMenuOverlay";
  menu.innerHTML = `
    <div class="side-menu">
      <div class="side-menu-header">
        <div class="side-menu-avatar" style="border-color:${roleInfo.color}">
          ${avatar
            ? `<img src="${avatar}" alt="avatar" />`
            : `<span>${(userData.username || "?")[0]}</span>`}
        </div>
        <div class="side-menu-user-info">
          <div class="side-menu-role" style="color:${roleInfo.color}">${roleInfo.label}</div>
          <div class="side-menu-username">${escapeHtml(userData.username || "مجهول")}</div>
        </div>
      </div>

      <div class="side-menu-items">
        <button class="side-menu-item" id="menuMyProfile">
          <span class="menu-icon">👤</span>
          <span>ملفي الشخصي</span>
        </button>

        <button class="side-menu-item" id="menuRooms">
          <span class="menu-icon">🏠</span>
          <span>الغرف</span>
        </button>

        <button class="side-menu-item" id="menuOnline">
          <span class="menu-icon">👥</span>
          <span>المتصلين</span>
        </button>

        <button class="side-menu-item" id="menuSettings">
          <span class="menu-icon">⚙️</span>
          <span>الإعدادات</span>
        </button>

        ${isOwner ? `
          <button class="side-menu-item admin-item" id="menuAdmin">
            <span class="menu-icon">👑</span>
            <span>لوحة التحكم</span>
          </button>
        ` : ''}

        <button class="side-menu-item danger-item" id="menuLogout">
          <span class="menu-icon">🚪</span>
          <span>خروج</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(menu);

  // إغلاق عند الضغط على الخلفية
  menu.onclick = (e) => {
    if (e.target === menu) menu.remove();
  };

  document.getElementById("menuMyProfile").onclick = () => {
    menu.remove();
    showProfile(user.uid, user, userData);
  };

  document.getElementById("menuRooms").onclick = () => menu.remove();

  document.getElementById("menuOnline").onclick = () => {
    menu.remove();
    alert("قريبًا: قائمة المتصلين");
  };

  document.getElementById("menuSettings").onclick = () => {
    menu.remove();
    alert("قريبًا: الإعدادات");
  };

  document.getElementById("menuLogout").onclick = () => {
    menu.remove();
    signOut(auth);
  };

  if (isOwner) {
    document.getElementById("menuAdmin").onclick = () => {
      menu.remove();
      renderAdminPanel(user, userData);
    };
  }
}

// ==========================================
// لوحة التحكم (لصاحب الموقع)
// ==========================================
function renderAdminPanel(ownerUser, ownerData) {
  appDiv.innerHTML = `
    <div class="screen admin-screen">
      <header class="admin-header">
        <button class="top-icon-btn" id="adminBackBtn">←</button>
        <span class="admin-title">👑 لوحة التحكم</span>
        <button class="top-icon-btn" id="adminLogout">⎋</button>
      </header>

      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="users">
          <span class="tab-icon">👥</span>
          <span class="tab-label">الأعضاء</span>
        </button>
        <button class="admin-tab" data-tab="rooms">
          <span class="tab-icon">🏠</span>
          <span class="tab-label">الغرف</span>
        </button>
        <button class="admin-tab" data-tab="stats">
          <span class="tab-icon">📊</span>
          <span class="tab-label">إحصائيات</span>
        </button>
      </div>

      <div id="admin-content" class="admin-content">
        <p class="empty-msg">جاري التحميل...</p>
      </div>
    </div>
  `;

  document.getElementById("adminBackBtn").onclick = () =>
    renderRoomsScreen(ownerUser, ownerData);
  document.getElementById("adminLogout").onclick = () => signOut(auth);

  // التبويبات
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const tabName = tab.dataset.tab;
      if (tabName === "users") loadAdminUsers(ownerUser, ownerData);
      else if (tabName === "rooms") loadAdminRooms(ownerUser, ownerData);
      else if (tabName === "stats") loadAdminStats(ownerUser, ownerData);
    };
  });

  // الافتراضي: الأعضاء
  loadAdminUsers(ownerUser, ownerData);
}

// ==========================================
// تبويب الأعضاء
// ==========================================
function loadAdminUsers(ownerUser, ownerData) {
  const content = document.getElementById("admin-content");
  content.innerHTML = '<p class="empty-msg">جاري التحميل...</p>';

  const usersRef = ref(db, "users");
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      content.innerHTML = '<p class="empty-msg">لا يوجد أعضاء بعد</p>';
      return;
    }

    const users = Object.entries(data).map(([uid, u]) => ({ uid, ...u }));
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    content.innerHTML = `
      <div class="admin-search">
        <input type="text" id="userSearchInput" placeholder="🔍 ابحث بالاسم..." />
      </div>
      <div id="users-list" class="admin-users-list"></div>
    `;

    const renderList = (filter = "") => {
      const list = document.getElementById("users-list");
      list.innerHTML = "";

      const filtered = users.filter((u) =>
        (u.username || "").toLowerCase().includes(filter.toLowerCase())
      );

      if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-msg">لا يوجد نتائج</p>';
        return;
      }

      filtered.forEach((u) => {
        const roleInfo = getRoleInfo(u.role);
        const isMe = u.uid === ownerUser.uid;

        const userEl = document.createElement("div");
        userEl.className = "admin-user-item";
        userEl.innerHTML = `
          <div class="admin-user-info">
            <div class="admin-user-avatar" style="border-color:${roleInfo.color}">
              ${u.avatar && u.avatar !== "none"
                ? `<img src="${u.avatar}" />`
                : `<span>${(u.username || "?")[0]}</span>`}
            </div>
            <div class="admin-user-details">
              <div class="admin-user-name" style="color:${u.color || '#a5b4fc'}">
                ${escapeHtml(u.username || "مجهول")}
              </div>
              <div class="admin-user-role" style="color:${roleInfo.color}">
                ${roleInfo.label}
              </div>
            </div>
          </div>
          ${!isMe ? `
            <button class="admin-user-action-btn" data-uid="${u.uid}" data-current-role="${u.role || 'member'}">
              🏷️ الرتبة
            </button>
          ` : '<span class="admin-self-badge">أنت</span>'}
        `;
        list.appendChild(userEl);
      });

      // زر تعديل الرتبة
      document.querySelectorAll(".admin-user-action-btn").forEach((btn) => {
        btn.onclick = () => {
          const uid = btn.dataset.uid;
          const currentRole = btn.dataset.currentRole;
          openRoleChangeModal(uid, currentRole, ownerUser, ownerData);
        };
      });
    };

    renderList();

    const searchInput = document.getElementById("userSearchInput");
    if (searchInput) {
      searchInput.oninput = (e) => renderList(e.target.value);
    }
  });
}

// ==========================================
// نافذة تغيير الرتبة
// ==========================================
function openRoleChangeModal(targetUid, currentRole, ownerUser, ownerData) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "roleChangeModal";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeRoleChange">✕</button>
      <h2>🏷️ تغيير الرتبة</h2>

      <div class="field">
        <label>اختر الرتبة الجديدة</label>
        <select id="newRoleSelect">
          <option value="owner" ${currentRole === "owner" ? "selected" : ""}>👑 صاحب الموقع</option>
          <option value="super_admin" ${currentRole === "super_admin" ? "selected" : ""}>🛡️ سوبر أدمن</option>
          <option value="admin" ${currentRole === "admin" ? "selected" : ""}>⭐ أدمن</option>
          <option value="premium" ${currentRole === "premium" ? "selected" : ""}>💎 بريميوم</option>
          <option value="member" ${currentRole === "member" ? "selected" : ""}>👤 عضو</option>
          <option value="guest" ${currentRole === "guest" ? "selected" : ""}>🎭 زائر</option>
        </select>
      </div>

      <button class="btn-action" id="saveRoleBtn">💾 حفظ الرتبة</button>
      <button class="btn-action" id="removeRoleBtn" style="background:linear-gradient(135deg,#ef4444,#dc2626);">🗑️ سحب الرتبة (عضو)</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeRoleChange").onclick = () => modal.remove();

  document.getElementById("saveRoleBtn").onclick = async () => {
    const newRole = document.getElementById("newRoleSelect").value;
    try {
      await set(ref(db, `users/${targetUid}/role`), newRole);
      alert("✅ تم تغيير الرتبة");
      modal.remove();
    } catch (error) {
      alert("فشل: " + error.message);
    }
  };

  document.getElementById("removeRoleBtn").onclick = async () => {
    if (!confirm("سحب الرتبة وجعله عضوًا عاديًا؟")) return;
    try {
      await set(ref(db, `users/${targetUid}/role`), "member");
      alert("✅ تم سحب الرتبة");
      modal.remove();
    } catch (error) {
      alert("فشل: " + error.message);
    }
  };
}

// ==========================================
// تبويب الغرف
// ==========================================
function loadAdminRooms(ownerUser, ownerData) {
  const content = document.getElementById("admin-content");
  content.innerHTML = '<p class="empty-msg">جاري التحميل...</p>';

  const roomsRef = ref(db, "rooms");
  onValue(roomsRef, (snapshot) => {
    const data = snapshot.val();
    content.innerHTML = `
      <button class="btn-action" id="adminAddRoomBtn">➕ إضافة غرفة جديدة</button>
      <div id="admin-rooms-list" class="admin-rooms-list"></div>
    `;

    document.getElementById("adminAddRoomBtn").onclick = () => {
      openAddRoomModal();
    };

    const list = document.getElementById("admin-rooms-list");

    if (!data) {
      list.innerHTML = '<p class="empty-msg">لا توجد غرف</p>';
      return;
    }

    Object.entries(data).forEach(([roomId, room]) => {
      const roomEl = document.createElement("div");
      roomEl.className = "admin-room-item";
      roomEl.innerHTML = `
        <div class="admin-room-info">
          <span class="admin-room-flag">${room.flag || "💬"}</span>
          <div>
            <div class="admin-room-name">${escapeHtml(room.name || roomId)}</div>
            <div class="admin-room-id">ID: ${roomId}</div>
          </div>
        </div>
        <button class="admin-delete-room-btn" data-room="${roomId}">🗑️ حذف</button>
      `;
      list.appendChild(roomEl);
    });

    document.querySelectorAll(".admin-delete-room-btn").forEach((btn) => {
      btn.onclick = async () => {
        const roomId = btn.dataset.room;
        if (confirm(`حذف الغرفة "${roomId}"؟`)) {
          await set(ref(db, `rooms/${roomId}`), null);
        }
      };
    });
  });
}

// ==========================================
// تبويب الإحصائيات
// ==========================================
function loadAdminStats(ownerUser, ownerData) {
  const content = document.getElementById("admin-content");
  content.innerHTML = '<p class="empty-msg">جاري التحميل...</p>';

  Promise.all([
    get(ref(db, "users")),
    get(ref(db, "rooms")),
  ]).then(([usersSnap, roomsSnap]) => {
    const users = usersSnap.val() || {};
    const rooms = roomsSnap.val() || {};

    const usersCount = Object.keys(users).length;
    const roomsCount = Object.keys(rooms).length;

    const rolesCount = {};
    Object.values(users).forEach((u) => {
      const r = u.role || "member";
      rolesCount[r] = (rolesCount[r] || 0) + 1;
    });

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-number">${usersCount}</div>
          <div class="stat-label">عضو</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏠</div>
          <div class="stat-number">${roomsCount}</div>
          <div class="stat-label">غرفة</div>
        </div>
      </div>

      <h3 style="text-align:center;margin:20px 0 10px;color:#a5b4fc;">توزيع الرتب</h3>
      <div class="roles-distribution">
        ${Object.entries(rolesCount).map(([role, count]) => {
          const info = getRoleInfo(role);
          return `
            <div class="role-stat-item">
              <span style="color:${info.color};font-weight:900;">${info.label}</span>
              <span class="role-stat-count">${count}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  });
}

// ==========================================
// نافذة إضافة غرفة (لصاحب الموقع)
// ==========================================
function openAddRoomModal() {
  const existing = document.getElementById("addRoomModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "addRoomModal";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeAddRoom">✕</button>
      <h2>إضافة غرفة جديدة</h2>

      <div class="field">
        <label>اسم الغرفة</label>
        <input type="text" id="roomName" placeholder="مثال: الاردن" />
      </div>

      <div class="field">
        <label>رمز الغرفة (بالإنجليزي)</label>
        <input type="text" id="roomId" placeholder="مثال: jordan" />
      </div>

      <div class="field">
        <label>رمز الدولة (emoji)</label>
        <input type="text" id="roomFlag" placeholder="🇯🇴" />
      </div>

      <button class="btn-action" id="createRoomBtn">✨ إنشاء الغرفة</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeAddRoom").onclick = () => modal.remove();

  document.getElementById("createRoomBtn").onclick = async () => {
    const name = document.getElementById("roomName").value.trim();
    const id = document.getElementById("roomId").value.trim().toLowerCase();
    const flag = document.getElementById("roomFlag").value.trim();

    if (!name || !id) {
      alert("املأ الحقول المطلوبة");
      return;
    }

    try {
      await set(ref(db, `rooms/${id}`), {
        name: name,
        flag: flag || "💬",
        membersCount: 0,
        createdAt: Date.now(),
      });
      modal.remove();
    } catch (error) {
      alert("فشل الإنشاء: " + error.message);
    }
  };
}

// ==========================================
// شاشة الدردشة (داخل الغرفة)
// ==========================================
function renderChatScreen(user, userData, roomId = "jordan") {
  appDiv.innerHTML = `
    <div class="screen chat-room-screen">
      <header class="room-top-bar">
        <button class="top-icon-btn" id="menuBtn">☰</button>
        <span class="room-top-title" id="roomTitle">جاري التحميل...</span>
        <div class="room-top-actions">
          <button class="top-icon-btn" title="الكبار">👑</button>
          <button class="top-icon-btn" title="الهدايا">🎁</button>
          <button class="top-icon-btn" title="الإشعارات">🔔</button>
          <button class="top-icon-btn" id="backBtn" title="رجوع">←</button>
        </div>
      </header>

      <div id="messages" class="room-messages"></div>

      <form id="messageForm" class="room-input-bar">
        <button type="button" class="input-action-btn" id="plusBtn">＋</button>
        <div class="input-wrapper">
          <input id="messageInput" type="text" placeholder="اكتب هنا..." autocomplete="off"/>
          <button type="button" class="emoji-btn">😊</button>
        </div>
        <button type="submit" class="send-circle-btn">➤</button>
      </form>

      <div class="room-bottom-nav">
        <button class="nav-item">
          <span class="nav-icon">▶️</span>
          <span class="nav-text">Radio</span>
        </button>
        <button class="nav-item active">
          <span class="nav-icon">🏠</span>
          <span class="nav-text">الغرف</span>
        </button>
        <button class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-text">المتصلين</span>
        </button>
        <button class="nav-item" id="myProfileRoomBtn">
          <span class="nav-icon">👤</span>
          <span class="nav-text">ملفي</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("backBtn").onclick = () =>
    renderRoomsScreen(user, userData);

  document.getElementById("menuBtn").onclick = () =>
    openSideMenu(user, userData);

  document.getElementById("myProfileRoomBtn").onclick = () =>
    showProfile(user.uid, user, userData);

  get(ref(db, `rooms/${roomId}`)).then((snap) => {
    if (snap.exists()) {
      const room = snap.val();
      document.getElementById("roomTitle").textContent =
        `غرفة ${room.name}`;
    }
  });

  startChat(user, userData, roomId);
}

// ==========================================
// بدء الدردشة الفعلية
// ==========================================
function startChat(user, userData, roomId = "jordan") {
  const messagesDiv = document.getElementById("messages");
  const form = document.getElementById("messageForm");
  const input = document.getElementById("messageInput");

  const messagesRef = ref(db, `rooms/${roomId}/messages`);

  onValue(messagesRef, (snapshot) => {
    messagesDiv.innerHTML = "";
    const data = snapshot.val();

    if (!data) {
      messagesDiv.innerHTML = `
        <div class="system-message">
          💬 مرحبًا بك في الغرفة! كن أول من يكتب
        </div>
      `;
      return;
    }

    const sortedMessages = Object.entries(data).sort(
      ([, a], [, b]) => a.createdAt - b.createdAt
    );

    sortedMessages.forEach(([id, msg]) => {
      const isMine = msg.senderId === user.uid;
      const roleInfo = getRoleInfo(msg.senderRole || "member");

      const msgEl = document.createElement("div");
      msgEl.className = "chat-msg";
      msgEl.innerHTML = `
        <div class="chat-avatar" style="background:${msg.senderColor || '#a5b4fc'}20;border:2px solid ${msg.senderColor || '#a5b4fc'};cursor:pointer;" data-user-id="${msg.senderId}">
          ${(msg.senderName || "?")[0]}
        </div>
        <div class="chat-msg-body">
          <div class="chat-msg-header">
            <span class="chat-role" style="color:${roleInfo.color}">${roleInfo.label}</span>
            <span class="chat-name" style="color:${msg.senderColor || '#a5b4fc'};cursor:pointer;" data-user-id="${msg.senderId}">${escapeHtml(msg.senderName)}</span>
            <span class="chat-time">${formatTime(msg.createdAt)}</span>
          </div>
          <div class="chat-text">${escapeHtml(msg.text)}</div>
        </div>
      `;
      messagesDiv.appendChild(msgEl);
    });

    document.querySelectorAll("[data-user-id]").forEach((el) => {
      el.onclick = () => {
        const targetId = el.dataset.userId;
        showProfile(targetId, user, userData);
      };
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
// عرض الملف الشخصي
// ==========================================
function showProfile(userId, currentUser, currentUserData) {
  const userRef = ref(db, `users/${userId}`);

  const existing = document.getElementById("profileModal");
  if (existing) existing.remove();

  if (window._profileUnsubscribe) {
    window._profileUnsubscribe();
    window._profileUnsubscribe = null;
  }

  window._profileUnsubscribe = onValue(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      alert("المستخدم غير موجود");
      return;
    }

    const profile = snapshot.val();
    const isMyProfile = userId === currentUser.uid;
    const roleInfo = getRoleInfo(profile.role);
    const themeColor = profile.themeColor || "#0f172a";

    const avatar = profile.avatar && profile.avatar !== "none"
      ? profile.avatar
      : null;

    const cover = profile.cover && profile.cover !== "none"
      ? profile.cover
      : null;

    const joinDate = profile.createdAt
      ? new Date(profile.createdAt).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "غير معروف";

    const oldModal = document.getElementById("profileModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "profileModal";
    modal.innerHTML = `
      <div class="profile-view" style="background:linear-gradient(180deg, ${themeColor}cc, #0a0e27);">
        <button class="modal-close" id="closeProfile">✕</button>

        <div class="profile-cover" style="${cover ? `background-image:url('${cover}');` : `background:linear-gradient(135deg, ${themeColor}, ${roleInfo.color}40);`}"></div>

        <div class="profile-avatar-container">
          <div class="profile-avatar" style="border-color:${roleInfo.color}">
            ${avatar
              ? `<img src="${avatar}" alt="avatar" />`
              : `<span>${(profile.username || "?")[0]}</span>`}
          </div>
        </div>

        <div class="profile-info">
          <div class="profile-role" style="color:${roleInfo.color}">
            ${roleInfo.label}
          </div>
          <h2 class="profile-username" style="color:${profile.color || '#a5b4fc'}">
            ${escapeHtml(profile.username || "مجهول")}
          </h2>

          ${profile.bio ? `
            <div class="profile-bio">${escapeHtml(profile.bio)}</div>
          ` : ''}

          <div class="profile-meta">
            <div class="meta-item">
              <span class="meta-label">الجنس:</span>
              <span class="meta-value">${profile.gender === "female" ? "أنثى" : "ذكر"}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">العمر:</span>
              <span class="meta-value">${profile.age || "غير محدد"}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تاريخ الانضمام:</span>
              <span class="meta-value">${joinDate}</span>
            </div>
          </div>

          ${isMyProfile ? `
            <button class="btn-action" id="editProfileBtn">
              ✏️ تعديل الملف
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    if (window._profileAudio) {
      window._profileAudio.pause();
      window._profileAudio = null;
    }
    if (profile.song && profile.song !== "none" && profile.song.startsWith("http")) {
      try {
        window._profileAudio = new Audio(profile.song);
        window._profileAudio.volume = 0.5;
        window._profileAudio.play().catch(() => {});
      } catch (e) {}
    }

    document.getElementById("closeProfile").onclick = () => {
      if (window._profileAudio) {
        window._profileAudio.pause();
        window._profileAudio = null;
      }
      if (window._profileUnsubscribe) {
        window._profileUnsubscribe();
        window._profileUnsubscribe = null;
      }
      modal.remove();
    };

    if (isMyProfile) {
      document.getElementById("editProfileBtn").onclick = () => {
        if (window._profileAudio) {
          window._profileAudio.pause();
          window._profileAudio = null;
        }
        if (window._profileUnsubscribe) {
          window._profileUnsubscribe();
          window._profileUnsubscribe = null;
        }
        modal.remove();
        openEditProfile(currentUser, currentUserData);
      };
    }
  });
}

// ==========================================
// نافذة تعديل الملف الشخصي
// ==========================================
function openEditProfile(user, userData) {
  const role = userData.role || "member";
  const canEditExtra = ["owner", "super_admin", "admin", "premium"].includes(role);

  const avatar = userData.avatar && userData.avatar !== "none" ? userData.avatar : "";
  const cover = userData.cover && userData.cover !== "none" ? userData.cover : "";

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "editProfileModal";
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeEdit">✕</button>
      <h2>✏️ تعديل الملف</h2>

      <div class="field">
        <label>صورة الملف الشخصي</label>
        <input type="file" id="avatarFile" accept="image/*" class="file-input" />
        <div id="avatarPreview" style="margin-top:10px;text-align:center;">
          ${avatar ? `<img src="${avatar}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;" />` : ""}
        </div>
      </div>

      ${canEditExtra ? `
        <div class="field">
          <label>صورة الغلاف</label>
          <input type="file" id="coverFile" accept="image/*" class="file-input" />
          <div id="coverPreview" style="margin-top:10px;text-align:center;">
            ${cover ? `<img src="${cover}" style="width:100%;height:80px;border-radius:12px;object-fit:cover;" />` : ""}
          </div>
        </div>
      ` : ''}

      <div class="field">
        <label>الاسم</label>
        <input type="text" id="editUsername" value="${escapeHtml(userData.username || '')}" maxlength="20" />
      </div>

      <div class="field">
        <label>نبذة عنك</label>
        <input type="text" id="editBio" value="${escapeHtml(userData.bio || '')}" maxlength="60" placeholder="اكتب شيئًا عنك..." />
      </div>

      <div style="display: flex; gap: 10px;">
        <div class="field" style="flex:1">
          <label>الجنس</label>
          <select id="editGender">
            <option value="male" ${userData.gender === "male" ? "selected" : ""}>ذكر</option>
            <option value="female" ${userData.gender === "female" ? "selected" : ""}>أنثى</option>
          </select>
        </div>
        <div class="field" style="flex:1">
          <label>العمر</label>
          <select id="editAge">
            <option value="">اختر</option>
            ${Array.from({ length: 61 }, (_, i) => i + 10)
              .map((age) => `<option value="${age}" ${userData.age == age ? "selected" : ""}>${age}</option>`)
              .join("")}
          </select>
        </div>
      </div>

      ${canEditExtra ? `
        <div class="field">
          <label>أغنية الملف (اختر من ملفاتك)</label>
          <input type="file" id="songFile" accept="audio/*" class="file-input" />
          <div id="songPreview" style="margin-top:10px;font-size:13px;color:#a5b4fc;text-align:center;">
            ${userData.song && userData.song !== "none" ? "🎵 يوجد أغنية محفوظة" : "لا توجد أغنية"}
          </div>
        </div>

        <div class="field">
          <label>لون الاسم</label>
          <input type="color" id="editColor" value="${userData.color || '#a5b4fc'}" class="color-input" />
        </div>

        <div class="field">
          <label>لون الملف الكامل</label>
          <input type="color" id="editThemeColor" value="${userData.themeColor || '#0f172a'}" class="color-input" />
        </div>
      ` : ''}

      <button class="btn-action" id="saveProfileBtn">💾 حفظ التعديلات</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeEdit").onclick = () => modal.remove();

  document.getElementById("avatarFile").onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById("avatarPreview").innerHTML =
          `<img src="${ev.target.result}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;" />`;
      };
      reader.readAsDataURL(file);
    }
  };

  if (canEditExtra) {
    const coverInput = document.getElementById("coverFile");
    if (coverInput) {
      coverInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            document.getElementById("coverPreview").innerHTML =
              `<img src="${ev.target.result}" style="width:100%;height:80px;border-radius:12px;object-fit:cover;" />`;
          };
          reader.readAsDataURL(file);
        }
      };
    }

    const songInput = document.getElementById("songFile");
    if (songInput) {
      songInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          document.getElementById("songPreview").innerHTML =
            `✅ تم اختيار: ${file.name}`;
        }
      };
    }
  }

  document.getElementById("saveProfileBtn").onclick = async () => {
    const btn = document.getElementById("saveProfileBtn");
    btn.disabled = true;
    btn.textContent = "جاري الحفظ...";

    try {
      const newUsername = document.getElementById("editUsername").value.trim();
      const newBio = document.getElementById("editBio").value.trim();
      const newGender = document.getElementById("editGender").value;
      const newAge = document.getElementById("editAge").value;
      const avatarFile = document.getElementById("avatarFile").files[0];

      if (!newUsername) {
        alert("اكتب اسمك");
        btn.disabled = false;
        btn.textContent = "💾 حفظ التعديلات";
        return;
      }

      const updates = {
        username: newUsername,
        bio: newBio,
        gender: newGender,
      };

      if (newAge && newAge !== "") {
        updates.age = parseInt(newAge);
      }

      if (avatarFile) {
        const avatarUrl = await uploadToCloudinary(avatarFile, "image");
        if (avatarUrl) updates.avatar = avatarUrl;
      }

      if (canEditExtra) {
        const coverFile = document.getElementById("coverFile").files[0];
        const songFile = document.getElementById("songFile").files[0];
        const newColor = document.getElementById("editColor").value;
        const newThemeColor = document.getElementById("editThemeColor").value;

        updates.color = newColor;
        updates.themeColor = newThemeColor;

        if (coverFile) {
          const coverUrl = await uploadToCloudinary(coverFile, "image");
          if (coverUrl) updates.cover = coverUrl;
        }

        if (songFile) {
          btn.textContent = "جاري رفع الأغنية...";
          const songUrl = await uploadToCloudinary(songFile, "auto");
          if (songUrl) updates.song = songUrl;
        }
      }

      await set(ref(db, `users/${user.uid}`), {
        ...userData,
        ...updates,
      });

      alert("✅ تم حفظ التعديلات");
      document.getElementById("editProfileModal").remove();
    } catch (error) {
      console.error(error);
      alert("فشل الحفظ: " + error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "💾 حفظ التعديلات";
    }
  };
}

// ==========================================
// رفع الملفات إلى Cloudinary
// ==========================================
async function uploadToCloudinary(file, resourceType = "image") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Cloudinary error:", err);
    throw new Error("فشل رفع الملف");
  }

  const data = await response.json();
  return data.secure_url;
}

// ==========================================
// تنسيق الوقت
// ==========================================
function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
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
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (!document.getElementById("editProfileModal") && !document.getElementById("profileModal")) {
          renderRoomsScreen(user, userData);
        }
      } else {
        renderWelcomeScreen();
      }
    });
  } else {
    renderWelcomeScreen();
  }
});
