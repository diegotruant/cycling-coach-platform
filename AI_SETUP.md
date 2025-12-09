# AI Feature Configuration

## Setup Gemini AI for Workout Generation

The application uses Google's Gemini AI to generate personalized workouts. To enable this feature, you need to configure your API key.

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Configure Environment Variables

1. Create a file named `.env.local` in the project root
2. Add your API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Restart the Development Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Verifying Configuration

1. Navigate to `/coach/workouts`
2. Click "Crea con AI"
3. Fill in the workout parameters
4. Click "Genera Workout"
5. If configured correctly, the AI will generate a personalized workout

### Troubleshooting

**Error: "API key non configurata"**
- Make sure `.env.local` exists in the project root
- Verify the API key is correctly set
- Restart the dev server

**Error during generation**
- Check the console for detailed error messages
- Verify your API key is valid
- Check your internet connection
- Ensure you have available quota on your Gemini account

### Features Using AI

- ✨ **Workout Generation** - Creates personalized training sessions
- 🎯 **Mesocycle Planning** - Generates multi-week training plans
- 📊 **Medical Certificate Analysis** - Extracts expiration dates from uploads

### Cost & Limits

Gemini API offers a free tier with generous limits. Check the [Gemini API pricing page](https://ai.google.dev/pricing) for details.
