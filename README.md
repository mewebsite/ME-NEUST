# ME BoardPrep — Mechanical Engineering Licensure Exam Platform

[![Live on Firebase Hosting](https://img.shields.io/badge/Live-Firebase%20Hosting-FFA611?logo=firebase&logoColor=white)](https://me-neust-website-v2.web.app)
[![Firebase Project](https://img.shields.io/badge/Firebase-me--neust--website--v2-039BE5?logo=google-cloud&logoColor=white)](https://console.firebase.google.com/project/me-neust-website-v2/overview)
[![Questions](https://img.shields.io/badge/Question%20Bank-5%2C036%20Items-2ea44f)](https://me-neust-website-v2.web.app)

The official **Mechanical Engineering Licensure Examination & Review Question Bank Platform** for Nueva Ecija University of Science and Technology (NEUST). Designed for high-speed diagnostic assessment, faculty quiz management, simulated board exams, and comprehensive PRC licensure preparation.

🌐 **Official Secure Firebase URL**: [https://me-neust-website-v2.web.app](https://me-neust-website-v2.web.app)  
🔒 **Alternate Firebase Domain**: [https://me-neust-website-v2.firebaseapp.com](https://me-neust-website-v2.firebaseapp.com)

---

## 🛡️ Firebase Cloud & Security Architecture

The entire platform is hosted and secured end-to-end on Google Firebase:

| Property | Value |
| :--- | :--- |
| **Firebase Project Name** | `ME NEUST WEBSITE V2` |
| **Firebase Project ID** | `me-neust-website-v2` |
| **Firebase Project Number** | `358554783327` |
| **Web Hosting** | Firebase Hosting (`public/` isolated static bundle + HSTS/CSP headers) |
| **Authentication** | Firebase Authentication (`Email/Password` scrypt hashing + admin approval gate) |
| **Database Engine** | Cloud Firestore Standard Edition (`asia-east1`, `(default)`) |
| **Access Control** | Cloud Firestore Security Rules (`firestore.rules` RBAC, ownership, schema validation) |
| **Firebase Console** | [https://console.firebase.google.com/project/me-neust-website-v2/overview](https://console.firebase.google.com/project/me-neust-website-v2/overview) |

### Security Controls Enabled
* **Firebase Authentication**: All faculty administrators and students authenticate via Google Identity Toolkit (`Email/Password`). Zero plaintext passwords or hashes are stored in Firestore, client bundles, or `localStorage`.
* **Cloud Firestore Security Rules (`firestore.rules`)**:
  * **Strict RBAC & Ownership**: Students can only read/update their own profile fields (cannot self-promote `role` or `status`) and can only read/create their own immutable exam `attempts`. User enumeration (`list` on `/users`) is restricted strictly to active administrators.
  * **Admin-Only Mutations**: Creating, updating, or deleting `quizzes`, managing `users`, and modifying `questions` are enforced server-side for active administrators only.
  * **Authenticated Real-Time Sync**: Uses native Cloud Firestore `onSnapshot` listeners instead of third-party public MQTT brokers.
* **Hardened HTTP Security Headers (`firebase.json`)**: Enforces `Strict-Transport-Security` (HSTS preload), strict `Content-Security-Policy` (no `'unsafe-inline'` or `'unsafe-eval'` in `script-src`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.

---

## 🚀 Key Features

* **5,036 Curated & Solved Questions**: 3,105 Elements & Concept questions plus 1,931 PIPE calculation problems with governing formulas and step-by-step derivations across all 6 licensure modules.
* **Offline PWA Resilience**: Service Worker (`sw.js`) caches the compiled app shell and question bank for uninterrupted study.
* **Real-Time Cloud Synchronization**: Faculty-posted quizzes, student approvals, and exam attempts synchronize instantaneously across devices via Cloud Firestore.
* **Admin Control Panel**: Real-time student readiness analytics, pending registration approval queue, and quiz administration.

---

## 💻 Build & Deployment

```bash
# Compile production bundle and synchronize public/ directory
node scripts/build.js

# Deploy Hosting, Authentication, and Firestore Security Rules & Indexes
npx -y firebase-tools@latest deploy --only auth,firestore,hosting --project me-neust-website-v2
```
