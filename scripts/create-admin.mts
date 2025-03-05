import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  
  if (!email || !password) {
    console.error('Please provide email and password')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  
  try {
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin User'
      }
    })

    console.log(`Admin user created: ${admin.email}`)
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('Error: Email already exists')
    } else {
      console.error('Error creating admin:', error)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })