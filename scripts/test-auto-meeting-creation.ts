import { PrismaClient } from '@prisma/client';
import { addDays, addHours } from 'date-fns';
import { runLifecycleChecks } from '../lib/meeting-lifecycle';
import { INTERVIEW_TYPES } from '../lib/types/interview-types';

const prisma = new PrismaClient();

interface TestResult {
  interviewType: string;
  testName: string;
  status: 'PASSED' | 'FAILED';
  details: string;
}

const results: TestResult[] = [];

/**
 * Test automatic meeting creation for all interview types
 */
async function testAutomaticMeetingCreation() {
  console.log('🧪 Starting Automatic Meeting Creation Test for All Interview Types\n');
  console.log('=' .repeat(80));
  
  // Test each interview type
  for (const interviewType of INTERVIEW_TYPES) {
    console.log(`\n\n🔍 Testing ${interviewType} Interview Type`);
    console.log('-'.repeat(80));
    
    await testInterviewType(interviewType);
  }

  // Print summary
  console.log('\n\n');
  console.log('=' .repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(80));
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('\n');
  
  // Print detailed results
  for (const result of results) {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${result.interviewType}] ${result.testName}`);
    console.log(`   ${result.details}\n`);
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the details above.');
  } else {
    console.log('\n🎉 All tests passed! Automatic meeting creation is working for all interview types.');
  }
}

/**
 * Test automatic meeting creation for a specific interview type
 */
async function testInterviewType(interviewType: string) {
  try {
    // Create a test meeting that ended in the past
    const pastStartTime = addHours(new Date(), -2); // 2 hours ago
    const pastEndTime = addHours(new Date(), -1); // 1 hour ago
    
    console.log(`\n1️⃣  Creating test meeting (already ended)...`);
    const testMeeting = await prisma.schedule.create({
      data: {
        title: `Test ${interviewType} Meeting - Auto Creation Test`,
        description: `Testing automatic meeting creation for ${interviewType}`,
        startTime: pastStartTime,
        endTime: pastEndTime,
        duration: 60,
        waitTime: 15,
        status: 'ACTIVE', // Set to ACTIVE so it can be completed
        interviewType: interviewType,
      },
    });
    
    console.log(`   ✓ Created test meeting ID: ${testMeeting.id}`);
    console.log(`   ✓ Start: ${testMeeting.startTime.toISOString()}`);
    console.log(`   ✓ End: ${testMeeting.endTime.toISOString()}`);
    console.log(`   ✓ Type: ${testMeeting.interviewType}`);
    console.log(`   ✓ Status: ${testMeeting.status}`);

    // Test 1: Mark as DONE and check replacement
    console.log(`\n2️⃣  Running lifecycle checks (should mark as DONE and create replacement)...`);
    await runLifecycleChecks();
    
    // Check if meeting was marked as DONE
    const doneCheck = await prisma.schedule.findUnique({
      where: { id: testMeeting.id },
    });
    
    if (doneCheck?.status === 'DONE') {
      console.log(`   ✓ Meeting marked as DONE`);
      
      // Check if replacement meeting was created (+7 days)
      const expectedReplacementStart = addDays(pastStartTime, 7);
      const replacementMeeting = await prisma.schedule.findFirst({
        where: {
          startTime: expectedReplacementStart,
          interviewType: interviewType,
          title: testMeeting.title,
        },
      });
      
      if (replacementMeeting) {
        console.log(`   ✓ Replacement meeting created automatically`);
        console.log(`   ✓ New meeting ID: ${replacementMeeting.id}`);
        console.log(`   ✓ New start time: ${replacementMeeting.startTime.toISOString()}`);
        console.log(`   ✓ New status: ${replacementMeeting.status}`);
        
        results.push({
          interviewType,
          testName: 'DONE Status → Replacement Meeting',
          status: 'PASSED',
          details: `Meeting marked as DONE successfully created replacement meeting +7 days ahead`,
        });
        
        // Clean up replacement
        await prisma.schedule.delete({ where: { id: replacementMeeting.id } });
      } else {
        console.log(`   ❌ No replacement meeting found`);
        results.push({
          interviewType,
          testName: 'DONE Status → Replacement Meeting',
          status: 'FAILED',
          details: `Meeting marked as DONE but no replacement meeting was created`,
        });
      }
    } else {
      console.log(`   ❌ Meeting not marked as DONE (Status: ${doneCheck?.status})`);
      results.push({
        interviewType,
        testName: 'DONE Status → Replacement Meeting',
        status: 'FAILED',
        details: `Meeting was not marked as DONE (current status: ${doneCheck?.status})`,
      });
    }

    // Clean up test meeting
    await prisma.schedule.delete({ where: { id: testMeeting.id } });

    // Test 2: Create PENDING meeting that expired and check if marked as OVER
    console.log(`\n3️⃣  Testing PENDING → OVER transition...`);
    const expiredPendingMeeting = await prisma.schedule.create({
      data: {
        title: `Test ${interviewType} Expired Pending`,
        description: `Testing OVER status for ${interviewType}`,
        startTime: pastStartTime,
        endTime: pastEndTime,
        duration: 60,
        waitTime: 15,
        status: 'PENDING', // Still pending but already expired
        interviewType: interviewType,
      },
    });
    
    console.log(`   ✓ Created expired PENDING meeting ID: ${expiredPendingMeeting.id}`);

    // Run lifecycle checks
    await runLifecycleChecks();
    
    // Check if meeting was marked as OVER
    const overCheck = await prisma.schedule.findUnique({
      where: { id: expiredPendingMeeting.id },
    });
    
    if (overCheck?.status === 'OVER') {
      console.log(`   ✓ Expired meeting marked as OVER`);
      
      // Check if replacement meeting was created
      const expectedReplacementStart2 = addDays(pastStartTime, 7);
      const replacementMeeting2 = await prisma.schedule.findFirst({
        where: {
          startTime: expectedReplacementStart2,
          interviewType: interviewType,
          title: expiredPendingMeeting.title,
        },
      });
      
      if (replacementMeeting2) {
        console.log(`   ✓ Replacement meeting created for OVER status`);
        console.log(`   ✓ New meeting ID: ${replacementMeeting2.id}`);
        
        results.push({
          interviewType,
          testName: 'OVER Status → Replacement Meeting',
          status: 'PASSED',
          details: `Expired meeting marked as OVER successfully created replacement meeting`,
        });
        
        // Clean up replacement
        await prisma.schedule.delete({ where: { id: replacementMeeting2.id } });
      } else {
        console.log(`   ❌ No replacement meeting found for OVER status`);
        results.push({
          interviewType,
          testName: 'OVER Status → Replacement Meeting',
          status: 'FAILED',
          details: `Meeting marked as OVER but no replacement meeting was created`,
        });
      }
    } else {
      console.log(`   ❌ Expired meeting not marked as OVER (Status: ${overCheck?.status})`);
      results.push({
        interviewType,
        testName: 'OVER Status → Replacement Meeting',
        status: 'FAILED',
        details: `Expired meeting was not marked as OVER (current status: ${overCheck?.status})`,
      });
    }

    // Clean up
    await prisma.schedule.delete({ where: { id: expiredPendingMeeting.id } });

    console.log(`\n✅ ${interviewType} tests completed`);
    
  } catch (error) {
    console.error(`\n❌ Error testing ${interviewType}:`, error);
    results.push({
      interviewType,
      testName: 'Test Execution',
      status: 'FAILED',
      details: `Error during test execution: ${error}`,
    });
  }
}

// Run the test
testAutomaticMeetingCreation()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(results.some(r => r.status === 'FAILED') ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

