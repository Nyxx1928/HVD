import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { LoveNotesService } from './love-notes.service';
import { CreateLoveNoteDto } from './dto/create-love-note.dto';
import { LoveNoteResponseDto } from './dto/love-note-response.dto';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';

@Controller('love-notes')
export class LoveNotesController {
  constructor(private readonly loveNotesService: LoveNotesService) {}

  /**
   * GET /love-notes
   * Retrieves all love notes ordered by creation date (newest first).
   *
   * @returns Array of love notes
   */
  @Get()
  async findAll(): Promise<LoveNoteResponseDto[]> {
    return await this.loveNotesService.findAll();
  }

  /**
   * POST /love-notes
   * Creates a new love note with validated data.
   * Returns 201 status on successful creation.
   * Rate limited to 5 requests per 60 seconds per IP.
   *
   * @param createLoveNoteDto - Validated love note data
   * @returns The created love note
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  async create(
    @Body() createLoveNoteDto: CreateLoveNoteDto,
  ): Promise<LoveNoteResponseDto> {
    return await this.loveNotesService.create(createLoveNoteDto);
  }
}
