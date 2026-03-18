<p align="center">
  <img src="public/favicon.ico" width="64" height="64" alt="arura" />
</p>

<h1 align="center">arura</h1>

<p align="center">
  <strong>Everything burns.</strong><br />
  A social platform where moments are ephemeral, connections are real, and nothing lasts forever.
</p>

<p align="center">
  <a href="https://arura.lovable.app">🔥 Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Get Started</a> •
  <a href="#contributing">Contribute</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-early%20access-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/PWA-installable-green?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square" />
</p>

---

## 🔥 What is arura?

**arura** is a counter-culture social app built on one radical idea: **nothing should last forever.**

Drop 5-second **Signals** — photos, videos, or voice — that vanish in 2 hours. No likes. No follower counts. No algorithm. Just raw, unfiltered moments with the people who actually matter.

> Social media is broken. We're not fixing it — we're burning it down and starting fresh.

---

## ✨ Features

| Feature | Description |
|---|---|
| **⏱ Ephemeral Signals** | 5-second captures that self-destruct in 2 hours |
| **🔥 Heat System** | Engagement fuels heat: match → spark → flame → ⭐ star |
| **💬 One-Word DMs** | Messages are 12 characters max. Say everything in a single word |
| **🧵 Stitch** | Double-tap any signal to overlay your word on someone's moment |
| **👥 Embers & Aura** | Follow = Ignite. Mutual = Sparked. Connections ranked by aura score |
| **🎯 Vibe Matching** | Choose from 400+ vibes to find your people |
| **📱 PWA** | Installable on any device — no app store needed |
| **🔔 Push Notifications** | Real-time engagement alerts via Web Push |
| **💰 Creator Earnings** | Revenue sharing through Stripe Connect |
| **🛡 Safety** | Report/block system with admin moderation dashboard |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Framer Motion, shadcn/ui |
| **Backend** | Supabase (Auth, Postgres, Edge Functions, Realtime, Storage) |
| **Payments** | Stripe (Subscriptions, Connect, Webhooks) |
| **PWA** | Vite PWA Plugin, Service Workers, Web Push API |
| **Testing** | Vitest, Playwright, Testing Library |

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── feed/            # Signal feed player, heat badges, stitch overlay
│   ├── onboarding/      # Interactive tutorial demos
│   └── ui/              # shadcn/ui design system
├── hooks/               # Custom React hooks (auth, camera, haptics, etc.)
├── pages/               # Route pages
├── lib/                 # Utilities, types, vibes data
└── integrations/        # Supabase client & types

supabase/
├── functions/           # Edge functions (Stripe, push, AI, cleanup)
└── config.toml          # Supabase project config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or use Lovable Cloud)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/arura.git
cd arura

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Start dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |

---

## 🤝 Contributing

We'd love your help making arura better. Here's how:

1. **Fork** this repo
2. **Create a branch** (`git checkout -b feature/your-idea`)
3. **Commit** your changes (`git commit -m 'Add: your feature'`)
4. **Push** to your branch (`git push origin feature/your-idea`)
5. **Open a Pull Request**

### Good First Issues

- [ ] Add haptic feedback patterns for different heat levels
- [ ] Improve accessibility (screen reader support for signal player)
- [ ] Add i18n / multi-language support
- [ ] Create a dark/light theme toggle
- [ ] Improve offline experience with better caching strategies

---

## 🗺 Roadmap

- [x] Core signal loop (drop → watch → engage)
- [x] Heat system with 4 tiers
- [x] One-word DMs
- [x] Stitch overlay
- [x] PWA with push notifications
- [x] Creator monetization via Stripe
- [x] Admin moderation dashboard
- [ ] Voice signals with waveform visualization
- [ ] Group signals (collaborative burns)
- [ ] AR filters for signal capture
- [ ] End-to-end encrypted DMs
- [ ] Native mobile apps (Capacitor)

---

## 💡 Philosophy

Traditional social media optimizes for **time spent**. arura optimizes for **moments felt**.

- **No infinite scroll** — signals are finite and expire
- **No vanity metrics** — heat measures collective energy, not individual ego
- **No algorithm** — your feed is chronological + engagement-ranked
- **No permanence** — everything burns, so make it count

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>🔥 Everything burns. Make it count.</strong>
</p>

<p align="center">
  <a href="https://arura.lovable.app">Try arura</a> •
  <a href="https://github.com/YOUR_USERNAME/arura/issues">Report Bug</a> •
  <a href="https://github.com/YOUR_USERNAME/arura/discussions">Discussions</a>
</p>
