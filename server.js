// importing dependencies
const express = require("express");
var path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const winston = require("winston");
const rateLimit = require("express-rate-limit");
const DailyRotateFile = require("winston-daily-rotate-file");

const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 logs per minute per IP
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "telemetry.log" }),
    new winston.transports.Console(),
  ],
});

logger.add(
  new DailyRotateFile({
    filename: "logs/telemetry-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "60d",
  })
);

// starting express app
const app = express();
app.use(express.json());

//  set port
const PORT = 5100;

const CODE_FILES_ROUTE = "/assets";
const CODE_DIR_PATH = path.join(__dirname, "dist", "assets");
const INDEX_HTML_FILE_PATH = path.join(__dirname, "dist", "index.html");
const TELEMETRY_ROUTE = "/telemetry";

// Helmet base
app.use(
  helmet({
    contentSecurityPolicy: false, // ⛔️ disables CSP only
  })
);

// Add CSP (customize domains as per your app)
// use CSP evaluator (https://csp-evaluator.withgoogle.com/) for checking strength
// app.use(
//   helmet.contentSecurityPolicy({
//     useDefaults: true,
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "https://cdn.example.com"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       imgSrc: ["'self'", "https://cdn.example.com", "data:"],
//       fontSrc: ["'self'", "https://fonts.gstatic.com"],
//       connectSrc: ["'self'", "https://api.example.com"],
//       frameAncestors: ["'none'"], // This replaces X-Frame-Options (modern)
//       objectSrc: ["'none'"],
//       upgradeInsecureRequests: [],
//     },
//   })
// );

// Set X-Frame-Options (legacy support)
app.use(
  helmet.frameguard({
    action: "deny", // Or "sameorigin" if embedding your own site
  })
);

// By default, Express sets the following HTTP response header:
// X-Powered-By: Express
// below line prevents this header
app.disable("x-powered-by");

// enable compress for files like js, css, html
// browser will send header with the encoding that it supports
// ex: accept-encoding: gzip, deflate, br, zstd
// compression will be decided based on this header
app.use(compression());

// telemetry path to log errors on client-side
app.post(TELEMETRY_ROUTE, telemetryLimiter, (req, res) => {
  const telemetryLog = req.body;
  logger.info({ telemetry: telemetryLog });
  res.status(204).send();
});

// caching for /assets path is enabled, (this works because the build files has
// content-hash or cache-busting hash in file name)
app.use(
  CODE_FILES_ROUTE,
  express.static(CODE_DIR_PATH, {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);

app.get("*", function (req, resp) {
  resp.sendFile(INDEX_HTML_FILE_PATH);
});

//Starting server on PORT
app.listen(PORT, () => {
  console.log(`Server started! on ${PORT}`);
});
