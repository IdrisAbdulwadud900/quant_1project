module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const baseUrl = `https://${req.headers.host}`;
    
    // Fetch from all sources in parallel
    const [twitterRes, redditRes, newsRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/twitter-trends`),
      fetch(`${baseUrl}/api/reddit-trends`),
      fetch(`${baseUrl}/api/news-trends`)
    ]);

    let allTrends = [];

    // Add Twitter trends
    if (twitterRes.status === 'fulfilled' && twitterRes.value.ok) {
      const twitter = await twitterRes.value.json();
      allTrends.push(...twitter);
    }

    // Add Reddit trends
    if (redditRes.status === 'fulfilled' && redditRes.value.ok) {
      const reddit = await redditRes.value.json();
      allTrends.push(...reddit);
    }

    // Add News trends
    if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
      const news = await newsRes.value.json();
      allTrends.push(...news);
    }

    // Deduplicate and sort by priority
    const unique = deduplicateTrends(allTrends);
    const sorted = unique.sort((a, b) => {
      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;
      return b.prediction - a.prediction;
    }).slice(0, 30);

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