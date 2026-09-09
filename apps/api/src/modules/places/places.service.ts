import { Injectable } from '@nestjs/common';
import type { Place } from '@prisma/client';
import { AppException } from '../../common/errors/app.exception';
import { PlacesRepository, type PlaceCursor } from './places.repository';
import type { CreatePlaceDto } from './dto/create-place.dto';
import type { UpdatePlaceDto } from './dto/update-place.dto';
import type { ListPlacesQueryDto } from './dto/list-places.query.dto';

export interface PublicPlaceHours {
  open: string;
  close: string;
  closedOn?: number[];
}

export interface PublicPlace {
  id: string;
  name: string;
  category: Place['category'];
  placeType: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  photos: string[];
  priceRange: number;
  hours: PublicPlaceHours;
  status: Place['status'];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlacesPage {
  data: PublicPlace[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

/** Mesma ideia de `toPublicUser`: lista explícita, não o registro cru do Prisma. */
export function toPublicPlace(place: Place): PublicPlace {
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    placeType: place.placeType,
    neighborhood: place.neighborhood,
    city: place.city,
    state: place.state,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
    photos: place.photos,
    priceRange: place.priceRange,
    hours: place.hours as unknown as PublicPlaceHours,
    status: place.status,
    createdById: place.createdById,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
  };
}

function encodeCursor(cursor: PlaceCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/** Cursor é opaco pro cliente — qualquer forma malformada é `INVALID_CURSOR`. */
function decodeCursor(raw: string): PlaceCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as PlaceCursor).id !== 'string' ||
      typeof (parsed as { createdAt: unknown }).createdAt !== 'string'
    ) {
      throw new Error('shape');
    }
    const { id, createdAt } = parsed as { id: string; createdAt: string };
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) throw new Error('date');
    return { id, createdAt: date };
  } catch {
    throw AppException.invalidCursor();
  }
}

@Injectable()
export class PlacesService {
  constructor(private readonly places: PlacesRepository) {}

  async create(userId: string, dto: CreatePlaceDto): Promise<PublicPlace> {
    const place = await this.places.create({
      name: dto.name,
      category: dto.category,
      placeType: dto.placeType,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      latitude: dto.latitude,
      longitude: dto.longitude,
      photos: dto.photos,
      priceRange: dto.priceRange,
      hours: { ...dto.hours },
      createdById: userId,
    });
    return toPublicPlace(place);
  }

  async findById(id: string): Promise<PublicPlace> {
    const place = await this.places.findById(id);
    if (!place) {
      throw AppException.notFound('Lugar não encontrado.');
    }
    return toPublicPlace(place);
  }

  /**
   * Só quem cadastrou pode editar. Regra simples de propósito — permissões
   * por papel (moderador/admin) são Fase 8, não este corte.
   */
  async update(userId: string, id: string, dto: UpdatePlaceDto): Promise<PublicPlace> {
    const existing = await this.places.findById(id);
    if (!existing) {
      throw AppException.notFound('Lugar não encontrado.');
    }
    if (existing.createdById !== userId) {
      throw AppException.forbidden('Só quem cadastrou este lugar pode editá-lo.');
    }

    const updated = await this.places.update(id, {
      ...dto,
      hours: dto.hours ? { ...dto.hours } : undefined,
    });
    return toPublicPlace(updated);
  }

  async list(query: ListPlacesQueryDto): Promise<PlacesPage> {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;

    const rows = await this.places.findMany({ category: query.category, cursor, limit });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      data: page.map(toPublicPlace),
      meta: {
        hasMore,
        nextCursor: hasMore && last ? encodeCursor({ id: last.id, createdAt: last.createdAt }) : null,
      },
    };
  }
}
