import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { TtsService } from './tts.service';

@ApiTags('tts')
@Controller('tts')
export class TtsController {
  private readonly logger = new Logger(TtsController.name);

  constructor(private readonly tts: TtsService) {}

  @Get('speak')
  @ApiOperation({ summary: 'Synthesize Serbian speech and return MP3 audio' })
  @ApiQuery({ name: 'text', required: true, description: 'Text to speak (max 250 chars)' })
  async speak(@Query('text') text: string, @Res() res: Response) {
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text query parameter is required' });
    }

    try {
      const audio = await this.tts.synthesize(text);
      this.logger.debug(`synthesized: "${text.slice(0, 40)}"`);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.length,
      });
      res.send(audio);
    } catch (error) {
      this.logger.error('TTS synthesis failed', error);
      res.status(500).json({ error: 'TTS synthesis failed' });
    }
  }
}
