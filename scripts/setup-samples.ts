/**
 * Setup Sample Assets Script
 * 
 * Creates placeholder certificate and image files for demo purposes.
 * In production, these would be real user-uploaded files.
 * 
 * Run with: tsx scripts/setup-samples.ts
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

async function main() {
  console.log('📁 Setting up sample assets...\n')

  const publicDir = path.join(process.cwd(), 'public')
  const sampleAssetsDir = path.join(publicDir, 'sample-assets')
  const uploadsDir = path.join(publicDir, 'uploads')

  // Create directories if they don't exist
  if (!existsSync(sampleAssetsDir)) {
    await mkdir(sampleAssetsDir, { recursive: true })
    console.log('✅ Created /public/sample-assets')
  }

  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
    console.log('✅ Created /public/uploads')
  }

  // =============================================================================
  // Create Sample Certificate PDFs (placeholder text files for MVP)
  // =============================================================================

  const certificate1Content = `
===============================================================================
                          CERTIFICATE OF ACHIEVEMENT
===============================================================================

                            This certifies that

                              ALICE CHEN

                   has been awarded First Place in the
                      Regional Robotics Competition

                         Dated: November 15, 2024

                         [DEMO CERTIFICATE]
                   This is a placeholder for demonstration.
                   In production, real PDF certificates
                        would be uploaded here.

===============================================================================
  `

  const certificate2Content = `
===============================================================================
                          CERTIFICATE OF ACHIEVEMENT
===============================================================================

                            This certifies that

                           MARCUS JOHNSON

                   has been awarded the prestigious
                    Environmental Leadership Award

                         Dated: October 5, 2024

                         [DEMO CERTIFICATE]
                   This is a placeholder for demonstration.
                   In production, real PDF certificates
                        would be uploaded here.

===============================================================================
  `

  await writeFile(
    path.join(sampleAssetsDir, 'certificate-1.pdf'),
    certificate1Content
  )
  console.log('✅ Created certificate-1.pdf')

  await writeFile(
    path.join(sampleAssetsDir, 'certificate-2.pdf'),
    certificate2Content
  )
  console.log('✅ Created certificate-2.pdf')

  // =============================================================================
  // Create Sample Avatar Images (SVG placeholders)
  // =============================================================================

  const createAvatarSVG = (initials: string, color: string) => `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="80" 
        fill="white" text-anchor="middle" dominant-baseline="middle">
    ${initials}
  </text>
</svg>
  `.trim()

  await writeFile(
    path.join(sampleAssetsDir, 'avatar-alice.svg'),
    createAvatarSVG('AC', '#06b6d4')
  )
  console.log('✅ Created avatar-alice.svg')

  await writeFile(
    path.join(sampleAssetsDir, 'avatar-marcus.svg'),
    createAvatarSVG('MJ', '#6366f1')
  )
  console.log('✅ Created avatar-marcus.svg')

  await writeFile(
    path.join(sampleAssetsDir, 'avatar-priya.svg'),
    createAvatarSVG('PS', '#8b5cf6')
  )
  console.log('✅ Created avatar-priya.svg')

  // =============================================================================
  // Create Logo
  // =============================================================================

  const logoSVG = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="#06b6d4"/>
  <path d="M12 14C12 12.8954 12.8954 12 14 12H20C21.1046 12 22 12.8954 22 14V20C22 21.1046 21.1046 22 20 22H14C12.8954 22 12 21.1046 12 20V14Z" fill="white"/>
  <path d="M18 18L28 28L28 22L22 22L22 18L18 18Z" fill="white" opacity="0.6"/>
</svg>
  `.trim()

  await writeFile(path.join(publicDir, 'logo.svg'), logoSVG)
  console.log('✅ Created logo.svg')

  // =============================================================================
  // Create .gitkeep for uploads directory
  // =============================================================================

  await writeFile(path.join(uploadsDir, '.gitkeep'), '')
  console.log('✅ Created uploads/.gitkeep')

  console.log('\n✅ Sample assets setup complete!\n')
}

main()
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
