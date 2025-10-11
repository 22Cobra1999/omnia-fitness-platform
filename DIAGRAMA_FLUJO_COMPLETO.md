# 🔄 DIAGRAMA DE FLUJO COMPLETO - OMNIA

## 📊 MAPA DE NAVEGACIÓN INTERACTIVO

Este diagrama muestra todas las conexiones entre pantallas, modales y acciones en la aplicación OMNIA.

---

## 🎯 **FLUJO PRINCIPAL - CLIENTE**

```mermaid
graph TB
    Start[🏠 App Inicio] --> Auth{Usuario autenticado?}
    Auth -->|No| Login[📝 Sign In Popup]
    Auth -->|Sí| CheckRole{Rol del usuario}
    
    CheckRole -->|Cliente| ClientTabs[📱 Bottom Navigation - Cliente]
    
    ClientTabs --> Search[🔍 Search Screen]
    ClientTabs --> Activity[📊 Activity Screen]
    ClientTabs --> Community[🔥 Community Screen]
    ClientTabs --> CalendarC[📅 Calendar Screen]
    ClientTabs --> ProfileC[👤 Profile Screen]
    
    Search --> SearchBar[🔍 Barra búsqueda]
    Search --> FilterToggle[🎛️ Toggle: Coaches/Activities]
    Search --> CoachCard[👨‍💼 Card Coach]
    Search --> ActivityCard[🏋️ Card Actividad]
    
    CoachCard --> CoachModal[👨‍💼 Perfil Coach Modal]
    ActivityCard --> ProductModal[📦 Modal Detalle Producto]
    
    ProductModal --> BuyButton[💰 Comprar]
    ProductModal --> ContactButton[💬 Contactar Coach]
    ProductModal --> VideoPreview[🎥 Video Preview]
    
    BuyButton --> Payment[💳 Proceso de Pago]
    ContactButton --> Chat[💬 Chat con Coach]
    
    Activity --> MyActivities[📋 Mis Actividades]
    MyActivities --> ActivityDetail[📊 Detalle Actividad]
    ActivityDetail --> ActivityModal[📦 Modal Actividad Completa]
    
    Community --> Feed[📱 Feed Publicaciones]
    Feed --> PostDetail[📖 Detalle Publicación]
    Feed --> LikeAction[❤️ Like]
    Feed --> CommentAction[💬 Comentarios]
    Feed --> SaveAction[🔖 Guardar]
    Feed --> CoachProfile[👨‍💼 Perfil Coach]
    
    CalendarC --> MonthView[📅 Vista Mes]
    MonthView --> DaySelect[📍 Seleccionar Día]
    DaySelect --> DayActivities[📋 Actividades del Día]
    DayActivities --> GoTraining[🏋️ Ir a Entrenar]
    GoTraining --> TodayScreen[💪 TodayScreen - Ejercicios]
    
    TodayScreen --> ExerciseList[📝 Lista Ejercicios]
    TodayScreen --> CheckSeries[✅ Marcar Series]
    TodayScreen --> CompleteDay[✅ Completar Día]
    TodayScreen --> NextDay[➡️ Siguiente Día]
    
    ProfileC --> Avatar[📷 Editar Avatar]
    ProfileC --> WeeklyStats[📊 Estadísticas Semana]
    ProfileC --> DailyRings[⭕ Anillos Diarios]
    ProfileC --> Biometrics[📏 Biométricas Modal]
    ProfileC --> Injuries[🤕 Lesiones Modal]
    ProfileC --> Settings[⚙️ Configuración]
    ProfileC --> MyPrograms[📱 Mis Programas]
    
    Biometrics --> EditWeight[⚖️ Editar Peso]
    Biometrics --> EditHeight[📏 Editar Altura]
    Biometrics --> EditAge[🎂 Editar Edad]
    
    Injuries --> AddInjury[➕ Agregar Lesión]
    Injuries --> EditInjury[✏️ Editar Lesión]
    Injuries --> DeleteInjury[🗑️ Eliminar Lesión]
    
    style Search fill:#FF7939,color:#fff
    style Community fill:#FF7939,color:#fff
    style TodayScreen fill:#FF7939,color:#fff
```

---

## 👨‍💼 **FLUJO PRINCIPAL - COACH**

