/**
 * Comprehensive Mock Data Warehouse for SFIA 9 Knowledge Browser
 * Strictly aligned with SFIA 9 Foundation standard
 */

import {
  SfiaCategory,
  SfiaSubcategory,
  SfiaSkillSummary,
  SfiaSkillDetail,
  SfiaLevelResponsibility,
  SfiaGenericAttribute,
  SfiaCoverageStats,
  SfiaMatrixCellData,
} from './types'

export const MOCK_SFIA_CATEGORIES: SfiaCategory[] = [
  {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    nameVi: 'Chiến lược & Kiến trúc',
    description: 'Bao gồm các hoạt động hoạch định chiến lược công nghệ, kiến trúc doanh nghiệp, quản trị CNTT, quản lý danh mục đầu tư và bảo mật thông tin cấp cao.',
    displayOrder: 1,
    skillCount: 24,
  },
  {
    code: 'CHG_TRANS',
    name: 'Change and transformation',
    nameVi: 'Thay đổi & Chuyển đổi',
    description: 'Tập trung vào quản lý sự thay đổi tổ chức, phân tích nghiệp vụ, quản lý chương trình dự án và chuyển đổi số quy trình kinh doanh.',
    displayOrder: 2,
    skillCount: 18,
  },
  {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    nameVi: 'Phát triển & Triển khai',
    description: 'Thiết kế, xây dựng, kiểm thử, tích hợp các hệ thống phần mềm, phần cứng, cơ sở dữ liệu và giải pháp kỹ thuật số.',
    displayOrder: 3,
    skillCount: 42,
  },
  {
    code: 'DELIV_OP',
    name: 'Delivery and operation',
    nameVi: 'Vận hành & Cung cấp dịch vụ',
    description: 'Cung cấp, hỗ trợ, vận hành hạ tầng công nghệ thông tin, quản lý dịch vụ ITIL/ITSM và bảo đảm tính sẵn sàng liên tục của hệ thống.',
    displayOrder: 4,
    skillCount: 28,
  },
  {
    code: 'PPL_SKILL',
    name: 'People and skills',
    nameVi: 'Con người & Kỹ năng',
    description: 'Quản lý nhân sự công nghệ, đào tạo và phát triển năng lực, định hình văn hóa tổ chức và phân bổ nguồn lực kỹ thuật.',
    displayOrder: 5,
    skillCount: 19,
  },
  {
    code: 'REL_ENG',
    name: 'Relationships and engagement',
    nameVi: 'Quan hệ & Tương tác đối tác',
    description: 'Quản lý quan hệ khách hàng nội bộ/bên ngoài, quản trị nhà cung cấp, mua sắm giải pháp công nghệ và bán hàng kỹ thuật.',
    displayOrder: 6,
    skillCount: 16,
  },
]

