import { Test, TestingModule } from '@nestjs/testing';
import { PrepFacade } from './prep-facade.service';
import {
  QuestionCriteriaService,
  type SessionQuestionWithCriteria,
} from '../question-criteria/question-criteria.service';

describe('PrepFacade', () => {
  let facade: PrepFacade;
  let questionCriteriaService: jest.Mocked<QuestionCriteriaService>;

  beforeEach(async () => {
    questionCriteriaService = {
      codesFromQuestionBank: jest.fn(),
      codesFromSessionQuestion: jest.fn(),
      buildSessionQuestionCriteriaData: jest.fn(),
    } as unknown as jest.Mocked<QuestionCriteriaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrepFacade,
        {
          provide: QuestionCriteriaService,
          useValue: questionCriteriaService,
        },
      ],
    }).compile();

    facade = module.get<PrepFacade>(PrepFacade);
  });

  it('delegates codesFromQuestionBank to QuestionCriteriaService', () => {
    questionCriteriaService.codesFromQuestionBank.mockReturnValue(['D1', 'D2']);

    const question = { id: 'q-1', contextPackId: 'VN' };
    const result = facade.codesFromQuestionBank(question, 'v-1');

    expect(questionCriteriaService.codesFromQuestionBank).toHaveBeenCalledWith(
      question,
      'v-1',
    );
    expect(result).toEqual(['D1', 'D2']);
  });

  it('delegates codesFromSessionQuestion to QuestionCriteriaService', () => {
    questionCriteriaService.codesFromSessionQuestion.mockReturnValue(['TD1']);

    const question: SessionQuestionWithCriteria = {
      id: 'sq-1',
      questionText: 'What is polymorphism?',
      questionCategory: 'technical',
    };
    const result = facade.codesFromSessionQuestion(question);

    expect(
      questionCriteriaService.codesFromSessionQuestion,
    ).toHaveBeenCalledWith(question);
    expect(result).toEqual(['TD1']);
  });

  it('delegates buildSessionQuestionCriteriaData to QuestionCriteriaService', async () => {
    const mockOutput = [
      { sessionQuestionId: 'sq-1', criteriaId: 'lvl-1' },
    ];
    questionCriteriaService.buildSessionQuestionCriteriaData.mockResolvedValue(
      mockOutput,
    );

    const input = {
      sessionQuestionId: 'sq-1',
      rubricVersionId: 'v-1',
      criterionCodes: ['TD1'],
    };
    const result = await facade.buildSessionQuestionCriteriaData(input);

    expect(
      questionCriteriaService.buildSessionQuestionCriteriaData,
    ).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockOutput);
  });
});
