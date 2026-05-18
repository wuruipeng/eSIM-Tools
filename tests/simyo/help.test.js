/**
 * Simyo 帮助弹窗测试
 */

import simyoApp from '../../src/js/modules/simyo/app.js';

describe('Simyo handleHelp()', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('点击帮助按钮应打开帮助弹窗', () => {
    simyoApp.handleHelp();

    const overlay = document.querySelector('[data-help-overlay="simyo-help"]');
    expect(overlay).toBeInTheDocument();

    const closeBtn = overlay.querySelector('[data-action="close-help"]');
    expect(closeBtn).toBeInTheDocument();

    const content = overlay.querySelector('div');
    expect(content.textContent).toContain('Simyo eSIM 工具使用帮助');
  });

  it('点击关闭按钮应移除遮罩层', () => {
    simyoApp.handleHelp();

    const overlay = document.querySelector('[data-help-overlay="simyo-help"]');
    expect(overlay).toBeInTheDocument();

    const closeBtn = overlay.querySelector('[data-action="close-help"]');
    closeBtn.click();
    expect(document.querySelector('[data-help-overlay="simyo-help"]')).toBeNull();
  });

  it('点击遮罩空白处应移除遮罩层', () => {
    simyoApp.handleHelp();

    const overlay = document.querySelector('[data-help-overlay="simyo-help"]');
    expect(overlay).toBeInTheDocument();

    overlay.click();
    expect(document.querySelector('[data-help-overlay="simyo-help"]')).toBeNull();
  });
});
