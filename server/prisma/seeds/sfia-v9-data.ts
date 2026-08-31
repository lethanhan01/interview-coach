export interface SfiaCategoryData {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  subcategories: {
    code: string;
    name: string;
    description: string;
    displayOrder: number;
  }[];
}

export interface SfiaLevelData {
  rank: number;
  code: string;
  name: string;
  autonomy: string;
  influence: string;
  complexity: string;
  businessSkills: string;
  knowledge: string;
  description: string;
}

export interface SfiaSkillData {
  code: string;
  name: string;
  subcategoryCode: string;
  overallDescription: string;
  guidanceNotes: string;
  levels: {
    levelRank: number;
    code: string;
    name: string;
    levelDescription: string;
    behavioralIndicators?: string[];
  }[];
}

export interface SfiaRoleData {
  code: string;
  name: string;
  description: string;
  skills: {
    skillCode: string;
    targetLevelRank: number;
    defaultWeight: number;
    priority: number;
  }[];
}

export interface SfiaSkillMappingData {
  skillName: string;
  skillCode: string;
  relevanceWeight: number;
}

export const SFIA_9_CATEGORIES: SfiaCategoryData[] = [
  {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    description: 'Strategy, architecture and business alignment across digital, data and technology.',
    displayOrder: 1,
    subcategories: [
      {
        code: 'STRAT_PLAN',
        name: 'Strategy and planning',
        description: 'Development and execution of technology and digital strategy.',
        displayOrder: 1,
      },
      {
        code: 'ARCH_DESIGN',
        name: 'Architecture and design',
        description: 'Enterprise, solution and technical systems design and architecture.',
        displayOrder: 2,
      },
    ],
  },
  {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    description: 'Developing, testing and implementing digital products and engineering solutions.',
    displayOrder: 2,
    subcategories: [
      {
        code: 'SYS_DEV',
        name: 'Systems development',
        description: 'Software engineering, programming, user experience and database design.',
        displayOrder: 1,
      },
      {
        code: 'DATA_ANALYTICS',
        name: 'Data and analytics',
        description: 'Data engineering, data science, data modeling and business intelligence.',
        displayOrder: 2,
      },
      {
        code: 'SEC_PRIVACY',
        name: 'Security and privacy',
        description: 'Cyber security, vulnerability management, security testing and privacy.',
        displayOrder: 3,
      },
    ],
  },
  {
    code: 'DELIV_OP',
    name: 'Delivery and operation',
    description: 'Service delivery, infrastructure management, DevOps and operational excellence.',
    displayOrder: 3,
    subcategories: [
      {
        code: 'SERV_OP',
        name: 'Service operation and DevOps',
        description: 'Incident management, release management, cloud operations and observability.',
        displayOrder: 1,
      },
    ],
  },
];

