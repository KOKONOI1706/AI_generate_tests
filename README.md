# English Quiz API

API for generating English quiz questions using OpenAI.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

3. Start server:
```bash
node server.js
```

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Deploy
