import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function removeLayerProperties(css) {
  css = css.replace(/@layer\s+properties\s*;/g, "")
  const lines = css.split("\n")
  const result = []
  let inLayerProperties = false
  let braceDepth = 0
  for (const line of lines) {
    if (!inLayerProperties) {
      if (/@layer\s+properties\s*\{/.test(line)) {
        inLayerProperties = true
        braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
        if (braceDepth <= 0) inLayerProperties = false
        continue
      }
      result.push(line)
    } else {
      braceDepth += (line.match(/\{/g) || []).length
      braceDepth -= (line.match(/\}/g) || []).length
      if (braceDepth <= 0) inLayerProperties = false
    }
  }
  return result.join("\n")
}

function stripTwPolyfills() {
  return {
    name: "strip-tw-polyfills",
    transform(code, id) {
      if (id.endsWith(".css")) {
        return { code: removeLayerProperties(code) }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stripTwPolyfills()],
  server: {
    host: '0.0.0.0',
    port: 4174,
    allowedHosts: [
      ".ngrok-free.app"
    ]
  },
})