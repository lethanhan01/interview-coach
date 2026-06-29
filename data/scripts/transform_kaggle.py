"""
Transform Kaggle datasets into QuestionBank seed format.

Outputs: server/prisma/seed/data/kaggle-questions.json

Datasets used:
  - data/raw/software-engineering-interview-questions-dataset/Software Questions.csv
  - data/raw/hr-interview-questions-and-ideal-answers/hr_interview_questions_dataset.json

Datasets skipped:
  - interview-questions-hrtechnical: no answers
  - data-science-interview-questions/deeplearning_questions.csv: no answers, only titles
"""

import json
import random
import re
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "server" / "prisma" / "seed" / "data" / "kaggle-questions.json"

random.seed(42)

# ---------------------------------------------------------------------------
# Mapping tables
# ---------------------------------------------------------------------------

SE_SUBCATEGORY = {
    "System Design": "system-design",
    "DevOps": "devops",
    "Front-end": "frontend-fundamentals",
    "Back-end": "backend-fundamentals",
    "Security": "security",
    "Data Structures": "data-structures",
    "Languages and Frameworks": "languages-frameworks",
    "Version Control": "version-control",
    "Web Development": "web-development",
    "Database and SQL": "database-sql",
    "Software Testing": "testing",
    "Algorithms": "algorithms",
    "General Programming": "general-programming",
    "General Program": "general-programming",
    "Full-stack": "fullstack",
    "Distributed Systems": "distributed-systems",
    "Machine Learning": "machine-learning",
    "Low-level Systems": "low-level",
    "Networking": "networking",
    "Database Systems": "database-systems",
    "Data Engineering": "data-engineering",
    "Artificial Intelligence": "ai-fundamentals",
}

SE_DOMAIN = {
    "Data Structures": "TD1",
    "Algorithms": "TD1",
    "General Programming": "TD1",
    "General Program": "TD1",
    "Languages and Frameworks": "TD1",
    "Front-end": "TD2",
    "Back-end": "TD2",
    "Full-stack": "TD2",
    "Web Development": "TD2",
    "Database and SQL": "TD2",
    "Database Systems": "TD2",
    "Machine Learning": "TD2",
    "Artificial Intelligence": "TD2",
    "Data Engineering": "TD2",
    "System Design": "TD3",
    "Distributed Systems": "TD3",
    "Networking": "TD3",
    "Software Testing": "TD4",
    "Version Control": "TD4",
    "DevOps": "TD4",
    "Security": "TD4",
    "Low-level Systems": "TD4",
}

SE_ROLES = {
    "Front-end": ["frontend", "fullstack"],
    "Back-end": ["backend", "fullstack"],
    "Full-stack": ["frontend", "backend", "fullstack"],
    "DevOps": ["devops", "backend"],
    "Data Engineering": ["data-engineer"],
    "Machine Learning": ["ml-engineer"],
    "Artificial Intelligence": ["ml-engineer"],
    "Database and SQL": ["backend", "fullstack", "data-engineer"],
    "Database Systems": ["backend", "fullstack", "data-engineer"],
}

DIFFICULTY_INT = {"Easy": 2, "Medium": 3, "Hard": 5, "easy": 2, "medium": 3, "hard": 5}

DIFFICULTY_LEVELS = {
    2: ["junior", "intern"],
    3: ["junior", "mid"],
    5: ["mid", "senior"],
}

DIFFICULTY_TIME = {2: 3, 3: 5, 5: 7}

HR_SUBCATEGORY = {
    "Adaptability": "adaptability",
    "Career Goals": "career-goals",
    "Conflict Resolution": "conflict-resolution",
    "Culture Fit": "culture-fit",
    "Leadership": "leadership",
    "Motivation": "motivation",
    "Team Collaboration": "teamwork",
    "Work Style": "work-style",
}

HR_DOMAIN = {
    "Adaptability": "D6",
    "Career Goals": "D4",
    "Conflict Resolution": "D3",
    "Culture Fit": "D5",
    "Leadership": "D4",
    "Motivation": "D4",
    "Team Collaboration": "D3",
    "Work Style": "D5",
}