export const SFIA_9_LEVELS: SfiaLevelData[] = [
  {
    rank: 1,
    code: 'LEVEL_1',
    name: 'Level 1 - Follow',
    autonomy: 'Works under close supervision. Uses little discretion. Is expected to seek guidance in unexpected situations.',
    influence: 'Minimal influence. Interacts with immediate colleagues.',
    complexity: 'Performs routine activities in a structured environment. Requires assistance in resolving unexpected problems.',
    businessSkills: 'Uses basic systems and applications. Communicates clearly in written and oral form.',
    knowledge: 'Applies basic knowledge in a restricted area of expertise.',
    description: 'Entry level, internship or direct supervision required.',
  },
  {
    rank: 2,
    code: 'LEVEL_2',
    name: 'Level 2 - Assist',
    autonomy: 'Works under routine direction. Uses limited discretion in resolving issues or enquiries. Works without frequent reference to others.',
    influence: 'Interacts with and may influence immediate colleagues. May have some external contact with customers, suppliers and partners.',
    complexity: 'Performs a range of work activities in varied environments. May contribute to routine problem resolution.',
    businessSkills: 'Understands and uses appropriate methods, tools and applications. Demonstrates a rational and organized approach to work.',
    knowledge: 'Applies standard knowledge related to the field of work.',
    description: 'Junior level practitioner with fundamental execution skills.',
  },
  {
    rank: 3,
    code: 'LEVEL_3',
    name: 'Level 3 - Apply',
    autonomy: 'Works under general direction. Receives specific assignments and reviews. Has discretion to determine appropriate actions.',
    influence: 'Interacts with and influences team members and internal stakeholders. Participates in external forums.',
    complexity: 'Performs a varied range of non-routine, complex activities in diverse contexts. Analyzes and resolves problems.',
    businessSkills: 'Demonstrates effective communication skills. Plans, schedules and monitors own work competently.',
    knowledge: 'Has broad factual and theoretical knowledge in professional discipline.',
    description: 'Mid-level autonomous professional.',
  },
  {
    rank: 4,
    code: 'LEVEL_4',
    name: 'Level 4 - Enable',
    autonomy: 'Works under general direction within a clear framework of accountability. Exercises substantial personal responsibility.',
    influence: 'Influences team, project partners and stakeholders at similar or higher levels. Contributes to decisions.',
    complexity: 'Executes complex technical or professional activities. Investigates and evaluates complex problems and alternative solutions.',
    businessSkills: 'Communicates fluently orally and in writing. Selects appropriately from applicable standards, methods, tools and applications.',
    knowledge: 'Maintains a thorough understanding of recognized professional field.',
    description: 'Senior engineer / squad lead enabling others.',
  },
  {
    rank: 5,
    code: 'LEVEL_5',
    name: 'Level 5 - Ensure / Advise',
    autonomy: 'Works under broad direction. Work is often self-initiated. Fully responsible for meeting technical, project or supervisory objectives.',
    influence: 'Influences organization, customers, suppliers, partners and peers on the contribution of own specialism.',
    complexity: 'Performs highly complex work activities covering technical, financial and quality aspects.',
    businessSkills: 'Advises on the available standards, methods, tools and applications. Leads technical decisions and mentors teams.',
    knowledge: 'Demonstrates deep domain mastery and awareness of industry trends.',
    description: 'Lead / Principal engineer / Architect guiding teams and architectural direction.',
  },
  {
    rank: 6,
    code: 'LEVEL_6',
    name: 'Level 6 - Initiate / Influence',
    autonomy: 'Has defined authority and accountability for actions and decisions within a significant area of work.',
    influence: 'Influences policy and strategy formation. Makes decisions critical to organizational success.',
    complexity: 'Leads large-scale, highly complex, strategic or multidisciplinary initiatives.',
    businessSkills: 'Demonstrates strategic leadership, executive communication and financial accountability.',
    knowledge: 'Recognized industry expert and thought leader.',
    description: 'Staff / Principal Architect / Engineering Director.',
  },
  {
    rank: 7,
    code: 'LEVEL_7',
    name: 'Level 7 - Set strategy / Inspire',
    autonomy: 'Has full authority and accountability across the whole organization or business unit.',
    influence: 'Makes decisions having significant impact across the entire enterprise and industry.',
    complexity: 'Leads the highest level of strategic, organizational and cultural transformation.',
    businessSkills: 'Inspires organizations, drives vision and cultivates innovation.',
    knowledge: 'Sets authoritative industry-wide strategy and direction.',
    description: 'CTO / VP of Engineering / Chief Architect.',
  },
];