export const MOCK_SFIA_SUBCATEGORIES: SfiaSubcategory[] = [
  // STRAT_ARCH
  { code: 'STRAT_PLAN', categoryCode: 'STRAT_ARCH', name: 'Strategy and planning', nameVi: 'Chiến lược & Quy hoạch', description: 'Định hình chiến lược công nghệ thông tin và chuyển đổi số dài hạn', skillCount: 8 },
  { code: 'SEC_PRIV', categoryCode: 'STRAT_ARCH', name: 'Security and privacy', nameVi: 'An ninh mạng & Quyền riêng tư', description: 'Quản trị rủi ro an ninh mạng và bảo vệ dữ liệu', skillCount: 6 },
  { code: 'GOVN_RISK', categoryCode: 'STRAT_ARCH', name: 'Governance, risk and compliance', nameVi: 'Quản trị, Rủi ro & Tuân thủ', description: 'Kiểm soát tuân thủ tiêu chuẩn và kiểm toán công nghệ', skillCount: 5 },
  { code: 'INNOV_RES', categoryCode: 'STRAT_ARCH', name: 'Innovation and research', nameVi: 'Đổi mới sáng tạo & Nghiên cứu', description: 'Nghiên cứu công nghệ mới nổi và thử nghiệm giải pháp', skillCount: 5 },

  // CHG_TRANS
  { code: 'BUS_CHG', categoryCode: 'CHG_TRANS', name: 'Business change management', nameVi: 'Quản trị thay đổi doanh nghiệp', description: 'Quản trị sự thay đổi văn hóa và quy trình khi áp dụng công nghệ mới', skillCount: 6 },
  { code: 'PROJ_PROG', categoryCode: 'CHG_TRANS', name: 'Programme and project management', nameVi: 'Quản lý dự án & Chương trình', description: 'Điều phối tiến độ, ngân sách và phạm vi dự án công nghệ', skillCount: 7 },
  { code: 'BUS_ANA', categoryCode: 'CHG_TRANS', name: 'Business analysis', nameVi: 'Phân tích nghiệp vụ', description: 'Khảo sát và đặc tả yêu cầu giải pháp kinh doanh', skillCount: 5 },

  // DEV_IMPL
  { code: 'SYS_DEV', categoryCode: 'DEV_IMPL', name: 'Systems development', nameVi: 'Phát triển hệ thống phần mềm', description: 'Thiết kế kiến trúc, lập trình, cấu trúc dữ liệu và kiểm thử', skillCount: 16 },
  { code: 'DATA_ANA', categoryCode: 'DEV_IMPL', name: 'Data and analytics', nameVi: 'Dữ liệu & Phân tích', description: 'Kỹ thuật dữ liệu, khoa học dữ liệu và trực quan hóa thông tin', skillCount: 10 },
  { code: 'UX_DESIGN', categoryCode: 'DEV_IMPL', name: 'User-centred design', nameVi: 'Thiết kế lấy người dùng làm trung tâm', description: 'Nghiên cứu trải nghiệm người dùng UI/UX và thiết kế tương tác', skillCount: 8 },
  { code: 'SYS_INT', categoryCode: 'DEV_IMPL', name: 'Installation and integration', nameVi: 'Cài đặt & Tích hợp hệ thống', description: 'Tích hợp phần mềm, kiểm thử liên thông và triển khai giải pháp', skillCount: 8 },

  // DELIV_OP
  { code: 'IT_INFRA', categoryCode: 'DELIV_OP', name: 'Technology infrastructure', nameVi: 'Hạ tầng công nghệ & Cloud', description: 'Vận hành máy chủ, mạng, đám mây và cơ sở dữ liệu', skillCount: 9 },
  { code: 'SVC_MGMT', categoryCode: 'DELIV_OP', name: 'Service management', nameVi: 'Quản trị dịch vụ CNTT (ITSM)', description: 'Xử lý sự cố, yêu cầu dịch vụ và đảm bảo SLA', skillCount: 8 },
  { code: 'SEC_OPS', categoryCode: 'DELIV_OP', name: 'Security operations', nameVi: 'Vận hành an ninh mạng (SOC)', description: 'Giám sát an ninh, ứng phó sự cố và quản lý lỗ hổng', skillCount: 6 },
  { code: 'CONT_MGMT', categoryCode: 'DELIV_OP', name: 'Content and publishing', nameVi: 'Quản lý nội dung & Xuất bản', description: 'Quản lý tài liệu kỹ thuật và nền tảng số', skillCount: 5 },

  // PPL_SKILL
  { code: 'PPL_MGMT', categoryCode: 'PPL_SKILL', name: 'People management', nameVi: 'Quản lý nhân sự & Đội ngũ', description: 'Lãnh đạo đội ngũ kỹ thuật, phân công và đánh giá hiệu suất', skillCount: 7 },
  { code: 'SKILL_DEV', categoryCode: 'PPL_SKILL', name: 'Skills and capabilities', nameVi: 'Phát triển năng lực & Đào tạo', description: 'Đào tạo kỹ năng số và huấn luyện nghiệp vụ', skillCount: 6 },
  { code: 'TALENT_ACQ', categoryCode: 'PPL_SKILL', name: 'Talent management', nameVi: 'Thu hút & Giữ chân nhân tài', description: 'Tuyển dụng và quy hoạch nguồn nhân lực công nghệ', skillCount: 6 },

  // REL_ENG
  { code: 'STAKE_ENG', categoryCode: 'REL_ENG', name: 'Stakeholder engagement', nameVi: 'Tương tác các bên liên quan', description: 'Giao tiếp và quản lý kỳ vọng đối tác nội bộ/bên ngoài', skillCount: 6 },
  { code: 'SOURC_SUPP', categoryCode: 'REL_ENG', name: 'Sourcing and supplier management', nameVi: 'Mua sắm & Quản lý nhà cung cấp', description: 'Đấu thầu, hợp đồng và đánh giá nhà cung ứng giải pháp', skillCount: 5 },
  { code: 'SALES_MKT', categoryCode: 'REL_ENG', name: 'Sales and marketing', nameVi: 'Bán hàng giải pháp & Tiếp thị', description: 'Tư vấn kỹ thuật tiền bán hàng và phát triển thị trường số', skillCount: 5 },
]

