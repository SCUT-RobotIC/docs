import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
import path from 'node:path';
import {buildKnowledgeSidebars} from './src/knowledgeSidebars.mjs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const contentRoot = path.resolve(process.cwd(), 'content');
const sidebars: SidebarsConfig = buildKnowledgeSidebars(contentRoot);

export default sidebars;
