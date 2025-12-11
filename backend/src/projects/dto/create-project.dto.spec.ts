import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto, ProjectSettingsDto } from './create-project.dto';

describe('CreateProjectDto', () => {
  describe('title validation', () => {
    it('should pass with valid title', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: 'Valid Project Title',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail if title is too short', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: 'ab',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail if title is too long', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: 'a'.repeat(101),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail if title is empty', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should trim whitespace from title', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: '  Valid Title  ',
      });
      expect(dto.title).toBe('Valid Title');
    });
  });

  describe('settings validation', () => {
    it('should pass with valid settings', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: 'Project',
        settings: {
          productName: 'Product',
          description: 'Description',
          usps: ['USP 1', 'USP 2'],
          aspectRatio: '16:9',
          musicTheme: 'energetic',
        },
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass without settings', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: 'Project',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate nested settings object', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        title: 'Project',
        settings: {
          productName: 'a'.repeat(101), // Too long
        },
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('ProjectSettingsDto', () => {
  describe('productName validation', () => {
    it('should pass with valid productName', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        productName: 'Valid Product',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail if productName is too long', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        productName: 'a'.repeat(101),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should trim whitespace from productName', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        productName: '  Product  ',
      });
      expect(dto.productName).toBe('Product');
    });
  });

  describe('usps validation', () => {
    it('should pass with valid usps array', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        usps: ['USP 1', 'USP 2', 'USP 3'],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail if usps array is empty', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        usps: [],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('should fail if usps array has too many items', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        usps: Array(11).fill('USP'),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
    });

    it('should fail if USP item is too long', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        usps: ['a'.repeat(201)],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('mainImage validation', () => {
    it('should pass with valid URL', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        mainImage: 'https://example.com/image.jpg',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without protocol', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        mainImage: 'example.com/image.jpg',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isUrl');
    });

    it('should fail if URL is too long', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        mainImage: 'https://example.com/' + 'a'.repeat(2048),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('aspectRatio validation', () => {
    it('should pass with valid aspect ratio', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        aspectRatio: '16:9',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid aspect ratio', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        aspectRatio: '4:3' as any,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isIn');
    });
  });

  describe('musicTheme validation', () => {
    it('should pass with valid music theme', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        musicTheme: 'energetic',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid music theme', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        musicTheme: 'invalid' as any,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isIn');
    });
  });

  describe('ttsEnabled validation', () => {
    it('should pass with boolean value', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        ttsEnabled: true,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with non-boolean value', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        ttsEnabled: 'true' as any,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });
  });

  describe('ttsVoice validation', () => {
    it('should pass with valid voice', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        ttsVoice: 'ermil',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid voice', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        ttsVoice: 'invalid' as any,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isIn');
    });
  });

  describe('activeSceneAssetId validation', () => {
    it('should pass with valid UUID v4', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        activeSceneAssetId: '550e8400-e29b-41d4-a716-446655440000',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid UUID', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        activeSceneAssetId: 'not-a-uuid',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });
  });

  describe('prompt and text fields validation', () => {
    it('should trim whitespace from prompt', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        prompt: '  Animation prompt  ',
      });
      expect(dto.prompt).toBe('Animation prompt');
    });

    it('should trim whitespace from scenePrompt', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        scenePrompt: '  Scene prompt  ',
      });
      expect(dto.scenePrompt).toBe('Scene prompt');
    });

    it('should trim whitespace from ttsText', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        ttsText: '  TTS text  ',
      });
      expect(dto.ttsText).toBe('TTS text');
    });

    it('should fail if prompt exceeds max length', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        prompt: 'a'.repeat(501),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail if scenePrompt exceeds max length', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        scenePrompt: 'a'.repeat(1001),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail if ttsText exceeds max length', async () => {
      const dto = plainToInstance(ProjectSettingsDto, {
        ttsText: 'a'.repeat(501),
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });
  });
});
