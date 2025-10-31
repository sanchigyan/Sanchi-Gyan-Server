// test-validation.ts
import { body, validationResult } from 'express-validator';

const testData = {
  courseId: "123e4567-e89b-12d3-a456-426614174000",
  title: "Test Class",
  description: "",  // Empty string - might cause issues
  scheduledAt: new Date().toISOString(),
  durationMinutes: 60,
  meetingLink: "",  // Empty string - might cause issues
  meetingPlatform: "ZOOM",
  maxAttendees: null  // null might cause issues
};

console.log('Testing validation with:', testData);

// Run validation
const validators = [
  body('courseId').isUUID(),
  body('title').trim().notEmpty(),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('scheduledAt').isISO8601().toDate(),
  body('durationMinutes').isInt({ min: 15, max: 480 }),
  body('meetingLink').optional({ nullable: true, checkFalsy: true }).isURL(),
  body('meetingPlatform').optional().isIn(['ZOOM', 'GOOGLE_MEET', 'WEBRTC']),
  body('maxAttendees').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }),
];

// Simulate request object
const req: any = {
  body: testData
};

// Run validators
Promise.all(validators.map(v => v.run(req))).then(() => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation Errors:', errors.array());
  } else {
    console.log('✅ Validation Passed!');
  }
});