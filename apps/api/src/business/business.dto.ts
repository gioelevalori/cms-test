import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CATEGORIES } from '@cms/shared';

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export class CreateBusinessDto {
  @IsString() @MaxLength(120) name: string;
  @Matches(/^[a-z0-9-]{2,60}$/, { message: 'Lo slug può contenere solo lettere minuscole, numeri e trattini' })
  slug: string;
  @IsOptional() @IsIn(CATEGORY_IDS, { message: 'Tipo di attività non valido' }) category?: string;
}

export class SetCategoryDto {
  @IsIn(CATEGORY_IDS, { message: 'Tipo di attività non valido' }) category: string;
}
