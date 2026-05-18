import { useEffect, useRef } from "react";

import { useDispatch } from "react-redux";

import { setUser, clearUser } from "../state/auth.slice";

import { getCurrentUser } from "../services/auth.api";

export const useAuth = () => {
  const dispatch = useDispatch();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await getCurrentUser();

        if (data?.success) {
          dispatch(setUser(data.user));
        } else {
          dispatch(clearUser());
        }
      } catch {
        dispatch(clearUser());
      }
    }

    if (hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;

    const path = window.location.pathname;

    // Avoid expected 401 noise on the public login route.
    if (path === "/login") {
      dispatch(clearUser());
      return;
    }

    checkAuth();
  }, [dispatch]);
};
