import 'dotenv/config';
import { Client } from 'pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

interface QuestionRecord {
  id: string;
  content: string;
  session_type: string;
  difficulty: number;
  skill_code: string;
  rank: number;
}

interface CriteriaDefinition {
  criteriaText: string;
  dimension: 'core' | 'seniority';
  weight: number;
  orderIndex: number;
}

/**
 * Trích xuất chủ đề / từ khóa trọng tâm của câu hỏi
 */
function extractTopic(content: string): string {
  let cleaned = content.trim();
  // Loại bỏ dấu chấm hoặc dấu chấm hỏi ở cuối
  cleaned = cleaned.replace(/[?.!]+$/, '');

  // Loại bỏ các tiền tố câu hỏi phổ biến để lấy cụm chủ đề chính
  const prefixes = [
    /^tell me about a time when you/i,
    /^tell me about a time you/i,
    /^tell me about a project where you/i,
    /^tell me about your experience with/i,
    /^tell me about/i,
    /^describe your experience with/i,
    /^describe your experience working in/i,
    /^describe your/i,
    /^describe how you/i,
    /^describe the/i,
    /^describe/i,
    /^explain the concept of/i,
    /^explain the difference between/i,
    /^explain how/i,
    /^explain what/i,
    /^explain/i,
    /^what is the difference between/i,
    /^what is the importance of/i,
    /^what is a/i,
    /^what is/i,
    /^what are the advantages and disadvantages of/i,
    /^what are the benefits of/i,
    /^what are/i,
    /^what do you know about/i,
    /^how do you handle/i,
    /^how do you manage/i,
    /^how do you ensure/i,
    /^how do you optimize/i,
    /^how do you stay updated with/i,
    /^how do you/i,
    /^how would you handle/i,
    /^how would you design/i,
    /^how would you/i,
    /^discuss the importance of/i,
    /^discuss/i,
    /^why did you choose to/i,
    /^why is/i,
    /^can you explain/i,
    /^walk through the steps to/i,
    /^walk through/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  // Viết hoa chữ cái đầu
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  } else {
    cleaned = content.trim();
  }

  return cleaned;
}

/**
 * Sinh bộ tiêu chí nhị phân 2 chiều (core & seniority) cho câu hỏi
 */
function generateCriteria(
  sessionType: string,
  content: string,
  skillCode: string,
  level: number,
): CriteriaDefinition[] {
  const topic = extractTopic(content);

  let coreText = '';
  let seniorityText = '';

  if (sessionType === 'hr') {
    // Tiêu chí cho câu hỏi HR / Hành vi / Văn hóa
    coreText = `Trình bày tình huống rõ ràng, thể hiện thái độ hợp tác tích cực và giải pháp hành động cụ thể, mang tính xây dựng liên quan đến: "${topic}".`;

    if (level <= 2) {
      seniorityText =
        'Thể hiện tinh thần cầu tiến, thái độ tự giác, khả năng thích nghi và tuân thủ chuẩn mực văn hóa làm việc nhóm (SFIA Level 2).';
    } else if (level === 3) {
      seniorityText =
        'Thể hiện tính tự chủ, giao tiếp thuyết phục, chủ động tháo gỡ khó khăn hoặc xung đột và chịu trách nhiệm về kết quả công việc (SFIA Level 3).';
    } else if (level === 4) {
      seniorityText =
        'Thể hiện tư duy làm chủ, khả năng tạo ảnh hưởng tích cực tới đồng nghiệp, dẫn dắt giải quyết mâu thuẫn phức tạp và tối ưu hóa hiệu quả đội ngũ (SFIA Level 4).';
    } else {
      seniorityText =
        'Thể hiện tầm nhìn chiến lược về phát triển con người, năng lực định hướng văn hóa tổ chức và dẫn dắt tập thể vượt qua thách thức lớn (SFIA Level 5).';
    }
  } else {
    // Tiêu chí cho câu hỏi Kỹ thuật (Technical)
    coreText = `Nêu đúng định nghĩa, nguyên lý cơ chế vận hành và phương án kỹ thuật triển khai cốt lõi liên quan đến: "${topic}".`;

    if (level <= 2) {
      seniorityText =
        'Nêu được ví dụ áp dụng thực tế, tuân thủ đúng quy trình kỹ thuật chuẩn và nhận thức được các rủi ro, lỗi thường gặp (SFIA Level 2).';
    } else if (level === 3) {
      seniorityText =
        'Phân tích được ngữ cảnh ứng dụng thực tế, hiểu rõ ưu nhược điểm của giải pháp và có khả năng độc lập xử lý sự cố kỹ thuật phát sinh (SFIA Level 3).';
    } else if (level === 4) {
      seniorityText =
        'Phân tích sâu sắc trade-off kỹ thuật (hiệu năng, độ tin cậy, chi phí vận hành), thể hiện tư duy làm chủ kiến trúc và áp dụng best practices của ngành (SFIA Level 4).';
    } else {
      seniorityText =
        'Đánh giá toàn diện tác động kiến trúc ở quy mô lớn, hoạch định chiến lược công nghệ dài hạn và định hướng tiêu chuẩn kỹ thuật cho toàn dự án (SFIA Level 5).';
    }
  }

  return [
    {
      criteriaText: coreText,
      dimension: 'core',
      weight: 1.0,
      orderIndex: 0,
    },
    {
      criteriaText: seniorityText,
      dimension: 'seniority',
      weight: 1.0,
      orderIndex: 1,
    },
  ];
}

