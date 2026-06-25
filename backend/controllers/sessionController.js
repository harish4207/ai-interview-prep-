const Session = require("../models/Session");
const Question = require("../models/Question");

const normalizeQuestions = (questionsInput) => {
  if (!questionsInput) return [];

  if (Array.isArray(questionsInput)) {
    return questionsInput
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
      .filter((item) => item && item.question);
  }

  if (typeof questionsInput === "string") {
    const parsed = questionsInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^```/.test(line))
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean)
      .map((question) => ({ question, answer: "" }));

    return parsed;
  }

  if (questionsInput.questions) {
    return normalizeQuestions(questionsInput.questions);
  }

  return [];
};

// @desc     Create a new session and linked questions
// @route    POST /api/sessions/create
// @access   Private
exports.createSession = async (req, res) => {
   try {
    const { role, experience, topicsToFocus, description, questions } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const normalizedQuestions = normalizeQuestions(questions);

    if (!role || !experience || !topicsToFocus) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const session = await Session.create({
      user: userId,
      role,
      experience,
      topicsToFocus,
      description,
    });

    const questionDocs = normalizedQuestions.length
      ? await Promise.all(
          normalizedQuestions.map(async (q) => {
            const question = await Question.create({
              session: session._id,
              question: q.question,
              answer: q.answer || "",
            });
            return question._id;
          })
        )
      : [];

    session.questions = questionDocs;
    await session.save();

    const populatedSession = await Session.findById(session._id).populate("questions");

    res.status(201).json({ success: true, session: populatedSession });
   }catch (error) {
    console.error("createSession error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc     Get all sessions for the logged-in user
// @route    GET /api/sessions/my-sessions
// @access   Private
// @desc    Get user's sessions
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("questions");

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc     Get a session by ID with populated questions
// @route    GET /api/sessions/:id
// @access   Private
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({
        path: "questions",
        options: { sort: { isPinned: -1, createdAt: 1 } },
      })
      .exec();

    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc     Delete a session and its questions
// @route    DELETE /api/sessions/:id
// @access   Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if the logged-in user owns this session
    if (session.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this session" });
    }

    // First, delete all questions linked to this session
    await Question.deleteMany({ session: session._id });

    // Then, delete the session
    await session.deleteOne();

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

