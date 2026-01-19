const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=15&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      throw new Error('No articles returned');
    }

    const trends = data.articles.map((article, index) => {
      const ageHours = (Date.now() - new Date(article.publishedAt)) / 1000 / 60 / 60;
      
      let stage = 'early';
      if (ageHours > 12) stage = 'late';
      else if (ageHours > 4) stage = 'mid';
      
      const priority = ageHours < 2;
      const prediction = ageHours < 1 ? 90 : ageHours < 4 ? 80 : 70;

      return {
        id: `news-${index}`,
        title: article.title,
        category: detectCategory(article.title + ' ' + (article.description || '')),
        trigger: `Breaking news from ${article.source.name}`,
        speed: 'exploding',
        geo: 'US',
        driver: 'Media',
        stage: stage,
        priority: priority,
        analysis: `Breaking news published ${Math.floor(ageHours)} hours ago. ${article.description || ''}`.substring(0, 200),
        prediction: prediction,
        isNew: ageHours < 1,
        timestamp: Date.now(),
        metrics: {
          source: article.source.name,
          url: article.url,
          volume: Math.floor(Math.random() * 50000) + 10000
        }
      };
    });

    res.status(200).json(trends);

  } catch (error) {
    console.error('News API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    });
  }
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  
  // Political
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || 
      lower.includes('politic') || lower.includes('government') || lower.includes('congress') ||
      lower.includes('senate') || lower.includes('president') || lower.includes('white house')) {
    return 'political';
  }
  
  // Breaking news
  if (lower.includes('breaking') || lower.includes('urgent') || lower.includes('alert') ||
      lower.includes('just in') || lower.includes('live') || lower.includes('developing')) {
    return 'breaking';
  }
  
  // Tech/Crypto
  if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('stock') ||
      lower.includes('market') || lower.includes('tech') || lower.includes('ai') ||
      lower.includes('apple') || lower.includes('google') || lower.includes('microsoft') ||
      lower.includes('tesla') || lower.includes('meta') || lower.includes('amazon')) {
    return 'tech';
  }
  
  // Viral/Video
  if (lower.includes('video') || lower.includes('viral') || lower.includes('watch') ||
      lower.includes('tiktok') || lower.includes('youtube') || lower.includes('trending')) {
    return 'viral';
  }
  
  // Celebrity
  if (lower.includes('celeb') || lower.includes('kardashian') || lower.includes('swift') ||
      lower.includes('beyonce') || lower.includes('drake') || lower.includes('actor') ||
      lower.includes('singer') || lower.includes('star') || lower.includes('hollywood')) {
    return 'celebrity';
  }
  
  // Default to cultural
  return 'cultural';
}
