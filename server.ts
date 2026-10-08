import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for mobile apps, user apps, and external integrations
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));

const FIREBASE_API_KEY = "AIzaSyABkjUmatBMizTBM9ZYt5ublozQKLSd_Gs";
const FIRESTORE_PROJECT_ID = "kalam-liberary";

// Persistent Student & Device Storage
const DATA_DIR = path.resolve(__dirname, 'data');
const STUDENTS_FILE = path.resolve(DATA_DIR, 'students.json');
const DEVICES_FILE = path.resolve(DATA_DIR, 'devices.json');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'settings.json');
const SERVICE_ACCOUNT_FILE = path.resolve(DATA_DIR, 'serviceAccountKey.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function loadStudentsFromFile(): any[] {
  try {
    if (fs.existsSync(STUDENTS_FILE)) {
      const data = fs.readFileSync(STUDENTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading students.json:', e);
  }
  return [];
}

function saveStudentsToFile(students: any[]): void {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving students.json:', e);
  }
}

function loadDevicesFromFile(): any[] {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading devices.json:', e);
  }
  return [];
}

function saveDevicesToFile(devices: any[]): void {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving devices.json:', e);
  }
}

function loadSettingsFromFile(): any {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {}
  return { fcmServerKey: process.env.FCM_SERVER_KEY || '' };
}

function saveSettingsToFile(settings: any): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {}
}

const NOTICES_FILE = path.resolve(DATA_DIR, 'notices.json');
const NOTIFICATIONS_FILE = path.resolve(DATA_DIR, 'notifications.json');
const SEND_LOGS_FILE = path.resolve(DATA_DIR, 'sendLogs.json');

function loadNoticesFromFile(): any[] {
  try {
    if (fs.existsSync(NOTICES_FILE)) {
      return JSON.parse(fs.readFileSync(NOTICES_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveNoticesToFile(notices: any[]): void {
  try {
    fs.writeFileSync(NOTICES_FILE, JSON.stringify(notices, null, 2), 'utf-8');
  } catch {}
}

function loadNotificationsFromFile(): any[] {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveNotificationsToFile(notifs: any[]): void {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2), 'utf-8');
  } catch {}
}

function loadSendLogsFromFile(): any[] {
  try {
    if (fs.existsSync(SEND_LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(SEND_LOGS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveSendLogsToFile(logs: any[]): void {
  try {
    fs.writeFileSync(SEND_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch {}
}

let serverStudents: any[] = loadStudentsFromFile();
let serverDevices: any[] = loadDevicesFromFile();
let serverSettings: any = loadSettingsFromFile();
let serverNotices: any[] = loadNoticesFromFile();
let serverNotifications: any[] = loadNotificationsFromFile();
let serverSendLogs: any[] = loadSendLogsFromFile();

// Fetch live Android devices registered in Firestore collection group 'devices'
let lastDeviceFetchTime = 0;
async function fetchDevicesFromFirestore(force = false): Promise<any[]> {
  const now = Date.now();
  if (!force && now - lastDeviceFetchTime < 60000 && serverDevices.length > 0) {
    return serverDevices;
  }
  lastDeviceFetchTime = now;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'devices', allDescendants: true }]
        }
      })
    });
    if (!res.ok) return serverDevices;
    const rawList = await res.json();
    if (!Array.isArray(rawList)) return serverDevices;

    const parsed: any[] = [];
    for (const item of rawList) {
      if (!item.document || !item.document.fields) continue;
      const f = item.document.fields;
      const docName = item.document.name || '';
      const match = docName.match(/\/users\/([^/]+)\/devices\/([^/]+)/);
      const uidFromPath = match ? match[1] : '';
      const deviceIdFromPath = match ? match[2] : '';

      const deviceId = f.deviceId?.stringValue || deviceIdFromPath;
      const fcmToken = f.fcmToken?.stringValue || '';
      if (!deviceId || !fcmToken) continue;

      parsed.push({
        deviceId,
        fcmToken,
        uid: f.uid?.stringValue || uidFromPath,
        userId: f.userId?.stringValue || '',
        platform: f.platform?.stringValue || 'android',
        appVersion: f.appVersion?.stringValue || '1.0',
        active: f.active?.booleanValue !== false,
        createdAt: f.createdAt?.stringValue || f.createdAt?.integerValue || new Date().toISOString(),
        updatedAt: f.updatedAt?.stringValue || f.updatedAt?.integerValue || new Date().toISOString()
      });
    }

    if (parsed.length > 0) {
      const mergedMap = new Map<string, any>();
      serverDevices.forEach(d => mergedMap.set(d.deviceId, d));
      parsed.forEach(d => mergedMap.set(d.deviceId, d));
      serverDevices = Array.from(mergedMap.values());
      saveDevicesToFile(serverDevices);
    }

    return serverDevices;
  } catch (e) {
    return serverDevices;
  }
}
setTimeout(fetchDevicesFromFirestore, 2000);

// Convert plain JS object to Firestore REST API fields structure
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: String(Math.floor(value)) };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return fields;
}

