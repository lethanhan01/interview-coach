export const POSITION_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full-stack Developer',
  'Mobile Developer (iOS)',
  'Mobile Developer (Android)',
  'Flutter Developer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Engineer',
  'Security Engineer',
  'Data Analyst',
  'Data Engineer',
  'Data Scientist',
  'AI/ML Engineer',
  'AI Engineer',
  'MLOps Engineer',
  'Database Administrator',
  'System Administrator',
  'QA/Tester',
  'Game Developer',
  'Embedded Engineer',
  'UI/UX Designer',
  'Business Analyst',
  'Product Manager',
  'Project Manager',
  'Scrum Master',
  'Solution Architect',
  'ERP/CRM Consultant',
  'Technical Writer',
]

export const JD_LEVEL_OPTIONS = [
  { value: 'intern' as const, label: 'Intern / Thực tập sinh' },
  { value: 'fresher' as const, label: 'Fresher' },
  { value: 'junior' as const, label: 'Junior' },
  { value: 'middle' as const, label: 'Middle' },
  { value: 'senior' as const, label: 'Senior' },
  { value: 'lead' as const, label: 'Lead / Principal' },
] as const

export type JdLevel = (typeof JD_LEVEL_OPTIONS)[number]['value']

export const BONUS_OPTIONS = [
  'Tháng 13 (1 lần/năm)',
  '2 lần/năm',
  'Hàng quý',
  'Theo KPI',
  'Linh hoạt',
  'Không có',
]

export const TECH_STACK_OPTIONS: Record<string, string[]> = {
  Frontend: [
    'React',
    'Next.js',
    'Vue.js',
    'Nuxt.js',
    'Angular',
    'Svelte',
    'Astro',
    'Remix',
    'TypeScript',
    'JavaScript',
    'HTML/CSS',
    'Tailwind CSS',
    'Bootstrap',
    'Material UI',
    'Shadcn/ui',
    'Redux',
    'TanStack Query',
    'Vite',
    'Webpack',
  ],
  Backend: [
    'Node.js',
    'Express',
    'NestJS',
    'Fastify',
    'Java',
    'Spring Boot',
    'C#',
    'ASP.NET Core',
    'Python',
    'Django',
    'FastAPI',
    'Flask',
    'Go',
    'Gin',
    'PHP',
    'Laravel',
    'Ruby on Rails',
    'Rust',
    'Axum',
    'GraphQL',
    'REST API',
    'gRPC',
    'Microservices',
  ],
  Mobile: [
    'React Native',
    'Flutter',
    'Swift',
    'SwiftUI',
    'Objective-C',
    'Kotlin',
    'Java Android',
    'Android SDK',
    'Jetpack Compose',
    'iOS SDK',
    'Xcode',
    'Android Studio',
    'Firebase',
    'Expo',
  ],
  'Data / AI': [
    'Python',
    'SQL',
    'R',
    'Pandas',
    'NumPy',
    'scikit-learn',
    'TensorFlow',
    'PyTorch',
    'Keras',
    'Spark',
    'Airflow',
    'dbt',
    'Kafka',
    'Snowflake',
    'BigQuery',
    'Databricks',
    'Power BI',
    'Tableau',
    'LangChain',
    'LangGraph',
    'RAG',
    'Vector Database',
    'OpenAI API',
    'Hugging Face',
  ],
  Database: [
    'PostgreSQL',
    'MySQL',
    'SQLite',
    'SQL Server',
    'Oracle',
    'MongoDB',
    'Redis',
    'Elasticsearch',
    'OpenSearch',
    'DynamoDB',
    'Cassandra',
    'Neo4j',
    'Supabase',
    'Firebase/Firestore',
    'ClickHouse',
    'InfluxDB',
  ],
  'Cloud / DevOps / SRE': [
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'Google Cloud',
    'Cloudflare',
    'Terraform',
    'Ansible',
    'Helm',
    'Nginx',
    'Linux',
    'CI/CD',
    'GitHub Actions',
    'GitLab CI',
    'Jenkins',
    'Argo CD',
    'Prometheus',
    'Grafana',
    'Datadog',
    'New Relic',
    'ELK Stack',
  ],
  'QA / Testing': [
    'Manual Testing',
    'Automation Testing',
    'Selenium',
    'Playwright',
    'Cypress',
    'Jest',
    'Vitest',
    'JUnit',
    'Pytest',
    'Postman',
    'Swagger/OpenAPI',
    'JMeter',
    'k6',
    'Appium',
    'TestRail',
  ],
  Security: [
    'OWASP',
    'DevSecOps',
    'IAM',
    'OAuth2/OIDC',
    'SSO',
    'JWT',
    'SAST',
    'DAST',
    'SonarQube',
    'Burp Suite',
    'ZAP',
    'SIEM',
    'WAF',
    'Vulnerability Assessment',
    'Penetration Testing',
  ],
  'Game / 3D / XR': [
    'Unity',
    'Unreal Engine',
    'C#',
    'C++',
    'Godot',
    'GDScript',
    'OpenGL',
    'WebGL',
    'Three.js',
    'Blender',
    'ARKit',
    'ARCore',
    'visionOS',
  ],
  'Embedded / IoT / Systems': [
    'C',
    'C++',
    'Rust',
    'Embedded Linux',
    'RTOS',
    'FreeRTOS',
    'ARM',
    'STM32',
    'Arduino',
    'Raspberry Pi',
    'ESP32',
    'MQTT',
    'CAN Bus',
    'MicroPython',
  ],
  'Enterprise / ERP / Low-code': [
    'SAP',
    'Salesforce',
    'ServiceNow',
    'Odoo',
    'Microsoft Dynamics',
    'Power Platform',
    'SharePoint',
    'WordPress',
    'Drupal',
  ],
  'Tools / Collaboration': [
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'Jira',
    'Confluence',
    'Notion',
    'Slack',
    'Figma',
    'Miro',
    'Markdown',
  ],
}

