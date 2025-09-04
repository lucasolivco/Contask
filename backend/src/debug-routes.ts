// backend/src/debug-routes.ts

console.log('🔍 Testing individual route files...')

try {
  console.log('1️⃣ Testing authRoutes...')
  require('./routes/authRoutes')
  console.log('✅ authRoutes OK')
} catch (error) {
  console.error('❌ authRoutes error:', error)
}

try {
  console.log('2️⃣ Testing notificationRoutes...')
  require('./routes/notificationRoutes')
  console.log('✅ notificationRoutes OK')
} catch (error) {
  console.error('❌ notificationRoutes error:', error)
}

try {
  console.log('3️⃣ Testing taskRoutes...')
  require('./routes/taskRoutes')
  console.log('✅ taskRoutes OK')
} catch (error) {
  console.error('❌ taskRoutes error:', error)
}

console.log('✅ Route testing complete')