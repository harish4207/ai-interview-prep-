



import { transform } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import { LuChevronDown, LuPin, LuPinOff, LuSparkles, LuVolume2, LuPause, LuSquare } from "react-icons/lu";
import AIResponsePreview from "../../pages/InterviewPrep/components/AIResponsePreview";

const QuestionCard = ({
  question,
  answer,
  onLearnMore,
  isPinned,
  onTogglePin,
  autoRead = false,
  autoReadIndex = null,
  onTTSFinish = () => {},
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (isExpanded) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight + 10);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // TTS handlers
  const handlePlay = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new window.SpeechSynthesisUtterance(question);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
        
  // Track if this card should auto-play
  useEffect(() => {
    if (autoRead && typeof autoReadIndex === 'number' && autoReadIndex === 0 && !isSpeaking && !isPaused) {
      handlePlay();
    }
    // eslint-disable-next-line
  }, [autoRead, autoReadIndex]);

  // Notify parent when TTS ends
  useEffect(() => {
    if (!isSpeaking && !isPaused && autoRead && typeof autoReadIndex === 'number' && autoReadIndex === 0) {
      onTTSFinish();
    }
    // eslint-disable-next-line
  }, [isSpeaking, isPaused]);

  return <>
   <div className={`bg-white rounded-lg mb-4 overflow-hidden py-4 px-5 border border-gray-100/60 group ${isSpeaking ? 'ring-2 ring-cyan-400' : ''}`}>
     <div className="flex  items-center justify-between cursor-pointer "> 
        <div className="flex items-start gap-3.5">
          <span className="text-xs md:text-[15px] font-semibold text-blue-700 leading-[18px]">
                Q
          </span>

          <h3
          className={`text-xs md:text-[14px] font-medium text-blue-900 mr-0 md:mr-20 ${isSpeaking ? 'text-cyan-700 font-bold' : ''}`}
          onClick={toggleExpand}>
            {question}
          </h3>
          {/* TTS Controls */}
          <div className="flex items-center ml-2 gap-1">
            {!isSpeaking && (
              <button title="Play question" onClick={handlePlay} className="text-cyan-600 hover:text-cyan-800">
                <LuVolume2 size={18} />
              </button>
            )}
            {isSpeaking && !isPaused && (
              <button title="Pause" onClick={handlePause} className="text-cyan-600 hover:text-cyan-800">
                <LuPause size={18} />
              </button>
            )}
            {isSpeaking && isPaused && (
              <button title="Resume" onClick={handleResume} className="text-cyan-600 hover:text-cyan-800">
                <LuVolume2 size={18} />
              </button>
            )}
            {isSpeaking && (
              <button title="Stop" onClick={handleStop} className="text-red-500 hover:text-red-700">
                <LuSquare size={16} />
              </button>
            )}
          </div>
           </div>

           <div className="flex items-center justify-end ml-4 relative">
            <div
            className={`flex ${
             isExpanded ? "md:flex" : "md:hidden group-hover:flex"
            }`}
            >

            <button
            className="flex items-center gap-2 text-xs text-indigo-800 font-medium bg-indigo-50 px-3 py-1 mr-2 rounded text-nowrap border border-indigo-50 hover:border-indigo-200 cursor-pointer"
            onClick={onTogglePin}
            >
            {isPinned ? (
                <LuPinOff className='text-xs'/>
            ) : (
            <LuPin className="text-xs"/>
            )}
            </button>

            <button
            className="flex items-center gap-2 text-xs text-cyan-800 font-medium bg-cyan-50 px-3 py-1 mr-2 rounded text-nowrap border border-cyan-50 hover:border-cyan-200 cursor-pointer"
            onClick={() => {
                setIsExpanded(true);
                onLearnMore();
            }}
            >

            <LuSparkles/>
            <span className="hidden md:block">Learn More</span>
            </button>
            </div>

            <button
            className="text-gray-400 hover:text-gray-500 cursor-pointer"
            onClick={toggleExpand}
            >
            <LuChevronDown
            size={20}
            className={`transform transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""}`}
            />
            </button>
            </div>
            </div>

            <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{maxHeight : `${height}px`}}
            >
            <div
            ref={contentRef}
            className="mt-4 text-gray-900 bg-gray-50 px-5 py-3 rounded-lg"
            >
            <AIResponsePreview content={answer}/>
            </div>
            </div>
            </div>

            </>


};

export default QuestionCard;

