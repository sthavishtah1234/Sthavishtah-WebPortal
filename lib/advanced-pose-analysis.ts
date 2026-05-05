import type { NormalizedLandmark } from "@mediapipe/tasks-vision"

export interface PoseAnalysisResult {
  overallAccuracy: number
  scaledAccuracy: number // New: 80% base + 20% scaled
  jointAccuracies: Record<string, number>
  jointAngles: Record<string, { user: number; instructor: number; diff: number }> // New: angle comparison
  symmetryScore: number // New: left/right symmetry
  velocityScore: number
  stabilityScore: number
  transitionQuality: number
  formFeedback: string[]
  detectedPose: string
}

// Dynamic Time Warping for temporal alignment
export function calculateDTW(instructorSequence: number[][], userSequence: number[][]): number {
  const n = instructorSequence.length
  const m = userSequence.length
  const dtw: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(Number.POSITIVE_INFINITY))

  dtw[0][0] = 0

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = euclideanDistance(instructorSequence[i - 1], userSequence[j - 1])
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1])
    }
  }

  return dtw[n][m] / Math.max(n, m)
}

function euclideanDistance(point1: number[], point2: number[]): number {
  return Math.sqrt(point1.reduce((sum, val, idx) => sum + Math.pow(val - point2[idx], 2), 0))
}

// Analyze motion trajectory
export function analyzeTrajectory(
  landmarks: any[][],
  jointIndex: number,
): { velocity: number; acceleration: number; smoothness: number; stability: number } {
  if (landmarks.length < 3) {
    return { velocity: 0, acceleration: 0, smoothness: 0, stability: 0 }
  }

  const positions = landmarks.map((frame) => frame[jointIndex]).filter((p) => p)
  if (positions.length < 3) {
    return { velocity: 0, acceleration: 0, smoothness: 0, stability: 0 }
  }

  const velocities: number[] = []

  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x
    const dy = positions[i].y - positions[i - 1].y
    const dz = (positions[i].z || 0) - (positions[i - 1].z || 0)
    velocities.push(Math.sqrt(dx * dx + dy * dy + dz * dz))
  }

  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length

  const accelerations: number[] = []
  for (let i = 1; i < velocities.length; i++) {
    accelerations.push(Math.abs(velocities[i] - velocities[i - 1]))
  }
  const avgAcceleration = accelerations.length > 0 ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0

  const velocityVariance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length
  const smoothness = Math.max(0, 100 - velocityVariance * 1000)

  const totalMovement = velocities.reduce((a, b) => a + b, 0)
  const stability = Math.max(0, 100 - totalMovement * 100)

  return {
    velocity: avgVelocity,
    acceleration: avgAcceleration,
    smoothness: Math.min(100, smoothness),
    stability: Math.min(100, stability),
  }
}

// Detect pose transitions
export function detectPoseTransition(
  currentPose: NormalizedLandmark[],
  previousPose: NormalizedLandmark[],
  threshold = 0.15,
): boolean {
  if (!previousPose || previousPose.length === 0) return false

  let totalChange = 0
  const keyJoints = [11, 12, 13, 14, 23, 24, 25, 26] // shoulders, elbows, hips, knees

  for (const jointIdx of keyJoints) {
    const curr = currentPose[jointIdx]
    const prev = previousPose[jointIdx]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    totalChange += Math.sqrt(dx * dx + dy * dy)
  }

  return totalChange / keyJoints.length > threshold
}

// Calculate joint angle
export function calculateJointAngle(
  point1: { x: number; y: number; z?: number },
  point2: { x: number; y: number; z?: number }, // vertex
  point3: { x: number; y: number; z?: number },
): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: (point1.z || 0) - (point2.z || 0),
  }
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
    z: (point3.z || 0) - (point2.z || 0),
  }

  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z
  const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2)
  const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2)

  if (magnitude1 === 0 || magnitude2 === 0) return 0

  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magnitude1 * magnitude2)))
  const angleRad = Math.acos(cosAngle)
  return (angleRad * 180) / Math.PI
}