export const TECH_CATEGORIES = [
  { key: 'language' as const, label: 'Ngôn ngữ lập trình' },
  { key: 'framework' as const, label: 'Framework / Library' },
  { key: 'os' as const, label: 'Hệ điều hành' },
  { key: 'database' as const, label: 'Cơ sở dữ liệu' },
  { key: 'platform' as const, label: 'Platform / Cloud' },
  { key: 'devtool' as const, label: 'Dev Management Tools' },
] as const

export type TechCategory = (typeof TECH_CATEGORIES)[number]['key']

const TECH_SET = new Set(Object.values(TECH_STACK_OPTIONS).flat())

function pickTechOptions(options: string[]): string[] {
  return options.filter((option) => TECH_SET.has(option))
}

export const TECH_OPTIONS: Record<TechCategory, string[]> = {
  language: pickTechOptions([
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'Go',
    'Rust',
    'C',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin',
    'SQL',
    'R',
    'GDScript',
  ]),
  framework: pickTechOptions([
    'React',
    'Next.js',
    'Vue.js',
    'Nuxt.js',
    'Angular',
    'Svelte',
    'Astro',
    'Remix',
    'NestJS',
    'Express',
    'Fastify',
    'Django',
    'FastAPI',
    'Flask',
    'Spring Boot',
    'ASP.NET Core',
    'Laravel',
    'Ruby on Rails',
    'Flutter',
    'React Native',
    'SwiftUI',
    'Jetpack Compose',
    'Unity',
    'Unreal Engine',
    'Pandas',
    'NumPy',
    'scikit-learn',
    'TensorFlow',
    'PyTorch',
  ]),
  os: pickTechOptions(['Linux', 'Embedded Linux', 'RTOS', 'FreeRTOS']),
  database: pickTechOptions([
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'SQLite',
    'SQL Server',
    'Oracle',
    'Supabase',
    'Firebase/Firestore',
    'DynamoDB',
    'Elasticsearch',
    'OpenSearch',
    'Cassandra',
    'Neo4j',
    'ClickHouse',
    'InfluxDB',
    'Vector Database',
  ]),
  platform: pickTechOptions([
    'AWS',
    'Google Cloud',
    'Azure',
    'Cloudflare',
    'Docker',
    'Kubernetes',
    'Terraform',
    'Ansible',
    'Helm',
    'Salesforce',
    'SAP',
    'ServiceNow',
    'Power Platform',
    'OpenAI API',
    'Hugging Face',
  ]),
  devtool: pickTechOptions([
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'Jira',
    'Confluence',
    'Notion',
    'Slack',
    'Jenkins',
    'GitHub Actions',
    'GitLab CI',
    'Argo CD',
    'Prometheus',
    'Grafana',
    'Datadog',
    'New Relic',
    'Postman',
    'Swagger/OpenAPI',
    'Playwright',
    'Cypress',
    'Selenium',
    'Figma',
    'Miro',
  ]),
}

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function normalizeOptionToken(value: unknown): string {
  return text(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
}

const LEGACY_POSITION_ALIASES: Record<string, string> = {
  frontend: 'Frontend Developer',
  backend: 'Backend Developer',
  fullstack: 'Full-stack Developer',
  'full stack': 'Full-stack Developer',
  'fullstack developer': 'Full-stack Developer',
  'full stack developer': 'Full-stack Developer',
  mobile: 'Mobile Developer (iOS)',
  'mobile developer': 'Mobile Developer (iOS)',
  devops: 'DevOps Engineer',
  sre: 'Site Reliability Engineer',
  cloud: 'Cloud Engineer',
  security: 'Security Engineer',
  data: 'Data Engineer',
  'data engineer analyst': 'Data Engineer',
  'data scientist': 'Data Scientist',
  ml: 'AI/ML Engineer',
  'machine learning engineer': 'AI/ML Engineer',
  ai: 'AI Engineer',
  mlops: 'MLOps Engineer',
  dba: 'Database Administrator',
  sysadmin: 'System Administrator',
  qa: 'QA/Tester',
  'qa engineer': 'QA/Tester',
  tester: 'QA/Tester',
  game: 'Game Developer',
  embedded: 'Embedded Engineer',
  pm: 'Product Manager',
  'project manager': 'Project Manager',
  'scrum master': 'Scrum Master',
  'solution architect': 'Solution Architect',
  'erp crm': 'ERP/CRM Consultant',
  'technical writer': 'Technical Writer',
  designer: 'UI/UX Designer',
}

export function normalizePosition(value: unknown): string {
  const raw = text(value).trim()
  if (!raw) return ''

  if (POSITION_OPTIONS.includes(raw)) return raw

  const normalized = normalizeOptionToken(raw)
  const exact = POSITION_OPTIONS.find((option) => normalizeOptionToken(option) === normalized)
  if (exact) return exact

  return LEGACY_POSITION_ALIASES[normalized] ?? raw
}

export function getPositionLabel(value: unknown): string {
  return normalizePosition(value)
}

export function getJdLevelLabel(level: string): string {
  return JD_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level
}

export function normalizeJdLevel(value: unknown): string {
  const raw = text(value).trim()
  if (!raw) return ''

  const normalized = normalizeOptionToken(raw)

  for (const option of JD_LEVEL_OPTIONS) {
    const candidates = [
      option.value,
      option.label,
      ...option.label.split('/').map((part) => part.trim()),
    ]

    if (candidates.some((candidate) => normalizeOptionToken(candidate) === normalized)) {
      return option.value
    }
  }

  const aliases: Record<string, JdLevel> = {
    'entry level': 'intern',
    entrylevel: 'intern',
    fresher: 'fresher',
    intern: 'intern',
    internship: 'intern',
    'junior 1y': 'junior',
    'junior 1 year': 'junior',
    'junior 2y': 'junior',
    'junior 2 years': 'junior',
    'junior developer': 'junior',
    lead: 'lead',
    'lead principal': 'lead',
    middle: 'middle',
    'middle level': 'middle',
    'middle developer': 'middle',
    mid: 'middle',
    'mid level': 'middle',
    midlevel: 'middle',
    principal: 'lead',
    'principal engineer': 'lead',
    senior: 'senior',
    'senior developer': 'senior',
    'thuc tap sinh': 'intern',
    fresh: 'fresher',
  }

  return aliases[normalized] ?? ''
}
