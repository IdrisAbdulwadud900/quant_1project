const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const baseUrl = `https://${req.headers.host}`;
    
    // Try fetching from APIs
    const [twitterRes, newsRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/twitter-trends`),
      fetch(`${baseUrl}/api/news-trends`)
    ]);

    let allTrends = [];

    // Add Twitter trends
    if (twitterRes.status === 'fulfilled' && twitterRes.value.ok) {
      try {
        const twitter = await twitterRes.value.json();
        if (Array.isArray(twitter) && twitter.length > 0) {
          allTrends.push(...twitter);
        }
      } catch (e) {
        console.error('Twitter parse error:', e);
      }
    }

    // Add News trends
    if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
      try {
        const news = await newsRes.value.json();
        if (Array.isArray(news) && news.length > 0) {
          allTrends.push(...news);
        }
      } catch (e) {
        console.error('News parse error:', e);
      }
    }

    // If we got no trends, return sample data
    if (allTrends.length === 0) {
      console.log('No trends from APIs, returning sample data');
      allTrends = getSampleTrends();
    }

    // Deduplicate and sort
    const unique = deduplicateTrends(allTrends);
    const sorted = unique.sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return b.prediction - a.prediction;
    }).slice(0, 30);

    res.status(200).json(sorted);

  } catch (error) {
    console.error('Aggregation Error:', error);
    // Return sample data on error
    res.status(200).json(getSampleTrends());
  }
};

function deduplicateTrends(trends) {
  const seen = new Set();
  return trends.filter(trend => {
    const key = trend.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSampleTrends() {
  const now = Date.now();
  return [
    {
      id: 'sample-1',
      title: 'Bitcoin Surges Past $100k',
      category: 'tech',
      trigger: 'Breaking: Bitcoin reaches new all-time high',
      speed: 'exploding',
      geo: 'Global',
      driver: 'Media',
      stage: 'mid',
      priority: true,
      analysis: 'Major cryptocurrency milestone driving massive social media engagement',
      prediction: 92,
      isNew: true,
      timestamp: now,
      metrics: { volume: 125000, source: 'Sample Data' }
    },
    {
      id: 'sample-2',
      title: 'AI Breakthrough Announced',
      category: 'tech',
      trigger: 'Major tech company reveals new AI model',
      speed: 'accelerating',
      geo: 'US',
      driver: 'Media',
      stage: 'early',
      priority: true,
      analysis: 'Revolutionary AI development gaining traction',
      prediction: 87,
      isNew: true,
      timestamp: now - 3600000,
      metrics: { volume: 45000, source: 'Sample Data' }
    },
    {
      id: 'sample-3',
      title: 'Viral TikTok Dance Challenge',
      category: 'viral',
      trigger: 'New dance trend spreading across platforms',
      speed: 'exploding',
      geo: 'Global',
      driver: 'Grassroots memes',
      stage: 'early',
      priority: false,
      analysis: 'Organic viral content showing rapid growth',
      prediction: 85,
      isNew: true,
      timestamp: now - 1800000,
      metrics: { volume: 89000, source: 'Sample Data' }
    },
    {
      id: 'sample-4',
      title: 'Celebrity Engagement Announcement',
      category: 'celebrity',
      trigger: 'Major celebrity shares personal news',
      speed: 'exploding',
      geo: 'Global',
      driver: 'Media',
      stage: 'early',
      priority: false,
      analysis: 'Celebrity news driving engagement',
      prediction: 82,
      isNew: true,
      timestamp: now - 2400000,
      metrics: { volume: 67000, source: 'Sample Data' }
    },
    {
      id: 'sample-5',
      title: 'Political Debate Trending',
      category: 'political',
      trigger: 'Heated political discussion online',
      speed: 'accelerating',
      geo: 'US',
      driver: 'Media',
      stage: 'mid',
      priority: false,
      analysis: 'Political discourse gaining momentum',
      prediction: 75,
      isNew: false,
      timestamp: now - 7200000,
      metrics: { volume: 34000, source: 'Sample Data' }
    },
    {
      id: 'sample-6',
      title: 'Meme Stocks Rally',
      category: 'tech',
      trigger: 'Reddit traders coordinate buying',
      speed: 'accelerating',
      geo: 'US',
      driver: 'Grassroots memes',
      stage: 'early',
      priority: true,
      analysis: 'Community-driven market movement',
      prediction: 88,
      isNew: true,
      timestamp: now - 5400000,
      metrics: { volume: 56000, source: 'Sample Data' }
    },
    {
      id: 'sample-7',
      title: 'Breaking Weather Alert',
      category: 'breaking',
      trigger: 'Severe weather warning issued',
      speed: 'exploding',
      geo: 'Regional',
      driver: 'Media',
      stage: 'early',
      priority: true,
      analysis: 'Urgent weather situation developing',
      prediction: 90,
      isNew: true,
      timestamp: now - 900000,
      metrics: { volume: 78000, source: 'Sample Data' }
    },
    {
      id: 'sample-8',
      title: 'Gaming Tournament Finals',
      category: 'cultural',
      trigger: 'Major esports championship underway',
      speed: 'accelerating',
      geo: 'Global',
      driver: 'Media',
      stage: 'mid',
      priority: false,
      analysis: 'Gaming community highly engaged',
      prediction: 79,
      isNew: false,
      timestamp: now - 10800000,
      metrics: { volume: 42000, source: 'Sample Data' }
    },
    {
      id: 'sample-9',
      title: 'Fashion Week Highlights',
      category: 'cultural',
      trigger: 'Major fashion event ongoing',
      speed: 'slow',
      geo: 'Global',
      driver: 'Media',
      stage: 'late',
      priority: false,
      analysis: 'Fashion industry event coverage',
      prediction: 68,
      isNew: false,
      timestamp: now - 14400000,
      metrics: { volume: 28000, source: 'Sample Data' }
    },
    {
      id: 'sample-10',
      title: 'Space Launch Success',
      category: 'tech',
      trigger: 'Rocket launch completed successfully',
      speed: 'accelerating',
      geo: 'Global',
      driver: 'Media',
      stage: 'early',
      priority: false,
      analysis: 'Space exploration milestone',
      prediction: 81,
      isNew: true,
      timestamp: now - 6300000,
      metrics: { volume: 51000, source: 'Sample Data' }
    }
  ];
}