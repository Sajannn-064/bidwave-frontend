# BidWave — Backend

Spring Boot backend for **BidWave**, a real-time auction platform. Handles authentication, item/auction/bid management, and live bidding over WebSocket — with all identity (who's bidding, who's selling) resolved server-side from a verified JWT, never trusted from client input.

> Frontend repo: [bidwave-frontend](#) — a React + Vite client that consumes this API. *https://github.com/Sajannn-064/bidwave-backend.git*

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Overview](#api-overview)
- [Real-Time Bidding (WebSocket)](#real-time-bidding-websocket)
- [Authentication Flow](#authentication-flow)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Features

- JWT-based registration and login
- Item listings tied to the authenticated seller
- Auctions with an explicit lifecycle (`PENDING → ACTIVE → CLOSED`), auto-expired on schedule
- Live bidding over WebSocket/STOMP — every subscribed client gets the new price instantly
- Server-side identity enforcement on every write — bidder/seller id is always derived from the JWT `Principal`, never from a request body field
- Password hashes never leak into API responses (`@JsonIgnore` on `User.password`)

## Tech Stack

- Java, Spring Boot
- Spring Security + JWT (`jjwt`)
- Spring Data JPA / Hibernate
- WebSocket + STOMP (`spring-websocket`)
- PostgreSQL
- Lombok
- Maven

## Architecture

```
Client (REST, JWT in header)  ───────▶  Controllers ──▶ Services ──▶ Repositories ──▶ PostgreSQL
Client (WebSocket, JWT in ?token=)  ──▶  Handshake auth ──▶ @MessageMapping ──▶ Services ──▶ broadcast
```

**Two separate identity paths, one rule:** REST requests are authenticated per-request by `JwtAuthFilter`, which populates `SecurityContextHolder` so `Principal` is available in any controller method. WebSocket connections are authenticated once, at the HTTP handshake, by a custom `HandshakeInterceptor` + `DefaultHandshakeHandler` pair, because a WebSocket session carries many messages over one connection and identity has to be bound to the *session*, not re-derived per message. Both paths converge on the same rule: nothing trusts a client-supplied `sellerId`/`bidderId` — everything is derived from the verified token.

Auctions are not immediately biddable on creation — they start `PENDING` and must be explicitly moved to `ACTIVE`, and a scheduled task (`AuctionScheduler`, `@Scheduled(fixedRate = ...)`) automatically closes them once they expire.

## Project Structure

```
bidwave-backend/
├── src/main/java/.../bidwave/
│   ├── models/          # User, Item, Auction, Bid, Notification (JPA entities)
│   ├── repositories/    # Spring Data JPA repositories
│   ├── services/        # AuthService, ItemService, AuctionService, BidService, NotificationService
│   ├── controllers/     # AuthController, ItemController, AuctionController, BidController, UserController, BidWebSocketController
│   ├── dto/               # AuthRequest, RegisterRequest, ItemRequest, BidRequest, AuctionRequest...
│   ├── config/            # JwtUtil, JwtAuthFilter, SecurityConfig, WebSocketConfig, JwtHandshakeInterceptor, JwtHandshakeHandler
│   └── scheduler/         # AuctionScheduler
├── src/main/resources/
│   └── application.properties.example   # copy to application.properties and fill in your own DB creds
└── pom.xml
```

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Java (JDK) | 17+ | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| PostgreSQL | 14+ | `psql --version` |
| Git | any recent | `git --version` |

## Getting Started

**1. Clone**

```bash
git clone https://github.com/<your-username>/bidwave-backend.git
cd bidwave-backend
```

**2. Create the database**

```bash
psql postgres
```
```sql
CREATE DATABASE bidwave;
CREATE USER bidwave_user WITH PASSWORD 'choose_a_password';
GRANT ALL PRIVILEGES ON DATABASE bidwave TO bidwave_user;
```

**3. Configure application properties**

`application.properties` is gitignored (it holds real DB credentials and a JWT secret) — copy the example and fill in your own values:

```bash
cd src/main/resources
cp application.properties.example application.properties
```

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/bidwave
spring.datasource.username=bidwave_user
spring.datasource.password=choose_a_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

jwt.secret=replace-with-a-long-random-string
jwt.expiration=86400000
```

**4. Build and run**

```bash
mvn clean install
mvn spring-boot:run
```

The API starts on **`http://localhost:8080`**. Confirm it's up:

```bash
curl http://localhost:8080/api/auctions/active
```
An empty array (`[]`) back means it's working — there's just no data yet.

**5. CORS**

If you're pointing a frontend at this API from somewhere other than `localhost:5173`, add that origin in `SecurityConfig`'s `corsConfigurationSource()` bean.

## API Overview

All endpoints are prefixed with `/api`. Endpoints not marked public require `Authorization: Bearer <jwt>`.

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a new user account |
| POST | `/auth/login` | Public | Log in, returns a JWT |
| GET | `/users/me` | Yes | Get the currently logged-in user's own record |
| GET | `/users/{id}` | Yes | Get a user by id |
| POST | `/items` | Yes | Create an item (seller derived from JWT) |
| GET | `/items/seller/{sellerId}` | Yes | Get all items for a seller |
| POST | `/auctions` | Yes | Create an auction for an item |
| GET | `/auctions/active` | Public | List all active auctions |
| GET | `/auctions/{id}` | Public | Get a single auction |
| PUT | `/auctions/{id}/status` | Yes | Change an auction's status (e.g. activate it) |
| GET | `/bids/auction/{id}` | Public | Get bid history for an auction |

Bids themselves are placed over WebSocket, not REST — see below.

## Real-Time Bidding (WebSocket)

1. Client connects to `ws://localhost:8080/ws?token=<jwt>` (SockJS fallback supported)
2. Client subscribes to `/topic/auction.{auctionId}`
3. Client sends a bid to `/app/bid.place` with the auction id and amount only — no bidder id, since the server resolves the bidder from the authenticated session
4. Server validates (auction must be `ACTIVE`, not expired, amount must exceed current price, seller can't bid on their own auction), persists the bid, and broadcasts the new price to `/topic/auction.{auctionId}`

**Why the token is a query parameter:** browsers can't attach custom headers to a raw WebSocket handshake, so the JWT travels as `?token=` on the handshake URL and is validated in `beforeHandshake()`.

**Why identity is bound at the handshake, not per message:** attaching identity at the message level (e.g. `accessor.setUser()` inside a `ChannelInterceptor`) only sticks it to that one message — the next message on the same connection has no memory of it, which surfaces as `NullPointerException: principal is null`. The fix is a `HandshakeInterceptor` that reads and validates the JWT during the plain HTTP handshake, paired with a `DefaultHandshakeHandler.determineUser()` override that attaches the resulting `Principal` to the *session* itself.

## Authentication Flow

1. `POST /api/auth/register` → creates a user, password hashed, never returned in any response
2. `POST /api/auth/login` → verifies credentials, returns a JWT containing username, issued-at, and expiry only — no user id or password in the payload
3. Every REST request after that sends `Authorization: Bearer <token>`; `JwtAuthFilter` validates it and populates `SecurityContextHolder`
4. WebSocket connections authenticate the same JWT via the handshake interceptor instead of a per-request filter

## Verification

Every part of this backend has been verified through a proper local deployment rather than isolated unit tests — the full stack (this API + the [frontend](#)) running together against a real local PostgreSQL database. That included the entire auth flow end to end, all REST endpoints, and live WebSocket bidding tested with multiple logged-in users in separate browser sessions bidding concurrently on the same auction and confirming the broadcast price updated correctly on every screen.

## Known Limitations

- No automated test suite (e.g. JUnit/Mockito) — correctness was confirmed through full local deployment testing instead
- Not yet deployed to a public host (target: Render)

## License

Feel free to use it as a reference for your own learning.