// Comprehensive pose analysis
export function analyzePoseQuality(
  instructorPose: NormalizedLandmark[],
  userPose: NormalizedLandmark[],
  previousUserPoses: NormalizedLandmark[][] = [],
): PoseAnalysisResult {
  const jointPairs = {
    leftElbow: { points: [11, 13, 15], name: "Left Elbow" },
    rightElbow: { points: [12, 14, 16], name: "Right Elbow" },
    leftKnee: { points: [23, 25, 27], name: "Left Knee" },
    rightKnee: { points: [24, 26, 28], name: "Right Knee" },
    leftShoulder: { points: [13, 11, 23], name: "Left Shoulder" },
    rightShoulder: { points: [14, 12, 24], name: "Right Shoulder" },
    leftHip: { points: [11, 23, 25], name: "Left Hip" },
    rightHip: { points: [12, 24, 26], name: "Right Hip" },
  }

  const jointAccuracies: Record<string, number> = {}
  let totalAccuracy = 0
  const feedback: string[] = []

  // Analyze each joint
  for (const [key, joint] of Object.entries(jointPairs)) {
    const instructorAngle = calculateJointAngle(
      instructorPose[joint.points[0]],
      instructorPose[joint.points[1]],
      instructorPose[joint.points[2]],
    )

    const userAngle = calculateJointAngle(
      userPose[joint.points[0]],
      userPose[joint.points[1]],
      userPose[joint.points[2]],
    )

    const angleDiff = Math.abs(instructorAngle - userAngle)

    jointAccuracies[key] = Math.max(0, 100 - angleDiff * 2)
    totalAccuracy += jointAccuracies[key]

    if (jointAccuracies[key] < 70) {
      feedback.push(`${joint.name}: ${angleDiff > 0 ? "Adjust angle" : "Good"} (${jointAccuracies[key].toFixed(0)}%)`)
    }
  }

  const overallAccuracy = totalAccuracy / Object.keys(jointPairs).length

  // Motion analysis if we have history
  let velocityScore = 100
  let stabilityScore = 100
  let transitionQuality = 100

  if (previousUserPoses.length > 0) {
    const metrics = analyzeTrajectory(
      [...previousUserPoses, userPose],
      13, // Right elbow as reference
    )
    velocityScore = 100 - Math.min(100, metrics.velocity * 500)
    stabilityScore = metrics.stability
    transitionQuality = metrics.smoothness
  }

  // Detect pose type (basic classification)
  const detectedPose = classifyPose(userPose)

  return {
    overallAccuracy,
    scaledAccuracy: overallAccuracy, // Placeholder for scaled accuracy
    jointAccuracies,
    jointAngles: {}, // Placeholder for joint angles
    symmetryScore: 100, // Placeholder for symmetry score
    velocityScore,
    stabilityScore,
    transitionQuality,
    formFeedback: feedback,
    detectedPose,
  }
}

// Basic pose classification
function classifyPose(pose: any[]): string {
  if (!pose || pose.length < 29) return "Unknown"

  const leftHip = pose[23]
  const rightHip = pose[24]
  const leftShoulder = pose[11]
  const rightShoulder = pose[12]
  const leftKnee = pose[25]
  const rightKnee = pose[26]

  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder || !leftKnee || !rightKnee) {
    return "Unknown"
  }

  const hipMidpoint = (leftHip.y + rightHip.y) / 2
  const shoulderMidpoint = (leftShoulder.y + rightShoulder.y) / 2
  const kneeMidpoint = (leftKnee.y + rightKnee.y) / 2

  if (hipMidpoint < 0.7 && kneeMidpoint > 0.8) return "Standing"
  if (hipMidpoint > 0.6 && kneeMidpoint > 0.7) return "Seated"
  if (Math.abs(shoulderMidpoint - hipMidpoint) < 0.1) return "Plank/Horizontal"
  if (hipMidpoint > 0.5 && kneeMidpoint > 0.7) return "Squat/Lunge"

  return "Unknown"
}

