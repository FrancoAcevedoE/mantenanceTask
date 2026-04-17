import webpush from 'web-push'

console.log('🔑 Generando claves VAPID para Web Push...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ Claves VAPID generadas exitosamente:\n')
console.log('Variables de entorno a configurar:\n')
console.log('WEB_PUSH_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('WEB_PUSH_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('WEB_PUSH_SUBJECT=mailto:admin@mantenance.app\n')

console.log('📋 Pasos para configurar en Render:\n')
console.log('1. Ve a tu servicio en Render.com')
console.log('2. Ve a "Environment"')
console.log('3. Agrega estas 3 variables:')
console.log('   - WEB_PUSH_PUBLIC_KEY')
console.log('   - WEB_PUSH_PRIVATE_KEY')
console.log('   - WEB_PUSH_SUBJECT')
console.log('4. Despliega nuevamente\n')

console.log('⚠️  IMPORTANTE: Guarda estas claves en un lugar seguro!')
console.log('Si pierdes la PRIVATE_KEY, tendrás que generar nuevas claves.')
