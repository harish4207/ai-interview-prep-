import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  // Restore user from localStorage if present
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const accessToken = user.token || localStorage.getItem("token");
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        setUser(response.data);
      } catch (error) {
        console.error("User not authenticated", error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      if (user.token) localStorage.setItem("token", user.token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  const updateUser = (userData) => {
    setUser(userData);
    // localStorage is updated by the useEffect above
    setLoading(false);
  };

  const clearUser = () => {
    setUser(null);
    // localStorage is updated by the useEffect above
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};
export default UserProvider;