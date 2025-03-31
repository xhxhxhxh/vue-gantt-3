import mdContainer from 'markdown-it-container';
import createDemoContainer from '../plugins/demo';
import type { MarkdownRenderer } from 'vitepress';

export const mdPlugin = (md: MarkdownRenderer) => {
  md.use(mdContainer, 'demo', createDemoContainer(md));
};