export const SFIA_9_SKILLS: SfiaSkillData[] = [
  {
    code: 'PROG',
    name: 'Programming/software development',
    subcategoryCode: 'SYS_DEV',
    overallDescription:
      'The planning, designing, creating, testing, amending, verifying, documenting and refactoring of software.',
    guidanceNotes:
      'Applies to all programming paradigms and environments, including web, cloud, mobile, and backend microservices.',
    levels: [
      {
        levelRank: 2,
        code: 'PROG_L2',
        name: 'Programming - Level 2',
        levelDescription:
          'Designs, codes, tests and documents simple programs or scripts under direction using given specifications.',
        behavioralIndicators: [
          'Writes clean code following team conventions',
          'Implements basic algorithms and data structures',
          'Writes basic unit tests',
        ],
      },
      {
        levelRank: 3,
        code: 'PROG_L3',
        name: 'Programming - Level 3',
        levelDescription:
          'Designs, codes, verifies, tests, documents and refactors standard programs/scripts. Contributes to code reviews.',
        behavioralIndicators: [
          'Autonomously builds non-trivial features',
          'Follows OOP/functional paradigms and clean architecture',
          'Handles errors, edge cases and input validation securely',
          'Executes comprehensive unit and integration testing',
        ],
      },
      {
        levelRank: 4,
        code: 'PROG_L4',
        name: 'Programming - Level 4',
        levelDescription:
          'Designs, codes, verifies, tests, documents, amends and refactors complex programs/scripts and integration software services. Applies agreed standards and tools.',
        behavioralIndicators: [
          'Architects modular, testable, and maintainable services',
          'Optimizes performance, concurrency and resource usage',
          'Enforces coding standards and conducts thorough code reviews',
          'Solves complex technical trade-offs effectively',
        ],
      },
      {
        levelRank: 5,
        code: 'PROG_L5',
        name: 'Programming - Level 5',
        levelDescription:
          'Sets standards for programming and software development. Leads software development projects and adopts modern software engineering practices.',
        behavioralIndicators: [
          'Defines organization-wide software design patterns and standards',
          'Guides major refactoring and system modernization initiatives',
          'Drives adoption of automated CI/CD and software quality gates',
          'Mentors senior and staff engineers in software design',
        ],
      },
    ],
  },
  {
    code: 'DBDS',
    name: 'Database design',
    subcategoryCode: 'SYS_DEV',
    overallDescription:
      'The specification, design and maintenance of database and data storage structures.',
    guidanceNotes:
      'Covers relational (SQL), NoSQL, distributed storage, caching strategies and schema migrations.',
    levels: [
      {
        levelRank: 3,
        code: 'DBDS_L3',
        name: 'Database Design - Level 3',
        levelDescription:
          'Develops and maintains simple or physical data models based on given logical designs. Optimizes queries.',
        behavioralIndicators: [
          'Designs normalized relational schemas (3NF)',
          'Writes performant SQL queries, joins and aggregations',
          'Applies appropriate indexes and constraints',
        ],
      },
      {
        levelRank: 4,
        code: 'DBDS_L4',
        name: 'Database Design - Level 4',
        levelDescription:
          'Designs relational and non-relational database structures for complex systems. Evaluates query performance and concurrency.',
        behavioralIndicators: [
          'Balances normalization vs denormalization for performance',
          'Designs indexing strategies, partitions and caching layers',
          'Prevents N+1 queries, race conditions and transaction locks',
          'Plans zero-downtime database migrations',
        ],
      },
      {
        levelRank: 5,
        code: 'DBDS_L5',
        name: 'Database Design - Level 5',
        levelDescription:
          'Sets policies and standards for database design and data management. Defines enterprise data architectures.',
        behavioralIndicators: [
          'Architects distributed data storage, sharding and replication',
          'Formulates disaster recovery, high availability and consistency models',
          'Sets standards for transactional integrity (ACID vs BASE)',
        ],
      },
    ],
  },
  {
    code: 'TEST',
    name: 'Testing',
    subcategoryCode: 'SYS_DEV',
    overallDescription:
      'The planning, design, management, execution and reporting of tests.',
    guidanceNotes:
      'Includes unit, integration, system, performance, automated end-to-end and security testing.',
    levels: [
      {
        levelRank: 2,
        code: 'TEST_L2',
        name: 'Testing - Level 2',
        levelDescription:
          'Executes given test scripts under supervision. Records test results and logs defects systematically.',
      },
      {
        levelRank: 3,
        code: 'TEST_L3',
        name: 'Testing - Level 3',
        levelDescription:
          'Designs test cases and test scripts. Creates test data and automates tests using standard test frameworks.',
        behavioralIndicators: [
          'Writes comprehensive unit and integration tests',
          'Identifies boundary conditions and regression risks',
          'Utilizes mocks, stubs and test fixtures appropriately',
        ],
      },
      {
        levelRank: 4,
        code: 'TEST_L4',
        name: 'Testing - Level 4',
        levelDescription:
          'Plans and drives testing activities across systems. Designs automated test frameworks and performance tests.',
        behavioralIndicators: [
          'Architects end-to-end testing pipelines in CI/CD',
          'Performs stress, load and performance profiling',
          'Ensures test coverage and reliability (eliminates flaky tests)',
        ],
      },
      {
        levelRank: 5,
        code: 'TEST_L5',
        name: 'Testing - Level 5',
        levelDescription:
          'Sets organizational testing policies and quality assurance standards.',
      },
    ],
  },
  {
    code: 'DESN',
    name: 'Systems design',
    subcategoryCode: 'ARCH_DESIGN',
    overallDescription:
      'The design of systems to satisfy specified requirements, adhering to architectures and standards.',
    guidanceNotes:
      'Covers microservices architecture, event-driven systems, API design, scalability and resilience.',
    levels: [
      {
        levelRank: 4,
        code: 'DESN_L4',
        name: 'Systems Design - Level 4',
        levelDescription:
          'Designs large or complex components, subsystems and interfaces using agreed modeling techniques and design patterns.',
        behavioralIndicators: [
          'Designs clean RESTful and event-driven APIs',
          'Applies SOLID principles and modular architectural patterns',
          'Designs for resilience: circuit breakers, retries, rate limiting',
        ],
      },
      {
        levelRank: 5,
        code: 'DESN_L5',
        name: 'Systems Design - Level 5',
        levelDescription:
          'Specifies and designs large, complex, distributed systems. Ensures alignment with business objectives and technical strategy.',
        behavioralIndicators: [
          'Architects distributed microservices, message queues and caching',
          'Formulates scalability, high availability and low latency strategies',
          'Leads architectural decision records (ADRs) and trade-off analysis',
        ],
      },
    ],
  },
  {
    code: 'CYBS',
    name: 'Cyber security',
    subcategoryCode: 'SEC_PRIVACY',
    overallDescription:
      'The protection of systems, networks, data and information from cyber threats.',
    guidanceNotes: 'Covers authentication, authorization, OWASP Top 10, encryption and secure coding.',
    levels: [
      {
        levelRank: 3,
        code: 'CYBS_L3',
        name: 'Cyber Security - Level 3',
        levelDescription:
          'Applies secure coding standards. Identifies and remediates common vulnerabilities (OWASP Top 10).',
        behavioralIndicators: [
          'Protects against SQL Injection, XSS, CSRF, and SSRF',
          'Implements secure authentication (JWT, OAuth2) and RBAC',
          'Encrypts sensitive data at rest and in transit',
        ],
      },
      {
        levelRank: 4,
        code: 'CYBS_L4',
        name: 'Cyber Security - Level 4',
        levelDescription:
          'Conducts security assessments, threat modeling and vulnerability evaluations across system components.',
      },
    ],
  },
];

