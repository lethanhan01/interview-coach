import type {
  SocMajorGroup,
  OnetOccupationSummary,
  OnetOccupationDetail,
  SfiaSkillDefinition,
  OnetSfiaMapping,
  OnetAnalyticsSummary,
  SocGroupDistributionItem,
  SfiaSkillCoverageItem,
  OnetTopOccupationItem,
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
      { name: 'PostgreSQL', category: 'Cơ sở dữ liệu & Caching', isHotTechnology: true, inDemand: false },
      { name: 'Redis', category: 'Cơ sở dữ liệu & Caching', isHotTechnology: false, inDemand: true },
      { name: 'Apache Kafka', category: 'Containerization & DevOps', isHotTechnology: true, inDemand: true },
      { name: 'Git / GitHub Enterprise', category: 'Quản lý Phiên bản', isHotTechnology: false, inDemand: false },
      { name: 'AWS Lambda / S3', category: 'Điện toán Đám mây', isHotTechnology: true, inDemand: true },
      { name: 'GraphQL', category: 'Framework Backend', isHotTechnology: false, inDemand: true },
      { name: 'Tailwind CSS', category: 'Framework Frontend', isHotTechnology: true, inDemand: false },
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
      'Embedded Software Engineer',
      'Principal Systems Developer',
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
      alternateTitleCount: 11,
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
          'Phối hợp chặt chẽ với Product Owner và Software Developers để tái hiện lỗi và thẩm định Acceptance Criteria.',
        isCore: true,
      },
      {
        id: 'task-qa-4',
        statement:
          'Thực thi kiểm thử hiệu năng (Load Testing, Stress Testing) bằng JMeter hoặc K6 và đưa ra khuyến nghị tối ưu hệ thống.',
        isCore: false,
      },
      {
        id: 'task-qa-5',
        statement:
          'Giám sát quy trình phát hành và chạy bộ kiểm thử khói (Smoke Test) tự động sau khi deploy lên môi trường Production.',
        isCore: false,
      },
    ],
    softwareSkills: [
      { name: 'Playwright / Cypress', category: 'Automation Testing', isHotTechnology: true, inDemand: true },
      { name: 'Postman / Newman', category: 'API Testing', isHotTechnology: true, inDemand: true },
      { name: 'Selenium WebDriver', category: 'Automation Testing', isHotTechnology: false, inDemand: true },
      { name: 'JMeter / k6', category: 'Performance Testing', isHotTechnology: true, inDemand: false },
      { name: 'Jira / Xray', category: 'Test Management', isHotTechnology: false, inDemand: false },
      { name: 'Appium', category: 'Mobile Testing', isHotTechnology: false, inDemand: true },
      { name: 'BrowserStack / Saucelabs', category: 'Cloud Testing Infrastructure', isHotTechnology: true, inDemand: false },
      { name: 'SonarQube', category: 'Static Code Analysis', isHotTechnology: false, inDemand: false },
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
      'Quality Engineering Consultant',
      'Software Verification Specialist',
      'Senior QA Analyst',
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
      alternateTitleCount: 11,
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
      {
        id: 'task-db-3',
        statement:
          'Thiết kế kiến trúc phân vùng dữ liệu (Partitioning & Sharding) nhằm tối ưu hóa tốc độ truy vấn quy mô Terabyte.',
        isCore: true,
      },
      {
        id: 'task-db-4',
        statement:
          'Tối ưu hóa Execution Plan, chỉ mục đánh chỉ mục tự động (Indexing) và cấu hình tài nguyên phần cứng cho Database Engine.',
        isCore: false,
      },
      {
        id: 'task-db-5',
        statement:
          'Thiết lập chính sách phân quyền truy cập, mã hóa dữ liệu tĩnh (At-Rest) và dữ liệu truyền (In-Transit) tuân thủ tiêu chuẩn GDPR/HIPAA.',
        isCore: false,
      },
    ],
    softwareSkills: [
      { name: 'PostgreSQL & pgvector', category: 'Relational Database', isHotTechnology: true, inDemand: true },
      { name: 'Snowflake / BigQuery', category: 'Cloud Data Warehouse', isHotTechnology: true, inDemand: true },
      { name: 'MongoDB / DynamoDB', category: 'NoSQL Database', isHotTechnology: true, inDemand: false },
      { name: 'Apache Spark', category: 'Distributed Computing', isHotTechnology: true, inDemand: true },
      { name: 'Oracle Database 19c', category: 'Relational Database', isHotTechnology: false, inDemand: false },
      { name: 'dbt (Data Build Tool)', category: 'Data Transformation', isHotTechnology: true, inDemand: true },
      { name: 'Apache Cassandra', category: 'NoSQL Database', isHotTechnology: false, inDemand: false },
      { name: 'Erwin Data Modeler', category: 'Data Modeling Tools', isHotTechnology: false, inDemand: false },
    ],
    alternateTitles: [
      'Chief Database Architect',
      'Data Modeler',
      'Enterprise Data Warehouse Architect',
      'Cloud Data Platform Engineer',
      'Principal Database Designer',
      'Big Data Solutions Architect',
      'Database Infrastructure Lead',
      'Relational Database Consultant',
      'Master Data Management Architect',
      'Distributed Storage Engineer',
      'NoSQL Systems Architect',
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

  '15-2051.00': {
    socCode: '15-2051.00',
    title: 'Data Scientists',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 3,
    description:
      'Phát triển và triển khai các thuật toán học máy (Machine Learning), phân tích dữ liệu quy mô lớn và mô hình trí tuệ nhân tạo (AI/LLM) nhằm giải quyết các bài toán dự đoán phức tạp, tự động hóa quy trình nghiệp vụ và tối ưu hóa quyết định kinh doanh.',
    jobZone: {
      zone: 5,
      name: 'Extensive Preparation Needed',
      education: "Bằng Thạc sĩ hoặc Tiến sĩ về Khoa học Máy tính, Trí tuệ Nhân tạo, Toán học hoặc Thống kê",
      experience: '4 - 6 năm nghiên cứu và ứng dụng mô hình học máy thực tế',
      jobTraining: 'Nghiên cứu liên tục các bài báo khoa học và mô hình nền tảng (Foundation Models)',
    },
    stats: {
      toolCount: 30,
      taskCount: 16,
      mappingCount: 3,
      alternateTitleCount: 14,
    },
    tasks: [
      {
        id: 'task-ds-1',
        statement:
          'Xây dựng, huấn luyện và tinh chỉnh (Fine-tuning) các mô hình học máy (Machine Learning), học sâu (Deep Learning) và Large Language Models (LLM).',
        isCore: true,
      },
      {
        id: 'task-ds-2',
        statement:
          'Thực hiện phân tích khám phá dữ liệu (EDA), kỹ thuật trích xuất đặc trưng (Feature Engineering) và làm sạch dữ liệu lớn.',
        isCore: true,
      },
      {
        id: 'task-ds-3',
        statement:
          'Thiết kế các thử nghiệm A/B Testing, phân tích suy luận nhân quả (Causal Inference) để đo lường hiệu quả thuật toán.',
        isCore: true,
      },
      {
        id: 'task-ds-4',
        statement:
          'Đóng gói mô hình thành API microservices và triển khai lên hạ tầng phục vụ suy luận thời gian thực (Inference Serving).',
        isCore: true,
      },
      {
        id: 'task-ds-5',
        statement:
          'Xây dựng các dashboard trực quan hóa dữ liệu và trình bày kết quả phân tích cho các cấp quản lý và các bên liên quan.',
        isCore: false,
      },
      {
        id: 'task-ds-6',
        statement:
          'Giám sát hiện tượng suy giảm hiệu năng mô hình (Model Drift) và thiết lập cơ chế tự động huấn luyện lại (Continuous Training).',
        isCore: false,
      },
    ],
    softwareSkills: [
      { name: 'Python (NumPy, Pandas, Scikit-learn)', category: 'Ngôn ngữ & Thư viện', isHotTechnology: true, inDemand: true },
      { name: 'PyTorch / TensorFlow', category: 'Machine Learning & AI', isHotTechnology: true, inDemand: true },
      { name: 'Hugging Face Transformers / LangChain', category: 'Generative AI & LLM', isHotTechnology: true, inDemand: true },
      { name: 'SQL & Apache Spark', category: 'Xử lý Dữ liệu Lớn', isHotTechnology: true, inDemand: true },
      { name: 'MLflow / Weights & Biases', category: 'MLOps & Experiment Tracking', isHotTechnology: true, inDemand: true },
      { name: 'Docker & Triton Inference Server', category: 'Model Deployment', isHotTechnology: false, inDemand: true },
      { name: 'Tableau / Power BI', category: 'Trực quan hóa Dữ liệu', isHotTechnology: false, inDemand: false },
      { name: 'JupyterLab / Google Colab', category: 'Môi trường Nghiên cứu', isHotTechnology: false, inDemand: false },
    ],
    alternateTitles: [
      'Machine Learning Scientist',
      'AI Research Scientist',
      'Lead Data Scientist',
      'Predictive Analytics Specialist',
      'Applied AI Engineer',
      'Decision Scientist',
      'Quantitative Analyst',
      'NLP Research Engineer',
      'Computer Vision Specialist',
      'Deep Learning Engineer',
      'Big Data Analytics Consultant',
      'Statistical Modeling Analyst',
      'Principal Data Scientist',
      'Senior AI Consultant',
    ],
    sfiaMappings: [
      {
        id: 'map-ds-1',
        skillCode: 'DATM',
        skillName: 'Data management',
        targetLevel: 5,
        minLevel: 2,
        maxLevel: 6,
        weight: 2.0,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-ds-2',
        skillCode: 'PROG',
        skillName: 'Programming/software development',
        targetLevel: 4,
        minLevel: 2,
        maxLevel: 6,
        weight: 1.5,
        isCore: true,
        source: 'ONET_CROSSWALK',
      },
      {
        id: 'map-ds-3',
        skillCode: 'VISL',
        skillName: 'Data visualisation',
        targetLevel: 4,
        minLevel: 2,
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
  /**
   * Lấy chi tiết thông tin nghề theo mã SOC
   */
  async getOccupationDetail(socCode: string): Promise<OnetOccupationDetail | null> {
    await sleep()
    if (OCCUPATION_DETAILS_STORE[socCode]) {
      return JSON.parse(JSON.stringify(OCCUPATION_DETAILS_STORE[socCode]))
    }
    const summary = MOCK_OCCUPATIONS.find((o) => o.socCode === socCode)
    if (summary) {
      const generated = createDefaultOccupationDetail(summary)
      OCCUPATION_DETAILS_STORE[socCode] = generated
      return JSON.parse(JSON.stringify(generated))
    }
    return null
  },

  /**
   * Lấy toàn bộ từ điển 25 kỹ năng SFIA 9 mẫu
   */
  async getSfiaLibrary(): Promise<SfiaSkillDefinition[]> {
    await sleep(40)
    return [...MOCK_SFIA_SKILLS_LIBRARY]
  },

  /**
   * Tìm kiếm kỹ năng SFIA theo mã hoặc từ khóa
   */
  async searchSfiaSkills(query: string): Promise<SfiaSkillDefinition[]> {
    await sleep(30)
    const clean = query.trim().toLowerCase()
    if (!clean) return [...MOCK_SFIA_SKILLS_LIBRARY]
    return MOCK_SFIA_SKILLS_LIBRARY.filter(
      (s) =>
        s.code.toLowerCase().includes(clean) ||
        s.name.toLowerCase().includes(clean) ||
        s.category.toLowerCase().includes(clean)
    )
  },

  /**
   * Lấy thông tin chi tiết một kỹ năng SFIA
   */
  async getSfiaSkill(code: string): Promise<SfiaSkillDefinition | null> {
    await sleep(20)
    return MOCK_SFIA_SKILLS_LIBRARY.find((s) => s.code === code) || null
  },

  /**
   * Thêm mới một mapping SFIA cho nghề
   */
  async createSfiaMapping(
    socCode: string,
    mapping: Omit<OnetSfiaMapping, 'id'>
  ): Promise<OnetSfiaMapping> {
    await sleep(150)
    const detail = await this.getOccupationDetail(socCode)
    if (!detail) throw new Error(`Không tìm thấy mã nghề ${socCode}`)

    // Check unique constraint: 1 skillCode per occupation
    const exists = detail.sfiaMappings.some((m) => m.skillCode === mapping.skillCode)
    if (exists) {
      throw new Error(`Kỹ năng ${mapping.skillCode} đã được ánh xạ cho nghề này. Vui lòng chỉnh sửa hàng hiện có.`)
    }

    const newId = `map-${mapping.skillCode.toLowerCase()}-${Date.now()}`
    const newMapping: OnetSfiaMapping = {
      ...mapping,
      id: newId,
    }

    const store = OCCUPATION_DETAILS_STORE[socCode]
    if (store) {
      store.sfiaMappings.unshift(newMapping)
      store.mappingCount = store.sfiaMappings.length
      store.isMapped = store.sfiaMappings.length > 0
      store.stats.mappingCount = store.sfiaMappings.length
    }

    // Update summary in MOCK_OCCUPATIONS
    const summary = MOCK_OCCUPATIONS.find((o) => o.socCode === socCode)
    if (summary && store) {
      summary.mappingCount = store.sfiaMappings.length
      summary.isMapped = store.sfiaMappings.length > 0
    }

    return newMapping
  },

  /**
   * Cập nhật thông tin mapping SFIA
   */
  async updateSfiaMapping(
    socCode: string,
    mappingId: string,
    data: Partial<OnetSfiaMapping>
  ): Promise<OnetSfiaMapping> {
    await sleep(150)
    const store = OCCUPATION_DETAILS_STORE[socCode]
    if (!store) throw new Error(`Không tìm thấy mã nghề ${socCode}`)

    const index = store.sfiaMappings.findIndex((m) => m.id === mappingId)
    if (index === -1) throw new Error(`Không tìm thấy ánh xạ ID ${mappingId}`)

    // Validate levels
    const current = store.sfiaMappings[index]
    const updatedLevel = data.targetLevel ?? current.targetLevel
    if (updatedLevel < current.minLevel || updatedLevel > current.maxLevel) {
      throw new Error(`Cấp độ ${updatedLevel} nằm ngoài dải hợp lệ [${current.minLevel} - ${current.maxLevel}] của kỹ năng ${current.skillCode}`)
    }

    store.sfiaMappings[index] = {
      ...current,
      ...data,
      id: mappingId,
    }

    return { ...store.sfiaMappings[index] }
  },

  /**
   * Xóa mapping SFIA
   */
  async deleteSfiaMapping(socCode: string, mappingId: string): Promise<boolean> {
    await sleep(150)
    const store = OCCUPATION_DETAILS_STORE[socCode]
    if (!store) throw new Error(`Không tìm thấy mã nghề ${socCode}`)

    const initialLen = store.sfiaMappings.length
    store.sfiaMappings = store.sfiaMappings.filter((m) => m.id !== mappingId)
    store.mappingCount = store.sfiaMappings.length
    store.isMapped = store.sfiaMappings.length > 0
    store.stats.mappingCount = store.sfiaMappings.length

    // Update summary in MOCK_OCCUPATIONS
    const summary = MOCK_OCCUPATIONS.find((o) => o.socCode === socCode)
    if (summary) {
      summary.mappingCount = store.sfiaMappings.length
      summary.isMapped = store.sfiaMappings.length > 0
    }

    return store.sfiaMappings.length < initialLen
  },

  /**
   * Khôi phục danh sách mapping mặc định của nghề
   */
  async resetSfiaMappings(socCode: string): Promise<OnetSfiaMapping[]> {
    await sleep(120)
    if (ORIGINAL_MOCK_DETAILS[socCode]) {
      OCCUPATION_DETAILS_STORE[socCode] = JSON.parse(
        JSON.stringify(ORIGINAL_MOCK_DETAILS[socCode])
      )
      const store = OCCUPATION_DETAILS_STORE[socCode]
      const summary = MOCK_OCCUPATIONS.find((o) => o.socCode === socCode)
      if (summary) {
        summary.mappingCount = store.sfiaMappings.length
        summary.isMapped = store.sfiaMappings.length > 0
      }
      return [...store.sfiaMappings]
    }
    return []
  },

  /**
   * Tính toán tóm tắt KPI toàn hệ thống (Realtime Reactive)
   */
  async getAnalyticsSummary(): Promise<OnetAnalyticsSummary> {
    await sleep(80)

    // Đếm số lượng nghề có mapping từ store và mock occupations
    const mappedSocCodes = new Set<string>()
    MOCK_OCCUPATIONS.forEach((o) => {
      const store = OCCUPATION_DETAILS_STORE[o.socCode]
      if ((store && store.sfiaMappings.length > 0) || o.isMapped) {
        mappedSocCodes.add(o.socCode)
      }
    })

    // Tính toán riêng nhóm 15
    const itOccupations = MOCK_OCCUPATIONS.filter((o) => o.majorGroupCode === '15')
    const itMappedCount = itOccupations.filter((o) => mappedSocCodes.has(o.socCode)).length
    const itGroupTotal = 36 // Chuẩn O*NET Major Group 15
    const itGroupCoveragePercent = Math.round((itMappedCount / itGroupTotal) * 100)

    // Tổng số nghề mapped toàn hệ thống (mô phỏng tổng thể bao gồm các nhóm khác)
    const baseOtherMapped = 42 // từ các nhóm 11, 13, 17, 27...
    const totalMappedOccupations = baseOtherMapped + itMappedCount
    const totalOccupations = 1016
    const overallMappingCoveragePercent = Math.round(
      (totalMappedOccupations / totalOccupations) * 100
    )

    // Tính tổng lượt mock interview và JD
    let totalMockInterviews = 6840
    let totalLinkedJobDescriptions = 1640
    itOccupations.forEach((o) => {
      const metrics = MOCK_TOP_METRICS[o.socCode]
      if (metrics) {
        totalMockInterviews += metrics.mockInterviewCount
        totalLinkedJobDescriptions += metrics.jobDescriptionCount
      }
    })

    return {
      totalOccupations,
      totalMajorGroups: 23,
      totalMappedOccupations,
      overallMappingCoveragePercent,
      itGroupOccupations: itGroupTotal,
      itGroupMappedOccupations: itMappedCount,
      itGroupCoveragePercent,
      totalSoftwareSkills: 31821,
      hotTechCount: 4215,
      inDemandTechCount: 7890,
      totalAlternateTitles: 54269,
      totalMockInterviews,
      totalLinkedJobDescriptions,
    }
  },

  /**
   * Lấy dữ liệu phân bổ 23 Major Groups SOC
   */
  async getSocGroupDistribution(): Promise<SocGroupDistributionItem[]> {
    await sleep(60)

    // Tính số lượng nghề nhóm 15 đã mapped
    const itMappedCount = MOCK_OCCUPATIONS.filter(
      (o) =>
        o.majorGroupCode === '15' &&
        ((OCCUPATION_DETAILS_STORE[o.socCode]?.sfiaMappings?.length ?? 0) > 0 || o.isMapped)
    ).length

    return MOCK_SOC_MAJOR_GROUPS.map((group) => {
      const isFocusGroup = group.code === '15'
      const mappedOccupations = isFocusGroup ? itMappedCount : group.mappedCount
      const mappingCoveragePercent = Math.round(
        (mappedOccupations / group.totalOccupations) * 100
      )

      return {
        code: group.code,
        name: group.name,
        englishName: group.englishName,
        totalOccupations: group.totalOccupations,
        mappedOccupations,
        mappingCoveragePercent,
        isFocusGroup,
      }
    })
  },

  /**
   * Lấy thống kê độ phủ kỹ năng SFIA 9
   */
  async getSfiaSkillCoverage(): Promise<SfiaSkillCoverageItem[]> {
    await sleep(70)

    // Baseline frequency cho các kỹ năng SFIA phổ biến
    const baselineCounts: Record<string, { mapped: number; core: number; sec: number }> = {
      PROG: { mapped: 18, core: 14, sec: 4 },
      TEST: { mapped: 14, core: 10, sec: 4 },
      DBDS: { mapped: 12, core: 8, sec: 4 },
      SWDN: { mapped: 11, core: 9, sec: 2 },
      DATM: { mapped: 10, core: 7, sec: 3 },
      ITOP: { mapped: 9, core: 6, sec: 3 },
      SCTY: { mapped: 8, core: 6, sec: 2 },
      BUSA: { mapped: 7, core: 4, sec: 3 },
      METL: { mapped: 6, core: 4, sec: 2 },
      STPL: { mapped: 5, core: 3, sec: 2 },
      QUAS: { mapped: 5, core: 2, sec: 3 },
      VISL: { mapped: 4, core: 3, sec: 1 },
      NTAS: { mapped: 4, core: 3, sec: 1 },
      IRMG: { mapped: 3, core: 2, sec: 1 },
      USUP: { mapped: 3, core: 2, sec: 1 },
      INCA: { mapped: 3, core: 2, sec: 1 },
      DESN: { mapped: 3, core: 2, sec: 1 },
    }

    // Quét động qua OCCUPATION_DETAILS_STORE để tính toán các thay đổi do Admin thực hiện
    const dynamicStats: Record<
      string,
      { count: number; core: number; sec: number; levels: number[] }
    > = {}

    Object.values(OCCUPATION_DETAILS_STORE).forEach((detail) => {
      detail.sfiaMappings.forEach((mapping) => {
        if (!dynamicStats[mapping.skillCode]) {
          dynamicStats[mapping.skillCode] = { count: 0, core: 0, sec: 0, levels: [] }
        }
        dynamicStats[mapping.skillCode].count += 1
        if (mapping.isCore) {
          dynamicStats[mapping.skillCode].core += 1
        } else {
          dynamicStats[mapping.skillCode].sec += 1
        }
        dynamicStats[mapping.skillCode].levels.push(mapping.targetLevel)
      })
    })

    return MOCK_SFIA_SKILLS_LIBRARY.map((skill) => {
      const base = baselineCounts[skill.code] || { mapped: 2, core: 1, sec: 1 }
      const dyn = dynamicStats[skill.code]

      const mappedOccupationsCount = dyn ? Math.max(base.mapped, dyn.count) : base.mapped
      const coreCount = dyn ? Math.max(base.core, dyn.core) : base.core
      const secondaryCount = Math.max(0, mappedOccupationsCount - coreCount)

      const levels = dyn?.levels.length ? dyn.levels : [skill.minLevel, skill.maxLevel]
      const minTargetLevel = Math.min(...levels)
      const maxTargetLevel = Math.max(...levels)
      const avgTargetLevel = Math.round(
        levels.reduce((acc, curr) => acc + curr, 0) / levels.length
      )

      return {
        code: skill.code,
        name: skill.name,
        category: skill.category,
        mappedOccupationsCount,
        coreCount,
        secondaryCount,
        minTargetLevel,
        maxTargetLevel,
        avgTargetLevel,
      }
    }).sort((a, b) => b.mappedOccupationsCount - a.mappedOccupationsCount)
  },

  /**
   * Lấy danh sách nghề nghiệp được quan tâm và luyện tập nhiều nhất
   */
  async getTopOccupations(params?: {
    groupCode?: string
    query?: string
  }): Promise<OnetTopOccupationItem[]> {
    await sleep(60)

    let items: OnetTopOccupationItem[] = MOCK_OCCUPATIONS.map((occ) => {
      const store = OCCUPATION_DETAILS_STORE[occ.socCode]
      const metrics = MOCK_TOP_METRICS[occ.socCode] || {
        mockInterviewCount: 150,
        jobDescriptionCount: 40,
        majorGroupName: 'Máy tính & Toán học',
      }

      const mappingCount = store ? store.sfiaMappings.length : occ.mappingCount
      const isMapped = mappingCount > 0
      const coreSkillCodes = store
        ? store.sfiaMappings.filter((m) => m.isCore).map((m) => m.skillCode).slice(0, 3)
        : occ.socCode === '15-1252.00'
        ? ['PROG', 'SWDN']
        : occ.socCode === '15-1253.00'
        ? ['TEST', 'METL']
        : occ.socCode === '15-1243.00'
        ? ['DBDS', 'DATM']
        : occ.socCode === '15-1212.00'
        ? ['SCTY', 'VISL']
        : occ.socCode === '15-2051.00'
        ? ['DATM', 'BUSA']
        : ['PROG']

      const group = MOCK_SOC_MAJOR_GROUPS.find((g) => g.code === occ.majorGroupCode)

      return {
        socCode: occ.socCode,
        title: occ.title,
        majorGroupCode: occ.majorGroupCode,
        majorGroupName: group ? group.name : metrics.majorGroupName,
        mockInterviewCount: metrics.mockInterviewCount,
        jobDescriptionCount: metrics.jobDescriptionCount,
        mappingCount,
        isMapped,
        coreSkillCodes,
      }
    })

    // Sắp xếp mặc định theo lượt mock interview giảm dần
    items.sort((a, b) => b.mockInterviewCount - a.mockInterviewCount)

    // Lọc theo Major Group nếu có
    if (params?.groupCode) {
      items = items.filter((item) => item.majorGroupCode === params.groupCode)
    }

    // Lọc theo từ khóa tìm kiếm nếu có
    if (params?.query) {
      const clean = params.query.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.socCode.toLowerCase().includes(clean) ||
          item.title.toLowerCase().includes(clean) ||
          item.majorGroupName.toLowerCase().includes(clean)
      )
    }

    return items
  },
}

/**
 * Bảng số liệu mô phỏng lượt Mock Interview và JD cho các nghề
 */
const MOCK_TOP_METRICS: Record<
  string,
  { mockInterviewCount: number; jobDescriptionCount: number; majorGroupName: string }
> = {
  '15-1252.00': {
    mockInterviewCount: 1420,
    jobDescriptionCount: 385,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1253.00': {
    mockInterviewCount: 890,
    jobDescriptionCount: 210,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-2051.00': {
    mockInterviewCount: 760,
    jobDescriptionCount: 195,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1243.00': {
    mockInterviewCount: 620,
    jobDescriptionCount: 145,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1212.00': {
    mockInterviewCount: 540,
    jobDescriptionCount: 130,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1254.00': {
    mockInterviewCount: 480,
    jobDescriptionCount: 115,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1299.08': {
    mockInterviewCount: 410,
    jobDescriptionCount: 95,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1244.00': {
    mockInterviewCount: 350,
    jobDescriptionCount: 80,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1232.00': {
    mockInterviewCount: 290,
    jobDescriptionCount: 65,
    majorGroupName: 'Máy tính & Toán học',
  },
  '15-1211.00': {
    mockInterviewCount: 240,
    jobDescriptionCount: 55,
    majorGroupName: 'Máy tính & Toán học',
  },
  '11-3021.00': {
    mockInterviewCount: 380,
    jobDescriptionCount: 90,
    majorGroupName: 'Quản lý',
  },
  '13-1111.00': {
    mockInterviewCount: 310,
    jobDescriptionCount: 75,
    majorGroupName: 'Kinh doanh & Vận hành Tài chính',
  },
  '17-2071.00': {
    mockInterviewCount: 260,
    jobDescriptionCount: 60,
    majorGroupName: 'Kiến trúc & Kỹ thuật',
  },
  '27-1024.00': {
    mockInterviewCount: 440,
    jobDescriptionCount: 110,
    majorGroupName: 'Nghệ thuật, Thiết kế & Truyền thông',
  },
}

/**
 * Thư viện Từ điển 25 Kỹ năng SFIA 9 chuẩn Quốc tế
 */
export const MOCK_SFIA_SKILLS_LIBRARY: SfiaSkillDefinition[] = [
  // 1. Phát triển & Kiến trúc Phần mềm
  {
    code: 'PROG',
    name: 'Programming/software development',
    category: 'Phát triển & Triển khai',
    description: 'Thiết kế, lập trình, kiểm thử và cấu hình các giải pháp phần mềm máy tính theo đúng tiêu chuẩn kỹ thuật.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Thực hiện lập trình các đoạn mã đơn giản, tuân thủ quy chuẩn cú pháp và hướng dẫn của cấp trên.',
      3: 'Thiết kế, viết code và chạy test các module phần mềm nhỏ dựa trên tài liệu đặc tả kỹ thuật chi tiết.',
      4: 'Thiết kế, lập trình, cấu hình và kiểm thử các giải pháp phần mềm phức tạp hoặc quy mô lớn.',
      5: 'Đóng vai trò Technical Lead; định hình kiến trúc phần mềm, quy chuẩn kiểm thử và tiêu chuẩn mã nguồn cho toàn đội.',
      6: 'Định hình chiến lược công nghệ phần mềm tổ chức; dẫn dắt việc áp dụng các mô hình kỹ thuật tiên tiến và chính sách kỹ thuật.',
    },
  },
  {
    code: 'SWDN',
    name: 'Software design',
    category: 'Phát triển & Triển khai',
    description: 'Xác định kiến trúc, cấu phần, giao diện và cấu trúc dữ liệu cho hệ thống phần mềm.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Hỗ trợ phác thảo sơ đồ logic và sơ đồ luồng dữ liệu cho các tính năng phần mềm cơ bản.',
      3: 'Thiết kế các component phần mềm độc lập, tuân thủ các pattern kiến trúc đã định sẵn.',
      4: 'Thiết kế cấu trúc hệ thống phần mềm hoàn chỉnh, giải quyết các yêu cầu phi chức năng (bảo mật, chịu tải, mở rộng).',
      5: 'Chủ trì thiết kế kiến trúc cho các hệ sinh thái phần mềm lớn; phê duyệt thiết kế của các nhóm kỹ thuật.',
      6: 'Định hướng tầm nhìn kiến trúc phần mềm doanh nghiệp; giải quyết các thách thức kiến trúc quy mô chiến lược.',
    },
  },
  {
    code: 'TEST',
    name: 'Testing',
    category: 'Phát triển & Triển khai',
    description: 'Hoạch định, thiết kế, quản lý, thực thi và báo cáo các quy trình kiểm thử chất lượng phần mềm.',
    minLevel: 1,
    maxLevel: 6,
    levelDescriptions: {
      1: 'Thực thi các ca kiểm thử thủ công theo kịch bản sẵn có và ghi nhận kết quả lỗi.',
      2: 'Chuẩn bị dữ liệu thử nghiệm và thực hiện các test case định sẵn theo quy trình chuẩn.',
      3: 'Viết Test Plan, thiết kế kịch bản kiểm thử tích hợp và tự động hóa các ca kiểm thử đơn vị/API.',
      4: 'Thiết kế framework kiểm thử tự động toàn diện; phân tích độ bao phủ và tối ưu hóa quy trình QA.',
      5: 'Quản lý toàn bộ chiến lược kiểm thử cho các sản phẩm lớn; tư vấn về tiêu chuẩn chất lượng.',
      6: 'Lãnh đạo năng lực kiểm thử của tổ chức; định hình chuẩn kiểm định chất lượng toàn doanh nghiệp.',
    },
  },
  {
    code: 'DESN',
    name: 'Systems design',
    category: 'Phát triển & Triển khai',
    description: 'Đặc tả và thiết kế giải pháp hệ thống toàn diện đáp ứng các mục tiêu nghiệp vụ cụ thể.',
    minLevel: 4,
    maxLevel: 6,
    levelDescriptions: {
      4: 'Chỉ định và thiết kế cấu trúc hệ thống hoàn chỉnh từ yêu cầu người dùng, cân đối giữa chi phí và hiệu năng.',
      5: 'Đảm bảo tính nhất quán của thiết kế trên toàn bộ các phân hệ; kiểm soát rủi ro kỹ thuật hệ thống.',
      6: 'Định hình phương pháp luận và chuẩn mực thiết kế hệ thống cấp tổ chức.',
    },
  },
  {
    code: 'ARCH',
    name: 'Solution architecture',
    category: 'Chiến lược & Kiến trúc',
    description: 'Thiết lập kiến trúc giải pháp toàn diện kết nối giữa yêu cầu kinh doanh và hạ tầng công nghệ.',
    minLevel: 5,
    maxLevel: 7,
    levelDescriptions: {
      5: 'Chủ trì thiết kế kiến trúc giải pháp cho các sáng kiến số lớn, bảo đảm tính tương thích tổng thể.',
      6: 'Định hình chiến lược kiến trúc giải pháp cho các dòng sản phẩm chủ lực của doanh nghiệp.',
      7: 'Thiết lập định hướng kiến trúc tối cao và chuyển đổi số toàn diện cho tập đoàn.',
    },
  },

  // 2. Dữ liệu, Trí tuệ Nhân tạo & Phân tích
  {
    code: 'DBDS',
    name: 'Database design',
    category: 'Dữ liệu & Phân tích',
    description: 'Thiết kế cấu trúc dữ liệu mức khái niệm, logic và vật lý cho các hệ thống lưu trữ cơ sở dữ liệu.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Hỗ trợ thiết kế sơ đồ thực thể mối quan hệ (ERD) và chuẩn hóa bảng dữ liệu cơ bản.',
      3: 'Thiết kế mô hình dữ liệu logic và vật lý cho các ứng dụng vừa và nhỏ.',
      4: 'Thiết kế kiến trúc cơ sở dữ liệu quy mô lớn, tối ưu hóa chỉ mục và cấu trúc phân vùng dữ liệu.',
      5: 'Định hình chiến lược thiết kế cơ sở dữ liệu phân tán, High-Availability và Data Lakehouse.',
      6: 'Thiết lập chuẩn mực quản trị mô hình dữ liệu và chính sách kiến trúc dữ liệu toàn tổ chức.',
    },
  },
  {
    code: 'DATM',
    name: 'Data management',
    category: 'Dữ liệu & Phân tích',
    description: 'Quản trị vòng đời dữ liệu, đảm bảo tính toàn vẹn, bảo mật và chất lượng dữ liệu của tổ chức.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Thực hiện các quy trình nhập liệu, kiểm tra tính hợp lệ và sao lưu dữ liệu cơ bản.',
      3: 'Xây dựng quy trình làm sạch dữ liệu và bảo đảm tuân thủ các quy tắc dữ liệu nội bộ.',
      4: 'Triển khai các chính sách quản trị dữ liệu (Data Governance) và giám sát chất lượng dữ liệu.',
      5: 'Thiết kế khung quản trị dữ liệu lớn và chiến lược khai thác tài sản dữ liệu.',
      6: 'Định hình chiến lược dữ liệu tối cao và chính sách bảo vệ dữ liệu xuyên biên giới.',
    },
  },
  {
    code: 'VISL',
    name: 'Data visualisation',
    category: 'Dữ liệu & Phân tích',
    description: 'Biểu diễn dữ liệu phức tạp thành các biểu đồ trực quan, bảng điều khiển (Dashboard) hỗ trợ ra quyết định.',
    minLevel: 2,
    maxLevel: 5,
    levelDescriptions: {
      2: 'Tạo các biểu đồ và báo cáo dữ liệu định dạng chuẩn từ các tập dữ liệu có sẵn.',
      3: 'Thiết kế và xây dựng các báo cáo tương tác, áp dụng nguyên lý thiết kế đồ họa dữ liệu tốt.',
      4: 'Phát triển các dashboard phân tích chuyên sâu cho các cấp quản lý cấp cao.',
      5: 'Định hướng chiến lược trực quan hóa dữ liệu và xây dựng văn hóa ra quyết định dựa trên dữ liệu.',
    },
  },
  {
    code: 'DATS',
    name: 'Data science & machine learning',
    category: 'Dữ liệu & Phân tích',
    description: 'Áp dụng các kỹ thuật toán học, thống kê và mô hình học máy để trích xuất tri thức từ dữ liệu lớn.',
    minLevel: 3,
    maxLevel: 7,
    levelDescriptions: {
      3: 'Thực hiện tiền xử lý dữ liệu và áp dụng các thuật toán máy học cơ bản dưới sự giám sát.',
      4: 'Xây dựng, huấn luyện và đánh giá các mô hình học máy phức tạp; tối ưu hóa siêu tham số.',
      5: 'Chủ trì nghiên cứu và phát triển các mô hình AI/ML hiện đại phục vụ sản phẩm cốt lõi.',
      6: 'Định hướng nghiên cứu khoa học dữ liệu và đầu tư công nghệ AI của doanh nghiệp.',
      7: 'Thiết lập tầm nhìn chiến lược AI/GenAI cấp cao nhất cho toàn bộ hệ sinh thái kinh doanh.',
    },
  },
  {
    code: 'INAN',
    name: 'Analytics and insights',
    category: 'Dữ liệu & Phân tích',
    description: 'Khai phá dữ liệu nghiệp vụ để phát hiện xu hướng, mô hình hành vi và đưa ra khuyến nghị giá trị.',
    minLevel: 3,
    maxLevel: 6,
    levelDescriptions: {
      3: 'Thực hiện phân tích mô tả và báo cáo số liệu vận hành định kỳ cho các phòng ban.',
      4: 'Thực hiện phân tích suy luận, dự báo xu hướng và đề xuất giải pháp cải thiện kinh doanh.',
      5: 'Chủ trì các dự án phân tích chuyên sâu đa chiều; cố vấn cho ban điều hành.',
      6: 'Xây dựng chiến lược phân tích nghiệp vụ và nâng cao năng lực khai phá dữ liệu toàn công ty.',
    },
  },

  // 3. Hạ tầng, Đám mây & Vận hành
  {
    code: 'ITOP',
    name: 'IT infrastructure',
    category: 'Vận hành & Phân phối',
    description: 'Cung cấp, cấu hình và bảo trì hạ tầng công nghệ thông tin gồm máy chủ, đám mây, mạng và lưu trữ.',
    minLevel: 1,
    maxLevel: 5,
    levelDescriptions: {
      1: 'Hỗ trợ các tác vụ vận hành hạ tầng cơ bản và kiểm tra phần cứng thiết bị.',
      2: 'Cài đặt và cấu hình các máy chủ, thiết bị mạng hoặc tài nguyên đám mây theo hướng dẫn.',
      3: 'Vận hành, giám sát hiệu năng và khắc phục sự cố hệ thống hạ tầng CNTT.',
      4: 'Thiết kế và triển khai kiến trúc hạ tầng đám mây (Cloud Infrastructure) có khả năng tự phục hồi.',
      5: 'Hoạch định chiến lược hạ tầng công nghệ toàn diện; quản lý danh mục nhà cung cấp Cloud.',
    },
  },
  {
    code: 'DEVO',
    name: 'Release and deployment / DevOps',
    category: 'Vận hành & Phân phối',
    description: 'Xây dựng và tự động hóa quy trình đóng gói, kiểm thử và phát hành phần mềm liên tục (CI/CD).',
    minLevel: 3,
    maxLevel: 6,
    levelDescriptions: {
      3: 'Bảo trì và thực thi các kịch bản build/deploy tự động cho các bản phát hành Sprint.',
      4: 'Thiết kế và tối ưu hóa toàn diện pipeline CI/CD; quản lý cấu hình hạ tầng dưới dạng mã (IaC).',
      5: 'Chủ trì kiến trúc phân phối phần mềm liên tục quy mô lớn; đảm bảo Zero-downtime Deployment.',
      6: 'Định hình văn hóa DevOps/Platform Engineering và chuẩn mực phát hành toàn tổ chức.',
    },
  },
  {
    code: 'SCAD',
    name: 'Security administration',
    category: 'Vận hành & Phân phối',
    description: 'Quản trị các cơ chế kiểm soát bảo mật, phân quyền truy cập và giám sát tuân thủ an toàn.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Thực hiện cấp phát quyền truy cập và tài khoản người dùng theo chính sách bảo mật.',
      3: 'Cấu hình và duy trì các công cụ bảo mật (tường lửa, phần mềm quét mã độc, quản lý khóa).',
      4: 'Giám sát hệ thống an ninh mạng, phát hiện và phản ứng với các hành vi truy cập trái phép.',
      5: 'Chủ trì quản trị an ninh cho các hệ thống trọng yếu; thiết lập chính sách Zero-Trust.',
      6: 'Định hình kiến trúc quản trị an ninh tổng thể và tiêu chuẩn bảo vệ tài sản số.',
    },
  },
  {
    code: 'ASUP',
    name: 'Application support',
    category: 'Vận hành & Phân phối',
    description: 'Cung cấp dịch vụ hỗ trợ chuyên sâu và khắc phục lỗi vận hành cho các ứng dụng phần mềm đang chạy.',
    minLevel: 2,
    maxLevel: 5,
    levelDescriptions: {
      2: 'Tiếp nhận yêu cầu hỗ trợ, phân loại sự cố và thực hiện các bước khắc phục lỗi cơ bản.',
      3: 'Điều tra nguyên nhân gốc rễ (Root Cause Analysis) của các lỗi ứng dụng và đề xuất bản vá.',
      4: 'Quản lý thỏa thuận mức dịch vụ (SLA) và tối ưu hóa độ ổn định của ứng dụng trọng yếu.',
      5: 'Định hình chiến lược hỗ trợ ứng dụng cấp doanh nghiệp và chính sách bảo trì vòng đời.',
    },
  },
  {
    code: 'NTAS',
    name: 'Network support & administration',
    category: 'Vận hành & Phân phối',
    description: 'Vận hành, cấu hình và bảo đảm hiệu năng cũng như tính sẵn sàng của hạ tầng mạng máy tính.',
    minLevel: 2,
    maxLevel: 5,
    levelDescriptions: {
      2: 'Kiểm tra cáp kết nối, cấu hình switch/router cơ bản theo thông số kỹ thuật định sẵn.',
      3: 'Giám sát lưu lượng mạng, phát hiện tắc nghẽn và cấu hình các dịch vụ mạng (DNS, DHCP, VPN).',
      4: 'Thiết kế phân vùng mạng an toàn, tối ưu hóa giao thức định tuyến cho hệ thống phân tán.',
      5: 'Chủ trì chiến lược hạ tầng mạng diện rộng (WAN/SD-WAN) và kết nối Hybrid Cloud.',
    },
  },

  // 4. An ninh Thông tin & Bảo mật
  {
    code: 'SCTY',
    name: 'Information security',
    category: 'An ninh Thông tin',
    description: 'Bảo vệ thông tin và các hệ thống số khỏi các rủi ro, mối đe dọa an ninh mạng và rò rỉ dữ liệu.',
    minLevel: 2,
    maxLevel: 7,
    levelDescriptions: {
      2: 'Hỗ trợ kiểm tra tuân thủ các quy định bảo mật cơ bản trong hoạt động hàng ngày.',
      3: 'Thực hiện đánh giá rủi ro an ninh thông tin cho các quy trình nghiệp vụ cục bộ.',
      4: 'Thiết kế các biện pháp kiểm soát an ninh thông tin cho hệ thống mới; điều tra sự cố bảo mật.',
      5: 'Chủ trì chiến lược quản lý rủi ro an ninh mạng; thiết lập chính sách tuân thủ chuẩn ISO 27001.',
      6: 'Định hình chiến lược phòng thủ an ninh mạng tổng thể cho toàn bộ doanh nghiệp (CISO).',
      7: 'Lãnh đạo an ninh mạng cấp tập đoàn; cố vấn an ninh tối cao cho Hội đồng Quản trị.',
    },
  },
  {
    code: 'VUNR',
    name: 'Vulnerability assessment',
    category: 'An ninh Thông tin',
    description: 'Dò quét, phân tích và đánh giá các lỗ hổng bảo mật trên mã nguồn, ứng dụng và hạ tầng mạng.',
    minLevel: 3,
    maxLevel: 6,
    levelDescriptions: {
      3: 'Sử dụng các công cụ tự động để quét lỗ hổng và lập báo cáo kỹ thuật ban đầu.',
      4: 'Thực hiện kiểm thử xâm nhập (Penetration Testing) có đạo đức để phát hiện lỗ hổng tiềm ẩn.',
      5: 'Xây dựng chương trình quản lý lỗ hổng bảo mật liên tục; tư vấn vá lỗi cho các đội phát triển.',
      6: 'Định hình chiến lược kiểm định bảo mật chủ động cho các nền tảng kỹ thuật số của tổ chức.',
    },
  },
  {
    code: 'INCD',
    name: 'Incident management',
    category: 'Vận hành & Phân phối',
    description: 'Điều phối phản ứng, xử lý và khôi phục dịch vụ nhanh nhất sau khi xảy ra sự cố CNTT.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Ghi nhận, phân loại và chuyển tiếp các sự cố kỹ thuật theo đúng quy trình phân cấp.',
      3: 'Chủ trì xử lý các sự cố vừa; giao tiếp với người dùng về tiến độ khôi phục dịch vụ.',
      4: 'Điều phối đội đặc nhiệm xử lý sự cố nghiêm trọng (Major Incident); lập báo cáo Post-Mortem.',
      5: 'Thiết lập quy trình ứng phó khẩn cấp và diễn tập sự cố (Disaster Recovery Drill) định kỳ.',
      6: 'Định hình khung chiến lược quản lý khủng hoảng CNTT và tính liên tục trong kinh doanh.',
    },
  },

  // 5. Quản trị Dự án & Đảm bảo Chất lượng
  {
    code: 'PRMG',
    name: 'Project management',
    category: 'Quản lý & Lãnh đạo',
    description: 'Lập kế hoạch, theo dõi, điều phối tài nguyên và quản lý rủi ro để hoàn thành dự án công nghệ.',
    minLevel: 4,
    maxLevel: 7,
    levelDescriptions: {
      4: 'Quản lý các dự án công nghệ vừa; kiểm soát tiến độ, phạm vi và ngân sách dự án.',
      5: 'Chủ trì các chương trình chuyển đổi lớn; quản lý xung đột và kỳ vọng của các bên liên quan.',
      6: 'Quản trị danh mục dự án chiến lược (Portfolio Management) cấp tổ chức.',
      7: 'Định hướng chiến lược phân bổ nguồn lực và đầu tư công nghệ tối cao cho doanh nghiệp.',
    },
  },
  {
    code: 'QUAS',
    name: 'Quality assurance',
    category: 'Đảm bảo Chất lượng',
    description: 'Thiết lập các quy trình, tiêu chuẩn và kiểm toán để bảo đảm sản phẩm đáp ứng kỳ vọng chất lượng.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Thu thập số liệu đo lường chất lượng và hỗ trợ đánh giá tuân thủ quy trình.',
      3: 'Thực hiện kiểm toán quy trình nội bộ và hướng dẫn đội ngũ tuân thủ chuẩn chất lượng.',
      4: 'Thiết kế hệ thống quản lý chất lượng (QMS) cho các dự án phát triển phần mềm.',
      5: 'Chủ trì chiến lược đảm bảo chất lượng toàn diện; đạt các chứng chỉ chất lượng quốc tế.',
      6: 'Định hình tầm nhìn chất lượng sản phẩm và sự hoàn hảo trong kỹ nghệ toàn công ty.',
    },
  },
  {
    code: 'BUSA',
    name: 'Business situation analysis',
    category: 'Chiến lược & Phân tích',
    description: 'Khảo sát và phân tích bối cảnh kinh doanh để xác định cơ hội cải tiến và giải pháp công nghệ.',
    minLevel: 3,
    maxLevel: 6,
    levelDescriptions: {
      3: 'Thu thập và làm rõ các yêu cầu nghiệp vụ chi tiết từ người dùng cuối.',
      4: 'Mô hình hóa quy trình nghiệp vụ hiện tại (As-Is) và đề xuất thiết kế quy trình tương lai (To-Be).',
      5: 'Dẫn dắt phân tích chiến lược cho các bài toán kinh doanh phức tạp; đánh giá tính khả thi.',
      6: 'Định hình chiến lược kiến trúc nghiệp vụ doanh nghiệp (Business Architecture).',
    },
  },
  {
    code: 'METL',
    name: 'Methods and tools',
    category: 'Phát triển & Triển khai',
    description: 'Nghiên cứu, lựa chọn, triển khai và tối ưu hóa các phương pháp luận và công cụ kỹ thuật phần mềm.',
    minLevel: 2,
    maxLevel: 6,
    levelDescriptions: {
      2: 'Hỗ trợ cấu hình các công cụ phát triển phần mềm theo hướng dẫn kỹ thuật chuẩn.',
      3: 'Cung cấp hướng dẫn sử dụng và hỗ trợ kỹ thuật cho các công cụ lập trình/kiểm thử.',
      4: 'Đánh giá, lựa chọn và tích hợp các công cụ kỹ thuật mới vào quy trình làm việc của đội ngũ.',
      5: 'Chủ trì chiến lược phương pháp luận phát triển (Agile/Scrum/DevOps) và bộ công cụ kỹ thuật số.',
      6: 'Định hình tiêu chuẩn thực hành kỹ nghệ phần mềm xuất sắc trên toàn doanh nghiệp.',
    },
  },

  // 6. Chiến lược & Lãnh đạo
  {
    code: 'STPL',
    name: 'Strategic planning',
    category: 'Chiến lược & Kiến trúc',
    description: 'Hoạch định chiến lược công nghệ thông tin dài hạn phù hợp với mục tiêu kinh doanh của tổ chức.',
    minLevel: 5,
    maxLevel: 7,
    levelDescriptions: {
      5: 'Đóng góp vào việc xây dựng kế hoạch chiến lược công nghệ cho các khối nghiệp vụ trọng điểm.',
      6: 'Chủ trì soạn thảo chiến lược chuyển đổi số và lộ trình công nghệ dài hạn của doanh nghiệp.',
      7: 'Quyết định chiến lược công nghệ và tầm nhìn đổi mới sáng tạo tối cao cho tập đoàn.',
    },
  },
  {
    code: 'ITMG',
    name: 'IT management',
    category: 'Quản lý & Lãnh đạo',
    description: 'Quản lý tổng thể việc cung cấp các dịch vụ công nghệ thông tin và hạ tầng cho doanh nghiệp.',
    minLevel: 5,
    maxLevel: 7,
    levelDescriptions: {
      5: 'Quản lý hoạt động hàng ngày của một khối công nghệ hoặc trung tâm phát triển phần mềm.',
      6: 'Điều hành toàn bộ bộ máy công nghệ thông tin; quản trị ngân sách và nhân sự cấp cao (CIO).',
      7: 'Định hình chiến lược công nghệ tối cao trong Hội đồng Quản trị.',
    },
  },
  {
    code: 'ETMG',
    name: 'Engineering leadership & management',
    category: 'Quản lý & Lãnh đạo',
    description: 'Lãnh đạo, phát triển đội ngũ kỹ sư và xây dựng văn hóa kỹ nghệ phần mềm xuất sắc.',
    minLevel: 5,
    maxLevel: 7,
    levelDescriptions: {
      5: 'Lãnh đạo trực tiếp các Engineering Managers và Tech Leads; xây dựng lộ trình thăng tiến.',
      6: 'Định hình cơ cấu tổ chức kỹ thuật, chính sách tuyển dụng và phát triển nhân tài công nghệ (VP of Eng).',
      7: 'Lãnh đạo toàn bộ cộng đồng kỹ sư toàn cầu; cố vấn chiến lược công nghệ cao cho CEO.',
    },
  },
]

/**
 * Bản sao lưu dữ liệu gốc để hỗ trợ hàm resetSfiaMappings
 */
const ORIGINAL_MOCK_DETAILS: Record<string, OnetOccupationDetail> = JSON.parse(
  JSON.stringify(MOCK_OCCUPATION_DETAILS)
)

/**
 * Kho lưu trữ trạng thái Mutable Mock State của ứng dụng
 */
const OCCUPATION_DETAILS_STORE: Record<string, OnetOccupationDetail> = JSON.parse(
  JSON.stringify(MOCK_OCCUPATION_DETAILS)
)

