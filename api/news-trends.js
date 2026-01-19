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
          url: article.url
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
  
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || 
      lower.includes('politic') || lower.includes('government')) {
    return 'political';
  }
  
  if (lower.includes('breaking') || lower.includes('urgent') || lower.includes('alert')) {
    return 'breaking';
  }
  
  if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('stock') ||
      lower.includes('market') || lower.includes('tech') || lower.includes('ai')) {
    return 'tech';
  }
  
  if (lower.includes('video') || lower.includes('viral') || lower.includes('watch')) {
    return 'viral';
  }
  
  if (lower.includes('celeb') || lower.includes('kardashian') || lower.includes('swift') ||
      lower.includes('beyonce') || lower.includes('drake')) {
    return 'celebrity';
  }
  
  return 'cultural';
}