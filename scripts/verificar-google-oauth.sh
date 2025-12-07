#!/bin/bash

# Script para verificar la configuración de Google OAuth

echo "🔍 Verificando configuración de Google OAuth..."
echo ""

# Verificar .env.local
if [ -f .env.local ]; then
    echo "✅ Archivo .env.local encontrado"
    
    CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'" | sed 's/\\n$//')
    CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'" | sed 's/\\n$//')
    APP_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'" | sed 's/\\n$//')
    
    if [ ! -z "$CLIENT_ID" ]; then
        echo "✅ GOOGLE_CLIENT_ID configurado: ${CLIENT_ID:0:30}..."
        
        if [[ "$CLIENT_ID" == *".apps.googleusercontent.com"* ]]; then
            echo "✅ Formato de Client ID válido"
        else
            echo "❌ Formato de Client ID inválido (debe terminar en .apps.googleusercontent.com)"
        fi
        
        # Verificar que sea el Client ID correcto
        EXPECTED_ID="839231165191-20rhurcr1eure60noskn447i86jh95j3.apps.googleusercontent.com"
        if [ "$CLIENT_ID" == "$EXPECTED_ID" ]; then
            echo "✅ Client ID coincide con el esperado"
        else
            echo "⚠️  Client ID NO coincide con el esperado"
            echo "   Esperado: $EXPECTED_ID"
            echo "   Actual:   $CLIENT_ID"
        fi
    else
        echo "❌ GOOGLE_CLIENT_ID no configurado"
    fi
    
    if [ ! -z "$CLIENT_SECRET" ]; then
        echo "✅ GOOGLE_CLIENT_SECRET configurado: ${CLIENT_SECRET:0:10}..."
    else
        echo "❌ GOOGLE_CLIENT_SECRET no configurado"
    fi
    
    if [ ! -z "$APP_URL" ]; then
        echo "✅ NEXT_PUBLIC_APP_URL configurado: $APP_URL"
        
        # Calcular redirect URI
        REDIRECT_URI="${APP_URL}/api/google/oauth/callback"
        echo "   Redirect URI esperado: $REDIRECT_URI"
    else
        echo "⚠️  NEXT_PUBLIC_APP_URL no configurado (usará default)"
    fi
else
    echo "❌ Archivo .env.local no encontrado"
fi

echo ""
echo "📋 Verificaciones en Google Cloud Console:"
echo "   1. Ve a: https://console.cloud.google.com/apis/credentials"
echo "   2. Verifica que el Client ID sea: 839231165191-20rhurcr1eure60noskn447i86jh95j3.apps.googleusercontent.com"
echo "   3. Verifica que los Redirect URIs incluyan:"
echo "      - http://localhost:3000/api/google/oauth/callback"
echo "      - https://omnia-app.vercel.app/api/google/oauth/callback"
echo "   4. Verifica que los JavaScript Origins incluyan:"
echo "      - http://localhost:3000"
echo "      - https://omnia-app.vercel.app"
echo ""

