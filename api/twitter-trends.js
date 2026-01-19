const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Use Twitter API v2 - Search for trending topics
    const queries = [
      'lang:en -is:retweet (trending OR viral OR breaking)',
      'lang:en -is:retweet (#Bitcoin OR #Crypto OR #NFT)',
      'lang:en -is:retweet (#Trump OR #Biden OR #Election)',
      'lang:en -is:retweet (celebrity OR #TaylorSwift OR #Drake)'
    ];

    let allTweets = [];

    // Fetch from multiple trending queries
    for (const query of queries.slice(0, 2)) { // Only use first 2 to avoid rate limits
      const response = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=public_metrics,created_at`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          allTweets.push(...data.data);
        }
      }
    }

    if (allTweets.length === 0) {
      throw new Error('No tweets found');
    }

    // Format as trends
    const trends = allTweets.slice(0, 20).map((tweet, index) => {
      const metrics = tweet.public_metrics || {};
      const volume = (metrics.retweet_count || 0) + (metrics.reply_count || 0) + (metrics.like_count || 0);
      
      let speed = 'slow';
      if (volume > 10000) speed = 'exploding';
      else if (volume > 1000) speed = 'accelerating';
      
      const ageHours = (Date.now() - new Date(tweet.created_at)) / 1000 / 60 / 60;
      let stage = 'early';
      if (ageHours > 12) stage = 'late';
      else if (ageHours > 4) stage = 'mid';
      
      const priority = volume > 5000 && ageHours < 6;
      
      let prediction = 60;
      if (volume > 10000) prediction = 85;
      else if (volume > 5000) prediction = 75;
      else if (volume > 1000) prediction = 65;

      // Clean tweet text
      let tweetText = tweet.text.replace(/https?:\/\/\S+/g, '').trim();
      if (tweetText.length > 100) tweetText = tweetText.substring(0, 100) + '...';

      return {
        id: `twitter-${tweet.id}`,
        title: tweetText,
        category: detectCategory(tweet.text),
        trigger: `Trending on Twitter • ${volume.toLocaleString()} engagements`,
        speed: speed,
        geo: 'Global',
        driver: 'Grassroots memes',
        stage: stage,
        priority: priority,
        analysis: `Twitter content showing ${speed} momentum. ${priority ? 'HIGH PRIORITY - Early detection opportunity.' : 'Monitor for growth.'}`,
        prediction: prediction,
        isNew: ageHours < 2,
        timestamp: Date.now(),
        metrics: {
          volume: volume,
          retweets: metrics.retweet_count || 0,
          likes: metrics.like_count || 0,
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
  
  // Political
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || 
      lower.includes('politic') || lower.includes('government') || lower.includes('congress') ||
      lower.includes('senate') || lower.includes('president') || lower.includes('kamala') ||
      lower.includes('maga') || lower.includes('dem') || lower.includes('gop')) {
    return 'political';
  }
  
  // Breaking
  if (lower.includes('breaking') || lower.includes('alert') || lower.includes('urgent') ||
      lower.includes('just in') || lower.includes('developing') || lower.includes('live')) {
    return 'breaking';
  }
  
  // Tech/Crypto
  if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('btc') || 
      lower.includes('eth') || lower.includes('ethereum') || lower.includes('nft') ||
      lower.includes('blockchain') || lower.includes('stock') || lower.includes('market') ||
      lower.includes('tech') || lower.includes('ai') || lower.includes('chatgpt') ||
      lower.includes('apple') || lower.includes('google') || lower.includes('tesla') ||
      lower.includes('meta') || lower.includes('microsoft')) {
    return 'tech';
  }
  
  // Viral
  if (lower.includes('video') || lower.includes('viral') || lower.includes('meme') ||
      lower.includes('watch') || lower.includes('tiktok') || lower.includes('youtube') ||
      lower.includes('clip') || lower.includes('trending') || lower.includes('views') ||
      lower.includes('lol') || lower.includes('omg') || lower.includes('wtf')) {
    return 'viral';
  }
  
  // Celebrity
  if (lower.includes('kardashian') || lower.includes('taylor swift') || lower.includes('swift') ||
      lower.includes('beyonce') || lower.includes('drake') || lower.includes('kanye') ||
      lower.includes('celeb') || lower.includes('singer') || lower.includes('actor') ||
      lower.includes('rihanna') || lower.includes('bieber') || lower.includes('ariana') ||
      lower.includes('selena') || lower.includes('chris brown') || lower.includes('cardi')) {
    return 'celebrity';
  }
  
  // Default to cultural
  return 'cultural';
}