// Calculate overall form score with weighted components
export function calculateFormScore(analysis: PoseAnalysisResult): number {
  const weights = {
    accuracy: 0.5,
    velocity: 0.15,
    stability: 0.2,
    transition: 0.15,
  }

  return (
    analysis.scaledAccuracy * weights.accuracy +
    analysis.velocityScore * weights.velocity +
    analysis.stabilityScore * weights.stability +
    analysis.transitionQuality * weights.transition
  )
}

export function scaleAccuracy(rawAccuracy: number): number {
  // Base accuracy: 80%
  // Variable accuracy: 0-20% based on actual comparison
  // Formula: Final = 80% + (raw_accuracy * 0.20)
  const BASE_ACCURACY = 80
  const VARIABLE_RANGE = 20

  const scaledAccuracy = BASE_ACCURACY + (rawAccuracy / 100) * VARIABLE_RANGE
  return Math.min(100, Math.max(BASE_ACCURACY, scaledAccuracy))
}

export function normalizeBodyProportions(landmarks: any[]): any[] {
  if (!landmarks || landmarks.length < 25) return landmarks

  // Calculate torso length (shoulder midpoint to hip midpoint)
  const leftShoulder = landmarks[11] || landmarks[0]
  const rightShoulder = landmarks[12] || landmarks[1]
  const leftHip = landmarks[23] || landmarks[6]
  const rightHip = landmarks[24] || landmarks[7]

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2
  const hipMidX = (leftHip.x + rightHip.x) / 2
  const hipMidY = (leftHip.y + rightHip.y) / 2

  const torsoLength = Math.sqrt(Math.pow(shoulderMidX - hipMidX, 2) + Math.pow(shoulderMidY - hipMidY, 2))

  if (torsoLength === 0) return landmarks

  // Normalize all landmarks relative to torso length and center on hip midpoint
  return landmarks.map((lm) => ({
    x: (lm.x - hipMidX) / torsoLength,
    y: (lm.y - hipMidY) / torsoLength,
    z: (lm.z || 0) / torsoLength,
    visibility: lm.visibility,
  }))
}

export function calculateSymmetryScore(landmarks: any[]): { score: number; feedback: string[] } {
  if (!landmarks || landmarks.length < 29) {
    return { score: 100, feedback: [] }
  }

  const pairs = [
    { left: 11, right: 12, name: "shoulders" }, // shoulders
    { left: 13, right: 14, name: "elbows" }, // elbows
    { left: 15, right: 16, name: "wrists" }, // wrists
    { left: 23, right: 24, name: "hips" }, // hips
    { left: 25, right: 26, name: "knees" }, // knees
    { left: 27, right: 28, name: "ankles" }, // ankles
  ]

  const feedback: string[] = []
  let totalSymmetry = 0
  let validPairs = 0

  for (const pair of pairs) {
    const leftPoint = landmarks[pair.left]
    const rightPoint = landmarks[pair.right]

    if (leftPoint && rightPoint) {
      // Calculate height difference (y-axis asymmetry)
      const yDiff = Math.abs(leftPoint.y - rightPoint.y)
      // Calculate depth difference (z-axis asymmetry)
      const zDiff = Math.abs((leftPoint.z || 0) - (rightPoint.z || 0))

      // Symmetry score for this pair (lower difference = higher score)
      const pairSymmetry = Math.max(0, 100 - (yDiff + zDiff) * 200)
      totalSymmetry += pairSymmetry
      validPairs++

      // Add feedback for significant asymmetries
      if (pairSymmetry < 70) {
        if (leftPoint.y < rightPoint.y) {
          feedback.push(`Left ${pair.name} is higher than right`)
        } else if (rightPoint.y < leftPoint.y) {
          feedback.push(`Right ${pair.name} is higher than left`)
        }
      }
    }
  }

  const score = validPairs > 0 ? totalSymmetry / validPairs : 100
  return { score, feedback }
}