export const SFIA_9_ROLES: SfiaRoleData[] = [
  {
    code: 'BACKEND_DEV',
    name: 'Backend Developer',
    description: 'Specializes in server-side logic, databases, APIs and backend architecture.',
    skills: [
      { skillCode: 'PROG', targetLevelRank: 4, defaultWeight: 0.4, priority: 1 },
      { skillCode: 'DBDS', targetLevelRank: 4, defaultWeight: 0.3, priority: 2 },
      { skillCode: 'DESN', targetLevelRank: 4, defaultWeight: 0.15, priority: 3 },
      { skillCode: 'TEST', targetLevelRank: 3, defaultWeight: 0.15, priority: 4 },
    ],
  },
  {
    code: 'FRONTEND_DEV',
    name: 'Frontend Developer',
    description: 'Specializes in user interfaces, client-side state, web performance and user experience.',
    skills: [
      { skillCode: 'PROG', targetLevelRank: 4, defaultWeight: 0.5, priority: 1 },
      { skillCode: 'TEST', targetLevelRank: 3, defaultWeight: 0.25, priority: 2 },
      { skillCode: 'DESN', targetLevelRank: 3, defaultWeight: 0.25, priority: 3 },
    ],
  },
  {
    code: 'FULLSTACK_DEV',
    name: 'Fullstack Developer',
    description: 'End-to-end development covering frontend, backend, databases and basic cloud deployments.',
    skills: [
      { skillCode: 'PROG', targetLevelRank: 4, defaultWeight: 0.35, priority: 1 },
      { skillCode: 'DBDS', targetLevelRank: 4, defaultWeight: 0.25, priority: 2 },
      { skillCode: 'DESN', targetLevelRank: 4, defaultWeight: 0.2, priority: 3 },
      { skillCode: 'TEST', targetLevelRank: 3, defaultWeight: 0.2, priority: 4 },
    ],
  },
];

