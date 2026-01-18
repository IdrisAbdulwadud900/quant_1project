// Advanced AI Prediction Engine
// Analyzes multiple factors to predict trend explosion probability

class TrendPredictor {
  
  // Main prediction function
  predict(trend) {
    const scores = {
      velocity: this.calculateVelocity(trend),
      timing: this.calculateTiming(trend),
      volume: this.calculateVolume(trend),
      engagement: this.calculateEngagement(trend),
      novelty: this.calculateNovelty(trend),
      crossPlatform: this.calculateCrossPlatform(trend)
    };
    
    // Weighted scoring
    const weights = {
      velocity: 0.30,    // 30% - How fast it's growing
      timing: 0.20,      // 20% - When it started
      volume: 0.15,      // 15% - Current size
      engagement: 0.15,  // 15% - How people interact
      novelty: 0.10,     // 10% - How new/unique
      crossPlatform: 0.10 // 10% - Multiple sources
    };
    
    let finalScore = 0;
    let reasoning = [];
    
    for (const [factor, score] of Object.entries(scores)) {
      finalScore += score * weights[factor];
      reasoning.push(this.getReasoningForFactor(factor, score));
    }
    
    // Convert to 0-100 scale
    finalScore = Math.round(finalScore * 100);
    
    // Ensure min/max bounds
    finalScore = Math.max(40, Math.min(99, finalScore));
    
    return {
      score: finalScore,
      confidence: this.getConfidenceLevel(finalScore),
      reasoning: reasoning.filter(r => r).slice(0, 3), // Top 3 reasons
      factors: scores,
      tier: this.getTier(finalScore)
    };
  }
  
  // Factor 1: Velocity (speed of growth)
  calculateVelocity(trend) {
    const { speed, stage, metrics } = trend;
    
    let score = 0.5;
    
    // Speed contributes heavily
    if (speed === 'exploding') score += 0.4;
    else if (speed === 'accelerating') score += 0.25;
    else score += 0.1;
    
    // Early stage + high speed = explosive potential
    if (stage === 'early' && speed === 'exploding') score += 0.15;
    
    // Check if volume is increasing
    if (metrics?.volume > 50000) score += 0.1;
    
    return Math.min(1.0, score);
  }
  
  // Factor 2: Timing (when it started)
  calculateTiming(trend) {
    const { stage, timestamp, isNew } = trend;
    
    let score = 0.5;
    
    // Early stage trends have more potential
    if (stage === 'early') score += 0.3;
    else if (stage === 'mid') score += 0.1;
    else score -= 0.1;
    
    // Very new trends get bonus
    if (isNew) score += 0.2;
    
    // Age matters (newer = better for prediction)
    const ageHours = (Date.now() - timestamp) / 1000 / 60 / 60;
    if (ageHours < 2) score += 0.15;
    else if (ageHours < 6) score += 0.1;
    
    return Math.max(0.2, Math.min(1.0, score));
  }
  
  // Factor 3: Volume (current size)
  calculateVolume(trend) {
    const { metrics, stage } = trend;
    const volume = metrics?.volume || 0;
    
    let score = 0.5;
    
    // Sweet spot: not too big, not too small
    if (volume < 5000) score += 0.3; // Very early = high potential
    else if (volume < 50000) score += 0.2; // Early growth phase
    else if (volume < 200000) score += 0.1; // Still growing
    else score -= 0.1; // Already mainstream
    
    // Small volume + early stage = hidden gem
    if (volume < 10000 && stage === 'early') score += 0.2;
    
    return Math.max(0.3, Math.min(1.0, score));
  }
  
  // Factor 4: Engagement (how people interact)
  calculateEngagement(trend) {
    const { metrics, category, driver } = trend;
    
    let score = 0.5;
    
    // Check engagement indicators
    if (metrics?.comments > 100) score += 0.15;
    if (metrics?.url) score += 0.1; // Has source
    
    // Category engagement patterns
    if (category === 'tech' || category === 'crypto') score += 0.15;
    if (category === 'political') score += 0.1;
    if (category === 'viral') score += 0.2;
    
    // Grassroots > Media (organic growth)
    if (driver === 'Grassroots memes') score += 0.15;
    else if (driver === 'Influencers') score += 0.1;
    
    return Math.max(0.3, Math.min(1.0, score));
  }
  
  // Factor 5: Novelty (uniqueness)
  calculateNovelty(trend) {
    const { title, category, isNew } = trend;
    
    let score = 0.5;
    
    // New trends get bonus
    if (isNew) score += 0.3;
    
    // Check for unique keywords
    const uniqueKeywords = ['first', 'new', 'breaking', 'just', 'announced', 'leaked'];
    const hasUnique = uniqueKeywords.some(k => title.toLowerCase().includes(k));
    if (hasUnique) score += 0.2;
    
    // Certain categories are more novel
    if (category === 'tech') score += 0.1;
    
    return Math.max(0.3, Math.min(1.0, score));
  }
  
  // Factor 6: Cross-platform presence
  calculateCrossPlatform(trend) {
    const { metrics } = trend;
    
    let score = 0.5;
    
    // If we have data from multiple sources
    const sources = [];
    if (metrics?.source) sources.push(metrics.source);
    
    // More sources = more validation
    if (sources.length >= 2) score += 0.3;
    else if (sources.length === 1) score += 0.1;
    
    return Math.max(0.3, Math.min(1.0, score));
  }
  
  // Get reasoning text for each factor
  getReasoningForFactor(factor, score) {
    if (score < 0.5) return null; // Don't mention weak factors
    
    const reasoningMap = {
      velocity: score > 0.8 ? 'Explosive growth velocity detected' : 'Strong momentum building',
      timing: score > 0.8 ? 'Perfect early-stage timing' : 'Good entry window',
      volume: score > 0.8 ? 'Optimal volume for growth' : 'Healthy engagement level',
      engagement: score > 0.8 ? 'High engagement signals' : 'Active community participation',
      novelty: score > 0.8 ? 'Novel and unique content' : 'Fresh perspective emerging',
      crossPlatform: score > 0.8 ? 'Multi-platform validation' : 'Cross-source confirmation'
    };
    
    return reasoningMap[factor];
  }
  
  // Get confidence level
  getConfidenceLevel(score) {
    if (score >= 85) return 'Very High';
    if (score >= 75) return 'High';
    if (score >= 65) return 'Medium';
    return 'Low';
  }
  
  // Get prediction tier
  getTier(score) {
    if (score >= 90) return 'IMMINENT';
    if (score >= 80) return 'LIKELY';
    if (score >= 70) return 'POSSIBLE';
    return 'MONITOR';
  }
}

module.exports = TrendPredictor;