#!/bin/bash

# 🔧 Script para arreglar imports rotos después de la limpieza

echo "🔧 Arreglando imports rotos..."

# Buscar y comentar imports de componentes eliminados
echo "📝 Comentando imports de CoachCard..."
find app components -name "*.tsx" -type f -exec sed -i '' 's/^import.*CoachCard.*/\/\/ &/' {} \;

echo "📝 Comentando imports de CoachProfileModal..."
find app components -name "*.tsx" -type f -exec sed -i '' 's/^import.*CoachProfileModal.*/\/\/ &/' {} \;

echo "📝 Comentando imports de coach-profile-screen..."
find app components -name "*.tsx" -type f -exec sed -i '' 's/^import.*coach-profile-screen.*/\/\/ &/' {} \;

echo "📝 Comentando imports de coach-publication..."
find app components -name "*.tsx" -type f -exec sed -i '' 's/^import.*coach-publication.*/\/\/ &/' {} \;

echo "✅ Imports comentados"
echo "⚠️  Nota: Los componentes que usaban estos imports necesitarán ser actualizados manualmente"

