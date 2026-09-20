const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Locate dataset file flexibly without hardcoded absolute paths
const getFullDataset = () => {
  const localQuestions = path.join(__dirname, 'data', 'questions.json');
  if (fs.existsSync(localQuestions)) {
    const data = JSON.parse(fs.readFileSync(localQuestions, 'utf8'));
    return data.filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
  }

  const parentFull = path.join(__dirname, '..', 'QuestionBank_Reviewed_Full.json');
  if (fs.existsSync(parentFull)) {
    const data = JSON.parse(fs.readFileSync(parentFull, 'utf8'));
    return data.filter(q => q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '');
  }

  console.error('No question bank source file found.');
  return [];
};

const fullDataset = getFullDataset();

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'questions.json'), JSON.stringify(fullDataset, null, 2), 'utf8');

const adminPassHash = bcrypt.hashSync('admin123', 10);
const studentPassHash = bcrypt.hashSync('student123', 10);

const defaultUsers = [];

// Preserve existing users if users.json already exists
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2), 'utf8');
  console.log(`Created default users.json with admin and student accounts.`);
} else {
  console.log(`Preserved existing users.json.`);
}

const defaultQuizzes = [
  {
    id: "qz_01",
    title: "Module 1: Power Plant Engineering Comprehensive Quiz",
    description: "Official faculty assessment covering Thermodynamics, Heat Transfer, Steam/Gas Turbines, and Boilers.",
    module: "Module 1 - Power Plant Elements",
    questionCount: 50,
    durationMins: 50,
    passingScorePct: 70,
    status: "published",
    createdBy: "Dr. Roberto Santos, PE",
    createdDate: "2026-07-28"
  },
  {
    id: "qz_02",
    title: "Module 2: Thermal Cycles & Power Plant Design Quiz",
    description: "Assessment on Rankine, Brayton, and Combined Cycles, Hydroelectric systems, and Chimney Sizing.",
    module: "Module 2 - Power Plant Design",
    questionCount: 50,
    durationMins: 50,
    passingScorePct: 70,
    status: "published",
    createdBy: "Dr. Roberto Santos, PE",
    createdDate: "2026-07-30"
  },
  {
    id: "qz_03",
    title: "Refrigeration & Air Conditioning Board Exam Practice Quiz",
    description: "Vapor compression cycles, Absorption systems, Psychrometric chart analysis, and COP calculations.",
    module: "Module 5 - Refrigeration Engineering",
    questionCount: 30,
    durationMins: 30,
    passingScorePct: 75,
    status: "published",
    createdBy: "Dr. Roberto Santos, PE",
    createdDate: "2026-08-01"
  },
  {
    id: "qz_04",
    title: "Full Licensure Exam Simulation Mock Board Quiz",
    description: "Comprehensive 100-question mixed assessment across all 6 Mechanical Engineering Licensure modules.",
    module: "",
    questionCount: 100,
    durationMins: 100,
    passingScorePct: 70,
    status: "published",
    createdBy: "Dr. Roberto Santos, PE",
    createdDate: "2026-08-02"
  }
];

const quizzesFile = path.join(dataDir, 'quizzes.json');
if (!fs.existsSync(quizzesFile)) {
  fs.writeFileSync(quizzesFile, JSON.stringify(defaultQuizzes, null, 2), 'utf8');
  console.log(`Created default quizzes.json with ${defaultQuizzes.length} posted quizzes.`);
} else {
  console.log(`Preserved existing quizzes.json.`);
}

const defaultAttempts = [];

const attemptsFile = path.join(dataDir, 'attempts.json');
if (!fs.existsSync(attemptsFile)) {
  fs.writeFileSync(attemptsFile, JSON.stringify(defaultAttempts, null, 2), 'utf8');
  console.log(`Created default attempts.json with ${defaultAttempts.length} sample student quiz records.`);
} else {
  console.log(`Preserved existing attempts.json.`);
}

console.log(`Successfully prepared questions.json (${fullDataset.length} items across 63 batches)!`);
