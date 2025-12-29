// Golden Ratio Photo Evaluation Testing Module
// For training and testing the neural network with image data

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoldenRatioAnalyzer, FacialLandmarks, TrainingData, GoldenRatioAnalysis } from '@/lib/goldenRatioAnalyzer'

interface TestImage {
  id: string
  file: File
  preview: string
  landmarks?: FacialLandmarks
  analysis?: GoldenRatioAnalysis
  humanRating?: number
}

export default function GoldenRatioTestingModule() {
  const [analyzer] = useState(() => new GoldenRatioAnalyzer())
  const [trainImages, setTrainImages] = useState<TestImage[]>([])
  const [testImages, setTestImages] = useState<TestImage[]>([])
  const [currentMode, setCurrentMode] = useState<'train' | 'test'>('train')
  const [isTraining, setIsTraining] = useState(false)
  const [trainingResults, setTrainingResults] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<TestImage | null>(null)
  const [showLandmarkEditor, setShowLandmarkEditor] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newImages: TestImage[] = []

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9)
        const preview = URL.createObjectURL(file)
        
        newImages.push({
          id,
          file,
          preview
        })
      }
    })

    if (currentMode === 'train') {
      setTrainImages(prev => [...prev, ...newImages])
    } else {
      setTestImages(prev => [...prev, ...newImages])
    }
  }

  // Generate synthetic training data
  const generateSyntheticData = () => {
    console.log('🎲 Generating synthetic training data...')
    const syntheticData = analyzer.generateSyntheticTrainingData(100)
    
    // Convert to TestImage format for display
    const syntheticImages: TestImage[] = syntheticData.map(data => ({
      id: data.imageUrl,
      file: new File([], data.imageUrl, { type: 'image/jpeg' }),
      preview: '/api/placeholder/400/400', // Placeholder image
      landmarks: data.landmarks,
      analysis: analyzer.analyzeFacialProportions(data.landmarks),
      humanRating: data.humanRating
    }))

    setTrainImages(prev => [...prev, ...syntheticImages])
    console.log(`✅ Generated ${syntheticImages.length} synthetic training samples`)
  }

  // Start training the neural network
  const startTraining = async () => {
    if (trainImages.length === 0) {
      alert('Please add training images first or generate synthetic data')
      return
    }

    setIsTraining(true)
    console.log('🧠 Starting Golden Ratio Neural Network training...')

    try {
      // Prepare training data
      const trainingData: TrainingData[] = trainImages
        .filter(img => img.landmarks && img.analysis)
        .map(img => ({
          imageUrl: img.id,
          landmarks: img.landmarks!,
          humanRating: img.humanRating || 5,
          goldenRatioScore: img.analysis!.overallScore,
          metadata: {
            gender: 'other',
            age: 25,
            imageQuality: 0.8
          }
        }))

      const results = await analyzer.trainModel(trainingData)
      setTrainingResults(results)

      if (results.success) {
        console.log('🎉 Training completed successfully!')
      }

    } catch (error) {
      console.error('Training failed:', error)
    } finally {
      setIsTraining(false)
    }
  }

  // Test image analysis
  const analyzeTestImage = async (image: TestImage) => {
    if (!image.landmarks) {
      alert('Please set facial landmarks first')
      return
    }

    try {
      const analysis = analyzer.analyzeFacialProportions(image.landmarks)
      const neuralScore = await analyzer.predictGoldenRatioScore(image.landmarks)

      setTestImages(prev => 
        prev.map(img => 
          img.id === image.id 
            ? { ...img, analysis: { ...analysis, overallScore: neuralScore } }
            : img
        )
      )

    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  // Simple landmark editor (click to place points)
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Scale coordinates to image dimensions
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const actualX = x * scaleX
    const actualY = y * scaleY

    // Simple landmark placement (for demo purposes)
    // In production, this would use computer vision libraries
    const landmarks: FacialLandmarks = selectedImage.landmarks || {
      leftEye: { x: 0, y: 0 },
      rightEye: { x: 0, y: 0 },
      noseTip: { x: 0, y: 0 },
      mouthCenter: { x: 0, y: 0 },
      chinTip: { x: 0, y: 0 },
      foreheadTop: { x: 0, y: 0 },
      leftCheek: { x: 0, y: 0 },
      rightCheek: { x: 0, y: 0 },
      jawlineLeft: { x: 0, y: 0 },
      jawlineRight: { x: 0, y: 0 }
    }

    // Update the next empty landmark
    const landmarkKeys = Object.keys(landmarks) as (keyof FacialLandmarks)[]
    const emptyKey = landmarkKeys.find(key => landmarks[key].x === 0 && landmarks[key].y === 0)
    
    if (emptyKey) {
      landmarks[emptyKey] = { x: actualX, y: actualY }
      
      const updateImages = currentMode === 'train' ? setTrainImages : setTestImages
      updateImages(prev => 
        prev.map(img => 
          img.id === selectedImage.id 
            ? { ...img, landmarks }
            : img
        )
      )
      
      setSelectedImage({ ...selectedImage, landmarks })
    }
  }

  // Render landmark points on canvas
  const drawLandmarks = (canvas: HTMLCanvasElement, image: TestImage) => {
    if (!image.landmarks) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw image
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Draw landmark points
      ctx.fillStyle = 'red'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2

      Object.entries(image.landmarks!).forEach(([key, point], index) => {
        if (point.x > 0 || point.y > 0) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          
          // Label
          ctx.fillStyle = 'white'
          ctx.font = '12px Arial'
          ctx.fillText(`${index + 1}`, point.x + 8, point.y - 8)
          ctx.fillStyle = 'red'
        }
      })
    }
    img.src = image.preview
  }

  // Update canvas when selected image changes
  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      drawLandmarks(canvasRef.current, selectedImage)
    }
  }, [selectedImage])

  const currentImages = currentMode === 'train' ? trainImages : testImages
  const setCurrentImages = currentMode === 'train' ? setTrainImages : setTestImages

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔬 Golden Ratio Neural Network Testing
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Train and test facial proportion analysis using the Golden Ratio (φ ≈ 1.618)
          </p>
          
          {/* Mode Selection */}
          <div className="flex justify-center space-x-4 mb-6">
            <Button
              onClick={() => setCurrentMode('train')}
              variant={currentMode === 'train' ? 'default' : 'outline'}
              className={currentMode === 'train' ? 'bg-purple-600' : ''}
            >
              Training Mode ({trainImages.length} images)
            </Button>
            <Button
              onClick={() => setCurrentMode('test')}
              variant={currentMode === 'test' ? 'default' : 'outline'}
              className={currentMode === 'test' ? 'bg-blue-600' : ''}
            >
              Testing Mode ({testImages.length} images)
            </Button>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700"
            >
              📁 Upload Images
            </Button>
            
            {currentMode === 'train' && (
              <>
                <Button
                  onClick={generateSyntheticData}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  🎲 Generate Synthetic Data
                </Button>
                <Button
                  onClick={startTraining}
                  disabled={isTraining || trainImages.length === 0}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isTraining ? '🧠 Training...' : '🚀 Start Training'}
                </Button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Training Results */}
        {trainingResults && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">🎯 Training Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {trainingResults.success ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {trainingResults.epochs}
                </div>
                <div className="text-sm text-gray-600">Epochs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {trainingResults.finalLoss?.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">Final Loss</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {(trainingResults.accuracy * 100)?.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">
              {currentMode === 'train' ? '📚 Training Images' : '🧪 Test Images'}
            </h3>
            
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {currentImages.map(image => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                    selectedImage?.id === image.id ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.preview}
                    alt="Test"
                    className="w-full h-24 object-cover"
                  />
                  
                  {/* Analysis Results */}
                  {image.analysis && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1">
                      φ: {image.analysis.overallScore.toFixed(3)}
                      <br />
                      Sym: {(image.analysis.symmetryScore * 100).toFixed(0)}%
                    </div>
                  )}
                  
                  {/* Landmarks indicator */}
                  {image.landmarks && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>

            {currentImages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No images uploaded yet. Click "Upload Images" to get started.
              </div>
            )}
          </div>

          {/* Analysis Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">📊 Analysis Panel</h3>
            
            {selectedImage ? (
              <>
                {/* Image with Landmark Editor */}
                <div className="mb-4">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="w-full border border-gray-300 rounded-lg cursor-crosshair"
                    onClick={handleCanvasClick}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Click on the image to place facial landmarks (10 points needed)
                  </p>
                </div>

                {/* Controls */}
                <div className="flex space-x-2 mb-4">
                  <Button
                    onClick={() => analyzeTestImage(selectedImage)}
                    disabled={!selectedImage.landmarks}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    🔍 Analyze
                  </Button>
                  
                  {currentMode === 'train' && (
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      placeholder="Human rating (1-10)"
                      className="w-40"
                      onChange={(e) => {
                        const rating = parseFloat(e.target.value)
                        setCurrentImages(prev => 
                          prev.map(img => 
                            img.id === selectedImage.id 
                              ? { ...img, humanRating: rating }
                              : img
                          )
                        )
                      }}
                    />
                  )}
                </div>

                {/* Analysis Results */}
                {selectedImage.analysis && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <h4 className="font-bold text-lg mb-2">🏆 Golden Ratio Score</h4>
                      <div className="text-3xl font-bold text-orange-600">
                        {selectedImage.analysis.overallScore.toFixed(4)} / 1.618
                      </div>
                      <div className="text-sm text-gray-600">
                        {((selectedImage.analysis.overallScore / 1.618) * 100).toFixed(1)}% of perfect φ
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Symmetry:</strong> {(selectedImage.analysis.symmetryScore * 100).toFixed(1)}%
                      </div>
                      <div>
                        <strong>Confidence:</strong> {(selectedImage.analysis.confidence * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Phi Ratios */}
                    <div className="space-y-2">
                      <h5 className="font-bold">📏 Proportion Analysis:</h5>
                      {selectedImage.analysis.phiRatios.map((ratio, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span>{ratio.measurement}:</span>
                            <span className={ratio.score > 0.7 ? 'text-green-600' : 'text-red-600'}>
                              {(ratio.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-1">
                      <h5 className="font-bold">💡 Recommendations:</h5>
                      {selectedImage.analysis.recommendations.map((rec, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select an image to begin analysis
              </div>
            )}
          </div>
        </div>

        {/* Research Information */}
        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
          <h3 className="text-xl font-bold mb-4">🔬 Research Background</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold mb-2">Golden Ratio in Faces</h4>
              <p>The Golden Ratio (φ ≈ 1.618) appears in facial proportions considered most attractive. Key measurements include:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Face width to height ratio</li>
                <li>Eye distance to face width</li>
                <li>Nose to mouth vs chin proportions</li>
                <li>Vertical thirds and horizontal fifths</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">Neural Network Approach</h4>
              <p>Our system uses TensorFlow.js to:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Learn from facial landmark data</li>
                <li>Predict Golden Ratio scores</li>
                <li>Improve accuracy with more training</li>
                <li>Provide personalized recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
