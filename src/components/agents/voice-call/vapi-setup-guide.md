# Setting Up Vapi for Agent Voice Testing

This guide will help you set up a Vapi assistant to work with the Agent Voice Testing feature.

## Prerequisites

1. A Vapi account (https://vapi.ai)
2. Your Vapi Public Key (already configured in the `.env` file)

## Step 1: Create a Vapi Assistant

1. Log in to your Vapi dashboard at https://dashboard.vapi.ai
2. Go to "Assistants" and click "Create new assistant"
3. Configure your assistant with the following settings:

### Basic Configuration

- **Name**: Match this with your agent's name for consistency
- **Model Provider**: OpenAI or another provider of your choice
- **Model**: GPT-4 recommended for best results

### System Instructions

For optimal results, provide system instructions that match your agent's role and capabilities. Here's a template:

```
You're a [ROLE] assistant named [NAME]. Your objective is to [OBJECTIVE].

Speak in a [FRIENDLY/PROFESSIONAL/CASUAL] tone. Keep your responses concise and focused on helping the user with their questions about [RELEVANT TOPICS].

Always introduce yourself as [NAME], the [ROLE]. If the user asks something outside your expertise, politely redirect them to topics you can help with.
```

Replace the placeholders with information from your agent configuration.

### Functions (Optional)

If your agent needs to perform specific actions, you can define functions that match these capabilities. For example:

```json
{
  "name": "scheduleDemo",
  "description": "Schedule a product demonstration",
  "parameters": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "The date for the demo (YYYY-MM-DD)"
      },
      "time": {
        "type": "string",
        "description": "The time for the demo (HH:MM AM/PM)"
      }
    }
  }
}
```

### First Message

Set a welcoming first message that introduces your assistant, such as:

```
Hi there! I'm [NAME], your [ROLE]. How can I help you today?
```

## Step 2: Get Your Assistant ID

1. After creating your assistant, you'll be taken to its detail page
2. Copy the Assistant ID from the page (it looks like `asst_abc123...`)
3. You can use this ID in the voice call feature to connect to your specific assistant

## Step 3: Test Your Integration

1. In Easy Agents, select an agent and click "Test Agent"
2. Choose "Voice Chat"
3. Click "Start Call" to begin testing

## Troubleshooting

### Common Issues and Solutions

#### Connection Errors

- **Call fails to connect**: 
  - Verify your Vapi Public Key in the .env file is correct
  - Check that you have an active internet connection
  - Ensure your Vapi account is active and not suspended
  - Try using a different browser to rule out browser-specific issues

#### Audio Issues

- **No audio output**: 
  - Check your browser's audio permissions (click the lock icon in your address bar)
  - Verify your speakers/headphones are working and not muted
  - Try refreshing the page and starting the call again
  - Some browsers require user interaction before allowing audio playback

#### Microphone Issues

- **Microphone not working**:
  - Make sure you've granted microphone permissions to the site
  - Check if your microphone is selected as the default input device
  - Try disconnecting and reconnecting your microphone
  - Speak clearly and at a normal volume

#### Assistant Configuration

- **Assistant ID errors**: 
  - Ensure you're using a valid assistant ID from your Vapi dashboard
  - Verify the assistant is properly configured with system instructions
  - Check that your Vapi account has sufficient credits/quota

#### Browser Compatibility

- **Browser compatibility issues**:
  - The Vapi Web SDK works best with Chrome, Edge, and Firefox
  - Safari may have limited functionality
  - Ensure your browser is up to date

### Advanced Troubleshooting

If you're still experiencing issues:

1. Open your browser's developer console (F12 or right-click > Inspect > Console)
2. Look for any error messages related to Vapi
3. Check if there are any network errors when connecting to the Vapi API
4. Try clearing your browser cache and cookies
5. Disable any browser extensions that might interfere with microphone access

## Next Steps

For more advanced configurations, including custom voices and multi-agent conversations, refer to the [Vapi documentation](https://docs.vapi.ai).
