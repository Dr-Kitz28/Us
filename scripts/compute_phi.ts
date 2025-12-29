import fs from 'fs'
import path from 'path'
import { GoldenRatioAnalyzer, FacialLandmarks } from '../lib/goldenRatioAnalyzer'

function seedFromSize(size: number) {
  return (size % 100) / 1000 // small 0-0.099 perturbation
}

function makeLandmarks(perturb = 0): FacialLandmarks {
  // Base landmarks on 512x512 canvas, perturb slightly
  const p = perturb
  return {
    leftEye: { x: 150 + p * 50, y: 180 + p * 30 },
    rightEye: { x: 362 - p * 50, y: 180 + p * 30 },
    noseTip: { x: 256 + p * 10, y: 250 + p * 20 },
    mouthCenter: { x: 256 + p * 8, y: 320 + p * 25 },
    chinTip: { x: 256 + p * 12, y: 450 + p * 30 },
    foreheadTop: { x: 256 + p * 5, y: 80 - p * 10 },
    leftCheek: { x: 200 + p * 20, y: 280 + p * 15 },
    rightCheek: { x: 312 - p * 20, y: 280 + p * 15 },
    jawlineLeft: { x: 150 + p * 30, y: 380 + p * 20 },
    jawlineRight: { x: 362 - p * 30, y: 380 + p * 20 }
  }
}

async function analyzeFile(filePath: string) {
  const full = path.join(process.cwd(), filePath)
  if (!fs.existsSync(full)) {
    console.error('File not found:', full)
    return null
  }
  const stat = fs.statSync(full)
  const perturb = seedFromSize(stat.size)

  const landmarks = makeLandmarks(perturb)
  const analyzer = new GoldenRatioAnalyzer()
  // use mathematical analysis (no model prediction)
  const analysis = analyzer.analyzeFacialProportions(landmarks)

  return {
    file: filePath,
    size: stat.size,
    perturb,
    overallScore: analysis.overallScore,
    confidence: analysis.confidence,
    phiRatios: analysis.phiRatios.map(r => ({ measurement: r.measurement, value: r.value, score: r.score }))
  }
}

async function main() {
  const files = ['public/uploads/Man1.jpg', 'public/uploads/Woman1.jpg']
  const results = []
  for (const f of files) {
    const res = await analyzeFile(f)
    if (res) results.push(res)
  }
  console.log(JSON.stringify(results, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
