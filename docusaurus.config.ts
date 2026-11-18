import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'RobotIC 知识库',
  tagline: '华南理工大学 RobotIC 机器人实验室知识库',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://scut-robotic.github.io',
  baseUrl: '/docs/',

  organizationName: 'SCUT-RobotIC',
  projectName: 'docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og-cover.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'RobotIC 知识库',
      logo: {
        alt: 'RobotIC 队徽',
        src: 'img/robot-logo-dark.png',
        srcDark: 'img/robot-logo-light.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'knowledgeSidebar',
          position: 'left',
          label: '文档',
        },
        {
          href: 'https://robot-ic.com/',
          label: '返回官网',
          position: 'right',
        },
        {
          href: 'https://github.com/SCUT-RobotIC/docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'RobotIC',
          items: [
            {
              label: '官方网站',
              href: 'https://robot-ic.com/',
            },
            {
              label: '工程仓库',
              href: 'https://github.com/SCUT-RobotIC/docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 华南理工大学 RobotIC 机器人实验室`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
