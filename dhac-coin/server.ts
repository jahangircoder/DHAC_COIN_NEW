import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // If PORT env var is set to 8080, in AI Studio Cloud Run Nginx uses 8080 and proxies to 3000
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}
const PORT = getPort();
const DB_FILE = path.join(__dirname, 'data', 'database.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

app.use(express.json({ limit: '10mb' }));

interface DatabaseSchema {
  students: any[];
  claims: any[];
  transactions: any[];
  classAwards: Record<string, number>;
  credentials: Record<string, string>;
  teachers: any[];
  rules?: any[];
  unions?: any[];
}

function readDB(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        parsed.students = Array.isArray(parsed.students) ? parsed.students : [];
        parsed.claims = Array.isArray(parsed.claims) ? parsed.claims : [];
        parsed.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
        parsed.classAwards = parsed.classAwards || {};
        parsed.credentials = parsed.credentials || {};
        parsed.teachers = Array.isArray(parsed.teachers) ? parsed.teachers : [];
        parsed.rules = Array.isArray(parsed.rules) ? parsed.rules : [];
        parsed.unions = Array.isArray(parsed.unions) ? parsed.unions : [];
        return parsed;
      }
    } catch (err) {
      console.error('[DATABASE READ ERROR]:', err);
    }
  }
  return { students: [], claims: [], transactions: [], classAwards: {}, credentials: {}, teachers: [], rules: [], unions: [] };
}

function writeDB(data: DatabaseSchema): void {
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}.${Math.floor(Math.random() * 10000)}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[DATABASE WRITE ERROR]:', err);
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

function recalculateRanksServer(records: any[]) {
  if (!Array.isArray(records) || records.length === 0) return;

  records.sort((a, b) => (b.totalCoins || 0) - (a.totalCoins || 0));
  let currentCampusRank = 1;
  for (let i = 0; i < records.length; i++) {
    if (i > 0 && (records[i].totalCoins || 0) < (records[i - 1].totalCoins || 0)) {
      currentCampusRank = i + 1;
    }
    records[i].campusRankNum = currentCampusRank;
    records[i].campusRank = `#${currentCampusRank}`;
    records[i].campusTotalStudents = records.length;
    
    const score = records[i].totalCoins || 0;
    if (score >= 60) records[i].tier = 'Diamond';
    else if (score >= 30) records[i].tier = 'Gold';
    else if (score >= 15) records[i].tier = 'Silver';
    else if (score > 0) records[i].tier = 'Bronze';
    else records[i].tier = 'Zero';
  }

  const classGroups = new Map<string, any[]>();
  records.forEach(s => {
    if (!classGroups.has(s.className)) classGroups.set(s.className, []);
    classGroups.get(s.className)!.push(s);
  });
  for (const [, classList] of classGroups.entries()) {
    classList.sort((a, b) => (b.totalCoins || 0) - (a.totalCoins || 0));
    let currentClassRank = 1;
    for (let i = 0; i < classList.length; i++) {
      if (i > 0 && (classList[i].totalCoins || 0) < (classList[i - 1].totalCoins || 0)) {
        currentClassRank = i + 1;
      }
      classList[i].classRankNum = currentClassRank;
      classList[i].classRank = `#${currentClassRank}`;
      classList[i].classSize = classList.length;
    }
  }

  const mentorGroups = new Map<string, any[]>();
  records.forEach(s => {
    if (!mentorGroups.has(s.mentorName)) mentorGroups.set(s.mentorName, []);
    mentorGroups.get(s.mentorName)!.push(s);
  });
  for (const [, mentorList] of mentorGroups.entries()) {
    mentorList.sort((a, b) => (b.totalCoins || 0) - (a.totalCoins || 0));
    let currentMentorRank = 1;
    for (let i = 0; i < mentorList.length; i++) {
      if (i > 0 && (mentorList[i].totalCoins || 0) < (mentorList[i - 1].totalCoins || 0)) {
        currentMentorRank = i + 1;
      }
      mentorList[i].mentorRankNum = currentMentorRank;
      mentorList[i].mentorGroupSize = mentorList.length;
      mentorList[i].mentorGroupRank = `#${currentMentorRank}/${mentorList.length}`;
    }
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DHAC Coin Portal API', timestamp: new Date().toISOString() });
});

