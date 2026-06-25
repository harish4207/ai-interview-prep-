/**
 * @desc    Generate an interview performance report using Groq
 * @route   POST /api/ai/generate-report
 * @access  Private
 */
const generateInterviewReport = async (req, res) => {
  try {
    const { topic, qaPairs, engagementAnalysis } = req.body;
    let qaText = qaPairs.map((qa, i) => `Q${i+1}: ${qa.question}\nA${i+1}: ${qa.answer}`).join('\n');
    // Process engagement data
    let engagementSummary = '';
    if (engagementAnalysis) {
      const emotions = engagementAnalysis.engagementLog.map(log => log.emotion);
      const attentionStates = engagementAnalysis.engagementLog.map(log => log.attention);
      const dominantEmotion = emotions.length ? emotions.sort((a,b) => emotions.filter(v => v===a).length - emotions.filter(v => v===b).length).pop() : 'Neutral';
      const attentionPercentage = attentionStates.length ? (attentionStates.filter(state => state === 'focused').length / attentionStates.length) * 100 : 0;
      engagementSummary = `\nEngagement Analysis:\n- Dominant Emotion: ${dominantEmotion || 'Neutral'}\n- Attention Level: ${attentionPercentage.toFixed(1)}% focused during interview\n- Eye Contact: ${attentionPercentage > 80 ? 'Excellent' : attentionPercentage > 60 ? 'Good' : 'Needs Improvement'}`;
    }
    const prompt = `You are a senior technical interviewer. Here are ${qaPairs.length} interview questions and the candidate's answers for a ${topic} position:\n${qaText}\n\nAdditional Behavioral Analysis:${engagementSummary}\n\nPlease provide a detailed, constructive report on the candidate's performance, including:\n1. Technical assessment based on their answers\n2. Communication and behavioral analysis based on the engagement data\n3. Specific strengths and weaknesses\n4. Areas for improvement\n5. Overall recommendation (Strong Hire/Hire/No Hire/Strong No Hire)\n\nBe specific, professional, and constructive. Only output the report, nothing else.`;
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );
    const report = groqRes.data.choices[0].message.content;
    res.status(200).json({ report });
  } catch (error) {
    console.error("Groq API error (report):", error);
    res.status(500).json({ error: 'Failed to generate report.', details: error });
  }
};
const axios = require("axios");
const { conceptExplainPrompt, questionAnswerPrompt } = require("../utils/prompts");
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// @desc    Generate interview questions and answers using Groq
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;
    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const prompt = `Generate ${numberOfQuestions} interview questions for a ${role} with ${experience} years of experience focusing on ${topicsToFocus}.`;
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const answer = groqRes.data.choices[0].message.content;
    res.status(200).json({ questions: answer });
  } catch (error) {
    console.error("Groq API error (full):", error);
    res.status(500).json({
      message: "Failed to generate questions",
      error: error,
    });
  }
};

/**
 * @desc    Generate explains a interview question
 * @route   POST /api/ai/generate-explanation
 * @access  Private
 */
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const prompt = conceptExplainPrompt(question);
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );
    const answer = groqRes.data.choices[0].message.content;
    res.status(200).json({ explanation: answer });
  } catch (error) {
    console.error("Groq API error (full):", error);
    res.status(500).json({
      message: "Failed to generate questions",
      error: error,
    });
  }
};


module.exports = { generateInterviewQuestions, generateConceptExplanation, generateInterviewReport };