export const MOCK_SFIA_RESPONSIBILITY_LEVELS: SfiaLevelResponsibility[] = [
  {
    levelId: 1,
    name: 'Follow',
    nameVi: 'Tuân thủ & Thực thi cơ bản',
    essence: 'Làm việc dưới sự giám sát trực tiếp, thực hiện các công việc có cấu trúc rõ ràng và các quy trình chuẩn đã định sẵn.',
    description: 'Thực hiện các nhiệm vụ thường nhật theo hướng dẫn cụ thể. Yêu cầu hỗ trợ khi gặp tình huống bất thường. Tác động chủ yếu giới hạn trong công việc cá nhân.',
  },
  {
    levelId: 2,
    name: 'Assist',
    nameVi: 'Hỗ trợ & Đồng hành',
    essence: 'Hoạt động độc lập trong các tác vụ thông thường nhưng vẫn có sự hướng dẫn định kỳ, hỗ trợ đồng nghiệp trong các nhiệm vụ phức tạp hơn.',
    description: 'Hiểu và áp dụng các quy trình tiêu chuẩn trong bối cảnh quen thuộc. Có khả năng tự giải quyết các vấn đề đơn giản và đóng góp vào mục tiêu chung của nhóm.',
  },
  {
    levelId: 3,
    name: 'Apply',
    nameVi: 'Áp dụng độc lập',
    essence: 'Tự chủ trong công việc chuyên môn, áp dụng linh hoạt kiến thức kỹ thuật và phương pháp luận để giải quyết các vấn đề đa dạng.',
    description: 'Làm việc không cần giám sát liên tục, chịu trách nhiệm về chất lượng sản phẩm đầu ra cá nhân. Tương tác hiệu quả với các bên liên quan và hướng dẫn nhân sự cấp dưới.',
  },
  {
    levelId: 4,
    name: 'Enable',
    nameVi: 'Chủ động & Tạo điều kiện',
    essence: 'Thực hiện công việc phức tạp đòi hỏi chuyên môn sâu, hướng dẫn và tạo điều kiện cho người khác hoàn thành mục tiêu.',
    description: 'Chịu trách nhiệm về mảng công việc lớn hoặc nhóm kỹ thuật nhỏ. Phân bổ công việc, xem xét chất lượng và đề xuất các cải tiến quy trình công nghệ.',
  },
  {
    levelId: 5,
    name: 'Ensure / Advise',
    nameVi: 'Đảm bảo & Cố vấn chuyên môn',
    essence: 'Định hình phương hướng kỹ thuật cho các dự án quan trọng, cố vấn chuyên môn cấp cao và đảm bảo tuân thủ tiêu chuẩn chất lượng tổ chức.',
    description: 'Đưa ra các quyết định kiến trúc và kỹ thuật có tầm ảnh hưởng lớn. Đại diện tổ chức làm việc với đối tác và cố vấn cho ban lãnh đạo về giải pháp công nghệ.',
  },
  {
    levelId: 6,
    name: 'Initiate / Influence',
    nameVi: 'Khởi xướng & Gây ảnh hưởng',
    essence: 'Khởi xướng các sáng kiến chuyển đổi công nghệ quy mô lớn, gây ảnh hưởng đến định hướng phát triển của toàn khối hoặc doanh nghiệp.',
    description: 'Thiết lập các tiêu chuẩn kỹ thuật toàn diện, dẫn dắt các chương trình chuyển đổi chiến lược và chịu trách nhiệm cao nhất về kết quả công nghệ.',
  },
  {
    levelId: 7,
    name: 'Set strategy / Inspire',
    nameVi: 'Định hình chiến lược & Truyền cảm hứng',
    essence: 'Xác lập tầm nhìn chiến lược công nghệ tối cao, định vị năng lực cạnh tranh và truyền cảm hứng đổi mới cho toàn bộ tổ chức.',
    description: 'Quyết định chiến lược công nghệ cấp tập đoàn, kiến tạo văn hóa đổi mới sáng tạo và chịu trách nhiệm toàn diện trước Hội đồng quản trị.',
  },
]

