import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import SpinnerLoader from '../../components/Loader/SpinnerLoader';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';


export default function CreateSessionForm() {

    const [formData, setFormData] = useState({
  role: "",
  experience: "",
  topicsToFocus: "",
  description: "",
});

const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

const navigate = useNavigate();

const handleChange = (key, value) => {
  setFormData((prevData) => ({
    ...prevData,
    [key]: value,
  }));
};

const handleCreateSession = async (e) => {
  e.preventDefault();

  const { role, experience, topicsToFocus } = formData;

if (!role || !experience || !topicsToFocus) {
  setError("Please fill all the required fields.");
  return;
}

setError("");
setIsLoading(true);
try {
  // Call AI API to generate questions
  const aiResponse = await axiosInstance.post(
    API_PATHS.AI.GENERATE_QUESTIONS,
    {
      role,
      experience,
      topicsToFocus,
      numberOfQuestions: 6,
    }
  );
 
const generatedQuestions = aiResponse.data;

const response = await axiosInstance.post(API_PATHS.SESSION.CREATE, {
  ...formData,
  questions: generatedQuestions,
});

if (response.data?.session?._id) {
  navigate(`/interview-prep/${response.data?.session?._id}`);
}
} catch (error) {
  if (error.response && error.response.data.message) {
    setError(error.response.data.message);
  } else {
    setError("Something went wrong. Please try again.");
  }
} finally {
  setIsLoading(false);
}

}

  return (

  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#24243e] py-10 px-2">
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center">
      <h3 className="text-2xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] tracking-tight">Start a New Interview Journey</h3>
      <p className="text-xs text-slate-700 mb-6 text-center">
        Fill out a few quick details and unlock your personalized set of interview questions!
      </p>
      <form onSubmit={handleCreateSession} className="flex flex-col gap-4 w-full">
        <Input
          value={formData.role}
          onChange={({ target }) => handleChange("role", target.value)}
          label="Target Role"
          placeholder="(e.g., Frontend Developer, UI/UX Designer, etc.)"
          type="text"
        />
        <Input
          value={formData.experience}
          onChange={({ target }) => handleChange("experience", target.value)}
          label="Years of Experience"
          placeholder="(e.g., 1 year, 3 years, 5+ years)"
          type="number"
        />
        <Input
          value={formData.topicsToFocus}
          onChange={({ target }) => handleChange("topicsToFocus", target.value)}
          label="Topics to Focus On"
          placeholder="(Comma-separated, e.g., React, Node.js, MongoDB)"
          type="text"
        />
        <Input
          value={formData.description}
          onChange={({ target }) => handleChange("description", target.value)}
          label="Description"
          placeholder="(Any specific goals or notes for this session)"
          type="text"
        />
        {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
        <button
          type="submit"
          className="w-full mt-2 py-3 rounded-full font-bold shadow-md bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] text-white text-lg hover:scale-105 transition-transform disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading && <SpinnerLoader />} Create Session
        </button>
      </form>
    </div>
  </div>

  )
}
