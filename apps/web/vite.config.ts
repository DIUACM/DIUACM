import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    manifest: true,
    // Split only the large, route-specific authoring/rendering stacks. Keeping
    // React and shared UI in Rolldown's automatic graph avoids cross-chunk
    // initialization cycles in the application shell.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'editor',
              test: /node_modules[\\/](?:@tiptap|prosemirror-|lowlight)[\\/]/,
              maxSize: 400 * 1024,
              priority: 40,
            },
            {
              name: 'markdown',
              test: /node_modules[\\/](?:react-markdown|remark-|rehype-|unified|micromark|mdast-|hast-|unist-|vfile)[\\/]/,
              priority: 30,
            },
            {
              name: 'math',
              test: /node_modules[\\/]katex[\\/]/,
              priority: 20,
            },
            {
              name: 'syntax',
              test: /node_modules[\\/]highlight\.js[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
