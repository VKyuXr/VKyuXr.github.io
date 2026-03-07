// js/blog-loader.js

let postsData = {}; 

export async function initBlog() {
    const gridContainer = document.getElementById('blogGrid');
    const listContainer = document.getElementById('blogList');
    
    try {
        const response = await fetch('config.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        postsData = await response.json();
        console.log(`文章配置文件加载成功: 共 ${postsData.top.length + postsData.list.length} 篇文章`);

        window.blogPostsData = postsData.top;

        window.dispatchEvent(new CustomEvent('blog-data-ready', { detail: postsData.top }));

        if (gridContainer) {
            renderBlogGrid(postsData.top, gridContainer);
        }
        if (listContainer) {
            renderBlogList(postsData.list, listContainer);
        }

    } catch (error) {
        console.error("博客数据加载失败:", error);
        if(gridContainer) {
            gridContainer.innerHTML = `<div style="color:#ff6b6b; text-align:center;">数据加载失败<br>${error.message}</div>`;
        }
        if(listContainer) {
            listContainer.innerHTML = `<div style="color:#ff6b6b; text-align:center;">数据加载失败<br>${error.message}</div>`;
        }
    }
}

function renderBlogGrid(posts, container) {
    container.innerHTML = '';
    posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'blog-card hover-trigger';
        article.dataset.file = post.file;
        article.dataset.title = post.title;
        
        article.innerHTML = `
            <div class="card-category">${post.category}</div>
                <h3 class="card-title">${post.title}</h3>
                <p class="card-excerpt">${post.excerpt}</p>
                <div class="card-meta">
                <span>${post.date}</span>
                </div>
            </div>
        `;
        
        article.addEventListener('click', () => {
            if (window.openArticle) {
                window.openArticle(post);
            } else {
                alert("系统未就绪，请稍后");
            }
        });
        
        container.appendChild(article);
    });
}

// 1. 修改 addIcosahedron 函数，使其接收一个具体的 container 元素，而不是通过 ID 查找
function initPolyhedron(container) {
    if (!container) return;

    // 清理容器内可能存在的旧 canvas (防止重复渲染)
    container.innerHTML = ''; 

    const scene = new THREE.Scene();
    
    // 相机设置 (注意宽高比设为 1，因为容器是 60x60)
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(60, 60);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 将渲染器的 canvas 添加到传入的容器中
    container.appendChild(renderer.domElement);

    // 创建棱角球
    const geometry = new THREE.IcosahedronGeometry(0.8, 0); 
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x8f6eff, 
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const polyhedron = new THREE.Mesh(geometry, material);
    scene.add(polyhedron);

    // 内部核心
    const coreGeo = new THREE.IcosahedronGeometry(0.4, 0);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x745cee,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        polyhedron.rotation.x += 0.005;
        polyhedron.rotation.y += 0.01;
        core.rotation.x -= 0.01;
        core.rotation.y -= 0.005;
        renderer.render(scene, camera);
    }
    animate();
}

import { ChaosCard } from './components/chaos-card.js';

function renderBlogList(posts, container) {
    container.innerHTML = '';
    
    posts.forEach((post, index) => {
        const article = document.createElement('article');
        article.className = 'blog-card hover-trigger';
        article.dataset.file = post.file;
        article.dataset.title = post.title;
        
        const bgText = post.title.length > 16 ? post.title.substring(0, 16) : post.title;
        const color = '#8a6eff';

        article.dataset.text = bgText;
        article.dataset.color = color;

        article.innerHTML = `
            <div style="flex: 1; position: relative; z-index: 3; display: flex; flex-direction: column; justify-content: center;">
                <div style="display: flex; align-items: center; width: 100%;">
                    <div class="polyhedron-container" style="width: 60px; height: 60px; margin-right: 15px; position: relative;"></div>
                    <h3 class="card-title" style="margin: 0;">${post.title}</h3>
                </div>
                <div class="card-meta">
                    <p class="card-excerpt" style="margin: 0; opacity: 0.85; font-size: 0.95rem; color: #e0e0e0; line-height: 1.5;">
                        ${post.excerpt}
                    </p>
                </div>
            </div>
        `;
        
        article.addEventListener('click', () => {
            if (window.openArticle) window.openArticle(post);
        });
        
        container.appendChild(article);

        const geoContainer = article.querySelector('.polyhedron-container');
        if (geoContainer && typeof initPolyhedron === 'function') {
            initPolyhedron(geoContainer, post);
        }

        new ChaosCard(article);
    });
}

async function openArticle(post) {
    const modal = document.getElementById('articleModal');
    const overlay = document.getElementById('articleOverlay');
    const titleEl = document.getElementById('modalTitle');
    const contentEl = document.getElementById('modalContent');

    if (!modal) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.width = '100%';
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');

    titleEl.textContent = post.title;
    contentEl.innerHTML = '<div class="loading-text">🌌 正在从星云下载数据...</div>';
    
    modal.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    
    requestAnimationFrame(() => {
        modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
    });

    if (window.controls3D) window.controls3D.autoRotate = false;
    modal.addEventListener('wheel', stopPropagation, { passive: false });
    modal.addEventListener('touchmove', stopPropagation, { passive: false });

    try {
        let htmlContent = '';
        if (post.file) {
            const res = await fetch(post.file);
            if (!res.ok) throw new Error("文件不存在");
            const mdText = await res.text();
            if (typeof marked === 'undefined') throw new Error("Marked 库缺失");
            htmlContent = marked.parse(mdText);
        } else if (post.content) {
            htmlContent = post.content; 
        } else {
            throw new Error("无内容数据");
        }
        const cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlContent) : htmlContent;
        contentEl.innerHTML = cleanHtml;
        contentEl.scrollTop = 0;
    } catch (err) {
        console.error(err);
        contentEl.innerHTML = `<div style="color:#ff6b6b;text-align:center"><h3>传输中断</h3><p>${err.message}</p></div>`;
    }
}

function stopPropagation(e) {
    e.stopPropagation();
}

window.closeArticle = function() {
    const modal = document.getElementById('articleModal');
    const overlay = document.getElementById('articleOverlay');
    
    if (!modal) return;

    modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    modal.removeEventListener('wheel', stopPropagation);
    modal.removeEventListener('touchmove', stopPropagation);

    if (window.controls3D && !window.isBlogViewActive) {
        window.controls3D.autoRotate = true;
    }

    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
    
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    
    if (scrollY) {
        window.scrollTo(0, parseInt(scrollY) * -1);
    }

    setTimeout(() => {
        if (!modal.classList.contains('active')) {
             modal.style.display = 'none';
             if (overlay) overlay.style.display = 'none';
        }
    }, 400);
};

window.openArticle = openArticle;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('articleOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (window.closeArticle) {
                window.closeArticle();
            }
        });
    }
});