import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.admin.findUnique({
    where: { email: 'admin@mockpeers.com' }
  })

  if (!admin) {
    console.log('❌ Admin not found')
    return
  }

  console.log('✅ Admin found:', admin.email)
  console.log('Testing password: Admin@123')
  
  const isMatch = await bcrypt.compare('Admin@123', admin.password)
  console.log('Password match:', isMatch ? '✅ YES' : '❌ NO')
  
  if (!isMatch) {
    console.log('\n🔧 Resetting password to: Admin@123')
    const newHash = await bcrypt.hash('Admin@123', 10)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: newHash }
    })
    console.log('✅ Password reset successfully!')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


