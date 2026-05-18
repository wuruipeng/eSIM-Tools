/**
 * Simyo 设备更换处理模块集成测试
 *
 * 测试 modular 版本的 handleDeviceChange 方法
 */

import simyoApp from '../../src/js/modules/simyo/app.js';

describe('SimyoApp 设备更换流程', () => {
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
      <div id="esimStatus"></div>
      <div id="esimDataDisplay"></div>
      <div id="step3"></div>
      <div id="step4"></div>
    `;

    // Mock API
    simyoApp.api = {
      requestDeviceChange: jest.fn()
    };

    // Mock 方法
    simyoApp.showStatus = jest.fn();
    simyoApp.navigateToStep = jest.fn();
    simyoApp.displayESIMData = jest.fn();
    simyoApp.saveSession = jest.fn();
  });

  it('应完成设备更换流程', async () => {
    const mockEsimData = {
      lpaString: 'LPA:1$smdp.example.com$ACTIVATION-CODE-123'
    };

    simyoApp.api.requestDeviceChange.mockResolvedValueOnce({
      success: true,
      esimData: mockEsimData
    });

    await simyoApp.handleDeviceChange();

    expect(simyoApp.api.requestDeviceChange).toHaveBeenCalledWith('test-token');
    expect(simyoApp.state.esimData).toEqual(mockEsimData);
    expect(simyoApp.showStatus).toHaveBeenCalledWith('esimStatus', '设备更换成功！', 'success');
    expect(simyoApp.navigateToStep).toHaveBeenCalledWith(4);
  });

  it('设备更换失败时应显示错误', async () => {
    simyoApp.api.requestDeviceChange.mockResolvedValueOnce({
      success: false,
      message: '设备更换失败'
    });

    await simyoApp.handleDeviceChange();

    expect(simyoApp.showStatus).toHaveBeenCalledWith('esimStatus', '处理失败: 设备更换失败', 'error');
  });

  it('未登录时应提示先完成认证', async () => {
    simyoApp.state.token = null;

    await simyoApp.handleDeviceChange();

    expect(simyoApp.showStatus).toHaveBeenCalledWith('esimStatus', '请先完成认证', 'error');
  });
});
