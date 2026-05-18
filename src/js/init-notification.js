/**
 * 通知系统初始化脚本
 * 从 index.html 内联模块脚本外链，以符合 CSP 策略
 */
import NotificationService from '/src/js/modules/notification-service.js';

document.addEventListener('DOMContentLoaded', () => {
  NotificationService.init();
});
