# ASKIMSPORT Landing Page with AI Chatbot

A modern fitness landing page with an integrated AI chatbot for fitness coaching.

## Features

- Responsive design optimized for all devices
- AI-powered fitness chatbot using OpenAI GPT
- Rate limiting and error handling
- Secure API key management
- Smooth animations and modern UI

## Setup Instructions

### 1. API Key Configuration

**IMPORTANT**: Never commit your actual API key to version control!

1. Open `config.js` file
2. Replace `'your_openai_api_key_here'` with your actual OpenAI API key
3. Save the file

Example:
```javascript
const CONFIG = {
  OPENAI_API_KEY: 'sk-proj-your-actual-api-key-here',
  // ... other settings
};
```

### 2. Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in `config.js`

### 3. Rate Limiting

The chatbot includes built-in rate limiting to prevent 429 errors:
- Default delay: 2 seconds between requests
- Automatic retry with exponential backoff
- Dynamic delay adjustment based on server response

### 4. Security Features

- API key stored in separate `config.js` file
- `.gitignore` configured to prevent accidental commits
- No sensitive data in HTML files

## File Structure

```
├── index.html          # Main landing page
├── config.js           # API configuration (DO NOT COMMIT)
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Deployment

1. Make sure `config.js` contains your actual API key
2. Upload all files to your web server
3. Ensure `config.js` is accessible by the browser
4. Test the chatbot functionality

## Troubleshooting

### Common Issues

1. **"API key not set" error**
   - Check that `config.js` exists and contains your API key
   - Verify the API key is correct and active

2. **429 Rate Limit errors**
   - The chatbot will automatically retry with delays
   - Consider upgrading your OpenAI plan for higher limits

3. **Chatbot not loading**
   - Check browser console for JavaScript errors
   - Ensure `config.js` is accessible and properly formatted

### Rate Limiting

If you encounter frequent 429 errors, you can adjust the rate limiting settings in `config.js`:

```javascript
const CONFIG = {
  // ... other settings
  RATE_LIMIT_DELAY: 3000,  // Increase to 3 seconds
  MAX_RETRIES: 5,          // Increase retry attempts
  RETRY_DELAY: 10000       // Increase retry delay to 10 seconds
};
```

## Support

For issues with the chatbot functionality, check:
1. OpenAI API status
2. Your API key validity
3. Browser console for error messages

## License

This project is for ASKIMSPORT fitness coaching services.




