import { useEffect } from "react";

import { useDispatch } from "react-redux";

import { setUser, clearUser } from "../state/auth.slice";

import { getCurrentUser } from "../services/auth.api";

export const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await getCurrentUser();

      if (data?.success) {
        dispatch(setUser(data.user));
      } else {
        dispatch(clearUser());
      }
    } catch (error) {
      dispatch(clearUser());
    }
  }
};
