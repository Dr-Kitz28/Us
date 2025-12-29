// Golden Ratio Facial Analysis System
// Based on Leonardo da Vinci's Vitruvian principles and modern facial proportion research

import * as tf from '@tensorflow/tfjs'

export interface FacialLandmarks {
  // Key facial points for Golden Ratio analysis
  leftEye: { x: number; y: number }
  rightEye: { x: number; y: number }
  noseTip: { x: number; y: number }
  mouthCenter: { x: number; y: number }
  chinTip: { x: number; y: number }
  foreheadTop: { x: number; y: number }
  leftCheek: { x: number; y: number }
  rightCheek: { x: number; y: number }
  jawlineLeft: { x: number; y: number }
  jawlineRight: { x: number; y: number }
}

export interface GoldenRatioAnalysis {
  overallScore: number // 0-1.618 scale
  faceWidth: number
  faceHeight: number
  eyeDistance: number
  noseToMouthRatio: number
  chinToNoseRatio: number
  symmetryScore: number
  proportionBreakdown: {
    verticalThirds: number
    horizontalFifths: number
    eyeSpacing: number
    noseWidth: number
    mouthWidth: number
  }
  phiRatios: Array<{
    measurement: string
    value: number
    idealPhi: number
    deviation: number
    score: number
  }>
  confidence: number
  recommendations: string[]
}

export interface TrainingData {
  imageUrl: string
  landmarks: FacialLandmarks
  humanRating: number // 1-10 human attractiveness rating
  goldenRatioScore: number // Calculated golden ratio score
  metadata: {
    gender: 'male' | 'female' | 'other'
    age: number
    ethnicity?: string
    imageQuality: number
  }
}

export class GoldenRatioAnalyzer {
  private model: tf.LayersModel | null = null
  private isModelLoaded = false
  private readonly PHI = 1.618033988749 // Golden Ratio
  
  constructor() {
    this.initializeModel()
  }

