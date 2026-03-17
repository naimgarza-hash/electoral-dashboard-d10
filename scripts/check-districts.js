const shapefile = require('shapefile')

async function check() {
  // Sample first row
  const src = await shapefile.open('scripts/shapefiles/SECCION.shp')
  const r = await src.read()
  console.log('Columns:', Object.keys(r.value.properties).join(', '))
  console.log('Sample row:', JSON.stringify(r.value.properties))

  // Count by distrito_l
  const src2 = await shapefile.open('scripts/shapefiles/SECCION.shp')
  const localCounts = {}
  let total = 0
  while (true) {
    const x = await src2.read()
    if (x.done) break
    total++
    const dl = x.value.properties.distrito_l
    localCounts[dl] = (localCounts[dl] || 0) + 1
  }
  console.log('\nTotal sections:', total)
  console.log('distrito_l=10 count:', localCounts[10] || 0)
  console.log('\nAll distrito_l values (sorted):',
    Object.entries(localCounts)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => `${k}:${v}`)
      .join(', ')
  )
}

check().catch(console.error)
