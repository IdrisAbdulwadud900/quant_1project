const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get top stories
    const topResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = await topResponse.json();
    
    // Get details for top 15 stories
    const storyPromises = topIds.slice(0, 15).map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
    );
    
    const stories = await Promise.all(storyPromises);
    
    const trends = stories.map((story, index) => {
      const score = story.score || 0;
      const ageHours = (Date.now() - story.time * 1000) / 1000 / 60 / 60;
      
      let speed = 'slow';
      if (score > 500) speed = 'exploding';
      else if (score > 200) speed = 'accelerating';
      
      let stage = 'early';
      if (ageHours > 12) stage = 'late';
      else if (ageHours > 4) stage = 'mid';
      
      const priority = score > 300 && ageHours < 6;
      
      let prediction = 65;
      if (score > 500) prediction = 85;
      else if (score > 300) prediction = 78;
      else if (score > 200) prediction = 72;
      
      if (ageHours < 2) prediction += 10;
      
      return {
        id: `hn-${index}`,
        title: story.title,
        category: detectCategory(article.title),
        trigger: `HackerNews • ${score} points • ${story.descendants || 0} comments`,
        speed: speed,
        geo: 'Global',
        driver: 'Tech community',
        stage: stage,
        priority: priority,
        analysis: `Tech community discussion. ${story.descendants || 0} comments in ${Math.floor(ageHours)}h.`,
        prediction: Math.min(95, prediction),
        isNew: ageHours < 1,
        timestamp: Date.now(),
        metrics: {
          volume: score,
          comments: story.descendants || 0,
          source: 'HackerNews',
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`
        }
      };
    });

    res.status(200).json(trends);

  } catch (error) {
    console.error('HackerNews API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch HackerNews trends',
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