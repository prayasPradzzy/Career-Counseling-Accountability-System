export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  STUDENTS: {
    BASE: "/clients",
    BY_ID: (id) => `/clients/${id}`,
    ASSIGN_COUNSELOR: (id) => `/clients/${id}/counselor`,
    CONSENT: (id) => `/clients/${id}/consent`,
    SESSIONS: (id) => `/clients/${id}/sessions`,
  },
  CLIENTS: {
    BASE: "/clients",
    BY_ID: (id) => `/clients/${id}`,
    ASSIGN_COUNSELOR: (id) => `/clients/${id}/counselor`,
    CONSENT: (id) => `/clients/${id}/consent`,
    SESSIONS: (id) => `/clients/${id}/sessions`,
  },
  COUNSELOR: {
    MY_COUNSELOR: "/counselor/my-counselor",
  },
};

export default API_ENDPOINTS;
