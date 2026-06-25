import React from "react";

const RoleInfoHeader = ({
  role,
  topicsToFocus,
  experience,
  questions,
  description,
  lastUpdated,
}) => {
  return (
    <div className="relative bg-gradient-to-r from-[#1e3a8a] via-[#06b6d4] to-[#38bdf8] rounded-2xl shadow-xl mx-2 md:mx-auto mt-8 mb-0 max-w-[1400px] px-8 md:px-16 py-12 overflow-hidden">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-grow">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-2">{role}</h2>
            <p className="text-lg text-cyan-100 font-medium mb-2">{topicsToFocus}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="text-xs font-semibold text-white bg-blue-700/90 px-5 py-2 rounded-full shadow">
                Experience: {experience} {experience == 1 ? "Year" : "Years"}
              </div>
              <div className="text-xs font-semibold text-white bg-blue-700/90 px-5 py-2 rounded-full shadow">
                {questions} Q&A
              </div>
              <div className="text-xs font-semibold text-white bg-blue-700/90 px-5 py-2 rounded-full shadow">
                Last Updated: {lastUpdated}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative blobs for vibrancy */}
      <div className="absolute top-0 right-0 w-[40vw] md:w-[30vw] h-[200px] pointer-events-none">
        <div className="w-24 h-24 bg-cyan-300 blur-[70px] animate-blob1 absolute top-0 right-10 opacity-60" />
        <div className="w-20 h-20 bg-blue-400 blur-[60px] animate-blob2 absolute top-10 right-32 opacity-50" />
        <div className="w-16 h-16 bg-blue-200 blur-[45px] animate-blob3 absolute top-20 right-0 opacity-40" />
        <div className="w-20 h-20 bg-fuchsia-200 blur-[55px] animate-blob1 absolute top-0 right-0 opacity-40" />
      </div>
    </div>
  );
};

export default RoleInfoHeader;
