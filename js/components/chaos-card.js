/**
 * ChaosCard Component
 * 用法: new ChaosCard(element, options)
 */
export class ChaosCard {
    constructor(rootElement, options = {}) {
        this.root = rootElement;
        
        // 合并配置：优先使用 data 属性，其次 options，最后默认值
        this.config = {
            text: rootElement.dataset.text || rootElement.dataset.title || "ChaosCard",
            baseColor: rootElement.dataset.color || "rgba(140, 255, 220, 0.15)",
            maxMove: parseFloat(rootElement.dataset.move) || 1.0,
            maxScale: parseFloat(rootElement.dataset.scaleMax) || 1.2,
            minScale: parseFloat(rootElement.dataset.scaleMin) || 0.8,
            speedMultiplier: parseFloat(rootElement.dataset.speed) || 1.0,
            blurAmount: parseFloat(rootElement.dataset.blur) || 1.0,
            zIndex: parseInt(rootElement.dataset.bgZIndex) || 0, // 背景层级
            ...options
        };

        this.chars = [];
        this.animationId = null;
        this.startTime = Date.now();

        this.init();
    }

    init() {
        const originalPosition = getComputedStyle(this.root).position;
        if (originalPosition === 'static') {
            this.root.style.position = 'relative';
        }
        
        if (!this.root.style.zIndex || this.root.style.zIndex === 'auto') {
            this.root.style.zIndex = '1';
        }
        
        this.root.style.overflow = 'hidden';
        this.root.style.borderRadius = this.root.style.borderRadius || '16px';
        this.root.style.background = this.root.style.background || 'rgba(20, 20, 25, 0.6)';
        this.root.style.backdropFilter = 'blur(12px)';
        this.root.style.webkitBackdropFilter = 'blur(12px)';
        this.root.style.border = this.root.style.border || '1px solid rgba(255, 255, 255, 0.08)';
        this.root.style.boxShadow = '0 4px 25px rgba(0, 0, 0, 0.5)';
        this.root.style.transition = 'transform 0.25s ease, border-color 0.3s ease, box-shadow 0.3s ease';
        this.root.style.cursor = 'pointer';

        this.injectHoverStyle();

        this.bgLayer = document.createElement('div');
        this.bgLayer.className = 'chaos-bg-layer';
        this.bgLayer.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: ${this.config.zIndex};
            pointer-events: none;
            overflow: hidden;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            opacity: 0.8;
        `;

        const textLayer = document.createElement('div');
        textLayer.className = 'chaos-text-layer';
        textLayer.style.cssText = `
            font-family: 'Times New Roman', Times, serif;
            font-size: 6rem;
            white-space: pre-wrap;
            width: max-content;
            max-width: 90%;
            line-height: 0.8;
            color: var(--char-color);
            user-select: none;
            
            transform-origin: center center;
            transform: translate(30%, 30%);
        `;
        textLayer.style.setProperty('--char-color', this.config.baseColor);

        Array.from(this.config.text).forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === '\n' ? '\n' : char;
            if (char !== '\n') {
                span.style.display = 'inline-block';
                span.dataset.offset = Math.random() * 100;
                span.dataset.speedSeed = 0.4 + Math.random() * 0.8;
                span.dataset.index = index;
                span.style.willChange = 'transform, filter';
                this.chars.push(span);
            }
            textLayer.appendChild(span);
        });

        this.bgLayer.appendChild(textLayer);
        
        this.root.insertBefore(this.bgLayer, this.root.firstChild);

        this.startAnimation();
    }

    injectHoverStyle() {
        const styleId = 'chaos-card-hover-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .chaos-card-hover-effect:hover {
                    transform: translateY(-6px) !important;
                    border-color: rgba(80, 180, 255, 0.4) !important;
                    box-shadow: 0 12px 35px rgba(0, 120, 255, 0.2) !important;
                }
            `;
            document.head.appendChild(style);
        }
        if (!this.root.classList.contains('chaos-card-hover-effect')) {
            this.root.classList.add('chaos-card-hover-effect');
        }
    }

    startAnimation() {
        const animate = () => {
            const time = (Date.now() - this.startTime) * 0.001 * this.config.speedMultiplier;

            this.chars.forEach((span) => {
                const offset = parseFloat(span.dataset.offset);
                const speedSeed = parseFloat(span.dataset.speedSeed);
                const index = parseInt(span.dataset.index);

                const noiseX = Math.sin(time * speedSeed * 1.3 + offset) * Math.cos(time * 0.4 + index * 0.15);
                const noiseY = Math.cos(time * speedSeed * 1.1 + offset * 1.2) * Math.sin(time * 0.5 + index * 0.2);
                const noiseScale = Math.sin(time * speedSeed * 1.8 + offset * 2.0);
                const noiseBlur = Math.abs(Math.sin(time * speedSeed * 0.9 + offset * 1.5));

                const x = noiseX * this.config.maxMove;
                const y = noiseY * this.config.maxMove;
                const scale = this.config.minScale + (noiseScale + 1) * 0.5 * (this.config.maxScale - this.config.minScale);
                const blur = noiseBlur * this.config.blurAmount;

                span.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
                span.style.filter = `blur(${blur}px)`;
            });

            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stop() { if (this.animationId) cancelAnimationFrame(this.animationId); }
    play() { this.startTime = Date.now(); this.startAnimation(); }
    
    setText(newText) {
        this.config.text = newText;
        this.bgLayer.remove();
        this.chars = [];
        this.init();
    }
}