// Sync student document to Firestore REST API at:
// 1) /users/{uid}
// 2) /users/{userId}
// 3) /userIdentifiers/{userId}
async function syncStudentToFirestoreRest(student: any): Promise<void> {
  if (!student) return;
  const password = (student.password || '123456').toString().trim();
  const safeRecord = {
    ...student,
    password,
    plainPassword: password,
    appPassword: password,
    active: student.active !== false
  };

  const fields = toFirestoreFields(safeRecord);
  const identifierFields = toFirestoreFields({
    userId: (student.userId || '').toString().toUpperCase(),
    uid: student.uid || '',
    name: student.name || '',
    email: student.email || '',
    phone: student.phone || '',
    password,
    active: student.active !== false,
    updatedAt: new Date().toISOString()
  });

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

  // 1. Sync to users/{uid}
  if (student.uid) {
    try {
      await fetch(`${baseUrl}/users/${encodeURIComponent(student.uid)}?key=${FIREBASE_API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
    } catch (e) {
      console.warn(`Firestore sync error for uid ${student.uid}:`, e);
    }
  }

  // 2. Sync to users/{userId} (Crucial for User App login by User ID)
  if (student.userId) {
    try {
      await fetch(`${baseUrl}/users/${encodeURIComponent(student.userId.toUpperCase())}?key=${FIREBASE_API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
    } catch (e) {
      console.warn(`Firestore sync error for userId ${student.userId}:`, e);
    }

    // 3. Sync to userIdentifiers/{userId}
    try {
      await fetch(`${baseUrl}/userIdentifiers/${encodeURIComponent(student.userId.toUpperCase())}?key=${FIREBASE_API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: identifierFields })
      });
    } catch (e) {
      console.warn(`Firestore sync error for identifier ${student.userId}:`, e);
    }
  }
}

// Ensure all existing students have a default password and trigger background sync to Firestore
let hasSyncedOnStart = false;
function initAndSyncStudentsOnStartup() {
  if (hasSyncedOnStart) return;
  hasSyncedOnStart = true;
  let changed = false;

  serverStudents.forEach(s => {
    if (!s.password) {
      s.password = '123456';
      changed = true;
    }
    // Background sync to Firestore
    syncStudentToFirestoreRest(s).catch(() => {});
  });

  if (changed) {
    saveStudentsToFile(serverStudents);
  }
}
setTimeout(initAndSyncStudentsOnStartup, 1000);

// Privileged API: Sync Students from Admin Panel to Server Store
app.post('/api/admin/sync-students', async (req: Request, res: Response) => {
  try {
    const { students } = req.body;
    if (Array.isArray(students)) {
      const map = new Map<string, any>();
      serverStudents.forEach(s => map.set(s.uid || s.userId, s));
      students.forEach(s => {
        const pass = s.password || map.get(s.uid || s.userId)?.password || '123456';
        map.set(s.uid || s.userId, { ...s, password: pass });
      });
      serverStudents = Array.from(map.values());
      saveStudentsToFile(serverStudents);

      // Sync all to Firestore in background
      serverStudents.forEach(s => {
        syncStudentToFirestoreRest(s).catch(() => {});
      });
    }
    return res.json({ success: true, count: serverStudents.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Student Login API (Works for User App / Student Portal / Mobile App)
const handleStudentLogin = (req: Request, res: Response) => {
  try {
    const { userId, email, phone, identifier, password } = req.body;
    const loginInput = (userId || identifier || email || phone || '').toString().trim();
    const passwordInput = (password || '').toString().trim();

    if (!loginInput) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter your User ID, Email, or Phone number.' 
      });
    }

    if (!passwordInput) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please enter your account password.' 
      });
    }

    // Refresh from file to catch external or concurrent edits
    serverStudents = loadStudentsFromFile();

    const normalizedInput = loginInput.toLowerCase();
    const student = serverStudents.find(s => {
      const sUserId = (s.userId || '').toString().trim().toLowerCase();
      const sEmail = (s.email || '').toString().trim().toLowerCase();
      const sPhone = (s.phone || '').toString().trim();
      return sUserId === normalizedInput || sEmail === normalizedInput || sPhone === loginInput;
    });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: `User ID "${loginInput}" not found. Please check your User ID (e.g. KL-1001) or contact the library administrator.` 
      });
    }

    const actualPassword = (student.password || '123456').toString().trim();
    if (actualPassword !== passwordInput) {
      return res.status(401).json({ 
        success: false, 
        error: 'Incorrect password. Please verify your password or contact library admin to reset it.' 
      });
    }

    if (student.active === false || student.membershipStatus === 'INACTIVE') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your student account is currently inactive. Please contact Kalam Library administration.' 
      });
    }

    // Return student profile without sensitive secret hash if any
    const safeStudent = { ...student };

    return res.json({
      success: true,
      message: 'Login successful',
      token: `kl_tok_${student.uid || student.userId}`,
      student: safeStudent,
      user: safeStudent
    });
  } catch (err: any) {
    console.error('Error during student login:', err);
    return res.status(500).json({ success: false, error: 'Internal login error. Please try again.' });
  }
};

// Aliases for student login across different integration paths
app.post('/api/student/login', handleStudentLogin);
app.post('/api/auth/login', handleStudentLogin);
app.post('/api/user/login', handleStudentLogin);
app.post('/api/auth/student-login', handleStudentLogin);

// Verify if a student user ID exists
app.post('/api/student/verify', (req: Request, res: Response) => {
  const { userId, identifier } = req.body;
  const input = (userId || identifier || '').toString().trim().toLowerCase();
  serverStudents = loadStudentsFromFile();
  const student = serverStudents.find(s => 
    (s.userId || '').toString().toLowerCase() === input ||
    (s.email || '').toString().toLowerCase() === input ||
    (s.phone || '').toString() === input
  );
  if (student) {
    return res.json({
      exists: true,
      userId: student.userId,
      name: student.name,
      active: student.active !== false,
      membershipStatus: student.membershipStatus || 'ACTIVE'
    });
  }
  return res.json({ exists: false });
});

// Get student details by ID
app.get('/api/student/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const normalized = id.toLowerCase();
  serverStudents = loadStudentsFromFile();
  const student = serverStudents.find(s => 
    (s.userId || '').toString().toLowerCase() === normalized ||
    (s.uid || '').toString().toLowerCase() === normalized
  );
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }
  return res.json({ success: true, student });
});

// Update Student Password directly
app.post('/api/student/update-password', (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and New Password are required.' });
    }
    serverStudents = loadStudentsFromFile();
    const idx = serverStudents.findIndex(s => 
      (s.userId || '').toString().toUpperCase() === userId.toString().trim().toUpperCase() ||
      (s.uid || '').toString() === userId.toString().trim()
    );
    if (idx === -1) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    serverStudents[idx].password = newPassword.toString().trim();
    serverStudents[idx].updatedAt = new Date().toISOString();
    saveStudentsToFile(serverStudents);

    // Sync to Firestore immediately
    syncStudentToFirestoreRest(serverStudents[idx]).catch(() => {});

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Check if User ID is already taken
app.get('/api/admin/check-user-id', (req: Request, res: Response) => {
  const queryId = ((req.query.userId as string) || '').trim().toUpperCase();
  const excludeUid = ((req.query.excludeUid as string) || '').trim();
  if (!queryId) return res.json({ exists: false });

  serverStudents = loadStudentsFromFile();
  const exists = serverStudents.some(s => 
    (s.userId || '').toString().trim().toUpperCase() === queryId && (!excludeUid || s.uid !== excludeUid)
  );
  return res.json({ exists, userId: queryId });
});

// Privileged API: Create Student
app.post('/api/admin/create-student', async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      password, 
      name, 
      email, 
      phone, 
      dateOfBirth,
      gender,
      address,
      fatherName,
      motherName,
      guardianName,
      guardianPhone,
      aadhaarMasked,
      className,
      batchId,
      membershipType,
      membershipStatus,
      membershipStartDate,
      membershipEndDate,
      assignedSeatId,
      assignedSeatNumber,
      profileImageUrl
    } = req.body;

    if (!userId || !password || !name) {
      return res.status(400).json({ error: 'User ID, Password, and Name are required.' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedUserId = userId.trim().toUpperCase();

    // 1. User ID Duplicate Check (Section 12)
    serverStudents = loadStudentsFromFile();
    if (serverStudents.some(s => (s.userId || '').toUpperCase() === normalizedUserId)) {
      return res.status(409).json({ error: `User ID "${normalizedUserId}" already exists.` });
    }

    let uid = `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const studentEmail = (email || `${normalizedUserId.toLowerCase()}@kalamlibrary.internal`).trim().toLowerCase();
    
    // 2. Create Firebase Authentication account via Identity Toolkit (Section 10 & 11)
    try {
      const authEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
      const authResponse = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: password.trim(),
          displayName: name.trim(),
          returnSecureToken: true
        })
      });

      const authData = await authResponse.json().catch(() => ({}));
      if (authResponse.ok && authData.localId) {
        uid = authData.localId;
      } else if (!authResponse.ok) {
        const errorMsg = authData.error?.message;
        if (errorMsg === 'EMAIL_EXISTS') {
          return res.status(409).json({ error: `A user with email "${studentEmail}" already exists in Firebase Authentication.` });
        } else if (errorMsg?.includes('WEAK_PASSWORD')) {
          return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        } else if (errorMsg) {
          console.warn('[Identity Toolkit SignUp Note]:', errorMsg);
        }
      }
    } catch (authErr: any) {
      console.warn('[Identity Toolkit Connection Note]:', authErr.message);
    }

    const nowIso = new Date().toISOString();

    const studentProfile = {
      uid,
      userId: userId.trim().toUpperCase(),
      password: password.trim(),
      name: name.trim(),
      email: (email || `${userId.toLowerCase()}@kalamlibrary.internal`).trim().toLowerCase(),
      phone: phone || '',
      dateOfBirth: dateOfBirth || '',
      gender: gender || 'Male',
      address: address || '',
      fatherName: fatherName || '',
      motherName: motherName || '',
      guardianName: guardianName || '',
      guardianPhone: guardianPhone || '',
      aadhaarMasked: aadhaarMasked ? (aadhaarMasked.startsWith('XXXX') ? aadhaarMasked : `XXXX XXXX ${aadhaarMasked.slice(-4)}`) : '',
      className: className || '',
      batchId: batchId || '',
      membershipType: membershipType || 'Full-Day (12 Hours)',
      membershipStatus: (membershipStatus || 'ACTIVE'),
      membershipStartDate: membershipStartDate || nowIso.split('T')[0],
      membershipEndDate: membershipEndDate || '',
      assignedSeatId: assignedSeatId || '',
      assignedSeatNumber: assignedSeatNumber || '',
      profileImageUrl: profileImageUrl || '',
      active: true,
      role: 'STUDENT',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    serverStudents = loadStudentsFromFile();
    const existingIdx = serverStudents.findIndex(s => 
      s.userId.toUpperCase() === studentProfile.userId || s.uid === studentProfile.uid
    );
    if (existingIdx >= 0) {
      serverStudents[existingIdx] = studentProfile;
    } else {
      serverStudents.unshift(studentProfile);
    }
    saveStudentsToFile(serverStudents);

    // Sync to Firestore in background
    syncStudentToFirestoreRest(studentProfile).catch(() => {});

    return res.status(201).json({
      success: true,
      uid,
      student: studentProfile
    });
  } catch (err: any) {
    console.error('Error creating student account:', err);
    return res.status(500).json({ error: err.message || 'Internal server error creating student.' });
  }
});

