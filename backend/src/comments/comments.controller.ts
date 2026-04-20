import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';

@Controller('love-notes/:noteId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * GET /love-notes/:noteId/comments
   * Retrieves all comments for a specific love note.
   * Returns up to 50 comments ordered by creation date (oldest first).
   *
   * @param noteId - UUID of the love note (validated by ParseUUIDPipe)
   * @returns Array of comments for the specified note
   */
  @Get()
  async findAll(
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ): Promise<CommentResponseDto[]> {
    return await this.commentsService.findAllByNoteId(noteId);
  }

  /**
   * POST /love-notes/:noteId/comments
   * Creates a new comment for a specific love note.
   * Returns 201 status on successful creation.
   * Returns 404 if the noteId does not exist.
   * Rate limited to 10 requests per 60 seconds per IP.
   *
   * @param noteId - UUID of the love note (validated by ParseUUIDPipe)
   * @param createCommentDto - Validated comment data
   * @returns The created comment
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  async create(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.create(noteId, createCommentDto);
  }
}
