import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admins = await prisma.admin.findMany()
  console.log('Total admins:', admins.length)
  console.log('\nAdmin users:')
  admins.forEach(admin => {
    console.log(`- Email: ${admin.email}`)
    console.log(`  Name: ${admin.name}`)
    console.log(`  ID: ${admin.id}`)
    console.log(`  Has password: ${!!admin.password}`)
    console.log('')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())



