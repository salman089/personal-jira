import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo from https://salman089.github.io/personal-jira/,
  // not the domain root -- every asset URL Vite generates needs this prefix
  // or they'll 404. If you ever move to a custom domain or a
  // username.github.io root repo, change this back to '/'.
  base: '/personal-jira/',
})