export function compareJointAngles(
  userLandmarks: any[],
  instructorLandmarks: any[],
): {
  angles: Record<string, { user: number; instructor: number; diff: number }>
  accuracy: number
  feedback: string[]
} {
  const jointDefinitions = [
    { name: "left_elbow", points: [11, 13, 15], userPoints: [11, 13, 15], label: "Left Elbow" },
    { name: "right_elbow", points: [12, 14, 16], userPoints: [12, 14, 16], label: "Right Elbow" },
    { name: "left_shoulder", points: [13, 11, 23], userPoints: [13, 11, 23], label: "Left Shoulder" },
    { name: "right_shoulder", points: [14, 12, 24], userPoints: [14, 12, 24], label: "Right Shoulder" },
    { name: "left_hip", points: [11, 23, 25], userPoints: [11, 23, 25], label: "Left Hip" },
    { name: "right_hip", points: [12, 24, 26], userPoints: [12, 24, 26], label: "Right Hip" },
    { name: "left_knee", points: [23, 25, 27], userPoints: [23, 25, 27], label: "Left Knee" },
    { name: "right_knee", points: [24, 26, 28], userPoints: [24, 26, 28], label: "Right Knee" },
  ]

  const angles: Record<string, { user: number; instructor: number; diff: number }> = {}
  const feedback: string[] = []
  let totalAccuracy = 0
  let validJoints = 0

  // Map instructor landmarks (12 key points) to full 33 point indices
  const instructorMapping: Record<number, number> = {
    11: 0,
    12: 1,
    13: 2,
    14: 3,
    15: 4,
    16: 5, // Upper body
    23: 6,
    24: 7,
    25: 8,
    26: 9,
    27: 10,
    28: 11, // Lower body
  }

  for (const joint of jointDefinitions) {
    try {
      // Get instructor points using mapping
      const instIdx0 = instructorMapping[joint.points[0]]
      const instIdx1 = instructorMapping[joint.points[1]]
      const instIdx2 = instructorMapping[joint.points[2]]

      if (instIdx0 === undefined || instIdx1 === undefined || instIdx2 === undefined) continue
      if (!instructorLandmarks[instIdx0] || !instructorLandmarks[instIdx1] || !instructorLandmarks[instIdx2]) continue
      if (
        !userLandmarks[joint.userPoints[0]] ||
        !userLandmarks[joint.userPoints[1]] ||
        !userLandmarks[joint.userPoints[2]]
      )
        continue

      const instructorAngle = calculateJointAngle(
        instructorLandmarks[instIdx0],
        instructorLandmarks[instIdx1],
        instructorLandmarks[instIdx2],
      )

      const userAngle = calculateJointAngle(
        userLandmarks[joint.userPoints[0]],
        userLandmarks[joint.userPoints[1]],
        userLandmarks[joint.userPoints[2]],
      )

      const angleDiff = Math.abs(instructorAngle - userAngle)

      angles[joint.name] = {
        user: Math.round(userAngle),
        instructor: Math.round(instructorAngle),
        diff: Math.round(angleDiff),
      }

      // Accuracy based on angle difference (0-30 degrees = good)
      const jointAccuracy = Math.max(0, 100 - (angleDiff / 30) * 100)
      totalAccuracy += jointAccuracy
      validJoints++

      // Add feedback for significant angle differences
      if (angleDiff > 15) {
        if (userAngle < instructorAngle) {
          feedback.push(`${joint.label}: Extend more (+${Math.round(angleDiff)}°)`)
        } else {
          feedback.push(`${joint.label}: Bend more (-${Math.round(angleDiff)}°)`)
        }
      }
    } catch (error) {
      // Skip this joint if calculation fails
    }
  }

  const accuracy = validJoints > 0 ? totalAccuracy / validJoints : 0
  return { angles, accuracy, feedback }
}

