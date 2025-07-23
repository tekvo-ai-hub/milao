# Milao – AI Speech Analysis App

Milao is a modern, privacy-first AI-powered speech analysis platform. Record or upload your speech, get instant feedback, track your progress, and improve your communication skills with real AssemblyAI insights.

---

## 🚀 Features

- 🎤 **Record or Upload Audio** – Fast, browser-based recording and upload
- 🤖 **AI Speech Analysis** – Powered by AssemblyAI (transcription, sentiment, topics, entities, content safety, etc.)
- 📊 **Detailed Dashboard** – See transcript, metrics, filler words, speaker breakdown, and more
- 🕒 **Recording History** – Review, search, and filter all your past sessions
- 👤 **User Preferences** – Personalize your experience and learning goals
- 🔒 **Privacy-First** – No voice or data stored without consent; real-time analysis
- 🦾 **Modern UI** – Built with React, Tailwind CSS, and shadcn/ui for a beautiful, responsive experience

---

## 🗂️ Folder Structure

```
voice-insight-guide/
├── public/                # Static assets (logos, images, videos)
├── src/
│   ├── pages/             # Main app pages (Landing, App, History, Dashboard, Auth, etc.)
│   ├── components/        # UI components, recorders, analysis, etc.
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Supabase client & types
│   ├── services/          # AI and analysis services
│   ├── utils/             # AssemblyAI, analysis, helpers
│   ├── types/             # TypeScript types
├── supabase/              # Edge functions, config, migrations
├── package.json, tailwind.config.ts, etc.
```

---

## ⚡ Getting Started

### 1. **Clone the Repo**
```sh
git clone https://github.com/yourusername/voice-insight-guide.git
cd voice-insight-guide
```

### 2. **Install Dependencies**
```sh
npm install
```

### 3. **Set Up Environment**
- Copy `.env.example` to `.env` and fill in your Supabase and AssemblyAI keys.
- Example:
  ```env
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  VITE_ASSEMBLYAI_API_KEY=...
  ```

### 4. **Run the App Locally**
```sh
npm run dev
```
Visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🧑‍💻 Usage

- **Landing Page:** Learn about Milao and get started
- **Sign Up / Sign In:** Create an account or log in
- **Main App:** Record/upload audio, analyze speech, view results
- **Dashboard:** See detailed analysis, transcript, metrics, filler words, speaker breakdown, and more
- **History:** Review and search all your past recordings
- **Preferences:** Set your learning goals and profile

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend:** Supabase (auth, storage, edge functions)
- **AI Analysis:** AssemblyAI

---

## 🤝 Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes first.

---

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.
