$src = "C:\Users\naimg\Downloads\bgd_19_shapefiles\19 NUEVO LEON"
$dst = "C:\Users\naimg\n8ntest\electoral-dashboard\scripts\shapefiles"
Copy-Item "$src\SECCION.shp" $dst -Force
Copy-Item "$src\SECCION.dbf" $dst -Force
Copy-Item "$src\SECCION.prj" $dst -Force
Copy-Item "$src\SECCION.shx" $dst -Force
Copy-Item "$src\SECCION.cpg" $dst -Force
Write-Host "Done:"
Get-ChildItem $dst | Select-Object Name, Length
