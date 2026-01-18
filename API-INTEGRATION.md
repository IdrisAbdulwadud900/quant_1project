# 🔌 DEV SCANNER - API INTEGRATION GUIDE

Complete guide to connect real data sources to your DEV SCANNER.

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Required APIs](#required-apis)
3. [Twitter API Integration](#twitter-api-integration)
4. [Reddit API Integration](#reddit-api-integration)
5. [Google Trends Integration](#google-trends-integration)
6. [News API Integration](#news-api-integration)
7. [TikTok API Integration](#tiktok-api-integration)
8. [Telegram Bot Integration](#telegram-bot-integration)
9. [Data Aggregation Strategy](#data-aggregation-strategy)
10. [Rate Limiting & Caching](#rate-limiting--caching)
11. [Complete Integration Example](#complete-integration-example)

---

## 🎯 OVERVIEW

Your DEV SCANNER currently uses sample data. This guide shows how to replace it with **real-time data** from multiple sources.

### Architecture:

```
APIs → Data Collection → Normalization → Trend Detection → Display
  ↓
Twitter, Reddit, News, TikTok, Google Trends
  ↓
Serverless Functions (Vercel/Netlify)
  ↓
Unified Trend Format
  ↓
Frontend (Your Scanner)
```

### Recommended Approach:

**Use Vercel Serverless Functions** to:
- Keep API keys secure (server-side only)
- Avoid CORS issues
- Implement caching
- Handle rate limiting

---

## 📦 REQUIRED APIs

| API | Purpose | Cost | Rate Limit |
|-----|---------|------|------------|
| **Twitter API v2** | Real-time tweets, trends | Free tier available | 500k tweets/month |
| **Reddit API** | Subreddit trends | Free | 60 requests/min |
| **Google Trends** | Search trends | Free | Unofficial, ~400/day |
| **NewsAPI** | Breaking news | Free tier | 100 requests/day |
| **TikTok Research API** | Viral videos | Request access | Varies |
| **Telegram Bot API** | Send alerts | Free | 30 messages/sec |

**Total Monthly Cost:** $0 - $100 (depending on usage)

---

## 🐦 TWITTER API INTEGRATION

### Step 1: Get API Access

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Apply for "Elevated" access (free)
3. Create a new app
4. Copy your API keys:
   - API Key
   - API Secret
   - Bearer Token

### Step 2: Install Twitter Library

```bash
# Create api folder
mkdir api
cd api

# Initialize npm
npm init -y

# Install dependencies
npm install twitter-api-v2
```

### Step 3: Create Serverless Function

**File:** `api/twitter-trends.js`

```javascript
const { TwitterApi } = require('twitter-api-v2');

// Initialize client
const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

module.exports = async (req, res) => {
  try {
    // Get trending topics
    const trends = await client.v2.trendsByPlace(1); // 1 = Worldwide
    
    // Get recent tweets for each trend
    const trendData = await Promise.all(
      trends[0].trends.slice(0, 10).map(async (trend) => {
        const tweets = await client.v2.search(trend.name, {
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics'
        });
        
        return {
          name: trend.name,
          volume: trend.tweet_volume || 0,
          tweets: tweets.data.data || [],
          url: trend.url
        };
      })
    );
    
    // Calculate velocity (tweets per minute)
    const trendsWithVelocity = trendData.map(trend => {
      const now = new Date();
      const recentTweets = trend.tweets.filter(tweet => {
        const tweetTime = new Date(tweet.created_at);
        const diffMinutes = (now - tweetTime) / 1000 / 60;
        return diffMinutes <= 60; // Last hour
      });
      
      const velocity = recentTweets.length / 60; // Tweets per minute
      
      return {
        title: trend.name,
        category: detectCategory(trend.name, trend.tweets),
        trigger: extractTrigger(trend.tweets),
        speed: getSpeed(velocity),
        geo: 'Global',
        driver: 'Grassroots memes',
        stage: getStage(trend.volume),
        priority: isPriority(velocity, trend.volume),
        prediction: calculatePrediction(trend),
        metrics: {
          volume: trend.volume,
          velocity: `+${Math.floor(velocity)}/min`,
          tweets: trend.tweets.length
        }
      };
    });
    
    res.status(200).json(trendsWithVelocity);
    
  } catch (error) {
    console.error('Twitter API Error:', error);
    res.status(500).json({ error: 'Failed to fetch Twitter trends' });
  }
};

// Helper functions
function detectCategory(name, tweets) {
  const text = `${name} ${tweets.map(t => t.text).join(' ')}`.toLowerCase();
  
  if (text.includes('election') || text.includes('government')) return 'political';
  if (text.includes('breaking') || text.includes('just in')) return 'breaking';
  if (text.includes('meme') || text.includes('lol')) return 'cultural';
  if (text.includes('video') || text.includes('watch')) return 'viral';
  if (text.includes('crypto') || text.includes('tech')) return 'tech';
  if (text.includes('celebrity') || text.includes('famous')) return 'celebrity';
  
  return 'cultural';
}

function extractTrigger(tweets) {
  // Find most common phrases
  const topTweet = tweets.sort((a, b) => 
    b.public_metrics.retweet_count - a.public_metrics.retweet_count
  )[0];
  
  return topTweet ? topTweet.text.substring(0, 200) : 'Viral content spreading rapidly';
}

function getSpeed(velocity) {
  if (velocity > 50) return 'exploding';
  if (velocity > 10) return 'accelerating';
  return 'slow';
}

function getStage(volume) {
  if (volume < 10000) return 'early';
  if (volume < 100000) return 'mid';
  return 'late';
}

function isPriority(velocity, volume) {
  return velocity > 50 || (velocity > 10 && volume < 10000);
}

function calculatePrediction(trend) {
  // Simple prediction algorithm
  let score = 50;
  
  // High velocity = higher chance
  const velocity = trend.tweets.length / 60;
  if (velocity > 100) score += 30;
  else if (velocity > 50) score += 20;
  else if (velocity > 10) score += 10;
  
  // Low volume but high velocity = early trend
  if (trend.volume < 10000 && velocity > 10) score += 20;
  
  // Engagement rate
  const avgEngagement = trend.tweets.reduce((sum, t) => 
    sum + (t.public_metrics.like_count + t.public_metrics.retweet_count), 0
  ) / trend.tweets.length;
  
  if (avgEngagement > 1000) score += 10;
  
  return Math.min(score, 99);
}
```

### Step 4: Environment Variables

**File:** `.env`

```
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

**In Vercel:**
Settings → Environment Variables → Add

### Step 5: Call from Frontend

**Update your `loadTrends()` function:**

```javascript
async loadTrends() {
  try {
    const response = await fetch('/api/twitter-trends');
    const twitterTrends = await response.json();
    
    this.trends = twitterTrends;
    this.checkAlerts();
    
  } catch (error) {
    console.error('Error loading trends:', error);
    // Fall back to sample data
    this.loadSampleTrends();
  }
}
```

---

## 🔴 REDDIT API INTEGRATION

### Step 1: Get API Access

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Create app (script type)
3. Copy:
   - Client ID
   - Client Secret

### Step 2: Create Serverless Function

**File:** `api/reddit-trends.js`

```javascript
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    // Get access token
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64');
    
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DEV-SCANNER/1.0'
      },
      body: 'grant_type=client_credentials'
    });
    
    const { access_token } = await tokenResponse.json();
    
    // Get trending posts from multiple subreddits
    const subreddits = ['all', 'worldnews', 'cryptocurrency', 'memes', 'videos'];
    
    const trends = await Promise.all(
      subreddits.map(async (sub) => {
        const response = await fetch(
          `https://oauth.reddit.com/r/${sub}/hot?limit=25`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'User-Agent': 'DEV-SCANNER/1.0'
            }
          }
        );
        
        const data = await response.json();
        return data.data.children.map(post => post.data);
      })
    );
    
    // Flatten and process
    const allPosts = trends.flat();
    
    // Group by similar topics
    const trendGroups = groupSimilarPosts(allPosts);
    
    // Format as trends
    const formattedTrends = trendGroups.map(group => ({
      title: group.title,
      category: detectCategory(group),
      trigger: group.topPost.title,
      speed: getSpeedFromScore(group.totalScore, group.posts.length),
      geo: 'Global',
      driver: 'Media',
      stage: getStageFromAge(group.avgAge),
      priority: group.totalScore > 10000,
      prediction: calculatePrediction(group),
      metrics: {
        upvotes: group.totalScore,
        comments: group.totalComments,
        posts: group.posts.length
      }
    }));
    
    res.status(200).json(formattedTrends);
    
  } catch (error) {
    console.error('Reddit API Error:', error);
    res.status(500).json({ error: 'Failed to fetch Reddit trends' });
  }
};

function groupSimilarPosts(posts) {
  // Simple keyword-based grouping
  const groups = [];
  
  posts.forEach(post => {
    const keywords = extractKeywords(post.title);
    let added = false;
    
    for (let group of groups) {
      const similarity = calculateSimilarity(keywords, group.keywords);
      if (similarity > 0.3) {
        group.posts.push(post);
        group.totalScore += post.score;
        group.totalComments += post.num_comments;
        added = true;
        break;
      }
    }
    
    if (!added && post.score > 1000) {
      groups.push({
        title: post.title,
        keywords,
        posts: [post],
        topPost: post,
        totalScore: post.score,
        totalComments: post.num_comments,
        avgAge: Date.now() - post.created_utc * 1000
      });
    }
  });
  
  return groups.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
}

function extractKeywords(text) {
  return text.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 4)
    .slice(0, 5);
}

function calculateSimilarity(keywords1, keywords2) {
  const common = keywords1.filter(k => keywords2.includes(k));
  return common.length / Math.max(keywords1.length, keywords2.length);
}

function getSpeedFromScore(score, postCount) {
  const avgScore = score / postCount;
  if (avgScore > 5000) return 'exploding';
  if (avgScore > 1000) return 'accelerating';
  return 'slow';
}

function getStageFromAge(avgAge) {
  const hours = avgAge / 1000 / 60 / 60;
  if (hours < 6) return 'early';
  if (hours < 24) return 'mid';
  return 'late';
}
```

---

## 📊 GOOGLE TRENDS INTEGRATION

### Step 1: Install Library

```bash
npm install google-trends-api
```

### Step 2: Create Serverless Function

**File:** `api/google-trends.js`

```javascript
const googleTrends = require('google-trends-api');

module.exports = async (req, res) => {
  try {
    // Get trending searches (US)
    const trendsUS = await googleTrends.dailyTrends({
      geo: 'US',
    });
    
    // Get trending searches (UK)
    const trendsUK = await googleTrends.dailyTrends({
      geo: 'GB',
    });
    
    // Parse results
    const usData = JSON.parse(trendsUS);
    const ukData = JSON.parse(trendsUK);
    
    // Combine and format
    const allTrends = [
      ...formatTrends(usData.default.trendingSearchesDays[0].trendingSearches, 'US'),
      ...formatTrends(ukData.default.trendingSearchesDays[0].trendingSearches, 'UK')
    ];
    
    // Deduplicate and sort by traffic
    const uniqueTrends = deduplicateTrends(allTrends);
    
    res.status(200).json(uniqueTrends);
    
  } catch (error) {
    console.error('Google Trends API Error:', error);
    res.status(500).json({ error: 'Failed to fetch Google Trends' });
  }
};

function formatTrends(trends, geo) {
  return trends.map(trend => ({
    title: trend.title.query,
    category: 'breaking',
    trigger: trend.articles[0]?.title || 'Trending search query',
    speed: getSpeedFromTraffic(trend.formattedTraffic),
    geo: geo === 'GB' ? 'UK' : geo,
    driver: 'Media',
    stage: 'early',
    priority: parseInt(trend.formattedTraffic.replace(/[^0-9]/g, '')) > 100000,
    prediction: 75,
    metrics: {
      traffic: trend.formattedTraffic,
      articles: trend.articles.length
    }
  }));
}

function getSpeedFromTraffic(traffic) {
  const num = parseInt(traffic.replace(/[^0-9]/g, ''));
  if (num > 500000) return 'exploding';
  if (num > 100000) return 'accelerating';
  return 'slow';
}

function deduplicateTrends(trends) {
  const seen = new Set();
  return trends.filter(trend => {
    const key = trend.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}
```

---

## 📰 NEWS API INTEGRATION

### Step 1: Get API Key

1. Go to [newsapi.org](https://newsapi.org)
2. Sign up (free tier: 100 requests/day)
3. Copy API key

### Step 2: Create Serverless Function

**File:** `api/news-trends.js`

```javascript
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    // Get breaking news from multiple sources
    const sources = [
      'https://newsapi.org/v2/top-headlines?country=us&apiKey=' + process.env.NEWS_API_KEY,
      'https://newsapi.org/v2/top-headlines?country=gb&apiKey=' + process.env.NEWS_API_KEY,
      'https://newsapi.org/v2/top-headlines?category=technology&apiKey=' + process.env.NEWS_API_KEY
    ];
    
    const responses = await Promise.all(
      sources.map(url => fetch(url).then(r => r.json()))
    );
    
    // Combine articles
    const allArticles = responses.flatMap(r => r.articles || []);
    
    // Group by similar topics
    const trends = groupArticles(allArticles);
    
    res.status(200).json(trends);
    
  } catch (error) {
    console.error('News API Error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

function groupArticles(articles) {
  const groups = new Map();
  
  articles.forEach(article => {
    const keywords = extractKeywords(article.title);
    const key = keywords.join('-');
    
    if (groups.has(key)) {
      groups.get(key).articles.push(article);
    } else {
      groups.set(key, {
        title: article.title,
        articles: [article],
        publishedAt: article.publishedAt
      });
    }
  });
  
  return Array.from(groups.values())
    .map(group => ({
      title: group.title,
      category: 'breaking',
      trigger: group.articles[0].description,
      speed: 'exploding',
      geo: detectGeo(group.articles),
      driver: 'Media',
      stage: getStageFromTime(group.publishedAt),
      priority: group.articles.length > 3,
      prediction: 80,
      metrics: {
        sources: group.articles.length,
        latest: group.publishedAt
      }
    }))
    .slice(0, 10);
}

function extractKeywords(text) {
  return text.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 4)
    .slice(0, 3);
}

function detectGeo(articles) {
  const sources = articles.map(a => a.source.name).join(' ');
  if (sources.includes('BBC') || sources.includes('Guardian')) return 'UK';
  if (sources.includes('CNN') || sources.includes('Fox')) return 'US';
  return 'Global';
}

function getStageFromTime(publishedAt) {
  const hours = (Date.now() - new Date(publishedAt)) / 1000 / 60 / 60;
  if (hours < 2) return 'early';
  if (hours < 12) return 'mid';
  return 'late';
}
```

---

## 📱 TIKTOK API INTEGRATION

TikTok Research API requires special access. Alternative: Use unofficial scraper.

### Option 1: Official API (Requires Approval)

Apply at: [developers.tiktok.com](https://developers.tiktok.com)

### Option 2: Unofficial Scraper

```javascript
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    // Use TikTok's public endpoints (may change)
    const response = await fetch('https://www.tiktok.com/api/recommend/item_list/', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    const data = await response.json();
    
    const trends = data.itemList
      .filter(item => item.stats.playCount > 1000000)
      .map(item => ({
        title: item.desc || 'Viral TikTok Video',
        category: 'viral',
        trigger: `Video with ${formatNumber(item.stats.playCount)} views`,
        speed: getSpeedFromGrowth(item.stats),
        geo: 'Global',
        driver: 'Influencers',
        stage: 'mid',
        priority: item.stats.playCount > 10000000,
        prediction: 85,
        metrics: {
          views: formatNumber(item.stats.playCount),
          likes: formatNumber(item.stats.diggCount),
          shares: formatNumber(item.stats.shareCount)
        }
      }))
      .slice(0, 10);
    
    res.status(200).json(trends);
    
  } catch (error) {
    console.error('TikTok API Error:', error);
    res.status(500).json({ error: 'Failed to fetch TikTok trends' });
  }
};

function formatNumber(num) {
  if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num > 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getSpeedFromGrowth(stats) {
  const engagement = (stats.diggCount + stats.shareCount) / stats.playCount;
  if (engagement > 0.1) return 'exploding';
  if (engagement > 0.05) return 'accelerating';
  return 'slow';
}
```

---

## 📲 TELEGRAM BOT INTEGRATION

### Step 1: Create Bot

1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow instructions
4. Copy bot token

### Step 2: Get Chat ID

1. Message @userinfobot
2. Copy your chat ID

### Step 3: Implement Sending

**File:** `api/send-telegram.js`

```javascript
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { message, chatId } = req.body;
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId || process.env.TELEGRAM_CHAT_ID,
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
    console.error('Telegram API Error:', error);
    res.status(500).json({ error: 'Failed to send Telegram message' });
  }
};
```

### Step 4: Call from Frontend

```javascript
async sendTelegramAlert(message) {
  try {
    await fetch('/api/send-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🚨 <b>HIGH PRIORITY ALERT</b>\n\n${message}`,
        chatId: this.settings.telegramChat
      })
    });
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
  }
}
```

---

## 🔄 DATA AGGREGATION STRATEGY

### Create Master Aggregator

**File:** `api/aggregate-trends.js`

```javascript
module.exports = async (req, res) => {
  try {
    // Fetch from all sources in parallel
    const [twitter, reddit, google, news] = await Promise.all([
      fetch(`${process.env.BASE_URL}/api/twitter-trends`).then(r => r.json()),
      fetch(`${process.env.BASE_URL}/api/reddit-trends`).then(r => r.json()),
      fetch(`${process.env.BASE_URL}/api/google-trends`).then(r => r.json()),
      fetch(`${process.env.BASE_URL}/api/news-trends`).then(r => r.json())
    ]);
    
    // Combine all trends
    const allTrends = [...twitter, ...reddit, ...google, ...news];
    
    // Deduplicate by title similarity
    const uniqueTrends = deduplicateTrends(allTrends);
    
    // Score and rank
    const rankedTrends = scoreTrends(uniqueTrends);
    
    // Add historical tracking
    const trendsWithHistory = await addHistoricalData(rankedTrends);
    
    res.status(200).json(trendsWithHistory);
    
  } catch (error) {
    console.error('Aggregation Error:', error);
    res.status(500).json({ error: 'Failed to aggregate trends' });
  }
};

