import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PlaceCategory } from '@prisma/client';

export class ListPlacesQueryDto {
  @IsOptional()
  @IsEnum(PlaceCategory, { message: 'Categoria inválida.' })
  category?: PlaceCategory;

  /** Opaco: o cliente nunca deve interpretar ou construir este valor. */
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
