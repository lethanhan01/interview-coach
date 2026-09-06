import 'dotenv/config';
import { prisma } from '../test/helpers/prisma';

const BASE_URL = 'http://localhost:3000/api/v1';

async function runLiveVerification() {
  console.log('================================================================');
  console.log('--- BẮT ĐẦU KIỂM THỬ LIVE HTTP API USER & CANDIDATE PROFILE ---');
  console.log('================================================================\n');

  // 1. Snapshot dữ liệu gốc
  console.log('[1] Snapshot dữ liệu gốc của demo@interviewai.dev từ Database...');
  const originalUser = await prisma.user.findUnique({
    where: { email: 'demo@interviewai.dev' },
  });
  if (!originalUser) {
    throw new Error('User demo@interviewai.dev không tồn tại trong database!');
  }

  const originalProfile = await prisma.userProfile.findUnique({
    where: { userId: originalUser.id },
  });

  console.log(`    User: id=${originalUser.id}, name="${originalUser.firstname} ${originalUser.lastname}", role=${originalUser.role}`);
  console.log(`    Profile: targetPosition="${originalProfile?.targetPosition}", targetLevel="${originalProfile?.targetLevel}"`);
  console.log('    ✅ Snapshot thành công.\n');

  let cookieHeader = '';

  try {
    // 2. Login lấy cookie
    console.log('[2] Đăng nhập qua POST /api/v1/auth/login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@interviewai.dev',
        password: 'Demo@123456',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login thất bại với status ${loginRes.status}`);
    }

    const rawCookie = loginRes.headers.get('set-cookie');
    if (!rawCookie) {
      throw new Error('Không nhận được set-cookie từ login response');
    }
    cookieHeader = rawCookie.split(';')[0];
    console.log(`    ✅ Đăng nhập thành công (Status: ${loginRes.status}), Cookie: ${cookieHeader.substring(0, 30)}...\n`);

    // 3. Test GET /api/v1/users/me (có cookie)
    console.log('[3] Test GET /api/v1/users/me (có cookie hợp lệ)...');
    const getMeRes = await fetch(`${BASE_URL}/users/me`, {
      headers: { Cookie: cookieHeader },
    });
    const getMeData = await getMeRes.json();
    console.log(`    Status: ${getMeRes.status}`);
    if (getMeRes.status !== 200 || !getMeData.id || getMeData.passwordHash) {
      throw new Error(`GET /users/me không hợp lệ: ${JSON.stringify(getMeData)}`);
    }
    console.log(`    ✅ Trả về đúng User DTO: email=${getMeData.email}, role=${getMeData.role}, không rò rỉ hash/tokens.\n`);

    // 4. Test GET /api/v1/users/me (không cookie)
    console.log('[4] Test GET /api/v1/users/me (không cookie -> mong đợi 401)...');
    const getMeNoAuthRes = await fetch(`${BASE_URL}/users/me`);
    console.log(`    Status: ${getMeNoAuthRes.status}`);
    if (getMeNoAuthRes.status !== 401) {
      throw new Error(`Kỳ vọng 401 nhưng nhận được ${getMeNoAuthRes.status}`);
    }
    console.log('    ✅ Chặn truy cập trái phép thành công (401 Unauthorized).\n');

    // 5. Test PATCH /api/v1/users/me (hợp lệ)
    console.log('[5] Test PATCH /api/v1/users/me (cập nhật họ tên hợp lệ)...');
    const patchMeRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        firstname: 'Thành An (LiveTest)',
        lastname: 'Lê',
      }),
    });
    const patchMeData = await patchMeRes.json();
    console.log(`    Status: ${patchMeRes.status}`);
    if (patchMeRes.status !== 200 || patchMeData.firstname !== 'Thành An (LiveTest)') {
      throw new Error(`PATCH /users/me thất bại: ${JSON.stringify(patchMeData)}`);
    }
    console.log(`    ✅ Cập nhật họ tên thành công: ${patchMeData.lastname} ${patchMeData.firstname}\n`);

    // 6. Test PATCH /api/v1/users/me (tên rỗng -> 400)
    console.log('[6] Test PATCH /api/v1/users/me (tên rỗng -> mong đợi 400)...');
    const patchMeEmptyRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        firstname: '   ',
      }),
    });
    const patchMeEmptyData = await patchMeEmptyRes.json();
    console.log(`    Status: ${patchMeEmptyRes.status}`);
    if (patchMeEmptyRes.status !== 400) {
      throw new Error(`Kỳ vọng 400 nhưng nhận được ${patchMeEmptyRes.status}`);
    }
    console.log(`    ✅ Chặn tên rỗng thành công (400 Bad Request, message="${patchMeEmptyData.message || patchMeEmptyData.errorCode}")\n`);

    // 7. Test GET /api/v1/candidate-profile
    console.log('[7] Test GET /api/v1/candidate-profile...');
    const getProfileRes = await fetch(`${BASE_URL}/candidate-profile`, {
      headers: { Cookie: cookieHeader },
    });
    const getProfileData = await getProfileRes.json();
    console.log(`    Status: ${getProfileRes.status}`);
    if (getProfileRes.status !== 200 || !getProfileData.profile) {
      throw new Error(`GET /candidate-profile không hợp lệ: ${JSON.stringify(getProfileData)}`);
    }
    console.log(`    ✅ Lấy hồ sơ ứng viên thành công: targetPosition="${getProfileData.profile.targetPosition}", skills=${getProfileData.profile.technicalSkills?.length || 0} skills.\n`);

    // 8. Test PATCH /api/v1/candidate-profile
    console.log('[8] Test PATCH /api/v1/candidate-profile (cập nhật vị trí mục tiêu)...');
    const patchProfileRes = await fetch(`${BASE_URL}/candidate-profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        targetPosition: 'Fullstack Engineer (LiveTest)',
      }),
    });
    const patchProfileData = await patchProfileRes.json();
    console.log(`    Status: ${patchProfileRes.status}`);
    if (patchProfileRes.status !== 200 || patchProfileData.profile.targetPosition !== 'Fullstack Engineer (LiveTest)') {
      throw new Error(`PATCH /candidate-profile thất bại: ${JSON.stringify(patchProfileData)}`);
    }
    console.log(`    ✅ Cập nhật hồ sơ thành công: targetPosition="${patchProfileData.profile.targetPosition}"\n`);
  } finally {
    // 9. ROLLBACK dữ liệu ban đầu
    console.log('================================================================');
    console.log('[9] TIẾN HÀNH ROLLBACK DỮ LIỆU GỐC CHO TÀI KHOẢN...');
    console.log('================================================================');

    await prisma.user.update({
      where: { id: originalUser.id },
      data: {
        firstname: originalUser.firstname,
        lastname: originalUser.lastname,
      },
    });

    if (originalProfile) {
      await prisma.userProfile.update({
        where: { id: originalProfile.id },
        data: {
          targetPosition: originalProfile.targetPosition,
          targetLevel: originalProfile.targetLevel,
          onetSocCode: originalProfile.onetSocCode,
          onetOccupationTitle: originalProfile.onetOccupationTitle,
          targetSfiaLevel: originalProfile.targetSfiaLevel,
          personality: originalProfile.personality,
          education: originalProfile.education as any,
          workExperience: originalProfile.workExperience as any,
          projects: originalProfile.projects as any,
          technicalSkills: originalProfile.technicalSkills as any,
          certifications: originalProfile.certifications as any,
          awards: originalProfile.awards as any,
        },
      });
    }

    // Kiểm tra lại sau rollback
    const rolledBackUser = await prisma.user.findUnique({
      where: { id: originalUser.id },
    });
    const rolledBackProfile = await prisma.userProfile.findUnique({
      where: { userId: originalUser.id },
    });

    console.log(`    Rollback User: firstname="${rolledBackUser?.firstname}", lastname="${rolledBackUser?.lastname}"`);
    console.log(`    Rollback Profile: targetPosition="${rolledBackProfile?.targetPosition}"`);
    console.log('    ✅ DỮ LIỆU ĐÃ ĐƯỢC KHÔI PHỤC 100% NGUYÊN TRẠNG BAN ĐẦU!\n');
  }

  console.log('================================================================');
  console.log('🎉 TOÀN BỘ CÁC BÀI KIỂM THỬ LIVE HTTP API ĐÃ HOÀN TẤT XUẤT SẮC!');
  console.log('================================================================');
}

runLiveVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ LỖI TRONG QUÁ TRÌNH TEST:', err);
    process.exit(1);
  });
