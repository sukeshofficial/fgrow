import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import obfuscator from 'vite-plugin-javascript-obfuscator'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    svgr(),
    // Disabling obfuscator plugin as it is currently breaking Vite's dynamic import/chunking logic.
    // Recommend running obfuscation as a post-build step on the 'dist' folder instead.
    /*
    command === 'build' && obfuscator({
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      stringArray: true,
      rotateStringArray: true,
      shuffleStringArray: true,
      splitStrings: true,
      stringArrayThreshold: 0.75,
    }),
    */
  ].filter(Boolean),
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
}))
