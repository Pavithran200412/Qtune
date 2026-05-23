# SoundSphere AI 🔮
> A premium, full-stack, AI-powered Music Streaming & Recommendation Platform integrated with the Spotify Web API.

SoundSphere AI blends sleek glassmorphic UI/UX with professional music services, intelligent mood/prompt playlist compiling, real-time social interactive channels, and responsive Canvas audio wave visualizers.

---

## 🚀 Key Features

* **Multilingual Music Catalog**: Stream, search, and manage songs across Tamil, Hindi, English, K-Pop, Lo-Fi, and podcasts.
* **Spotify API Integration**: Search tracks, pull artist details, discover audio feature profiles (energy, danceability, valence), and fetch recommendations.
* **Out-of-the-Box Mock Mode**: Automatically falls back to a custom mock catalog with fully functioning music players and vector profiles if Spotify API tokens are dummy/expired!
* **AI Mood & Playlist Compiler**: Parses complex natural language prompts (e.g. *"late night coding focus lo-fi"* or *"high energy Tamil gym workout"*) using a hybrid local semantic/NLP parser or a Gemini API REST client.
* **Live Interactive Stream**: Write comments, react with emojis, and watch animated **flying emoji reactions** float up in real-time on everyone's screens via Socket.io!
* **Web Audio Waveform Visualizer**: Draws double-sided mirrored, live frequency-bar equalizer streams on an HTML Canvas directly responding to the playing preview clip.
* **Interactive SVG Recommendation Graph**: Generates a solar-like vector map of recommended songs orbiting the active track, complete with acoustic profile grids.
* **Statistical Insights Dashboard**: Visualize custom listening profiles (average acousticness, valence, danceability) and language demographics using pure responsive SVG donut and bar graphs.

---

## 🛠️ Technology Stack

### Backend Gateway
* **Node.js & Express.js**: Modular MVC router and controller setup.
* **Socket.io**: WebSockets for real-time comment synchronization and active reaction broadcasts.
* **Mongoose & MongoDB**: Persistent databases storing users, cached tracks, history, likes, and playlists.
* **JWT & bcryptjs**: Secure hashing and token-based protected endpoints.

### Frontend Client
* **Vite + React.js**: Lightweight scaffolding and fast build bundlings.
* **Tailwind CSS v4**: CSS-first layout compiling with native grid systems.
* **Framer Motion**: Smooth transition physics and onboarding slides.
* **Web Audio API**: Pipe media streams directly to an `AnalyserNode` for custom rendering canvas visualizers.
* **Axios**: HTTP call connectors.

---

## 📂 Repository Architecture

```
Music/
├── backend/
│   ├── config/          # Configurations
│   ├── controllers/     # MVC Request Controllers (Auth, Music, Playlists, AI, Social)
│   ├── middleware/      # JWT Route Protections
│   ├── models/          # Mongoose Database Schemas (User, Song, Playlist, Comments, etc.)
│   ├── routes/          # Express API Gateways
│   ├── utils/           # Spotify API Token swap client & NLP semantic compilers
│   └── server.js        # Express startup & Socket.io broadcasters
└── frontend/
    ├── src/
    │   ├── components/  # Nav, Sidebar, Waveform, Recommendation SVG, Comment Feeds
    │   ├── context/     # AuthContext, ThemeContext, AudioContext (Queue / Web Audio)
    │   ├── pages/       # Landing, Search, AI Compilers, Insights, Libraries, Login
    │   ├── styles/      # Global index.css configurations
    │   └── main.jsx     # Scaffolder React entrypoint
    └── vite.config.js   # Tailwind v4 plugin & Backend API proxier configuration
```

---

## 📦 Setup & Initialization

### 1. MongoDB Database Connection
Ensure your MongoDB service is running locally (`mongodb://127.0.0.1:27017`) or configure an Atlas cluster link.

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Configure your environmental settings by updating `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/soundsphere
   JWT_SECRET=your_jwt_secret_key_string
   SPOTIFY_CLIENT_ID=your_spotify_developer_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_developer_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:5000/api/auth/spotify/callback
   GEMINI_API_KEY=your_optional_gemini_api_key
   ```
   > [!NOTE]
   > SoundSphere AI functions 100% out-of-the-box in **Mock Mode** if you do not have Spotify/Gemini keys ready.
3. Install packages and start the gateway:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install packages and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`.

---

## 🔍 Verification & Integrity Controls

* **Auto Proxy**: Vite will automatically proxy API calls from `http://localhost:3000/api/*` to `http://localhost:5000/api/*`, resolving CORS blocks.
* **CORS Support**: Howler and Canvas visualizers incorporate `crossOrigin = "anonymous"` headers so browser audio decoding works without security errors.
* **Token Checks**: The Express gateway automatically intercepts user calls, inspects the saved Spotify Token expiry, and triggers an automated token refresh background flow!
