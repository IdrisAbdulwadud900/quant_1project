const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const baseUrl = `https://${req.headers.host}`;
    
    // Fetch from ALL sources in parallel
    const [twitterRes, newsRes, redditRes, hnRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/twitter-trends`),
      fetch(`${baseUrl}/api/news-trends`),
      fetch(`${baseUrl}/api/reddit-rss`),
      fetch(`${baseUrl}/api/hackernews`)
    ]);

    let allTrends = [];

    // Add Twitter trends
    if (twitterRes.status === 'fulfilled' && twitterRes.value.ok) {
      const twitter = await twitterRes.value.json();
      allTrends.push(...twitter);
    }

    // Add News trends
    if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
      const news = await newsRes.value.json();
      allTrends.push(...news);
    }

    // Add Reddit trends
    if (redditRes.status === 'fulfilled' && redditRes.value.ok) {
      const reddit = await redditRes.value.json();
      allTrends.push(...reddit);
    }

    // Add HackerNews trends
    if (hnRes.status === 'fulfilled' && hnRes.value.ok) {
      const hn = await hnRes.value.json();
      allTrends.push(...hn);
    }

    // Deduplicate and sort
    const unique = deduplicateTrends(allTrends);
    const sorted = unique.sort((a, b) => {
      // Priority first
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      // Then by prediction score
      return b.prediction - a.prediction;
    }).slice(0, 40); // Show top 40 trends

    res.status(200).json(sorted);

  } catch (error) {
    console.error('Aggregation Error:', error);
    res.status(500).json({ 
      error: 'Failed to aggregate trends',
      message: error.message 
    });
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