export const MOCK_SFIA_GENERIC_ATTRIBUTES: SfiaGenericAttribute[] = [
  {
    code: 'AUTONOMY',
    name: 'Autonomy',
    nameVi: 'Mức độ tự chủ',
    description: 'Mức độ độc lập khi thực hiện công việc, phạm vi quyết định và mức độ cần giám sát.',
    levels: {
      1: 'Hoạt động dưới sự chỉ đạo trực tiếp. Tuân thủ nghiêm ngặt các hướng dẫn và quy trình có sẵn.',
      2: 'Hoạt động dưới sự giám sát định kỳ. Tự chủ trong các tác vụ quen thuộc và xin ý kiến khi có ngoại lệ.',
      3: 'Làm việc độc lập trong phạm vi nhiệm vụ được giao. Tự lập kế hoạch và ưu tiên công việc của bản thân.',
      4: 'Tự chủ hoàn toàn trong chuyên môn. Có quyền quyết định kỹ thuật trong phạm vi dự án hoặc nhóm.',
      5: 'Chỉ đạo và phân quyền cho người khác. Chịu trách nhiệm toàn diện về kết quả kỹ thuật của bộ phận.',
      6: 'Có quyền quyết định chiến lược cấp khối. Đặt ra các nguyên tắc hoạt động và ủy quyền quản trị.',
      7: 'Toàn quyền quyết định chiến lược công nghệ của tổ chức. Định hình cơ chế quản trị cao nhất.',
    },
  },
  {
    code: 'INFLUENCE',
    name: 'Influence',
    nameVi: 'Mức độ ảnh hưởng',
    description: 'Tác động của cá nhân đến đồng nghiệp, các bộ phận trong tổ chức, khách hàng và đối tác.',
    levels: {
      1: 'Tương tác chủ yếu với người hướng dẫn trực tiếp và đồng nghiệp cùng nhóm cơ sở.',
      2: 'Tương tác thường xuyên với nhóm làm việc và người dùng cuối trong các yêu cầu dịch vụ cụ thể.',
      3: 'Ảnh hưởng đến chất lượng sản phẩm của nhóm. Tương tác hiệu quả với khách hàng và nhà cung ứng.',
      4: 'Ảnh hưởng đến quyết định kỹ thuật của nhiều nhóm. Đóng vai trò cố vấn chuyên môn cho dự án.',
      5: 'Ảnh hưởng sâu rộng đến chính sách kỹ thuật của tổ chức và quan hệ chiến lược với đối tác lớn.',
      6: 'Định hình chiến lược công nghệ và văn hóa doanh nghiệp. Đại diện tổ chức trên các diễn đàn quốc tế.',
      7: 'Dẫn dắt xu thế ngành công nghệ, định hình chuẩn mực và tạo ảnh hưởng tầm vĩ mô trong hệ sinh thái.',
    },
  },
  {
    code: 'COMPLEXITY',
    name: 'Complexity',
    nameVi: 'Độ phức tạp của vấn đề',
    description: 'Tính chất và độ phi cấu trúc của các bài toán kỹ thuật và nghiệp vụ cần xử lý.',
    levels: {
      1: 'Thực hiện các tác vụ đơn giản, có cấu trúc lặp đi lặp lại và quy trình xử lý định sẵn.',
      2: 'Xử lý các bài toán tiêu chuẩn, áp dụng các giải pháp đã được chứng minh trong môi trường quen thuộc.',
      3: 'Giải quyết các vấn đề kỹ thuật phi cấu trúc, đòi hỏi phân tích logic và kết hợp nhiều công nghệ.',
      4: 'Xử lý các bài toán kỹ thuật phức tạp, đa chiều và có nhiều yếu tố ràng buộc chưa rõ ràng.',
      5: 'Giải quyết các thách thức kiến trúc và nghiệp vụ quy mô lớn với mức độ rủi ro và tác động cao.',
      6: 'Xử lý các vấn đề mang tính đột phá chiến lược trong điều kiện biến động và bất định cao.',
      7: 'Kiến tạo giải pháp cho các thách thức cốt lõi của doanh nghiệp và ngành công nghiệp số.',
    },
  },
  {
    code: 'BUSINESS_SKILLS',
    name: 'Business skills',
    nameVi: 'Kỹ năng kinh doanh & Đạo đức số',
    description: 'Khả năng giao tiếp, cộng tác, quản lý thời gian, tư duy thương mại và đạo đức số.',
    levels: {
      1: 'Giao tiếp rõ ràng, tiếp thu tốt phản hồi và tuân thủ các quy tắc an toàn bảo mật cơ bản.',
      2: 'Trình bày giải pháp mạch lạc, cộng tác nhóm hiệu quả và nhận thức được tác động kinh doanh.',
      3: 'Giao tiếp chuyên nghiệp với các bên liên quan, quản lý thời gian tốt và chủ động nâng cao năng lực.',
      4: 'Thuyết phục và đàm phán giải pháp kỹ thuật, hướng dẫn nhân sự và thúc đẩy cải tiến liên tục.',
      5: 'Tư duy chiến lược kinh doanh kết hợp công nghệ, quản trị rủi ro và xây dựng năng lực tổ chức.',
      6: 'Đàm phán thương mại cấp cao, kiến tạo liên minh chiến lược và định hình giá trị văn hóa số.',
      7: 'Tầm nhìn kinh doanh xuất chúng, truyền cảm hứng đổi mới và dẫn dắt tổ chức thích ứng toàn cầu.',
    },
  },
  {
    code: 'KNOWLEDGE',
    name: 'Knowledge',
    nameVi: 'Mức độ tiếp thu & Ứng dụng kiến thức',
    description: 'Phạm vi, chiều sâu và khả năng phát triển tri thức chuyên ngành công nghệ số.',
    levels: {
      1: 'Nắm vững kiến thức nền tảng và các thao tác kỹ thuật cơ bản của vị trí công việc.',
      2: 'Hiểu rõ các công cụ, ngôn ngữ và quy trình áp dụng trong môi trường làm việc thực tế.',
      3: 'Có kiến thức sâu sắc về chuyên môn kỹ thuật và hiểu biết rộng về các công nghệ liên quan.',
      4: 'Chuyên gia sâu về lĩnh vực kỹ thuật, nắm bắt các xu hướng công nghệ mới và phương pháp tiên tiến.',
      5: 'Kiến thức chuyên sâu toàn diện, có khả năng tích hợp đa lĩnh vực và định hướng chuẩn kỹ thuật.',
      6: 'Tri thức chuyên gia hàng đầu, làm chủ các công nghệ tiên phong và chuyển hóa thành giá trị doanh nghiệp.',
      7: 'Tri thức đỉnh cao mang tầm nhìn chiến lược, định hình kiến thức và xu thế công nghệ tương lai.',
    },
  },
]

