-- Seed: context_packs (2 rows required before any other table can INSERT)
-- Applied manually via Supabase Dashboard SQL editor or migration tool.
-- Source: docs/Design/DetailedDesign/database-design/03_tables_auth.md §context_packs

INSERT INTO context_packs (id, name, rubric_json, scoring_weights) VALUES
(
  'vn',
  'Vietnam Context Pack',
  '{
    "behavioral": {
      "D1": { "name": "Giao tiếp & Trình bày",       "weight": 0.20 },
      "D2": { "name": "Tư duy & Giải quyết vấn đề",  "weight": 0.20 },
      "D3": { "name": "Làm việc nhóm",                "weight": 0.15 },
      "D4": { "name": "Thái độ & Động lực",           "weight": 0.20 },
      "D5": { "name": "Phù hợp văn hóa",              "weight": 0.15 },
      "D6": { "name": "Tự nhận thức",                 "weight": 0.10 }
    },
    "technical": {
      "TD1": { "name": "Kiến thức nền tảng",          "weight": 0.25 },
      "TD2": { "name": "Khả năng áp dụng thực tế",   "weight": 0.25 },
      "TD3": { "name": "Tư duy hệ thống",             "weight": 0.20 },
      "TD4": { "name": "Code quality & Best practices","weight": 0.20 },
      "TD5": { "name": "Debug & Problem-solving",     "weight": 0.10 }
    }
  }',
  '{
    "behavioral_weight": 0.50,
    "technical_weight":  0.50
  }'
),
(
  'western',
  'Western Context Pack',
  '{
    "behavioral": {
      "D1": { "name": "Communication & Presentation",  "weight": 0.20 },
      "D2": { "name": "Critical Thinking",             "weight": 0.20 },
      "D3": { "name": "Collaboration & Teamwork",      "weight": 0.15 },
      "D4": { "name": "Leadership & Initiative",       "weight": 0.20 },
      "D5": { "name": "Culture Fit & Values",          "weight": 0.15 },
      "D6": { "name": "Self-Awareness & Growth",       "weight": 0.10 }
    },
    "technical": {
      "TD1": { "name": "Foundational Knowledge",       "weight": 0.20 },
      "TD2": { "name": "Practical Application",        "weight": 0.25 },
      "TD3": { "name": "Systems Thinking",             "weight": 0.20 },
      "TD4": { "name": "Code Quality & Best Practices","weight": 0.20 },
      "TD5": { "name": "Debug & Problem-solving",      "weight": 0.15 }
    }
  }',
  '{
    "behavioral_weight": 0.45,
    "technical_weight":  0.55
  }'
);
