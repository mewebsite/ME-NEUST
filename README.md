# ME BoardPrep — Mechanical Engineering Licensure Exam Platform

[![Deploy to GitHub Pages](https://github.com/mewebsite/ME-NEUST/actions/workflows/deploy.yml/badge.svg)](https://github.com/mewebsite/ME-NEUST/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Live-GitHub%20Pages-2ea44f)](https://mewebsite.github.io/ME-NEUST/)
[![Firebase](https://img.shields.io/badge/Firebase-me--neust--website--v2-FFA611?logo=firebase&logoColor=white)](https://console.firebase.google.com/project/me-neust-website-v2/firestore)
[![Questions](https://img.shields.io/badge/Question%20Bank-3%2C105%20Items-blue)](./QuestionBank_Reviewed.csv)

The official **Mechanical Engineering Licensure Examination & Review Question Bank Platform** for Nueva Ecija University of Science and Technology (NEUST). Designed for high-speed diagnostic assessment, faculty quiz management, simulated board exams, and comprehensive PRC licensure preparation.

🌐 **Live Application URL**: [https://mewebsite.github.io/ME-NEUST/](https://mewebsite.github.io/ME-NEUST/)

---

## ☁️ Firebase Cloud Database

The application is powered by Google Firebase and Cloud Firestore:

| Property | Value |
| :--- | :--- |
| **Firebase Project Name** | `ME NEUST WEBSITE V2` |
| **Firebase Project ID** | `me-neust-website-v2` |
| **Firebase Project Number** | `358554783327` |
| **Database Engine** | Cloud Firestore (`(default)`) |
| **Firebase Console** | [https://console.firebase.google.com/project/me-neust-website-v2/overview](https://console.firebase.google.com/project/me-neust-website-v2/overview) |
| **Firestore Data Viewer** | [https://console.firebase.google.com/project/me-neust-website-v2/firestore/databases/-default-/data](https://console.firebase.google.com/project/me-neust-website-v2/firestore/databases/-default-/data) |

### Database Collections Schema

* **`questions`**: Contains **3,105 reviewed exam questions** across 6 licensure modules with full explanations, difficulty calibration, learning outcomes, and textbook citations.
* **`users`**: Secure account management for faculty administrators and student examinees.
* **`quizzes`**: Faculty-published assessments, diagnostic benchmarks, and mock board exams.
* **`attempts`**: Real-time student exam submissions, scores, question-by-question responses, and timestamp logs.

---

## 🚀 Key Features

* **3,105 Questions Curated & Calibrated**: Categorized into Power Plant Elements, Power Plant Design, Industrial Plant Engineering, Industrial Plant Design, Refrigeration Engineering, and Air Conditioning.
* **100% Offline Capability**: Uses Service Worker (`sw.js`) and pre-bundled client datasets to ensure students can take exams even without internet access or when the host server is offline.
* **Real-Time Cloud Synchronization**: The client-side engine automatically synchronizes student quiz results and performance scores directly with Cloud Firestore in real time.
* **Adaptive Responsive UI**: Built-in viewing modes optimized for both mobile phones and desktop laptops.
* **Admin Control Panel**: Real-time inspection of student quiz attempts, score analytics, and question bank administration.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: React 18 (Pre-compiled production bundle), Vanilla CSS responsive design system.
* **Static Serverless Engine**: `static-engine.js` with direct Google Cloud Firestore REST API integration.
* **Hosting**: GitHub Pages via automated GitHub Actions CI/CD pipeline (`.github/workflows/deploy.yml`).
* **Service Worker**: PWA caching layer with automated cache-busting versioning.

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/mewebsite/ME-NEUST.git
cd ME-NEUST

# Install dependencies
npm install

# Start local server
npm start

# Recompile bundle and synchronize assets
node scripts/build.js
```
