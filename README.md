<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dffa8aec-2041-42d8-8e49-9c5d93445da7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Отладка задания 13

Панель отладки включается переменной `VITE_TASK13_DEBUG=1` в `.env.local`.
Работает только в dev-режиме (флаг `DEBUG_TASK13` в `src/tasks/task13.tsx`).

