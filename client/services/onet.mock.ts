import type {
  SocMajorGroup,
  OnetOccupationSummary,
  OnetOccupationDetail,
} from '@/components/onet/types'

const SIMULATED_LATENCY_MS = 120

const sleep = (ms = SIMULATED_LATENCY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Danh sách 23 Major Groups SOC chuẩn theo Bộ Lao động Hoa Kỳ
 */
export const MOCK_SOC_MAJOR_GROUPS: SocMajorGroup[] = [
  {
    code: '11',
    name: 'Quản lý',
    englishName: 'Management Occupations',
    totalOccupations: 34,
    mappedCount: 6,
  },
  {
    code: '13',
    name: 'Kinh doanh & Vận hành Tài chính',
    englishName: 'Business and Financial Operations Occupations',
    totalOccupations: 32,
    mappedCount: 8,
  },
  {
    code: '15',
    name: 'Máy tính & Toán học',
    englishName: 'Computer and Mathematical Occupations',
    totalOccupations: 36,
    mappedCount: 28,
  },
  {
    code: '17',
    name: 'Kiến trúc & Kỹ thuật',
    englishName: 'Architecture and Engineering Occupations',
    totalOccupations: 38,
    mappedCount: 12,
  },
  {
    code: '19',
    name: 'Khoa học Đời sống, Vật lý & Xã hội',
    englishName: 'Life, Physical, and Social Science Occupations',
    totalOccupations: 45,
    mappedCount: 4,
  },
  {
    code: '21',
    name: 'Dịch vụ Cộng đồng & Xã hội',
    englishName: 'Community and Social Service Occupations',
    totalOccupations: 20,
    mappedCount: 0,
  },
  {
    code: '23',
    name: 'Pháp lý',
    englishName: 'Legal Occupations',
    totalOccupations: 12,
    mappedCount: 1,
  },
  {
    code: '25',
    name: 'Giáo dục & Hướng dẫn',
    englishName: 'Educational Instruction and Library Occupations',
    totalOccupations: 68,
    mappedCount: 2,
  },
  {
    code: '27',
    name: 'Nghệ thuật, Thiết kế & Truyền thông',
    englishName: 'Arts, Design, Entertainment, Sports, and Media Occupations',
    totalOccupations: 40,
    mappedCount: 9,
  },
  {
    code: '29',
    name: 'Chuyên gia & Kỹ thuật Y tế',
    englishName: 'Healthcare Practitioners and Technical Occupations',
    totalOccupations: 62,
    mappedCount: 3,
  },
  {
    code: '31',
    name: 'Hỗ trợ Y tế',
    englishName: 'Healthcare Support Occupations',
    totalOccupations: 24,
    mappedCount: 0,
  },
  {
    code: '33',
    name: 'Dịch vụ Bảo vệ',
    englishName: 'Protective Service Occupations',
    totalOccupations: 28,
    mappedCount: 1,
  },
  {
    code: '35',
    name: 'Chế biến & Phục vụ Thực phẩm',
    englishName: 'Food Preparation and Serving Related Occupations',
    totalOccupations: 22,
    mappedCount: 0,
  },
  {
    code: '37',
    name: 'Vệ sinh & Bảo trì Tòa nhà',
    englishName: 'Building and Grounds Cleaning and Maintenance Occupations',
    totalOccupations: 14,
    mappedCount: 0,
  },
  {
    code: '39',
    name: 'Chăm sóc Cá nhân & Dịch vụ',
    englishName: 'Personal Care and Service Occupations',
    totalOccupations: 34,
    mappedCount: 0,
  },
  {
    code: '41',
    name: 'Bán hàng & Dịch vụ liên quan',
    englishName: 'Sales and Related Occupations',
    totalOccupations: 26,
    mappedCount: 2,
  },
  {
    code: '43',
    name: 'Hỗ trợ Văn phòng & Hành chính',
    englishName: 'Office and Administrative Support Occupations',
    totalOccupations: 60,
    mappedCount: 1,
  },
  {
    code: '45',
    name: 'Nông, Lâm nghiệp & Thủy sản',
    englishName: 'Farming, Fishing, and Forestry Occupations',
    totalOccupations: 16,
    mappedCount: 0,
  },
  {
    code: '47',
    name: 'Xây dựng & Khai thác',
    englishName: 'Construction and Extraction Occupations',
    totalOccupations: 65,
    mappedCount: 0,
  },
  {
    code: '49',
    name: 'Lắp đặt, Bảo trì & Sửa chữa',
    englishName: 'Installation, Maintenance, and Repair Occupations',
    totalOccupations: 55,
    mappedCount: 1,
  },
  {
    code: '51',
    name: 'Sản xuất & Vận hành',
    englishName: 'Production Occupations',
    totalOccupations: 105,
    mappedCount: 0,
  },
  {
    code: '53',
    name: 'Vận tải & Di chuyển Vật liệu',
    englishName: 'Transportation and Material Moving Occupations',
    totalOccupations: 58,
    mappedCount: 0,
  },
  {
    code: '55',
    name: 'Các ngành Quân sự Đặc thù',
    englishName: 'Military Specific Occupations',
    totalOccupations: 20,
    mappedCount: 0,
  },
]

/**
 * Danh sách Occupations mẫu phân theo nhóm
 */
export const MOCK_OCCUPATIONS: OnetOccupationSummary[] = [
  // Nhóm 15: Computer & Mathematical
  {
    socCode: '15-1252.00',
    title: 'Software Developers',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 4,
  },
  {
    socCode: '15-1253.00',
    title: 'Software Quality Assurance Analysts and Testers',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
  },
  {
    socCode: '15-1243.00',
    title: 'Database Architects',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
  },
  {
    socCode: '15-1212.00',
    title: 'Information Security Analysts',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
  },
  {
    socCode: '15-2051.00',
    title: 'Data Scientists',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
  },
  {
    socCode: '15-1299.08',
    title: 'Computer Systems Engineers/Architects',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 2,
  },
  {
    socCode: '15-1244.00',
    title: 'Network and Computer Systems Administrators',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 2,
  },
  {
    socCode: '15-1254.00',
    title: 'Web Developers',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 2,
  },
  {
    socCode: '15-1232.00',
    title: 'Computer User Support Specialists',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 1,
  },
  {
    socCode: '15-1211.00',
    title: 'Computer Systems Analysts',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 2,
  },
  {
    socCode: '15-1251.00',
    title: 'Computer Programmers',
    majorGroupCode: '15',
    isMapped: false,
    mappingCount: 0,
  },
  {
    socCode: '15-2041.00',
    title: 'Statisticians',
    majorGroupCode: '15',
    isMapped: false,
    mappingCount: 0,
  },

  // Nhóm 11: Management
  {
    socCode: '11-3021.00',
    title: 'Computer and Information Systems Managers',
    majorGroupCode: '11',
    isMapped: true,
    mappingCount: 4,
  },
  {
    socCode: '11-1021.00',
    title: 'General and Operations Managers',
    majorGroupCode: '11',
    isMapped: false,
    mappingCount: 0,
  },

  // Nhóm 13: Business & Financial
  {
    socCode: '13-1082.00',
    title: 'Project Management Specialists',
    majorGroupCode: '13',
    isMapped: true,
    mappingCount: 3,
  },
  {
    socCode: '13-1111.00',
    title: 'Management Analysts',
    majorGroupCode: '13',
    isMapped: false,
    mappingCount: 0,
  },

  // Nhóm 17: Architecture & Engineering
  {
    socCode: '17-2061.00',
    title: 'Computer Hardware Engineers',
    majorGroupCode: '17',
    isMapped: true,
    mappingCount: 2,
  },
  {
    socCode: '17-2071.00',
    title: 'Electrical Engineers',
    majorGroupCode: '17',
    isMapped: false,
    mappingCount: 0,
  },

  // Nhóm 27: Arts & Media
  {
    socCode: '27-1024.00',
    title: 'Graphic Designers',
    majorGroupCode: '27',
    isMapped: true,
    mappingCount: 2,
  },
  {
    socCode: '27-3042.00',
    title: 'Technical Writers',
    majorGroupCode: '27',
    isMapped: true,
    mappingCount: 2,
  },
]

/**
 * Dữ liệu chi tiết mẫu cho các nghề trọng điểm (chuẩn bị toàn diện cho Phase 2 & 3)
 */
export const MOCK_OCCUPATION_DETAILS: Record<string, OnetOccupationDetail> = {
  '15-1252.00': {
    socCode: '15-1252.00',
    title: 'Software Developers',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 4,
    description:
      'Nghiên cứu, thiết kế và phát triển các hệ thống phần mềm máy tính kết hợp với phần cứng hoặc các ứng dụng độc lập. Áp dụng các nguyên lý khoa học máy tính và giải thuật toán học để xây dựng, thử nghiệm, tối ưu hóa và bảo trì các kiến trúc phần mềm phân tán hiện đại.',
    jobZone: {
      zone: 4,
      name: 'Considerable Preparation Needed',
      education: "Bằng Cử nhân Công nghệ Thông tin, Khoa học Máy tính hoặc tương đương (Bachelor's Degree)",
      experience: '2 - 4 năm kinh nghiệm lập trình và thiết kế kiến trúc phần mềm thực tế',
      jobTraining: 'Đào tạo liên tục tại chỗ về công nghệ mới và quy trình CI/CD',
    },
    stats: {
      toolCount: 32,
      taskCount: 15,
      mappingCount: 4,
      alternateTitleCount: 12,
    },
    tasks: [
      {
        id: 'task-1',
        statement:
          'Phát triển và định hướng kiến trúc mã nguồn phần mềm, thiết lập kiểm thử đơn vị tự động và quy chuẩn code review cho đội ngũ kỹ thuật.',
        isCore: true,
      },
      {
        id: 'task-2',
        statement:
          'Thiết kế, lập trình và triển khai các RESTful API và microservices có khả năng mở rộng cao, phục vụ hàng triệu người dùng đồng thời.',
        isCore: true,
      },
      {
        id: 'task-3',
        statement:
          'Phân tích yêu cầu nghiệp vụ từ khách hàng hoặc Product Owner để chuyển hóa thành kiến trúc kỹ thuật và giải pháp phần mềm tối ưu.',
        isCore: true,
      },
      {
        id: 'task-4',
        statement:
          'Tối ưu hóa hiệu năng cơ sở dữ liệu, bộ nhớ đệm (caching) và truy vấn SQL/NoSQL phức tạp.',
        isCore: true,
      },
      {
        id: 'task-5',
        statement:
          'Hợp tác với đội ngũ An ninh mạng (Security) để rà soát lỗ hổng mã nguồn (SAST/DAST) và tuân thủ các chuẩn an toàn thông tin OWASP.',
        isCore: true,
      },
      {
        id: 'task-6',
        statement:
          'Tích hợp pipeline CI/CD tự động hóa quy trình build, test, scan và deploy lên hạ tầng cloud (AWS/GCP/Azure).',
        isCore: false,
      },
      {
        id: 'task-7',
        statement:
          'Viết tài liệu kỹ thuật chi tiết về kiến trúc hệ thống, sơ đồ luồng dữ liệu (Dataflow) và tài liệu hướng dẫn API OpenAPI/Swagger.',
        isCore: false,
      },
    ],
    softwareSkills: [
      { name: 'TypeScript', category: 'Ngôn ngữ lập trình', isHotTechnology: true, inDemand: true },
      { name: 'Java / Spring Boot', category: 'Framework Backend', isHotTechnology: true, inDemand: true },
      { name: 'Python', category: 'Ngôn ngữ lập trình', isHotTechnology: true, inDemand: true },
      { name: 'React / Next.js', category: 'Framework Frontend', isHotTechnology: true, inDemand: true },
      { name: 'Docker & Kubernetes', category: 'Containerization & DevOps', isHotTechnology: true, inDemand: true },
      { name: 'PostgreSQL', category: 'Cơ sở dữ liệu Quan hệ', isHotTechnology: true, inDemand: false },
      { name: 'Redis', category: 'In-Memory Cache', isHotTechnology: false, inDemand: true },
      { name: 'Apache Kafka', category: 'Event Streaming', isHotTechnology: true, inDemand: true },
      { name: 'Git / GitHub', category: 'Quản lý Phiên bản', isHotTechnology: false, inDemand: false },
      { name: 'AWS Lambda / S3', category: 'Điện toán Đám mây', isHotTechnology: true, inDemand: true },
    ],
    alternateTitles: [
      'Full Stack Software Engineer',
      'Backend Engineer',
      'Frontend Engineer',
      'Applications Developer',
      'Cloud Software Architect',
      'API Platform Engineer',
      'Lead Developer',
      'Software Development Engineer (SDE)',
      'Systems Software Specialist',
      'Core Infrastructure Developer',
      'Senior Application Programmer',
      'Web Services Architect',
    ],
    sfiaMappings: [
      {
        id: 'map-1',
        skillCode: 'PROG',
        skillName: 'Programming/software development',
        targetLevel: 4,
        minLevel: 2,
        maxLevel: 6,
        weight: 2.0,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-2',
        skillCode: 'SWDN',
        skillName: 'Software design',
        targetLevel: 4,
        minLevel: 2,
        maxLevel: 6,
        weight: 1.5,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-3',
        skillCode: 'TEST',
        skillName: 'Testing',
        targetLevel: 3,
        minLevel: 1,
        maxLevel: 6,
        weight: 1.0,
        isCore: false,
        source: 'EXPERT_CURATED',
      },
      {
        id: 'map-4',
        skillCode: 'SCTY',
        skillName: 'Information security',
        targetLevel: 3,
        minLevel: 2,
        maxLevel: 7,
        weight: 1.0,
        isCore: false,
        source: 'EXPERT_CURATED',
      },
    ],
  },

  '15-1253.00': {
    socCode: '15-1253.00',
    title: 'Software Quality Assurance Analysts and Testers',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
    description:
      'Phát triển và thực thi các kế hoạch kiểm thử phần mềm, kịch bản tự động hóa (Automation Testing) và các quy trình kiểm thử tải nhằm xác định lỗi, đánh giá chất lượng sản phẩm và bảo đảm hệ thống vận hành đúng quy chuẩn trước khi phát hành.',
    jobZone: {
      zone: 4,
      name: 'Considerable Preparation Needed',
      education: "Bằng Cử nhân Công nghệ Thông tin hoặc Quản lý Chất lượng Phần mềm (Bachelor's Degree)",
      experience: '2 - 4 năm kinh nghiệm kiểm thử phần mềm tự động hoặc thủ công',
      jobTraining: 'Đào tạo chứng chỉ ISTQB và các công cụ automation hiện đại',
    },
    stats: {
      toolCount: 24,
      taskCount: 12,
      mappingCount: 3,
      alternateTitleCount: 8,
    },
    tasks: [
      {
        id: 'task-qa-1',
        statement:
          'Thiết kế, xây dựng và bảo trì framework kiểm thử tự động (Automation Framework) cho Web, Mobile và API.',
        isCore: true,
      },
      {
        id: 'task-qa-2',
        statement:
          'Lập tài liệu Test Plan, Test Cases, và phân tích rủi ro chất lượng cho các tính năng mới trong từng Sprint.',
        isCore: true,
      },
      {
        id: 'task-qa-3',
        statement:
          'Thực thi kiểm thử hiệu năng (Load Testing, Stress Testing) bằng JMeter hoặc K6 và đưa ra khuyến nghị tối ưu hệ thống.',
        isCore: false,
      },
    ],
    softwareSkills: [
      { name: 'Playwright / Cypress', category: 'Automation Testing', isHotTechnology: true, inDemand: true },
      { name: 'Postman / Newman', category: 'API Testing', isHotTechnology: true, inDemand: true },
      { name: 'Selenium WebDriver', category: 'Automation Testing', isHotTechnology: false, inDemand: true },
      { name: 'JMeter / k6', category: 'Performance Testing', isHotTechnology: true, inDemand: false },
      { name: 'Jira / Xray', category: 'Test Management', isHotTechnology: false, inDemand: false },
    ],
    alternateTitles: [
      'QA Automation Engineer',
      'Software Test Engineer',
      'SDET (Software Development Engineer in Test)',
      'Quality Assurance Specialist',
      'Performance Test Analyst',
      'Manual Test Specialist',
      'Mobile App QA Engineer',
      'Test Lead',
    ],
    sfiaMappings: [
      {
        id: 'map-qa-1',
        skillCode: 'TEST',
        skillName: 'Testing',
        targetLevel: 4,
        minLevel: 1,
        maxLevel: 6,
        weight: 2.0,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-qa-2',
        skillCode: 'QUAS',
        skillName: 'Quality assurance',
        targetLevel: 3,
        minLevel: 2,
        maxLevel: 6,
        weight: 1.5,
        isCore: true,
        source: 'EXPERT_CURATED',
      },
      {
        id: 'map-qa-3',
        skillCode: 'PROG',
        skillName: 'Programming/software development',
        targetLevel: 2,
        minLevel: 2,
        maxLevel: 6,
        weight: 1.0,
        isCore: false,
        source: 'USER_DEFINED',
      },
    ],
  },

  '15-1243.00': {
    socCode: '15-1243.00',
    title: 'Database Architects',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
    description:
      'Thiết kế các chiến lược cơ sở dữ liệu lớn, xây dựng mô hình dữ liệu quan hệ và phi quan hệ, hoạch định kiến trúc sao lưu phân tán, bảo mật và phân vùng dữ liệu phục vụ các hệ thống phân tích và vận hành quy mô lớn.',
    jobZone: {
      zone: 4,
      name: 'Considerable Preparation Needed',
      education: "Bằng Cử nhân Hệ thống Thông tin, Khoa học Dữ liệu hoặc Toán Tin",
      experience: '4 - 6 năm chuyên sâu về cơ sở dữ liệu và Data Warehousing',
      jobTraining: 'Đào tạo chứng chỉ Cloud Database Architect (AWS/GCP)',
    },
    stats: {
      toolCount: 28,
      taskCount: 14,
      mappingCount: 3,
      alternateTitleCount: 10,
    },
    tasks: [
      {
        id: 'task-db-1',
        statement:
          'Thiết kế và mô hình hóa dữ liệu mức khái niệm, logic và vật lý (Conceptual, Logical, Physical Data Modeling).',
        isCore: true,
      },
      {
        id: 'task-db-2',
        statement:
          'Xây dựng các giải pháp phân tán High-Availability, Replication và Disaster Recovery cho hệ quản trị CSDL.',
        isCore: true,
      },
    ],
    softwareSkills: [
      { name: 'PostgreSQL & pgvector', category: 'Relational Database', isHotTechnology: true, inDemand: true },
      { name: 'Snowflake / BigQuery', category: 'Cloud Data Warehouse', isHotTechnology: true, inDemand: true },
      { name: 'MongoDB / DynamoDB', category: 'NoSQL Database', isHotTechnology: true, inDemand: false },
      { name: 'Apache Spark', category: 'Distributed Computing', isHotTechnology: true, inDemand: true },
    ],
    alternateTitles: [
      'Chief Database Architect',
      'Data Modeler',
      'Enterprise Data Warehouse Architect',
      'Cloud Data Platform Engineer',
    ],
    sfiaMappings: [
      {
        id: 'map-db-1',
        skillCode: 'DBDS',
        skillName: 'Database design',
        targetLevel: 5,
        minLevel: 2,
        maxLevel: 6,
        weight: 2.0,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-db-2',
        skillCode: 'DATM',
        skillName: 'Data management',
        targetLevel: 4,
        minLevel: 2,
        maxLevel: 6,
        weight: 1.5,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-db-3',
        skillCode: 'ITOP',
        skillName: 'IT infrastructure',
        targetLevel: 4,
        minLevel: 1,
        maxLevel: 5,
        weight: 1.0,
        isCore: false,
        source: 'EXPERT_CURATED',
      },
    ],
  },
}

/**
 * Hàm helper tự động sinh chi tiết mặc định cho các nghề chưa được cấu hình chi tiết riêng
 */
function createDefaultOccupationDetail(summary: OnetOccupationSummary): OnetOccupationDetail {
  const group = MOCK_SOC_MAJOR_GROUPS.find((g) => g.code === summary.majorGroupCode)
  return {
    ...summary,
    description: `Nghề nghiệp chuẩn mã SOC ${summary.socCode}: ${summary.title}. Thuộc nhóm ngành ${group?.name || summary.majorGroupCode} theo tiêu chuẩn phân loại nghề nghiệp của Bộ Lao động Hoa Kỳ (O*NET Content Model). Phục vụ công tác xây dựng ngân hàng câu hỏi và đánh giá năng lực phỏng vấn ứng viên.`,
    jobZone: {
      zone: 4,
      name: 'Considerable Preparation Needed',
      education: "Bằng Cử nhân hoặc Chứng chỉ đào tạo nghề chuyên ngành phù hợp",
      experience: '2 - 4 năm kinh nghiệm làm việc trong lĩnh vực liên quan',
      jobTraining: 'Đào tạo kỹ năng chuyên sâu tại chỗ',
    },
    stats: {
      toolCount: 18,
      taskCount: 10,
      mappingCount: summary.mappingCount,
      alternateTitleCount: 6,
    },
    tasks: [
      {
        id: 'default-task-1',
        statement: `Thực hiện các nhiệm vụ chuyên môn cốt lõi theo tiêu chuẩn của chức danh ${summary.title}.`,
        isCore: true,
      },
      {
        id: 'default-task-2',
        statement: 'Phối hợp với các bộ phận liên quan để bảo đảm chất lượng và tiến độ công việc.',
        isCore: true,
      },
      {
        id: 'default-task-3',
        statement: 'Tuân thủ các quy trình an toàn lao động, tiêu chuẩn bảo mật và đạo đức nghề nghiệp.',
        isCore: false,
      },
    ],
    softwareSkills: [
      { name: 'Công cụ chuyên ngành', category: 'Chuyên môn', isHotTechnology: true, inDemand: true },
      { name: 'Microsoft Office 365 / Google Workspace', category: 'Văn phòng', isHotTechnology: false, inDemand: false },
    ],
    alternateTitles: [
      `${summary.title} Specialist`,
      `Senior ${summary.title}`,
      `Associate ${summary.title}`,
    ],
    sfiaMappings: summary.isMapped
      ? [
          {
            id: `default-map-${summary.socCode}`,
            skillCode: 'PROG',
            skillName: 'Professional Expertise',
            targetLevel: 3,
            minLevel: 1,
            maxLevel: 7,
            weight: 1.0,
            isCore: true,
            source: 'ONET_CROSSWALK',
          },
        ]
      : [],
  }
}

/**
 * Service API giả lập cung cấp dữ liệu cho O*NET Admin Browser
 */
export const onetMockService = {
  /**
   * Lấy danh sách 23 nhóm ngành SOC lớn
   */
  async getMajorGroups(): Promise<SocMajorGroup[]> {
    await sleep()
    return [...MOCK_SOC_MAJOR_GROUPS]
  },

  /**
   * Lấy danh sách occupations theo nhóm ngành
   */
  async getOccupationsByGroup(groupCode: string): Promise<OnetOccupationSummary[]> {
    await sleep()
    return MOCK_OCCUPATIONS.filter((o) => o.majorGroupCode === groupCode)
  },

  /**
   * Lấy tất cả occupations tóm tắt
   */
  async getAllOccupations(): Promise<OnetOccupationSummary[]> {
    await sleep()
    return [...MOCK_OCCUPATIONS]
  },

  /**
   * Tìm kiếm nghề theo từ khóa (Mã SOC hoặc Tên)
   */
  async searchOccupations(query: string): Promise<OnetOccupationSummary[]> {
    await sleep(60) // Debounce đã được áp dụng ở UI, latency nhẹ
    const clean = query.trim().toLowerCase()
    if (!clean) {
      return [...MOCK_OCCUPATIONS]
    }
    return MOCK_OCCUPATIONS.filter(
      (o) =>
        o.socCode.toLowerCase().includes(clean) ||
        o.title.toLowerCase().includes(clean)
    )
  },

  /**
   * Lấy chi tiết thông tin nghề theo mã SOC
   */
  async getOccupationDetail(socCode: string): Promise<OnetOccupationDetail | null> {
    await sleep()
    if (MOCK_OCCUPATION_DETAILS[socCode]) {
      return MOCK_OCCUPATION_DETAILS[socCode]
    }
    const summary = MOCK_OCCUPATIONS.find((o) => o.socCode === socCode)
    if (summary) {
      return createDefaultOccupationDetail(summary)
    }
    return null
  },
}
