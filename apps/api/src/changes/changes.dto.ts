import { ArrayMaxSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @IsString() @MinLength(2) @MaxLength(2000) message: string;
}

export class DirectChangeDto {
  @IsArray() @ArrayMaxSize(100) ops: unknown[];
}
