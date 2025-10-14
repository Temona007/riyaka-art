// Configuration file for the chatbot
// IMPORTANT: Never commit this file with real API keys to version control!

const CONFIG = {
  // Replace with your actual OpenAI API key
  OPENAI_API_KEY: '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',
  
  // Chatbot settings
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  
  // Rate limiting settings - More conservative to avoid 429 errors
  RATE_LIMIT_DELAY: 5000, // 5 seconds between requests
  MAX_RETRIES: 3,
  RETRY_DELAY: 10000, // 10 seconds between retries
  MAX_REQUESTS_PER_MINUTE: 3 // Limit to 3 requests per minute
};

// Export for use in HTML
window.CHATBOT_CONFIG = CONFIG;
