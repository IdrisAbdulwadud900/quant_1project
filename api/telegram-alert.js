const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { trend } = req.body;
    
    if (!trend) {
      return res.status(400).json({ error: 'No trend provided' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(200).json({ success: false, message: 'Telegram not configured' });
    }

    const message = `
🚨 HIGH PRIORITY TREND ALERT

<b>${trend.title}</b>

📊 Prediction: ${trend.prediction}% explosion probability
⚡ Speed: ${trend.speed.toUpperCase()}
📍 Stage: ${trend.stage.toUpperCase()}
🌍 Location: ${trend.geo}

💡 <b>Why spreading:</b>
${trend.trigger}

🎯 <b>Analysis:</b>
${trend.analysis}

📈 Volume: ${trend.metrics?.volume?.toLocaleString() || 'N/A'}
📱 Source: ${trend.metrics?.source || 'Multiple'}

⏰ ${new Date().toLocaleTimeString()}
`.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    const data = await response.json();

    if (data.ok) {
      res.status(200).json({ success: true });
    } else {
      throw new Error(data.description);
    }

  } catch (error) {
    console.error('Telegram Error:', error);
    res.status(500).json({ error: error.message });
  }
};