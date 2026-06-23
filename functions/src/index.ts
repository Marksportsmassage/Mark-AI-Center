import { initializeApp } from "firebase-admin/app";

initializeApp({
  projectId: "mark-ai-center"
});

export { lineWebhook } from "./lineWebhook";
