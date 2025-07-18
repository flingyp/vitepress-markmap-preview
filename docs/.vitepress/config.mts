import { defineConfig } from 'vitepress';
import { vitepressMarkmapPreview } from 'vitepress-markmap-preview';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/vitepress-markmap-preview',
    title: 'vitepress-markmap-preview',
    description: 'Markmap preview for vitepress',
    themeConfig: {
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/flingyp/vitepress-markmap-preview',
            },
        ],
    },
    markdown: {
        theme: {
            light: 'vitesse-light',
            dark: 'vitesse-dark',
        },
        config(md) {
            // 使用更多的 Markdown-it 插件！
            md.use(vitepressMarkmapPreview);
        },
    },
});
