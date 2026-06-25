const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Multer setup for PDF upload (increase file size limit to 10MB)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload resume and extract text
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (err) {
    console.error('PDF parse error:', err); // Add detailed logging
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

// Randomly select context for question
function pickContext({ resumeText, topic, previousAnswers }) {
  const options = [];
  if (resumeText) options.push('resume');
  if (topic) options.push('topic');
  if (previousAnswers && previousAnswers.length > 0) options.push('previous');
  if (options.length === 0) return 'topic';
  return options[Math.floor(Math.random() * options.length)];
}

// IMPORTANT: Make sure @google/generative-ai is up to date for Gemini 1.5 support
// npm install @google/generative-ai@latest
router.post('/question', async (req, res) => {
  const { topic, previousAnswers, resumeText, previousQuestions, currentQuestionCount } = req.body;
  // Quick fallback question to avoid blocking frontend when AI is unavailable
  const FALLBACK_QUESTIONS = [
    'Explain the difference between synchronous and asynchronous code in JavaScript.',
    'What are the key principles of object-oriented programming?',
    'How would you optimize a slow-performing web application?',
    'Describe the differences between SQL and NoSQL databases.',
    'What is the importance of version control in software development?',
    'Explain the concept of RESTful APIs and their advantages.'
  ];
  
  // Always use resume context for first question if resumeText is present and no previous answers
  let contextType = pickContext({ resumeText, topic, previousAnswers });
  if (resumeText && (!previousAnswers || previousAnswers.length === 0)) {
    contextType = 'resume';
  }
  let prompt = '';
  // Build list of questions to avoid
  const questionsToAvoid = (previousQuestions || []).filter(q => q && q.trim().length > 0);
  const avoidanceClause = questionsToAvoid.length > 0 
    ? `\n\nIMPORTANT: Do NOT ask any of these previously asked questions or similar variations:\n${questionsToAvoid.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\nEnsure your question is completely different and unique.`
    : '';
  if (contextType === 'resume') {
    prompt = `
      You are a highly experienced technical interviewer for a ${topic} position.
      The candidate's resume is below:
      -----
      ${resumeText}
      -----
      Ask a challenging, relevant, and non-generic interview question that tests their real knowledge or experience, based on their resume.
      Do NOT ask about things not present in the resume.
      Only output the question, nothing else.${avoidanceClause}
    `;
  } else if (contextType === 'previous') {
    prompt = `
      You are a highly experienced technical interviewer for a ${topic} position.
      The candidate previously answered: "${previousAnswers[previousAnswers.length - 1]}".
      Based on their answer, ask a deeper or follow-up question to test their understanding.
      Only output the question, nothing else.${avoidanceClause}
    `;
  } else {
    prompt = `
      You are a highly experienced technical interviewer for a ${topic} position.
      Ask a challenging, relevant, and non-generic interview question for this role.
      Focus on practical scenarios, problem-solving, or technical concepts.
      Only output the question, nothing else.${avoidanceClause}
    `;
  }
  console.log('Gemini prompt:', prompt);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const result = await model.generateContent(prompt);
    const question = result.response.text();
    res.json({ question });
  } catch (err) {
    // Log as much detail as possible for debugging
    console.error('Gemini API error:', err && err.stack ? err.stack : err);
    if (err.response) console.error('Gemini response data:', err.response.data || err.response);
    // Return a fallback question so the UI can continue to function
    console.warn('Returning fallback question due to Gemini API error');
    const questionIndex = Math.min((currentQuestionCount || 1) - 1, FALLBACK_QUESTIONS.length - 1);
    return res.json({ question: FALLBACK_QUESTIONS[questionIndex] });
  }
});

// Generate interview performance report
router.post('/report', async (req, res) => {
  res.status(501).json({ error: 'Interview report generation is not implemented. Please use the main AI endpoints.' });
});

// Helper function to find the most frequent value in an array
function mode(array) {
  if (array.length === 0) return null;
  return array.sort((a,b) =>
    array.filter(v => v === a).length - array.filter(v => v === b).length
  ).pop();
}

module.exports = router;