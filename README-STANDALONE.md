# SVG Path Extractor - Standalone Version

🎯 **Простая в использовании JavaScript библиотека для извлечения точек из SVG путей**

✅ **Без зависимостей** • ✅ **Один файл** • ✅ **Работает везде** • ✅ **Готова к CDN**

---

## 🚀 Быстрый старт

### 1. Скачайте файл
- **Полная версия**: [`svg-path-extractor.js`](svg-path-extractor.js) (15KB)
- **Минимизированная**: [`svg-path-extractor.min.js`](svg-path-extractor.min.js) (6KB)

### 2. Подключите в HTML
```html
<script src="svg-path-extractor.js"></script>
<script>
  const extractor = new SVGPathExtractor({ pointDensity: 8 });
  
  const svgContent = `<svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="30"/>
  </svg>`;
  
  extractor.extractPoints(svgContent).then(paths => {
    console.log(`Получено ${paths[0].length} точек`);
    paths[0].forEach(point => {
      console.log(`x: ${point.x}, y: ${point.y}`);
    });
  });
</script>
```

### 3. Готово! 🎉

---

## 📖 Примеры использования

### Базовое извлечение точек
```javascript
const extractor = new SVGPathExtractor();

// Из SVG строки
const paths = await extractor.extractPoints(svgContent, 5);

// Результат: [[{x: 10, y: 20}, {x: 15, y: 25}, ...]]
console.log(`Извлечено ${paths.length} путей`);
```

### Настройка плотности точек
```javascript
// Высокая детализация (много точек)
const highDetail = await extractor.extractPoints(svgContent, 2);

// Низкая детализация (мало точек) 
const lowDetail = await extractor.extractPoints(svgContent, 20);

// Автоматическая плотность
const autoDetail = await extractor.extractPoints(svgContent);
```

### Обработка результата
```javascript
const paths = await extractor.extractPoints(svgContent);

paths.forEach((path, pathIndex) => {
  console.log(`Путь ${pathIndex + 1}: ${path.length} точек`);
  
  path.forEach((point, pointIndex) => {
    // Используйте координаты point.x и point.y
    drawPoint(point.x, point.y);
  });
});
```

### Рисование на Canvas
```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const paths = await extractor.extractPoints(svgContent, 5);

paths.forEach(path => {
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
});
```

---

## 🌐 Варианты подключения

### Прямое подключение файла
```html
<!-- Скачанный файл -->
<script src="svg-path-extractor.js"></script>
```

### CDN подключение
```html
<!-- jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/svg-path-extractor@main/svg-path-extractor.min.js"></script>

<!-- unpkg CDN -->
<script src="https://unpkg.com/svg-path-extractor@latest/svg-path-extractor.min.js"></script>
```

### ES6 модули
```html
<script type="module">
  import SVGPathExtractor from './svg-path-extractor.js';
  const extractor = new SVGPathExtractor();
</script>
```

---

## ⚙️ API Справочник

### Конструктор
```javascript
new SVGPathExtractor(options)
```

**Опции:**
- `pointDensity` (number) - Фиксированная плотность точек
- `densityFactor` (number) - Фактор для автоматического расчёта (по умолчанию: 0.0075)
- `maxPoints` (number) - Максимальное количество точек (по умолчанию: 10000)

### Методы

#### `extractPoints(svgContent, pointDensity?)`
Извлекает точки из SVG контента.

**Параметры:**
- `svgContent` (string) - SVG разметка как строка
- `pointDensity` (number, опционально) - Переопределение плотности точек

**Возвращает:** `Promise<Array<Array<{x: number, y: number}>>>`

---

## 🎨 Поддерживаемые SVG элементы

| Элемент | Поддержка | Описание |
|---------|-----------|----------|
| `<path>` | ✅ Полная | Любые SVG пути |
| `<circle>` | ✅ Полная | Окружности |
| `<rect>` | ✅ Полная | Прямоугольники |
| `<line>` | ✅ Полная | Прямые линии |
| `<ellipse>` | ✅ Полная | Эллипсы |
| `<polygon>` | ✅ Полная | Многоугольники |
| `<polyline>` | ✅ Полная | Ломаные линии |

---

## 🔧 Практические примеры

### Анимация по пути
```javascript
const paths = await extractor.extractPoints(svgContent, 3);
const allPoints = paths.flat(); // Объединяем все пути

let currentIndex = 0;
function animate() {
  const point = allPoints[currentIndex];
  
  // Переместите ваш объект к точке
  moveObject(point.x, point.y);
  
  currentIndex = (currentIndex + 1) % allPoints.length;
  requestAnimationFrame(animate);
}
animate();
```

### Экспорт в CSV
```javascript
const paths = await extractor.extractPoints(svgContent);

let csv = 'path_id,point_id,x,y\n';
paths.forEach((path, pathIndex) => {
  path.forEach((point, pointIndex) => {
    csv += `${pathIndex},${pointIndex},${point.x.toFixed(3)},${point.y.toFixed(3)}\n`;
  });
});

// Сохранить или использовать CSV данные
console.log(csv);
```

### Анализ сложности формы
```javascript
const paths = await extractor.extractPoints(svgContent, 2);

paths.forEach((path, index) => {
  const complexity = path.length;
  const perimeter = calculatePerimeter(path);
  
  console.log(`Путь ${index + 1}:`);
  console.log(`  Сложность: ${complexity} точек`);
  console.log(`  Периметр: ${perimeter.toFixed(2)} единиц`);
});

function calculatePerimeter(path) {
  let perimeter = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i-1].x;
    const dy = path[i].y - path[i-1].y;
    perimeter += Math.sqrt(dx*dx + dy*dy);
  }
  return perimeter;
}
```

---

## 📁 Файлы проекта

```
📦 SVG Path Extractor
├── 📄 svg-path-extractor.js      # Основная библиотека (15KB)
├── 📄 svg-path-extractor.min.js  # Минимизированная версия (6KB)
├── 📄 standalone-demo.html       # Интерактивная демонстрация
├── 📄 README-STANDALONE.md       # Эта документация
└── 📄 test.svg                   # Пример SVG файла
```

---

## ❓ Частые вопросы

**Q: Нужно ли устанавливать зависимости?**  
A: Нет! Библиотека полностью самодостаточна.

**Q: Работает ли в старых браузерах?**  
A: Да, поддерживает IE11+ и все современные браузеры.

**Q: Можно ли использовать в Node.js?**  
A: Да, но потребуется установить `xmldom`: `npm install xmldom`

**Q: Какой размер библиотеки?**  
A: Полная версия 15KB, минимизированная 6KB.

**Q: Как контролировать количество точек?**  
A: Параметр `pointDensity` - чем меньше значение, тем больше точек.

---

## 📄 Лицензия

MIT License - используйте свободно в любых проектах.

---

## 🎯 Сделано с ❤️ для простого использования

Просто скачайте файл и начинайте использовать - никаких сложностей с установкой! 