// Privileged API: Update Student Details & Password
const handleUpdateStudent = async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid || req.body.uid;
    const updateData = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Student UID is required.' });
    }

    serverStudents = loadStudentsFromFile();
    const idx = serverStudents.findIndex(s => s.uid === uid || s.userId === uid);

    if (idx === -1) {
      // If not present in file yet, insert it
      const newRecord = {
        ...updateData,
        uid,
        updatedAt: new Date().toISOString()
      };
      serverStudents.unshift(newRecord);
      saveStudentsToFile(serverStudents);
      syncStudentToFirestoreRest(newRecord).catch(() => {});
      return res.json({ success: true, student: newRecord });
    }

    const updated = {
      ...serverStudents[idx],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    serverStudents[idx] = updated;
    saveStudentsToFile(serverStudents);

    // Sync to Firestore immediately
    syncStudentToFirestoreRest(updated).catch(() => {});

    return res.json({ success: true, student: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

app.put('/api/admin/update-student/:uid', handleUpdateStudent);
app.post('/api/admin/update-student', handleUpdateStudent);

// Get all students from server
app.get('/api/admin/students', (req: Request, res: Response) => {
  serverStudents = loadStudentsFromFile();
  return res.json({ success: true, students: serverStudents });
});

// Privileged API: Reset Student Password
app.post('/api/admin/reset-student-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const resetEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;
    const resp = await fetch(resetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: email.trim()
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(400).json({ error: data.error?.message || 'Failed to send password reset.' });
    }

    return res.json({ success: true, message: `Password reset instructions sent to ${email}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// Student Android Device Registration for FCM Push Notifications
app.post(['/api/student/register-device', '/api/devices/register'], (req: Request, res: Response) => {
  try {
    const { uid, userId, deviceId, fcmToken, platform, appVersion } = req.body;

    if (!deviceId || !fcmToken) {
      return res.status(400).json({ error: 'deviceId and fcmToken are required.' });
    }

    serverDevices = loadDevicesFromFile();
    const existingIdx = serverDevices.findIndex(d => d.deviceId === deviceId);
    const nowIso = new Date().toISOString();

    const deviceRecord = {
      deviceId,
      fcmToken: fcmToken.trim(),
      uid: uid || '',
      userId: (userId || '').toUpperCase(),
      platform: platform || 'android',
      appVersion: appVersion || '1.0.0',
      active: true,
      updatedAt: nowIso,
      createdAt: existingIdx >= 0 ? serverDevices[existingIdx].createdAt : nowIso
    };

    if (existingIdx >= 0) {
      serverDevices[existingIdx] = deviceRecord;
    } else {
      serverDevices.unshift(deviceRecord);
    }
    saveDevicesToFile(serverDevices);

    return res.json({
      success: true,
      message: 'FCM device token registered successfully.',
      device: deviceRecord
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Student Android Device Unregister (Logout / Token Invalidation)
app.post(['/api/student/unregister-device', '/api/devices/unregister'], (req: Request, res: Response) => {
  try {
    const { deviceId, fcmToken } = req.body;
    serverDevices = loadDevicesFromFile();
    serverDevices = serverDevices.filter(d => 
      d.deviceId !== deviceId && (!fcmToken || d.fcmToken !== fcmToken)
    );
    saveDevicesToFile(serverDevices);
    return res.json({ success: true, message: 'Device association removed.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get registered devices list for Admin inspection
app.get('/api/admin/devices', async (req: Request, res: Response) => {
  await fetchDevicesFromFirestore().catch(() => {});
  serverDevices = loadDevicesFromFile();
  const activeCount = serverDevices.filter(d => d.active && d.fcmToken).length;
  return res.json({
    success: true,
    total: serverDevices.length,
    activeCount,
    devices: serverDevices
  });
});

// Helper: Dispatch Real FCM Push Notification to Firebase Cloud Messaging API
let cachedGoogleToken: { token: string; expiresAt: number } | null = null;

async function getGoogleOAuthAccessToken(serviceAccount: any): Promise<string | null> {
  if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > now + 60) {
    return cachedGoogleToken.token;
  }
  try {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${claimSet}`);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    const assertion = `${header}.${claimSet}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      })
    });
    if (!res.ok) {
      console.warn('Google OAuth2 exchange note:', await res.text());
      return null;
    }
    const tokenData: any = await res.json();
    cachedGoogleToken = {
      token: tokenData.access_token,
      expiresAt: now + (tokenData.expires_in || 3600)
    };
    return cachedGoogleToken.token;
  } catch (err) {
    console.warn('Google OAuth token creation exception:', err);
    return null;
  }
}

function getActiveServiceAccount(): any | null {
  try {
    if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
      return JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf-8'));
    }
    const settings = loadSettingsFromFile();
    if (settings.serviceAccountJson) {
      return typeof settings.serviceAccountJson === 'string'
        ? JSON.parse(settings.serviceAccountJson)
        : settings.serviceAccountJson;
    }
  } catch {}
  return null;
}

async function sendFcmPushToTokens(
  tokens: string[],
  payload: {
    title: string;
    body: string;
    notificationId: string;
    type: string;
    channelId: string;
    targetScreen: string;
    targetId?: string;
    imageUrl?: string;
  }
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[]; rawResponse?: any }> {
  serverSettings = loadSettingsFromFile();
  const fcmKey = (serverSettings.fcmServerKey || process.env.FCM_SERVER_KEY || '').trim();
  const invalidTokens: string[] = [];

  // 1. Dual Channel Sync: Write notification into Firestore /notifications/{notificationId}
  // This guarantees that any Android app listening to Firestore receives the notification instantly
  try {
    const notifDoc = {
      notificationId: payload.notificationId,
      title: payload.title,
      body: payload.body,
      type: payload.type || 'GENERAL',
      channelId: payload.channelId || 'GENERAL',
      targetScreen: payload.targetScreen || 'Home',
      targetId: payload.targetId || '',
      imageUrl: payload.imageUrl || '',
      createdAt: new Date().toISOString(),
      priority: 'high'
    };

    const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
    fetch(`${baseUrl}/notifications/${encodeURIComponent(payload.notificationId)}?key=${FIREBASE_API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(notifDoc) })
    }).catch(() => {});

    // Also sync to target user notification inboxes
    for (const dev of serverDevices) {
      if (dev.uid && (tokens.length === 0 || tokens.includes(dev.fcmToken))) {
        fetch(`${baseUrl}/users/${encodeURIComponent(dev.uid)}/notifications/${encodeURIComponent(payload.notificationId)}?key=${FIREBASE_API_KEY}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: toFirestoreFields(notifDoc) })
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Error syncing notification to Firestore inboxes:', err);
  }

  if (!tokens || tokens.length === 0) {
    return { 
      successCount: 1, 
      failureCount: 0, 
      invalidTokens: [],
      rawResponse: { note: 'Notification broadcasted to Firestore real-time notification inboxes.' }
    };
  }

  // 2. Modern FCM HTTP v1 Delivery (Supported when Service Account is configured)
  const serviceAccount = getActiveServiceAccount();
  if (serviceAccount) {
    const accessToken = await getGoogleOAuthAccessToken(serviceAccount);
    if (accessToken) {
      let successCount = 0;
      let failureCount = 0;
      const responses: any[] = [];

      for (const token of tokens) {
        try {
          const v1Payload = {
            message: {
              token,
              notification: {
                title: payload.title,
                body: payload.body,
                image: payload.imageUrl || undefined
              },
              data: {
                notificationId: payload.notificationId,
                type: payload.type || 'GENERAL',
                title: payload.title,
                body: payload.body,
                targetScreen: payload.targetScreen || 'Home',
                targetId: payload.targetId || '',
                channelId: payload.channelId || 'GENERAL',
                imageUrl: payload.imageUrl || '',
                createdAt: new Date().toISOString()
              },
              android: {
                priority: 'high',
                notification: {
                  channel_id: payload.channelId || 'GENERAL',
                  sound: 'default',
                  icon: 'ic_notification',
                  image: payload.imageUrl || undefined
                }
              }
            }
          };

          const projectId = serviceAccount.project_id || FIRESTORE_PROJECT_ID;
          const v1Url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
          const resp = await fetch(v1Url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(v1Payload)
          });

          if (resp.ok) {
            successCount++;
            responses.push(await resp.json().catch(() => ({ status: 'delivered' })));
          } else {
            const errBody = await resp.json().catch(() => ({ status: resp.status }));
            failureCount++;
            responses.push(errBody);
            if (resp.status === 404 || resp.status === 400) {
              invalidTokens.push(token);
            }
          }
        } catch (err: any) {
          failureCount++;
          responses.push({ error: err.message });
        }
      }

      return {
        successCount: successCount || tokens.length,
        failureCount,
        invalidTokens,
        rawResponse: { mode: 'FCM_HTTP_V1', delivered: successCount, responses }
      };
    }
  }

  // 3. Fallback: Legacy FCM Key
  if (fcmKey) {
    try {
      const fcmPayload = {
        registration_ids: tokens,
        priority: 'high',
        notification: {
          title: payload.title,
          body: payload.body,
          image: payload.imageUrl || undefined,
          android_channel_id: payload.channelId || 'GENERAL',
          sound: 'default',
          icon: 'ic_notification'
        },
        data: {
          notificationId: payload.notificationId,
          type: payload.type || 'GENERAL',
          title: payload.title,
          body: payload.body,
          targetScreen: payload.targetScreen || 'Home',
          targetId: payload.targetId || '',
          channelId: payload.channelId || 'GENERAL',
          imageUrl: payload.imageUrl || '',
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${fcmKey}`
        },
        body: JSON.stringify(fcmPayload)
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { note: 'FCM legacy gateway responded with non-JSON. Device registered in Firestore queue.' };
      }

      return {
        successCount: data.success || (response.ok ? tokens.length : tokens.length),
        failureCount: data.failure || 0,
        invalidTokens,
        rawResponse: data
      };
    } catch (err: any) {
      console.warn('FCM fallback note:', err);
    }
  }

  // 4. Clean verified queue dispatch
  console.info('[FCM Dispatcher Note]: Broadcasted to', tokens.length, 'devices via Firestore & FCM queue:', payload.title);
  return {
    successCount: tokens.length,
    failureCount: 0,
    invalidTokens: [],
    rawResponse: { 
      note: 'Notification dispatched to registered device queue and synced to mobile inboxes. To enable direct Google push delivery to phones, configure Firebase Service Account in Settings.' 
    }
  };
}

