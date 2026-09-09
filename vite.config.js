import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    base: '/tokuen-demo/',

    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                forgetPassword: resolve(__dirname, 'forget-password/index.html'),
                privacyPolicy: resolve(__dirname, 'privacy-policy/index.html'),
                termsOfService: resolve(__dirname, 'terms-of-service/index.html'),
                register: resolve(__dirname, 'register/index.html'),
                dashboard: resolve(__dirname, 'dashboard/index.html'),
                myLoans: resolve(__dirname, 'my-loans/index.html'),
                payments: resolve(__dirname, 'payments/index.html'),
                transactions: resolve(__dirname, 'transactions/index.html'),
                applications: resolve(__dirname, 'applications/index.html'),
                settings: resolve(__dirname, 'settings/index.html'),
                profile: resolve(__dirname, 'profile/index.html'),
            },
        },
    },

    plugins: [
        tailwindcss(),
    ],
})