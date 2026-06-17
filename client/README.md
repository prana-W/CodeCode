# CodeCode — Frontend Application

A lightning-fast, highly interactive single-page application (SPA) built for competitive programmers. The frontend is designed to provide a seamless, real-time experience without any manual polling, utilizing modern React patterns and a beautiful, accessible UI.

---

## ⚡ Features

### Real-Time WebSocket Architecture

- **Zero Polling**: Replaced all traditional `setInterval` HTTP polling with a persistent `socket.io-client` connection.
- **Instant Verdicts**: As soon as a background worker (running in Docker) completes code compilation or execution, the backend emits the verdict to the user's private socket room. The UI updates instantly via `useEffect` listeners.
- **Live User Tracking**: The total number of online users is broadcasted via sockets (`live_users_update`), removing the need for `/users/heartbeat` REST endpoints entirely.

### Inbuilt Code Editor & Templates

- **Monaco Editor Integration**: Features a VS Code-like coding experience powered by `@monaco-editor/react`.
- **Anti-Cheat Measures**: The editor heavily restricts external copy/pasting. Users are forced to rely on their pre-saved templates or write code manually during active contests.
- **Template Management**: Users can pre-define boilerplate code per language (C++, Java, Python, etc.) which is automatically loaded into the editor. Editing templates is locked during active contests.

### Dynamic User Analytics

- **Activity Heatmap**: A GitHub-style contribution graph visualizes the user's daily submission activity over the year.
- **Rating Trajectory**: An interactive line chart plots the user's Elo rating history across all participated contests.

### Modern Design Aesthetics

- **Dark Mode First**: Implemented using `next-themes` and Tailwind CSS, featuring glassmorphism, subtle micro-animations, and a highly polished developer-focused aesthetic.
- **Accessible Components**: Built on top of Radix UI primitives, ensuring screen-reader accessibility and standard keyboard navigation.

---

## 🔐 Authentication Flow

The app uses a **dual-token, cookie-based authentication** strategy. No tokens or user data are stored in `localStorage`.

### Tokens

| Cookie         | Lifetime  | What it does                                                                   |
| -------------- | --------- | ------------------------------------------------------------------------------ |
| `accessToken`  | 5 minutes | Short-lived JWT; verified by every protected API route                         |
| `refreshToken` | 7 days    | Opaque random token stored in the DB; used to silently issue new access tokens |

Both cookies are `httpOnly`, `secure`, and `sameSite: none` — JavaScript cannot read them, eliminating XSS token theft.

### Lifecycle

```
[Page load / refresh]
  AuthContext mounts → GET /users/me (cookie sent automatically)
    ✓ valid accessToken  → user state hydrated, authLoading = false
    ✗ expired accessToken → Axios interceptor calls POST /auth/refresh first,
                             retries /users/me → user state hydrated
    ✗ no session at all  → user = null → redirect to /login

[Every API request]
  accessToken cookie attached automatically by the browser
    ✓ valid  → request succeeds
    ✗ expired (401 "Access token has expired.") →
        Axios interceptor fires:
          1. Queues any other concurrent requests
          2. Calls POST /auth/refresh (sends refreshToken cookie)
          3a. Success → new accessToken + rotated refreshToken set in cookies
                       → original request retried transparently (user sees nothing)
          3b. Failure → forceLogout() called → user state cleared → redirect to /login

[Logout]
  POST /auth/logout → server nulls refresh_token in DB, clears both cookies
  setUser(null) → React state cleared, user redirected to /login
```

### Key files

| File                      | Responsibility                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `context/AuthContext.jsx` | Holds `user` state; hydrates from `GET /users/me` on mount; exposes `login`, `logout`, `authLoading` |
| `lib/axios.js`            | Axios instance with a response interceptor for silent token refresh and forced logout                |
| `App.jsx`                 | `ProtectedRoute` / `AdminRoute` wait for `authLoading` before redirecting                            |

| Package                    | Role                 | Why it's used                                                                                                                                                                              |
| :------------------------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`react` + `vite`**       | Core framework       | Lightning-fast HMR and optimized production builds.                                                                                                                                        |
| **`tailwindcss`**          | Styling engine       | Utility-first CSS for rapid, responsive, and consistent UI design.                                                                                                                         |
| **`radix-ui`**             | Component primitives | Unstyled, accessible components (Tabs, Select, Dialogs) that we style with Tailwind.                                                                                                       |
| **`@monaco-editor/react`** | Code editor          | Provides a robust, syntax-highlighted IDE experience directly in the browser.                                                                                                              |
| **`socket.io-client`**     | Real-time events     | Listens to backend Pub/Sub events for instant submission verdicts and live user counts without HTTP polling.                                                                               |
| **`recharts`**             | Data visualization   | Renders the complex SVG charts for Elo rating graphs and activity heatmaps.                                                                                                                |
| **`@uiw/react-md-editor`** | Markdown rendering   | Safely and beautifully renders problem statements, AI hint outputs, and explanations.                                                                                                      |
| **`axios`**                | HTTP Client          | Configured with `withCredentials: true` to send `httpOnly` JWT cookies automatically. A response interceptor silently refreshes the `accessToken` on 401 and retries the original request. |
| **`sonner`**               | Toast notifications  | Beautiful, swipeable, and highly customizable toast alerts for async actions.                                                                                                              |
| **`react-router-dom`**     | Routing              | Client-side routing with nested layouts and route protection.                                                                                                                              |
| **`lucide-react`**         | Iconography          | Clean, consistent SVG icons utilized throughout the platform.                                                                                                                              |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+

### Installation & Running

1. **Environment Variables**:
   Copy the provided `.env.sample` file to `.env`:

    ```bash
    cp .env.sample .env
    ```

    Ensure `VITE_API_BASE_URL` points to your backend URL (usually `http://localhost:8000/api/v1`).

2. **Install Dependencies**:

    ```bash
    npm install
    ```

3. **Start Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 📂 Project Structure (summary)

```
client/
├── src/
│   ├── components/      # Reusable UI components (buttons, dialogs, charts)
│   ├── context/         # React Contexts (AuthContext, SocketContext)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Route views (Home, Profile, Contest Arena, Custom Invocation)
│   ├── utils/           # Helper functions, error formatting
│   ├── App.jsx          # Route definitions
│   └── main.jsx         # Entry point, Context providers
├── package.json
└── vite.config.js
```
