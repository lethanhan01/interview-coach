import { Test, TestingModule } from '@nestjs/testing';
import { OnetController } from './onet.controller';
import { OnetService } from './onet.service';
import { OnetOccupationDto, OnetTechDto } from './contracts/onet.dto';
import { JwtAuthGuard } from '@core/common/guards';

describe('OnetController', () => {
  let controller: OnetController;
  let service: OnetService;

  const mockOccupations: OnetOccupationDto[] = [
    {
      socCode: '15-1252.00',
      title: 'Software Developers',
      description: 'Design and develop software',
      matchedTitle: 'Software Developers',
      similarityScore: 1.0,
    },
  ];

  const mockTech: OnetTechDto[] = [
    {
      example: 'Node.js',
      isHotTechnology: true,
      inDemand: true,
    },
  ];

  beforeEach(async () => {
    const mockOnetService = {
      searchOccupations: jest.fn().mockResolvedValue(mockOccupations),
      searchTechnologies: jest.fn().mockResolvedValue(mockTech),
      getToolsAndTechnology: jest.fn().mockResolvedValue(mockTech),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnetController],
      providers: [
        {
          provide: OnetService,
          useValue: mockOnetService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OnetController>(OnetController);
    service = module.get<OnetService>(OnetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /onet/occupations', () => {
    it('calls onetService.searchOccupations with query and limit', async () => {
      const searchSpy = jest.spyOn(service, 'searchOccupations');
      const result = await controller.searchOccupations({
        query: 'developer',
        limit: 5,
      });

      expect(searchSpy).toHaveBeenCalledWith('developer', 5);
      expect(result).toEqual(mockOccupations);
    });

    it('calls onetService.searchOccupations with undefined query and default limit', async () => {
      const searchSpy = jest.spyOn(service, 'searchOccupations');
      const result = await controller.searchOccupations({});

      expect(searchSpy).toHaveBeenCalledWith(undefined, 10);
      expect(result).toEqual(mockOccupations);
    });
  });

  describe('GET /onet/technologies', () => {
    it('calls onetService.searchTechnologies with query and limit', async () => {
      const searchTechSpy = jest.spyOn(service, 'searchTechnologies');
      const result = await controller.searchTechnologies({
        query: 'Node',
        limit: 15,
      });

      expect(searchTechSpy).toHaveBeenCalledWith('Node', 15);
      expect(result).toEqual(mockTech);
    });

    it('calls onetService.searchTechnologies with undefined query and default limit 30', async () => {
      const searchTechSpy = jest.spyOn(service, 'searchTechnologies');
      const result = await controller.searchTechnologies({});

      expect(searchTechSpy).toHaveBeenCalledWith(undefined, 30);
      expect(result).toEqual(mockTech);
    });
  });

  describe('GET /onet/occupations/:socCode/tech', () => {
    it('calls onetService.getToolsAndTechnology with socCode', async () => {
      const techSpy = jest.spyOn(service, 'getToolsAndTechnology');
      const result = await controller.getToolsAndTechnology({
        socCode: '15-1252.00',
      });

      expect(techSpy).toHaveBeenCalledWith('15-1252.00');
      expect(result).toEqual(mockTech);
    });
  });
});