app.get('/api/students', (req, res) => {
  res.json({ students: readDB().students });
});

app.post('/api/students/bulk', (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students)) return res.status(400).json({ error: 'Malformed dataset' });
  const db = readDB();
  db.students = students;
  recalculateRanksServer(db.students);
  writeDB(db);
  res.json({ success: true, count: db.students.length, students: db.students });
});

app.post('/api/students', (req, res) => {
  const newStudent = req.body;
  if (!newStudent || !newStudent.adNo) return res.status(400).json({ error: 'Incomplete student profile' });
  
  const db = readDB();
  db.students = [newStudent, ...(db.students || [])];
  recalculateRanksServer(db.students);
  writeDB(db);
  res.json({ success: true, student: newStudent, students: db.students });
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const updatePayload = req.body;
  const db = readDB();
  const idx = db.students.findIndex(s => s.id === id || s.studentId === id);
  if (idx === -1) return res.status(404).json({ error: 'Target profile missing' });

  db.students[idx] = { ...db.students[idx], ...updatePayload };
  recalculateRanksServer(db.students);
  writeDB(db);
  res.json({ success: true, student: db.students[idx], students: db.students });
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.students = db.students.filter(s => s.id !== id && s.studentId !== id);
  recalculateRanksServer(db.students);
  writeDB(db);
  res.json({ success: true, students: db.students });
});

app.post('/api/students/:id/photo', (req, res) => {
  const { id } = req.params;
  const { photoUrl } = req.body;
  const db = readDB();
  const student = db.students.find(s => s.id === id || s.studentId === id);
  if (!student) return res.status(404).json({ error: 'Profile not found' });
  
  student.photoUrl = photoUrl;
  writeDB(db);
  res.json({ success: true, photoUrl });
});

// Claims
app.get('/api/claims', (req, res) => {
  res.json({ claims: readDB().claims || [] });
});

app.post('/api/claims', (req, res) => {
  const claimData = req.body;
  if (!claimData.studentId || !claimData.coins) return res.status(400).json({ error: 'Invalid claim data' });
  
  const db = readDB();
  const newClaim = {
    ...claimData,
    id: `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    submittedAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }),
    status: 'PENDING',
  };
  db.claims = [newClaim, ...(db.claims || [])];
  writeDB(db);
  res.json({ success: true, claim: newClaim });
});

app.post('/api/claims/:id/approve', (req, res) => {
  const { id } = req.params;
  const { reviewerName } = req.body;
  const db = readDB();
  const claim = db.claims.find(c => c.id === id);
  if (!claim) return res.status(404).json({ error: 'Claim entry missing' });
  
  claim.status = 'APPROVED';
  claim.reviewedBy = reviewerName || 'Faculty Mentor';
  claim.reviewedAt = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' });

  const student = db.students.find(s => s.id === claim.studentId || s.studentId === claim.studentId || s.adNo === claim.adNo);
  if (student) {
    student.totalCoins = (student.totalCoins || 0) + claim.coins;
    student.coinStatus = 'CONFIRMED';
    student.rankStatus = 'OFFICIAL';
  }
  recalculateRanksServer(db.students);

  const newTx = {
    id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: claim.reviewedAt,
    targetType: 'STUDENT',
    studentId: claim.studentId,
    studentName: claim.studentName,
    adNo: claim.adNo,
    className: claim.className,
    category: claim.category,
    activityName: claim.activityName,
    coins: claim.coins,
    awardedBy: `Confirmed by Mentor: ${reviewerName}`,
    notes: claim.proofNotes,
  };
  db.transactions = [newTx, ...(db.transactions || [])];
  writeDB(db);
  res.json({ success: true, claim, student, students: db.students, transactions: db.transactions });
});

app.post('/api/claims/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reviewerName, reason } = req.body;
  const db = readDB();
  const claim = db.claims.find(c => c.id === id);
  if (!claim) return res.status(404).json({ error: 'Claim missing' });
  
  claim.status = 'REJECTED';
  claim.reviewedBy = reviewerName || 'Faculty Mentor';
  claim.reviewedAt = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' });
  if (reason) claim.rejectionReason = reason;
  
  writeDB(db);
  res.json({ success: true, claim });
});

// Transactions & Award Coins Direct
app.get('/api/transactions', (req, res) => {
  res.json({ transactions: readDB().transactions || [] });
});

app.post('/api/transactions', (req, res) => {
  const txData = req.body;
  if (!txData.coins) return res.status(400).json({ error: 'Invalid transaction parameters' });

  const db = readDB();
  const newTx = {
    ...txData,
    id: txData.id || `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: txData.timestamp || new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' }),
  };

  if (txData.targetType === 'STUDENT') {
    const student = db.students.find(s => s.id === txData.studentId || s.studentId === txData.studentId || s.adNo === txData.adNo);
    if (student) {
      student.totalCoins = (student.totalCoins || 0) + txData.coins;
      student.coinStatus = 'CONFIRMED';
      student.rankStatus = 'OFFICIAL';
      recalculateRanksServer(db.students);
    }
  } else if (txData.targetType === 'CLASS' && txData.className) {
    db.classAwards[txData.className] = (db.classAwards[txData.className] || 0) + txData.coins;
  }

  db.transactions = [newTx, ...(db.transactions || [])];
  writeDB(db);
  res.json({ success: true, transaction: newTx, students: db.students, classAwards: db.classAwards });
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const txIndex = db.transactions.findIndex(t => t.id === id);
  if (txIndex === -1) return res.status(404).json({ error: 'Transaction not found' });
  
  const tx = db.transactions[txIndex];
  if (tx.targetType === 'STUDENT') {
    const student = db.students.find(s => s.id === tx.studentId || s.studentId === tx.studentId || s.adNo === tx.adNo);
    if (student) {
      student.totalCoins = Math.max(0, (student.totalCoins || 0) - tx.coins);
      if (student.totalCoins === 0) student.coinStatus = 'ZERO';
      recalculateRanksServer(db.students);
    }
  } else if (tx.targetType === 'CLASS' && tx.className) {
    db.classAwards[tx.className] = Math.max(0, (db.classAwards[tx.className] || 0) - tx.coins);
  }

  db.transactions.splice(txIndex, 1);
  writeDB(db);
  res.json({ success: true, students: db.students, classAwards: db.classAwards, transactions: db.transactions });
});

