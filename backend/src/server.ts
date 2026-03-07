// backend/src/server.ts
import app from './app'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`🚀 MultiSaaS API running on http://localhost:${PORT}`)
    console.log(`   Health: http://localhost:${PORT}/health`)
})