export const MOCK_SFIA_SKILL_SUMMARIES: SfiaSkillSummary[] = [
  // DEV_IMPL / SYS_DEV
  { code: 'PROG', name: 'Programming/software development', categoryCode: 'DEV_IMPL', subcategoryCode: 'SYS_DEV', minLevel: 2, maxLevel: 6, questionCount: 38, onetCount: 14 },
  { code: 'SWDN', name: 'Software design', categoryCode: 'DEV_IMPL', subcategoryCode: 'SYS_DEV', minLevel: 3, maxLevel: 6, questionCount: 26, onetCount: 11 },
  { code: 'DBDS', name: 'Database design', categoryCode: 'DEV_IMPL', subcategoryCode: 'SYS_DEV', minLevel: 2, maxLevel: 6, questionCount: 21, onetCount: 9 },
  { code: 'TEST', name: 'Testing', categoryCode: 'DEV_IMPL', subcategoryCode: 'SYS_DEV', minLevel: 1, maxLevel: 6, questionCount: 32, onetCount: 12 },
  { code: 'METL', name: 'Methods and tools', categoryCode: 'DEV_IMPL', subcategoryCode: 'SYS_DEV', minLevel: 4, maxLevel: 7, questionCount: 14, onetCount: 6 },
  { code: 'DLMG', name: 'Systems development management', categoryCode: 'DEV_IMPL', subcategoryCode: 'SYS_DEV', minLevel: 5, maxLevel: 7, questionCount: 9, onetCount: 5 },

  // DEV_IMPL / DATA_ANA
  { code: 'DATA', name: 'Data engineering', categoryCode: 'DEV_IMPL', subcategoryCode: 'DATA_ANA', minLevel: 2, maxLevel: 6, questionCount: 19, onetCount: 8 },
  { code: 'BADA', name: 'Data science and analytics', categoryCode: 'DEV_IMPL', subcategoryCode: 'DATA_ANA', minLevel: 2, maxLevel: 7, questionCount: 16, onetCount: 7 },
  { code: 'VISL', name: 'Data visualisation', categoryCode: 'DEV_IMPL', subcategoryCode: 'DATA_ANA', minLevel: 2, maxLevel: 5, questionCount: 8, onetCount: 4 },

  // STRAT_ARCH / STRAT_PLAN
  { code: 'ARCH', name: 'Solution architecture', categoryCode: 'STRAT_ARCH', subcategoryCode: 'STRAT_PLAN', minLevel: 5, maxLevel: 7, questionCount: 18, onetCount: 8 },
  { code: 'GOVN', name: 'Governance', categoryCode: 'STRAT_ARCH', subcategoryCode: 'STRAT_PLAN', minLevel: 5, maxLevel: 7, questionCount: 12, onetCount: 5 },
  { code: 'STPL', name: 'Strategic planning', categoryCode: 'STRAT_ARCH', subcategoryCode: 'STRAT_PLAN', minLevel: 5, maxLevel: 7, questionCount: 10, onetCount: 4 },

  // STRAT_ARCH / SEC_PRIV
  { code: 'SCTY', name: 'Information security', categoryCode: 'STRAT_ARCH', subcategoryCode: 'SEC_PRIV', minLevel: 3, maxLevel: 7, questionCount: 22, onetCount: 10 },
  { code: 'INSU', name: 'Information assurance', categoryCode: 'STRAT_ARCH', subcategoryCode: 'SEC_PRIV', minLevel: 4, maxLevel: 7, questionCount: 7, onetCount: 3 },

  // CHG_TRANS / PROJ_PROG
  { code: 'PRMG', name: 'Project management', categoryCode: 'CHG_TRANS', subcategoryCode: 'PROJ_PROG', minLevel: 4, maxLevel: 7, questionCount: 24, onetCount: 12 },
  { code: 'PGMG', name: 'Programme management', categoryCode: 'CHG_TRANS', subcategoryCode: 'PROJ_PROG', minLevel: 6, maxLevel: 7, questionCount: 6, onetCount: 3 },

  // CHG_TRANS / BUS_ANA
  { code: 'BUAN', name: 'Business analysis', categoryCode: 'CHG_TRANS', subcategoryCode: 'BUS_ANA', minLevel: 3, maxLevel: 6, questionCount: 20, onetCount: 9 },

  // DELIV_OP / IT_INFRA
  { code: 'ITOP', name: 'IT infrastructure operations', categoryCode: 'DELIV_OP', subcategoryCode: 'IT_INFRA', minLevel: 1, maxLevel: 5, questionCount: 17, onetCount: 8 },
  { code: 'SYSP', name: 'Systems installation and removal', categoryCode: 'DELIV_OP', subcategoryCode: 'IT_INFRA', minLevel: 1, maxLevel: 4, questionCount: 5, onetCount: 3 },
  { code: 'NTAS', name: 'Network support', categoryCode: 'DELIV_OP', subcategoryCode: 'IT_INFRA', minLevel: 2, maxLevel: 5, questionCount: 11, onetCount: 6 },

  // DELIV_OP / SVC_MGMT
  { code: 'USUP', name: 'Incident management and service desk', categoryCode: 'DELIV_OP', subcategoryCode: 'SVC_MGMT', minLevel: 1, maxLevel: 5, questionCount: 13, onetCount: 7 },
  { code: 'PBMG', name: 'Problem management', categoryCode: 'DELIV_OP', subcategoryCode: 'SVC_MGMT', minLevel: 2, maxLevel: 5, questionCount: 8, onetCount: 4 },

  // PPL_SKILL / PPL_MGMT
  { code: 'PPLM', name: 'People management', categoryCode: 'PPL_SKILL', subcategoryCode: 'PPL_MGMT', minLevel: 2, maxLevel: 7, questionCount: 22, onetCount: 15 },
  { code: 'PEMG', name: 'Performance management', categoryCode: 'PPL_SKILL', subcategoryCode: 'PPL_MGMT', minLevel: 4, maxLevel: 6, questionCount: 9, onetCount: 6 },

  // REL_ENG / STAKE_ENG
  { code: 'RLMT', name: 'Stakeholder relationship management', categoryCode: 'REL_ENG', subcategoryCode: 'STAKE_ENG', minLevel: 4, maxLevel: 7, questionCount: 15, onetCount: 8 },
  { code: 'CSMG', name: 'Customer service management', categoryCode: 'REL_ENG', subcategoryCode: 'STAKE_ENG', minLevel: 3, maxLevel: 6, questionCount: 10, onetCount: 5 },
]

