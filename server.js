require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware to parse JSON
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Endpoint to analyze card content
app.post('/analyze', async (req, res) => {
  
  try {
    const { cardName, cardDescription } = req.body;
    
    const prompt = `
      You are a professional trello task analyzer. 
      We are a software company making web applications. 
      Your job is to read thoroughly this trello card and come up with questions I missed. 
      There are things that I forgot to ask, or are not clear from this card. What are they? Make a list. 
      If there arent any questions I missed, do not write nonsense, instead just say that its okay.
      Do not stray too far into theroretical questions. 
      Do not use emoji.
      Do not write anything except for the list.
      Do not write descriptions, just write list points.
      Do not generate way too many questions.
      Select the most important 5-10 questions I missed.

      <CARD>
        <NAME>${cardName}</NAME>
        <DESCRIPTION>${cardDescription}</DESCRIPTION>
      </CARD>
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: 'questions',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            },
            additionalProperties: false,
            required: ['items']
          }
        }
      }
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response);
    
    res.json({ analysis: parsedResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to analyze card' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 