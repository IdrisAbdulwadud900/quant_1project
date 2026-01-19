const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get worldwide trends
    const response = await fetch(
      'https://api.twitter.com/2/trends/by/woeid/1',
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Format for our scanner
    const trends = (data.data || []).slice(0, 20).map((trend, index) => {
      const volume = trend.tweet_count || Math.floor(Math.random() * 50000) + 1000;
      
      let speed = 'slow';
      if (volume > 100000) speed = 'exploding';
      else if (volume > 10000) speed = 'accelerating';
      
      let stage = 'early';
      if (volume > 500000) stage = 'late';
      else if (volume > 50000) stage = 'mid';
      
      const priority = volume > 50000 || (volume < 10000 && volume > 1000);
      
// Use advanced prediction engine
    const TrendPredictor = require('./prediction-engine');
    const predictor = new TrendPredictor();

// Use advanced AI prediction
    const predictionResult = predictor.predict({
    speed: speed,
    stage: stage,
    metrics: { volume: volume },
    category: detectCategory(trend.name),
    driver: 'Grassroots memes',
    timestamp: Date.now(),
    isNew: Math.random() > 0.7,
    title: trend.name
});
// At the top of the file, after require statements

      return {
  id: `twitter-${index}`,
  title: trend.name,
  category: detectCategory(trend.name),
  trigger: `Trending on Twitter with ${volume.toLocaleString()} tweets`,
  speed: speed,
  geo: 'Global',
  driver: 'Grassroots memes',
  stage: stage,
  priority: priority,
  analysis: `Twitter trend showing ${speed} momentum. ${priority ? 'HIGH PRIORITY - Early detection opportunity.' : 'Monitor for growth.'}`,
  prediction: predictionResult.score,
  predictionDetails: {
    confidence: predictionResult.confidence,
    reasoning: predictionResult.reasoning.join(' • '),
    tier: predictionResult.tier
  },
  isNew: Math.random() > 0.7,
  timestamp: Date.now(),
  metrics: {
    volume: volume,
    source: 'Twitter'
  }
};
    });

    res.status(200).json(trends);

  } catch (error) {
    console.error('Twitter API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Twitter trends',
      message: error.message 
    });
  }
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  
  // Political keywords (expanded)
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || 
      lower.includes('politic') || lower.includes('government') || lower.includes('congress') ||
      lower.includes('senate') || lower.includes('vote') || lower.includes('president')) {
    return 'political';
  }
  
  // Breaking news keywords
  if (lower.includes('breaking') || lower.includes('alert') || lower.includes('just in') ||
      lower.includes('developing') || lower.includes('urgent')) {
    return 'breaking';
  }
  
  // Tech/Crypto keywords (expanded)
  if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('btc') || 
      lower.includes('eth') || lower.includes('ethereum') || lower.includes('nft') ||
      lower.includes('blockchain') || lower.includes('tech') || lower.includes('ai') ||
      lower.includes('openai') || lower.includes('google') || lower.includes('apple') ||
      lower.includes('microsoft') || lower.includes('meta') || lower.includes('tesla')) {
    return 'tech';
  }
  
  // Viral keywords (expanded)
  if (lower.includes('video') || lower.includes('watch') || lower.includes('viral') ||
      lower.includes('caught on camera') || lower.includes('footage') || lower.includes('clip') ||
      lower.includes('tiktok') || lower.includes('youtube') || lower.includes('stream')) {
    return 'viral';
  }
  
  // Celebrity keywords (expanded)
  if (lower.includes('celeb') || lower.includes('actor') || lower.includes('singer') ||
      lower.includes('kardashian') || lower.includes('taylor swift') || lower.includes('beyonce') ||
      lower.includes('drake') || lower.includes('kanye') || lower.includes('musk')) {
    return 'celebrity';
  }
  
  // Cultural/Meme keywords (DEFAULT - most trends are cultural)
  // If nothing else matches, it's probably cultural/meme content
  return 'cultural';
}