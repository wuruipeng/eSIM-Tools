/**
 * Simyo 主流程编排测试（设备更换）
 *
 * 测试 modular 版本的完整设备更换流程
 */

import simyoApp from '../../src/js/modules/simyo/app.js';

describe('SimyoApp 设备更换主流程自动化', () => {
  beforeEach(() => {
    // 重置状态
    simyoApp.state = {
      token: 'test-token',
      username: 'test-user',
      phoneNumber: null,
      esimData: null,
      currentStep: 1
    };

    // 设置 DOM
    document.body.innerHTML = `
      <input id="phoneNumber" />
      <input id="password" />
      <button id="applyNewEsimBtn"></button>
      <div id="applyNewEsimStatus"></div>
      <button id="verifyCodeBtn" disabled></button>
      <div id="verifyCodeStatus"></div>
      <input id="smsCode" />
      <div id="smsCodeSection" style="display: none;"></div>
      <button id="loginBtn"></button>
      <div id="loginStatus"></div>
      <div id="esimStatus"></div>
      <div id="esimDataDisplay"></div>
      <button id="confirmInstallBtn"></button>
      <div id="confirmStatus"></div>
      <button id="clearSessionBtn"></button>
      <div id="step1"></div>
      <div id="step2"></div>
      <div id="step3"></div>
      <div id="step4"></div>
      <div id="deviceChangeSteps"></div>
    `;

    // Mock 方法
    simyoApp.showStatus = jest.fn();
    simyoApp.navigateToStep = jest.fn();
    simyoApp.displayESIMData = jest.fn();
    simyoApp.saveSession = jest.fn();
    simyoApp.showToast = jest.fn();

    // Mock API
    simyoApp.api = {
      login: jest.fn(),
      sendSMSCode: jest.fn(),
      verifyCode: jest.fn(),
      requestDeviceChange: jest.fn(),
      confirmInstallation: jest.fn()
    };
  });

  describe('handleLogin', () => {
    it('登录成功后应跳转到步骤 2', async () => {
      document.getElementById('phoneNumber').value = '0612345678';
      document.getElementById('password').value = 'password123';

      simyoApp.api.login.mockResolvedValueOnce({
        success: true,
        token: 'new-token'
      });

      await simyoApp.handleLogin();

      expect(simyoApp.api.login).toHaveBeenCalledWith('0612345678', 'password123');
      expect(simyoApp.state.token).toBe('new-token');
      expect(simyoApp.showStatus).toHaveBeenCalledWith('loginStatus', '登录成功！', 'success');
      expect(simyoApp.navigateToStep).toHaveBeenCalledWith(2);
    });

    it('登录失败时应显示错误', async () => {
      document.getElementById('phoneNumber').value = '0612345678';
      document.getElementById('password').value = 'wrong';

      simyoApp.api.login.mockResolvedValueOnce({
        success: false,
        message: '用户名或密码错误'
      });

      await simyoApp.handleLogin();

      expect(simyoApp.showStatus).toHaveBeenCalledWith('loginStatus', '登录失败: 用户名或密码错误', 'error');
    });
  });

  describe('handleSendSMS', () => {
    it('发送验证码成功后应显示验证码输入框', async () => {
      simyoApp.api.sendSMSCode.mockResolvedValueOnce({
        success: true
      });

      await simyoApp.handleSendSMS();

      expect(simyoApp.api.sendSMSCode).toHaveBeenCalledWith('test-token');
      expect(simyoApp.showStatus).toHaveBeenCalledWith('applyNewEsimStatus', '验证码已发送到您的手机', 'success');
    });
  });

  describe('handleVerifySMS', () => {
    it('验证成功后应跳转到步骤 3', async () => {
      document.getElementById('smsCode').value = '123456';

      simyoApp.api.verifyCode.mockResolvedValueOnce({
        success: true
      });

      await simyoApp.handleVerifySMS();

      expect(simyoApp.api.verifyCode).toHaveBeenCalledWith('test-token', '123456');
      expect(simyoApp.showStatus).toHaveBeenCalledWith('verifyCodeStatus', '验证成功！', 'success');
      expect(simyoApp.navigateToStep).toHaveBeenCalledWith(3);
    });

    it('未输入验证码时应提示', async () => {
      document.getElementById('smsCode').value = '';

      await simyoApp.handleVerifySMS();

      expect(simyoApp.showStatus).toHaveBeenCalledWith('verifyCodeStatus', '请输入验证码', 'error');
    });
  });

  describe('handleDeviceChange', () => {
    it('设备更换成功后应显示 eSIM 数据', async () => {
      const mockEsimData = {
        lpaString: 'LPA:1$smdp.example.com$ACTIVATION-CODE-123'
      };

      simyoApp.api.requestDeviceChange.mockResolvedValueOnce({
        success: true,
        esimData: mockEsimData
      });

      await simyoApp.handleDeviceChange();

      expect(simyoApp.state.esimData).toEqual(mockEsimData);
      expect(simyoApp.displayESIMData).toHaveBeenCalledWith(mockEsimData);
      expect(simyoApp.navigateToStep).toHaveBeenCalledWith(4);
    });
  });

  describe('handleConfirmInstall', () => {
    it('确认安装成功后应显示完成消息', async () => {
      simyoApp.state.esimData = {
        lpaString: 'LPA:1$smdp.example.com$ACTIVATION-CODE-123'
      };

      simyoApp.api.confirmInstallation.mockResolvedValueOnce({
        success: true
      });

      // Mock showCompletionMessage
      simyoApp.showCompletionMessage = jest.fn();

      await simyoApp.handleConfirmInstall();

      expect(simyoApp.api.confirmInstallation).toHaveBeenCalledWith('test-token');
      expect(simyoApp.showStatus).toHaveBeenCalledWith('confirmStatus', 'eSIM 安装确认成功！', 'success');
      expect(simyoApp.showCompletionMessage).toHaveBeenCalled();
    });
  });
});
