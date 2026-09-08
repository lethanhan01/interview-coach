/**
 * 23 Major Groups SOC (Standard Occupational Classification)
 * Bao gồm tên tiếng Việt chuẩn hóa và tên tiếng Anh chuẩn của Bộ Lao động Hoa Kỳ.
 */
export const SOC_MAJOR_GROUPS: Record<
  string,
  { name: string; englishName: string }
> = {
  '11': { name: 'Quản lý', englishName: 'Management Occupations' },
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
    name: 'Khoa học Tự nhiên & Xã hội',
    englishName: 'Life, Physical, and Social Science Occupations',
  },
  '21': {
    name: 'Dịch vụ Cộng đồng & Xã hội',
    englishName: 'Community and Social Service Occupations',
  },
  '23': { name: 'Pháp luật', englishName: 'Legal Occupations' },
  '25': {
    name: 'Giáo dục & Thư viện',
    englishName: 'Educational Instruction and Library Occupations',
  },
  '27': {
    name: 'Nghệ thuật, Thiết kế & Truyền thông',
    englishName: 'Arts, Design, Entertainment, Sports, and Media Occupations',
  },
  '29': {
    name: 'Y tế & Kỹ thuật Y khoa',
    englishName: 'Healthcare Practitioners and Technical Occupations',
  },
  '31': { name: 'Hỗ trợ Y tế', englishName: 'Healthcare Support Occupations' },
  '33': {
    name: 'Dịch vụ Bảo vệ',
    englishName: 'Protective Service Occupations',
  },
  '35': {
    name: 'Ẩm thực & Phục vụ Ăn uống',
    englishName: 'Food Preparation and Serving Related Occupations',
  },
  '37': {
    name: 'Vệ sinh & Bảo trì Tòa nhà',
    englishName: 'Building and Grounds Cleaning and Maintenance Occupations',
  },
  '39': {
    name: 'Chăm sóc Cá nhân & Dịch vụ',
    englishName: 'Personal Care and Service Occupations',
  },
  '41': {
    name: 'Bán hàng & Dịch vụ Liên quan',
    englishName: 'Sales and Related Occupations',
  },
  '43': {
    name: 'Văn phòng & Hỗ trợ Hành chính',
    englishName: 'Office and Administrative Support Occupations',
  },
  '45': {
    name: 'Nông nghiệp, Lâm nghiệp & Thủy sản',
    englishName: 'Farming, Fishing, and Forestry Occupations',
  },
  '47': {
    name: 'Xây dựng & Khai khoáng',
    englishName: 'Construction and Extraction Occupations',
  },
  '49': {
    name: 'Lắp ráp, Bảo trì & Sửa chữa',
    englishName: 'Installation, Maintenance, and Repair Occupations',
  },
  '51': { name: 'Sản xuất', englishName: 'Production Occupations' },
  '53': {
    name: 'Giao thông Vận tải & Xếp dỡ',
    englishName: 'Transportation and Material Moving Occupations',
  },
  '55': {
    name: 'Quân đội',
    englishName: 'Military Specific Occupations',
  },
};
