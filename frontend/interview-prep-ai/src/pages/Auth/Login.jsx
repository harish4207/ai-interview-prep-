import React, { useState } from 'react'
import axios from "axios";
import { API_PATHS } from '../../utils/apiPaths';

import axiosInstance from '../../utils/axiosInstance';

import { useNavigate } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import validateEmail from '../../utils/helper'
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';

export default function Login({setCurrentPage}) {

  const {updateUser} = useContext(UserContext)
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState(null);
  const navigate = useNavigate();

  //handle login form submit 
  const handleLogin = async(e) =>{
    e.preventDefault();

    if(!validateEmail(email)){
      setError("please enter a valid email address")
      return;
      
    }
    if(!password){
      setError("Please enter the password")
      return;
    }
    setError("")

    try{

      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
      email,
      password,
     });

const { token } = response.data;

if (token) {
  localStorage.setItem("token", token);
  updateUser(response.data)
  navigate("/dashboard");
}


    }catch(error){
      if(error.response && error.response.data.message){
        setError(error.response.data.message)
      }else{
        setError("Something went wrong please try again")
      }
    }
  };
  return (
    <div className="w-[90vw] md:w-[33vw] p-7 flex flex-col justify-center">
      <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] mb-1">
        Welcome Back
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Please enter your details to login
      </p>
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          value={email}
          onChange={({target})=>setEmail(target.value)}
          label="Email Address"
          placeholder="email@gmail.com"
          type="text"
        />
        <Input
          value={password}
          onChange={({target})=>setPassword(target.value)}
          label="Password"
          placeholder="Min 8 characters"
          type="password"
        />
        {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}
        <button type="submit" className="w-full bg-gradient-to-r from-[#43e97b] via-[#38f9d7] to-[#155799] text-white py-2 rounded-lg font-semibold shadow-md hover:scale-105 transition-transform">LOGIN</button>
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-[#ff9800] font-medium underline"
            onClick={()=>setCurrentPage('signup')}
          >
            Signup
          </button>
        </p>
      </form>
    </div>
  )
}
