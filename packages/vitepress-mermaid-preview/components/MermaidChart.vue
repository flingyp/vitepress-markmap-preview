<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import mermaid from 'mermaid';
import { useCopyContent } from '@flypeng/tool/browser';
import { snapdom } from '@zumer/snapdom';
import { useMutationObserver } from '@vueuse/core';
import { UseFullscreen } from '@vueuse/components';
import { Toaster, toast } from 'vue-sonner';
import 'vue-sonner/style.css';

interface MermaidChartProps {
  code?: string;
  showToolbar?: '0' | '1';
}

const props = withDefaults(defineProps<MermaidChartProps>(), {
  code: '',
  showToolbar: '0',
});

console.log('props:', props);

const renderCode = computed(() => {
  return decodeURIComponent(props.code);
});
const renderChartHtml = ref();
const mermaidRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();

async function render() {
  if (!mermaidRef.value) return;

  mermaidRef.value.innerHTML = '';

  // 根据当前主题设置 mermaid 主题
  await mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'default',
    securityLevel: 'loose', // 允许点击交互
  });
  const id = Math.random().toString(36).substring(2, 15);
  const { svg } = await mermaid.render(
    `mermaid-${id}`,
    renderCode.value,
    mermaidRef.value,
  );
  renderChartHtml.value = svg;
}

// 下载Mermaid图表为PNG
async function downloadChart() {
  if (!containerRef.value) return;

  try {
    // 使用 snapdom 截图
    const result = await snapdom(containerRef.value, {
      scale: 2,
      quality: 1,
      backgroundColor: getComputedStyle(
        document.documentElement,
      ).getPropertyValue('--vp-c-bg-soft'),
    });

    await result.download({ format: 'png', filename: 'mermaid-chart' });
    toast.success('图表下载成功！');
  } catch (error) {
    console.error('下载失败:', error);
    toast.error('下载失败，请重试');
  }
}

// 复制Mermaid代码到剪贴板
async function copyCode() {
  if (!renderCode.value) return;

  try {
    useCopyContent(renderCode.value);
    toast.success('代码复制成功！');
  } catch (error) {
    console.error('复制失败:', error);
    toast.error('复制失败，请重试');
  }
}

// 监听 mermaidRef 的 class 属性变化，如果发生变化，则重新渲染图表
useMutationObserver(
  mermaidRef,
  () => {
    render();
  },
  {
    attributes: true, // 监听属性
    attributeFilter: ['class'], // 只关心这几个
  },
);

// 存储MutationObserver实例
const darkModeObserver = ref<MutationObserver>();
onMounted(() => {
  // 初始渲染
  render();

  // 监听DOM变化，检测暗黑模式类的添加/移除
  if (typeof window !== 'undefined' && window.MutationObserver) {
    darkModeObserver.value = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          // 当HTML元素的类变化时，重新渲染图表
          render();
          break;
        }
      }
    });

    // 监听html标签的class属性变化
    darkModeObserver.value.observe(document.documentElement, {
      attributes: true,
    });
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined' && window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        render();
      });
  }
});
</script>

<template>
  <div class="mermaid-container">
    <UseFullscreen v-slot="{ toggle, isFullscreen }">
      <div
        ref="mermaidRef"
        :class="['mermaid', isFullscreen && 'mermaid-fullscreen']"
        v-html="renderChartHtml"
      ></div>
      <!-- 工具栏 -->
      <div v-show="Number(props.showToolbar) === 1" class="mermaid-toolbar">
        <button class="toolbar-btn" title="复制代码" @click="copyCode">
          📋
        </button>
        <button class="toolbar-btn" title="下载图表" @click="downloadChart">
          ⬇️
        </button>
        <button class="toolbar-btn" title="全屏" @click="toggle">
          {{ isFullscreen ? '🔲' : '🔳' }}
        </button>
      </div>
    </UseFullscreen>
  </div>

  <Toaster position="top-right" rich-colors />
</template>

<style lang="scss">
.mermaid {
  & > svg {
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }
}

.mermaid-fullscreen {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: var(--vp-c-bg-soft);
  inset: 0;
}
</style>

<style lang="scss" scoped>
.mermaid-container {
  position: relative;

  &:hover .mermaid-toolbar {
    opacity: 1;
  }
}

.mermaid {
  width: 100%;
  height: 100%;
  margin: 16px 0;
  padding: 12px;
  overflow: auto;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition:
    background-color 0.5s,
    border-color 0.5s;
}

.mermaid-toolbar {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  z-index: 10;
  display: flex;
  gap: 0.2rem;
  padding: 0.3rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 1.5rem;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  opacity: 0;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    transform: translateY(-2px);
    opacity: 1;
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: var(--vp-c-text-1);
  font-size: 1.1rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: var(--vp-c-brand);
    background: var(--vp-c-brand-dimm);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