/**
 * Ánh xạ mã SFIA sang mã O*NET SOC Code
 */
function resolveOnetSocCode(sessionType: string, skillCode: string): string {
  if (sessionType === 'hr') {
    return '15-1252.00'; // Software Developers (bối cảnh phỏng vấn vị trí kỹ sư phần mềm)
  }

  switch (skillCode.toUpperCase()) {
    case 'PROG':
    case 'DESN':
      return '15-1252.00'; // Software Developers
    case 'DBDS':
      return '15-1243.00'; // Database Engineers
    case 'ITOP':
      return '15-1244.00'; // Network & Systems Admins / DevOps
    case 'TEST':
      return '15-1253.00'; // QA Analysts & Testers
    case 'CYBS':
      return '15-1212.00'; // Information Security Analysts
    default:
      return '15-1252.00';
  }
}

async function main() {
  console.log('--- BẮT ĐẦU ENRICH DỮ LIỆU QUESTION_BANK & QUESTION_CRITERIA ---');
  const client = new Client(buildPgConnectionConfig(process.env.DATABASE_URL));
  await client.connect();

  try {
    await client.query('BEGIN');

    // 1. Lấy toàn bộ 359 câu hỏi kèm skill_code và rank level từ bảng cũ
    const queryQuestions = `
      SELECT 
        qb.id, 
        qb.content, 
        qb.session_type, 
        qb.difficulty, 
        s.code AS skill_code, 
        l.rank AS rank
      FROM public.question_bank qb
      JOIN public.question_bank_skill_levels qbsl ON qb.id = qbsl.question_bank_id
      JOIN public.skill_levels sl ON qbsl.skill_level_id = sl.id
      JOIN public.skills s ON sl.skill_id = s.id
      JOIN public.levels l ON sl.level_id = l.id
      ORDER BY qb.created_at ASC;
    `;

    const res = await client.query(queryQuestions);
    const questions: QuestionRecord[] = res.rows;
    console.log(`Tìm thấy ${questions.length} câu hỏi cần làm giàu.`);

    if (questions.length === 0) {
      throw new Error('Không tìm thấy câu hỏi nào trong question_bank!');
    }

    let updatedQuestionsCount = 0;
    let insertedCriteriaCount = 0;

    for (const q of questions) {
      const onetSoc = resolveOnetSocCode(q.session_type, q.skill_code);
      const sfiaSkill = q.skill_code;
      const targetLevel = q.rank;

      // 2. Update QuestionBank: onet_soc_code, sfia_skill_code, target_sfia_level
      await client.query(
        `
        UPDATE public.question_bank
        SET 
          onet_soc_code = $1,
          sfia_skill_code = $2,
          target_sfia_level = $3,
          updated_at = NOW()
        WHERE id = $4;
      `,
        [onetSoc, sfiaSkill, targetLevel, q.id],
      );
      updatedQuestionsCount++;

      // 3. Xóa criteria cũ nếu có (idempotent)
      await client.query(
        `DELETE FROM public.question_criteria WHERE question_bank_id = $1;`,
        [q.id],
      );

      // 4. Sinh 2 tiêu chí nhị phân (core + seniority)
      const criteriaList = generateCriteria(
        q.session_type,
        q.content,
        sfiaSkill,
        targetLevel,
      );

      for (const crit of criteriaList) {
        await client.query(
          `
          INSERT INTO public.question_criteria (
            question_bank_id,
            criteria_text,
            dimension,
            weight,
            order_index,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW());
        `,
          [
            q.id,
            crit.criteriaText,
            crit.dimension,
            crit.weight,
            crit.orderIndex,
          ],
        );
        insertedCriteriaCount++;
      }
    }

    await client.query('COMMIT');
    console.log('--- ENRICH QUESTION BANK THÀNH CÔNG ---');
    console.log(`Số câu hỏi đã cập nhật nhãn O*NET & SFIA: ${updatedQuestionsCount}`);
    console.log(`Số tiêu chí nhị phân đã tạo mới: ${insertedCriteriaCount}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('ĐÃ XẢY RA LỖI, ROLLBACK TRANSACTION:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
