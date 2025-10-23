exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { action, data } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;
    const assistantId = 'asst_aFu6oqUDW0xmHflIZPgjVuZc';

    // Enhanced debugging
    console.log('=== CHATBOT FUNCTION DEBUG ===');
    console.log('Action:', action);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('Assistant ID:', assistantId);

    if (!apiKey) {
      console.error('❌ OpenAI API key not configured in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'OpenAI API key not configured' })
      };
    }

    const baseUrl = 'https://api.openai.com/v1';

    switch (action) {
      case 'createThread':
        return await createThread(baseUrl, apiKey);
      
      case 'addMessage':
        return await addMessage(baseUrl, apiKey, data.threadId, data.message);
      
      case 'runAssistant':
        return await runAssistant(baseUrl, apiKey, data.threadId, assistantId);
      
      case 'getMessages':
        return await getMessages(baseUrl, apiKey, data.threadId);
      
      case 'checkRunStatus':
        return await checkRunStatus(baseUrl, apiKey, data.threadId, data.runId);
      
      case 'runDirectChat':
        return await runDirectChat(baseUrl, apiKey, data.threadId, data.message);
      
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('Chatbot function error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      event: event.body
    });
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

async function createThread(baseUrl, apiKey) {
  try {
    const response = await fetch(`${baseUrl}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`Failed to create thread: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('createThread error:', error);
    throw error;
  }
}

async function addMessage(baseUrl, apiKey, threadId, message) {
  const response = await fetch(`${baseUrl}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role: 'user',
      content: message
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to add message: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

async function runAssistant(baseUrl, apiKey, threadId, assistantId) {
  try {
    console.log('Running assistant:', assistantId, 'for thread:', threadId);
    
    const response = await fetch(`${baseUrl}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI run assistant error:', response.status, errorText);
      
      // If assistant fails, try to use direct chat completion as fallback
      if (response.status >= 500) {
        console.log('Assistant failed, trying direct chat completion fallback...');
        return await runDirectChat(baseUrl, apiKey, threadId);
      }
      
      throw new Error(`Failed to run assistant: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Assistant run started:', data.id, 'Status:', data.status);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('runAssistant error:', error);
    
    // Try direct chat completion as fallback
    try {
      console.log('Trying direct chat completion fallback...');
      return await runDirectChat(baseUrl, apiKey, threadId);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error; // Throw original error
    }
  }
}

async function runDirectChat(baseUrl, apiKey, threadId) {
  // Get the last user message
  const messagesResponse = await fetch(`${baseUrl}/threads/${threadId}/messages`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2'
    }
  });

  if (!messagesResponse.ok) {
    throw new Error('Failed to get messages for fallback');
  }

  const messagesData = await messagesResponse.json();
  const lastUserMessage = messagesData.data.find(msg => msg.role === 'user');
  
  if (!lastUserMessage) {
    throw new Error('No user message found for fallback');
  }

  // Use direct chat completion
  const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Art R., a helpful AI assistant for web development and AI services. Be friendly and professional. Help users with questions about AI chatbots, web apps, and WordPress development. Guide them to contact Art for projects at temonaupw@gmail.com or https://calendly.com/temona007/intro-call'
        },
        {
          role: 'user',
          content: lastUserMessage.content[0].text.value
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!chatResponse.ok) {
    const errorText = await chatResponse.text();
    console.error('Direct chat failed:', chatResponse.status, errorText);
    
    // If it's a quota error, return a specific error message
    if (chatResponse.status === 429 && errorText.includes('insufficient_quota')) {
      throw new Error('insufficient_quota');
    }
    
    throw new Error(`Direct chat failed: ${chatResponse.status} ${errorText}`);
  }

  const chatData = await chatResponse.json();
  const assistantMessage = chatData.choices[0].message.content;

  // Add the assistant's response to the thread
  await fetch(`${baseUrl}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role: 'assistant',
      content: assistantMessage
    })
  });

  // Return a mock run object that's already completed
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 'fallback_run_' + Date.now(),
      status: 'completed',
      object: 'thread.run',
      created_at: Math.floor(Date.now() / 1000),
      assistant_id: 'fallback',
      thread_id: threadId,
      type: 'assistant.run',
      model: 'gpt-4o-mini',
      instructions: 'Fallback direct chat completion',
      tools: [],
      tool_resources: {},
      metadata: {},
      usage: chatData.usage
    })
  };
}

async function getMessages(baseUrl, apiKey, threadId) {
  const response = await fetch(`${baseUrl}/threads/${threadId}/messages`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

async function checkRunStatus(baseUrl, apiKey, threadId, runId) {
  const response = await fetch(`${baseUrl}/threads/${threadId}/runs/${runId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check run status: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}
