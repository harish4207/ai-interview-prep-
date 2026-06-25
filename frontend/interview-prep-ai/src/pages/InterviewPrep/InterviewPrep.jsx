import React, { useRef, useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import moment from "moment";
import { AnimatePresence, motion } from "framer-motion";
import { LuCircleAlert, LuListCollapse } from "react-icons/lu";
import SpinnerLoader from "../../components/Loader/SpinnerLoader";
import { toast } from "react-hot-toast";
import DashboardLayout from '../../components/layouts/DashboardLayout';
import RoleInfoHeader from './components/RoleInfoHeader';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import QuestionCard from '../../components/Cards/QuestionCard';
import Drawer from '../../components/Drawer';
import SkeletonLoader from '../../components/Loader/SkeletonLoader';
import AIResponsePreview from './components/AIResponsePreview';
import WebcamFeed from './components/WebcamFeed';


export default function InterviewPrep() {
  const { sessionId } = useParams(); 

const [sessionData, setSessionData] = useState(null);
const [errorMsg, setErrorMsg] = useState("");

const [openLearnMoreDrawer, setOpenLearnMoreDrawer] = useState(false);
const [explanation, setExplanation] = useState(null);

const [isLoading, setIsLoading] = useState(false);
const [isUpdateLoader, setIsUpdateLoader] = useState(false);
const [autoRead, setAutoRead] = useState(false); // NEW: auto-read toggle
const [autoReadIndex, setAutoReadIndex] = useState(null); // Track which question is being read
const [interviewMode, setInterviewMode] = useState(false);
const [cameraActive, setCameraActive] = useState(false);
// AI-driven Q&A state
const [topic, setTopic] = useState('Frontend Developer');
const [currentQuestion, setCurrentQuestion] = useState('');
const [previousAnswers, setPreviousAnswers] = useState([]);
const [answerInput, setAnswerInput] = useState('');
const [isFetchingQuestion, setIsFetchingQuestion] = useState(false);
const [fetchError, setFetchError] = useState(null);
const [resumeFile, setResumeFile] = useState(null);
const [resumeText, setResumeText] = useState('');

// Voice Q&A state
const [isSpeaking, setIsSpeaking] = useState(false);
const [isRecording, setIsRecording] = useState(false);
const recognitionRef = useRef(null);

const [qaPairs, setQaPairs] = useState([]);
const [showReport, setShowReport] = useState(false);
const [report, setReport] = useState('');
const [isGeneratingReport, setIsGeneratingReport] = useState(false);

// Face analysis state
const [faceAnalysis, setFaceAnalysis] = useState({ faceCount: 0, emotion: null, attention: null, posture: null });
const [engagementLog, setEngagementLog] = useState([]);
const [feedback, setFeedback] = useState('');


// Fetch session data by session ID
// Fetch session data by session id
const fetchSessionDetailsById = async () => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.SESSION.GET_ONE(sessionId)
    );

    if (response.data && response.data.session) {
      setSessionData(response.data.session);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};


// Generate Concept Explanation
const generateConceptExplanation = async (question) => {
  try {
    setErrorMsg("");
    setExplanation(null);

    setIsLoading(true);
    setOpenLearnMoreDrawer(true);

    const response = await axiosInstance.post(
      API_PATHS.AI.GENERATE_EXPLANATION,
      {
        question,
      }
    );

    if (response.data) {
      setExplanation(response.data);
    }
  } catch (error) {
    setExplanation(null);
    setErrorMsg("Failed to generate explanation, Try again later");
    console.error("Error:", error);
  } finally {
    setIsLoading(false);
  }
};


// Pin Question
const toggleQuestionPinStatus = async (questionId) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.QUESTION.PIN(questionId)
    );

    console.log(response);

    if (response.data && response.data.question) {
      // toast.success('Question Pinned Successfully')
      fetchSessionDetailsById();
    }
  } catch (error) {
    console.error("Error:", error);
  }
};


