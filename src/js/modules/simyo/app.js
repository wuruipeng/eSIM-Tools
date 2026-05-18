/**
 * Simyo eSIM 应用控制器
 */

import apiManager from './api.js';
import HTMLSanitizer from '../html-sanitizer.js';
import SecureStorage from '../secure-storage.js';

class SimyoApp {
  constructor() {
    this.api = apiManager;
    this.state = {
      token: null,
      username: null,
      phoneNumber: null,
      esimData: null,
      currentStep: 1
    };

    this.initialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.initialized) return;

    try {
      this.bindEventListeners();
      const sessionRestored = this.loadSession();
      console.log('[Simyo] init: 初始化完成', { sessionRestored });
      this.initialized = true;
    } catch (error) {
      console.error('[Simyo] init: 初始化失败', error);
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 登录
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.handleLogin());
    }

    // 申请新 eSIM（发送验证码）
    const applyNewEsimBtn = document.getElementById('applyNewEsimBtn');
    if (applyNewEsimBtn) {
      applyNewEsimBtn.addEventListener('click', () => this.handleSendSMS());
    }

    // 验证验证码
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    if (verifyCodeBtn) {
      verifyCodeBtn.addEventListener('click', () => this.handleVerifySMS());
    }

    // 设备更换
    const deviceChangeBtn = document.getElementById('deviceChangeBtn');
    if (deviceChangeBtn) {
      deviceChangeBtn.addEventListener('click', () => this.handleDeviceChange());
    }

    // 确认安装
    const confirmInstallBtn = document.getElementById('confirmInstallBtn');
    if (confirmInstallBtn) {
      confirmInstallBtn.addEventListener('click', () => this.handleConfirmInstall());
    }

    // 清除会话
    const clearSessionBtn = document.getElementById('clearSessionBtn');
    if (clearSessionBtn) {
      clearSessionBtn.addEventListener('click', () => this.handleClearSession());
    }

    // 帮助按钮
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.handleHelp());
    }

    console.log('[Simyo] 事件监听器绑定完成');
  }

  /**
   * 处理登录
   */
  async handleLogin() {
    try {
      const phoneEl = document.getElementById('phoneNumber');
      const passwordEl = document.getElementById('password');
      const username = phoneEl ? phoneEl.value : undefined;
      const password = passwordEl ? passwordEl.value : undefined;

      if (!username || !password) {
        this.showStatus('loginStatus', '请输入手机号和密码', 'error');
        return;
      }

      this.showStatus('loginStatus', '正在登录...', 'info');
      console.log('[Simyo] handleLogin: 开始登录', { username: username?.slice(0, 3) + '***' });

      const response = await this.api.login(username, password);

      if (response.success) {
        this.state.token = response.token;
        this.state.username = username;
        this.saveSession();

        this.showStatus('loginStatus', '登录成功！', 'success');
        this.navigateToStep(2);
      } else {
        throw new Error(response.message || '登录失败');
      }

    } catch (error) {
      console.error('登录失败:', error);
      this.showStatus('loginStatus', `登录失败: ${error.message}`, 'error');
    }
  }

  /**
   * 发送短信验证码
   */
  async handleSendSMS() {
    try {
      if (!this.state.token) {
        this.showStatus('smsStatus', '请先登录', 'error');
        return;
      }

      this.showStatus('applyNewEsimStatus', '正在发送验证码...', 'info');
      console.log('[Simyo] handleSendSMS: 发送验证码', { hasToken: !!this.state.token });

      const response = await this.api.sendSMSCode(this.state.token);

      if (response.success) {
        this.showStatus('applyNewEsimStatus', '验证码已发送到您的手机', 'success');
        const smsCodeSection = document.getElementById('smsCodeSection');
        if (smsCodeSection) smsCodeSection.style.display = 'block';
      } else {
        throw new Error(response.message || '发送失败');
      }

    } catch (error) {
      console.error('[Simyo] handleSendSMS: 发送失败', error);
      this.showStatus('applyNewEsimStatus', `发送失败: ${error.message}`, 'error');
    }
  }

  /**
   * 验证短信验证码
   */
  async handleVerifySMS() {
    try {
      const codeEl = document.getElementById('smsCode');
      const code = codeEl ? codeEl.value : undefined;

      if (!code) {
        this.showStatus('verifyCodeStatus', '请输入验证码', 'error');
        return;
      }

      this.showStatus('verifyCodeStatus', '正在验证...', 'info');
      console.log('[Simyo] handleVerifySMS: 验证短信', { code: code?.slice(0, 2) + '****', hasToken: !!this.state.token });

      const response = await this.api.verifyCode(this.state.token, code);

      if (response.success) {
        this.showStatus('verifyCodeStatus', '验证成功！', 'success');
        this.navigateToStep(3);
      } else {
        throw new Error(response.message || '验证失败');
      }

    } catch (error) {
      console.error('[Simyo] handleVerifySMS: 验证失败', error);
      this.showStatus('verifyCodeStatus', `验证失败: ${error.message}`, 'error');
    }
  }

  /**
   * 处理设备更换
   */
  async handleDeviceChange() {
    try {
      if (!this.state.token) {
        this.showStatus('esimStatus', '请先完成认证', 'error');
        return;
      }

      this.showStatus('esimStatus', '正在处理设备更换...', 'info');
      console.log('[Simyo] handleDeviceChange: 开始设备更换', { hasToken: !!this.state.token });

      const response = await this.api.requestDeviceChange(this.state.token);

      if (response.success && response.esimData) {
        this.state.esimData = response.esimData;
        this.displayESIMData(response.esimData);

        this.showStatus('esimStatus', '设备更换成功！', 'success');
        this.saveSession();
        this.navigateToStep(4);
      } else {
        throw new Error(response.message || '设备更换失败');
      }

    } catch (error) {
      console.error('[Simyo] handleDeviceChange: 设备更换失败', error);
      this.showStatus('esimStatus', `处理失败: ${error.message}`, 'error');
    }
  }

  /**
   * 确认安装
   */
  async handleConfirmInstall() {
    try {
      if (!this.state.token || !this.state.esimData) {
        this.showStatus('confirmStatus', '请先完成设备更换', 'error');
        return;
      }

      this.showStatus('confirmStatus', '正在确认安装...', 'info');
      console.log('[Simyo] handleConfirmInstall: 确认安装', {
        hasToken: !!this.state.token,
        hasEsimData: !!this.state.esimData,
        lpaString: this.state.esimData?.lpaString?.slice(0, 20) + '...'
      });

      const response = await this.api.confirmInstallation(this.state.token);

      if (response.success) {
        this.showStatus('confirmStatus', 'eSIM 安装确认成功！', 'success');
        this.showCompletionMessage();
      } else {
        throw new Error(response.message || '确认失败');
      }

    } catch (error) {
      console.error('[Simyo] handleConfirmInstall: 确认安装失败', error);
      this.showStatus('confirmStatus', `确认失败: ${error.message}`, 'error');
    }
  }

  /**
   * 清除会话
   */
  handleClearSession() {
    if (confirm('确定要清除所有会话数据吗？这将重置所有进度。')) {
      console.log('[Simyo] handleClearSession: 清除会话');
      this.state = {
        token: null,
        username: null,
        phoneNumber: null,
        esimData: null,
        currentStep: 1
      };
      SecureStorage.removeItem('simyo_session');
      this.navigateToStep(1);
      this.showToast('会话已清除');
    }
  }

  /**
   * 显示 eSIM 数据
   */
  displayESIMData(esimData) {
    const displayElement = document.getElementById('esimDataDisplay');
    if (!displayElement) return;

    const qrCodeUrl = `https://qrcode.show/${encodeURIComponent(esimData.lpaString)}?size=300`;

    displayElement.innerHTML = `
      <div class="esim-info">
        <h4>您的 eSIM 信息</h4>
        <div class="qrcode-container">
          <img src="${qrCodeUrl}" alt="eSIM QR Code" class="img-fluid" />
        </div>
        <div class="lpa-string mt-3">
          <strong>LPA 字符串:</strong>
          <div class="code-display">${HTMLSanitizer.escapeHtml(esimData.lpaString)}</div>
          <button class="btn btn-primary mt-2" data-copy-lpa="${HTMLSanitizer.escapeAttr(esimData.lpaString)}">
            <i class="fas fa-copy"></i> 复制
          </button>
        </div>
      </div>
    `;

    // 通过 addEventListener 绑定复制按钮，避免内联 onclick 的 XSS 风险
    const copyBtn = displayElement.querySelector('[data-copy-lpa]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyToClipboard(copyBtn.dataset.copyLpa));
    }
  }

  /**
   * 显示完成消息
   */
  showCompletionMessage() {
    const messageElement = document.getElementById('completionMessage');
    if (messageElement) {
      messageElement.style.display = 'block';
      messageElement.innerHTML = `
        <div class="alert alert-success">
          <h4><i class="fas fa-check-circle"></i> 恭喜！</h4>
          <p>您的 eSIM 已成功配置并确认安装。</p>
          <p>请在您的设备设置中添加移动套餐，扫描二维码或手动输入 LPA 字符串。</p>
        </div>
      `;
    }
  }

  /**
   * 导航到指定步骤
   */
  navigateToStep(stepNumber) {
    this.state.currentStep = stepNumber;

    // 隐藏所有步骤
    document.querySelectorAll('.section').forEach(step => {
      step.style.display = 'none';
    });

    // 显示当前步骤
    const currentStep = document.getElementById(`step${stepNumber}`);
    if (currentStep) {
      currentStep.style.display = 'block';
    }

    // 更新步骤指示器
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
      if (index < stepNumber - 1) {
        indicator.classList.add('completed');
        indicator.classList.remove('active');
      } else if (index === stepNumber - 1) {
        indicator.classList.add('active');
        indicator.classList.remove('completed');
      } else {
        indicator.classList.remove('active', 'completed');
      }
    });

    console.log('[Simyo] navigateToStep: 导航到步骤', { stepNumber });
  }

  /**
   * 显示状态消息
   */
  showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = type === 'success' ? 'text-success' :
                       type === 'error' ? 'text-danger' :
                       type === 'info' ? 'text-info' :
                       'text-muted';
    element.style.display = 'block';
  }

  /**
   * 复制到剪贴板
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('已复制到剪贴板');
    } catch (err) {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('已复制到剪贴板');
    }
  }

  /**
   * 显示 Toast 通知
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 保存会话
   */
  saveSession() {
    SecureStorage.setItem('simyo_session', {
      token: this.state.token,
      username: this.state.username,
      esimData: this.state.esimData,
      currentStep: this.state.currentStep
    }, 3600000); // 1 小时 TTL
  }

  /**
   * 加载会话
   */
  loadSession() {
    try {
      const data = SecureStorage.getItem('simyo_session');
      if (data) {
        Object.assign(this.state, data);
        this.navigateToStep(data.currentStep || 1);
        console.log('[Simyo] loadSession: 会话已恢复', {
          step: data.currentStep,
          hasToken: !!data.token,
          username: data.username?.slice(0, 3) + '***'
        });
        return true;
      }
    } catch (error) {
      console.error('[Simyo] loadSession: 加载会话失败', error);
    }
    return false;
  }

  /**
   * 打开帮助弹窗
   */
  handleHelp() {
    // 移除已有的帮助弹窗
    const existing = document.querySelector('[data-help-overlay="simyo-help"]');
    if (existing) existing.remove();

    // 创建帮助弹窗
    const overlay = document.createElement('div');
    overlay.setAttribute('data-help-overlay', 'simyo-help');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;position:relative;';
    content.innerHTML = `
      <button data-action="close-help" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>
      <h3 style="margin-top:0;">Simyo eSIM 工具使用帮助</h3>
      <h4>1. 登录</h4>
      <p>输入您的 Simyo 手机号（06 开头 10 位数字）和密码登录。</p>
      <h4>2. 发送验证码</h4>
      <p>登录后点击"申请新 eSIM"按钮，系统将发送短信验证码到您的手机。</p>
      <h4>3. 验证并设备更换</h4>
      <p>输入收到的验证码，系统将自动完成设备更换流程。</p>
      <h4>4. 确认安装</h4>
      <p>设备更换成功后，系统会显示 eSIM 二维码和 LPA 字符串。请扫描二维码或手动输入 LPA 字符串完成安装。</p>
      <h4>常见问题</h4>
      <ul>
        <li><strong>登录失败</strong>：请确认手机号格式正确（06 开头 10 位数字）</li>
        <li><strong>验证码收不到</strong>：请检查手机信号，或稍后重试</li>
        <li><strong>设备更换失败</strong>：请确认账户状态正常</li>
      </ul>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // 绑定关闭事件
    const closeBtn = content.querySelector('[data-action="close-help"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => overlay.remove());
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    console.log('[Simyo] handleHelp: 帮助弹窗已打开');
  }
}

// 创建全局实例
const simyoApp = new SimyoApp();

// 自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => simyoApp.init());
} else {
  simyoApp.init();
}

// 暴露到全局
window.simyoApp = simyoApp;

export default simyoApp;
