const Session = require("../models/Session");
const Question = require("../models/Question");

//@desc add addictional questions to an existing session 
//@route POST / api / questions / add
//@ access private

exports.addQuestionsToSession = async (req, res) => {
  try {
    const { sessionId, questions } = req.body;

    const normalizedQuestions = Array.isArray(questions)
      ? questions
          .map((item) => {
            if (typeof item === "string") {
              return { question: item.trim(), answer: "" };
            }

            if (item && typeof item === "object") {
              return {
                question: String(item.question || item.q || "").trim(),
                answer: String(item.answer || item.a || "").trim(),
              };
            }

            return null;
          })
          .filter((item) => item && item.question)
      : [];

    if (!sessionId || !normalizedQuestions.length) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Create new questions
    const createdQuestions = await Question.insertMany(
      normalizedQuestions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer,
      }))
    );

    // Update session to include new question IDs
    session.questions.push(...createdQuestions.map((q) => q._id));
    await session.save();

    res.status(201).json(createdQuestions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


//@ desc pinned or unpinned question 
//@route POST / api / questions / : id / pin 
//access private

exports.togglePinQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    question.isPinned = !question.isPinned;
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc Update a note for a question 
//@route /POST /api/questions/:id/note
//@access private

exports.updateQuestionNote = async (req, res) => {
  try {
    const { note } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    question.note = note || "";
    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
