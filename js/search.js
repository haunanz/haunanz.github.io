// 全局搜索功能
class BlogSearch {
    constructor() {
        this.index = null;
        this.loaded = false;
        this.init();
    }

    // 初始化搜索功能
    init() {
        console.log('初始化搜索功能...');
        this.loadIndex();
        this.bindEvents();
    }

    // 加载搜索索引
    async loadIndex() {
        try {
            console.log('开始加载搜索索引...');
            const response = await fetch('/search-index.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.index = data.posts || [];
            this.loaded = true;
            console.log('搜索索引加载成功，文章数量:', this.index.length);

            // 如果URL中有搜索参数，执行搜索
            this.checkUrlForSearch();
        } catch (error) {
            console.error('加载搜索索引失败:', error);
            console.error('错误详情:', error.message);
            console.error('错误堆栈:', error.stack);
            console.warn('尝试使用相对路径加载搜索索引...');
            // 尝试使用相对路径
            try {
                const response = await fetch('search-index.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.index = data.posts || [];
                this.loaded = true;
                console.log('搜索索引加载成功（相对路径），文章数量:', this.index.length);
                this.checkUrlForSearch();
            } catch (relError) {
                console.error('相对路径也失败:', relError);
            }
        }
    }

    // 检查URL中是否有搜索参数
    checkUrlForSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query && query.trim()) {
            // 如果是搜索页面，执行搜索并显示结果
            if (window.location.pathname.includes('/search')) {
                this.performSearch(query, 'search-page-results');
            }
        }
    }

    // 绑定事件
    bindEvents() {
        console.log('绑定搜索事件...');

        // 侧边栏搜索表单
        const sidebarForm = document.getElementById('search-form');
        console.log('侧边栏搜索表单:', sidebarForm);
        if (sidebarForm) {
            sidebarForm.addEventListener('submit', (e) => {
                console.log('侧边栏表单提交');
                e.preventDefault();
                const input = document.getElementById('search-input');
                if (input && input.value.trim()) {
                    const query = input.value.trim();
                    console.log(`跳转到搜索页面，查询: "${query}"`);
                    window.location.href = `/search/?q=${encodeURIComponent(query)}`;
                }
            });
        }

        // 搜索页面表单
        const pageForm = document.getElementById('search-page-form');
        console.log('搜索页面表单:', pageForm);
        if (pageForm) {
            pageForm.addEventListener('submit', (e) => {
                console.log('搜索页面表单提交');
                e.preventDefault();
                const input = document.getElementById('search-page-input');
                if (input && input.value.trim()) {
                    const query = input.value.trim();
                    console.log(`搜索页面搜索: "${query}"`);
                    this.performSearch(query, 'search-page-results');
                    // 更新URL但不重新加载页面
                    const newUrl = `/search/?q=${encodeURIComponent(query)}`;
                    window.history.pushState({}, '', newUrl);
                }
            });
        }

        // 侧边栏搜索输入框实时搜索（可选）
        const sidebarInput = document.getElementById('search-input');
        console.log('侧边栏搜索输入框:', sidebarInput);
        if (sidebarInput) {
            let debounceTimer;
            sidebarInput.addEventListener('input', (e) => {
                console.log('侧边栏输入事件');
                clearTimeout(debounceTimer);
                const query = e.target.value.trim();
                console.log(`输入查询: "${query}"`);
                if (query.length === 0) {
                    console.log('查询为空，清空结果');
                    this.clearResults('search-results');
                    return;
                }

                // 防抖处理，300ms后执行搜索
                debounceTimer = setTimeout(() => {
                    console.log(`执行实时搜索: "${query}"`);
                    if (this.loaded) {
                        this.performSearch(query, 'search-results');
                    } else {
                        console.log('搜索索引未加载，跳过实时搜索');
                    }
                }, 300);
            });

            // 点击页面其他区域隐藏结果
            document.addEventListener('click', (e) => {
                const searchBox = document.querySelector('.search-box');
                const results = document.getElementById('search-results');
                if (searchBox && results && !searchBox.contains(e.target)) {
                    console.log('点击搜索框外部，隐藏结果');
                    results.style.display = 'none';
                }
            });
        }
    }

    // 执行搜索
    performSearch(query, resultsContainerId) {
        console.log(`执行搜索: "${query}", 容器ID: ${resultsContainerId}`);
        if (!this.loaded || !this.index) {
            console.warn('搜索索引未加载');
            console.log('loaded:', this.loaded, 'index:', this.index);
            return;
        }

        console.log('搜索索引已加载，文章数量:', this.index.length);
        const results = this.searchPosts(query);
        console.log(`找到 ${results.length} 个结果`);
        this.displayResults(results, query, resultsContainerId);
    }

    // 搜索文章
    searchPosts(query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length === 0) return [];

        // 计算每篇文章的分数
        const scoredPosts = this.index.map(post => {
            const score = this.calculateScore(post, searchTerms);
            return { ...post, score };
        })
        .filter(post => post.score > 0) // 只保留有匹配的文章
        .sort((a, b) => b.score - a.score); // 按分数降序排序

        return scoredPosts;
    }

    // 计算文章分数
    calculateScore(post, searchTerms) {
        let score = 0;
        const title = post.title ? post.title.toLowerCase() : '';
        const summary = post.summary ? post.summary.toLowerCase() : '';
        const tags = post.tags ? post.tags.map(tag => tag.toLowerCase()) : [];
        const categories = post.categories ? post.categories.map(cat => cat.toLowerCase()) : [];

        searchTerms.forEach(term => {
            // 标题完全匹配
            if (title === term) score += 20;
            else if (title.includes(term)) score += 10;

            // 摘要匹配
            if (summary.includes(term)) score += 5;

            // 标签匹配
            if (tags.some(tag => tag === term)) score += 15;
            else if (tags.some(tag => tag.includes(term))) score += 8;

            // 分类匹配
            if (categories.some(cat => cat === term)) score += 12;
            else if (categories.some(cat => cat.includes(term))) score += 7;
        });

        return score;
    }

    // 显示搜索结果
    displayResults(results, query, containerId) {
        console.log(`显示搜索结果，查询: "${query}", 容器: ${containerId}, 结果数: ${results.length}`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`找不到容器元素: #${containerId}`);
            return;
        }

        if (results.length === 0) {
            console.log('没有找到结果');
            container.innerHTML = `<p class="no-results">没有找到与 "${query}" 相关的文章。</p>`;
            container.style.display = 'block';
            return;
        }

        let html = `<div class="results-header">找到 ${results.length} 篇相关文章：</div>`;

        results.forEach(post => {
            const date = post.date ? ` · ${post.date}` : '';
            const tags = post.tags && post.tags.length > 0
                ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                : '';

            html += `
            <div class="search-result-item">
                <a href="${post.url}" class="result-title">${post.title}</a>
                <div class="result-meta">
                    <span class="result-date">${date}</span>
                </div>
                ${post.summary ? `<p class="result-summary">${post.summary}</p>` : ''}
                ${tags}
            </div>
            `;
        });

        container.innerHTML = html;
        container.style.display = 'block';
    }

    // 清空结果
    clearResults(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }
}

// 页面加载完成后初始化搜索
document.addEventListener('DOMContentLoaded', () => {
    window.blogSearch = new BlogSearch();
});