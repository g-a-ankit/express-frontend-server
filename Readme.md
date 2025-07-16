# 📦 express-frontend-server (for SPA)

A production-ready Express.js server to serve a single-page React application with:

- 🗂 Static file caching with long-term headers
- 🔐 Secure HTTP headers using Helmet
- 📉 Gzip/Brotli compression
- 🧠 Client-side telemetry logging
- ⚠️ Rate limiting for log ingestion
- 🪵 Daily rotated logs using Winston

---

## 🚀 Features

| Feature                | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| ✅ SPA Routing Support | Serves `index.html` for all unknown routes                   |
| ✅ Asset Caching       | Static assets served with `Cache-Control: immutable` headers |
| ✅ Compression         | Uses `compression()` middleware for gzip/brotli              |
| ✅ Security Headers    | `helmet` with `x-frame-options`, CSP optional                |
| ✅ Logging             | Winston-based log management with daily rotation             |
| ✅ Telemetry API       | `/telemetry` endpoint to collect client-side logs            |
| ✅ Rate Limiting       | Prevent spam logs with IP-based rate limiting                |

---

## 🛠 Setup

### 1. Install dependencies

```bash
yarn install
```

### 2. Folder structure

project/
│
├── spa/ # React app build output
│ ├── index.html
│ └── assets/
│ └── _.js, _.css
│
├── logs/ # Rotated logs are saved here
│
└── server.js # Express server

### 3. Run the server

```bash
yarn start
```

### 4. Telemetry logging

POST /telemetry
Content-Type: application/json

example payload

```json
{
  "error": "Uncaught ReferenceError: x is not defined",
  "stack": "at App.js:42:10",
  "url": "/dashboard"
}
```

These logs will be:

- Printed to console
- Written to telemetry.log
- Rotated daily in logs/telemetry-YYYY-MM-DD.log

The /telemetry route is rate limited to: 10 requests per IP per minute

Adjustable in server.js via:

```javascript
const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
```
