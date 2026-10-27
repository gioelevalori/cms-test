import { IsIn, IsObject, IsOptional, IsString, Matches } from 'class-validator';

export class CreateSiteDto {
  @IsString() name: string;
  @Matches(/^[a-z0-9-]+$/, { message: 'Lo slug può contenere solo lettere minuscole, numeri e trattini' })
  slug: string;
  @IsOptional() @IsIn(['it', 'en']) locale?: string;
}

export class UpdateSiteDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsObject() theme?: Record<string, unknown>;
}
