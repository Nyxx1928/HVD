import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateLoveNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  @Transform(({ value }) => value?.trim())
  message: string;

  @IsString()
  @IsOptional()
  @IsIn(['💗', '💘', '💝', '🌹', '✨'])
  emoji?: string;

  @IsString()
  @IsOptional()
  @IsIn(['rose', 'pink', 'red', 'coral', 'lilac'])
  color?: string;
}
