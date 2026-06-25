import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import validateEmail from '../../utils/helper';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';

export default function SignUp({setCurrentPage}) {
 const [profilePic , setProfilePic ] = useState(null);
 const [fullName , setFullName] = useState("")
 const [email,setEmail] = useState("")
 const [password , setPassword] = useState("")
 
 const [error , setError] = useState(null);

 const {updateUser} = useContext(UserContext)

 const navigate = useNavigate(); 
 const handleSignUp = async(a) =>{
    a.preventDefault()

    let profileImageUrl = ""
    if(!fullName){
        setError("please enter the full name")
        return;
    }

    if(!validateEmail(email)){
        setError("please enter a valid email address")
        return;
    }
    if(!password){
        setError("please enter the password")
        return;
    }

    setError("");
    //signup api call
    try{
      
      // Upload image if present
if (profilePic) {
  const imgUploadRes = await uploadImage(profilePic);
  profileImageUrl = imgUploadRes.imageUrl || "";
}

const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
  name: fullName,
  email,
  password,
  profileImageUrl,
});

const { token } = response.data;

if (token) {
  localStorage.setItem("token", token);
  updateUser(response.data);
  navigate("/dashboard");
}

      
    }catch(error){
      if(error.response && error.response.data.message){
        setError(error.response.data.message)
      }else{
        setError("Something went wrong please try again")
      }
    }
 }
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#24243e]">
      <div className="bg-white/95 rounded-2xl shadow-2xl p-8 w-[90vw] max-w-md border border-[#38f9d7]/30">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] mb-1">
          Create an Account
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Join us today by entering your details below.
        </p>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="flex justify-center mb-4">
            <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
          </div>
          <Input
            value={fullName}
            onChange={({ target }) => setFullName(target.value)}
            label="Full Name"
            placeholder="Your name"
            type="text"
          />
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="email@gmail.com"
            type="email"
          />
          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Min 8 characters"
            type="password"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] text-white py-2 rounded-lg font-semibold shadow-md hover:scale-105 transition-transform"
          >
            SIGN UP
          </button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <button
              type="button"
              className="text-[#ff9800] font-medium underline"
              onClick={() => setCurrentPage('login')}
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  )


}
