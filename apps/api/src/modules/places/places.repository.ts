import { Injectable } from '@nestjs/common';
import { Prisma, type Place, type PlaceCategory, type PlaceStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface CreatePlaceData {
  name: string;
  category: PlaceCategory;
  placeType: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  photos?: string[];
  priceRange: number;
  hours: Prisma.InputJsonValue;
  createdById: string;
}

/** Todos os campos editáveis são opcionais — semântica de `PATCH`. */
export interface UpdatePlaceData {
  name?: string;
  category?: PlaceCategory;
  placeType?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  priceRange?: number;
  hours?: Prisma.InputJsonValue;
  status?: PlaceStatus;
}

export interface PlaceCursor {
  createdAt: Date;
  id: string;
}

export interface ListPlacesParams {
  category?: PlaceCategory;
  cursor?: PlaceCursor;
  /** Busca `limit + 1` por fora — ver `findMany`. */
  limit: number;
}

/**
 * Persistência de lugares.
 *
 * Consultas geoespaciais (busca por proximidade) **não** entram aqui — ver
 * D4 em `docs/FASE-1-DECISOES-TECNICAS.md`: `$queryRaw` isolado num
 * `PlacesGeoRepository` próprio, quando esse corte existir. Este repositório
 * é só CRUD comum via Prisma.
 *
 * Única camada do sistema autorizada a tocar o Prisma para esta entidade.
 */
@Injectable()
export class PlacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePlaceData): Promise<Place> {
    return this.prisma.place.create({ data });
  }

  findById(id: string): Promise<Place | null> {
    return this.prisma.place.findUnique({ where: { id } });
  }

  update(id: string, data: UpdatePlaceData): Promise<Place> {
    return this.prisma.place.update({ where: { id }, data });
  }

  /**
   * Paginação por cursor (`createdAt`, `id`) — ordenação decrescente com
   * `id` como desempate para estabilidade quando dois registros têm o mesmo
   * `createdAt`. Busca um registro a mais que o pedido para o service saber
   * `hasMore` sem uma contagem separada.
   */
  findMany({ category, cursor, limit }: ListPlacesParams): Promise<Place[]> {
    return this.prisma.place.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }
}
