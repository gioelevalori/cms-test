import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString() @MaxLength(120) name: string;
  @Matches(/^[a-z0-9-]{2,60}$/, { message: 'Lo slug può contenere solo lettere minuscole, numeri e trattini' })
  slug: string;
  @IsOptional() @IsString() @MaxLength(60) category?: string;
}