function deduplicateTrends(trends) {
  const unique = [];
  const seen = new Set();
  
  for (const trend of trends) {
    const normalized = trend.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(trend);
    }
  }
  
  return unique;
}

function scoreTrends(trends) {
  return trends
    .map(trend => ({
      ...trend,
      score: calculateScore(trend)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

function calculateScore(trend) {
  let score = 0;
  
  // Speed
  if (trend.speed === 'exploding') score += 50;
  else if (trend.speed === 'accelerating') score += 30;
  else score += 10;
  
  // Stage
  if (trend.stage === 'early') score += 40;
  else if (trend.stage === 'mid') score += 20;
  
  // Priority
  if (trend.priority) score += 30;
  
  // Prediction
  score += trend.prediction * 0.2;
  
  return score;
}

async function addHistoricalData(trends) {
  // In production, fetch from database
  // For now, simulate
  return trends.map(trend => ({
    ...trend,
    history: generateHistory()
  }));
}

function generateHistory() {
  const points = [];
  let mentions = 1000;
  
  for (let i = 24; i >= 0; i--) {
    mentions *= (1 + Math.random() * 0.5);
    points.push({
      timestamp: Date.now() - (i * 3600000),
      mentions: Math.floor(mentions)
    });
  }
  
  return points;
}
```

---

## ⚡ RATE LIMITING & CACHING

### Implement Redis Caching

**File:** `api/_middleware.js`

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

module.exports = async (req, res, next) => {
  const cacheKey = `trends:${req.url}`;
  
  try {
    // Check cache
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }
    
    // Continue to API
    await next();
    
  } catch (error) {
    await next();
  }
};

// Cache successful responses
function cacheResponse(key, data, ttl = 600) {
  redis.setex(key, ttl, JSON.stringify(data));
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

module.exports = limiter;
```

---

## 🎯 COMPLETE INTEGRATION EXAMPLE

### Update Frontend

```javascript
async loadTrends() {
  try {
    // Call aggregator API
    const response = await fetch('/api/aggregate-trends');
    const trends = await response.json();
    
    this.trends = trends;
    
    // Update history
    trends.forEach(trend => {
      if (!this.trendHistory[trend.id]) {
        this.trendHistory[trend.id] = [];
      }
      this.trendHistory[trend.id] = trend.history || [];
    });
    
    // Check alerts
    this.checkAlerts();
    
    this.render();
    
  } catch (error) {
    console.error('Error loading trends:', error);
    this.showNotification('Error', 'Failed to load trends', 'error');
  }
}
```

### Deploy to Vercel

```bash
# Deploy with environment variables
vercel --prod \
  -e TWITTER_BEARER_TOKEN=your_token \
  -e REDDIT_CLIENT_ID=your_id \
  -e REDDIT_CLIENT_SECRET=your_secret \
  -e NEWS_API_KEY=your_key \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e TELEGRAM_CHAT_ID=your_chat_id \
  -e REDIS_URL=your_redis_url
```

---

## ✅ TESTING CHECKLIST

After integration:

- [ ] Twitter trends loading
- [ ] Reddit trends loading
- [ ] Google trends loading
- [ ] News trends loading
- [ ] All trends deduplicated
- [ ] Scores calculated correctly
- [ ] Historical data tracking
- [ ] Telegram alerts sending
- [ ] Rate limiting working
- [ ] Caching working
- [ ] Error handling robust
- [ ] No API key leaks
- [ ] CORS configured
- [ ] Performance < 3s

---

## 🚀 NEXT STEPS

1. **Deploy APIs** to Vercel
2. **Test each endpoint** individually
3. **Test aggregator** with all sources
4. **Monitor usage** and adjust rate limits
5. **Scale** as needed

---

**Your DEV SCANNER is now connected to real-time data! 🎉**

Watch as actual trends flow into your dashboard every 10 minutes.
