import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all comments for a specific love note.
   * Returns up to 50 comments ordered by created_at ascending (oldest first).
   *
   * @param noteId - The UUID of the love note
   * @returns Array of comments for the specified note
   * @throws InternalServerErrorException if database operation fails
   */
  async findAllByNoteId(noteId: string): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: {
          note_id: noteId,
        },
        take: 50,
        orderBy: {
          created_at: 'asc',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve comments');
    }
  }

  /**
   * Creates a new comment for a specific love note.
   * Validates that the note_id exists before creating the comment.
   *
   * @param noteId - The UUID of the love note to comment on
   * @param data - The comment data from the validated DTO
   * @returns The created comment with generated ID and timestamp
   * @throws NotFoundException if the note_id does not exist
   * @throws InternalServerErrorException if database operation fails
   */
  async create(noteId: string, data: CreateCommentDto): Promise<Comment> {
    try {
      return await this.prisma.comment.create({
        data: {
          note_id: noteId,
          name: data.name,
          comment: data.comment,
        },
      });
    } catch (error) {
      // Check if error is due to foreign key constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException(`Love note with ID ${noteId} not found`);
      }
      throw new InternalServerErrorException('Failed to create comment');
    }
  }
}
