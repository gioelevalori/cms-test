import { IsArray, IsString, Matches } from 'class-validator';

export class CreatePageDto {
  @IsString() title: string;
  @Matches(/^[a-z0-9-]+$/, { message: 'Lo slug può contenere solo lettere minuscole, numeri e trattini' })
  slug: string;
}

export class SaveDraftDto {
  @IsArray() blocks: unknown[];
}