export const MOCK_SFIA_SKILL_DETAILS: Record<string, SfiaSkillDetail> = {
  PROG: {
    code: 'PROG',
    name: 'Programming/software development',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYS_DEV',
    minLevel: 2,
    maxLevel: 6,
    questionCount: 38,
    onetCount: 14,
    overallDescription: 'Lập trình và phát triển phần mềm bao gồm việc thiết kế, viết mã nguồn, kiểm thử đơn vị, gỡ lỗi và tài liệu hóa các chương trình phần mềm máy tính theo các tiêu chuẩn kỹ thuật đã thống nhất.',
    guidanceNotes: 'Kỹ năng này bao gồm mọi hình thức phát triển phần mềm (Web, Mobile, Cloud, Embedded, AI pipelines). Tiêu chuẩn đánh giá chú trọng tính bảo mật, hiệu năng, khả năng kiểm thử tự động và tuân thủ Clean Code / SOLID principles.',
    skillLevels: [
      {
        skillCode: 'PROG',
        levelId: 2,
        essence: 'Lập trình các module đơn giản theo hướng dẫn chi tiết.',
        description: 'Thiết kế, viết mã và kiểm thử các chương trình hoặc đoạn mã đơn giản theo các đặc tả kỹ thuật chi tiết. Thực hiện các bài kiểm thử đơn vị cơ bản và sửa lỗi dưới sự giám sát.',
      },
      {
        skillCode: 'PROG',
        levelId: 3,
        essence: 'Phát triển phần mềm độc lập với các module phức tạp vừa phải.',
        description: 'Thiết kế, lập trình, kiểm thử và tài liệu hóa các chương trình phức tạp vừa phải từ các đặc tả được cung cấp. Áp dụng các tiêu chuẩn mã nguồn, kiểm thử tự động và thực hiện review mã nguồn của đồng nghiệp.',
      },
      {
        skillCode: 'PROG',
        levelId: 4,
        essence: 'Thiết kế và triển khai các thành phần phần mềm phức tạp, hướng dẫn đội ngũ.',
        description: 'Xây dựng các thành phần phần mềm phức tạp với yêu cầu cao về hiệu năng và bảo mật. Đóng góp vào việc lựa chọn công nghệ, công cụ phát triển và hướng dẫn lập trình viên cấp dưới.',
      },
      {
        skillCode: 'PROG',
        levelId: 5,
        essence: 'Định hình tiêu chuẩn kỹ thuật lập trình và kiến trúc module toàn dự án.',
        description: 'Thiết lập các tiêu chuẩn lập trình, quy trình tích hợp liên tục (CI/CD) và chiến lược kiểm thử tự động. Giải quyết các thách thức kỹ thuật phức tạp nhất và cố vấn kiến trúc phần mềm.',
      },
      {
        skillCode: 'PROG',
        levelId: 6,
        essence: 'Định hướng chiến lược công nghệ phần mềm toàn doanh nghiệp.',
        description: 'Lãnh đạo việc định hình chiến lược phát triển phần mềm, framework công nghệ và tiêu chuẩn kỹ thuật số trong toàn tổ chức. Đánh giá và áp dụng các công nghệ lập trình tiên phong.',
      },
    ],
    onetMappings: [
      { socCode: '15-1252.00', occupationTitle: 'Software Developers', targetLevel: 4, weight: 2.0, isCore: true },
      { socCode: '15-1251.00', occupationTitle: 'Computer Programmers', targetLevel: 3, weight: 1.8, isCore: true },
      { socCode: '15-1254.00', occupationTitle: 'Web Developers', targetLevel: 3, weight: 1.5, isCore: true },
      { socCode: '15-1253.00', occupationTitle: 'Software Quality Assurance Analysts', targetLevel: 3, weight: 1.2, isCore: false },
      { socCode: '15-1255.00', occupationTitle: 'Web and Digital Interface Designers', targetLevel: 2, weight: 1.0, isCore: false },
    ],
    questionBankItems: [
      { id: 'Q-PROG-01', questionText: 'Hãy giải thích cách bạn xử lý Memory Leak trong ứng dụng Node.js/React khi scale tải cao?', type: 'TECHNICAL', difficulty: 'HARD', targetSfiaLevel: 4 },
      { id: 'Q-PROG-02', questionText: 'Trình bày sự khác biệt giữa Concurrency và Parallelism và cách bạn áp dụng trong thiết kế microservices?', type: 'TECHNICAL', difficulty: 'MEDIUM', targetSfiaLevel: 3 },
      { id: 'Q-PROG-03', questionText: 'Kể lại một lần bạn phải giải quyết xung đột mã nguồn nghiêm trọng trong team và bài học rút ra?', type: 'BEHAVIORAL', difficulty: 'MEDIUM', targetSfiaLevel: 3 },
      { id: 'Q-PROG-04', questionText: 'Làm thế nào để xây dựng chiến lược kiểm thử Unit Test & Integration Test đạt độ bao phủ trên 85%?', type: 'TECHNICAL', difficulty: 'HARD', targetSfiaLevel: 5 },
    ],
  },
  SWDN: {
    code: 'SWDN',
    name: 'Software design',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYS_DEV',
    minLevel: 3,
    maxLevel: 6,
    questionCount: 26,
    onetCount: 11,
    overallDescription: 'Thiết kế phần mềm bao gồm việc xác định cấu trúc, thành phần, giao diện và các đặc tính của một hệ thống phần mềm nhằm đáp ứng các yêu cầu chức năng và phi chức năng.',
    guidanceNotes: 'Tập trung vào các mẫu thiết kế (Design Patterns), kiến trúc hướng dịch vụ (SOA/Microservices), thiết kế API chuẩn RESTful/GraphQL và tối ưu hóa tài nguyên.',
    skillLevels: [
      {
        skillCode: 'SWDN',
        levelId: 3,
        essence: 'Thiết kế các module phần mềm tiêu chuẩn từ đặc tả kiến trúc.',
        description: 'Chuyển hóa các yêu cầu chức năng thành thiết kế chi tiết cho từng thành phần phần mềm. Lựa chọn các thuật toán và cấu trúc dữ liệu phù hợp.',
      },
      {
        skillCode: 'SWDN',
        levelId: 4,
        essence: 'Thiết kế các phân hệ phức tạp và định nghĩa giao diện API.',
        description: 'Thiết kế các hệ thống phần mềm phức tạp, đảm bảo tính mở rộng, bảo mật và khả năng bảo trì. Xác định giao diện kết nối API và mô hình dữ liệu nội bộ.',
      },
      {
        skillCode: 'SWDN',
        levelId: 5,
        essence: 'Định hình kiến trúc phần mềm tổng thể cho các giải pháp lớn.',
        description: 'Chịu trách nhiệm về thiết kế phần mềm tổng thể cho các hệ thống quy mô lớn. Lựa chọn phong cách kiến trúc (Microservices, Event-driven) và thiết lập nguyên tắc thiết kế.',
      },
      {
        skillCode: 'SWDN',
        levelId: 6,
        essence: 'Lãnh đạo việc định hình chuẩn mực thiết kế phần mềm doanh nghiệp.',
        description: 'Định hình chiến lược thiết kế phần mềm cho toàn tổ chức, bảo đảm sự nhất quán giữa kiến trúc doanh nghiệp và các giải pháp phần mềm cụ thể.',
      },
    ],
    onetMappings: [
      { socCode: '15-1252.00', occupationTitle: 'Software Developers', targetLevel: 4, weight: 1.8, isCore: true },
      { socCode: '15-1299.08', occupationTitle: 'Computer Systems Engineers/Architects', targetLevel: 5, weight: 2.0, isCore: true },
    ],
    questionBankItems: [
      { id: 'Q-SWDN-01', questionText: 'Khi nào bạn chọn Event-Driven Architecture thay vì Synchronous REST APIs?', type: 'TECHNICAL', difficulty: 'HARD', targetSfiaLevel: 5 },
      { id: 'Q-SWDN-02', questionText: 'Hãy phân tích trade-off giữa Monolithic và Microservices trong bối cảnh startup đang mở rộng quy mô?', type: 'TECHNICAL', difficulty: 'MEDIUM', targetSfiaLevel: 4 },
    ],
  },
  DBDS: {
    code: 'DBDS',
    name: 'Database design',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYS_DEV',
    minLevel: 2,
    maxLevel: 6,
    questionCount: 21,
    onetCount: 9,
    overallDescription: 'Đặc tả và thiết kế cơ sở dữ liệu vật lý và logic, bao gồm lược đồ bảng, khóa chính/ngoại, indexes, phân vùng và chiến lược lưu trữ dữ liệu hiệu năng cao.',
    guidanceNotes: 'Bao gồm cơ sở dữ liệu quan hệ (PostgreSQL, MySQL), NoSQL (MongoDB, DynamoDB) và Data Lake/Warehouse.',
    skillLevels: [
      { skillCode: 'DBDS', levelId: 2, essence: 'Phát triển lược đồ bảng cơ bản theo mô hình quan hệ.', description: 'Triển khai các bảng dữ liệu đơn giản và viết câu lệnh DDL theo thiết kế có sẵn.' },
      { skillCode: 'DBDS', levelId: 3, essence: 'Thiết kế mô hình dữ liệu logic và vật lý cho ứng dụng.', description: 'Chuẩn hóa dữ liệu (1NF-3NF), thiết kế khóa, indexes và tối ưu truy vấn SQL.' },
      { skillCode: 'DBDS', levelId: 4, essence: 'Thiết kế cơ sở dữ liệu hiệu năng cao và phân tán.', description: 'Thiết kế kiến trúc lưu trữ dữ liệu phức tạp, phân mảnh (sharding), nhân bản (replication) và caching.' },
      { skillCode: 'DBDS', levelId: 5, essence: 'Định hình chiến lược kiến trúc dữ liệu cấp tổ chức.', description: 'Đưa ra các quyết định kiến trúc dữ liệu quan trọng, bảo mật dữ liệu và chiến lược lưu trữ đám mây.' },
      { skillCode: 'DBDS', levelId: 6, essence: 'Lãnh đạo việc định hình chuẩn dữ liệu doanh nghiệp.', description: 'Xác lập chính sách quản trị dữ liệu, chuẩn hóa mô hình dữ liệu toàn doanh nghiệp.' },
    ],
    onetMappings: [
      { socCode: '15-1242.00', occupationTitle: 'Database Administrators', targetLevel: 4, weight: 2.0, isCore: true },
      { socCode: '15-1243.00', occupationTitle: 'Database Architects', targetLevel: 5, weight: 2.0, isCore: true },
    ],
    questionBankItems: [
      { id: 'Q-DBDS-01', questionText: 'Làm thế nào bạn thiết kế Indexing Strategy cho một bảng PostgreSQL có hơn 50 triệu bản ghi ghi liên tục?', type: 'TECHNICAL', difficulty: 'HARD', targetSfiaLevel: 4 },
    ],
  },
  ARCH: {
    code: 'ARCH',
    name: 'Solution architecture',
    categoryCode: 'STRAT_ARCH',
    subcategoryCode: 'STRAT_PLAN',
    minLevel: 5,
    maxLevel: 7,
    questionCount: 18,
    onetCount: 8,
    overallDescription: 'Phát triển các giải pháp kiến trúc toàn diện kết hợp công nghệ, quy trình và con người để đáp ứng các mục tiêu kinh doanh chiến lược.',
    guidanceNotes: 'Đòi hỏi sự cân bằng giữa yêu cầu kinh doanh, chi phí, rủi ro, bảo mật và khả năng mở rộng công nghệ.',
    skillLevels: [
      { skillCode: 'ARCH', levelId: 5, essence: 'Thiết kế kiến trúc giải pháp cho các dự án quy mô lớn.', description: 'Xác định kiến trúc hệ thống tổng thể, đảm bảo sự phù hợp giữa các thành phần phần mềm, phần cứng và mạng.' },
      { skillCode: 'ARCH', levelId: 6, essence: 'Lãnh đạo kiến trúc giải pháp cho các chương trình chuyển đổi.', description: 'Định hình kiến trúc cho các sáng kiến kinh doanh cốt lõi, quản trị rủi ro công nghệ và thẩm định giải pháp.' },
      { skillCode: 'ARCH', levelId: 7, essence: 'Xác lập tầm nhìn kiến trúc công nghệ toàn diện.', description: 'Định hình tương lai kiến trúc của doanh nghiệp, kiến tạo nền tảng số và dẫn dắt xu thế công nghệ.' },
    ],
    onetMappings: [
      { socCode: '15-1299.08', occupationTitle: 'Computer Systems Engineers/Architects', targetLevel: 6, weight: 2.0, isCore: true },
      { socCode: '11-3021.00', occupationTitle: 'Computer and Information Systems Managers', targetLevel: 6, weight: 1.5, isCore: false },
    ],
    questionBankItems: [
      { id: 'Q-ARCH-01', questionText: 'Trình bày cách bạn xây dựng một Disaster Recovery Architecture đạt RPO < 5 phút và RTO < 15 phút?', type: 'TECHNICAL', difficulty: 'HARD', targetSfiaLevel: 6 },
    ],
  },
}

