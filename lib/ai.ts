const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number; // 0-based index of the correct option
}

export async function generateBookQuiz(title: string, author: string): Promise<QuizQuestion[] | null> {
  if (!OPENAI_API_KEY) {
    console.warn('Missing EXPO_PUBLIC_OPENAI_API_KEY');
    return null;
  }

  const prompt = `You are a literature expert. Generate a 7-question multiple-choice quiz about the book "${title}" by ${author}. 
The questions should test basic reading comprehension and plot knowledge to prove the user actually read it.
Return ONLY a raw JSON array. DO NOT wrap it in markdown block quotes. The array must contain exactly 7 objects with this exact structure:
[{ "question": "Question text here?", "options": ["A", "B", "C", "D"], "correctIndex": 1 }]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // fast, cheap, perfect for this
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI API Error:', response.status);
      return null;
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Strip markdown code blocks if the model ignored our instruction
    if (content.startsWith('```json')) content = content.replace('```json', '');
    if (content.startsWith('```')) content = content.replace('```', '');
    if (content.endsWith('```')) content = content.slice(0, -3);
    
    return JSON.parse(content.trim()) as QuizQuestion[];
  } catch (error) {
    console.warn('Failed to parse or fetch quiz', error);
    return null;
  }
}
