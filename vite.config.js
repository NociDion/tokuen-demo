import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: '/tokuen-demo/',
    plugins: [
        tailwindcss(),
    ],
})

