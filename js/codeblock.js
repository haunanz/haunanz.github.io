// 代码块增强功能
// 添加语言标签、复制按钮和折叠功能

// 语言名称映射
const languageMap = {
    'c': 'C',
    'cpp': 'C++',
    'go': 'Go',
    'python': 'Python',
    'py': 'Python',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'java': 'Java',
    'rust': 'Rust',
    'ruby': 'Ruby',
    'rb': 'Ruby',
    'php': 'PHP',
    'html': 'HTML',
    'css': 'CSS',
    'sql': 'SQL',
    'bash': 'Bash',
    'shell': 'Shell',
    'sh': 'Shell',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'markdown': 'Markdown',
    'md': 'Markdown',
    'dockerfile': 'Dockerfile',
    'makefile': 'Makefile'
};

function getLanguageDisplayName(lang) {
    if (!lang) return 'Text';
    const normalizedLang = lang.toLowerCase();
    return languageMap[normalizedLang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

document.addEventListener('DOMContentLoaded', function() {
    // 找到所有代码块容器
    const codeBlocks = document.querySelectorAll('div.highlight');

    codeBlocks.forEach((codeBlock) => {
        // 获取语言信息
        const codeElement = codeBlock.querySelector('code');
        let language = 'text';

        if (codeElement) {
            // 从class中提取语言，如 "language-go" -> "go"
            const classList = codeElement.className.split(' ');
            const langClass = classList.find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            }

            // 也可以从data-lang属性获取
            const dataLang = codeElement.getAttribute('data-lang');
            if (dataLang) {
                language = dataLang;
            }
        }

        // 获取显示名称
        const displayLanguage = getLanguageDisplayName(language);

        // 创建代码块头部容器
        const header = document.createElement('div');
        header.className = 'code-header';

        // 创建语言标签（可点击折叠）
        const langLabel = document.createElement('div');
        langLabel.className = 'code-lang';
        langLabel.textContent = displayLanguage;
        langLabel.title = '点击折叠/展开代码';
        langLabel.setAttribute('role', 'button');
        langLabel.setAttribute('tabindex', '0');
        langLabel.setAttribute('aria-label', `切换${displayLanguage}代码块显示`);
        langLabel.setAttribute('aria-expanded', 'true');

        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '复制';
        copyButton.title = '复制代码';
        copyButton.setAttribute('aria-label', '复制代码到剪贴板');

        // 添加按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'code-buttons';
        buttonContainer.appendChild(copyButton);

        // 组装头部
        header.appendChild(langLabel);
        header.appendChild(buttonContainer);

        // 在代码块前插入头部
        codeBlock.parentNode.insertBefore(header, codeBlock);

        // 添加折叠功能
        let isCollapsed = false;
        langLabel.addEventListener('click', function() {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                codeBlock.style.display = 'none';
                langLabel.classList.add('collapsed');
                langLabel.setAttribute('aria-expanded', 'false');
                langLabel.innerHTML = displayLanguage + ' <span class="expand-icon">▶</span>';
            } else {
                codeBlock.style.display = 'block';
                langLabel.classList.remove('collapsed');
                langLabel.setAttribute('aria-expanded', 'true');
                langLabel.innerHTML = displayLanguage + ' <span class="collapse-icon">▼</span>';
            }
        });

        // 初始显示折叠图标
        langLabel.innerHTML = displayLanguage + ' <span class="collapse-icon">▼</span>';

        // 添加复制功能
        copyButton.addEventListener('click', function() {
            const codeText = codeElement ? codeElement.textContent : '';

            // 使用现代 Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(codeText).then(() => {
                    // 显示复制成功反馈
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = '已复制!';
                    copyButton.classList.add('copied');

                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                    fallbackCopyTextToClipboard(codeText);
                });
            } else {
                // 降级方案
                fallbackCopyTextToClipboard(codeText);
            }
        });
    });

    // 降级复制方法
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                // 显示成功反馈
                const copyButtons = document.querySelectorAll('.copy-button');
                copyButtons.forEach(button => {
                    const originalText = button.innerHTML;
                    button.innerHTML = '已复制!';
                    button.classList.add('copied');

                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('copied');
                    }, 2000);
                });
            }
        } catch (err) {
            console.error('降级复制失败:', err);
        }

        document.body.removeChild(textArea);
    }

    // 添加键盘支持
    document.addEventListener('keydown', function(e) {
        if (e.target.classList.contains('code-lang') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.target.click();
        }
    });
});