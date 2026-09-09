import { IsArray, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

/**
 * `{ open, close, closedOn? }` — um par diário só, não por dia da semana.
 * Espelha exatamente o formato de `domain/types.js` do frontend.
 */
export class PlaceHoursDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Horário deve estar no formato HH:MM.' })
  open!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Horário deve estar no formato HH:MM.' })
  close!: string;

  /** Dias da semana fechados — 0 (domingo) a 6 (sábado), igual `Date#getDay()`. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  closedOn?: number[];
}
