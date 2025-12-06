const fs = require('fs');

// Datos de ejemplo para programa de Nutrición con recetas
const nutritionData = `Nombre,Tipo,Descripción,Calorías,Proteínas (g),Carbohidratos (g),Grasas (g),video_url
Avena con proteína y frutos rojos,Desayuno,"1. Cocina 50g de avena con agua o leche desnatada. 2. Agrega 1 scoop de proteína en polvo. 3. Decora con frutos rojos frescos y un puñado de almendras.",380,28,45,12,
Pollo a la plancha con quinoa,Almuerzo,"1. Sazona 200g de pechuga de pollo con sal, pimienta y especias. 2. Cocina en sartén antiadherente sin aceite. 3. Sirve con 100g de quinoa cocida y ensalada verde con limón.",520,45,55,12,
Salmón al horno con verduras,Cena,"1. Precalienta el horno a 180°C. 2. Coloca 200g de salmón en papel aluminio con limón y eneldo. 3. Cocina por 20 minutos. 4. Acompaña con brócoli y zanahorias al vapor.",450,35,25,22,
Yogur griego con nueces,Merienda,"1. Mezcla 200g de yogur griego natural. 2. Agrega 30g de nueces picadas. 3. Endulza con stevia si es necesario.",280,20,15,18,
Tostadas integrales con aguacate y huevo,Desayuno,"1. Tuesta 2 rebanadas de pan integral. 2. Unta medio aguacate machacado. 3. Agrega 2 huevos pochados o revueltos. 4. Condimenta con sal, pimienta y semillas de chía.",420,22,35,20,
Ensalada de atún y garbanzos,Almuerzo,"1. Mezcla 150g de atún en agua escurrido. 2. Agrega 100g de garbanzos cocidos. 3. Combina con lechuga, tomate, pepino y cebolla. 4. Aliña con aceite de oliva y limón.",480,38,40,18,
Revuelto de claras con verduras,Cena,"1. Bate 6 claras de huevo. 2. Saltea con pimientos, cebolla y espinacas. 3. Agrega 50g de queso feta desmenuzado. 4. Sirve caliente con una rebanada de pan integral.",320,30,25,10,
Batido de proteína y plátano,Merienda,"1. Mezcla 1 scoop de proteína en polvo. 2. Agrega medio plátano. 3. Combina con 200ml de leche desnatada o agua. 4. Licúa hasta obtener consistencia cremosa.",250,25,30,3,
Pancakes de avena y plátano,Desayuno,"1. Mezcla 60g de avena molida, 1 plátano maduro y 2 huevos. 2. Cocina en sartén antiadherente. 3. Sirve con frutos rojos y un chorrito de miel.",380,18,50,12,
Pavo con batata y espárragos,Almuerzo,"1. Cocina 200g de pechuga de pavo a la plancha. 2. Hornea 200g de batata cortada en rodajas. 3. Saltea espárragos verdes con ajo. 4. Sirve todo junto.",490,42,50,10,
Ensalada de salmón ahumado,Cena,"1. Coloca 150g de salmón ahumado sobre lechuga. 2. Agrega aguacate, pepino y tomates cherry. 3. Aliña con aceite de oliva, limón y eneldo fresco.",400,30,15,25,
Manzana con mantequilla de almendras,Merienda,"1. Corta una manzana en rodajas. 2. Unta 2 cucharadas de mantequilla de almendras natural. 3. Espolvorea con canela.",220,8,25,12,
Bowl de acai con granola,Desayuno,"1. Mezcla 100g de acai congelado con 100ml de leche de almendras. 2. Agrega granola casera, frutos rojos y semillas de chía. 3. Decora con coco rallado.",350,12,55,10,
Pasta integral con pollo y verduras,Almuerzo,"1. Cocina 80g de pasta integral. 2. Saltea 150g de pollo en tiras con pimientos y brócoli. 3. Combina todo y agrega salsa de tomate natural. 4. Espolvorea con queso parmesano.",550,40,65,12,
Merluza al vapor con puré de calabaza,Cena,"1. Cocina 200g de merluza al vapor con hierbas. 2. Prepara puré de calabaza asada. 3. Sirve con espinacas salteadas con ajo.",380,35,30,12,
Hummus con crudités,Merienda,"1. Sirve 100g de hummus casero. 2. Acompaña con zanahorias, apio y pepino en bastones. 3. Espolvorea con pimentón dulce.",200,10,20,10,
Chía pudding con frutas,Desayuno,"1. Mezcla 3 cucharadas de semillas de chía con 200ml de leche de coco. 2. Deja reposar toda la noche. 3. Agrega frutas frescas y frutos secos por la mañana.",320,12,35,15,
Hamburguesa de pavo con ensalada,Almuerzo,"1. Forma hamburguesa con 200g de carne de pavo molida. 2. Cocina a la plancha. 3. Sirve en pan integral con lechuga, tomate y cebolla. 4. Acompaña con ensalada verde.",520,38,45,18,
Sushi bowl de salmón,Cena,"1. Coloca 100g de arroz integral cocido en un bowl. 2. Agrega 150g de salmón crudo en cubos. 3. Combina con aguacate, pepino y algas. 4. Aliña con salsa de soja baja en sodio.",480,32,50,15,
Barrita de proteína casera,Merienda,"1. Mezcla proteína en polvo, avena, mantequilla de almendras y miel. 2. Forma barras y refrigera. 3. Consume una barra de 40g.",180,15,20,6,
Tortilla de claras con verduras,Desayuno,"1. Bate 8 claras de huevo. 2. Saltea con espinacas, champiñones y tomate. 3. Cocina como tortilla. 4. Sirve con una rebanada de pan integral tostado.",280,30,25,5,
Arroz con pollo y verduras,Almuerzo,"1. Cocina 100g de arroz integral. 2. Saltea 200g de pollo en cubos con cebolla, pimientos y brócoli. 3. Combina todo y condimenta con especias.",580,45,70,12,
Ensalada César de pollo,Cena,"1. Prepara lechuga romana fresca. 2. Agrega 150g de pollo a la plancha en tiras. 3. Combina con crutones integrales y queso parmesano. 4. Aliña con aderezo César light.",420,35,30,18,
Smoothie verde,Merienda,"1. Licúa espinacas, medio plátano, 1 scoop de proteína y 200ml de leche de almendras. 2. Agrega hielo. 3. Sirve frío.",200,20,25,3,
Waffles de avena con frutas,Desayuno,"1. Mezcla avena molida, huevos y plátano. 2. Cocina en wafflera. 3. Sirve con frutas frescas y un chorrito de sirope de arce.",400,20,55,10,
Pechuga de pollo rellena,Almuerzo,"1. Abre 200g de pechuga de pollo. 2. Rellena con espinacas y queso feta. 3. Hornea a 180°C por 25 minutos. 4. Sirve con arroz integral y verduras al vapor.",520,48,45,15,
Sopa de verduras con pollo,Cena,"1. Prepara caldo de pollo casero. 2. Agrega verduras variadas (zanahoria, apio, calabacín). 3. Incorpora 150g de pollo desmenuzado. 4. Cocina hasta que las verduras estén tiernas.",350,30,35,8,
Palitos de queso con almendras,Merienda,"1. Sirve 50g de queso bajo en grasa en cubos. 2. Acompaña con 20g de almendras. 3. Agrega una manzana pequeña.",250,18,20,12`;

// Escribir archivo CSV
fs.writeFileSync('plantilla-nutricion-recetas.csv', nutritionData, 'utf8');
console.log('✅ Archivo creado: plantilla-nutricion-recetas.csv');
console.log(`📊 Total de recetas: ${nutritionData.split('\n').length - 1} (excluyendo header)`);
