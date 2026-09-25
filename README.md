# BidWave — Frontend
 
React + Vite client for **BidWave**, a real-time auction platform. Browse auctions publicly, log in to list items and create auctions, and watch bids update live on screen as other users bid — no page refresh, no polling.
 
> Backend repo: [bidwave-backend](#) — Spring Boot API this app talks to. *https://github.com/Sajannn-064/bidwave-backend.git* You'll need the backend running locally for this app to do anything beyond render empty pages.
 
---
 
## Table of Contents
 
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [How It Talks to the Backend](#how-it-talks-to-the-backend)
- [Real-Time Bidding](#real-time-bidding)
- [Known Limitations](#known-limitations)
- [License](#license)
---
 
## Features
 
- Public auction browsing — no login required to see what's active
- Register / login with JWT auth, persisted in `localStorage`
- Create item listings and auctions once logged in
- Live bidding — bids placed by any connected client update everyone's screen instantly, via WebSocket
- "My Items" / "My Auctions" views for a seller's own listings
## Tech Stack
 
- React (JavaScript) + Vite
- React Router
- Axios
- `@stomp/stompjs` + `sockjs-client` for WebSocket bidding
## Project Structure
 
```
bidwave-frontend/
├── .env.example
├── src/
│   ├── main.jsx           # wraps App in BrowserRouter
│   ├── App.jsx              # route definitions
│   ├── api/
│   │   └── axios.js         # pre-configured axios instance, JWT auto-attached via interceptor
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Auctions.jsx          # public auction browsing
│   │   ├── AuctionDetail.jsx     # live WebSocket bidding lives here
│   │   ├── CreateItem.jsx
│   │   ├── CreateAuction.jsx
│   │   ├── MyItems.jsx
│   │   └── MyAuctions.jsx
│   └── components/
│       └── Navbar.jsx
└── package.json
```
 
## Routes
 
| Path | Page | Auth required |
|---|---|---|
| `/` | Auctions — public browsing | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/auctions/:id` | AuctionDetail — live bidding | No to view, yes to bid |
| `/create-item` | CreateItem | Yes |
| `/create-auction` | CreateAuction | Yes |
| `/my-items` | MyItems | Yes |
| `/my-auctions` | MyAuctions | Yes |
 
## Prerequisites
 
| Tool | Version | Check with |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
 
You also need the [bidwave-backend](#) running locally (default `http://localhost:8080`) — this app has nothing to show without it.
 
## Getting Started
 
**1. Clone**
 
```bash
git clone https://github.com/<your-username>/bidwave-frontend.git
cd bidwave-frontend
```
 
**2. Configure the API URL**
 
```bash
cp .env.example .env
```
 
```
VITE_API_URL=http://localhost:8080
```
 
**3. Install and run**
 
```bash
npm install
npm run dev
```
 
The app starts on **`http://localhost:5173`**.
 
**4. Try it out**
 
1. Register a new account at `/register`
2. Log in
3. Create an item, then create an auction for it
4. Activate the auction (auctions start `PENDING` and must be explicitly set to `ACTIVE` before bidding works)
5. Open the auction in a second browser or incognito window, logged in as a different user, and place bids from both — watch the price update live on both screens
## How It Talks to the Backend
 
- `src/api/axios.js` is a pre-configured Axios instance pointed at `VITE_API_URL`; a request interceptor automatically attaches the stored JWT as `Authorization: Bearer <token>` on every call
- The JWT is stored in `localStorage` after login — simple, but XSS-vulnerable in theory; an accepted tradeoff for a student project, not a production pattern
- Login state across components (e.g. the Navbar) is synced via a custom `window.dispatchEvent(new Event('authChange'))` — a deliberately simple workaround rather than React Context, flagged as a known upgrade rather than the "most correct" long-term pattern
## Real-Time Bidding
 
`AuctionDetail.jsx` opens a STOMP-over-WebSocket connection (via `sockjs-client` + `@stomp/stompjs`) to the backend, authenticated with the same JWT as REST calls, passed as a query parameter on the handshake URL since browsers can't set custom headers on a raw WebSocket handshake. It subscribes to that auction's topic and sends bids without including a bidder id in the payload — the backend resolves who's bidding from the authenticated session, not from anything the client sends.
 
## Verification
 
This app has been verified through a proper local deployment against a live instance of the [backend](#) and a real local PostgreSQL database — not just component-level checks. That included registering and logging in as multiple separate users, creating items and auctions, activating an auction, and placing bids from two simultaneous browser sessions to confirm the live price updates arrived correctly on both screens in real time.
 
## Known Limitations
 
- No dedicated seller dashboard consolidating auction activation and item management into one view — auction activation is currently a control on the auction detail page
- No visual styling beyond the app's own design tokens — no component library
## License
 
Feel free to use it as a reference for your own learning.
 
