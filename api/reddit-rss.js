const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const subreddits = ['popular', 'worldnews', 'technology', 'CryptoCurrency', 'wallstreetbets'];
    const allTrends = [];
    
    for (const sub of subreddits) {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TrendScanner/1.0)'
            }
          }
        );

        const data = await response.json();
        
        if (data.data && data.data.children) {
          const posts = data.data.children.map(child => child.data);
          
          posts.forEach((post, index) => {
            const score = post.score || 0;
            const ageHours = (Date.now() - post.created_utc * 1000) / 1000 / 60 / 60;
            
            let speed = 'slow';
            if (score > 10000) speed = 'exploding';
            else if (score > 1000) speed = 'accelerating';
            
            let stage = 'early';
            if (ageHours > 12) stage = 'late';
            else if (ageHours > 4) stage = 'mid';
            
            const priority = score > 5000 && ageHours < 6;
            
            allTrends.push({
              id: `reddit-${sub}-${index}`,
              title: post.title.substring(0, 100),
              category: detectCategory(post.subreddit),
              trigger: `r/${post.subreddit} • ${score.toLocaleString()} upvotes`,
              speed: speed,
              geo: 'Global',
              driver: 'Grassroots memes',
              stage: stage,
              priority: priority,
              analysis: `Reddit discussion with ${post.num_comments} comments in ${Math.floor(ageHours)}h`,
              prediction: calculatePrediction(score, ageHours, post.num_comments),
              isNew: ageHours < 2,
              timestamp: Date.now(),
              metrics: {
                volume: score,
                comments: post.num_comments,
                source: 'Reddit',
                url: `https://reddit.com${post.permalink}`
              }
            });
          });
        }
      } catch (err) {
        console.log(`Failed to fetch r/${sub}:`, err.message);
        continue;
      }
    }

    res.status(200).json(allTrends.slice(0, 15));

  } catch (error) {
    console.error('Reddit RSS Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Reddit trends',
      message: error.message 
    });
  }
};

function detectCategory(subreddit) {
  const lower = (subreddit || '').toLowerCase();
  
  if (lower.includes('news') || lower.includes('world')) return 'breaking';
  if (lower.includes('crypto') || lower.includes('tech')) return 'tech';
  if (lower.includes('meme') || lower.includes('funny')) return 'cultural';
  if (lower.includes('politic')) return 'political';
  if (lower.includes('wallstreet') || lower.includes('stock')) return 'tech';
  
  return 'cultural';
}

function calculatePrediction(score, ageHours, comments) {
  let prediction = 60;
  
  // High score = high potential
  if (score > 20000) prediction += 20;
  else if (score > 10000) prediction += 15;
  else if (score > 5000) prediction += 10;
  
  // Early + high score = explosive
  if (ageHours < 3 && score > 5000) prediction += 15;
  
  // High engagement
  if (comments > 500) prediction += 10;
  
  return Math.min(95, prediction);
}