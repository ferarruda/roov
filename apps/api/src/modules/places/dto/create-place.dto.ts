import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PlaceCategory } from '@prisma/client';
import { PlaceHoursDto } from './place-hours.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePlaceDto {
  @Transform(trim)
  @IsString()
  @Length(2, 120, { message: 'Nome deve ter entre 2 e 120 caracteres.' })
  name!: string;

  @IsEnum(PlaceCategory, { message: 'Categoria inválida.' })
  category!: PlaceCategory;

  @Transform(trim)
  @IsString()
  @Length(2, 60, { message: 'Tipo do lugar deve ter entre 2 e 60 caracteres.' })
  placeType!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  neighborhood!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  city!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  state!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 100)
  country!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Cada foto deve ser uma URL válida.' })
  photos?: string[];

  /** 1 ($) a 4 ($$$$) — mesma escala do frontend (`PRICE_RANGES`). */
  @IsInt()
  @Min(1)
  @Max(4)
  priceRange!: number;

  @ValidateNested()
  @Type(() => PlaceHoursDto)
  hours!: PlaceHoursDto;
}
