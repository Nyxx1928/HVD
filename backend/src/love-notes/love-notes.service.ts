import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoveNoteDto } from './dto/create-love-note.dto';
import { LoveNote } from '@prisma/client';

@Injectable()
export class LoveNotesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all love notes from the database.
   * Returns up to 100 notes ordered by created_at descending (newest first).
   *
   * @returns Array of love notes
   * @throws InternalServerErrorException if database operation fails
   */
  async findAll(): Promise<LoveNote[]> {
    try {
      return await this.prisma.loveNote.findMany({
        take: 100,
        orderBy: {
          created_at: 'desc',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve love notes');
    }
  }

  /**
   * Creates a new love note with the provided data.
   * Applies default values for emoji (💗) and color (rose) if not provided.
   *
   * @param data - The love note data from the validated DTO
   * @returns The created love note with generated ID and timestamp
   * @throws InternalServerErrorException if database operation fails
   */
  async create(data: CreateLoveNoteDto): Promise<LoveNote> {
    try {
      return await this.prisma.loveNote.create({
        data: {
          name: data.name,
          message: data.message,
          emoji: data.emoji || '💗',
          color: data.color || 'rose',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create love note');
    }
  }
}
