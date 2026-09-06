import { test, expect } from '@playwright/test';

test.describe('Profile & Resume Frontend Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Đăng nhập vào hệ thống với tài khoản demo
    await page.goto('/login');
    await page.getByPlaceholder('Nhập email').fill('demo@interviewai.dev');
    await page.getByPlaceholder('Nhập mật khẩu').fill('Demo@123456');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Chờ điều hướng sau khi login thành công
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 10000,
    });
  });

  test('TC-FE-01 -> TC-FE-05: Kiểm tra và cập nhật Thông tin cá nhân tại /profile', async ({
    page,
  }) => {
    // Truy cập trang /profile
    await page.goto('/profile');

    // TC-FE-02: Kiểm tra các thành phần cơ bản trên giao diện
    await expect(page.getByRole('heading', { name: 'Cài đặt tài khoản' })).toBeVisible();
    await expect(page.getByText('demo@interviewai.dev').first()).toBeVisible();
    await expect(page.getByText('Ứng viên').first()).toBeVisible();

    // TC-FE-03: Chỉnh sửa Họ và Tên hợp lệ
    const editBtn = page.getByRole('button', { name: /chỉnh sửa/i }).first();
    await editBtn.click();

    const lastnameInput = page.locator('#profile-lastname');
    const firstnameInput = page.locator('#profile-firstname');

    await expect(lastnameInput).toBeVisible();
    await expect(firstnameInput).toBeVisible();

    await lastnameInput.fill('An');
    await firstnameInput.fill('Lê Thành');

    const saveBtn = page.getByRole('button', { name: 'Lưu thay đổi' });
    await saveBtn.click();

    // Đợi form đóng lại và hiển thị text mới
    await expect(page.locator('#profile-firstname')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'An Lê Thành' })).toBeVisible();

    // TC-FE-04: Thử nghiệm validation khi nhập tên rỗng
    await page.getByRole('button', { name: /chỉnh sửa/i }).first().click();
    await page.locator('#profile-firstname').fill('   ');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

    // Xác nhận hiển thị thông báo lỗi và không bị crash
    await expect(page.locator('.text-danger')).toBeVisible();
    await page.getByRole('button', { name: 'Hủy' }).click();

    // TC-FE-05: Chuyển hướng sang trang /resume
    const resumeLink = page.getByRole('link', { name: /xem hồ sơ cv/i });
    await expect(resumeLink).toBeVisible();
    await resumeLink.click();
    await expect(page).toHaveURL(/\/resume/);
  });

  test('TC-FE-06 -> TC-FE-08: Kiểm tra hiển thị Định hướng nghề nghiệp tại /resume', async ({
    page,
  }) => {
    await page.goto('/resume');

    // Kiểm tra tiêu đề trang
    await expect(
      page.getByRole('heading', { name: 'Hồ sơ CV & Kinh nghiệm' }),
    ).toBeVisible();

    // Kiểm tra phần Định hướng nghề nghiệp
    await expect(page.getByText('Định hướng nghề nghiệp')).toBeVisible();
    await expect(page.getByText('Frontend Developer').first()).toBeVisible();

    // Mở form chỉnh sửa Career Info
    const careerCard = page.locator('#career');
    const editCareerBtn = careerCard.getByRole('button', { name: /chỉnh sửa/i });
    await editCareerBtn.click();

    // Xác nhận form hiện ra
    await expect(careerCard.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();
    await careerCard.getByRole('button', { name: 'Hủy' }).click();
  });
});
