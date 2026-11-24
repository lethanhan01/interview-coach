export interface SocMajorGroupMeta {
  name: string;
  englishName: string;
}

/**
 * Official 23 O*NET-SOC 2018 / 29.1 Major Groups (bilingual Vietnamese & English SSOT).
 */
export const SOC_MAJOR_GROUPS_META: Record<string, SocMajorGroupMeta> = {
  '11': {
    name: 'Quản lý & Điều hành',
    englishName: 'Management Occupations',
  },
  '13': {
    name: 'Kinh doanh & Tài chính',
    englishName: 'Business and Financial Operations Occupations',
  },
  '15': {
    name: 'Máy tính & Toán học',
    englishName: 'Computer and Mathematical Occupations',
  },
  '17': {
    name: 'Kiến trúc & Kỹ thuật',
    englishName: 'Architecture and Engineering Occupations',
  },
  '19': {
    name: 'Khoa học Đời sống, Vật lý & Xã hội',
    englishName: 'Life, Physical, and Social Science Occupations',
  },
  '21': {
    name: 'Dịch vụ Cộng đồng & Xã hội',
    englishName: 'Community and Social Service Occupations',
  },
  '23': {
    name: 'Pháp lý',
    englishName: 'Legal Occupations',
  },
  '25': {
    name: 'Giáo dục, Đào tạo & Thư viện',
    englishName: 'Educational Instruction and Library Occupations',
  },
  '27': {
    name: 'Nghệ thuật, Thiết kế, Giải trí & Truyền thông',
    englishName: 'Arts, Design, Entertainment, Sports, and Media Occupations',
  },
  '29': {
    name: 'Y tế & Chăm sóc Sức khỏe',
    englishName: 'Healthcare Practitioners and Technical Occupations',
  },
  '31': {
    name: 'Hỗ trợ Y tế',
    englishName: 'Healthcare Support Occupations',
  },
  '33': {
    name: 'Dịch vụ Bảo vệ & An ninh',
    englishName: 'Protective Service Occupations',
  },
  '35': {
    name: 'Ẩm thực & Phục vụ Thực phẩm',
    englishName: 'Food Preparation and Serving Related Occupations',
  },
  '37': {
    name: 'Bảo trì Tòa nhà & Cảnh quan',
    englishName: 'Building and Grounds Cleaning and Maintenance Occupations',
  },
  '39': {
    name: 'Chăm sóc Cá nhân & Dịch vụ',
    englishName: 'Personal Care and Service Occupations',
  },
  '41': {
    name: 'Bán hàng & Kinh doanh',
    englishName: 'Sales and Related Occupations',
  },
  '43': {
    name: 'Văn phòng & Hỗ trợ Hành chính',
    englishName: 'Office and Administrative Support Occupations',
  },
  '45': {
    name: 'Nông nghiệp, Thủy sản & Lâm nghiệp',
    englishName: 'Farming, Fishing, and Forestry Occupations',
  },
  '47': {
    name: 'Xây dựng & Khai thác',
    englishName: 'Construction and Extraction Occupations',
  },
  '49': {
    name: 'Lắp đặt, Bảo dưỡng & Sửa chữa',
    englishName: 'Installation, Maintenance, and Repair Occupations',
  },
  '51': {
    name: 'Sản xuất & Chế tạo',
    englishName: 'Production Occupations',
  },
  '53': {
    name: 'Vận tải & Lưu chuyển Hàng hóa',
    englishName: 'Transportation and Material Moving Occupations',
  },
  '55': {
    name: 'Quân sự Đặc thù',
    englishName: 'Military Specific Occupations',
  },
};

export function getSocMajorGroupMeta(code: string): SocMajorGroupMeta {
  const cleanCode = code.trim();
  return (
    SOC_MAJOR_GROUPS_META[cleanCode] ?? {
      name: `Nhóm ${cleanCode}`,
      englishName: `Major Group ${cleanCode}`,
    }
  );
}
