// E2E 测试设置
jest.setTimeout(120000);

// 检查是否有测试账号环境变量
const hasTestCredentials = process.env.XHS_TEST_USER_ID;

if (!hasTestCredentials) {
  console.log('\n⚠️  警告: 未设置测试账号环境变量');
  console.log('   设置 XHS_TEST_USER_ID 环境变量以运行完整测试\n');
}