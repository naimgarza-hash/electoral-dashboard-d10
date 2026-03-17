/**
 * convert-shapefile.js
 * Converts INE shapefile to GeoJSON filtered to Distrito Federal 10 NL
 *
 * Usage:
 *   node scripts/convert-shapefile.js
 *
 * Before running:
 *   1. Extract bgd_19_Shapefile.zip  →  get "19 NUEVO LEON.7z"
 *   2. Extract "19 NUEVO LEON.7z" with 7-Zip
 *   3. Place SECCION.shp, SECCION.dbf, SECCION.prj, SECCION.shx
 *      inside: scripts/shapefiles/
 */

const shapefile = require('shapefile')
const fs = require('fs')
const path = require('path')
const proj4 = require('proj4')

// UTM Zone 14N (INE Mexico shapefiles use this projection)
proj4.defs('EPSG:32614', '+proj=utm +zone=14 +datum=WGS84 +units=m +no_defs')

// Recursively reproject GeoJSON coordinates from UTM Zone 14N → WGS84
function reprojectCoords(coords) {
  if (typeof coords[0] === 'number') {
    const [lon, lat] = proj4('EPSG:32614', 'EPSG:4326', [coords[0], coords[1]])
    return [lon, lat]
  }
  return coords.map(reprojectCoords)
}

function reprojectFeature(feature) {
  if (!feature.geometry || !feature.geometry.coordinates) return feature
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: reprojectCoords(feature.geometry.coordinates),
    },
  }
}

// @turf/simplify may need CJS import
let simplify
try {
  simplify = require('@turf/simplify').default || require('@turf/simplify')
} catch (e) {
  simplify = null
  console.warn('⚠️  @turf/simplify not found — geometry will NOT be simplified')
}

const SHP_PATH = path.join(__dirname, 'shapefiles', 'SECCION.shp')
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'distrito10.geojson')
const TARGET_DISTRICT = 10

// Use LOCAL district column (distrito_l). Change to 'distrito_f' for federal.
const DISTRICT_COLUMNS = ['distrito_l', 'DISTRITO_L', 'distrito_f', 'DISTRITO_F',
                           'DISTRITO_FE', 'CVE_DISF', 'D_FED', 'DISFE',
                           'distrito_fe', 'cve_disf', 'd_fed', 'disfe']

async function main() {
  if (!fs.existsSync(SHP_PATH)) {
    console.error(`❌ Shapefile not found at: ${SHP_PATH}`)
    console.error('   Place SECCION.shp + .dbf inside scripts/shapefiles/')
    process.exit(1)
  }

  console.log(`📂 Reading: ${SHP_PATH}`)
  const source = await shapefile.open(SHP_PATH)

  const features = []
  let totalRead = 0
  let detectedColumn = null

  while (true) {
    const result = await source.read()
    if (result.done) break
    totalRead++

    const feature = result.value
    const props = feature.properties || {}

    // Auto-detect which column holds the federal district
    if (!detectedColumn) {
      for (const col of DISTRICT_COLUMNS) {
        if (col in props) {
          detectedColumn = col
          console.log(`✅ Detected district column: "${detectedColumn}" (sample value: ${props[col]})`)
          break
        }
      }
      if (!detectedColumn) {
        console.error('❌ Could not find district column. Available columns:')
        console.error('  ', Object.keys(props).join(', '))
        console.error(`   Expected one of: ${DISTRICT_COLUMNS.join(', ')}`)
        process.exit(1)
      }
    }

    const districtValue = props[detectedColumn]
    const districtNum = typeof districtValue === 'string'
      ? parseInt(districtValue, 10)
      : districtValue

    if (districtNum === TARGET_DISTRICT) {
      features.push(reprojectFeature(feature))
    }
  }

  console.log(`📊 Total sections in file: ${totalRead}`)
  console.log(`🗺️  Sections in Distrito ${TARGET_DISTRICT}: ${features.length}`)

  if (features.length === 0) {
    console.error(`❌ No sections found for Distrito ${TARGET_DISTRICT}`)
    console.error('   Check the district column values in your shapefile.')
    process.exit(1)
  }

  let geojson = {
    type: 'FeatureCollection',
    features,
  }

  // Simplify geometry for web performance
  if (simplify) {
    console.log('⚙️  Simplifying geometry (tolerance: 0.0005)...')
    try {
      geojson = simplify(geojson, { tolerance: 0.0005, highQuality: false, mutate: true })
      console.log('✅ Geometry simplified')
    } catch (e) {
      console.warn('⚠️  Simplification failed, using original geometry:', e.message)
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  fs.mkdirSync(outputDir, { recursive: true })

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(geojson))
  const sizeKb = Math.round(fs.statSync(OUTPUT_PATH).size / 1024)
  console.log(`✅ Written to: ${OUTPUT_PATH} (${sizeKb} KB)`)
  console.log('')
  console.log('🎉 Done! You can now run: npm run dev')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
