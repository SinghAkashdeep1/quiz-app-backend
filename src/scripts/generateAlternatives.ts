import mongoose from 'mongoose';
import Question from '../models/Question';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateAlternatives() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const questions = await Question.find({ 
      $or: [
        { alternatives: { $exists: false } },
        { alternatives: { $size: 0 } }
      ]
    });

    console.log(`Found ${questions.length} questions without alternatives.`);

    if (questions.length === 0) {
      console.log('Nothing to do. Exiting.');
      return;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`[${i+1}/${questions.length}] Generating more questions for: "${q.text?.substring(0, 50) || 'Image Question'}..."`);

      const prompt = `You are a professional quiz master. 
Your task is to generate TWO (2) additional, high-quality questions that are similar in topic and difficulty to the provided question.

ORIGINAL QUESTION DATA:
- Category ID: ${q.categoryId}
- Type: ${q.type}
- Text: "${q.text || 'N/A'}"
- Options: ${q.options?.join(', ') || 'N/A'}
- Correct Answer Index: ${q.correctAnswerIndex ?? 'N/A'}
- Difficulty: ${q.difficulty}

INSTRUCTIONS:
1. The new questions MUST be of the SAME type (${q.type}) and difficulty (${q.difficulty}).
2. They MUST be about the same general topic but have different wording and options.
3. Return a JSON object containing an array of TWO new questions matching the Question schema.

SCHEMA FOR RESPONSE:
{
  "newQuestions": [
    {
      "categoryId": "${q.categoryId}",
      "type": "${q.type}",
      "text": "Question 1 text",
      "options": ["Option 1", "Option 2", ...],
      "correctAnswerIndex": 0,
      "difficulty": "${q.difficulty}",
      "isAlternative": true
    },
    ...
  ]
}`;

      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleaned = responseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.newQuestions && Array.isArray(parsed.newQuestions)) {
          for (const newQData of parsed.newQuestions) {
            const newQ = new Question({
              ...newQData,
              isAlternative: true,
              weightage: q.difficulty === 'easy' ? 10 : (q.difficulty === 'medium' ? 20 : 50),
              timeLimit: q.difficulty === 'easy' ? 15 : (q.difficulty === 'medium' ? 30 : 45),
            });
            await newQ.save();
          }
          console.log(`Successfully added 2 new questions to the pool for category: ${q.categoryId}`);
        }
        
        // Respect rate limits (Flash tier)
        await delay(5000); 
      } catch (err: any) {
        console.error(`Failed for question ${q._id}:`, err.message);
        if (err.message.includes('429')) {
          console.log('Rate limit hit, waiting 30 seconds...');
          await delay(30000);
          i--; // Retry
        }
      }
    }

    console.log('Alternative generation process completed successfully!');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

generateAlternatives();
