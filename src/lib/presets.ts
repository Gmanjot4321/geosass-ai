export const DEFAULT_USER_SAMPLE = `/* App Global Styles */
:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #3b82f6;
  --accent: #10b981;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: 'JetBrains Mono', monospace;
}

/* Animations */
@keyframes scan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(100%); opacity: 0; }
}

@keyframes bar {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* Duplicated from repeated copy-paste */
@keyframes scan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(100%); opacity: 0; }
}

@keyframes bar {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

@keyframes scan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(100%); opacity: 0; }
}

/* THIS IS THE ERROR CAUSE: @import placed AFTER existing rules */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@import "tailwindcss";

.scanline {
  animation: scan 3s ease-in-out infinite;
}

.progress-bar {
  animation: bar 2s ease-in-out forwards;
}
`;

export const EXACT_CLEAN_SOLUTION = `/* Fonts & Framework Imports (MUST be at the very top of globals.css) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #3b82f6;
  --accent: #10b981;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: 'JetBrains Mono', monospace;
}

/* Deduplicated Animations */
@keyframes scan {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
}

@keyframes bar {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

.scanline {
  animation: scan 3s ease-in-out infinite;
}

.progress-bar {
  animation: bar 2s ease-in-out forwards;
}
`;