```mermaid
graph TB
    Start[🏠 App Inicio] --> Auth{Usuario autenticado?}
    Auth -->|Sí| CheckRole{Rol del usuario}
    
    CheckRole -->|Coach| CoachTabs[📱 Bottom Navigation - Coach]
    
    CoachTabs --> Clients[👥 Clients Screen]
    CoachTabs --> Products[🛍️ Products Screen]
    CoachTabs --> Community[🔥 Community Screen]
    CoachTabs --> CalendarCoach[📅 Calendar Coach]
    CoachTabs --> ProfileCoach[👤 Profile Screen]
    
    Clients --> ClientList[📋 Lista Clientes]
    ClientList --> ClientCard[👤 Card Cliente]
    ClientCard --> ClientDetailModal[📊 Modal Detalle Cliente]
    
    ClientDetailModal --> ClientInfo[ℹ️ Información]
    ClientDetailModal --> ClientPrograms[📋 Programas]
    ClientDetailModal --> ClientProgress[📈 Progreso]
    ClientDetailModal --> ClientCalendar[📅 Calendario]
    ClientDetailModal --> MessageClient[💬 Mensaje]
    ClientDetailModal --> ScheduleConsult[📞 Consulta]
    
    Products --> ProductList[📋 Lista Productos]
    Products --> CreateButton[➕ Crear Producto]
    Products --> Consultations[💼 Consultas]
    
    ProductList --> EditProduct[✏️ Editar Producto]
    ProductList --> ViewProduct[👁️ Ver Producto]
    
    CreateButton --> Step1[📝 Paso 1: Info General]
    EditProduct --> Step1
    
    Step1 --> Step2[📷 Paso 2: Multimedia]
    Step2 --> Step3[💪 Paso 3: Ejercicios CSV]
    Step3 --> Step4[📅 Paso 4: Calendario]
    Step4 --> Step5[✅ Paso 5: Revisión]
    Step5 --> Publish[🚀 Publicar]
    
    Step2 --> UploadImage[📤 Subir Imagen]
    Step2 --> SelectExisting[📁 Seleccionar Existente]
    Step2 --> UploadVideo[🎥 Subir Video]
    
    Step3 --> UploadCSV[📤 Subir CSV]
    Step3 --> SelectExercises[✅ Seleccionar Ejercicios]
    
    Step4 --> AddPeriod[➕ Agregar Período]
    Step4 --> EditSessions[✏️ Editar Sesiones]
    Step4 --> PlanWeek[📅 Planificar Semana]
    
    Consultations --> ToggleCafe[☕ Toggle Café]
    Consultations --> Toggle30[⏰ Toggle 30 min]
    Consultations --> Toggle60[⏰ Toggle 1 hora]
    Consultations --> EditPrice[💰 Editar Precio]
    
    CalendarCoach --> MonthViewCoach[📅 Vista Mes]
    MonthViewCoach --> DaySelectCoach[📍 Día Seleccionado]
    DaySelectCoach --> DayStatsCoach[📊 Estadísticas del Día]
    
    style Products fill:#FF7939,color:#fff
    style Clients fill:#FF7939,color:#fff
    style Step5 fill:#FF7939,color:#fff
```

---

## 🔗 **DIAGRAMA UNIFICADO (Cliente + Coach)**

```mermaid
graph LR
    subgraph "CLIENTE TABS"
        C1[🔍 Search]
        C2[📊 Activity]
        C3[🔥 Community]
        C4[📅 Calendar]
        C5[👤 Profile]
    end
    
    subgraph "COACH TABS"
        CO1[👥 Clients]
        CO2[🛍️ Products]
        CO3[🔥 Community]
        CO4[📅 Calendar]
        CO5[👤 Profile]
    end
    
    subgraph "MODALES COMPARTIDOS"
        M1[📦 Producto Detail]
        M2[👨‍💼 Coach Profile]
        M3[💬 Chat]
        M4[📏 Biométricas]
        M5[🤕 Lesiones]
        M6[⚙️ Settings]
    end
    
    subgraph "PANTALLAS ESPECIALES"
        S1[💪 TodayScreen]
        S2[📊 Detalle Cliente]
        S3[✏️ Crear/Editar Producto]
    end
    
    C1 --> M1
    C1 --> M2
    C2 --> M1
    C3 --> M2
    C3 --> M3
    C4 --> S1
    C5 --> M4
    C5 --> M5
    C5 --> M6
    
    CO1 --> S2
    CO2 --> S3
    CO2 --> M1
    CO3 --> M2
    CO5 --> M4
    CO5 --> M5
    
    S2 --> M3
    S3 --> M1
```

---

## 🎨 **ESPECIFICACIONES DE DISEÑO**

### **Tipografía:**
```
Headers: Inter Bold, 24-28px
Subtítulos: Inter SemiBold, 18-20px
Body: Inter Regular, 14-16px
Labels pequeños: Inter Medium, 12px
```

### **Espaciado:**
```
Padding contenedor: 20px
Spacing entre cards: 16px
Spacing interno card: 12px
Border radius cards: 12px
Border radius buttons: 8px
```

### **Sombras:**
```
Cards: 0px 2px 8px rgba(0, 0, 0, 0.1)
Modales: 0px 8px 32px rgba(0, 0, 0, 0.3)
Bottom nav: 0px -2px 8px rgba(0, 0, 0, 0.1)
```

### **Iconos:**
```
Tab icons: 24x24px
Action icons: 20x20px
Small icons: 16x16px
Lucide React icon library
```

---

## 🎯 **LISTA DE PANTALLAS PARA DISEÑAR**

### **Cliente (9 pantallas):**
1. ✅ Search Screen
2. ✅ Activity Screen (Mis actividades)
3. ✅ Community Screen (Feed)
4. ✅ Calendar Screen (Calendario)
5. ✅ Profile Screen (Perfil)
6. ✅ TodayScreen (Ejercicios del día)
7. ✅ Modal Detalle Producto
8. ✅ Modal Perfil Coach
9. ✅ Modal Biométricas/Lesiones

### **Coach (11 pantallas):**
1. ✅ Clients Screen
2. ✅ Products Screen
3. ✅ Community Screen (compartida)
4. ✅ Calendar Coach Screen
5. ✅ Profile Screen (compartida)
6. ✅ Modal Detalle Cliente
7. ✅ Modal Crear Producto - Paso 1
8. ✅ Modal Crear Producto - Paso 2
9. ✅ Modal Crear Producto - Paso 3
10. ✅ Modal Crear Producto - Paso 4
11. ✅ Modal Crear Producto - Paso 5

### **Componentes Compartidos (6):**
1. ✅ Header con Settings y Messages
2. ✅ Bottom Navigation (Cliente)
3. ✅ Bottom Navigation (Coach)
4. ✅ Card Producto/Actividad
5. ✅ Barra de Progreso
6. ✅ Button Principal

---

**Total: ~20 pantallas + 6 componentes = 26 elementos en Figma** 🎨

Este diseño completo te permitirá visualizar todo el flujo de la aplicación y entender cómo cada elemento se conecta con los demás.