// Add more questions to a session
const uploadMoreQuestions = async () => {
  try {
    setIsUpdateLoader(true);

    // Call AI API to generate questions
    const aiResponse = await axiosInstance.post(
      API_PATHS.AI.GENERATE_QUESTIONS,
      {
        role: sessionData?.role,
        experience: sessionData?.experience,
        topicsToFocus: sessionData?.topicsToFocus,
        numberOfQuestions: 6, // changed from 10 to 6
      }
    );
    const generatedQuestions = aiResponse.data;

const response = await axiosInstance.post(
  API_PATHS.QUESTION.ADD_TO_SESSION,
  {
    sessionId,
    questions: generatedQuestions,
  }
);

if (response.data) {
  toast.success("Added More Q&A!!");
  fetchSessionDetailsById();
} 
}catch (error) {
  if (error.response && error.response.data.message) {
    setError(error.response.data.message);
  } else {
    setError("Something went wrong. Please try again.");
  }
  }finally{
    setIsUpdateLoader(false);
  }
};

useEffect(() => {
  if (sessionId) {
    fetchSessionDetailsById();
  }

  return () => {};
}, []);

// Reset autoReadIndex if autoRead is turned off or questions change
useEffect(() => {
  if (!autoRead || !sessionData?.questions?.length) {
    setAutoReadIndex(null);
  } else {
    setAutoReadIndex(0);
  }
}, [autoRead, sessionData?.questions]);

// Reset current question index if questions change
useEffect(() => {
  // setCurrentQuestionIdx(0); // This line is removed as per the edit hint
}, [sessionData?.questions]);