export const SFIA_9_SKILL_MAPPINGS: SfiaSkillMappingData[] = [
  // Programming & Frameworks -> PROG
  { skillName: 'JavaScript', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'TypeScript', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'NodeJS', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'NestJS', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'Express', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'React', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'NextJS', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'Vue', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'Python', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'Golang', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'Java', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'Spring Boot', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: 'C#', skillCode: 'PROG', relevanceWeight: 1.0 },
  { skillName: '.NET', skillCode: 'PROG', relevanceWeight: 1.0 },

  // Databases & Storage -> DBDS
  { skillName: 'PostgreSQL', skillCode: 'DBDS', relevanceWeight: 1.0 },
  { skillName: 'MySQL', skillCode: 'DBDS', relevanceWeight: 1.0 },
  { skillName: 'MongoDB', skillCode: 'DBDS', relevanceWeight: 1.0 },
  { skillName: 'Redis', skillCode: 'DBDS', relevanceWeight: 0.9 },
  { skillName: 'Prisma', skillCode: 'DBDS', relevanceWeight: 0.8 },
  { skillName: 'TypeORM', skillCode: 'DBDS', relevanceWeight: 0.8 },
  { skillName: 'Elasticsearch', skillCode: 'DBDS', relevanceWeight: 0.8 },
  { skillName: 'Database Design', skillCode: 'DBDS', relevanceWeight: 1.0 },

  // Systems Design & Architecture -> DESN
  { skillName: 'Microservices', skillCode: 'DESN', relevanceWeight: 1.0 },
  { skillName: 'REST API', skillCode: 'DESN', relevanceWeight: 0.9 },
  { skillName: 'GraphQL', skillCode: 'DESN', relevanceWeight: 0.9 },
  { skillName: 'gRPC', skillCode: 'DESN', relevanceWeight: 0.9 },
  { skillName: 'RabbitMQ', skillCode: 'DESN', relevanceWeight: 0.8 },
  { skillName: 'Kafka', skillCode: 'DESN', relevanceWeight: 0.9 },
  { skillName: 'System Architecture', skillCode: 'DESN', relevanceWeight: 1.0 },

  // Testing & QA -> TEST
  { skillName: 'Jest', skillCode: 'TEST', relevanceWeight: 1.0 },
  { skillName: 'Mocha', skillCode: 'TEST', relevanceWeight: 1.0 },
  { skillName: 'Cypress', skillCode: 'TEST', relevanceWeight: 1.0 },
  { skillName: 'Playwright', skillCode: 'TEST', relevanceWeight: 1.0 },
  { skillName: 'Unit Testing', skillCode: 'TEST', relevanceWeight: 1.0 },
  { skillName: 'Integration Testing', skillCode: 'TEST', relevanceWeight: 1.0 },

  // Security -> CYBS
  { skillName: 'Cyber Security', skillCode: 'CYBS', relevanceWeight: 1.0 },
  { skillName: 'OAuth2', skillCode: 'CYBS', relevanceWeight: 0.9 },
  { skillName: 'JWT', skillCode: 'CYBS', relevanceWeight: 0.8 },
  { skillName: 'OWASP', skillCode: 'CYBS', relevanceWeight: 1.0 },
];
