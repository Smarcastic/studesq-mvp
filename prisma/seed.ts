/**
 * Database Seed Script
 * 
 * Populates the database with demo users, student profiles,
 * achievements, and sample opportunities.
 * 
 * Run with: npm run db:seed
 */

import { PrismaClient, UserRole, AchievementType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // =============================================================================
  // Clean existing data (for re-seeding)
  // =============================================================================
  
  console.log('🧹 Cleaning existing data...')
  await prisma.parentLink.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleaned existing data\n')

  // =============================================================================
  // Create Student Users & Profiles
  // =============================================================================
  
  console.log('👨‍🎓 Creating student accounts...')

  // Student 1: Alice Chen
  const alice = await prisma.user.create({
    data: {
      id: 'student_alice',
      email: 'alice@demo.studesq.com',
      name: 'Alice Chen',
      role: UserRole.STUDENT,
    },
  })

  const aliceProfile = await prisma.studentProfile.create({
    data: {
      userId: alice.id,
      displayName: 'Alice Chen',
      school: 'Lincoln High School',
      grade: '10th Grade',
      bio: 'Aspiring computer scientist passionate about AI and robotics. Lead developer of school robotics team.',
      earlyFounder: true,
      dob: new Date('2009-03-15'),
    },
  })

  // Student 2: Marcus Johnson
  const marcus = await prisma.user.create({
    data: {
      id: 'student_marcus',
      email: 'marcus@demo.studesq.com',
      name: 'Marcus Johnson',
      role: UserRole.STUDENT,
    },
  })

  const marcusProfile = await prisma.studentProfile.create({
    data: {
      userId: marcus.id,
      displayName: 'Marcus Johnson',
      school: 'Roosevelt Academy',
      grade: '11th Grade',
      bio: 'Debate champion and environmental activist. Founder of school sustainability club.',
      earlyFounder: true,
      dob: new Date('2008-07-22'),
    },
  })

  // Student 3: Priya Sharma
  const priya = await prisma.user.create({
    data: {
      id: 'student_priya',
      email: 'priya@demo.studesq.com',
      name: 'Priya Sharma',
      role: UserRole.STUDENT,
    },
  })

  const priyaProfile = await prisma.studentProfile.create({
    data: {
      userId: priya.id,
      displayName: 'Priya Sharma',
      school: 'Jefferson Middle School',
      grade: '9th Grade',
      bio: 'Award-winning artist and math enthusiast. Passionate about STEM education equity.',
      earlyFounder: false,
      dob: new Date('2010-11-08'),
    },
  })

  console.log(`✅ Created 3 student accounts\n`)

  // =============================================================================
  // Create Parent Users
  // =============================================================================
  
  console.log('👨‍👩‍👧 Creating parent accounts...')

  const aliceParent = await prisma.user.create({
    data: {
      id: 'parent_alice',
      email: 'alice-parent@demo.studesq.com',
      name: 'Helen Chen',
      role: UserRole.PARENT,
    },
  })

  const marcusParent = await prisma.user.create({
    data: {
      id: 'parent_marcus',
      email: 'marcus-parent@demo.studesq.com',
      name: 'David Johnson',
      role: UserRole.PARENT,
    },
  })

  console.log(`✅ Created 2 parent accounts\n`)

  // =============================================================================
  // Create Admin User
  // =============================================================================
  
  console.log('🔧 Creating admin account...')

  await prisma.user.create({
    data: {
      id: 'admin_user',
      email: 'admin@demo.studesq.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  })

  console.log(`✅ Created admin account\n`)

  // =============================================================================
  // Create Parent Links
  // =============================================================================
  
  console.log('🔗 Linking parents to students...')

  await prisma.parentLink.create({
    data: {
      studentId: aliceProfile.id,
      parentUserId: aliceParent.id,
      verified: true,
    },
  })

  await prisma.parentLink.create({
    data: {
      studentId: marcusProfile.id,
      parentUserId: marcusParent.id,
      verified: true,
    },
  })

  console.log(`✅ Created parent links\n`)

  // =============================================================================
  // Create Achievements
  // =============================================================================
  
  console.log('🏆 Creating achievements...')

  // Alice's Achievements
  await prisma.achievement.createMany({
    data: [
      {
        studentId: aliceProfile.id,
        title: 'First Place - Regional Robotics Competition',
        description: 'Led team to victory in the FIRST Robotics regional championship. Designed autonomous navigation system using computer vision.',
        type: AchievementType.COMPETITION,
        date: new Date('2024-11-15'),
        certificatePath: '/sample-assets/certificate-1.pdf',
      },
      {
        studentId: aliceProfile.id,
        title: 'AP Computer Science A - Score: 5',
        description: 'Achieved perfect score on AP Computer Science A exam. Completed with highest marks in school.',
        type: AchievementType.ACADEMIC,
        date: new Date('2024-05-20'),
      },
      {
        studentId: aliceProfile.id,
        title: 'Published Research: AI in Education',
        description: 'Co-authored paper on using machine learning to personalize student learning paths. Published in high school research journal.',
        type: AchievementType.PROJECT,
        date: new Date('2024-09-10'),
        certificatePath: '/sample-assets/certificate-2.pdf',
      },
    ],
  })

  // Marcus's Achievements
  await prisma.achievement.createMany({
    data: [
      {
        studentId: marcusProfile.id,
        title: 'State Debate Champion',
        description: 'Won first place in Lincoln-Douglas debate at state championship. Defeated 50+ competitors.',
        type: AchievementType.COMPETITION,
        date: new Date('2025-01-12'),
        certificatePath: '/sample-assets/certificate-1.pdf',
      },
      {
        studentId: marcusProfile.id,
        title: 'Environmental Leadership Award',
        description: 'Recognized by city council for leading school-wide sustainability initiative that reduced waste by 40%.',
        type: AchievementType.EXTRACURRICULAR,
        date: new Date('2024-10-05'),
      },
    ],
  })

  // Priya's Achievements
  await prisma.achievement.create({
    data: {
      studentId: priyaProfile.id,
      title: 'National Art Competition - Gold Medal',
      description: 'Awarded gold medal in National Scholastic Art Competition for digital art series exploring cultural identity.',
      type: AchievementType.COMPETITION,
      date: new Date('2024-12-01'),
      certificatePath: '/sample-assets/certificate-2.pdf',
    },
  })

  console.log(`✅ Created 6 achievements\n`)

  // =============================================================================
  // Create Opportunities
  // =============================================================================
  
  console.log('💡 Creating opportunities...')

  await prisma.opportunity.createMany({
    data: [
      {
        title: 'Google Code-in - High School Competition',
        description: 'Annual coding competition for pre-university students. Work on real open-source projects and win prizes.',
        provider: 'Google',
        externalUrl: 'https://codein.withgoogle.com',
        date: new Date('2026-03-15'),
      },
      {
        title: 'NASA High School Internship Program',
        description: 'Paid summer internship working alongside NASA scientists and engineers on real space missions.',
        provider: 'NASA',
        externalUrl: 'https://intern.nasa.gov',
        date: new Date('2026-04-01'),
      },
      {
        title: 'MIT Launch Entrepreneurship Program',
        description: 'Four-week summer program where students start real companies and pitch to investors.',
        provider: 'MIT',
        externalUrl: 'https://launchsummer.org',
        date: new Date('2026-05-20'),
      },
      {
        title: 'Questbridge Scholarship - Full Ride to Top Universities',
        description: 'Connects high-achieving, low-income students with full four-year scholarships to top colleges.',
        provider: 'QuestBridge',
        externalUrl: 'https://questbridge.org',
        date: new Date('2026-09-30'),
      },
      {
        title: 'National Merit Scholarship',
        description: 'Academic scholarship program based on PSAT/NMSQT scores. Awards up to $2,500.',
        provider: 'National Merit Scholarship Corporation',
        externalUrl: 'https://nationalmerit.org',
        date: new Date('2026-10-15'),
      },
    ],
  })

  console.log(`✅ Created 5 opportunities\n`)

  // =============================================================================
  // Summary
  // =============================================================================
  
  console.log('📊 Seed Summary:')
  console.log('  - Students: 3')
  console.log('  - Parents: 2')
  console.log('  - Admins: 1')
  console.log('  - Achievements: 6')
  console.log('  - Opportunities: 5')
  console.log('  - Parent Links: 2')
  console.log('\n✅ Database seeded successfully!\n')
  
  console.log('🎭 Demo Login Accounts:')
  console.log('  Students:')
  console.log('    - alice@demo.studesq.com (Alice Chen)')
  console.log('    - marcus@demo.studesq.com (Marcus Johnson)')
  console.log('    - priya@demo.studesq.com (Priya Sharma)')
  console.log('  Parents:')
  console.log('    - alice-parent@demo.studesq.com (Helen Chen)')
  console.log('    - marcus-parent@demo.studesq.com (David Johnson)')
  console.log('  Admin:')
  console.log('    - admin@demo.studesq.com (Admin User)')
  console.log('\n🚀 Ready to run: npm run dev\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
