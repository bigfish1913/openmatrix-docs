# OpenMatrix 视觉设计指南

## Logo 设计

### 主 Logo (SVG)

```svg
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="200" fill="#0A1628" rx="24"/>

  <!-- Matrix Grid -->
  <g transform="translate(40, 60)">
    <!-- Row 1 -->
    <rect x="0" y="0" width="32" height="32" rx="4" fill="#1E3A5F" stroke="#00D26A" stroke-width="2"/>
    <rect x="40" y="0" width="32" height="32" rx="4" fill="#1E3A5F" stroke="#3B82F6" stroke-width="2"/>
    <rect x="80" y="0" width="32" height="32" rx="4" fill="#00D26A" rx="4"/>

    <!-- Row 2 -->
    <rect x="0" y="40" width="32" height="32" rx="4" fill="#1E3A5F" stroke="#3B82F6" stroke-width="2"/>
    <rect x="40" y="40" width="32" height="32" rx="4" fill="#00D26A"/>
    <rect x="80" y="40" width="32" height="32" rx="4" fill="#1E3A5F" stroke="#F59E0B" stroke-width="2"/>

    <!-- Row 3 -->
    <rect x="0" y="80" width="32" height="32" rx="4" fill="#1E3A5F" stroke="#3B82F6" stroke-width="2"/>
    <rect x="40" y="80" width="32" height="32" rx="4" fill="#1E3A5F" stroke="#3B82F6" stroke-width="2"/>
    <rect x="80" y="80" width="32" height="32" rx="4" fill="#F59E0B"/>
  </g>

  <!-- Connection Lines -->
  <g stroke="#00D26A" stroke-width="1.5" opacity="0.6">
    <line x1="56" y1="76" x2="56" y2="116"/>
    <line x1="96" y1="76" x2="96" y2="116"/>
    <line x1="136" y1="76" x2="136" y2="116"/>
    <line x1="56" y1="116" x2="96" y2="116"/>
    <line x1="96" y1="116" x2="136" y2="116"/>
  </g>
</svg>
```

### Logo 变体

1. **完整版**: Logo + 文字 "OpenMatrix"
2. **图标版**: 仅矩阵图形
3. **单色版**: 纯白或纯黑

## 配色规范

### 主色板

| 颜色名称 | HEX | RGB | 用途 |
|---------|-----|-----|------|
| Matrix Green | `#00D26A` | 0, 210, 106 | 主强调色、CTA、成功状态 |
| Deep Navy | `#0A1628` | 10, 22, 40 | 背景、标题 |
| Bright Blue | `#3B82F6` | 59, 130, 246 | 链接、次要强调 |
| Warm Orange | `#F59E0B` | 245, 158, 11 | 警告、进行中状态 |

### 语义色

| 状态 | 颜色 | HEX |
|------|------|-----|
| 成功 | Green | `#10B981` |
| 警告 | Orange | `#F59E0B` |
| 错误 | Red | `#EF4444` |
| 信息 | Blue | `#3B82F6` |

## 排版规范

### 字体层级

```css
/* 标题 */
h1 { font-size: 48px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 36px; font-weight: 600; line-height: 1.3; }
h3 { font-size: 24px; font-weight: 600; line-height: 1.4; }
h4 { font-size: 18px; font-weight: 600; line-height: 1.5; }

/* 正文 */
body { font-size: 16px; font-weight: 400; line-height: 1.6; }
small { font-size: 14px; }

/* 代码 */
code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  background: #1E293B;
  padding: 2px 6px;
  border-radius: 4px;
}
```

## 组件规范

### 按钮

```css
/* 主按钮 */
.btn-primary {
  background: #00D26A;
  color: #0A1628;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #00B85C;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 210, 106, 0.3);
}

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  color: #00D26A;
  border: 2px solid #00D26A;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
}
```

### 卡片

```css
.card {
  background: #111827;
  border: 1px solid #1F2937;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
}

.card:hover {
  border-color: #00D26A;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}
```

## 图标规范

- 风格: 线性图标，2px 描边
- 大小: 24x24 (默认), 16x16 (小), 32x32 (大)
- 颜色: 继承父元素或使用主色

## 动效规范

### 过渡

```css
/* 默认过渡 */
transition: all 0.2s ease;

/* 弹性过渡 */
transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 脉冲 (进行中状态) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 插图风格

- **风格**: 扁平化 + 渐变
- **配色**: 使用品牌色板
- **特点**: 简洁、科技感、网格元素

---

*视觉指南 v1.0 - 2026.03.26*
