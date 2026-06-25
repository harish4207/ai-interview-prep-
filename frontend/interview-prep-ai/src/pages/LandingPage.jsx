import React, { useState, useContext } from 'react'
import HERO_IMG from '../assets/imgofweb.png'
import { APP_FEATURES } from '../utils/data'
import { useNavigate } from 'react-router-dom'
import { LuSparkles } from 'react-icons/lu'
import Modal from '../components/Modal'
import SignUp from '../pages/Auth/SignUp'
import Login from '../pages/Auth/Login'
import { UserContext } from '../context/userContext'
import ProfileInfoCard from '../components/Cards/ProfileInfoCard'

// World-class color palette
const GRADIENT_BG = "bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#24243e]";
const PRIMARY_GRADIENT = "bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799]";
const BUTTON_GRADIENT = "bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799]";
const CARD_GRADIENT = "bg-gradient-to-br from-[#232526] to-[#414345]";
const CARD_BORDER = "border border-[#38f9d7]/30";
const CARD_SHADOW = "shadow-lg shadow-[#38f9d7]/10";
const TEXT_GRADIENT = "text-transparent bg-clip-text bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799]";
const HERO_BLUR = "w-[500px] h-[500px] bg-[#38f9d7]/30 blur-[90px] absolute top-0 left-0 z-0";

export default function LandingPage() {
  const navigate = useNavigate();
  const [openAuthModel, setOpenAuthModel] = useState(false);
  const [currentPage, setCurrentPage] = useState('login')

  const { user } = useContext(UserContext)

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModel(true);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <div className={`w-full min-h-full ${GRADIENT_BG} relative`}>
        <div className={HERO_BLUR} />
        <div className='w-full max-w-[1400px] mx-auto px-4 pt-8 pb-[200px] relative z-10'>
          {/* Header */}
          <header className="flex justify-between items-center mb-20">
            <div className={`text-2xl font-extrabold ${TEXT_GRADIENT} tracking-tight drop-shadow-lg`}>
              Interview Prep AI
            </div>
            {user ? (
              <ProfileInfoCard />
            ) : (
              <button
                className={`${BUTTON_GRADIENT} text-sm font-bold text-white px-8 py-3 rounded-full shadow-md hover:scale-105 transition-transform border-0 outline-none focus:ring-2 focus:ring-[#38f9d7]`}
                onClick={() => setOpenAuthModel(true)}
              >
                Login / Sign Up
              </button>
            )}
          </header>

          {/* Hero Content */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 pr-4 mb-8 md:mb-0">
              <div className="flex items-center justify-left mb-3">
                <div className="flex items-center gap-2 text-[13px] text-[#38f9d7] font-semibold bg-[#232526] px-4 py-1.5 rounded-full border border-[#38f9d7]/40 shadow-sm">
                  <LuSparkles className="text-[#43e97b]" />AI Powered
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold mb-7 leading-tight text-white drop-shadow-xl">
                Ace Interviews with <br />
                <span className={`${TEXT_GRADIENT} animate-text-shine font-extrabold`}>
                  AI-Powered
                </span>{" "}
                Learning
              </h1>
            </div>

            <div className="w-full md:w-1/2">
              <p className="text-[18px] text-[#e0f7fa] mr-0 md:mr-20 mb-8 font-medium leading-relaxed">
                Get role-specific questions, expand answers when you need them,
                dive deeper into concepts, and organize everything your way.
                From preparation to mastery – your ultimate interview toolkit is
                here.
              </p>
              <button
                className={`${BUTTON_GRADIENT} text-sm font-bold text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-transform border-0 outline-none focus:ring-2 focus:ring-[#38f9d7]`}
                onClick={handleCTA}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full min-h-full relative z-10'>
        <div>
          <section className='flex items-center justify-center -mt-36'>
            <img
              src={HERO_IMG}
              alt="Hero img"
              className='w-[80vw] max-w-3xl rounded-3xl shadow-2xl border-4 border-[#38f9d7]/30'
              style={{
                background: 'linear-gradient(135deg, #232526 0%, #38f9d7 100%)',
                boxShadow: '0 8px 40px 0 #38f9d7a0'
              }}
            />
          </section>
        </div>

        <div className={`w-full min-h-full ${GRADIENT_BG} mt-10`}>
          <div className='container mx-auto px-4 pt-14 pb-24 max-w-[1400px]'>
            <section className='mt-5'>
              <h2 className={`text-3xl font-extrabold text-center mb-14 ${TEXT_GRADIENT} tracking-tight`}>
                Features That Make You Shine
              </h2>

              <div className='flex flex-col items-center gap-10'>
                {/* first three cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-10 w-full'>
                  {APP_FEATURES.slice(0, 3).map((feature) => (
                    <div
                      key={feature.id}
                      className={`${CARD_GRADIENT} ${CARD_BORDER} ${CARD_SHADOW} p-8 rounded-2xl hover:scale-105 hover:shadow-2xl transition-transform duration-200`}
                    >
                      <h3 className={`text-lg font-bold mb-4 ${TEXT_GRADIENT}`}>
                        {feature.title}
                      </h3>
                      <p className='text-[#e0f7fa] text-base font-medium'>{feature.description}</p>
                    </div>
                  ))}
                </div>

                {/* remaining 2 cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-10 w-full'>
                  {APP_FEATURES.slice(3).map((feature) => (
                    <div
                      key={feature.id}
                      className={`${CARD_GRADIENT} ${CARD_BORDER} ${CARD_SHADOW} p-8 rounded-2xl hover:scale-105 hover:shadow-2xl transition-transform duration-200`}
                    >
                      <h3 className={`text-lg font-bold mb-4 ${TEXT_GRADIENT}`}>
                        {feature.title}
                      </h3>
                      <p className='text-[#e0f7fa] text-base font-medium'>{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className='text-sm bg-[#232526] text-[#38f9d7] text-center p-6 mt-8 font-semibold tracking-wide rounded-t-xl shadow-inner'>
          made with <span className="animate-pulse">✨</span> Aitam..
        </div>
      </div>

      <Modal
        isOpen={openAuthModel}
        onClose={() => {
          setOpenAuthModel(false);
          setCurrentPage('login');
        }}
        hideHeader
      >
        <div>
          {currentPage === 'login' && (
            <Login setCurrentPage={setCurrentPage} />
          )}
          {currentPage === 'signup' && (
            <SignUp setCurrentPage={setCurrentPage} />
          )}
        </div>
      </Modal>
    </>
  )
}
