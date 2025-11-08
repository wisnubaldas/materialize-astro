import { visit } from 'unist-util-visit';

const initDirective = `%%{init: {
  "theme": "default",
  "themeVariables": {
    "fontFamily": "Ubuntu, Segoe UI, sans-serif",
    "fontSize": "16px",
    "primaryColor": "#ede6ff",
    "primaryBorderColor": "#7f6dd3",
    "lineColor": "#2c2c30",
    "secondaryColor": "#f7f3ff",
    "noteTextColor": "#11181c"
  },
  "flowchart": {
    "htmlLabels": true,
    "nodeSpacing": 50,
    "rankSpacing": 60,
    "padding": 18
  }
}}%%
`;

export default function remarkMermaidDefaults() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang !== 'mermaid') return;
      const trimmed = node.value.trimStart();
      if (trimmed.startsWith('%%{init:')) {
        return;
      }
      node.value = `${initDirective}${node.value}`;
    });
  };
}
