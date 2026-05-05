import type { PoseLandmarker } from "@mediapipe/tasks-vision"

export interface PoseFrame {
  timestamp: number
  landmarks: Array<{ x: number; y: number; z: number }>
}

const KEY_JOINTS = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

export class ClientPoseExtractor {
  private poseLandmarker: PoseLandmarker | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    if (typeof window === "undefined") {
      throw new Error("MediaPipe can only be initialized in browser environment")
    }

    try {
      const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision")

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      )

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      })

      this.initialized = true
      console.log("[v0] MediaPipe initialized successfully")
    } catch (error) {
      console.error("[v0] MediaPipe initialization error:", error)
      throw new Error("Failed to initialize MediaPipe. Please ensure you're running in a browser environment.")
    }
  }

  async extractPosesFromVideo(
    videoFile: File,
    onProgress?: (percent: number) => void,
    onBatchReady?: (batch: PoseFrame[]) => Promise<void>,
  ): Promise<PoseFrame[]> {
    try {
      console.log("[v0] Initializing MediaPipe for pose extraction...")
      await this.initialize()

      return new Promise((resolve, reject) => {
        const video = document.createElement("video")
        video.src = URL.createObjectURL(videoFile)
        video.muted = true
        video.playsInline = true

        const allPoses: PoseFrame[] = []
        let batchPoses: PoseFrame[] = []
        const BATCH_SIZE = 50
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        video.onloadedmetadata = () => {
          console.log("[v0] Video loaded. Duration:", video.duration, "seconds")
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const duration = video.duration
          const fps = 1.5
          const interval = 1 / fps
          let currentTime = 0
          let frameCount = 0

          const extractFrame = async () => {
            if (currentTime >= duration) {
              if (batchPoses.length > 0 && onBatchReady) {
                try {
                  console.log("[v0] Saving final batch of", batchPoses.length, "frames")
                  await onBatchReady([...batchPoses])
                } catch (error) {
                  console.error("[v0] Failed to save final batch:", error)
                }
              }

              URL.revokeObjectURL(video.src)
              console.log(`[v0] Pose extraction complete: ${allPoses.length} frames extracted`)
              resolve(allPoses)
              return
            }

            video.currentTime = currentTime

            video.onseeked = async () => {
              try {
                ctx.drawImage(video, 0, 0)

                const result = this.poseLandmarker!.detectForVideo(video, currentTime * 1000)

                if (result.landmarks && result.landmarks.length > 0) {
                  const allLandmarks = result.landmarks[0]

                  const keyLandmarks = Object.values(KEY_JOINTS).map((idx) => ({
                    x: allLandmarks[idx].x,
                    y: allLandmarks[idx].y,
                    z: allLandmarks[idx].z,
                  }))

                  const poseFrame = {
                    timestamp: currentTime,
                    landmarks: keyLandmarks,
                  }

                  batchPoses.push(poseFrame)
                  allPoses.push(poseFrame)
                  frameCount++

                  if (batchPoses.length >= BATCH_SIZE && onBatchReady) {
                    try {
                      console.log("[v0] Batch complete. Uploading", batchPoses.length, "frames...")
                      await onBatchReady([...batchPoses])
                      batchPoses = []
                    } catch (error) {
                      console.error("[v0] Failed to save batch:", error)
                    }
                  }
                }

                const progress = (currentTime / duration) * 100
                if (onProgress) onProgress(Math.round(progress))

                currentTime += interval
                extractFrame()
              } catch (error) {
                console.error("[v0] Frame extraction error at", currentTime, "seconds:", error)
                currentTime += interval
                extractFrame()
              }
            }
          }

          extractFrame()
        }

        video.onerror = (e) => {
          console.error("[v0] Video load error:", e)
          reject(new Error("Failed to load video file. Please ensure it's a valid video format."))
        }

        video.load()
      })
    } catch (error) {
      console.error("[v0] extractPosesFromVideo error:", error)
      throw error
    }
  }

  comparePoses(userLandmarks: any[], instructorLandmarks: any[]): number {
    const keyJointIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    let totalSimilarity = 0
    let validJoints = 0

    for (const jointIdx of keyJointIndices) {
      const userJoint = userLandmarks[jointIdx]
      const instructorJoint = instructorLandmarks[jointIdx]

      if (!userJoint || !instructorJoint) continue

      const distance = Math.sqrt(
        Math.pow(userJoint.x - instructorJoint.x, 2) +
          Math.pow(userJoint.y - instructorJoint.y, 2) +
          Math.pow(userJoint.z - instructorJoint.z, 2),
      )

      const similarity = Math.max(0, 1 - distance * 2)
      totalSimilarity += similarity
      validJoints++
    }

    return validJoints > 0 ? (totalSimilarity / validJoints) * 100 : 0
  }
}

export async function extractPosesFromVideo(
  videoFile: File,
  onProgress?: (percent: number) => void,
  onBatchReady?: (batch: PoseFrame[]) => Promise<void>,
): Promise<PoseFrame[]> {
  const extractor = new ClientPoseExtractor()
  return extractor.extractPosesFromVideo(videoFile, onProgress, onBatchReady)
}