// Handler for when a question finishes TTS
const handleTTSFinish = () => {
  if (sessionData?.questions && autoReadIndex !== null && autoReadIndex < sessionData.questions.length - 1) {
    setAutoReadIndex(autoReadIndex + 1);
  } else {
    setAutoReadIndex(null); // End of questions
  }
}

  // Handle resume upload
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
    } else {
      setResumeFile(null);
      alert('Please upload a PDF file.');
    }
  };

  // Upload resume and get text before starting interview
  const uploadResumeAndGetText = async () => {
    if (!resumeFile) return '';
    const formData = new FormData();
    formData.append('resume', resumeFile);
    try {
      const res = await axiosInstance.post('/api/interview/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.text || '';
    } catch (err) {
      alert('Failed to process resume. Starting without resume context.');
      return '';
    }
  };

  // Centralized fetch logic for questions (initial and subsequent)
  const fetchQuestion = async (previousAnswersArr = []) => {
    // Deduplication + retry logic
    setIsFetchingQuestion(true);
    setFetchError(null);
    
    // Improved normalization function
    const normalize = (s) => {
      if (!s) return '';
      return s.toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' '); // Normalize whitespace
    };
    
    const seen = new Set();
    // Include previously asked questions and current question
    qaPairs.forEach(q => {
      if (q.question) {
        seen.add(normalize(q.question));
      }
    });
    if (currentQuestion) {
      seen.add(normalize(currentQuestion));
    }

    // Include previous questions in the request to help backend avoid duplicates
    const previousQuestions = qaPairs.map(q => q.question).filter(Boolean);
    if (currentQuestion) {
      previousQuestions.push(currentQuestion);
    }

    const maxRetries = 5; // Increased retry attempts
    let attempt = 0;
    try {
      while (attempt < maxRetries) {
        attempt++;
        console.log(`Fetching question - attempt ${attempt}/${maxRetries}`);
        
        const res = await axiosInstance.post('/api/interview/question', {
          topic,
          previousAnswers: previousAnswersArr,
          resumeText,
          previousQuestions, // Send previous questions to backend for deduplication
          currentQuestionCount: qaPairs.length + 1
        });

        if (res && res.data && res.data.question) {
          const q = res.data.question.trim();
          const normalizedQ = normalize(q);
          
          // Check for duplicates with more sophisticated matching
          let isDuplicate = false;
          for (const seenQuestion of seen) {
            if (normalizedQ === seenQuestion || 
                (normalizedQ.length > 20 && seenQuestion.length > 20 && 
                 normalizedQ.includes(seenQuestion.substring(0, 20)) ||
                 seenQuestion.includes(normalizedQ.substring(0, 20)))) {
              isDuplicate = true;
              break;
            }
          }
          
          // If duplicate and we can retry, wait and retry
          if (isDuplicate && attempt < maxRetries) {
            console.warn('Duplicate question detected, retrying...', { 
              attempt, 
              question: q.substring(0, 50) + '...',
              normalizedQ: normalizedQ.substring(0, 50) + '...'
            });
            // Exponential backoff
            await new Promise(r => setTimeout(r, 500 * attempt));
            continue;
          }

          // Accept the question
          setCurrentQuestion(q);
          setFetchError(null);
          console.log('Question accepted:', q.substring(0, 50) + '...');
          return;
        } else {
          throw new Error('No question returned from server');
        }
      }

      // If control reaches here, all attempts failed or duplicates persisted
      console.error('Failed to get unique question after', maxRetries, 'attempts');
      setCurrentQuestion('');
      setFetchError('Unable to generate a unique question. Please try again.');
      toast.error('Unable to generate a unique question. Please try again.');
    } catch (err) {
      console.error('Question fetch error:', err);
      setCurrentQuestion('');
      setFetchError('Failed to load question. Please try again.');
      toast.error('Failed to load question. Please try again.');
    } finally {
      setIsFetchingQuestion(false);
    }
  };

  // Fetch first question when interview starts (now uses fetchQuestion)
  const startAIInterview = async () => {
    setPreviousAnswers([]);
    setAnswerInput('');
    let resumeTextValue = resumeText;
    if (resumeFile && !resumeText) {
      resumeTextValue = await uploadResumeAndGetText();
      setResumeText(resumeTextValue);
    }
    // Ensure resumeText state is current when fetching (always from resume if present)
    await fetchQuestion([]); 
  };

  // Fetch next question after answer (now with resumeText)
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerInput.trim()) {
      toast.error('Please provide an answer before submitting.');
      return;
    }
    
    const updatedAnswers = [...previousAnswers, answerInput];
    const newQaPairs = [...qaPairs, { question: currentQuestion, answer: answerInput }];
    
    setPreviousAnswers(updatedAnswers);
    setQaPairs(newQaPairs);
    setAnswerInput('');
    
    // Check if we've reached the target number of questions
    if (newQaPairs.length >= 6) {
      // Auto-generate report after 6 questions
      toast.success('Interview completed! Generating your performance report...');
      setTimeout(() => {
        handleGenerateReport();
      }, 1000);
    } else {
      // Fetch next question
      await fetchQuestion(updatedAnswers); // always use previous answer context
    }
  };

  // Generate report after 10 questions
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      console.log('Generating report with data:', {
        topic,
        qaPairsCount: qaPairs.length,
        hasEngagementData: Boolean(faceAnalysis && engagementLog.length)
      });
      
      const res = await axiosInstance.post('/api/interview/report', {
        topic,
        qaPairs,
        engagementAnalysis: {
          faceAnalysis,
          engagementLog
        }
      });
      
      console.log('Report generated:', res.data);
      if (res.data && res.data.report) {
        setReport(res.data.report);
        setShowReport(true);
        toast.success('Report generated successfully!');
      } else {
        throw new Error('No report data received');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      toast.error('Failed to generate report: ' + (err.response?.data?.error || err.message));
      setReport('Failed to generate report. Please try again.');
      setShowReport(true);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Play question using TTS
  const handleSpeakQuestion = () => {
    if (!currentQuestion) return;
    const utterance = new window.SpeechSynthesisUtterance(currentQuestion);
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Record answer using SpeechRecognition
  const handleRecordAnswer = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Allow live updates
    recognition.maxAlternatives = 1;
    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setAnswerInput((finalTranscript + interimTranscript).trim());
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  };

  // Stop speech recognition if needed
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle face analysis updates
  const handleFaceAnalysis = (data) => {
    setFaceAnalysis(data);
    // Real-time feedback
    if (data.faceCount === 0) {
      setFeedback('No face detected. Please stay in view of the camera.');
    } else if (data.faceCount > 1) {
      setFeedback('Multiple faces detected! Please ensure only you are in the frame.');
    } else if (data.attention === 'not_focused') {
      setFeedback('Please stay focused on the interview.');
    } else if (data.posture === 'slouching') {
      setFeedback('Try to sit upright for a confident posture.');
    } else {
      setFeedback('');
    }
  };
  // Log engagement per question
  useEffect(() => {
    if (cameraActive && currentQuestion && faceAnalysis.faceCount > 0) {
      setEngagementLog((log) => [
        ...log,
        {
          question: currentQuestion,
          emotion: faceAnalysis.emotion,
          attention: faceAnalysis.attention,
          posture: faceAnalysis.posture,
          timestamp: Date.now(),
        },
      ]);
    }
    // eslint-disable-next-line
  }, [currentQuestion]);

  // Reset AI interview state when toggling off
  useEffect(() => {
    if (!interviewMode) {
      setCameraActive(false);
      setCurrentQuestion('');
      setPreviousAnswers([]);
      setAnswerInput('');
      setResumeFile(null);
      setResumeText('');
    }
  }, [interviewMode]);

  return (
    <div className="bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#1e293b] min-h-screen">
      <DashboardLayout>
        <RoleInfoHeader
          role={sessionData?.role || ""}
          topicsToFocus={sessionData?.topicsToFocus || ""}
          experience={sessionData?.experience || "-"}
          questions={sessionData?.questions?.length || "-"}
          description={sessionData?.description || ""}
          lastUpdated={
            sessionData?.updatedAt
              ? moment(sessionData.updatedAt).format("Do MMM YYYY")
              : ""
          }
        />
        <div className="container max-w-[1400px] mx-auto pt-8 pb-8 md:px-0 ">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#38bdf8] tracking-tight">Interview Q & A</h2>
          {/* Interview mode toggle */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="interview-mode-toggle"
              checked={interviewMode}
              onChange={e => setInterviewMode(e.target.checked)}
              className="accent-cyan-600"
            />
            <label htmlFor="interview-mode-toggle" className="text-sm text-slate-100 select-none cursor-pointer">
              Realistic Face-to-Face Interview Mode
            </label>
          </div>
          {interviewMode ? (
            <div className="flex flex-col items-center">
              {/* Topic selection and resume upload before starting */}
              {!cameraActive && (
                <div className="mb-4 w-full max-w-md mx-auto bg-[#1e293b]/80 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center shadow-lg">
                  <label className="block text-sm font-medium mb-1 text-white">Select Topic/Job:</label>
                  <input
                    type="text"
                    className="border border-cyan-400 rounded px-3 py-2 w-full mb-4 bg-transparent text-white placeholder:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    disabled={cameraActive}
                  />
                  <label className="block text-sm font-medium mb-1 text-white">Upload Resume (PDF):</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    disabled={cameraActive}
                    className="mb-2 text-white file:bg-cyan-600 file:text-white file:rounded file:px-3 file:py-1 file:border-0 file:mr-3"
                  />
                  {resumeFile && <div className="text-xs text-cyan-200 mb-2">{resumeFile.name}</div>}
                </div>
              )}
              {!cameraActive ? (
                <button
                  className="mb-4 px-8 py-3 rounded-full font-bold shadow-lg bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] text-white text-lg hover:scale-105 transition-transform disabled:opacity-60"
                  onClick={async () => {
                    setCameraActive(true);
                    await startAIInterview();
                  }}
                  disabled={isFetchingQuestion}
                >
                  Start Interview (Camera On)
                </button>
              ) : (
                <WebcamFeed isActive={cameraActive} onFaceAnalysis={handleFaceAnalysis} />
              )}
              {/* AI Q&A UI */}
              {cameraActive && (
                <div className="w-full max-w-4xl bg-white rounded-2xl p-8 mb-4 flex flex-col items-center">
                  <div className="text-lg font-bold text-blue-800 mb-2">Virtual Interviewer</div>
                  {/* Engagement meter and feedback */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-24 h-4 rounded-full ${faceAnalysis.attention === 'focused' ? 'bg-green-400' : 'bg-yellow-400'} mb-1`}></div>
                      <span className="text-xs text-gray-600">{faceAnalysis.attention === 'focused' ? 'Focused' : 'Not Focused'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-24 h-4 rounded-full ${faceAnalysis.faceCount === 1 ? 'bg-blue-400' : faceAnalysis.faceCount > 1 ? 'bg-red-400' : 'bg-gray-300'} mb-1`}></div>
                      <span className="text-xs text-gray-600">{faceAnalysis.faceCount === 1 ? '1 Face' : faceAnalysis.faceCount > 1 ? 'Multiple Faces' : 'No Face'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-4 rounded-full bg-purple-300 mb-1"></div>
                      <span className="text-xs text-gray-600">{faceAnalysis.emotion ? faceAnalysis.emotion.charAt(0).toUpperCase() + faceAnalysis.emotion.slice(1) : 'No Emotion'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-24 h-4 rounded-full ${faceAnalysis.posture === 'upright' ? 'bg-green-400' : faceAnalysis.posture === 'slouching' ? 'bg-orange-400' : 'bg-gray-300'} mb-1`}></div>
                      <span className="text-xs text-gray-600">{faceAnalysis.posture ? faceAnalysis.posture.charAt(0).toUpperCase() + faceAnalysis.posture.slice(1) : 'No Posture'}</span>
                    </div>
                  </div>
                  {feedback && <div className="mb-4 text-sm text-red-600 font-semibold">{feedback}</div>}
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      type="button"
                      onClick={handleSpeakQuestion}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-sm bg-gradient-to-r from-[#2563eb] via-[#38bdf8] to-[#06b6d4] text-white text-lg transition-all duration-200 hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 ${isSpeaking ? 'animate-pulse' : ''}`}
                      disabled={isSpeaking || !currentQuestion}
                    >
                      {isSpeaking ? 'Speaking...' : <><span className="text-xl">🔊</span> Speak Question</>}
                    </button>
                    <button
                      type="button"
                      onClick={handleRecordAnswer}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-sm bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#06b6d4] text-white text-lg transition-all duration-200 hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60 ${isRecording ? 'animate-pulse' : ''}`}
                      disabled={isRecording}
                    >
                      {isRecording ? 'Listening...' : <><span className="text-xl">🎤</span> Record Answer</>}
                    </button>
                  </div>
                  <div className="text-base text-gray-900 mb-4 min-h-[48px]">
                    {isFetchingQuestion ? (
                      'Loading question...'
                    ) : fetchError ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-red-600 font-medium">{fetchError}</div>
                        <button
                          onClick={() => fetchQuestion(previousAnswers)}
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      currentQuestion
                    )}
                  </div>
                  <form onSubmit={handleSubmitAnswer} className="w-full flex flex-col items-center">
                    <input
                      type="text"
                      className="border rounded px-3 py-2 w-full max-w-md mb-2"
                      placeholder="Type your answer here..."
                      value={answerInput}
                      onChange={e => setAnswerInput(e.target.value)}
                      disabled={isFetchingQuestion}
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full font-bold shadow-md bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] text-white text-base hover:scale-105 transition-transform disabled:opacity-60"
                      disabled={isFetchingQuestion || !answerInput || qaPairs.length >= 6}
                    >
                      Submit Answer
                    </button>
                  </form>
                  {/* Show report button after 6 questions or manual generation */}
                  {qaPairs.length >= 6 && !showReport && (
                    <div className="mt-6 text-center">
                      <p className="text-gray-700 mb-2">Interview completed! ({qaPairs.length}/6 questions)</p>
                      <button
                        className="px-6 py-2 rounded-full font-bold shadow-md bg-gradient-to-r from-indigo-700 to-indigo-800 text-white text-base hover:scale-105 transition-transform disabled:opacity-60"
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                      >
                        {isGeneratingReport ? 'Generating Report...' : 'Generate Performance Report'}
                      </button>
                    </div>
                  )}
                  
                  {/* Progress indicator */}
                  {qaPairs.length < 6 && (
                    <div className="mt-4 text-center">
                      <div className="text-sm text-gray-600 mb-2">Progress: {qaPairs.length}/6 questions completed</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(qaPairs.length / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {/* Show report modal/section */}
                  {showReport && (
                    <div className="mt-8 w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
                      <div className="text-2xl font-bold text-indigo-700 mb-2">Interview Performance Report</div>
                      <div className="whitespace-pre-line text-gray-800">{report}</div>
                      <button
                        className="mt-4 px-4 py-2 rounded-full font-bold shadow-md bg-gray-400 text-white text-base hover:scale-105 transition-transform disabled:opacity-60"
                        onClick={() => setShowReport(false)}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
    <>
      {/* Auto-read toggle */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="auto-read-toggle"
          checked={autoRead}
          onChange={e => setAutoRead(e.target.checked)}
          className="accent-cyan-600"
        />
        <label htmlFor="auto-read-toggle" className="text-sm text-slate-100 select-none cursor-pointer">
          Auto-read next question
        </label>
      </div>
      <div className="grid grid-cols-12 gap-4 mt-5 mb-10 bg-[#0f172a] bg-opacity-80 rounded-xl p-4">
        <div
          className={`col-span-12 ${openLearnMoreDrawer ? "md:col-span-7" : "md:col-span-8"}`}
        >
          <AnimatePresence>
            {sessionData?.questions?.map((data, index) => {
              return (
                <motion.div
                  key={data._id || index}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                    delay: index * 0.1,
                    damping: 15,
                  }}
                  layout // This is the key prop that animates position changes
                  layoutId={`question-${data._id || index}`} // Helps framer trac
                >
                  <>
                    <QuestionCard
                      question={data?.question}
                      answer={data?.answer}
                      onLearnMore={() =>
                        generateConceptExplanation(data.question)
                      }
                      isPinned={data?.isPinned}
                      onTogglePin={() => toggleQuestionPinStatus(data._id)}
                      autoRead={autoRead}
                      autoReadIndex={autoRead ? autoReadIndex !== null ? autoReadIndex - index : null : null}
                      onTTSFinish={handleTTSFinish}
                    />
                    {!isLoading &&
                      sessionData?.questions?.length === index + 1 && (
                        <div className="flex items-center justify-center mt-5 ">
                          <button
                            className="flex items-center gap-3 text-sm text-white font-medium bg-black px-5 py-2 mr-2 rounded text-nowrap cursor-pointer"
                            disabled={isLoading || isUpdateLoader}
                            onClick={uploadMoreQuestions}
                          >
                            {isUpdateLoader ? (
                              <SpinnerLoader />
                            ) : (
                              <LuListCollapse className="text-lg" />
                            )}{" "}
                            Load More
                          </button>
                        </div>
                      )}
                  </>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </>
  )}
  <div>
    <Drawer
      isOpen={openLearnMoreDrawer}
      onClose={() => setOpenLearnMoreDrawer(false)}
      title={!isLoading && explanation?.title}
    >
      {errorMsg && (
        <p className="flex gap-2 text-sm text-amber-600 font-medium">
          <LuCircleAlert className="mt-1" /> {errorMsg}
        </p>
      )}
      {isLoading && <SkeletonLoader />}
      {!isLoading && explanation && (
        <AIResponsePreview content={explanation?.explanation} />
      )}
    </Drawer>
  </div>
</div> {/* <-- Close main container here */}
      </DashboardLayout>
    </div>
  );
}
