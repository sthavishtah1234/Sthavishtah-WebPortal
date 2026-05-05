import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision"

let poseLandmarker: PoseLandmarker | null = null

export async function initializePoseDetection() {
  if (poseLandmarker) return poseLandmarker

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  )

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  })

  return poseLandmarker
}

export function detectPose(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult | null {
  if (!poseLandmarker || !video.videoWidth) return null
  return poseLandmarker.detectForVideo(video, timestamp)
}

export function calculateJointAngles(landmarks: any[]) {
  if (!landmarks || landmarks.length === 0) return null

  // Key joint indices from MediaPipe Pose
  const LEFT_SHOULDER = 11
  const LEFT_ELBOW = 13
  const LEFT_WRIST = 15
  const RIGHT_SHOULDER = 12
  const RIGHT_ELBOW = 14
  const RIGHT_WRIST = 16
  const LEFT_HIP = 23
  const LEFT_KNEE = 25
  const LEFT_ANKLE = 27
  const RIGHT_HIP = 24
  const RIGHT_KNEE = 26
  const RIGHT_ANKLE = 28

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs((radians * 180.0) / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }

  return {
    leftElbow: calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]),
    rightElbow: calculateAngle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]),
    leftKnee: calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE]),
    rightKnee: calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE]),
    leftShoulder: calculateAngle(landmarks[LEFT_ELBOW], landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP]),
    rightShoulder: calculateAngle(landmarks[RIGHT_ELBOW], landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP]),
    leftHip: calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_KNEE]),
    rightHip: calculateAngle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE]),
  }
}

export function comparePoses(instructorAngles: any, userAngles: any) {
  if (!instructorAngles || !userAngles) return 0

  const joints = [
    "leftElbow",
    "rightElbow",
    "leftKnee",
    "rightKnee",
    "leftShoulder",
    "rightShoulder",
    "leftHip",
    "rightHip",
  ]

  let totalDifference = 0
  let validJoints = 0

  joints.forEach((joint) => {
    const instructorAngle = instructorAngles[joint]
    const userAngle = userAngles[joint]

    if (instructorAngle !== undefined && userAngle !== undefined) {
      const diff = Math.abs(instructorAngle - userAngle)
      totalDifference += diff
      validJoints++
    }
  })

  if (validJoints === 0) return 0

  const avgDifference = totalDifference / validJoints
  const accuracy = Math.max(0, 100 - avgDifference / 1.8)
  return Math.round(accuracy)
}