  // Initialize TensorFlow model for facial landmark detection and ratio analysis
  private async initializeModel() {
    try {
      // If a model has already been created in this Node process (build/runtime), reuse it.
      // This prevents TensorFlow from re-registering variables/kernels and throwing
      // errors like "Variable with name ... was already registered" when the
      // module is imported multiple times during Next.js build/SSR.
      const gw = globalThis as any
      if (gw.__goldenRatioModel) {
        this.model = gw.__goldenRatioModel
        this.isModelLoaded = true
        console.log('🎯 Reusing existing Golden Ratio model instance')
        return
      }
      // In production, this would load a pre-trained model
      // For now, we'll create a basic neural network architecture
      this.model = tf.sequential({
        layers: [
          // Input layer: processed facial landmarks (20 points * 2 coordinates = 40 inputs)
          tf.layers.dense({
            inputShape: [40],
            units: 128,
            activation: 'relu',
            name: 'landmark_input'
          }),
          
          // Hidden layers for facial proportion analysis
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu',
            name: 'proportion_analysis'
          }),
          
          tf.layers.dropout({ rate: 0.15 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            name: 'golden_ratio_processing'
          }),
          
          // Output layer: Golden ratio score (0-1.618)
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid',
            name: 'phi_score_output'
          })
        ]
      })

      // Compile with custom loss function for golden ratio optimization
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: this.customPhiLoss,
        metrics: ['mse', 'mae']
      })

      this.isModelLoaded = true
      // Save model on globalThis so subsequent imports reuse the same instance
      try {
        (globalThis as any).__goldenRatioModel = this.model
      } catch (e) {
        // ignore if we can't write to globalThis for some reason
      }

      console.log('🎯 Golden Ratio Neural Network initialized')
      
    } catch (error) {
      console.error('Error initializing Golden Ratio model:', error)
    }
  }

  // Custom loss function that prioritizes golden ratio proportions
  private customPhiLoss(yTrue: tf.Tensor, yPred: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      // Standard MSE loss
      const mse = tf.losses.meanSquaredError(yTrue, yPred)
      
      // Penalty for deviating from golden ratio principles
      const phiTarget = tf.scalar(this.PHI / 2) // Normalize to 0-1 range
      const phiPenalty = tf.square(tf.sub(yPred, phiTarget))
      
      // Combine losses (70% accuracy, 30% golden ratio adherence)
      return tf.add(tf.mul(mse, 0.7), tf.mul(phiPenalty, 0.3))
    })
  }

  // Analyze facial proportions based on Golden Ratio principles
  public analyzeFacialProportions(landmarks: FacialLandmarks): GoldenRatioAnalysis {
    const measurements = this.calculateFacialMeasurements(landmarks)
    const phiRatios = this.calculatePhiRatios(measurements)
    const symmetryScore = this.calculateSymmetry(landmarks)
    
    // Calculate overall Golden Ratio score
    const averagePhiScore = phiRatios.reduce((sum, ratio) => sum + ratio.score, 0) / phiRatios.length
    const overallScore = Math.min(this.PHI, (averagePhiScore * symmetryScore) * this.PHI)
    
    const recommendations = this.generateRecommendations(phiRatios, symmetryScore)
    
    return {
      overallScore,
      faceWidth: measurements.faceWidth,
      faceHeight: measurements.faceHeight,
      eyeDistance: measurements.eyeDistance,
      noseToMouthRatio: measurements.noseToMouthRatio,
      chinToNoseRatio: measurements.chinToNoseRatio,
      symmetryScore,
      proportionBreakdown: {
        verticalThirds: measurements.verticalThirds,
        horizontalFifths: measurements.horizontalFifths,
        eyeSpacing: measurements.eyeSpacing,
        noseWidth: measurements.noseWidth,
        mouthWidth: measurements.mouthWidth
      },
      phiRatios,
      confidence: this.calculateConfidence(landmarks),
      recommendations
    }
  }

  private calculateFacialMeasurements(landmarks: FacialLandmarks) {
    const faceWidth = Math.abs(landmarks.jawlineRight.x - landmarks.jawlineLeft.x)
    const faceHeight = Math.abs(landmarks.foreheadTop.y - landmarks.chinTip.y)
    const eyeDistance = Math.abs(landmarks.rightEye.x - landmarks.leftEye.x)
    
    const noseToMouth = Math.abs(landmarks.noseTip.y - landmarks.mouthCenter.y)
    const chinToNose = Math.abs(landmarks.chinTip.y - landmarks.noseTip.y)
    const noseToMouthRatio = noseToMouth / chinToNose
    const chinToNoseRatio = chinToNose / faceHeight
    
    // Calculate facial thirds and fifths (classical proportion rules)
    const upperThird = Math.abs(landmarks.foreheadTop.y - landmarks.leftEye.y)
    const middleThird = Math.abs(landmarks.leftEye.y - landmarks.noseTip.y)  
    const lowerThird = Math.abs(landmarks.noseTip.y - landmarks.chinTip.y)
    const verticalThirds = Math.abs((upperThird - middleThird) + (middleThird - lowerThird)) / faceHeight
    
    const horizontalFifths = eyeDistance / faceWidth
    const eyeSpacing = eyeDistance / faceWidth
    const noseWidth = Math.abs(landmarks.leftCheek.x - landmarks.rightCheek.x) / faceWidth
    const mouthWidth = 0.6 // Placeholder - would be calculated from actual mouth landmarks
    
    return {
      faceWidth,
      faceHeight,
      eyeDistance,
      noseToMouthRatio,
      chinToNoseRatio,
      verticalThirds,
      horizontalFifths,
      eyeSpacing,
      noseWidth,
      mouthWidth
    }
  }

  private calculatePhiRatios(measurements: any): Array<{
    measurement: string
    value: number
    idealPhi: number
    deviation: number
    score: number
  }> {
    const ratios = [
      {
        measurement: 'Face Width to Height',
        value: measurements.faceWidth / measurements.faceHeight,
        idealPhi: 1.0 / this.PHI, // Reciprocal for face proportions
      },
      {
        measurement: 'Eye Distance to Face Width',
        value: measurements.eyeDistance / measurements.faceWidth,
        idealPhi: 1.0 / this.PHI,
      },
      {
        measurement: 'Nose to Mouth vs Chin to Nose',
        value: measurements.noseToMouthRatio,
        idealPhi: 1.0 / this.PHI,
      },
      {
        measurement: 'Vertical Face Thirds',
        value: measurements.verticalThirds,
        idealPhi: 0.2, // Ideal deviation for equal thirds
      },
      {
        measurement: 'Horizontal Face Fifths',
        value: measurements.horizontalFifths,
        idealPhi: 0.2, // One-fifth proportion
      }
    ]

    return ratios.map(ratio => {
      const deviation = Math.abs(ratio.value - ratio.idealPhi)
      const score = Math.max(0, 1 - (deviation / ratio.idealPhi))
      
      return {
        ...ratio,
        deviation,
        score
      }
    })
  }

  private calculateSymmetry(landmarks: FacialLandmarks): number {
    // Calculate facial symmetry score
    const centerX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2
    
    const leftSidePoints = [landmarks.leftEye, landmarks.leftCheek, landmarks.jawlineLeft]
    const rightSidePoints = [landmarks.rightEye, landmarks.rightCheek, landmarks.jawlineRight]
    
    let symmetrySum = 0
    for (let i = 0; i < leftSidePoints.length; i++) {
      const leftDistance = Math.abs(leftSidePoints[i].x - centerX)
      const rightDistance = Math.abs(rightSidePoints[i].x - centerX)
      const symmetryRatio = Math.min(leftDistance, rightDistance) / Math.max(leftDistance, rightDistance)
      symmetrySum += symmetryRatio
    }
    
    return symmetrySum / leftSidePoints.length
  }

  private calculateConfidence(landmarks: FacialLandmarks): number {
    // Calculate confidence based on landmark detection quality
    // This would be more sophisticated with actual computer vision
    const landmarkCount = Object.keys(landmarks).length
    const expectedLandmarks = 10
    
    return Math.min(1.0, landmarkCount / expectedLandmarks)
  }

  private generateRecommendations(phiRatios: any[], symmetryScore: number): string[] {
    const recommendations: string[] = []
    
    // Analyze each ratio and provide specific feedback
    phiRatios.forEach(ratio => {
      if (ratio.score < 0.7) {
        switch (ratio.measurement) {
          case 'Face Width to Height':
            recommendations.push('Consider photo angles that better showcase your facial proportions')
            break
          case 'Eye Distance to Face Width':
            recommendations.push('Eye makeup or lighting can enhance eye proportions in photos')
            break
          case 'Nose to Mouth vs Chin to Nose':
            recommendations.push('Slight chin angle adjustments can improve profile proportions')
            break
        }
      }
    })
    
    if (symmetryScore < 0.8) {
      recommendations.push('Try taking photos straight-on for better facial symmetry')
      recommendations.push('Ensure even lighting on both sides of your face')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Excellent facial proportions! Your photos showcase ideal golden ratio principles')
    }
    
    return recommendations
  }

  // Train the neural network with user data
  public async trainModel(trainingData: TrainingData[]): Promise<{
    success: boolean
    epochs: number
    finalLoss: number
    accuracy: number
  }> {
    if (!this.model || !this.isModelLoaded) {
      throw new Error('Model not initialized')
    }

    console.log(`🧠 Training Golden Ratio Neural Network with ${trainingData.length} samples...`)

    // Prepare training data
    const { inputs, outputs } = this.prepareTrainingData(trainingData)
    
    try {
      // Train the model
      const history = await this.model.fit(inputs, outputs, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`)
            }
          }
        }
      })

      const finalLoss = history.history.loss[history.history.loss.length - 1] as number
      const finalValLoss = history.history.val_loss?.[history.history.val_loss.length - 1] as number
      const accuracy = 1 - finalValLoss // Simplified accuracy calculation

      console.log('🎉 Training completed!')
      console.log(`Final Loss: ${finalLoss.toFixed(4)}`)
      console.log(`Validation Accuracy: ${(accuracy * 100).toFixed(2)}%`)

      // Save the trained model
      await this.saveModel()

      return {
        success: true,
        epochs: history.epoch.length,
        finalLoss,
        accuracy
      }

    } catch (error) {
      console.error('Training error:', error)
      return {
        success: false,
        epochs: 0,
        finalLoss: 0,
        accuracy: 0
      }
    }
  }

  private prepareTrainingData(data: TrainingData[]) {
    const inputs: number[][] = []
    const outputs: number[] = []

    data.forEach(sample => {
      // Convert landmarks to feature vector (40 values: 20 points * 2 coordinates)
      const featureVector = this.landmarksToFeatureVector(sample.landmarks)
      inputs.push(featureVector)
      
      // Normalize golden ratio score to 0-1 range for training
      outputs.push(sample.goldenRatioScore / this.PHI)
    })

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    }
  }

  private landmarksToFeatureVector(landmarks: FacialLandmarks): number[] {
    const vector: number[] = []
    
    // Normalize coordinates to 0-1 range (assuming 512x512 image)
    const normalize = (coord: { x: number; y: number }) => [
      coord.x / 512,
      coord.y / 512
    ]

    // Add all landmark coordinates to feature vector
    Object.values(landmarks).forEach(coord => {
      vector.push(...normalize(coord))
    })

    return vector
  }

  // Predict Golden Ratio score using trained model
  public async predictGoldenRatioScore(landmarks: FacialLandmarks): Promise<number> {
    if (!this.model || !this.isModelLoaded) {
      // Fallback to mathematical calculation if model not ready
      return this.analyzeFacialProportions(landmarks).overallScore
    }

    try {
      const featureVector = this.landmarksToFeatureVector(landmarks)
      const input = tf.tensor2d([featureVector])
      
      const prediction = this.model.predict(input) as tf.Tensor
      const score = await prediction.data()
      
      input.dispose()
      prediction.dispose()
      
      // Convert back from normalized 0-1 range to 0-1.618 range
      return score[0] * this.PHI
      
    } catch (error) {
      console.error('Prediction error:', error)
      // Fallback to mathematical calculation
      return this.analyzeFacialProportions(landmarks).overallScore
    }
  }

  // Save trained model
  private async saveModel(): Promise<void> {
    if (!this.model) return
    
    try {
      await this.model.save('file://./models/golden-ratio-analyzer')
      console.log('✅ Model saved successfully')
    } catch (error) {
      console.error('Error saving model:', error)
    }
  }

  // Load pre-trained model
  public async loadModel(modelPath: string): Promise<boolean> {
    try {
      this.model = await tf.loadLayersModel(modelPath)
      this.isModelLoaded = true
      console.log('✅ Pre-trained model loaded successfully')
      return true
    } catch (error) {
      console.error('Error loading model:', error)
      return false
    }
  }

  // Generate synthetic training data for testing
  public generateSyntheticTrainingData(count: number): TrainingData[] {
    const syntheticData: TrainingData[] = []
    
    for (let i = 0; i < count; i++) {
      // Generate random but realistic facial landmarks
      const landmarks: FacialLandmarks = {
        leftEye: { x: 150 + Math.random() * 20, y: 180 + Math.random() * 20 },
        rightEye: { x: 350 + Math.random() * 20, y: 180 + Math.random() * 20 },
        noseTip: { x: 250 + Math.random() * 10, y: 250 + Math.random() * 15 },
        mouthCenter: { x: 250 + Math.random() * 10, y: 320 + Math.random() * 15 },
        chinTip: { x: 250 + Math.random() * 15, y: 450 + Math.random() * 20 },
        foreheadTop: { x: 250 + Math.random() * 20, y: 80 + Math.random() * 20 },
        leftCheek: { x: 200 + Math.random() * 15, y: 280 + Math.random() * 20 },
        rightCheek: { x: 300 + Math.random() * 15, y: 280 + Math.random() * 20 },
        jawlineLeft: { x: 150 + Math.random() * 25, y: 380 + Math.random() * 30 },
        jawlineRight: { x: 350 + Math.random() * 25, y: 380 + Math.random() * 30 }
      }
      
      const analysis = this.analyzeFacialProportions(landmarks)
      
      syntheticData.push({
        imageUrl: `synthetic_${i}.jpg`,
        landmarks,
        humanRating: Math.min(10, Math.max(1, (analysis.overallScore / this.PHI) * 10 + Math.random() * 2 - 1)),
        goldenRatioScore: analysis.overallScore,
        metadata: {
          gender: Math.random() > 0.5 ? 'female' : 'male',
          age: 18 + Math.random() * 50,
          imageQuality: 0.7 + Math.random() * 0.3
        }
      })
    }
    
    return syntheticData
  }
}
