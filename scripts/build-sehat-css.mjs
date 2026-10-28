import fs from 'node:fs';
import postcss from 'postcss';
const root = postcss.parse(fs.readFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', 'utf8'));
root.walkAtRules('charset', rule => rule.remove());
root.walkComments(comment => { if (!comment.text.includes('Bootstrap')) comment.remove(); });
root.walkRules(rule => {
  if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.map(selector => {
    if (selector === ':root' || selector === '[data-bs-theme=light]') return '.sehat-module';
    if (selector.startsWith('[data-bs-theme=dark]')) return '.dark .sehat-module';
    if (selector === 'body') return '.sehat-module';
    return `.sehat-module ${selector}`;
  });
});
fs.writeFileSync('src/styles/sehat-bootstrap.css', '/* Bootstrap 5.3.8, scoped to Sehat Saathi. Regenerate: node scripts/build-sehat-css.mjs */\n' + root.toString().replace(/\/\*# sourceMappingURL=.*?\*\//g, ''));
