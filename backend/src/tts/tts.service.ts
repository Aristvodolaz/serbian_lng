import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { textToSpeech } from '@google-cloud/text-to-speech/build/src/v1/text-to-speech-client';

const MAX_CHARS = 250;

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly client: textToSpeech.TextToSpeechClient;

  constructor(private readonly config: ConfigService) {
    this.client = new textToSpeech.TextToSpeechClient();
  }

  async synthesize(text: string): Promise<Buffer> {
    if (text.length > MAX_CHARS) {
      throw new BadRequestException(`Text exceeds ${MAX_CHARS} character limit`);
    }

    const voice = {
      languageCode: 'sr-Latn',
      name: this.config.get('TTS_VOICE_NAME') ?? 'sr-Latn-standard',
      ssmlGender: 'NEUTRAL' as const,
    };

    const [response] = await this.client.synthesizeSpeech({
      input: { text: text.trim() },
      voice,
      audioConfig: { audioEncoding: 'MP3' },
    });

    if (!response.audioContent) {
      throw new Error('TTS returned empty audio');
    }

    return Buffer.from(response.audioContent);
  }
}