export const MOCK_SFIA_COVERAGE_STATS: SfiaCoverageStats = {
  totalSkills: 147,
  totalCategories: 6,
  totalSubcategories: 22,
  totalLevels: 7,
  skillsWithQuestions: 112,
  skillsWithOnet: 98,
  blindSpotsCount: 35,
  totalQuestions: 486,
  totalActiveMatrixCells: 672,
  categoryDistribution: [
    { code: 'DEV_IMPL', name: 'Development and implementation', nameVi: 'Phát triển & Triển khai', skillCount: 42, questionCount: 184, mappedOnetCount: 36 },
    { code: 'STRAT_ARCH', name: 'Strategy and architecture', nameVi: 'Chiến lược & Kiến trúc', skillCount: 24, questionCount: 96, mappedOnetCount: 18 },
    { code: 'DELIV_OP', name: 'Delivery and operation', nameVi: 'Vận hành & Cung cấp dịch vụ', skillCount: 28, questionCount: 82, mappedOnetCount: 20 },
    { code: 'CHG_TRANS', name: 'Change and transformation', nameVi: 'Thay đổi & Chuyển đổi', skillCount: 18, questionCount: 54, mappedOnetCount: 12 },
    { code: 'PPL_SKILL', name: 'People and skills', nameVi: 'Con người & Kỹ năng', skillCount: 19, questionCount: 42, mappedOnetCount: 8 },
    { code: 'REL_ENG', name: 'Relationships and engagement', nameVi: 'Quan hệ & Tương tác đối tác', skillCount: 16, questionCount: 28, mappedOnetCount: 4 },
  ],
  levelDistribution: [
    { level: 1, name: 'Follow', shortName: 'L1', activeCellCount: 34, questionCount: 24 },
    { level: 2, name: 'Assist', shortName: 'L2', activeCellCount: 78, questionCount: 68 },
    { level: 3, name: 'Apply', shortName: 'L3', activeCellCount: 122, questionCount: 142 },
    { level: 4, name: 'Enable', shortName: 'L4', activeCellCount: 136, questionCount: 128 },
    { level: 5, name: 'Ensure / Advise', shortName: 'L5', activeCellCount: 140, questionCount: 76 },
    { level: 6, name: 'Initiate / Influence', shortName: 'L6', activeCellCount: 114, questionCount: 36 },
    { level: 7, name: 'Set strategy / Inspire', shortName: 'L7', activeCellCount: 48, questionCount: 12 },
  ],
  topOnetMappedSkills: [
    { skillCode: 'PPLM', skillName: 'People management', categoryCode: 'PPL_SKILL', onetCount: 15, coreCount: 10, questionCount: 22 },
    { skillCode: 'PROG', skillName: 'Programming/software development', categoryCode: 'DEV_IMPL', onetCount: 14, coreCount: 12, questionCount: 38 },
    { skillCode: 'TEST', skillName: 'Testing', categoryCode: 'DEV_IMPL', onetCount: 12, coreCount: 8, questionCount: 32 },
    { skillCode: 'PRMG', skillName: 'Project management', categoryCode: 'CHG_TRANS', onetCount: 12, coreCount: 9, questionCount: 24 },
    { skillCode: 'SWDN', skillName: 'Software design', categoryCode: 'DEV_IMPL', onetCount: 11, coreCount: 8, questionCount: 26 },
    { skillCode: 'SCTY', skillName: 'Information security', categoryCode: 'STRAT_ARCH', onetCount: 10, coreCount: 7, questionCount: 22 },
    { skillCode: 'DBDS', skillName: 'Database design', categoryCode: 'DEV_IMPL', onetCount: 9, coreCount: 6, questionCount: 21 },
    { skillCode: 'BUAN', skillName: 'Business analysis', categoryCode: 'CHG_TRANS', onetCount: 9, coreCount: 6, questionCount: 20 },
  ],
}
