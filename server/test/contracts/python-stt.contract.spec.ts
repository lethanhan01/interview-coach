import * as fs from 'fs';
import * as path from 'path';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { TranscribeResponseDto } from '../../src/modules/media/dto/transcribe-response.dto';

describe('Python STT Wire Contract Conformance Test', () => {
  it('should successfully deserialize and validate stt-response.fixture.json without schema drift', async () => {
    const fixturePath = path.resolve(
      __dirname,
      '../../../contracts/fixtures/stt-response.fixture.json',
    );
    const rawFixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // Chuyển đổi JSON thuần sang TypeScript DTO instance
    const dtoInstance = plainToInstance(TranscribeResponseDto, rawFixture);

    // Xác thực decorators (class-validator) không ném lỗi
    await expect(validateOrReject(dtoInstance)).resolves.not.toThrow();

    // Đối chiếu tính chính xác của dữ liệu
    expect(dtoInstance.text).toBe(rawFixture.text);
    expect(dtoInstance.language).toBe(rawFixture.language);
    expect(dtoInstance.durationSeconds).toBe(rawFixture.durationSeconds);
    expect(dtoInstance.metrics.wpm).toBe(rawFixture.metrics.wpm);
    expect(dtoInstance.metrics.fillerWordCount).toBe(
      rawFixture.metrics.fillerWordCount,
    );
    expect(dtoInstance.metrics.fillerWords).toEqual(
      rawFixture.metrics.fillerWords,
    );
    expect(dtoInstance.metrics.pauseCount).toBe(rawFixture.metrics.pauseCount);
    expect(dtoInstance.metrics.totalPauseDurationSeconds).toBe(
      rawFixture.metrics.totalPauseDurationSeconds,
    );
    expect(dtoInstance.metrics.speechDurationSeconds).toBe(
      rawFixture.metrics.speechDurationSeconds,
    );
    expect(dtoInstance.metrics.confidenceScore).toBe(
      rawFixture.metrics.confidenceScore,
    );
    expect(dtoInstance.words?.[0].word).toBe(rawFixture.words[0].word);
  });
});
