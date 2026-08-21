import api from "./api"

// Thin wrappers over the backend contract. Every call relies on the httpOnly
// cookie session established by AuthContext (axios withCredentials).
const unwrap = (response) => response.data?.data
const message = (error, fallback) =>
  error?.response?.data?.errors?.[0]?.message ||
  error?.response?.data?.message ||
  fallback

// --- volunteer ---
export const listAvailableForms = async () => unwrap(await api.get("/feedback/forms"))
export const listMyFeedback = async () => unwrap(await api.get("/feedback/mine"))
export const submitFeedback = async (payload) => unwrap(await api.post("/feedback", payload))
export const getConfirmation = async (id) => unwrap(await api.get(`/feedback/${id}/confirmation`))

// --- admin: users ---
export const listUsers = async () => unwrap(await api.get("/admin/users"))
export const setVerification = async (id, verificationStatus) =>
  unwrap(await api.patch(`/admin/users/${id}/verification`, { verificationStatus }))
export const createUser = async (payload) => unwrap(await api.post("/admin/users", payload))

// --- admin: activities ---
export const listActivities = async () => unwrap(await api.get("/admin/activities"))
export const createActivity = async (payload) => unwrap(await api.post("/admin/activities", payload))

// --- admin: feedback forms ---
export const listForms = async () => unwrap(await api.get("/admin/feedback-forms"))
export const createForm = async (payload) => unwrap(await api.post("/admin/feedback-forms", payload))
export const archiveForm = async (id) => unwrap(await api.delete(`/admin/feedback-forms/${id}`))

// --- admin: analysis ---
export const listAllFeedback = async () => unwrap(await api.get("/admin/feedback"))
export const feedbackStats = async () => unwrap(await api.get("/admin/feedback/stats"))
export const feedbackThemes = async () => unwrap(await api.get("/admin/feedback/themes"))

// --- spoc ---
export const spocDashboard = async () => unwrap(await api.get("/spoc/dashboard"))
export const spocInsights = async (activityId) =>
  unwrap(await api.get(`/spoc/activities/${activityId}/insights`))
export const spocResponses = async (activityId) =>
  unwrap(await api.get(`/spoc/activities/${activityId}/responses`))

export { message as errorMessage }