HR_DIFFICULTY_INT = {"Easy": 2, "Medium": 3, "Hard": 4}
HR_DIFFICULTY_LEVELS = {
    2: ["junior", "intern"],
    3: ["junior", "mid"],
    4: ["junior", "mid", "senior"],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def build_tags(session_type, context_pack, subcategory, domain, roles, levels):
    return list(dict.fromkeys([
        session_type,
        context_pack.lower(),
        subcategory,
        domain.lower(),
        *roles,
        *levels,
    ]))


def clean_answer(answer: str, question: str) -> str:
    """Remove the question text if it appears repeated at end of answer."""
    if not answer:
        return ""
    # Trim the last sentence if it closely matches the question
    stripped = answer.strip()
    if stripped.endswith(question.strip()):
        stripped = stripped[: -len(question.strip())].rstrip(" .,")
    return stripped.strip()


def make_question(
    content: str,
    session_type: str,
    difficulty: int,
    context_pack: str,
    subcategory: str,
    domain: str,
    roles: list,
    levels: list,
    model_answer: str = "",
    dataset: str = "",
):
    time_min = DIFFICULTY_TIME.get(difficulty, 5)
    tags = build_tags(session_type, context_pack, subcategory, domain, roles, levels)
    return {
        "content": content,
        "sessionType": session_type,
        "difficulty": difficulty,
        "contextPackId": context_pack,
        "subcategory": subcategory,
        "competencyDomain": domain,
        "applicableRoles": roles,
        "applicableLevels": levels,
        "tags": tags,
        "estimatedTimeMin": time_min,
        "translations": {"en": content, "vi": ""},
        "contentJson": {
            "source": "kaggle",
            "dataset": dataset,
            "modelAnswer": model_answer,
            "en": content,
            "vi": "",
        },
    }


# ---------------------------------------------------------------------------
# Process SE dataset (200 rows)
# ---------------------------------------------------------------------------

def process_se():
    path = RAW / "software-engineering-interview-questions-dataset" / "Software Questions.csv"
    df = pd.read_csv(path, encoding="latin-1")

    # Drop rows with missing question or duplicate questions
    df = df.dropna(subset=["Question"]).drop_duplicates(subset=["Question"])

    results = []
    for _, row in df.iterrows():
        cat = str(row.get("Category", "")).strip()
        diff_raw = str(row.get("Difficulty", "Medium")).strip()
        question = str(row["Question"]).strip()
        answer = str(row.get("Answer", "")).strip()

        difficulty = DIFFICULTY_INT.get(diff_raw, 3)
        subcategory = SE_SUBCATEGORY.get(cat, "general-programming")
        domain = SE_DOMAIN.get(cat, "TD1")
        roles = SE_ROLES.get(cat, ["all"])
        levels = DIFFICULTY_LEVELS.get(difficulty, ["junior", "mid"])

        results.append(make_question(
            content=question,
            session_type="technical",
            difficulty=difficulty,
            context_pack="Western",
            subcategory=subcategory,
            domain=domain,
            roles=roles,
            levels=levels,
            model_answer=answer,
            dataset="software-engineering-interview-questions-dataset",
        ))

    print(f"SE: {len(results)} questions processed")
    return results


# ---------------------------------------------------------------------------
# Process HR dataset (2.5M rows — filter fresher/intern + Software Engineer)
# ---------------------------------------------------------------------------

HR_TARGET = 150
HR_CATEGORIES = list(HR_SUBCATEGORY.keys())  # 8 categories, ~18-19 per category


def process_hr():
    path = RAW / "hr-interview-questions-and-ideal-answers" / "hr_interview_questions_dataset.json"

    print("Loading HR JSON (2.5M rows) — this may take a moment...")
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)

    # Filter: any experience, all roles — deduplicate by question text to get unique content
    # (Dataset is synthetic: 2.5M rows but very few unique questions per category)
    filtered = [
        d for d in raw
        if d.get("category") in HR_CATEGORIES
    ]
    print(f"HR after category filter: {len(filtered)}")

    # Deduplicate by question text
    seen_questions = set()
    deduped = []
    for d in filtered:
        q = d["question"].strip().lower()
        if q not in seen_questions:
            seen_questions.add(q)
            deduped.append(d)
    print(f"HR after dedup: {len(deduped)}")

    # Sample evenly across categories
    by_category = {}
    for d in deduped:
        cat = d["category"]
        by_category.setdefault(cat, []).append(d)

    per_category = max(1, HR_TARGET // len(by_category))
    sampled = []
    for cat, items in sorted(by_category.items()):
        random.shuffle(items)
        sampled.extend(items[:per_category])

    # Top up to HR_TARGET if needed
    remaining = [d for d in deduped if d not in sampled]
    random.shuffle(remaining)
    sampled.extend(remaining[: HR_TARGET - len(sampled)])
    sampled = sampled[:HR_TARGET]

    print(f"HR sampled: {len(sampled)}")

    results = []
    for d in sampled:
        cat = d.get("category", "")
        diff_raw = d.get("difficulty", "Medium")
        question = d["question"].strip()
        answer = clean_answer(d.get("ideal_answer", ""), question)

        difficulty = HR_DIFFICULTY_INT.get(diff_raw, 3)
        subcategory = HR_SUBCATEGORY.get(cat, "general-hr")
        domain = HR_DOMAIN.get(cat, "D4")
        levels = HR_DIFFICULTY_LEVELS.get(difficulty, ["junior", "mid"])

        results.append(make_question(
            content=question,
            session_type="hr",
            difficulty=difficulty,
            context_pack="Western",
            subcategory=subcategory,
            domain=domain,
            roles=["all"],
            levels=levels,
            model_answer=answer,
            dataset="hr-interview-questions-and-ideal-answers",
        ))

    print(f"HR: {len(results)} questions processed")
    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    se_questions = process_se()
    hr_questions = process_hr()

    all_questions = se_questions + hr_questions

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)

    print(f"\nTotal: {len(all_questions)} questions -> {OUT}")
    print(f"  technical (SE): {len(se_questions)}")
    print(f"  hr: {len(hr_questions)}")
