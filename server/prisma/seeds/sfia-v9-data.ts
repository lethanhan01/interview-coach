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

export interface BehavioralIndicatorItem {
  id: string;
  statement: string;
  keywords: string[];
  rubric: string;
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
    behavioralIndicators?: BehavioralIndicatorItem[];
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
          {
            id: 'PROG-L2-IND1',
            statement: 'Writes clean code following team conventions and standard syntax.',
            keywords: ['syntax', 'clean code', 'conventions', 'basic coding'],
            rubric: 'Candidate writes syntactically correct code following basic styling guidelines.',
          },
          {
            id: 'PROG-L2-IND2',
            statement: 'Implements basic algorithms, control flow and data structures accurately.',
            keywords: ['loops', 'arrays', 'conditionals', 'data structures'],
            rubric: 'Candidate implements correct logic with standard data structures.',
          },
          {
            id: 'PROG-L2-IND3',
            statement: 'Writes basic unit tests for simple functional logic under guidance.',
            keywords: ['unit test', 'test case', 'assertion'],
            rubric: 'Candidate writes simple test cases verifying happy paths.',
          },
        ],
      },
      {
        levelRank: 3,
        code: 'PROG_L3',
        name: 'Programming - Level 3',
        levelDescription:
          'Designs, codes, verifies, tests, documents and refactors standard programs/scripts. Contributes to code reviews.',
        behavioralIndicators: [
          {
            id: 'PROG-L3-IND1',
            statement: 'Autonomously builds non-trivial features and refactors code for clarity and maintainability.',
            keywords: ['refactoring', 'modularity', 'clean code', 'feature development'],
            rubric: 'Candidate demonstrates independent coding ability and proactive refactoring for readability.',
          },
          {
            id: 'PROG-L3-IND2',
            statement: 'Follows OOP or Functional paradigms and standard design patterns.',
            keywords: ['oop', 'functional programming', 'design patterns', 'dry', 'solid'],
            rubric: 'Candidate organizes code into coherent abstractions adhering to core design principles.',
          },
          {
            id: 'PROG-L3-IND3',
            statement: 'Handles errors, exceptions, edge cases and input validation securely.',
            keywords: ['error handling', 'validation', 'edge cases', 'exceptions'],
            rubric: 'Candidate robustly guards against null/undefined, invalid inputs, and unexpected runtime states.',
          },
          {
            id: 'PROG-L3-IND4',
            statement: 'Executes comprehensive unit and integration testing with appropriate mocks.',
            keywords: ['unit testing', 'integration testing', 'mocks', 'test coverage'],
            rubric: 'Candidate creates structured test suites covering both success and error branches.',
          },
        ],
      },
      {
        levelRank: 4,
        code: 'PROG_L4',
        name: 'Programming - Level 4',
        levelDescription:
          'Designs, codes, verifies, tests, documents, amends and refactors complex programs/scripts and integration software services. Applies agreed standards and tools.',
        behavioralIndicators: [
          {
            id: 'PROG-L4-IND1',
            statement: 'Architects modular, testable, and maintainable services and integration layers.',
            keywords: ['architecture', 'microservices', 'modularity', 'separation of concerns'],
            rubric: 'Candidate designs scalable module boundaries and robust integration interfaces.',
          },
          {
            id: 'PROG-L4-IND2',
            statement: 'Optimizes performance, memory allocation, concurrency and resource usage.',
            keywords: ['concurrency', 'async', 'performance optimization', 'memory leak', 'profiling'],
            rubric: 'Candidate identifies performance bottlenecks and employs asynchronous/concurrent optimizations.',
          },
          {
            id: 'PROG-L4-IND3',
            statement: 'Enforces coding standards, leads deep code reviews, and provides constructive feedback.',
            keywords: ['code review', 'best practices', 'mentorship', 'standards enforcement'],
            rubric: 'Candidate provides thorough code review feedback focused on security, efficiency, and design.',
          },
          {
            id: 'PROG-L4-IND4',
            statement: 'Solves complex technical trade-offs between speed, cost, maintainability, and reliability.',
            keywords: ['trade-offs', 'technical debt', 'complexity management'],
            rubric: 'Candidate articulates pros and cons of technical approaches clearly and makes sound decisions.',
          },
        ],
      },
      {
        levelRank: 5,
        code: 'PROG_L5',
        name: 'Programming - Level 5',
        levelDescription:
          'Sets standards for programming and software development. Leads software development projects and adopts modern software engineering practices.',
        behavioralIndicators: [
          {
            id: 'PROG-L5-IND1',
            statement: 'Defines organization-wide software design patterns, guidelines, and quality standards.',
            keywords: ['enterprise standards', 'architectural governance', 'framework selection'],
            rubric: 'Candidate sets overarching technical direction and engineering guidelines.',
          },
          {
            id: 'PROG-L5-IND2',
            statement: 'Guides major system modernization initiatives and high-risk refactoring.',
            keywords: ['modernization', 'legacy migration', 'system refactoring'],
            rubric: 'Candidate plans and executes seamless system transformations without downtime.',
          },
          {
            id: 'PROG-L5-IND3',
            statement: 'Drives adoption of automated CI/CD pipelines, static analysis, and automated quality gates.',
            keywords: ['ci/cd', 'automation', 'devops', 'quality gates', 'sonarqube'],
            rubric: 'Candidate implements automated verification and deployment ecosystems across teams.',
          },
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
          {
            id: 'DBDS-L3-IND1',
            statement: 'Designs normalized relational database schemas adhering to 3NF standards.',
            keywords: ['normalization', '3nf', 'relational schema', 'foreign keys', 'entities'],
            rubric: 'Candidate properly normalizes entities and designs clean primary/foreign key relationships.',
          },
          {
            id: 'DBDS-L3-IND2',
            statement: 'Writes performant SQL queries, joins, subqueries, and aggregations.',
            keywords: ['sql queries', 'joins', 'aggregation', 'group by', 'indexes'],
            rubric: 'Candidate crafts accurate SQL queries and avoids Cartesian products.',
          },
          {
            id: 'DBDS-L3-IND3',
            statement: 'Applies appropriate indexes and constraints to maintain data integrity.',
            keywords: ['b-tree index', 'unique constraint', 'check constraint', 'indexing'],
            rubric: 'Candidate creates relevant indexes for query performance and enforces constraints.',
          },
        ],
      },
      {
        levelRank: 4,
        code: 'DBDS_L4',
        name: 'Database Design - Level 4',
        levelDescription:
          'Designs relational and non-relational database structures for complex systems. Evaluates query performance and concurrency.',
        behavioralIndicators: [
          {
            id: 'DBDS-L4-IND1',
            statement: 'Balances normalization vs deliberate denormalization for read/write performance.',
            keywords: ['denormalization', 'read performance', 'caching', 'nosql modeling'],
            rubric: 'Candidate evaluates query patterns to decide appropriate schema structures.',
          },
          {
            id: 'DBDS-L4-IND2',
            statement: 'Designs comprehensive indexing strategies (Composite, Partial, GIN) and partitioning.',
            keywords: ['composite index', 'partial index', 'partitioning', 'explain analyze'],
            rubric: 'Candidate uses query execution plans to optimize complex queries and large tables.',
          },
          {
            id: 'DBDS-L4-IND3',
            statement: 'Prevents N+1 queries, race conditions, and deadlocks via proper isolation levels.',
            keywords: ['n+1 problem', 'acid', 'isolation levels', 'optimistic locking', 'pessimistic locking'],
            rubric: 'Candidate manages transaction boundaries and concurrency safeguards effectively.',
          },
          {
            id: 'DBDS-L4-IND4',
            statement: 'Plans and executes zero-downtime database migrations (Expand-Contract pattern).',
            keywords: ['zero-downtime migration', 'expand contract', 'schema evolution'],
            rubric: 'Candidate designs phased migration scripts avoiding table locks during production deploy.',
          },
        ],
      },
      {
        levelRank: 5,
        code: 'DBDS_L5',
        name: 'Database Design - Level 5',
        levelDescription:
          'Sets policies and standards for database design and data management. Defines enterprise data architectures.',
        behavioralIndicators: [
          {
            id: 'DBDS-L5-IND1',
            statement: 'Architects distributed data storage, sharding, replication, and read-replica strategies.',
            keywords: ['sharding', 'replication', 'read replicas', 'distributed database'],
            rubric: 'Candidate designs global data topologies meeting high availability and throughput needs.',
          },
          {
            id: 'DBDS-L5-IND2',
            statement: 'Formulates disaster recovery, point-in-time recovery, and consistency trade-offs (CAP theorem).',
            keywords: ['cap theorem', 'eventual consistency', 'disaster recovery', 'rpo', 'rto'],
            rubric: 'Candidate balances consistency, availability, and partition tolerance strategically.',
          },
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
        behavioralIndicators: [
          {
            id: 'TEST-L2-IND1',
            statement: 'Executes manual and automated test scripts methodically and logs defects with reproducible steps.',
            keywords: ['test execution', 'bug report', 'reproducible steps'],
            rubric: 'Candidate writes clear, actionable defect tickets and verifies bug fixes.',
          },
        ],
      },
      {
        levelRank: 3,
        code: 'TEST_L3',
        name: 'Testing - Level 3',
        levelDescription:
          'Designs test cases and test scripts. Creates test data and automates tests using standard test frameworks.',
        behavioralIndicators: [
          {
            id: 'TEST-L3-IND1',
            statement: 'Designs comprehensive test cases covering positive, negative, and edge cases.',
            keywords: ['test case design', 'boundary analysis', 'equivalence partitioning'],
            rubric: 'Candidate identifies critical boundary values and failure scenarios systematically.',
          },
          {
            id: 'TEST-L3-IND2',
            statement: 'Writes automated unit and integration tests using standard frameworks (Jest, Mocha, PyTest).',
            keywords: ['jest', 'automated testing', 'unit test', 'integration test', 'mocks'],
            rubric: 'Candidate creates reliable automated test suites with proper isolation.',
          },
        ],
      },
      {
        levelRank: 4,
        code: 'TEST_L4',
        name: 'Testing - Level 4',
        levelDescription:
          'Plans and drives testing activities across systems. Designs automated test frameworks and performance tests.',
        behavioralIndicators: [
          {
            id: 'TEST-L4-IND1',
            statement: 'Architects end-to-end testing frameworks and integrates them seamlessly into CI/CD pipelines.',
            keywords: ['e2e testing', 'playwright', 'cypress', 'ci/cd integration', 'test automation'],
            rubric: 'Candidate establishes robust testing automation ensuring fast feedback and no flaky tests.',
          },
          {
            id: 'TEST-L4-IND2',
            statement: 'Performs stress, load, profiling, and performance benchmark testing.',
            keywords: ['load testing', 'k6', 'jmeter', 'stress test', 'benchmarking'],
            rubric: 'Candidate identifies system bottlenecks and verifies SLA performance under load.',
          },
        ],
      },
      {
        levelRank: 5,
        code: 'TEST_L5',
        name: 'Testing - Level 5',
        levelDescription:
          'Sets organizational testing policies, quality assurance standards, and test engineering strategy.',
        behavioralIndicators: [
          {
            id: 'TEST-L5-IND1',
            statement: 'Establishes enterprise-wide QA strategy, shift-left testing, and automated release gates.',
            keywords: ['qa strategy', 'shift left', 'quality governance', 'release gates'],
            rubric: 'Candidate drives organizational adoption of modern quality practices.',
          },
        ],
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
        levelRank: 3,
        code: 'DESN_L3',
        name: 'Systems Design - Level 3',
        levelDescription:
          'Specifies user and system interfaces and translates requirements into detailed software component designs.',
        behavioralIndicators: [
          {
            id: 'DESN-L3-IND1',
            statement: 'Designs clean component interfaces and REST API contracts with structured payloads.',
            keywords: ['api design', 'rest api', 'dto', 'component interface'],
            rubric: 'Candidate creates intuitive, well-typed API schemas and component boundaries.',
          },
        ],
      },
      {
        levelRank: 4,
        code: 'DESN_L4',
        name: 'Systems Design - Level 4',
        levelDescription:
          'Designs large or complex components, subsystems and interfaces using agreed modeling techniques and design patterns.',
        behavioralIndicators: [
          {
            id: 'DESN-L4-IND1',
            statement: 'Applies DDD, Hexagonal/Clean Architecture, and SOLID principles to system components.',
            keywords: ['ddd', 'clean architecture', 'hexagonal', 'solid', 'domain model'],
            rubric: 'Candidate isolates business domain logic from infrastructure and presentation layers.',
          },
          {
            id: 'DESN-L4-IND2',
            statement: 'Designs resilient distributed systems with circuit breakers, retries, and rate limiting.',
            keywords: ['resilience', 'circuit breaker', 'rate limiting', 'retry with backoff', 'fallback'],
            rubric: 'Candidate safeguards systems against cascading failures and network instability.',
          },
          {
            id: 'DESN-L4-IND3',
            statement: 'Designs asynchronous, event-driven communications using message brokers.',
            keywords: ['event-driven', 'message queue', 'pub/sub', 'rabbitmq', 'kafka', 'idempotency'],
            rubric: 'Candidate ensures message delivery guarantees, consumer idempotency, and outbox patterns.',
          },
        ],
      },
      {
        levelRank: 5,
        code: 'DESN_L5',
        name: 'Systems Design - Level 5',
        levelDescription:
          'Specifies and designs large, complex, distributed systems. Ensures alignment with business objectives and technical strategy.',
        behavioralIndicators: [
          {
            id: 'DESN-L5-IND1',
            statement: 'Architects high-throughput distributed microservices, multi-region setups, and caching topologies.',
            keywords: ['distributed systems', 'scalability', 'multi-region', 'caching tier', 'redis'],
            rubric: 'Candidate designs architectures meeting high scalability and low latency requirements.',
          },
          {
            id: 'DESN-L5-IND2',
            statement: 'Authors Architecture Decision Records (ADRs) and leads cross-team technical consensus.',
            keywords: ['adr', 'architecture decision record', 'trade-off analysis', 'system trade-offs'],
            rubric: 'Candidate documents design trade-offs transparently and drives stakeholder alignment.',
          },
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
          {
            id: 'CYBS-L3-IND1',
            statement: 'Prevents and remediates OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, SSRF, Broken Auth).',
            keywords: ['owasp top 10', 'sqli', 'xss', 'csrf', 'input sanitization', 'security'],
            rubric: 'Candidate identifies security vulnerabilities and implements effective sanitization/validation.',
          },
          {
            id: 'CYBS-L3-IND2',
            statement: 'Implements secure authentication (JWT, OAuth 2.0, MFA) and Role-Based Access Control (RBAC).',
            keywords: ['jwt', 'oauth2', 'rbac', 'authentication', 'authorization'],
            rubric: 'Candidate manages token lifecycles, hashing (bcrypt/argon2), and permission guards.',
          },
          {
            id: 'CYBS-L3-IND3',
            statement: 'Encrypts sensitive data at rest and in transit adhering to industry standards (TLS, AES-256).',
            keywords: ['encryption', 'tls', 'aes-256', 'https', 'data protection'],
            rubric: 'Candidate ensures secrets, passwords, and PII are never leaked or stored in plaintext.',
          },
        ],
      },
      {
        levelRank: 4,
        code: 'CYBS_L4',
        name: 'Cyber Security - Level 4',
        levelDescription:
          'Conducts security assessments, threat modeling and vulnerability evaluations across system components.',
        behavioralIndicators: [
          {
            id: 'CYBS-L4-IND1',
            statement: 'Performs STRIDE threat modeling and evaluates attack surfaces for new features.',
            keywords: ['threat modeling', 'stride', 'attack surface', 'security assessment'],
            rubric: 'Candidate analyzes threat vectors and designs defense-in-depth security mitigations.',
          },
        ],
      },
    ],
  },
  {
    code: 'ITOP',
    name: 'IT infrastructure / DevOps',
    subcategoryCode: 'SERV_OP',
    overallDescription:
      'The operation, monitoring, automation and maintenance of cloud infrastructure, containers and CI/CD pipelines.',
    guidanceNotes: 'Covers Docker, Kubernetes, CI/CD, AWS/GCP, Prometheus, Grafana and logging.',
    levels: [
      {
        levelRank: 3,
        code: 'ITOP_L3',
        name: 'DevOps & Operations - Level 3',
        levelDescription:
          'Maintains and operates cloud services, containerized applications, and deployment workflows.',
        behavioralIndicators: [
          {
            id: 'ITOP-L3-IND1',
            statement: 'Builds and containerizes applications using Docker best practices (multi-stage builds).',
            keywords: ['docker', 'containerization', 'multi-stage build', 'dockerfile'],
            rubric: 'Candidate writes lightweight, secure Dockerfiles avoiding running as root.',
          },
          {
            id: 'ITOP-L3-IND2',
            statement: 'Configures CI/CD pipelines for automated testing, linting, and staging deployment.',
            keywords: ['github actions', 'ci/cd pipeline', 'gitlab ci', 'automated deployment'],
            rubric: 'Candidate implements reliable automated deployment workflows.',
          },
        ],
      },
      {
        levelRank: 4,
        code: 'ITOP_L4',
        name: 'DevOps & Operations - Level 4',
        levelDescription:
          'Designs infrastructure as code (IaC), Kubernetes orchestrations, and full-stack observability.',
        behavioralIndicators: [
          {
            id: 'ITOP-L4-IND1',
            statement: 'Provisions cloud resources using Infrastructure as Code (Terraform, CloudFormation).',
            keywords: ['terraform', 'iac', 'cloud infrastructure', 'aws', 'gcp'],
            rubric: 'Candidate writes modular, declarative IaC configurations managing state safely.',
          },
          {
            id: 'ITOP-L4-IND2',
            statement: 'Implements comprehensive observability (Metrics, Logs, Distributed Tracing, Alerting).',
            keywords: ['observability', 'prometheus', 'grafana', 'opentelemetry', 'distributed tracing'],
            rubric: 'Candidate sets up actionable dashboards and alert rules based on Golden Signals.',
          },
        ],
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
      { skillCode: 'PROG', targetLevelRank: 4, defaultWeight: 0.35, priority: 1 },
      { skillCode: 'DBDS', targetLevelRank: 4, defaultWeight: 0.25, priority: 2 },
      { skillCode: 'DESN', targetLevelRank: 4, defaultWeight: 0.2, priority: 3 },
      { skillCode: 'TEST', targetLevelRank: 3, defaultWeight: 0.1, priority: 4 },
      { skillCode: 'CYBS', targetLevelRank: 3, defaultWeight: 0.1, priority: 5 },
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
      { skillCode: 'PROG', targetLevelRank: 4, defaultWeight: 0.3, priority: 1 },
      { skillCode: 'DBDS', targetLevelRank: 4, defaultWeight: 0.2, priority: 2 },
      { skillCode: 'DESN', targetLevelRank: 4, defaultWeight: 0.2, priority: 3 },
      { skillCode: 'TEST', targetLevelRank: 3, defaultWeight: 0.15, priority: 4 },
      { skillCode: 'ITOP', targetLevelRank: 3, defaultWeight: 0.15, priority: 5 },
    ],
  },
  {
    code: 'DEVOPS_ENG',
    name: 'DevOps Engineer',
    description: 'Specializes in CI/CD, cloud infrastructure, container orchestration and system reliability.',
    skills: [
      { skillCode: 'ITOP', targetLevelRank: 4, defaultWeight: 0.45, priority: 1 },
      { skillCode: 'CYBS', targetLevelRank: 4, defaultWeight: 0.25, priority: 2 },
      { skillCode: 'PROG', targetLevelRank: 3, defaultWeight: 0.15, priority: 3 },
      { skillCode: 'DESN', targetLevelRank: 4, defaultWeight: 0.15, priority: 4 },
    ],
  },
  {
    code: 'QA_ENG',
    name: 'QA Automation Engineer',
    description: 'Specializes in test automation frameworks, regression pipelines and quality assurance.',
    skills: [
      { skillCode: 'TEST', targetLevelRank: 4, defaultWeight: 0.5, priority: 1 },
      { skillCode: 'PROG', targetLevelRank: 3, defaultWeight: 0.3, priority: 2 },
      { skillCode: 'ITOP', targetLevelRank: 3, defaultWeight: 0.2, priority: 3 },
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

  // DevOps & Cloud -> ITOP
  { skillName: 'Docker', skillCode: 'ITOP', relevanceWeight: 1.0 },
  { skillName: 'Kubernetes', skillCode: 'ITOP', relevanceWeight: 1.0 },
  { skillName: 'CI/CD', skillCode: 'ITOP', relevanceWeight: 1.0 },
  { skillName: 'Terraform', skillCode: 'ITOP', relevanceWeight: 1.0 },
  { skillName: 'AWS', skillCode: 'ITOP', relevanceWeight: 1.0 },
  { skillName: 'GCP', skillCode: 'ITOP', relevanceWeight: 1.0 },
];