// Class Awards
app.get('/api/class-awards', (req, res) => {
  res.json({ classAwards: readDB().classAwards || {} });
});

// Teachers
app.get('/api/teachers', (req, res) => {
  res.json({ teachers: readDB().teachers || [] });
});

app.post('/api/teachers', (req, res) => {
  const { teachers } = req.body;
  if (!Array.isArray(teachers)) return res.status(400).json({ error: 'Expected array of teachers' });
  const db = readDB();
  db.teachers = teachers;
  writeDB(db);
  res.json({ success: true, count: teachers.length });
});

// Rules
app.get('/api/rules', (req, res) => {
  res.json({ rules: readDB().rules || [] });
});

app.post('/api/rules', (req, res) => {
  const { rules } = req.body;
  if (!Array.isArray(rules)) return res.status(400).json({ error: 'Expected array of rules' });
  const db = readDB();
  db.rules = rules;
  writeDB(db);
  res.json({ success: true });
});

// Unions
app.get('/api/unions', (req, res) => {
  res.json({ unions: readDB().unions || [] });
});

app.post('/api/unions', (req, res) => {
  const { unions } = req.body;
  if (!Array.isArray(unions)) return res.status(400).json({ error: 'Expected array of unions' });
  const db = readDB();
  db.unions = unions;
  writeDB(db);
  res.json({ success: true });
});

// Credentials
app.get('/api/credentials', (req, res) => {
  res.json({ credentials: readDB().credentials || {} });
});

app.post('/api/credentials/update', (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) return res.status(400).json({ error: 'Missing params' });
  const db = readDB();
  db.credentials[username.toLowerCase()] = newPassword;
  db.credentials[username] = newPassword;
  writeDB(db);
  res.json({ success: true });
});

// System Reset
app.post('/api/reset', (req, res) => {
  const db = readDB();
  db.students.forEach(s => {
    s.totalCoins = 0;
    s.coinStatus = 'ZERO';
    s.tier = 'Zero';
  });
  recalculateRanksServer(db.students);
  db.transactions = [];
  db.claims = [];
  db.classAwards = {};
  writeDB(db);
  res.json({ success: true, count: db.students.length });
});

// Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const u = String(username).trim();
  const p = String(password).trim();
  const db = readDB();
  const customCreds = db.credentials || {};

  const verifyPassword = (accountUser: string, defaultPassword: string): boolean => {
    const overridden = customCreds[accountUser.toLowerCase()] || customCreds[accountUser];
    if (overridden !== undefined) {
      return p === overridden;
    }
    return p === defaultPassword;
  };

  // 1. Super Admin: sidra2026
  if (u.toLowerCase() === 'sidra2026') {
    const validSuperPasswords = ['@sidra.awarrd001', '@sidra.award001', 'sidra@2026', '@sidra2026', 'sidra2026'];
    const customSuper = customCreds['sidra2026'] || customCreds['SIDRA2026'];
    const isMatch = customSuper ? p === customSuper : validSuperPasswords.includes(p);
    if (isMatch) {
      return res.json({
        success: true,
        user: {
          username: 'sidra2026',
          role: 'SUPER_ADMIN',
          displayName: 'Super Admin (Sidra)',
        },
      });
    }
  }

  // 2. Staff General: staff@dhac.2026
  if (u.toLowerCase() === 'staff@dhac.2026' && verifyPassword('staff@dhac.2026', 'dhac@staff26')) {
    return res.json({
      success: true,
      user: {
        username: 'staff@dhac.2026',
        role: 'TEACHER_ADMIN',
        displayName: 'Faculty & Staff Admin',
      },
    });
  }

  // 3. Faculty Mentor / Teacher
  const teachersList = db.teachers && db.teachers.length > 0 ? db.teachers : [];
  const matchedTeacher = teachersList.find((t: any) => t.username.toUpperCase() === u.toUpperCase());
  if (matchedTeacher && verifyPassword(matchedTeacher.username, matchedTeacher.password)) {
    return res.json({
      success: true,
      user: {
        username: matchedTeacher.username,
        role: 'TEACHER_ADMIN',
        displayName: `${matchedTeacher.name} (${matchedTeacher.teacherId})`,
        teacherId: matchedTeacher.teacherId,
        mentorName: matchedTeacher.name,
      },
    });
  }

  // 4. Student: student_[AD_NO] or [AD_NO]
  const adInput = u.toLowerCase().startsWith('student_') ? u.substring(8) : u;
  const cleanAd = adInput.replace('*', '').toUpperCase();
  const student = db.students.find(
    (s: any) => s.adNo.toUpperCase() === cleanAd || s.adNo.replace('*', '').toUpperCase() === cleanAd
  );
  if (student) {
    const studentUsername = `student_${student.adNo}`;
    const defaultStudentPass = student.adNo.replace('*', '').toUpperCase();
    const studentPassValid =
      verifyPassword(studentUsername, defaultStudentPass) ||
      verifyPassword(`student_${student.adNo.replace('*', '')}`, defaultStudentPass) ||
      p.toUpperCase() === defaultStudentPass;

    if (studentPassValid) {
      return res.json({
        success: true,
        user: {
          username: studentUsername,
          role: 'STUDENT',
          displayName: `${student.name} (AD #${student.adNo})`,
          studentId: student.id,
          adNo: student.adNo,
          className: student.className,
          mentorName: student.mentorName,
          photoUrl: student.photoUrl,
        },
      });
    }
  }

  return res.status(401).json({ error: 'Invalid username or password' });
});

// Mount Vite or static build
async function startServer() {
  const httpServer = http.createServer(app);
  let viteInstance: Awaited<ReturnType<typeof createViteServer>> | null = null;

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    }).then((vite) => {
      viteInstance = vite;
      return vite;
    });

    // Prevent unhandled rejection if Vite initialization fails
    vitePromise.catch((err) => {
      console.error('[VITE INIT ERROR]:', err);
      process.exit(1);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = viteInstance || (await vitePromise);
        vite.middlewares(req, res, next);
      } catch (e) {
        next(e);
      }
    });

    // Fallback for SPA routing in development
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl;
      try {
        const vite = viteInstance || (await vitePromise);
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const shutdown = async () => {
    try {
      if (viteInstance) {
        await viteInstance.close();
      }
    } catch {
      // ignore close errors
    }
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 400).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v8.3.0  ready in 180 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`[INFO] Server started on port ${PORT}.`);
    console.log(`DHAC Coin Portal Server running on http://0.0.0.0:${PORT}\n`);
  });
}

startServer();