export function analyzePoseQualityEnhanced(
  instructorLandmarks: any[],
  userLandmarks: any[],
  previousUserPoses: any[][] = [],
): PoseAnalysisResult {
  // 1. Normalize body proportions for fair comparison
  const normalizedUser = normalizeBodyProportions(userLandmarks)
  const normalizedInstructor = normalizeBodyProportions(
    // Map 12 instructor landmarks to positions matching user
    instructorLandmarks,
  )

  // 2. Calculate joint angles comparison
  const angleComparison = compareJointAngles(userLandmarks, instructorLandmarks)

  // 3. Calculate symmetry score
  const symmetry = calculateSymmetryScore(userLandmarks)

  // 4. Calculate raw position-based accuracy
  const keyPointMapping = [
    { name: "left_shoulder", userIndex: 11, instructorIndex: 0 },
    { name: "right_shoulder", userIndex: 12, instructorIndex: 1 },
    { name: "left_elbow", userIndex: 13, instructorIndex: 2 },
    { name: "right_elbow", userIndex: 14, instructorIndex: 3 },
    { name: "left_wrist", userIndex: 15, instructorIndex: 4 },
    { name: "right_wrist", userIndex: 16, instructorIndex: 5 },
    { name: "left_hip", userIndex: 23, instructorIndex: 6 },
    { name: "right_hip", userIndex: 24, instructorIndex: 7 },
    { name: "left_knee", userIndex: 25, instructorIndex: 8 },
    { name: "right_knee", userIndex: 26, instructorIndex: 9 },
    { name: "left_ankle", userIndex: 27, instructorIndex: 10 },
    { name: "right_ankle", userIndex: 28, instructorIndex: 11 },
  ]

  const jointAccuracies: Record<string, number> = {}
  let positionAccuracy = 0
  let validJoints = 0

  for (const mapping of keyPointMapping) {
    const userPoint = userLandmarks[mapping.userIndex]
    const instructorPoint = instructorLandmarks[mapping.instructorIndex]

    if (userPoint && instructorPoint && instructorPoint.x !== undefined) {
      const distance = Math.sqrt(
        Math.pow(userPoint.x - instructorPoint.x, 2) +
          Math.pow(userPoint.y - instructorPoint.y, 2) +
          Math.pow((userPoint.z || 0) - (instructorPoint.z || 0), 2),
      )

      const accuracy = Math.max(0, 100 - distance * 100)
      jointAccuracies[mapping.name] = accuracy
      positionAccuracy += accuracy
      validJoints++
    }
  }

  const rawPositionAccuracy = validJoints > 0 ? positionAccuracy / validJoints : 0

  // 5. Combine all metrics for overall accuracy
  // Weight: 40% position, 40% angles, 20% symmetry
  const combinedRawAccuracy = rawPositionAccuracy * 0.4 + angleComparison.accuracy * 0.4 + symmetry.score * 0.2

  // 6. Apply 80% base + 20% scaled formula
  const scaledAccuracy = scaleAccuracy(combinedRawAccuracy)

  // 7. Motion analysis if we have history
  let velocityScore = 100
  let stabilityScore = 100
  let transitionQuality = 100

  if (previousUserPoses.length >= 3) {
    const metrics = analyzeTrajectory([...previousUserPoses, userLandmarks], 13)
    velocityScore = 100 - Math.min(100, metrics.velocity * 500)
    stabilityScore = metrics.stability
    transitionQuality = metrics.smoothness
  }

  // 8. Detect pose type
  const detectedPose = classifyPose(userLandmarks)

  // 9. Combine all feedback
  const allFeedback = [...angleComparison.feedback, ...symmetry.feedback]

  return {
    overallAccuracy: combinedRawAccuracy,
    scaledAccuracy,
    jointAccuracies,
    jointAngles: angleComparison.angles,
    symmetryScore: symmetry.score,
    velocityScore,
    stabilityScore,
    transitionQuality,
    formFeedback: allFeedback.slice(0, 5), // Max 5 feedback items
    detectedPose,
  }
}
