// js/blog-loader.js

let postsData = [];

/**
 * 初始化博客数据
 * 下载 JSON 并触发事件
 */
export async function initBlog() {
    const gridContainer = document.getElementById('blogGrid');
    
    try {
        console.log("📡 正在请求 posts.json...");
        const response = await fetch('config.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        postsData = await response.json();
        console.log(`✅ 数据加载成功: ${postsData.length} 篇文章`);

        // 【关键步骤 1】挂载到 window，供非模块脚本或调试使用
        window.blogPostsData = postsData;

        // 【关键步骤 2】触发自定义事件，通知 3D 场景可以开始构建了
        window.dispatchEvent(new CustomEvent('blog-data-ready', { detail: postsData }));

        // 【关键步骤 3】渲染 HTML 列表 (如果存在)
        if (gridContainer) {
            renderBlogList(postsData, gridContainer);
        }

    } catch (error) {
        console.error("❌ 博客数据加载失败:", error);
        if(gridContainer) {
            gridContainer.innerHTML = `<div style="color:#ff6b6b; text-align:center;">数据加载失败<br>${error.message}</div>`;
        }
    }
}

// 渲染 HTML 列表函数
function renderBlogList(posts, container) {
    container.innerHTML = '';
    posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'blog-card';
        // 绑定数据
        article.dataset.file = post.file;
        article.dataset.title = post.title;
        
        article.innerHTML = `
            <div class="card-category">${post.category}</div>
            <h3 class="card-title">${post.title}</h3>
            <p class="card-excerpt">${post.excerpt}</p>
            <div class="card-meta"><span>📅 ${post.date}</span><span class="read-more">阅读</span></div>
        `;
        
        // 绑定点击事件 -> 调用全局的 openArticle
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

/**
 * 通用打开文章函数 (支持 Markdown 文件加载)
 * 挂载到 window 以便全局调用
 */
async function openArticle(post) {
    const modal = document.getElementById('article-modal');
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-content');

    if (!modal) return;

    // 显示弹窗
    titleEl.textContent = post.title;
    contentEl.innerHTML = '<div class="loading-text">🌌 正在从星云下载数据...</div>';
    modal.style.display = 'flex';
    // 强制重绘以触发 CSS 动画
    setTimeout(() => modal.classList.add('active'), 10);

    // 暂停 3D 旋转
    if (window.controls3D) window.controls3D.autoRotate = false;

    try {
        let htmlContent = '';

        if (post.file) {
            // 模式 A: 加载外部 .md 文件
            const res = await fetch(post.file);
            if (!res.ok) throw new Error("文件不存在");
            const mdText = await res.text();
            
            if (typeof marked === 'undefined') throw new Error("Marked 库缺失");
            htmlContent = marked.parse(mdText);
        } else if (post.content) {
            // 模式 B: 直接显示文本
            htmlContent = post.content; 
        } else {
            throw new Error("无内容数据");
        }

        // 消毒并渲染
        const cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlContent) : htmlContent;
        contentEl.innerHTML = cleanHtml;
        contentEl.scrollTop = 0;

    } catch (err) {
        console.error(err);
        contentEl.innerHTML = `<div style="color:#ff6b6b;text-align:center"><h3>传输中断</h3><p>${err.message}</p></div>`;
    }
}

// 关闭函数
window.closeArticle = function() {
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
    // 恢复旋转
    if (window.controls3D && !window.isBlogViewActive) {
        window.controls3D.autoRotate = true;
    }
};

// 暴露给全局
window.openArticle = openArticle;

// 【重要】页面加载完成后自动启动数据下载
// 这样不管 script 标签顺序如何，只要 DOM Ready 就会开始下载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}