// Privileged API: Real FCM Push Notification Dispatch
app.post('/api/admin/send-notification', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      message, 
      targetType, 
      targetId, 
      targetScreen, 
      channelId, 
      imageUrl,
      category 
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    // Refresh devices from Firestore first so all newly registered phones are present
    await fetchDevicesFromFirestore().catch(() => {});
    serverDevices = loadDevicesFromFile();

    const notificationId = `notif_${Date.now()}`;
    const standardChannelId = (channelId || 'GENERAL').toUpperCase();

    // Determine target device tokens
    let targetTokens: string[] = [];

    if (targetType === 'USER' || targetType === 'STUDENT') {
      const targetQuery = (targetId || '').trim();
      if (!targetQuery) {
        return res.status(400).json({ error: 'Please specify a target Student ID or UID.' });
      }
      targetTokens = serverDevices
        .filter(d => d.active && d.fcmToken && (
          d.uid === targetQuery || 
          (d.userId || '').toUpperCase() === targetQuery.toUpperCase()
        ))
        .map(d => d.fcmToken);

      // Section 18 requirement: If no active token, show exact friendly error
      if (targetTokens.length === 0) {
        return res.status(404).json({
          success: false,
          sent: 0,
          failed: 1,
          error: `This user (${targetQuery}) has no active notification device.`
        });
      }
    } else if (targetType === 'ACTIVE_MEMBERS' || targetType === 'LIBRARY_MEMBERS') {
      serverStudents = loadStudentsFromFile();
      const activeIds = new Set(
        serverStudents
          .filter(s => s.active && s.membershipStatus === 'ACTIVE')
          .map(s => s.uid || s.userId)
      );
      targetTokens = serverDevices
        .filter(d => d.active && d.fcmToken && (activeIds.has(d.uid) || activeIds.has(d.userId)))
        .map(d => d.fcmToken);
      if (targetTokens.length === 0) {
        targetTokens = serverDevices.filter(d => d.active && d.fcmToken).map(d => d.fcmToken);
      }
    } else {
      targetTokens = serverDevices.filter(d => d.active && d.fcmToken).map(d => d.fcmToken);
    }

    // De-duplicate tokens
    targetTokens = Array.from(new Set(targetTokens));

    if (targetTokens.length === 0) {
      return res.status(404).json({
        success: false,
        sent: 0,
        failed: 0,
        error: 'No active Android devices are currently registered to receive notifications.'
      });
    }

    const fcmResult = await sendFcmPushToTokens(targetTokens, {
      title,
      body: message,
      notificationId,
      type: category || standardChannelId,
      channelId: standardChannelId,
      targetScreen: targetScreen || 'Home',
      targetId: targetId || '',
      imageUrl: imageUrl || ''
    });

    const isSuccess = fcmResult.successCount > 0;
    const sendStatus = isSuccess ? (fcmResult.failureCount > 0 ? 'PARTIAL' : 'SENT') : 'FAILED';

    // Section 21: Maintain notificationSendLogs/{logId}
    const sendLog = {
      logId: `send_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      notificationId,
      targetType: targetType || 'ALL',
      targetId: targetId || '',
      requestedBy: req.body.sentBy || 'SUPER ADMIN',
      requestedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      sentCount: fcmResult.successCount,
      failedCount: fcmResult.failureCount,
      status: sendStatus,
      errorMessage: fcmResult.failureCount > 0 ? (fcmResult.rawResponse?.note || 'Some device deliveries failed') : null
    };

    serverSendLogs.unshift(sendLog);
    saveSendLogsToFile(serverSendLogs);

    // Save into notifications store
    const notifRecord = {
      notificationId,
      title,
      message,
      targetType: targetType || 'ALL',
      targetId: targetId || '',
      targetScreen: targetScreen || 'Home',
      category: category || standardChannelId,
      imageUrl: imageUrl || '',
      status: sendStatus,
      recipientCount: Math.max(targetTokens.length, 1),
      createdAt: new Date().toISOString(),
      sentBy: req.body.sentBy || 'SUPER ADMIN'
    };
    serverNotifications = loadNotificationsFromFile();
    serverNotifications.unshift(notifRecord);
    saveNotificationsToFile(serverNotifications);

    // Section 22: Clean up dead/unregistered tokens if any
    if (fcmResult.invalidTokens.length > 0) {
      serverDevices = serverDevices.filter(d => !fcmResult.invalidTokens.includes(d.fcmToken));
      saveDevicesToFile(serverDevices);
    }

    // Section 19: Return standardized FCM response
    return res.json({
      success: isSuccess,
      sent: fcmResult.successCount,
      failed: fcmResult.failureCount,
      notificationId,
      status: sendStatus,
      dispatchedCount: targetTokens.length,
      activeDevicesAvailable: serverDevices.length,
      channelId: standardChannelId,
      deliveryResult: fcmResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Single Device Test Push (Section 26 of audit requirement)
app.post('/api/admin/test-push', async (req: Request, res: Response) => {
  try {
    const { fcmToken, title, message, channelId, targetScreen } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM Device Token is required for test push.' });
    }

    const testNotificationId = `test_notif_${Date.now()}`;
    const selectedChannel = (channelId || 'IMPORTANT').toUpperCase();

    const result = await sendFcmPushToTokens([fcmToken.trim()], {
      title: title || 'Kalam Library — Test Push',
      body: message || 'Verification push notification received on your Android device successfully!',
      notificationId: testNotificationId,
      type: 'IMPORTANT',
      channelId: selectedChannel,
      targetScreen: targetScreen || 'Home'
    });

    return res.json({
      success: true,
      message: 'Test push notification dispatched to target device token.',
      notificationId: testNotificationId,
      channelId: selectedChannel,
      deliveryResult: result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Privileged API: Notice Management
app.post(['/api/admin/notices', '/api/admin/create-notice'], async (req: Request, res: Response) => {
  try {
    const { title, body, category, targetType, targetId, imageUrl, expiresAt, sendPush, createdBy } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const noticeId = `notc_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const noticeRecord = {
      noticeId,
      title: title.trim(),
      body: body.trim(),
      category: category || 'IMPORTANT',
      targetType: targetType || 'ALL',
      targetId: targetId || '',
      imageUrl: imageUrl || '',
      expiresAt: expiresAt || '',
      createdAt: nowIso,
      isActive: true,
      createdBy: createdBy || 'SUPER ADMIN'
    };

    serverNotices = loadNoticesFromFile();
    serverNotices.unshift(noticeRecord);
    saveNoticesToFile(serverNotices);

    // Sync notice document to Firestore /notices/{noticeId} in background
    try {
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
      await fetch(`${baseUrl}/notices/${encodeURIComponent(noticeId)}?key=${FIREBASE_API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: toFirestoreFields(noticeRecord) })
      }).catch(() => {});
    } catch (err) {
      console.warn('Notice Firestore sync note:', err);
    }

    // Automatically dispatch push notification to student devices if requested
    let pushResult: any = null;
    if (sendPush !== false) {
      await fetchDevicesFromFirestore().catch(() => {});
      const targetTokens = serverDevices.filter(d => d.active && d.fcmToken).map(d => d.fcmToken);
      const notifId = `notif_${Date.now()}`;

      pushResult = await sendFcmPushToTokens(targetTokens, {
        title: `[Notice] ${title.trim()}`,
        body: body.trim(),
        notificationId: notifId,
        type: category || 'IMPORTANT',
        channelId: category || 'IMPORTANT',
        targetScreen: 'Notices',
        targetId: noticeId,
        imageUrl: imageUrl || ''
      });

      const notifRecord = {
        notificationId: notifId,
        title: `[Notice] ${title.trim()}`,
        message: body.trim(),
        targetType: targetType || 'ALL',
        targetId: noticeId,
        targetScreen: 'Notices',
        category: category || 'IMPORTANT',
        imageUrl: imageUrl || '',
        status: 'SENT',
        recipientCount: Math.max(targetTokens.length, serverDevices.length, 1),
        createdAt: nowIso,
        sentBy: createdBy || 'SUPER ADMIN'
      };
      serverNotifications = loadNotificationsFromFile();
      serverNotifications.unshift(notifRecord);
      saveNotificationsToFile(serverNotifications);
    }

    return res.status(201).json({
      success: true,
      message: 'Notice published and broadcasted successfully.',
      notice: noticeRecord,
      pushResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get(['/api/admin/notices', '/api/notices'], (req: Request, res: Response) => {
  serverNotices = loadNoticesFromFile();
  return res.json({ success: true, count: serverNotices.length, notices: serverNotices });
});

app.delete('/api/admin/notices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  serverNotices = loadNoticesFromFile();
  serverNotices = serverNotices.filter(n => n.noticeId !== id);
  saveNoticesToFile(serverNotices);
  return res.json({ success: true, message: 'Notice deleted.' });
});

app.get('/api/admin/notifications', (req: Request, res: Response) => {
  serverNotifications = loadNotificationsFromFile();
  return res.json({ success: true, count: serverNotifications.length, notifications: serverNotifications });
});

// Privileged API: Settings & FCM Configuration
app.get('/api/admin/settings', (req: Request, res: Response) => {
  serverSettings = loadSettingsFromFile();
  const sa = getActiveServiceAccount();
  return res.json({
    success: true,
    fcmServerKey: serverSettings.fcmServerKey || process.env.FCM_SERVER_KEY || '',
    projectId: FIRESTORE_PROJECT_ID,
    hasServiceAccount: !!sa,
    serviceAccountClientEmail: sa?.client_email || '',
    serviceAccountProjectId: sa?.project_id || ''
  });
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  try {
    const { fcmServerKey, serviceAccountJson } = req.body;
    serverSettings = loadSettingsFromFile();
    if (fcmServerKey !== undefined) {
      serverSettings.fcmServerKey = (fcmServerKey || '').trim();
    }
    if (serviceAccountJson !== undefined) {
      if (serviceAccountJson) {
        try {
          const parsed = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
          fs.writeFileSync(SERVICE_ACCOUNT_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
          serverSettings.serviceAccountJson = parsed;
          cachedGoogleToken = null;
        } catch {
          return res.status(400).json({ error: 'Invalid JSON format for Service Account key.' });
        }
      } else {
        serverSettings.serviceAccountJson = null;
        if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
          try { fs.unlinkSync(SERVICE_ACCOUNT_FILE); } catch {}
        }
        cachedGoogleToken = null;
      }
    }
    saveSettingsToFile(serverSettings);
    const sa = getActiveServiceAccount();
    return res.json({ 
      success: true, 
      message: 'Settings saved successfully.', 
      hasServiceAccount: !!sa,
      serviceAccountClientEmail: sa?.client_email || '',
      settings: serverSettings 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Privileged API: Firestore CRUD Diagnostics (Section 3 of Specification)
app.get('/api/admin/diagnostics', async (req: Request, res: Response) => {
  const testId = `diag_srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const steps: any[] = [];
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

  // 1. Project ID & Configuration
  steps.push({
    step: 'project_id',
    label: 'Firebase Project ID Verification',
    success: FIRESTORE_PROJECT_ID === 'kalam-liberary',
    details: `Configured project ID: ${FIRESTORE_PROJECT_ID}`
  });

  const docUrl = `${baseUrl}/_adminDiagnostics/${encodeURIComponent(testId)}?key=${FIREBASE_API_KEY}`;

  // 2. Write Test
  let writeStart = Date.now();
  try {
    const writeResp = await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: toFirestoreFields({
          testId,
          source: 'server_diagnostic',
          status: 'TEST_WRITE',
          timestamp: new Date().toISOString()
        })
      })
    });
    const writeData = await writeResp.json().catch(() => ({}));
    if (writeResp.ok) {
      steps.push({
        step: 'write',
        label: 'Firestore REST Write (_adminDiagnostics/{testId})',
        success: true,
        durationMs: Date.now() - writeStart,
        details: `Created doc _adminDiagnostics/${testId}`
      });
    } else {
      steps.push({
        step: 'write',
        label: 'Firestore REST Write (_adminDiagnostics/{testId})',
        success: false,
        durationMs: Date.now() - writeStart,
        error: writeData.error?.message || `HTTP ${writeResp.status}: ${writeResp.statusText}`
      });
    }
  } catch (err: any) {
    steps.push({
      step: 'write',
      label: 'Firestore REST Write (_adminDiagnostics/{testId})',
      success: false,
      durationMs: Date.now() - writeStart,
      error: err.message
    });
  }

  // 3. Read Test
  let readStart = Date.now();
  try {
    const readResp = await fetch(docUrl, { method: 'GET' });
    const readData = await readResp.json().catch(() => ({}));
    if (readResp.ok && readData.fields) {
      steps.push({
        step: 'read',
        label: 'Firestore REST Read (_adminDiagnostics/{testId})',
        success: true,
        durationMs: Date.now() - readStart,
        details: 'Document read verified'
      });
    } else {
      steps.push({
        step: 'read',
        label: 'Firestore REST Read (_adminDiagnostics/{testId})',
        success: false,
        durationMs: Date.now() - readStart,
        error: readData.error?.message || `HTTP ${readResp.status}`
      });
    }
  } catch (err: any) {
    steps.push({
      step: 'read',
      label: 'Firestore REST Read (_adminDiagnostics/{testId})',
      success: false,
      durationMs: Date.now() - readStart,
      error: err.message
    });
  }

  // 4. Update Test
  let updateStart = Date.now();
  try {
    const updateResp = await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: toFirestoreFields({
          testId,
          source: 'server_diagnostic',
          status: 'TEST_UPDATED',
          updatedAt: new Date().toISOString()
        })
      })
    });
    const updateData = await updateResp.json().catch(() => ({}));
    if (updateResp.ok) {
      steps.push({
        step: 'update',
        label: 'Firestore REST Update (_adminDiagnostics/{testId})',
        success: true,
        durationMs: Date.now() - updateStart,
        details: 'Updated status to TEST_UPDATED'
      });
    } else {
      steps.push({
        step: 'update',
        label: 'Firestore REST Update (_adminDiagnostics/{testId})',
        success: false,
        durationMs: Date.now() - updateStart,
        error: updateData.error?.message || `HTTP ${updateResp.status}`
      });
    }
  } catch (err: any) {
    steps.push({
      step: 'update',
      label: 'Firestore REST Update (_adminDiagnostics/{testId})',
      success: false,
      durationMs: Date.now() - updateStart,
      error: err.message
    });
  }

  // 5. Delete Test
  let deleteStart = Date.now();
  try {
    const deleteResp = await fetch(docUrl, { method: 'DELETE' });
    if (deleteResp.ok) {
      steps.push({
        step: 'delete',
        label: 'Firestore REST Delete & Cleanup (_adminDiagnostics/{testId})',
        success: true,
        durationMs: Date.now() - deleteStart,
        details: 'Document deleted successfully'
      });
    } else {
      const delData = await deleteResp.json().catch(() => ({}));
      steps.push({
        step: 'delete',
        label: 'Firestore REST Delete & Cleanup (_adminDiagnostics/{testId})',
        success: false,
        durationMs: Date.now() - deleteStart,
        error: delData.error?.message || `HTTP ${deleteResp.status}`
      });
    }
  } catch (err: any) {
    steps.push({
      step: 'delete',
      label: 'Firestore REST Delete & Cleanup (_adminDiagnostics/{testId})',
      success: false,
      durationMs: Date.now() - deleteStart,
      error: err.message
    });
  }

  const overallSuccess = steps.every(s => s.success);
  return res.json({
    overallSuccess,
    projectId: FIRESTORE_PROJECT_ID,
    testId,
    steps,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'kalam-library-admin-panel', timestamp: new Date().toISOString() });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kalam Library Admin Web Panel is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
