import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  electricControlSidebar: [
    {
      type: 'category',
      label: '电控组知识库',
      collapsed: false,
      link: {
        type: 'doc',
        id: '电控组知识库/index',
      },
      items: [
        {
          type: 'category',
          label: '嵌入式软件基础',
          collapsed: false,
          link: {
            type: 'doc',
            id: '电控组知识库/嵌入式软件基础/index',
          },
          items: [
            '电控组知识库/嵌入式软件基础/序言和目录',
            {
              type: 'category',
              label: '1. 编程基础',
              collapsed: false,
              items: [
                '电控组知识库/嵌入式软件基础/编程基础/C语言编程',
                '电控组知识库/嵌入式软件基础/编程基础/程序设计的思维',
                '电控组知识库/嵌入式软件基础/编程基础/番外：跑步进入现代IDE——STM32开发环境的探索',
                '电控组知识库/嵌入式软件基础/编程基础/附录：推荐代码规范',
              ],
            },
            {
              type: 'category',
              label: '2. STM32基础',
              collapsed: true,
              items: [
                '电控组知识库/嵌入式软件基础/STM32基础/引入和内核',
                '电控组知识库/嵌入式软件基础/STM32基础/外设',
                '电控组知识库/嵌入式软件基础/STM32基础/通信',
                '电控组知识库/嵌入式软件基础/STM32基础/【扩展】存储结构',
              ],
            },
            {
              type: 'category',
              label: '3. 控制理论',
              collapsed: true,
              items: [
                '电控组知识库/嵌入式软件基础/控制理论/基础控制',
                '电控组知识库/嵌入式软件基础/控制理论/【扩展】滤波',
                '电控组知识库/嵌入式软件基础/控制理论/【扩展】运动解算和规划',
                '电控组知识库/嵌入式软件基础/控制理论/【扩展】进一步理解控制理论',
              ],
            },
            {
              type: 'category',
              label: '4. RTOS',
              collapsed: true,
              items: ['电控组知识库/嵌入式软件基础/RTOS/RTOS'],
            },
            {
              type: 'category',
              label: '5. 【扩展】一点C++',
              collapsed: true,
              items: [
                '电控组知识库/嵌入式软件基础/【扩展】一点C++/一点C++',
                '电控组知识库/嵌入式软件基础/【扩展】一点C++/番外：在STM32工程中使用C++',
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
